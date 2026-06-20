import { Link } from "react-router";
import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import Modals from "./modals/modals";
import SCol20Chart from "./charts/scol20";
import SCol5Chart from "./charts/scol5";
import SCol6Chart from "./charts/scol6";
import SCol7Chart from "./charts/scol7";
import CircleChart2 from "./charts/circleChart2";
import { apiPost, apiGet } from "../../../../../core/utils/apiClient";
import { all_routes } from "../../../../routes/all_routes";
import AppointmentFormPage from "../../clinic-modules/appointment-form/appointmentFormPage";
import { useHolidays } from "../../../../../core/hooks/useHolidays";
import { Calendar, Tooltip } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const DoctorDahboard = () => {
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [markedByAdmin, setMarkedByAdmin] = useState(false);
  const [dashData, setDashData] = useState<any>(null);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const { holidays = [] } = useHolidays();

  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === 'month') return null;
    const isHoliday = holidays.find(h => dayjs(h.date).isSame(current, 'day') || (h.endDate && dayjs(current).isBetween(dayjs(h.date), dayjs(h.endDate), 'day', '[]')));
    if (isHoliday) {
      return (
        <Tooltip title={`Holiday: ${isHoliday.title}`} key={current.toString()}>
          <div className="d-flex align-items-center justify-content-center w-100 mt-1">
            <div className="bg-primary rounded-circle" style={{ width: "6px", height: "6px" }}></div>
          </div>
        </Tooltip>
      );
    }
    return null;
  };

  const fetchDash = async () => {
    try {
      const res = await apiGet("/api/doctors/my-dashboard");
      setDashData(res);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  useEffect(() => {
    fetchDash();
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiGet("/api/attendance/today-status") as any;
        if (res && res.status) {
          setMarked(true);
          if (res.markedBy === "ADMIN") {
            setMarkedByAdmin(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch today's attendance status", err);
      }
    };
    fetchStatus();
  }, []);

  const handleMarkAttendance = async () => {
    setMarking(true);
    try {
      const res: any = await apiPost("/api/attendance/mark-self", {});
      if (res.updated || res.created || res.message.includes("already marked")) {
        setMarked(true);
      }
    } catch (err: any) {
      console.error("Failed to mark attendance", err);
      alert(err.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper dashboard-page-wrapper">
        {/* Start Content */}
        <div className="content pb-0">
          <style>{`
            .dashboard-page-wrapper {
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%) !important;
              min-height: 100vh;
            }
            .dashboard-page-wrapper .content {
              background: transparent !important;
              padding: 15px 15px 2px 15px !important;
            }
            .dashboard-page-wrapper .card {
              border: 1px solid #94a3b8 !important;
              border-radius: 12px !important;
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.04) !important;
              background-color: #ffffff;
              margin-bottom: 0 !important;
            }
            .dashboard-page-wrapper .card-header {
               padding: 12px 15px !important;
               background: transparent !important;
               border-bottom: 1px solid #f1f5f9 !important;
            }
            .dashboard-page-wrapper .card-body {
               padding: 12px 15px !important;
            }
          `}</style>
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-1 fs-20">Welcome back, Doctor! 👋</h4>
              <p className="text-muted mb-0 fs-13">Here's what's happening in your schedule today.</p>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link to="/profile-settings" className="btn btn-outline-light border text-dark bg-white d-inline-flex align-items-center justify-content-center fw-semibold px-3 py-2" style={{ borderRadius: '8px', fontSize: '13px', minHeight: '38px' }}>
                Profile Setting <i className="ti ti-settings ms-2" />
              </Link>
              <button
                type="button"
                className={`btn d-inline-flex align-items-center justify-content-center fw-semibold px-3 py-2 text-white`}
                onClick={handleMarkAttendance}
                disabled={marking || marked}
                style={{ borderRadius: '8px', fontSize: '13px', minHeight: '38px', backgroundColor: marked ? '#10b981' : '#6366f1', borderColor: marked ? '#10b981' : '#6366f1' }}
              >
                {marking ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                ) : (
                  <i className={`ti ti-${marked ? 'check' : 'hand-click'} ms-2 order-2`} />
                )}
                {marked ? (markedByAdmin ? 'Admin Marked' : 'Attendance Marked') : 'Mark Today\'s Attendance'}
              </button>
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center justify-content-center fw-semibold px-3 py-2 text-white shadow-sm"
                onClick={() => setShowAddAppointment(true)}
                style={{ borderRadius: '8px', fontSize: '13px', minHeight: '38px', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                <i className="ti ti-plus ms-2 order-2" />
                New Appointment
              </button>
            </div>
          </div>
          {/* End Page Header */}
          {/* Row 1 Stats */}
          <div className="row g-2 mb-2">
            {/* Today's Appointments */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#3b82f6' }}>
                        <i className="ti ti-calendar-event fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Today's Appts</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.todayAppointments || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Appointments scheduled today</p>
                </div>
              </div>
            </div>

            {/* Total Patients */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#8b5cf6' }}>
                        <i className="ti ti-users fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Patients</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.totalPatients || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Unique patients treated</p>
                </div>
              </div>
            </div>

            {/* Scheduled */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#64748b' }}>
                        <i className="ti ti-calendar-time fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Scheduled</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.scheduled || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Awaiting confirmation</p>
                </div>
              </div>
            </div>

            {/* Confirmed */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#0ea5e9' }}>
                        <i className="ti ti-calendar-check fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Confirmed</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.confirmed || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Appointments confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 Stats */}
          <div className="row g-2 mb-3">
            {/* Checked In */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#f59e0b' }}>
                        <i className="ti ti-user-check fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Checked In</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.checkedIn || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Patients waiting</p>
                </div>
              </div>
            </div>

            {/* Checked Out */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#10b981' }}>
                        <i className="ti ti-user-x fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Checked Out</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.checkedOut || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Patients departed</p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#0d9488' }}>
                        <i className="ti ti-circle-check fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Completed</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.completed || dashData?.stats?.completedAppointments || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Successfully completed visits</p>
                </div>
              </div>
            </div>

            {/* Cancelled */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#ef4444' }}>
                        <i className="ti ti-calendar-off fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Cancelled</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{dashData?.stats?.cancelledAppointments || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Cancelled or no-show</p>
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row g-3 mb-3">
            {/* Today's Schedule (formerly Upcoming Appointments) */}
            <div className="col-xl-4 col-12 d-flex">
              <div className="card h-100 border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>
                    Upcoming Appointment
                  </h5>
                  <Link to={all_routes.appointments} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  {!dashData?.todayAppointment ? (
                    <div className="text-center py-4 my-auto">
                      <div className="mb-3">
                        <i className="ti ti-calendar-off fs-40 text-muted opacity-50" />
                      </div>
                      <p className="text-muted fw-medium" style={{ fontSize: '14px' }}>No appointments for today</p>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center mb-3 p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Link to="#" className="avatar me-3 flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                          {dashData.todayAppointment.patient?.profileImage ? (
                            <img src={dashData.todayAppointment.patient.profileImage} className="rounded-circle w-100 h-100 object-fit-cover" alt="patient" />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center rounded-circle w-100 h-100" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: '16px' }}>
                              {dashData.todayAppointment.patient ? `${dashData.todayAppointment.patient.firstName.charAt(0)}${dashData.todayAppointment.patient.lastName.charAt(0)}`.toUpperCase() : "U"}
                            </div>
                          )}
                        </Link>
                        <div>
                          <h6 className="fs-15 mb-1 text-truncate fw-bold text-dark">
                            <Link to="#" className="text-dark">
                              {dashData.todayAppointment.patient ? `${dashData.todayAppointment.patient.firstName} ${dashData.todayAppointment.patient.lastName}` : "Unknown"}
                            </Link>
                          </h6>
                          <p className="mb-0 fs-12 text-muted fw-medium text-truncate">{dashData.todayAppointment.appointmentCode || "#AP-REF"}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h6 className="fs-13 fw-semibold text-muted mb-1 text-uppercase" style={{ letterSpacing: '0.5px' }}>Reason for Visit</h6>
                        <p className="fs-14 fw-semibold text-dark mb-0">{dashData.todayAppointment.reason || "General Visit"}</p>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-3 p-2 rounded" style={{ backgroundColor: '#f1f5f9' }}>
                        <div className="d-flex align-items-center me-3">
                          <i className="ti ti-calendar text-primary me-2 fs-16" />
                          <span className="fs-13 fw-semibold text-dark">{new Date(dashData.todayAppointment.scheduledAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="ti ti-clock text-primary me-2 fs-16" />
                          <span className="fs-13 fw-semibold text-dark">{new Date(dashData.todayAppointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="p-2 border rounded border-dashed h-100">
                            <h6 className="fs-11 fw-semibold text-muted mb-1 text-uppercase">Department</h6>
                            <p className="fs-13 fw-bold text-dark mb-0 text-truncate">{dashData.todayAppointment.department?.name || "General"}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 border rounded border-dashed h-100">
                            <h6 className="fs-11 fw-semibold text-muted mb-1 text-uppercase">Type</h6>
                            <p className="fs-13 fw-bold text-dark mb-0 text-truncate">{dashData.todayAppointment.mode || "In-person"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column gap-2 mt-auto">
                        <Link to={all_routes.doctorsappointmentdetails.replace(":id", dashData.todayAppointment.id)} className="btn btn-primary w-100 fw-semibold" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', borderRadius: '8px' }}>
                          Start Appointment
                        </Link>
                        <Link to="#" className="btn btn-light w-100 fw-semibold" style={{ borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569' }}>
                          <i className="ti ti-brand-hipchat me-1 fs-16 align-middle" />
                          Chat with Patient
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Appointments Chart */}
            <div className="col-xl-8 col-12 d-flex">
              <div className="card h-100 border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Appointments Overview</h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-light border text-dark dropdown-toggle fw-semibold bg-white" type="button" style={{ fontSize: '12px', borderRadius: '6px' }}>
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-end gap-2 mb-1 flex-wrap mb-3">
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1 fs-18 text-primary" />
                      Total Appointments
                    </p>
                    <p className="mb-0 d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1 fs-18 text-success" />
                      Completed Appointments
                    </p>
                  </div>
                  <SCol20Chart totals={dashData?.monthlyStats?.totals} completed={dashData?.monthlyStats?.completed} />
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3 mb-3">
            {/* 1. Schedule (Recent Appointments) */}
            <div className="col-xl-6 col-12 d-flex">
              <div className="card border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Recent Appointments</h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-light border text-dark dropdown-toggle fw-semibold bg-white" type="button" style={{ fontSize: '12px', borderRadius: '6px' }}>
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                      <thead className="bg-light text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <tr>
                          <th>Patient</th>
                          <th>Date &amp; Time</th>
                          <th>Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashData?.recentAppointments || []).slice(0, 5).map((apt: any) => {
                          const initial = apt.patientName ? apt.patientName.charAt(0).toUpperCase() : 'U';
                          return (
                          <tr key={apt.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Link to="#" className="avatar me-2 flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                                  {apt.patientImage ? (
                                    <img src={apt.patientImage} className="rounded-circle w-100 h-100 object-fit-cover" alt="patient" />
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center rounded-circle w-100 h-100" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 600 }}>
                                      {initial}
                                    </div>
                                  )}
                                </Link>
                                <div>
                                  <h6 className="fs-13 mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '100px' }}>
                                    <Link to="#" className="text-dark">
                                      {apt.patientName}
                                    </Link>
                                  </h6>
                                  <p className="mb-0 text-muted text-truncate" style={{ fontSize: '11px', maxWidth: '100px' }}>{apt.patientPhone || 'No Phone'}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <span className="text-dark fw-medium" style={{ fontSize: '12px' }}>{new Date(apt.dateTime).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge rounded px-2 py-1 fw-semibold`} style={{ 
                                fontSize: '10px',
                                backgroundColor: apt.status === 'Completed' || apt.status === 'Checked Out' ? '#ecfdf4' : apt.status === 'Cancelled' || apt.status === 'No Show' ? '#fef2f2' : '#fff9db',
                                color: apt.status === 'Completed' || apt.status === 'Checked Out' ? '#10b981' : apt.status === 'Cancelled' || apt.status === 'No Show' ? '#ef4444' : '#fab005'
                              }}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link
                                to={all_routes.doctorsappointmentdetails.replace(":id", apt.id)}
                                className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center p-1"
                                style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                              >
                                <i className="ti ti-eye fs-16 text-muted" />
                              </Link>
                            </td>
                          </tr>
                        )})}
                        {(!dashData?.recentAppointments || dashData.recentAppointments.length === 0) && (
                          <tr><td colSpan={4} className="text-center py-4 text-muted">No recent appointments found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 border-top mt-auto">
                    <Link to={all_routes.appointments} className="d-flex align-items-center justify-content-between text-decoration-none" style={{ color: '#4f46e5', fontWeight: 600, fontSize: '12px' }}>
                      <span>View all appointments</span>
                      <i className="ti ti-arrow-right fs-14" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Attendance */}
            <div className="col-xl-3 col-md-6 col-12 d-flex">
              <div className="card h-100 border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>My Attendance</h5>
                  <Link to="#" className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex align-items-center justify-content-center mb-4 mt-2">
                    <div className="position-relative" style={{ width: '120px', height: '120px' }}>
                      <svg className="w-100 h-100" viewBox="0 0 36 36">
                        <path
                          className="text-light"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3"
                        />
                        <path
                          className="text-success"
                          strokeDasharray={`${dashData?.attendance?.percentage || 0}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                      </svg>
                      <div className="position-absolute top-50 start-50 translate-middle text-center">
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '20px' }}>{dashData?.attendance?.percentage || 0}%</h4>
                        <span className="text-muted" style={{ fontSize: '10px', fontWeight: 600 }}>Present</span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2 mt-auto bg-light rounded p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#10b981' }}></span>
                        <span className="text-dark fw-semibold" style={{ fontSize: '12px' }}>Present</span>
                      </div>
                      <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{dashData?.attendance?.present || 0} Days</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444' }}></span>
                        <span className="text-dark fw-semibold" style={{ fontSize: '12px' }}>Absent</span>
                      </div>
                      <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{dashData?.attendance?.absent || 0} Days</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b' }}></span>
                        <span className="text-dark fw-semibold" style={{ fontSize: '12px' }}>Leaves</span>
                      </div>
                      <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{dashData?.attendance?.leaves || 0} Days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Prescriptions */}
            <div className="col-xl-3 col-md-6 col-12 d-flex">
              <div className="card h-100 border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Prescriptions</h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-light border text-dark dropdown-toggle fw-semibold bg-white" type="button" style={{ fontSize: '12px', borderRadius: '6px' }}>
                      Today
                    </button>
                  </div>
                </div>
                <div className="card-body p-3 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4' }}>
                      <i className="ti ti-pill fs-24 text-success" />
                    </div>
                    <div>
                      <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>Issued Today</p>
                      <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{dashData?.prescriptions?.issuedToday || 0}</h4>
                    </div>
                  </div>
                  
                  <h6 className="fs-13 fw-bold text-dark mb-3">Recent Prescriptions</h6>
                  <div className="d-flex flex-column gap-3 mb-3">
                    {(dashData?.prescriptions?.recent || []).map((med: any, idx: number) => {
                      const medNames = med.medicines?.map((m: any) => m.medicineName).join(', ') || 'No medicine details';
                      const timeStr = new Date(med.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={med.id || idx} className="d-flex align-items-center justify-content-between border-bottom pb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <i className="ti ti-prescription text-primary fs-16" />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h6 className="mb-0 text-dark fw-bold text-truncate" style={{ fontSize: '12px', maxWidth: '120px' }}>{medNames}</h6>
                              <p className="mb-0 text-muted text-truncate" style={{ fontSize: '10px', maxWidth: '120px' }}>{med.patient ? `${med.patient.firstName} ${med.patient.lastName}` : 'Unknown Patient'}</p>
                            </div>
                          </div>
                          <span className="text-muted fw-medium" style={{ fontSize: '10px' }}>{timeStr}</span>
                        </div>
                      );
                    })}
                    {(!dashData?.prescriptions?.recent || dashData.prescriptions.recent.length === 0) && (
                      <div className="text-center text-muted py-3">No recent prescriptions</div>
                    )}
                  </div>
                  
                  <Link to="#" className="btn btn-primary w-100 fw-semibold mt-auto" style={{ borderRadius: '8px', backgroundColor: '#6366f1', borderColor: '#6366f1' }}>
                    <i className="ti ti-plus me-1" /> Add Prescription
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row g-3">
            {/* Availability */}
            <div className="col-xl-4 col-md-6 col-12 d-flex">
              <div className="card border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Availability</h5>
                  <Link to="#" className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>Edit</Link>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex flex-column gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const slots = dashData?.schedules?.[day] || [];
                      const displayDay = day.substring(0, 3);
                      if (slots.length > 0) {
                        return (
                          <div key={day} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#f8fafc' }}>
                            <span className="text-dark fw-bold" style={{ fontSize: '13px' }}>{displayDay}</span>
                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>
                              <i className="ti ti-clock text-primary" />
                              <span>{slots.map((s: any) => `${s.from} - ${s.to}`).join(', ')}</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={day} className="d-flex align-items-center justify-content-between p-2 rounded mt-1" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                            <span className="text-danger fw-bold" style={{ fontSize: '13px' }}>{displayDay}</span>
                            <span className="badge bg-soft-danger text-danger fw-bold rounded-pill" style={{ fontSize: '11px' }}>Closed</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                  <Link to="#" className="btn btn-light w-100 mt-3 fw-semibold" style={{ fontSize: '13px', borderRadius: '8px' }}>
                    Edit Availability
                  </Link>
                </div>
              </div>
            </div>

            {/* Appointment Statistics Donut */}
            <div className="col-xl-4 col-md-6 col-12 d-flex">
              <div className="card border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Appointment Stats</h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-light border text-dark dropdown-toggle fw-semibold bg-white" type="button" style={{ fontSize: '12px', borderRadius: '6px' }}>
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{ minHeight: '200px' }}>
                    <div style={{ transform: 'scale(0.8)' }}>
                      <CircleChart2 
                        completed={dashData?.stats?.completed || 0} 
                        pending={dashData?.stats?.pendingAppointments || 0} 
                        cancelled={dashData?.stats?.cancelledAppointments || 0} 
                      />
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-around w-100 mt-3 pt-3 border-top">
                    <div className="text-center">
                      <p className="mb-1 text-muted fw-semibold" style={{ fontSize: '11px' }}>
                        <i className="ti ti-circle-filled text-success fs-10 me-1" />
                        Completed
                      </p>
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '18px' }}>{dashData?.stats?.completedAppointments || 0}</h5>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0' }}></div>
                    <div className="text-center">
                      <p className="mb-1 text-muted fw-semibold" style={{ fontSize: '11px' }}>
                        <i className="ti ti-circle-filled text-warning fs-10 me-1" />
                        Pending
                      </p>
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '18px' }}>{(dashData?.stats?.totalAppointments || 0) - (dashData?.stats?.completedAppointments || 0) - (dashData?.stats?.cancelledAppointments || 0)}</h5>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0' }}></div>
                    <div className="text-center">
                      <p className="mb-1 text-muted fw-semibold" style={{ fontSize: '11px' }}>
                        <i className="ti ti-circle-filled text-danger fs-10 me-1" />
                        Cancelled
                      </p>
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '18px' }}>{dashData?.stats?.cancelledAppointments || 0}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Holiday Calendar */}
            <div className="col-xl-4 col-12 d-flex">
              <div className="card border-0 shadow-sm flex-fill w-100" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Holiday Calendar</h5>
                  <Link to={all_routes.holidays} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3">
                  <Calendar fullscreen={false} cellRender={cellRender} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary ms-1">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
      
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
                    // Refresh stats/appointments on dashboard dynamically without full reload
                    fetchDash();
                  }}
                  onCancel={() => setShowAddAppointment(false)}
                  onClose={() => setShowAddAppointment(false)}
                  preSelectedDoctorId={dashData?.doctorDetails?.id}
                  preSelectedDepartmentId={dashData?.doctorDetails?.departmentId}
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

export default DoctorDahboard;
