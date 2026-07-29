import React from "react";
import { useSuperAdminAnalytics } from "../../../../../core/hooks/useSuperAdminAnalytics";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ReactApexChart from "react-apexcharts";

const SuperAdminDashboard = () => {
  const { analytics, loading, error } = useSuperAdminAnalytics();

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <i className="ti ti-alert-circle me-2"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  const clinicChartOptions: any = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
    labels: ['Upgraded', 'In Progress', 'Trial', 'Expired'],
    colors: ['#10b981', '#3b82f6', '#f97316', '#ef4444'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: '#6b7280' },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: '#111827' },
            total: { show: true, showAlways: true, label: 'Total', fontSize: '14px', color: '#6b7280' }
          }
        }
      }
    }
  };

  const clinicChartSeries = [
    analytics.clinicStatusCounts?.UPGRADED || 0,
    analytics.clinicStatusCounts?.IN_PROGRESS || 0,
    analytics.clinicStatusCounts?.TRIAL || 0,
    analytics.clinicStatusCounts?.TRIAL_EXPIRED || 0
  ];

  return (
    <>
      <div className="page-wrapper dashboard-page-wrapper">
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
            height: 100%;
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
            height: 100%;
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
          .btn-link {
            color: #4f46e5 !important;
            font-weight: 600;
            font-size: 13px;
          }
          .btn-link:hover {
            color: #6366f1 !important;
          }
          .list-row-item {
            border: 1px solid #f1f5f9;
            background-color: #f8fafc;
            transition: all 0.2s ease;
            border-radius: 12px;
            padding: 10px;
          }
          .list-row-item:hover {
            border-color: #e2e8f0;
            background: #ffffff;
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

        <div className="content">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4 fade-in-up">
            <div>
              <h4 className="fw-bold mb-1 fs-20" style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#0f172a' }}>Super Admin Dashboard</h4>
              <p className="mb-0" style={{ color: '#64748b', fontSize: '15px' }}>Here's the overall platform overview.</p>
            </div>
          </div>
          {/* /Page Header */}

          <div className="row g-4 mb-4">
            {/* Enterprises */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <i className="ti ti-building-hospital" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Active
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.totalClinics || 0}</div>
                  <div className="hero-title">Enterprises</div>
                </div>
              </div>
            </div>

            {/* Free Trial Packages */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <i className="ti ti-gift" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Trial
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.freeTrials || 0}</div>
                  <div className="hero-title">Free Trial Packages</div>
                  <p className="mb-0 mt-1" style={{ fontSize: '11px', color: '#94a3b8', zIndex: 1, position: 'relative' }}>Clinics currently on trial</p>
                </div>
              </div>
            </div>

            {/* Premium Packages */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ec4899' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fce7f3', color: '#db2777' }}>
                    <i className="ti ti-crown" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Upgraded
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.premiumPackages || 0}</div>
                  <div className="hero-title">Premium Packages</div>
                </div>
              </div>
            </div>

            {/* Demo Bookings */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#f59e0b' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <i className="ti ti-calendar-event" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Requests
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.demoBookings || 0}</div>
                  <div className="hero-title">Demo Bookings</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* No of Packages */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#64748b' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f1f5f9', color: '#475569' }}>
                    <i className="ti ti-box" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.totalPackages || 0}</div>
                  <div className="hero-title">No of Packages</div>
                </div>
              </div>
            </div>

            {/* Tickets No. */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ef4444' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
                    <i className="ti ti-ticket" />
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.totalTickets || 0}</div>
                  <div className="hero-title">Total Tickets</div>
                </div>
              </div>
            </div>

            {/* Open Tickets */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#f43f5e' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fff1f2', color: '#e11d48' }}>
                    <i className="ti ti-ticket-off" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Unresolved
                  </div>
                </div>
                <div>
                  <div className="hero-val">{analytics.openTickets || 0}</div>
                  <div className="hero-title">Open Tickets</div>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#10b981' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#d1fae5', color: '#059669' }}>
                    <i className="ti ti-currency-rupee" />
                  </div>
                  <div className="badge border bg-light text-muted fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                    Lifetime
                  </div>
                </div>
                <div>
                  <div className="hero-val">₹{(analytics.totalRevenue || 0).toLocaleString("en-IN")}</div>
                  <div className="hero-title">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Enterprises Chart */}
            <div className="col-xl-4 col-12 fade-in-up delay-1">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                      <i className="ti ti-building-hospital" />
                    </div>
                    Enterprises Overview
                  </h3>
                  <Link to={all_routes.tenants} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3 d-flex flex-column justify-content-center align-items-center">
                  <div style={{ width: '100%', maxWidth: '300px' }}>
                    <ReactApexChart options={clinicChartOptions} series={clinicChartSeries} type="donut" height={220} />
                  </div>
                  <div className="d-flex align-items-center justify-content-center flex-wrap gap-3 mt-3 w-100">
                    <div className="d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#10b981' }}></span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>Upgraded</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6' }}></span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>In Progress</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#f97316' }}></span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>Trial</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#ef4444' }}></span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>Expired</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets Block */}
            <div className="col-xl-4 col-12 fade-in-up delay-2">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }}>
                      <i className="ti ti-ticket" />
                    </div>
                    Recent Tickets
                    <span className="badge bg-danger-transparent text-danger fw-semibold" style={{ borderRadius: '4px', fontSize: '10px', padding: '3px 6px' }}>{analytics.ticketsList?.length || 0}</span>
                  </h3>
                  <Link to={all_routes.tickets || "#"} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3">
                  {analytics.ticketsList && analytics.ticketsList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.ticketsList.map((ticket: any) => (
                        <div key={ticket.id} className="d-flex align-items-center justify-content-between list-row-item">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
                              <i className="ti ti-ticket fs-16" />
                            </div>
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>{ticket.subject || "Support Ticket"}</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`badge ${ticket.status === 'Resolved' ? 'bg-success-transparent text-success' : 'bg-warning-transparent text-warning'} fw-semibold`} style={{ borderRadius: '4px', fontSize: '10px' }}>
                            {ticket.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="ti ti-ticket-off fs-24 mb-2 d-block opacity-50" />
                      <p className="mb-0" style={{ fontSize: '12px' }}>No recent tickets</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Emails */}
            <div className="col-xl-4 col-12 fade-in-up delay-3">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#dbeafe', color: '#2563eb', boxShadow: 'none' }}>
                      <i className="ti ti-mail" />
                    </div>
                    Recent Emails
                  </h3>
                  <Link to={all_routes.superAdminEmailSettings || "#"} className="btn-link text-decoration-none fs-13">Settings</Link>
                </div>
                <div className="analytic-card-body p-3">
                  <div className="d-flex flex-column gap-3">
                    {[
                      { id: 1, title: 'Welcome Email', target: 'New Clinics', status: 'Active', icon: 'ti-mail', color: '#3b82f6', bg: '#eff6ff' },
                      { id: 2, title: 'Subscription Invoice', target: 'Billing', status: 'Active', icon: 'ti-receipt', color: '#10b981', bg: '#ecfdf5' },
                      { id: 3, title: 'Password Reset', target: 'Security', status: 'Active', icon: 'ti-lock', color: '#f59e0b', bg: '#fffbeb' },
                      { id: 4, title: 'Trial Expiry Notice', target: 'Trial Clinics', status: 'Paused', icon: 'ti-alert-circle', color: '#ef4444', bg: '#fef2f2' }
                    ].map((email) => (
                      <div key={email.id} className="d-flex align-items-center justify-content-between list-row-item">
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: email.bg, color: email.color }}>
                            <i className={`ti ${email.icon} fs-16`} />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>{email.title}</h6>
                            <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{email.target}</p>
                          </div>
                        </div>
                        <span className={`badge ${email.status === 'Active' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'} fw-semibold`} style={{ borderRadius: '4px', fontSize: '10px' }}>
                          {email.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row: Demo Bookings, Razorpay, Packages */}
          <div className="row g-4 mb-4">
            {/* Demo Bookings Block */}
            <div className="col-xl-4 col-12 fade-in-up delay-1">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fef3c7', color: '#d97706', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-event" />
                    </div>
                    Demo Bookings
                  </h3>
                  <Link to={all_routes.demoBookings || "#"} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3">
                  {analytics.demoBookingsList && analytics.demoBookingsList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.demoBookingsList.map((demo: any) => (
                        <div key={demo.id} className="d-flex align-items-center justify-content-between list-row-item">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: '#fef3c7', color: '#f59e0b' }}>
                              <i className="ti ti-calendar-event fs-16" />
                            </div>
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>{demo.clinicName || "Clinic"}</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{new Date(demo.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={`badge ${demo.status === 'Completed' ? 'bg-success-transparent text-success' : 'bg-warning-transparent text-warning'} fw-semibold`} style={{ borderRadius: '4px', fontSize: '10px' }}>
                            {demo.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="ti ti-calendar-off fs-24 mb-2 d-block opacity-50" />
                      <p className="mb-0" style={{ fontSize: '12px' }}>No recent demos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Razorpay (Transactions) Block */}
            <div className="col-xl-4 col-12 fade-in-up delay-2">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#d1fae5', color: '#059669', boxShadow: 'none' }}>
                      <i className="ti ti-credit-card" />
                    </div>
                    Razorpay Payments
                  </h3>
                  <Link to={all_routes.purchaseTransaction || "#"} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3">
                  {analytics.transactionHistory && analytics.transactionHistory.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.transactionHistory.slice(0, 4).map((txn: any) => (
                        <div key={txn.transactionId} className="d-flex align-items-center justify-content-between list-row-item">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                              <i className="ti ti-currency-rupee fs-16" />
                            </div>
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>{txn.clinicName || "Clinic"}</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{txn.package?.name || "Plan"}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '12px' }}>₹{txn.amount}</h6>
                            <span className={`badge ${txn.status === 'Completed' || txn.status === 'Paid' || txn.status === 'Success' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'} fw-semibold`} style={{ borderRadius: '4px', fontSize: '10px' }}>
                              {txn.status || 'Success'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="ti ti-receipt-off fs-24 mb-2 d-block opacity-50" />
                      <p className="mb-0" style={{ fontSize: '12px' }}>No recent transactions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Packages List Block */}
            <div className="col-xl-4 col-12 fade-in-up delay-3">
              <div className="analytic-card w-100 flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#f3e8ff', color: '#9333ea', boxShadow: 'none' }}>
                      <i className="ti ti-package" />
                    </div>
                    Packages
                  </h3>
                  <Link to={all_routes.packages || "#"} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3">
                  {analytics.packagesList && analytics.packagesList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.packagesList.map((pkg: any) => (
                        <div key={pkg.id} className="d-flex align-items-center justify-content-between list-row-item">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                              <i className="ti ti-box fs-16" />
                            </div>
                            <div>
                              <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>{pkg.name || "Package"}</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{pkg.duration} Days</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '12px' }}>₹{pkg.price}</h6>
                            <span className={`badge ${pkg.status === 'Active' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'} fw-semibold`} style={{ borderRadius: '4px', fontSize: '10px' }}>
                              {pkg.status || "Active"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="ti ti-box-off fs-24 mb-2 d-block opacity-50" />
                      <p className="mb-0" style={{ fontSize: '12px' }}>No packages found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Blocks at the bottom */}
          <div className="row g-4">
            {/* Privacy Policy Block */}
            <div className="col-xl-4 col-md-6 col-12 fade-in-up delay-1">
              <Link to={all_routes.privacyPolicyAdmin || "#"} className="text-decoration-none">
                <div className="hero-card">
                  <div className="hero-card-bg-glow" style={{ background: '#10b981' }}></div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="hero-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
                        <i className="ti ti-shield-check" />
                      </div>
                      <div style={{ zIndex: 1, position: 'relative' }}>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Privacy Policy</h5>
                        <p className="mb-0 text-muted fs-12">Update privacy terms</p>
                      </div>
                    </div>
                    <div className="text-muted" style={{ zIndex: 1, position: 'relative' }}>
                      <i className="ti ti-chevron-right fs-20" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Refund Policy Block */}
            <div className="col-xl-4 col-md-6 col-12 fade-in-up delay-2">
              <Link to={all_routes.refundPolicyAdmin || "#"} className="text-decoration-none">
                <div className="hero-card">
                  <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="hero-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <i className="ti ti-receipt-refund" />
                      </div>
                      <div style={{ zIndex: 1, position: 'relative' }}>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Refund Policy</h5>
                        <p className="mb-0 text-muted fs-12">Manage refund rules</p>
                      </div>
                    </div>
                    <div className="text-muted" style={{ zIndex: 1, position: 'relative' }}>
                      <i className="ti ti-chevron-right fs-20" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Terms & Conditions Block */}
            <div className="col-xl-4 col-md-6 col-12 fade-in-up delay-3">
              <Link to={all_routes.termsConditionAdmin || "#"} className="text-decoration-none">
                <div className="hero-card">
                  <div className="hero-card-bg-glow" style={{ background: '#f97316' }}></div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="hero-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
                        <i className="ti ti-file-text" />
                      </div>
                      <div style={{ zIndex: 1, position: 'relative' }}>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Terms & Conditions</h5>
                        <p className="mb-0 text-muted fs-12">Manage user agreements</p>
                      </div>
                    </div>
                    <div className="text-muted" style={{ zIndex: 1, position: 'relative' }}>
                      <i className="ti ti-chevron-right fs-20" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
