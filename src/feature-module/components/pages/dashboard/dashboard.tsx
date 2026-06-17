import { Link, Navigate } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import SCol2Chart from "./chats/scol2";
import SCol3Chart from "./chats/scol3";
import SCol4Chart from "./chats/scol4";
import SCol19Chart from "./chats/scol19";
import CircleChart from "./chats/circleChart";
import { Calendar, type CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useDashboardStats } from "../../../../core/hooks/useDashboardStats";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import { useHolidays } from "../../../../core/hooks/useHolidays";

dayjs.extend(isBetween);

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { stats } = useDashboardStats();
  const { staffs } = useClinicStaff();
  const { holidays } = useHolidays();

  const [sColChart] = useState<any>({
    chart: {
      width: 80,
      height: 54,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 3,
        endingShape: "rounded",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: { enabled: false },
    colors: ["#2E37A4"],
    fill: { type: "solid" },
  });

  const series = [{ name: "Data", data: [40, 15, 60, 15, 90, 20, 70] }];

  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter(h => dayjs(h.date).isAfter(dayjs().subtract(1, 'day')))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
      .slice(0, 3);
  }, [holidays]);

  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === 'month') return null;
    const isHoliday = holidays.find(h => dayjs(h.date).isSame(current, 'day') || (h.endDate && dayjs(current).isBetween(dayjs(h.date), dayjs(h.endDate), 'day', '[]')));
    if (isHoliday) {
      return (
        <div className="d-flex align-items-center justify-content-center w-100 mt-1">
          <div className="bg-primary rounded-circle" style={{ width: "4px", height: "4px" }}></div>
        </div>
      );
    }
    return null;
  };

  if (user?.role === 'PATIENT') return <Navigate to="/patient/patient-dashboard" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor/doctor-dashboard" replace />;

  return (
    <>
      <div className="page-wrapper dashboard-page-wrapper">
        <style>{`
          .dashboard-page-wrapper {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%) !important;
            min-height: 100vh;
          }
          .dashboard-page-wrapper .content {
            background: transparent !important;
            padding: 15px !important;
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
          .dashboard-page-wrapper .row {
             margin-bottom: 8px !important;
          }
           .ant-picker-calendar-full .ant-picker-panel {
            background: transparent !important;
          }
          .holiday-item {
            transition: transform 0.2s;
            border-radius: 8px !important;
          }
          .holiday-item:hover {
            transform: translateX(5px);
          }
        `}</style>

        <div className="content pb-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <h4 className="fw-bold mb-0 fs-20">Admin Dashboard</h4>
            </div>

            {stats.profileCompletion !== undefined && (
              <Link
                to="/profile-settings"
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill text-decoration-none shadow-sm mx-md-auto my-2 my-md-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  minWidth: '200px',
                  maxWidth: '300px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = stats.profileCompletion === 100 ? '#10b981' : '#6366f1';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(15, 23, 42, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.06)';
                }}
                title={stats.profileCompletion < 100 ? "Click to complete your profile settings" : "Profile setup is complete!"}
              >
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{
                  width: '22px',
                  height: '22px',
                  backgroundColor: stats.profileCompletion === 100 ? '#ecfdf5' : '#e0e7ff',
                  color: stats.profileCompletion === 100 ? '#10b981' : '#6366f1'
                }}>
                  <i className={`ti ${stats.profileCompletion === 100 ? 'ti-circle-check' : 'ti-chart-pie'} fs-12`} />
                </div>
                <span className="fs-12 fw-bold text-dark text-nowrap" style={{ letterSpacing: '0.1px' }}>Profile</span>
                <div className="progress flex-grow-1 mb-0" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${stats.profileCompletion}%`,
                      borderRadius: '3px',
                      background: stats.profileCompletion === 100 
                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                        : 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
                      transition: 'width 0.6s ease'
                    }}
                    role="progressbar"
                    aria-valuenow={stats.profileCompletion}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="fs-11 fw-bold text-nowrap px-2 py-0.5 rounded-pill" style={{
                  backgroundColor: stats.profileCompletion === 100 ? '#ecfdf5' : '#e0e7ff',
                  color: stats.profileCompletion === 100 ? '#10b981' : '#6366f1'
                }}>
                  {stats.profileCompletion}%
                </span>
              </Link>
            )}

            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link to={all_routes.profilesettings} className="btn btn-primary d-inline-flex align-items-center btn-sm py-2 px-3">
                Profile Setting <i className="ti ti-settings ms-2" />
              </Link>
              <Link to={all_routes.newAppointment} className="btn btn-primary d-inline-flex align-items-center btn-sm py-2 px-3">
                New Appointment <i className="ti ti-plus ms-2" />
              </Link>
            </div>
          </div>

          <div className="row g-1 mb-1">
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar avatar-md bg-primary rounded-circle">
                      <i className="ti ti-user-star fs-20 text-white" />
                    </span>
                    <div className="text-end">
                      <span className="badge bg-success-subtle text-success border border-success fs-11">Active</span>
                    </div>
                  </div>
                  <p className="mb-0 text-muted fs-13">Total Doctors</p>
                  <h3 className="fw-bold mb-0">{stats.doctorsCount}</h3>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar avatar-md bg-danger rounded-circle">
                      <i className="ti ti-users fs-20 text-white" />
                    </span>
                    <div className="text-end">
                      <span className="badge bg-info-subtle text-info border border-info fs-11">Register</span>
                    </div>
                  </div>
                  <p className="mb-0 text-muted fs-13">Total Patients</p>
                  <h3 className="fw-bold mb-0">{stats.patientsCount}</h3>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar avatar-md bg-info rounded-circle">
                      <i className="ti ti-calendar-check fs-20 text-white" />
                    </span>
                    <div className="text-end">
                      <span className="badge bg-warning-subtle text-warning border border-warning fs-11">Pending</span>
                    </div>
                  </div>
                  <p className="mb-0 text-muted fs-13">Appointments</p>
                  <h3 className="fw-bold mb-0">{stats.appointmentsCount}</h3>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar avatar-md bg-success rounded-circle">
                      <i className="ti ti-currency-dollar fs-20 text-white" />
                    </span>
                    <div className="text-end">
                      <span className="badge bg-success-subtle text-success border border-success fs-11">Monthly</span>
                    </div>
                  </div>
                  <p className="mb-0 text-muted fs-13">Total Revenue</p>
                  <h3 className="fw-bold mb-0 text-truncate">${stats.revenue.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-1 mb-1">
            <div className="col-xxl-8 col-xl-12 col-12">
              <div className="card h-100">
                <div className="card-header d-flex align-items-center justify-content-between border-0">
                  <h5 className="fw-bold mb-0">Appointment Statistics</h5>
                  <Link to={all_routes.appointments} className="btn btn-sm btn-light border">View Reports</Link>
                </div>
                <div className="card-body">
                  <div className="chart-set" id="s-col-19" style={{ minHeight: '350px' }}>
                    <SCol19Chart data={stats.monthlyData} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-12 col-12">
              <div className="card h-100">
                <div className="card-header d-flex align-items-center justify-content-between border-0">
                  <h5 className="fw-bold mb-0">Holiday Calendar</h5>
                  <Link to="/hrm/holidays" className="btn btn-sm btn-link p-0 fw-bold">View All</Link>
                </div>
                <div className="card-body">
                  <div className="dashboard-calendar mb-3">
                    <Calendar fullscreen={false} cellRender={cellRender} headerRender={() => null} />
                  </div>
                  <h6 className="fw-bold fs-14 mb-3">Upcoming Holidays</h6>
                  {upcomingHolidays.length === 0 ? (
                    <div className="text-center p-4 bg-light rounded-2">
                      <p className="text-muted mb-0">No upcoming holidays</p>
                    </div>
                  ) : (
                    upcomingHolidays.map((h, i) => (
                      <div key={h.id} className={`holiday-item d-flex align-items-center p-3 mb-2 border ${i % 2 === 0 ? 'bg-soft-primary' : 'bg-soft-info'} border-0`}>
                        <div className="me-3 text-center" style={{ minWidth: '50px' }}>
                          <h6 className="mb-0 fw-bold">{dayjs(h.date).format('DD')}</h6>
                          <span className="fs-11 text-uppercase">{dayjs(h.date).format('MMM')}</span>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 fs-13 fw-bold text-dark">{h.title}</h6>
                          <p className="mb-0 fs-11 text-muted">{dayjs(h.date).format('dddd')}</p>
                        </div>
                        <span className="badge bg-white shadow-sm text-dark border-0">Holiday</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-1 mb-1">
            <div className="col-xl-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between border-0">
                  <h5 className="fw-bold mb-0">Recent Appointments</h5>
                  <Link to={all_routes.appointments} className="btn btn-sm btn-outline-primary rounded-pill">View All</Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-nowrap mb-0 table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th className="fs-12 text-muted fw-semibold">Doctor</th>
                          <th className="fs-12 text-muted fw-semibold">Patient</th>
                          <th className="fs-12 text-muted fw-semibold">Scheduled At</th>
                          <th className="fs-12 text-muted fw-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAppointments?.slice(0, 5).map((app) => (
                          <tr key={app.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm me-2">
                                  {app.doctor.profileImage ? (
                                    <ImageWithBasePath src={`assets/img/doctors/${app.doctor.profileImage}`} className="rounded-circle" alt="img" />
                                  ) : (
                                    <span className="avatar-title rounded-circle bg-soft-primary text-primary fs-12">{app.doctor.fullName.charAt(0)}</span>
                                  )}
                                </div>
                                <h6 className="fs-13 mb-0 fw-semibold">{app.doctor.fullName}</h6>
                              </div>
                            </td>
                            <td>
                              <div>
                                <h6 className="fs-13 mb-0 fw-medium">{app.patient.firstName} {app.patient.lastName}</h6>
                                <span className="fs-11 text-muted">{app.patient.phone}</span>
                              </div>
                            </td>
                            <td className="fs-12">{dayjs(app.scheduledAt).format('DD MMM YYYY, hh:mm A')}</td>
                            <td>
                              <span className={`badge border fw-medium px-2 py-1 fs-11 ${app.status === 'Completed' ? 'badge-soft-success border-success' : 'badge-soft-info border-info'}`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── TRANSACTION ANALYTICS SECTION ────────────────── */}
          <div className="row g-1 mb-1">
            <div className="col-xxl-4 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderLeft: '4px solid #10b981 !important' }}>
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 52, height: 52, background: 'rgba(16, 185, 129, 0.15)' }}>
                    <i className="ti ti-trending-up fs-24" style={{ color: '#10b981' }} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-1 fs-12 fw-semibold text-uppercase" style={{ color: '#6b7280', letterSpacing: '0.5px' }}>Total Income</p>
                    <h4 className="fw-bold mb-0" style={{ color: '#065f46' }}>₹{stats.totalIncome?.toLocaleString('en-IN') || '0'}</h4>
                  </div>
                  <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.12)', fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                    <i className="ti ti-arrow-up fs-12" /> Income
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderLeft: '4px solid #ef4444 !important' }}>
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 52, height: 52, background: 'rgba(239, 68, 68, 0.12)' }}>
                    <i className="ti ti-trending-down fs-24" style={{ color: '#ef4444' }} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-1 fs-12 fw-semibold text-uppercase" style={{ color: '#6b7280', letterSpacing: '0.5px' }}>Total Expense</p>
                    <h4 className="fw-bold mb-0" style={{ color: '#991b1b' }}>₹{stats.totalExpense?.toLocaleString('en-IN') || '0'}</h4>
                  </div>
                  <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>
                    <i className="ti ti-arrow-down fs-12" /> Expense
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-4 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0" style={{ background: stats.netProfit >= 0 ? 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', borderLeft: `4px solid ${stats.netProfit >= 0 ? '#3b82f6' : '#f97316'} !important` }}>
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 52, height: 52, background: stats.netProfit >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(249, 115, 22, 0.12)' }}>
                    <i className={`ti ${stats.netProfit >= 0 ? 'ti-chart-arrows-vertical' : 'ti-alert-triangle'} fs-24`} style={{ color: stats.netProfit >= 0 ? '#3b82f6' : '#f97316' }} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-1 fs-12 fw-semibold text-uppercase" style={{ color: '#6b7280', letterSpacing: '0.5px' }}>Net Profit</p>
                    <h4 className="fw-bold mb-0" style={{ color: stats.netProfit >= 0 ? '#1e40af' : '#9a3412' }}>
                      {stats.netProfit >= 0 ? '+' : '-'}₹{Math.abs(stats.netProfit || 0).toLocaleString('en-IN')}
                    </h4>
                  </div>
                  <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: stats.netProfit >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(249, 115, 22, 0.12)', fontSize: '11px', fontWeight: 700, color: stats.netProfit >= 0 ? '#3b82f6' : '#f97316' }}>
                    <i className={`ti ${stats.netProfit >= 0 ? 'ti-thumb-up' : 'ti-thumb-down'} fs-12`} /> {stats.netProfit >= 0 ? 'Profit' : 'Loss'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── TRANSACTIONS TABLE ────────────────── */}
          <div className="row g-1 mb-1">
            <div className="col-xl-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between border-0">
                  <div>
                    <h5 className="fw-bold mb-1">All Transactions</h5>
                    <p className="mb-0 fs-12 text-muted">Income & Expense overview</p>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-nowrap mb-0 table-hover">
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Type</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Description</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Reference</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Amount</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Method</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Status</th>
                          <th className="fs-12 text-muted fw-semibold" style={{ padding: '10px 15px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentTransactions?.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              <i className="ti ti-receipt-off fs-24 d-block mb-2" />
                              No transactions found
                            </td>
                          </tr>
                        )}
                        {stats.recentTransactions?.map((tx) => (
                          <tr key={tx.id} style={{ transition: 'background 0.2s' }}>
                            <td style={{ padding: '10px 15px' }}>
                              <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{
                                  width: 32, height: 32,
                                  background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                                }}>
                                  <i className={`ti ${tx.type === 'income' ? 'ti-arrow-down-left' : 'ti-arrow-up-right'} fs-16`} style={{ color: tx.type === 'income' ? '#10b981' : '#ef4444' }} />
                                </div>
                                <span className={`badge rounded-pill fw-semibold px-2 py-1 fs-11`} style={{
                                  background: tx.type === 'income' ? '#ecfdf5' : '#fef2f2',
                                  color: tx.type === 'income' ? '#059669' : '#dc2626',
                                  border: `1px solid ${tx.type === 'income' ? '#a7f3d0' : '#fecaca'}`
                                }}>
                                  {tx.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <h6 className="fs-13 mb-0 fw-semibold text-dark">{tx.description}</h6>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <span className="fs-12 text-muted">{tx.invoiceCode || '—'}</span>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <h6 className="fs-13 mb-0 fw-bold" style={{ color: tx.type === 'income' ? '#059669' : '#dc2626' }}>
                                {tx.type === 'income' ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                              </h6>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <span className="fs-12" style={{ color: '#475569' }}>
                                {tx.method || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <span className={`badge rounded-pill fw-medium px-2 py-1 fs-11`} style={{
                                background: tx.status === 'Paid' ? '#ecfdf5' : tx.status === 'Pending' ? '#fffbeb' : '#f0f9ff',
                                color: tx.status === 'Paid' ? '#059669' : tx.status === 'Pending' ? '#d97706' : '#0284c7',
                                border: `1px solid ${tx.status === 'Paid' ? '#a7f3d0' : tx.status === 'Pending' ? '#fde68a' : '#bae6fd'}`
                              }}>
                                {tx.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 15px' }}>
                              <span className="fs-12 text-muted">{dayjs(tx.date).format('DD MMM YYYY')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STAFF STATUS ────────────────── */}
          <div className="row g-1">
            <div className="col-xl-6">
              <div className="card h-100">
                <div className="card-header d-flex align-items-center justify-content-between border-0">
                  <h5 className="fw-bold mb-0">Staff Status</h5>
                  <Link to="/hrm/staffs" className="btn btn-sm btn-link p-0 fw-bold">View All</Link>
                </div>
                <div className="card-body">
                  {staffs.slice(0, 4).map((s, i) => (
                    <div key={s.id} className={`d-flex justify-content-between align-items-center ${i === 3 ? 'mb-0' : 'mb-3'}`}>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm me-2">
                          <ImageWithBasePath src={s.profileImage ? `assets/img/users/${s.profileImage}` : 'avatar.jpg'} className="rounded-circle" alt="img" />
                        </div>
                        <div>
                          <h6 className="fs-13 mb-1 fw-bold text-dark">{s.fullName}</h6>
                          <p className="mb-0 fs-11 text-muted">{s.role}</p>
                        </div>
                      </div>
                      <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-danger'} rounded-circle p-1`} style={{ width: '8px', height: '8px' }}></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer text-center bg-white p-2 border-top mt-4">
          <p className="text-dark mb-0 fs-12">2025 © <Link to="#" className="link-primary ms-1 fw-bold">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
