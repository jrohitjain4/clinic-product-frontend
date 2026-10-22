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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          .dashboard-page-wrapper {
            background-color: #F8FAFC !important;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            color: #0f172a;
          }
          .dashboard-page-wrapper .content {
            background: transparent !important;
            padding: 32px 32px 20px 32px !important;
            max-width: 1600px;
            margin: 0 auto;
          }
          /* Premium Hero Cards */
          .hero-card {
            background: #ffffff;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 20px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .hero-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
            border-color: rgba(203, 213, 225, 1);
          }
          .hero-card-bg-glow {
            position: absolute;
            top: -20px;
            right: -20px;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
          }
          .hero-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 1;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.05);
          }
          .hero-val {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
            color: #0f172a;
            margin-top: 16px;
            margin-bottom: 4px;
            z-index: 1;
            position: relative;
          }
          .hero-title {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 1;
            position: relative;
          }
          
          /* Analytics Cards */
          .analytic-card {
            background: #ffffff;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 20px;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
            margin-bottom: 24px;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .analytic-card-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(241, 245, 249, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
          }
          .analytic-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .analytic-card-body {
            padding: 24px;
          }
          
          /* Quick Action Pills */
          .action-pill {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 8px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            width: 100%;
          }
          .action-pill:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 16px -4px rgba(0,0,0,0.05);
          }
          .action-pill-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          .action-pill-text {
            font-size: 12px;
            font-weight: 600;
            color: #334155;
            white-space: nowrap;
          }

          /* Buttons & Badges */
          .btn-premium {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
            font-weight: 600 !important;
            padding: 10px 20px !important;
            border-radius: 10px !important;
            transition: all 0.3s ease !important;
          }
          .btn-premium:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35) !important;
          }
          
          .badge-trend {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
          }
          .badge-trend.up { background: #dcfce7; color: #059669; }
          .badge-trend.down { background: #fee2e2; color: #e11d48; }

          /* Avatars & Lists */
          .appt-list-item {
            padding: 16px;
            border: 1px solid #f1f5f9;
            border-radius: 14px;
            margin-bottom: 12px;
            transition: all 0.2s;
            background: #ffffff;
          }
          .appt-list-item:hover {
            border-color: #e2e8f0;
            background: #f8fafc;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          
          /* Calendar Overrides */
          .premium-calendar-wrapper .ant-picker-calendar {
            background: transparent;
          }
          .premium-calendar-wrapper .ant-picker-cell-inner {
            border-radius: 8px !important;
          }
          .premium-calendar-wrapper .ant-picker-cell-selected .ant-picker-cell-inner {
            background: #4f46e5 !important;
          }
          .premium-calendar-wrapper .ant-picker-calendar-header {
            padding-top: 0 !important;
          }

          /* Animations */
          .fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
          }
          @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
          }
          .delay-1 { animation-delay: 0.1s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-3 { animation-delay: 0.3s; }
          .delay-4 { animation-delay: 0.4s; }
        `}</style>
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4 fade-in-up">
            <div>
              <h4 className="fw-bold mb-1 fs-20" style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#0f172a' }}>Welcome back, Doctor! 👋</h4>
              <p className="mb-0" style={{ color: '#64748b', fontSize: '15px' }}>Here's what's happening in your schedule today.</p>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-3">
              <Link to={all_routes.doctorsprofilesettings} className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, fontSize: '13px' }}>
                Profile Setting <i className="ti ti-settings ms-2" />
              </Link>
              <button
                type="button"
                className={`btn-premium d-inline-flex align-items-center justify-content-center gap-2`}
                onClick={handleMarkAttendance}
                disabled={marking || marked}
                style={marked ? { background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' } : {}}
              >
                {marking ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                ) : (
                  <i className={`ti ti-${marked ? 'check' : 'hand-click'}`} />
                )}
                {marked ? (markedByAdmin ? 'Admin Marked' : 'Attendance Marked') : 'Mark Today\'s Attendance'}
              </button>
              <button
                type="button"
                className="btn-premium d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowAddAppointment(true)}
              >
                <i className="ti ti-plus" /> New Appointment
              </button>
            </div>
          </div>
          {/* End Page Header */}
          {/* Row 1 Stats */}
          <div className="row g-4 mb-4">
            {/* Today's Appointments */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <i className="ti ti-calendar-event" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.todayAppointments || 0}</div>
                  <div className="hero-title">Today's Appts</div>
                </div>
              </div>
            </div>

            {/* Total Patients */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#8b5cf6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                    <i className="ti ti-users" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.totalPatients || 0}</div>
                  <div className="hero-title">Total Patients</div>
                </div>
              </div>
            </div>

            {/* Scheduled */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#64748b' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f1f5f9', color: '#475569' }}>
                    <i className="ti ti-calendar-time" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.scheduled || 0}</div>
                  <div className="hero-title">Scheduled</div>
                </div>
              </div>
            </div>

            {/* Confirmed */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#0ea5e9' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <i className="ti ti-calendar-check" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.confirmed || 0}</div>
                  <div className="hero-title">Confirmed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 Stats */}
          <div className="row g-4 mb-4">
            {/* Checked In */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#f59e0b' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <i className="ti ti-user-check" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.checkedIn || 0}</div>
                  <div className="hero-title">Checked In</div>
                </div>
              </div>
            </div>

            {/* Checked Out */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#10b981' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#d1fae5', color: '#059669' }}>
                    <i className="ti ti-user-x" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.checkedOut || 0}</div>
                  <div className="hero-title">Checked Out</div>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#0d9488' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                    <i className="ti ti-circle-check" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.completed || dashData?.stats?.completedAppointments || 0}</div>
                  <div className="hero-title">Completed</div>
                </div>
              </div>
            </div>

            {/* Cancelled */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ef4444' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fee2e2', color: '#e11d48' }}>
                    <i className="ti ti-calendar-off" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{dashData?.stats?.cancelledAppointments || 0}</div>
                  <div className="hero-title">Cancelled</div>
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row g-4 mb-4">
            {/* Today's Schedule (formerly Upcoming Appointments) */}
            <div className="col-xl-4 col-12 d-flex fade-in-up delay-2">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-event" />
                    </div>
                    Upcoming Appointment
                  </h3>
                  <Link to={all_routes.appointments} className="btn-link text-decoration-none fs-13" style={{ color: '#4f46e5', fontWeight: 600 }}>View All</Link>
                </div>
                <div className="analytic-card-body p-3 d-flex flex-column justify-content-between">
                  {!dashData?.todayAppointment ? (
                    <div className="text-center py-4 my-auto">
                      <div className="mb-3">
                        <i className="ti ti-calendar-off fs-40 text-muted opacity-50" />
                      </div>
                      <p className="text-muted fw-medium" style={{ fontSize: '14px' }}>No appointments for today</p>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center mb-3 p-3 rounded-3 appt-list-item" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
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
                        <Link to={all_routes.doctorsappointmentdetails.replace(":id", dashData.todayAppointment.id)} className="btn-premium w-100 text-center text-decoration-none">
                          Start Appointment
                        </Link>
                        <Link to="#" className="btn btn-light w-100 fw-semibold" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', color: '#475569', padding: '10px 20px' }}>
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
            <div className="col-xl-8 col-12 d-flex fade-in-up delay-3">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#dbeafe', color: '#2563eb', boxShadow: 'none' }}>
                      <i className="ti ti-chart-bar" />
                    </div>
                    Appointments Overview
                  </h3>
                  <div className="dropdown">
                    <button className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold dropdown-toggle" type="button" style={{ background: '#fff' }}>
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="analytic-card-body p-3">
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
          <div className="row g-4 mb-4">
            {/* 1. Schedule (Recent Appointments) */}
            <div className="col-xl-6 col-12 d-flex fade-in-up delay-2">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#ecfeff', color: '#0891b2', boxShadow: 'none' }}>
                      <i className="ti ti-list-details" />
                    </div>
                    Recent Appointments
                  </h3>
                  <div className="dropdown">
                    <button className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold dropdown-toggle" type="button" style={{ background: '#fff' }}>
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="analytic-card-body p-0">
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
            <div className="col-xl-3 col-md-6 col-12 d-flex fade-in-up delay-3">
              <div className="analytic-card w-100 mb-0 flex-fill">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fef3c7', color: '#d97706', boxShadow: 'none' }}>
                      <i className="ti ti-user-check" />
                    </div>
                    My Attendance
                  </h3>
                  <Link to="#" className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body d-flex flex-column justify-content-between p-3">
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
            <div className="col-xl-3 col-md-6 col-12 d-flex fade-in-up delay-4">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#f3e8ff', color: '#9333ea', boxShadow: 'none' }}>
                      <i className="ti ti-prescription" />
                    </div>
                    Prescriptions
                  </h3>
                  <div className="dropdown">
                    <button className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold dropdown-toggle" type="button" style={{ background: '#fff' }}>
                      Today
                    </button>
                  </div>
                </div>
                <div className="analytic-card-body p-3 d-flex flex-column">
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
                  
                  <Link to="#" className="btn-premium w-100 text-center text-decoration-none mt-auto">
                    <i className="ti ti-plus me-1" /> Add Prescription
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row g-4 mb-4">
            {/* Availability */}
            <div className="col-xl-4 col-md-6 col-12 d-flex fade-in-up delay-2">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#d1fae5', color: '#059669', boxShadow: 'none' }}>
                      <i className="ti ti-clock-check" />
                    </div>
                    Availability
                  </h3>
                  <Link to="#" className="btn-link text-decoration-none fs-13">Edit</Link>
                </div>
                <div className="analytic-card-body p-3">
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
            <div className="col-xl-4 col-md-6 col-12 d-flex fade-in-up delay-3">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                      <i className="ti ti-chart-dots" />
                    </div>
                    Appointment Stats
                  </h3>
                  <div className="dropdown">
                    <button className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold dropdown-toggle" type="button" style={{ background: '#fff' }}>
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="analytic-card-body p-4 d-flex flex-column">
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
            <div className="col-xl-4 col-12 d-flex fade-in-up delay-4">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fce7f3', color: '#db2777', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-heart" />
                    </div>
                    Holiday Calendar
                  </h3>
                  <Link to={all_routes.holidays} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3 premium-calendar-wrapper">
                  <Calendar fullscreen={false} cellRender={cellRender} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center p-3" style={{ background: 'transparent', borderTop: '1px solid rgba(226,232,240,0.8)' }}>
          <p className="mb-0" style={{ color: '#64748b', fontSize: '13px' }}>
            2025 ©
            <Link to="#" className="ms-1" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
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
