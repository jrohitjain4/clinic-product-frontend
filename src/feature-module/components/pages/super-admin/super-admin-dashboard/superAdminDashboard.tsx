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
          .dashboard-page-wrapper .row {
             margin-bottom: 8px !important;
          }
        `}</style>

        <div className="content">
          {/* Page Header */}
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1 fw-bold fs-20">Super Admin Dashboard</h3>
              <p className="text-muted mb-0 fs-13">Here's the overall platform overview.</p>
            </div>
          </div>
          {/* /Page Header */}

          <div className="row g-2 mb-2">
            {/* Enterprises */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#6366f1' }}>
                        <i className="ti ti-building-hospital fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Enterprises</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.totalClinics || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Active</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Total clinics on platform</p>
                </div>
              </div>
            </div>

            {/* Free Trial Packages */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#3b82f6' }}>
                        <i className="ti ti-gift fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Free Trial Packages</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.freeTrials || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#3b82f6', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Trial</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Clinics currently on trial</p>
                </div>
              </div>
            </div>

            {/* Premium Packages */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#10b981' }}>
                        <i className="ti ti-crown fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Premium Packages</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.premiumPackages || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#f97316', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Upgraded</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Clinics with paid plans</p>
                </div>
              </div>
            </div>

            {/* Demo Bookings */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#f59e0b' }}>
                        <i className="ti ti-calendar-event fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Demo Bookings</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.demoBookings || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#8b5cf6', backgroundColor: '#f3e8ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Requests</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Pending demo requests</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-2 mb-3">
            {/* No of Packages */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#64748b' }}>
                        <i className="ti ti-box fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>No of Packages</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.totalPackages || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Total available plans</p>
                </div>
              </div>
            </div>

            {/* Tickets No. */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#ef4444' }}>
                        <i className="ti ti-ticket fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Tickets No.</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.totalTickets || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Total support tickets</p>
                </div>
              </div>
            </div>

            {/* Open Tickets */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#f43f5e' }}>
                        <i className="ti ti-ticket-off fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Open Tickets No</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{analytics.openTickets || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Unresolved</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Tickets needing action</p>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#10b981' }}>
                        <i className="ti ti-currency-rupee fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Revenue</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>₹{(analytics.totalRevenue || 0).toLocaleString("en-IN")}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Lifetime</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Overall platform revenue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            {/* Enterprises Chart */}
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Enterprises Overview</h5>
                  <Link to={all_routes.tenants} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3 d-flex flex-column justify-content-center align-items-center">
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
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Recent Tickets</h5>
                    <span className="badge bg-danger-transparent text-danger fw-semibold" style={{ borderRadius: '4px', fontSize: '10px', padding: '3px 6px' }}>{analytics.ticketsList?.length || 0}</span>
                  </div>
                  <Link to={all_routes.tickets || "#"} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3">
                  {analytics.ticketsList && analytics.ticketsList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.ticketsList.map((ticket: any) => (
                        <div key={ticket.id} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', transition: 'all 0.2s ease' }}>
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
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Recent Emails</h5>
                  </div>
                  <Link to={all_routes.superAdminEmailSettings || "#"} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>Settings</Link>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex flex-column gap-3">
                    {[
                      { id: 1, title: 'Welcome Email', target: 'New Clinics', status: 'Active', icon: 'ti-mail', color: '#3b82f6', bg: '#eff6ff' },
                      { id: 2, title: 'Subscription Invoice', target: 'Billing', status: 'Active', icon: 'ti-receipt', color: '#10b981', bg: '#ecfdf5' },
                      { id: 3, title: 'Password Reset', target: 'Security', status: 'Active', icon: 'ti-lock', color: '#f59e0b', bg: '#fffbeb' },
                      { id: 4, title: 'Trial Expiry Notice', target: 'Trial Clinics', status: 'Paused', icon: 'ti-alert-circle', color: '#ef4444', bg: '#fef2f2' }
                    ].map((email) => (
                      <div key={email.id} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', transition: 'all 0.2s ease' }}>
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
          <div className="row g-3 mb-4">
            {/* Demo Bookings Block */}
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Demo Bookings</h5>
                  <Link to={all_routes.demoBookings || "#"} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3">
                  {analytics.demoBookingsList && analytics.demoBookingsList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.demoBookingsList.map((demo: any) => (
                        <div key={demo.id} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', transition: 'all 0.2s ease' }}>
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
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Razorpay Payments</h5>
                  <Link to={all_routes.purchaseTransaction || "#"} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3">
                  {analytics.transactionHistory && analytics.transactionHistory.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.transactionHistory.slice(0, 4).map((txn: any) => (
                        <div key={txn.transactionId} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', transition: 'all 0.2s ease' }}>
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
            <div className="col-xl-4 col-12">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px' }}>Packages</h5>
                  <Link to={all_routes.packages || "#"} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: '#4f46e5', fontSize: '13px' }}>View All</Link>
                </div>
                <div className="card-body p-3">
                  {analytics.packagesList && analytics.packagesList.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {analytics.packagesList.map((pkg: any) => (
                        <div key={pkg.id} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', transition: 'all 0.2s ease' }}>
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
          <div className="row g-3">
            {/* Privacy Policy Block */}
            <div className="col-xl-4 col-md-6 col-12">
              <Link to={all_routes.privacyPolicyAdmin || "#"} className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#ecfdf5', color: '#10b981' }}>
                        <i className="ti ti-shield-check fs-24" />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Privacy Policy</h5>
                        <p className="mb-0 text-muted fs-12">Update privacy terms</p>
                      </div>
                    </div>
                    <div className="text-muted">
                      <i className="ti ti-chevron-right fs-20" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Refund Policy Block */}
            <div className="col-xl-4 col-md-6 col-12">
              <Link to={all_routes.refundPolicyAdmin || "#"} className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                        <i className="ti ti-receipt-refund fs-24" />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Refund Policy</h5>
                        <p className="mb-0 text-muted fs-12">Manage refund rules</p>
                      </div>
                    </div>
                    <div className="text-muted">
                      <i className="ti ti-chevron-right fs-20" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Terms & Conditions Block */}
            <div className="col-xl-4 col-md-6 col-12">
              <Link to={all_routes.termsConditionAdmin || "#"} className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '48px', height: '48px', backgroundColor: '#fff7ed', color: '#f97316' }}>
                        <i className="ti ti-file-text fs-24" />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold text-dark fs-16">Terms & Conditions</h5>
                        <p className="mb-0 text-muted fs-12">Manage user agreements</p>
                      </div>
                    </div>
                    <div className="text-muted">
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
