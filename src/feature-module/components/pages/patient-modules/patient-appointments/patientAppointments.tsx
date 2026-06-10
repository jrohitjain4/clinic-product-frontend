import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import Datatable from "../../../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { statusBadgeClass } from "../../../../../core/utils/appointmentForm";
import Modals from "./modals/modals";
import { resolveMediaUrl } from "../../../../../core/config/api";

const PatientAppointments = () => {
  const { appointments, loading } = useClinicAppointments();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  // Helper for profile images
  const getProfileImage = (img?: string | null) => {
    if (!img || img.trim() === "" || img.includes("placeholder") || img.includes("300x300")) {
      return "assets/img/doctors/doctor-01.jpg";
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
        const matchDoctor = filterDoctor
          ? (a.doctor?.fullName?.toLowerCase().includes(filterDoctor.toLowerCase()) ||
            a.doctorName?.toLowerCase().includes(filterDoctor.toLowerCase()))
          : true;
        const matchDate = filterDate
          ? dayjs(a.scheduledAt).format("YYYY-MM-DD") === filterDate.format("YYYY-MM-DD")
          : true;
        const matchSearch = searchText
          ? (a.doctorName?.toLowerCase().includes(searchText.toLowerCase()) ||
            a.appointmentCode?.toLowerCase().includes(searchText.toLowerCase()))
          : true;
        const matchType = filterType
          ? a.mode === filterType
          : true;
        const matchDepartment = filterDepartment
          ? a.department?.name?.toLowerCase().includes(filterDepartment.toLowerCase())
          : true;

        return matchStatus && matchDoctor && matchDate && matchSearch && matchType && matchDepartment;
      })
      .map((app, index) => {
        let expectedTime = "NULL";
        let queueStatus = "NULL";

        // Use backend provided queue info if available
        const pos = (app as any).queuePosition;
        const co = (app as any).queueCheckoutCount;
        const firstTime = (app as any).queueFirstScheduledAt;

        if (pos && (app.status === "Confirmed" || app.status === "Checked Out")) {
          if (firstTime) {
            const start = dayjs(firstTime);
            expectedTime = start.add((pos - 1) * 20, 'minute').format("hh:mm A");
          }
          queueStatus = `${co} / ${pos}`;
        }

        return {
          key: app.id,
          id: app.id,
          SrNo: index + 1,
          Date_Time: app.dateTimeLabel,
          Doctor: app.doctorName,
          img: getProfileImage(app.doctor?.profileImage),
          role: app.doctorRole || "Doctor",
          Mode: app.mode,
          Status: app.status,
          ExpectedTime: expectedTime,
          QueueStatus: queueStatus,
          _raw: app
        };
      });
  }, [appointments, filterStatus, filterDoctor, filterDate, searchText, filterType, filterDepartment]);


  const columns = [
    {
      title: "Sr No",
      dataIndex: "SrNo",
      render: (text: number) => <span className="fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.patientappointmentdetails.replace(":id", record.id)} className="avatar avatar-md me-2">
            {record.img.startsWith("http") || record.img.startsWith("/") || record.img.startsWith("assets") ? (
              <img
                src={record.img.startsWith("assets") ? `${window.location.host.includes('localhost') ? '' : ''}/${record.img}` : record.img}
                alt="doctor"
                className="rounded-circle"
                onError={(e: any) => { e.target.src = "assets/img/doctors/doctor-01.jpg"; }}
              />
            ) : (
              <ImageWithBasePath
                src={record.img}
                alt="doctor"
                className="rounded-circle"
              />
            )}
          </Link>
          <div>
            <Link to={all_routes.patientappointmentdetails.replace(":id", record.id)} className="fw-bold text-dark d-block mb-0">{text}</Link>
            <span className="text-muted fs-11 d-block fw-medium">{record.role}</span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Doctor.localeCompare(b.Doctor),
    },
    {
      title: "Expected Time",
      dataIndex: "ExpectedTime",
      render: (text: string) => (
        <div className="d-flex align-items-center gap-1">
          <i className="ti ti-clock text-primary fs-14" />
          <span className={`fw-bold ${text === 'NULL' ? 'text-muted' : 'text-dark'}`}>{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.ExpectedTime.localeCompare(b.ExpectedTime),
    },
    {
      title: "Queue (CO/POS)",
      dataIndex: "QueueStatus",
      render: (text: string) => (
        <span className={`badge ${text === 'NULL' ? 'badge-soft-secondary text-secondary' : 'badge-soft-info text-info'} border border-info-subtle px-3 py-2 fw-bold`} style={{ fontSize: '11px' }}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.QueueStatus.localeCompare(b.QueueStatus),
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
        <div className="d-flex align-items-center gap-1 justify-content-center">
          <Link to={all_routes.patientappointmentdetails.replace(":id", record.id)} className="btn btn-icon btn-sm btn-soft-info border-0 shadow-none">
            <i className="ti ti-eye" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-soft-primary d-flex align-items-center border-0 mb-4 shadow-sm" style={{ borderRadius: '8px' }}>
            <i className="ti ti-info-circle fs-20 me-2" />
            <div className="fs-13">
              <p className="mb-1 fw-medium">
                To see the <strong>Expected Timing</strong> and <strong>Booking No.</strong>, please contact administration to make your status <strong>Confirmed</strong>.
              </p>
              <p className="mb-0 text-muted small">
                <strong>CO/POS Meaning:</strong> <span className="text-primary-emphasis">CO</span> = Checked-out patients today, <span className="text-primary-emphasis">POS</span> = Your confirmed position in doctor's queue.
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center pb-3 mb-3 border-bottom overflow-hidden" style={{ gap: '16px' }}>
            <h4 className="fw-bold mb-0 flex-shrink-0">Appointment</h4>

            <div className="d-flex align-items-center flex-nowrap overflow-auto hide-scrollbar" style={{ gap: '12px' }}>
              {["All", "Schedule", "Confirmed", "Checked Out"].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "All") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-2 fs-12 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                  onClick={() => setFilterStatus(s)}
                  style={{ borderRadius: '6px', height: '36px' }}
                >
                  {s === "Checked Out" ? "Check-out" : s}
                  <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "All") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                    {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Checked Out" ? counts.checkedOut : counts.all}
                  </span>
                </button>
              ))}
            </div>

            <div className="ms-auto d-flex align-items-center" style={{ gap: '12px' }}>
              <div className="position-relative" style={{ width: '180px' }}>
                <input
                  type="text"
                  className="form-control bg-white"
                  style={{ height: '36px', paddingLeft: '35px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #e2e8f0' }}
                  placeholder="Search Doctor..."
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                />
                <i className="ti ti-search position-absolute top-50 translate-middle-y text-muted" style={{ left: '12px', fontSize: '14px' }} />
              </div>

              <button
                className="btn btn-sm btn-light border d-flex align-items-center gap-2 fw-bold fs-12 flex-shrink-0 shadow-sm bg-white"
                style={{ height: '36px', borderRadius: '6px' }}
                data-bs-toggle="offcanvas"
                data-bs-target="#filter_drawer"
              >
                <i className="ti ti-filter fs-14" /> Filters
              </button>

              <Link
                to={all_routes.newAppointment}
                className="btn btn-sm btn-primary fw-bold fs-12 d-flex align-items-center shadow-sm flex-shrink-0 text-nowrap"
                style={{ height: '36px', borderRadius: '6px' }}
              >
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
            </div>
          </div>

          <div className="table-responsive border rounded bg-white shadow-sm p-0">
            <Datatable
              columns={columns}
              dataSource={filteredData}
              Selection={false}
              searchText={searchText}
            />
          </div>
        </div>

        <div className="footer text-center bg-white p-3 border-top mt-auto">
          <p className="mb-0 fs-13 text-muted fw-medium">
            2025 &copy; <span className="text-primary fw-bold">Docyari</span>, All Rights Reserved
          </p>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="filter_drawer" aria-labelledby="filter_drawer_label">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="filter_drawer_label">Advanced Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Doctor's Name</label>
            <input
              type="text"
              className="form-control fs-13 py-2"
              placeholder="Search Name"
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase mb-2">Department</label>
            <input
              type="text"
              className="form-control fs-13 py-2"
              placeholder="Search Subject / Dept"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            />
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
              setFilterDoctor(""); setFilterDate(null); setFilterStatus("All"); setFilterType(""); setFilterDepartment("");
            }}>
              <i className="ti ti-refresh me-2" /> Reset All Filters
            </button>
            <button className="btn btn-soft-success fw-bold py-2" data-bs-dismiss="offcanvas">
              <i className="ti ti-check me-2" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      <Modals />
    </>
  );
};

export default PatientAppointments;
