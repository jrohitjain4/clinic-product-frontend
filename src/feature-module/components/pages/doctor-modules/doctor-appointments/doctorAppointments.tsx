import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import Datatable from "../../../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import { useClinicDepartments } from "../../../../../core/hooks/useClinicDepartments";
import AddPrescriptionModal from "../doctors-prescriptions/AddPrescriptionModal";
import {
  APPOINTMENT_STATUS_OPTIONS,
  statusBadgeClass
} from "../../../../../core/utils/appointmentForm";
import Modal from "./modal/modals";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { apiGet } from "../../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import AppointmentFormPage from "../../clinic-modules/appointment-form/appointmentFormPage";

const DoctorAppointments = () => {
  const { appointments: allAppts, loading, updateAppointmentStatus, refetch } = useClinicAppointments();
  const appointments = useMemo(() => {
    return allAppts.filter(a => a.appointmentType !== "therapy" && a.parentAppointmentId === null);
  }, [allAppts]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleStatusToggle = async (appointmentId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "Schedule") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Checked In";
    else if (currentStatus === "Checked In") nextStatus = "Checked Out";

    if (nextStatus) {
      setTogglingId(appointmentId);
      const startTime = Date.now();
      try {
        await updateAppointmentStatus(appointmentId, nextStatus);
        toast.success(`Status updated to ${nextStatus}`);
      } catch (err) {
        console.error("Error updating status:", err);
        toast.error("Failed to update status");
      } finally {
        const elapsedTime = Date.now() - startTime;
        const minDelay = 400; // minimum duration to let transition animate smoothly
        if (elapsedTime < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsedTime));
        }
        setTogglingId(null);
      }
    }
  };
  const { patients } = useClinicPatients();
  const { departments } = useClinicDepartments();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPatient, setFilterPatient] = useState("");
  const [datePreset, setDatePreset] = useState("All");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFollowUp, setFilterFollowUp] = useState("All");

  const { createPrescription } = usePrescriptions();
  const [showPresModal, setShowPresModal] = useState(false);
  const [selectedAppForPres, setSelectedAppForPres] = useState<any>(null);

  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<any>(null);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const res: any = await apiGet("/api/doctors/my-dashboard");
        if (res?.doctorDetails) {
          setDoctorDetails(res.doctorDetails);
        }
      } catch (err) {
        console.error("Failed to fetch doctor details", err);
      }
    };
    fetchDash();
  }, []);

  // Helper for profile images
  const getProfileImage = (img?: string | null) => {
    if (!img || img.trim() === "" || img.includes("placeholder") || img.includes("300x300")) {
      return "assets/img/patient-placeholder.png";
    }
    return resolveMediaUrl(img);
  };

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      schedule: appointments.filter(a => a.status === "Schedule").length,
      confirmed: appointments.filter(a => a.status === "Confirmed").length,
      checkedIn: appointments.filter(a => a.status === "Checked In").length,
      checkedOut: appointments.filter(a => a.status === "Checked Out").length,
      cancelled: appointments.filter(a => a.status === "Cancelled").length,
    };
  }, [appointments]);

  const filteredData = useMemo(() => {
    // Group all appointments by doctor, date, and slot time to determine queue ranks
    const groups: Record<string, any[]> = {};
    const sortedAppts = [...appointments].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createA !== createB) return createA - createB;
      return (a.id || "").localeCompare(b.id || "");
    });

    sortedAppts.forEach((a) => {
      const dateStr = dayjs(a.scheduledAt).format("YYYY-MM-DD");
      const timeStr = dayjs(a.scheduledAt).format("HH:mm");
      const key = `${a.doctorId}_${dateStr}_${timeStr}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(a);
    });

    const list = appointments
      .filter((a) => {
        const matchStatus = filterStatus === "All" || a.status === filterStatus;
        const matchPatient = filterPatient
          ? (a.patient?.firstName?.toLowerCase().includes(filterPatient.toLowerCase()) ||
            a.patient?.lastName?.toLowerCase().includes(filterPatient.toLowerCase()) ||
            a.patientName?.toLowerCase().includes(filterPatient.toLowerCase()))
          : true;
        let matchDate = true;
        const rowDate = dayjs(a.scheduledAt);
        if (datePreset === "Today") {
          matchDate = rowDate.isSame(dayjs(), 'day');
        } else if (datePreset === "Yesterday") {
          matchDate = rowDate.isSame(dayjs().subtract(1, 'day'), 'day');
        } else if (datePreset === "Last 7 Days") {
          matchDate = rowDate.isAfter(dayjs().subtract(7, 'day'));
        } else if (datePreset === "Custom") {
          const rowDateStr = rowDate.format("YYYY-MM-DD");
          if (filterStartDate && filterEndDate) {
            matchDate = rowDateStr >= filterStartDate && rowDateStr <= filterEndDate;
          } else if (filterStartDate) {
            matchDate = rowDateStr >= filterStartDate;
          } else if (filterEndDate) {
            matchDate = rowDateStr <= filterEndDate;
          }
        }

        const matchSearch = searchText
          ? (a.patientName?.toLowerCase().includes(searchText.toLowerCase()) ||
            a.appointmentCode?.toLowerCase().includes(searchText.toLowerCase()))
          : true;
        const matchType = filterType
          ? a.mode === filterType
          : true;
        const matchFollowUp = filterFollowUp === "All"
          ? true
          : filterFollowUp === "Fresh"
            ? !a.isFollowUp
            : filterFollowUp === "FollowUp"
              ? a.isFollowUp
              : a.followUpStatus === filterFollowUp;

        return matchStatus && matchPatient && matchDate && matchSearch && matchType && matchFollowUp;
      })
      .map((app, index) => {
        const dateStr = dayjs(app.scheduledAt).format("YYYY-MM-DD");
        const timeStr = dayjs(app.scheduledAt).format("HH:mm");
        const key = `${app.doctorId}_${dateStr}_${timeStr}`;
        const group = groups[key] || [];

        const indexInGroup = group.findIndex((item) => item.id === app.id);
        const queueNo = indexInGroup !== -1 ? indexInGroup + 1 : 1;

        const slotStartTime = dayjs(app.scheduledAt);
        const expectedTime = indexInGroup !== -1
          ? slotStartTime.add(indexInGroup * 15, "minute").format("hh:mm A")
          : slotStartTime.format("hh:mm A");

        const checkinsBefore = indexInGroup !== -1
          ? group.slice(0, indexInGroup).filter((item) => ["Checked In", "Checked Out"].includes(item.status)).length
          : 0;

        const checkinHisNo = `${checkinsBefore} / ${queueNo}`;

        return {
          key: app.id,
          id: app.id,
          SrNo: index + 1,
          checkinHisNo,
          queueNo,
          expectedTime,
          Date_Time: app.dateTimeLabel,
          Patient: app.patientName,
          img: getProfileImage(app.patient?.profileImage),
          phone_number: app.patient?.phone || "",
          Mode: app.mode,
          Status: app.status,
          _raw: app
        };
      });

    const isDateFilterActive = datePreset !== "All" || filterStartDate !== "" || filterEndDate !== "";
    if (isDateFilterActive) {
      return [...list].sort((a, b) => {
        const timeA = dayjs(a._raw.scheduledAt).valueOf();
        const timeB = dayjs(b._raw.scheduledAt).valueOf();
        if (timeA !== timeB) return timeA - timeB;
        return (a.queueNo || 1) - (b.queueNo || 1);
      });
    }

    return list;
  }, [appointments, filterStatus, filterPatient, datePreset, filterStartDate, filterEndDate, searchText, filterType, filterFollowUp]);

  const isAnyFilterActive = useMemo(() => {
    return (
      (filterStatus !== "All" && filterStatus !== "") ||
      datePreset !== "All" ||
      filterStartDate !== "" ||
      filterEndDate !== "" ||
      (filterFollowUp !== "All" && filterFollowUp !== "") ||
      filterType !== "" ||
      filterPatient !== "" ||
      searchText !== ""
    );
  }, [filterStatus, datePreset, filterStartDate, filterEndDate, filterFollowUp, filterType, filterPatient, searchText]);

  const handleClearFilters = () => {
    setFilterPatient("");
    setDatePreset("All");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterStatus("All");
    setFilterType("");
    setFilterFollowUp("All");
    setSearchText("");
  };

  const handlePresSubmit = async (data: any) => {
    try {
      await createPrescription(data);
      setShowPresModal(false);
      toast.success("Prescription created successfully");
    } catch (error) {
      toast.error("Failed to create prescription");
    }
  };

  const columns = [
    {
      title: "Sr / Queue",
      dataIndex: "SrNo",
      render: (text: number, record: any) => {
        const isSlotBooking = !!(record._raw.doctor?.appointmentDuration && record._raw.doctor?.maxBookingsPerSlot);
        return (
          <span className="text-black fw-bold">
            {text} / <span className="text-black fw-bold">{isSlotBooking ? "Slot" : record.checkinHisNo}</span>
          </span>
        );
      },
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Appointment ID",
      dataIndex: "id",
      render: (text: string, record: any) => (
        <span className="text-black fw-bold">#{record._raw.appointmentCode || text?.slice(-6).toUpperCase()}</span>
      ),
      sorter: (a: any, b: any) => (a._raw.appointmentCode || "").localeCompare(b._raw.appointmentCode || ""),
    },
    {
      title: "Expected Time",
      dataIndex: "expectedTime",
      render: (text: string) => <span className="fw-bold text-black">{text}</span>,
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      render: (text: string) => {
        const parts = text.split(" - ");
        const date = parts[0] || text;
        const time = parts[1] || "";
        return (
          <div className="d-flex flex-column align-items-start">
            <span className="text-black fw-bold mb-0" style={{ fontSize: '13px' }}>{date}</span>
            {time && <span className="text-black fw-semibold fs-11" style={{ marginTop: '2px' }}>{time}</span>}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.doctorspatientdetails} className="avatar avatar-md me-2">
            {record.img.startsWith("http") || record.img.startsWith("/") || record.img.startsWith("assets") ? (
              <img
                src={record.img.startsWith("assets") ? `${window.location.host.includes('localhost') ? '' : ''}/${record.img}` : record.img}
                alt="patient"
                className="rounded-circle"
                onError={(e: any) => { e.target.src = "assets/img/patient-placeholder.png"; }}
              />
            ) : (
              <ImageWithBasePath
                src={record.img}
                alt="patient"
                className="rounded-circle"
              />
            )}
          </Link>
          <div>
            <Link to={all_routes.doctorspatientdetails} className="fw-bold text-black d-block mb-0">{text}</Link>
            <span className="text-black fs-11 d-block fw-semibold">{record.phone_number}</span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      render: (text: string) => (
        <span className="fw-bold text-black small">{text}</span>
      ),
      sorter: (a: any, b: any) => a.Mode.localeCompare(b.Mode),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => {
        const raw = record._raw;
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge ${statusBadgeClass(text)} px-2 py-1 text-uppercase`} style={{ fontSize: '10px' }}>
              {text}
            </span>
            {["Schedule", "Confirmed", "Checked In"].includes(text) && (
              <div className="form-check form-switch p-0 ms-1 mt-1" style={{ minHeight: 'auto' }}>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  checked={togglingId === raw.id}
                  onChange={() => handleStatusToggle(raw.id, text)}
                  style={{ cursor: 'pointer', width: '30px', height: '16px' }}
                />
                <label className="text-black fw-bold small ms-1" style={{ fontSize: '10px' }}>
                  {text === "Schedule" ? "Confirm" : text === "Confirmed" ? "Checkin" : "Checkout"}
                </label>
              </div>
            )}
            {raw?.isFollowUp && (
              <div className="d-flex flex-column gap-1 mt-1">
                <span className={`badge fs-10 px-2 py-1 ${raw.paymentStatus === "Free" ? "badge-soft-success text-success" : "badge-soft-info text-info border-info-subtle"}`} style={{ border: '1px solid currentColor', opacity: 0.85 }}>
                  {raw.followUpStatus || "Follow-up"} ({raw.paymentStatus || "Unpaid"})
                </span>
                {raw?.parentAppointmentId && (
                  <div className="d-flex align-items-center gap-1 text-muted ms-1" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    <i className="ti ti-link" /> Linked Visit
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          {/* Quick Add Prescription */}
          <Link
            to="#"
            className="text-primary p-1"
            title="Add Prescription"
            onClick={() => {
              setSelectedAppForPres(record._raw);
              setShowPresModal(true);
            }}
          >
            <i className="ti ti-file-plus fs-18" />
          </Link>

          {/* View Details */}
          <Link
            to={all_routes.doctorsappointmentdetails.replace(":id", record.id)}
            className="text-info p-1"
            title="View Details"
          >
            <i className="ti ti-eye fs-18" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper d-flex flex-column" style={{ minHeight: '100vh' }}>
        <div className="content flex-grow-1">
          {/* Header with Filters - Cloned from Admin Design */}
          <div className="d-flex align-items-center pb-3 mb-4 border-bottom flex-wrap appointment-header" style={{ minWidth: 0 }}>
            <h3 className="fw-bolder mb-0 flex-shrink-0 text-dark" style={{ fontSize: '20px' }}>Appointment</h3>
            
            {["All", "Schedule", "Confirmed", "Checked In", "Checked Out"].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "All") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-3 fs-13 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                onClick={() => setFilterStatus(s)}
                style={{ borderRadius: '8px', height: '38px' }}
              >
                {s === "Checked Out" ? "Check-out" : s === "Checked In" ? "Check-in" : s}
                <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "All") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                  {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Checked In" ? counts.checkedIn : s === "Checked Out" ? counts.checkedOut : counts.all}
                </span>
              </button>
            ))}

            {isAnyFilterActive ? (
              <button
                className="btn btn-sm btn-soft-danger d-flex align-items-center gap-2 fw-bold fs-13 flex-shrink-0 shadow-sm"
                onClick={handleClearFilters}
                style={{ height: '38px', borderRadius: '8px' }}
              >
                <i className="ti ti-refresh fs-14" /> Clear
              </button>
            ) : (
              <button
                className="btn btn-sm btn-light border d-flex align-items-center gap-2 fw-bold fs-13 flex-shrink-0 shadow-sm bg-white"
                style={{ height: '38px', borderRadius: '8px' }}
                data-bs-toggle="offcanvas"
                data-bs-target="#filter_drawer"
              >
                <i className="ti ti-filter fs-14" /> Filters
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center fw-semibold flex-shrink-0 shadow-sm text-white"
              onClick={() => setShowAddAppointment(true)}
              style={{ borderRadius: '8px', fontSize: '13px', height: '38px', backgroundColor: '#3b82f6', borderColor: '#3b82f6', paddingLeft: '16px', paddingRight: '16px' }}
            >
              New Appointment <i className="ti ti-plus ms-2" />
            </button>
          </div>

          {/* Table Content - Premium HRM Style */}
          <div className="mb-4">
            <div className="p-0">
              <style>{`
                .appointment-header {
                  gap: 16px;
                  flex-wrap: nowrap !important;
                }
                @media (max-width: 991px) {
                  .appointment-header {
                    flex-wrap: wrap !important;
                  }
                }
                 @media (max-width: 1400px) {
                  .appointment-header {
                    gap: 8px !important;
                  }
                  .appointment-header h3 {
                    font-size: 18px !important;
                  }
                  .appointment-header button.btn,
                  .appointment-header .btn {
                    padding-top: 4px !important;
                    padding-bottom: 4px !important;
                    padding-left: 6px !important;
                    padding-right: 6px !important;
                    font-size: 11px !important;
                    height: 32px !important;
                  }
                  .appointment-header .btn .badge {
                    margin-left: 2px !important;
                  }
                }
                @media (max-width: 1200px) {
                  .appointment-header {
                    gap: 5px !important;
                  }
                  .appointment-header h3 {
                    font-size: 15px !important;
                  }
                  .appointment-header button.btn,
                  .appointment-header .btn {
                    padding-top: 3px !important;
                    padding-bottom: 3px !important;
                    padding-left: 5px !important;
                    padding-right: 5px !important;
                    font-size: 9.5px !important;
                    height: 30px !important;
                  }
                  .appointment-header .btn i {
                    margin-right: 2px !important;
                  }
                  .appointment-header .btn .badge {
                    font-size: 8.5px !important;
                    margin-left: 2px !important;
                    padding: 1px 3px !important;
                  }
                }
                .custom-table .ant-table { background: transparent; border: 0 !important; }
                .custom-table .ant-table-container { border: 0 !important; }
                .custom-table .ant-table-thead > tr > th { 
                  background: #f8fafc !important; 
                  color: #475569 !important; 
                  font-weight: 700 !important; 
                  text-transform: uppercase; 
                  font-size: 11px; 
                  letter-spacing: 0.5px;
                  border-bottom: 1px solid #e2e8f0 !important;
                }
                .custom-table .ant-table-tbody > tr > td { 
                  padding: 16px 12px !important; 
                  border-bottom: 1px solid #f1f5f9 !important;
                }
                .custom-table .ant-table-tbody > tr:last-child > td {
                  border-bottom: 0 !important;
                }
                .custom-table .ant-table-tbody > tr:hover > td { 
                  background: #f8fafc !important; 
                }
                .custom-table .ant-pagination { 
                  margin: 16px 16px 0 16px !important; 
                  padding: 12px 0 16px 0 !important;
                  border-top: 1px solid #f1f5f9;
                  width: calc(100% - 32px);
                }
                .ant-table-wrapper, .ant-spin-nested-loading, .ant-spin-container, .ant-table { margin-bottom: 0 !important; padding-bottom: 0 !important; }
              `}</style>
              <div className="custom-table border-0" style={{ marginBottom: '0 !important' }}>
                <Datatable
                  columns={columns}
                  dataSource={filteredData}
                  Selection={true}
                  searchText={searchText}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Improved Footer */}
        <div className="footer text-center bg-white p-3 border-top mt-auto">
          <p className="mb-0 fs-13 text-muted fw-medium">
            2025 &copy; <span className="text-primary fw-bold">Docyari</span>, All Rights Reserved
          </p>
        </div>
      </div>

      {/* Advanced Filter Drawer - Cloned from Admin */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="filter_drawer" aria-labelledby="filter_drawer_label">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="filter_drawer_label">Advanced Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Patient Profile</label>
            <select
              className="form-select fs-13 py-2"
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
            >
              <option value="">All Patients</option>
              {Array.from(new Set(appointments.map(a => a.patientName))).sort().map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Date Range</label>
            <select className="form-select fs-13 py-2 mb-2" value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Custom">Choose Custom Date</option>
            </select>
            {datePreset === "Custom" && (
              <div className="d-flex gap-1 align-items-center mt-2">
                <input type="date" className="form-control fs-13" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                <span className="text-muted small">to</span>
                <input type="date" className="form-control fs-13" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Status</label>
            <select className="form-select fs-13 py-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Schedule">Schedule</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Type (Mode)</label>
            <select className="form-select fs-13 py-2" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="In-person">In-person</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Follow-up Status</label>
            <select className="form-select fs-13 py-2" value={filterFollowUp} onChange={(e) => setFilterFollowUp(e.target.value)}>
              <option value="All">All Appointments</option>
              <option value="FollowUp">All Follow-ups</option>
              <option value="Free Follow-up">Free Follow-up</option>
              <option value="Paid Follow-up">Paid Follow-up</option>
            </select>
          </div>

          <hr className="my-4" />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold py-2" onClick={() => {
              setFilterPatient(""); setDatePreset("All"); setFilterStartDate(""); setFilterEndDate(""); setFilterStatus("All"); setFilterType(""); setFilterFollowUp("All");
            }}>
              <i className="ti ti-trash me-2" /> Clear Filters
            </button>
            <button className="btn btn-soft-info fw-bold py-2">
              <i className="ti ti-download me-2" /> Download Report
            </button>
            <button className="btn btn-soft-success fw-bold py-2" data-bs-dismiss="offcanvas">
              <i className="ti ti-check me-2" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      <Modal />

      {showPresModal && selectedAppForPres && (
        <AddPrescriptionModal
          onClose={() => setShowPresModal(false)}
          onSubmit={handlePresSubmit}
          initialPatientId={selectedAppForPres.patientId}
          initialDoctorId={selectedAppForPres.doctorId}
          initialAppointmentId={selectedAppForPres.id}
          linkedAppointments={appointments.filter(a => (a as any).rootParentId === ((selectedAppForPres as any).rootParentId || selectedAppForPres.id))}
        />
      )}

      {/* New Appointment Modal */}
      <div className={`modal custom-modal fade ${showAddAppointment ? "show d-block" : "d-none"}`} role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">New Appointment</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddAppointment(false)}></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {showAddAppointment && (
                <AppointmentFormPage
                  mode="create"
                  isModal={true}
                  onSuccess={() => {
                    setShowAddAppointment(false);
                    refetch();
                  }}
                  onCancel={() => setShowAddAppointment(false)}
                  onClose={() => setShowAddAppointment(false)}
                  preSelectedDoctorId={doctorDetails?.id}
                  preSelectedDepartmentId={doctorDetails?.departmentId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showAddAppointment && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
    </>
  );
};

export default DoctorAppointments;
