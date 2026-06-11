import { useMemo, useState } from "react";
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
import { toast } from "react-toastify";

const DoctorAppointments = () => {
  const { appointments, loading } = useClinicAppointments();
  const { patients } = useClinicPatients();
  const { departments } = useClinicDepartments();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const { createPrescription } = usePrescriptions();
  const [showPresModal, setShowPresModal] = useState(false);
  const [selectedAppForPres, setSelectedAppForPres] = useState<any>(null);

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
    return appointments
      .filter((a) => {
        const matchStatus = filterStatus === "All" || a.status === filterStatus;
        const matchPatient = filterPatient
          ? (a.patient?.firstName?.toLowerCase().includes(filterPatient.toLowerCase()) ||
            a.patient?.lastName?.toLowerCase().includes(filterPatient.toLowerCase()) ||
            a.patientName?.toLowerCase().includes(filterPatient.toLowerCase()))
          : true;
        const matchDate = filterDate
          ? dayjs(a.scheduledAt).format("YYYY-MM-DD") === filterDate.format("YYYY-MM-DD")
          : true;
        const matchSearch = searchText
          ? (a.patientName?.toLowerCase().includes(searchText.toLowerCase()) ||
            a.appointmentCode?.toLowerCase().includes(searchText.toLowerCase()))
          : true;
        const matchType = filterType
          ? a.mode === filterType
          : true;
        const matchDepartment = filterDepartment
          ? a.department?.name?.toLowerCase().includes(filterDepartment.toLowerCase())
          : true;

        return matchStatus && matchPatient && matchDate && matchSearch && matchType && matchDepartment;
      })
      .map((app, index) => ({
        key: app.id,
        id: app.id,
        SrNo: index + 1,
        Date_Time: app.dateTimeLabel,
        Patient: app.patientName,
        img: getProfileImage(app.patient?.profileImage),
        phone_number: app.patient?.phone || "",
        Mode: app.mode,
        Status: app.status,
        _raw: app
      }));
  }, [appointments, filterStatus, filterPatient, filterDate, searchText, filterType, filterDepartment]);

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
      title: "Sr No",
      dataIndex: "SrNo",
      render: (text: number) => <span className="fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Appointment ID",
      dataIndex: "id",
      render: (text: string, record: any) => (
        <span className="text-primary fw-bold">#{record._raw.appointmentCode || text?.slice(-6).toUpperCase()}</span>
      ),
      sorter: (a: any, b: any) => (a._raw.appointmentCode || "").localeCompare(b._raw.appointmentCode || ""),
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
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
            <Link to={all_routes.doctorspatientdetails} className="fw-bold text-dark d-block mb-0">{text}</Link>
            <span className="text-muted fs-11 d-block fw-medium">{record.phone_number}</span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      render: (text: string) => (
        <span className="fw-medium text-dark-emphasis small">{text}</span>
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
      className: "text-center",
      render: (_text: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center" style={{ gap: '8px' }}>
          {/* Quick Add Prescription */}
          <Link
            to="#"
            className="avatar avatar-xs border border-primary text-primary rounded-circle d-inline-flex align-items-center justify-content-center bg-transparent"
            title="Add Prescription"
            onClick={() => {
              setSelectedAppForPres(record._raw);
              setShowPresModal(true);
            }}
          >
            <i className="ti ti-file-plus fs-14" />
          </Link>

          {/* View Details */}
          <Link
            to={all_routes.doctorsappointmentdetails.replace(":id", record.id)}
            className="avatar avatar-xs border border-info text-info rounded-circle d-inline-flex align-items-center justify-content-center bg-transparent"
            title="View Details"
          >
            <i className="ti ti-eye fs-14" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header with Filters - Cloned from Admin Design */}
          <div className="d-flex align-items-center pb-3 mb-4 border-bottom" style={{ gap: '16px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <h3 className="fw-bolder mb-0 flex-shrink-0 text-dark">Appointment</h3>

            <div className="d-flex align-items-center flex-nowrap overflow-auto flex-grow-1" style={{ gap: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {["All", "Schedule", "Confirmed", "Checked In", "Checked Out"].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "All") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-2 fs-12 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                  onClick={() => setFilterStatus(s)}
                  style={{ borderRadius: '6px', height: '36px' }}
                >
                  {s === "Checked Out" ? "Check-out" : s === "Checked In" ? "Check-in" : s}
                  <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "All") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                    {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Checked In" ? counts.checkedIn : s === "Checked Out" ? counts.checkedOut : counts.all}
                  </span>
                </button>
              ))}
            </div>

            <div className="ms-auto d-flex align-items-center" style={{ gap: '12px' }}>
              <button
                className="btn btn-sm btn-light border d-flex align-items-center gap-2 fw-bold fs-12 flex-shrink-0 shadow-sm bg-white"
                style={{ height: '36px', borderRadius: '6px' }}
                data-bs-toggle="offcanvas"
                data-bs-target="#filter_drawer"
              >
                <i className="ti ti-filter fs-14" /> Filters
              </button>

              <div className="d-flex align-items-center gap-1">
                <button className="btn btn-sm btn-icon btn-primary border shadow-sm" style={{ height: '36px', width: '36px' }}>
                  <i className="ti ti-list fs-16" />
                </button>
              </div>

              <Link
                to="#"
                className="btn btn-sm btn-primary fw-bold fs-12 d-flex align-items-center shadow-sm flex-shrink-0 text-nowrap"
                style={{ height: '36px', borderRadius: '6px' }}
                data-bs-toggle="modal"
                data-bs-target="#new_appointment"
              >
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
            </div>
          </div>

          {/* Table Content - Premium HRM Style */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-0" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div className="card-body p-0">
              <style>{`
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
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Department</label>
            <select
              className="form-select fs-13 py-2"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {Array.from(new Set(appointments.map(a => a.department?.name))).filter(Boolean).sort().map((name) => (
                <option key={name as string} value={name as string}>
                  {name as string}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Appointment Date</label>
            <DatePicker
              className="form-control w-100 py-2 fs-13"
              style={{ border: '1px solid #7D8BB3' }}
              onChange={(d) => setFilterDate(d)}
              value={filterDate}
              placeholder="Select Date"
            />
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

          <hr className="my-4" />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold py-2" onClick={() => {
              setFilterPatient(""); setFilterDate(null); setFilterStatus("All"); setFilterType(""); setFilterDepartment("");
            }}>
              <i className="ti ti-refresh me-2" /> Reset All Filters
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
    </>
  );
};

export default DoctorAppointments;
