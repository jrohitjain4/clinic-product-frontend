const fs = require('fs');
let content = fs.readFileSync('c:\\Users\\somya\\OneDrive\\Desktop\\projects\\docyatri\\clinic-product-frontend\\src\\feature-module\\components\\pages\\dashboard\\dashboard.tsx', 'utf8');

const splitIndex = content.indexOf('  return (\n    <>');
const topPart = content.substring(0, splitIndex);

const newReturn = `  return (
    <>
      <div className="page-wrapper dashboard-page-wrapper">
        <style>{\`
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
        \`}</style>

        <div className="content">
          {/* Header Row */}
          <div className="d-flex align-items-center justify-content-between mb-4 fade-in-up">
            <div>
              <h1 className="fw-bold mb-1" style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#0f172a' }}>
                Overview
              </h1>
              <p className="mb-0" style={{ color: '#64748b', fontSize: '15px' }}>
                {activeMode === "therapy" ? "Welcome back to your Therapy Dashboard." : "Welcome back to your Clinic Dashboard."}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {stats.profileCompletion !== undefined && stats.profileCompletion < 100 && (
                <Link to="/profile-settings" className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', fontWeight: 600, fontSize: '13px' }}>
                  <i className="ti ti-alert-circle fs-16" /> Complete Profile ({stats.profileCompletion}%)
                </Link>
              )}
              <button onClick={() => setShowAddAppointment(true)} className="btn-premium d-flex align-items-center gap-2">
                <i className="ti ti-plus fs-16" /> New Appointment
              </button>
            </div>
          </div>

          {/* Hero KPIs */}
          <div className="row g-4 mb-4">
            {/* KPI 1: Revenue */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#10b981' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#d1fae5', color: '#059669' }}>
                    <i className="ti ti-currency-rupee" />
                  </div>
                  <div className="badge-trend up">
                    <i className="ti ti-trending-up" /> +12.5%
                  </div>
                </div>
                <div>
                  <div className="hero-val">₹{(stats.revenue || 0).toLocaleString('en-IN')}</div>
                  <div className="hero-title">Monthly Revenue</div>
                </div>
              </div>
            </div>

            {/* KPI 2: Appointments */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <i className="ti ti-calendar-event" />
                  </div>
                  <div className="badge-trend up">
                    <i className="ti ti-trending-up" /> +8.2%
                  </div>
                </div>
                <div>
                  <div className="hero-val">{stats.appointmentsCount || 0}</div>
                  <div className="hero-title">Total Appointments</div>
                </div>
              </div>
            </div>

            {/* KPI 3: Patients */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ec4899' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fce7f3', color: '#db2777' }}>
                    <i className="ti ti-users" />
                  </div>
                  <div className="badge-trend up">
                    <i className="ti ti-trending-up" /> +5.4%
                  </div>
                </div>
                <div>
                  <div className="hero-val">{stats.patientsCount || 0}</div>
                  <div className="hero-title">Total Patients</div>
                </div>
              </div>
            </div>

            {/* KPI 4: Doctors / Staff */}
            <div className="col-xl-3 col-lg-6 col-md-6 col-12 fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#8b5cf6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                    <i className="ti ti-stethoscope" />
                  </div>
                  <div className="badge-trend up">
                    <i className="ti ti-trending-up" /> +2.1%
                  </div>
                </div>
                <div>
                  <div className="hero-val">{stats.doctorsCount || 0}</div>
                  <div className="hero-title">{activeMode === "therapy" ? "Therapists" : "Doctors"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: 70/30 Split */}
          <div className="row g-4">
            
            {/* LEFT COLUMN (70%) */}
            <div className="col-xl-8 col-lg-12 fade-in-up delay-2">
              
              {/* Revenue Overview (RESTORED) */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#ecfdf5', color: '#059669', boxShadow: 'none' }}>
                      <i className="ti ti-currency-rupee" />
                    </div>
                    Revenue Overview
                  </h3>
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">This Month</span>
                </div>
                <div className="analytic-card-body p-4">
                  <div className="row g-4 align-items-center">
                    <div className="col-md-5">
                      <div className="p-4 rounded-4 text-center d-flex flex-column justify-content-center h-100" style={{ background: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
                        <p className="text-muted fw-bold mb-2 text-uppercase" style={{ fontSize: '12px', letterSpacing: '1px', color: '#7c3aed' }}>Total Revenue</p>
                        <h2 className="fw-bold mb-3" style={{ color: '#4c1d95', fontSize: '32px', letterSpacing: '-1px' }}>
                          ₹{(stats.totalIncome || 0).toLocaleString('en-IN')}
                        </h2>
                        <span className="badge mx-auto px-3 py-2 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#059669', fontSize: '12px' }}>
                          <i className="ti ti-arrow-up-right me-1" /> + 25.8% vs last month
                        </span>
                      </div>
                    </div>
                    <div className="col-md-7">
                      <div className="row g-3">
                        {[
                          { label: 'Consultation', val: revenueBreakdown.consultation, pct: '+18.5%', color: '#10b981', trend: 'up' },
                          { label: 'Procedures', val: revenueBreakdown.procedures, pct: '+32.1%', color: '#3b82f6', trend: 'up' },
                          { label: 'Products', val: revenueBreakdown.products, pct: '+12.3%', color: '#f59e0b', trend: 'up' },
                          { label: 'Discounts', val: revenueBreakdown.discounts, pct: '-5.2%', color: '#ef4444', trend: 'down' }
                        ].map(item => (
                          <div key={item.label} className="col-6">
                            <div className="p-3 rounded-4 bg-white" style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                              <p className="mb-1 text-muted fw-semibold" style={{ fontSize: '12px' }}>{item.label}</p>
                              <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: '16px' }}>₹{item.val.toLocaleString('en-IN')}</h6>
                              <span className="fw-bold" style={{ fontSize: '11px', color: item.color }}>
                                <i className={\`ti ti-arrow-\${item.trend}\`} /> {item.pct}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Overview Chart */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#eff6ff', color: '#3b82f6', boxShadow: 'none' }}>
                      <i className="ti ti-chart-donut" />
                    </div>
                    Appointment Overview
                  </h3>
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">This Month</span>
                </div>
                <div className="analytic-card-body d-flex flex-column flex-md-row align-items-center gap-4">
                  <div className="flex-shrink-0" style={{ width: '220px' }}>
                    <Chart 
                      key={appointmentStats.total}
                      options={{
                        chart: { type: 'donut', sparkline: { enabled: true } },
                        colors: ['#3b82f6', '#6366f1', '#0d9488', '#10b981', '#ef4444'],
                        labels: ['Scheduled', 'Confirmed', 'Checked In', 'Checked Out', 'No Show'],
                        plotOptions: { pie: { donut: { size: '75%', labels: { show: true, name: { color: '#64748b' }, value: { color: '#0f172a', fontWeight: 800 }, total: { show: true, label: 'Total', color: '#64748b' } } } } }
                      }}
                      series={[appointmentStats.scheduled, appointmentStats.confirmed, appointmentStats.checkedIn, appointmentStats.checkedOut, appointmentStats.noShow]}
                      type="donut" height={220} 
                    />
                  </div>
                  <div className="flex-grow-1 w-100">
                    <div className="row g-3">
                      {[
                        { label: 'Completed', val: completedAppointmentsCount, pct: appointmentStats.checkedOutPercent, color: '#10b981' },
                        { label: 'Scheduled', val: appointmentStats.scheduled, pct: appointmentStats.scheduledPercent, color: '#3b82f6' },
                        { label: 'Confirmed', val: appointmentStats.confirmed, pct: appointmentStats.confirmedPercent, color: '#6366f1' },
                        { label: 'No Show', val: noShowAppointmentsCount, pct: appointmentStats.noShowPercent, color: '#ef4444' }
                      ].map(item => (
                        <div key={item.label} className="col-sm-6">
                          <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-semibold text-muted" style={{ fontSize: '13px' }}>
                                <span className="d-inline-block rounded-circle me-2" style={{ width: 8, height: 8, background: item.color }} />
                                {item.label}
                              </span>
                              <span className="fw-bold text-dark">{item.val}</span>
                            </div>
                            <div className="progress" style={{ height: 4, background: '#e2e8f0' }}>
                              <div className="progress-bar" style={{ width: \`\${item.pct}%\`, background: item.color, borderRadius: 4 }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary & Top Services */}
              <div className="row g-4">
                {/* Financial Summary */}
                <div className="col-md-6">
                  <div className="analytic-card h-100">
                    <div className="analytic-card-header border-0 pb-0">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#ecfdf5', color: '#059669', boxShadow: 'none' }}>
                          <i className="ti ti-wallet" />
                        </div>
                        Financial Summary
                      </h3>
                    </div>
                    <div className="analytic-card-body pt-3">
                      <div className="mb-4">
                        <p className="text-muted fw-semibold mb-1 fs-12 text-uppercase">Net Profit</p>
                        <h2 className="fw-bold mb-0" style={{ color: stats.netProfit >= 0 ? '#059669' : '#e11d48', fontSize: '28px', letterSpacing: '-0.5px' }}>
                          {stats.netProfit >= 0 ? '+' : '-'}₹{Math.abs(stats.netProfit || 0).toLocaleString('en-IN')}
                        </h2>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: '#f0fdfa' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#ccfbf1', color: '#0d9488' }}>
                              <i className="ti ti-trending-up fs-18" />
                            </div>
                            <div>
                              <p className="mb-0 fw-semibold text-muted fs-12">Total Income</p>
                              <p className="mb-0 fw-bold text-dark fs-15">₹{stats.totalIncome?.toLocaleString('en-IN') || '0'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: '#fef2f2' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#fee2e2', color: '#e11d48' }}>
                              <i className="ti ti-trending-down fs-18" />
                            </div>
                            <div>
                              <p className="mb-0 fw-semibold text-muted fs-12">Total Expense</p>
                              <p className="mb-0 fw-bold text-dark fs-15">₹{stats.totalExpense?.toLocaleString('en-IN') || '0'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Services */}
                <div className="col-md-6">
                  <div className="analytic-card h-100">
                    <div className="analytic-card-header border-0 pb-0">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#f3e8ff', color: '#7c3aed', boxShadow: 'none' }}>
                          <i className="ti ti-medical-cross" />
                        </div>
                        Top Services
                      </h3>
                    </div>
                    <div className="analytic-card-body pt-3">
                      <div className="d-flex flex-column gap-3">
                        {topServicesList.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted mb-0 fs-14">No services utilized yet</p>
                          </div>
                        ) : (
                          topServicesList.slice(0, 4).map((service: any) => (
                            <div key={service.name} className="d-flex align-items-center justify-content-between">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <span className="fw-semibold text-dark fs-14">{service.name}</span>
                                  <span className="fw-bold text-dark fs-14">{service.count}</span>
                                </div>
                                <div className="progress" style={{ height: '6px', background: '#f1f5f9' }}>
                                  <div className="progress-bar rounded-pill" style={{ width: \`\${Math.min(100, (service.count / 50) * 100)}%\`, background: '#8b5cf6' }} />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Registrations (RESTORED) */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#eff6ff', color: '#3b82f6', boxShadow: 'none' }}>
                      <i className="ti ti-user-plus" />
                    </div>
                    Recent Registrations
                  </h3>
                  <Link to={all_routes.patients} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-0">
                  {recentRegistrationsList.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ti ti-users fs-40 mb-3 d-block" style={{ color: '#cbd5e1' }} />
                      <p className="text-muted fw-medium fs-14">No recent registrations</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          {recentRegistrationsList.map((patient: any) => {
                            const initials = \`\${patient.firstName?.charAt(0) || ''}\${patient.lastName?.charAt(0) || ''}\`.toUpperCase();
                            return (
                              <tr key={patient.id} className="border-bottom">
                                <td className="ps-4 py-3">
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', background: '#f8fafc', color: '#4f46e5', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                                      {initials}
                                    </div>
                                    <div>
                                      <h6 className="mb-0 fw-bold text-dark fs-14">{patient.firstName} {patient.lastName}</h6>
                                      <span className="text-muted fs-12">New Patient</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="pe-4 py-3 text-end align-middle">
                                  <span className="text-muted fs-12 fw-medium">
                                    <i className="ti ti-calendar me-1" />
                                    {dayjs(patient.createdAt).format('DD MMM YYYY')}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (30%) */}
            <div className="col-xl-4 col-lg-12 fade-in-up delay-3">
              
              {/* Quick Actions (RESTORED - 6 Items Premium Grid) */}
              <div className="analytic-card">
                <div className="analytic-card-header border-0 pb-2">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                      <i className="ti ti-bolt" />
                    </div>
                    Quick Actions
                  </h3>
                </div>
                <div className="analytic-card-body p-3 pt-0">
                  <div className="row g-2">
                    <div className="col-4">
                      <Link to={all_routes.addDoctors} className="action-pill">
                        <div className="action-pill-icon" style={{ color: '#3b82f6' }}><i className="ti ti-user-plus" /></div>
                        <span className="action-pill-text">Doctor</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link to={all_routes.createPatient} className="action-pill">
                        <div className="action-pill-icon" style={{ color: '#ef4444' }}><i className="ti ti-user-check" /></div>
                        <span className="action-pill-text">Patient</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <button onClick={() => setShowAddAppointment(true)} className="action-pill border-0" style={{ background: '#ecfdf5' }}>
                        <div className="action-pill-icon" style={{ color: '#10b981' }}><i className="ti ti-calendar-plus" /></div>
                        <span className="action-pill-text" style={{ color: '#059669' }}>Appt</span>
                      </button>
                    </div>
                    <div className="col-4">
                      <Link to={all_routes.hrmDepartments} className="action-pill">
                        <div className="action-pill-icon" style={{ color: '#06b6d4' }}><i className="ti ti-building-bank" /></div>
                        <span className="action-pill-text">Dept</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link to={all_routes.designation} className="action-pill">
                        <div className="action-pill-icon" style={{ color: '#f59e0b' }}><i className="ti ti-user-cog" /></div>
                        <span className="action-pill-text">Desig</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link to={all_routes.specializations} className="action-pill">
                        <div className="action-pill-icon" style={{ color: '#8b5cf6' }}><i className="ti ti-user-shield" /></div>
                        <span className="action-pill-text">Spec</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Attendance (RESTORED) */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fef3c7', color: '#d97706', boxShadow: 'none' }}>
                      <i className="ti ti-user-check" />
                    </div>
                    Staff Attendance
                  </h3>
                  <Link to={all_routes.attendance} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body d-flex align-items-center justify-content-between p-4">
                  <div className="flex-shrink-0" style={{ width: '130px' }}>
                    <Chart options={staffChartOptions} series={[staffAttendanceStats.percentage]} type="radialBar" height={160} />
                  </div>
                  <div className="flex-grow-1 ps-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                      <span className="text-muted fw-semibold fs-13">Total Staff</span>
                      <span className="fw-bold text-dark fs-14">{staffAttendanceStats.total}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                      <span className="text-muted fw-semibold fs-13"><span className="d-inline-block rounded-circle me-2" style={{ width: 8, height: 8, background: '#6366f1' }} />Present</span>
                      <span className="fw-bold fs-14" style={{ color: '#6366f1' }}>{staffAttendanceStats.present}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted fw-semibold fs-13"><span className="d-inline-block rounded-circle me-2" style={{ width: 8, height: 8, background: '#cbd5e1' }} />Absent</span>
                      <span className="fw-bold text-muted fs-14">{staffAttendanceStats.absent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Schedule List */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#eff6ff', color: '#2563eb', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-event" />
                    </div>
                    Today's Schedule
                  </h3>
                  <Link to={all_routes.appointments} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body" style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '12px' }}>
                  {todayAppointmentsList.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="ti ti-calendar-off fs-40 mb-3 d-block" style={{ color: '#cbd5e1' }} />
                      <p className="text-muted fw-medium fs-14">No appointments scheduled today.</p>
                    </div>
                  ) : (
                    todayAppointmentsList.slice(0, 5).map((app: any) => {
                      const initials = \`\${app.patient?.firstName?.charAt(0) || ''}\${app.patient?.lastName?.charAt(0) || ''}\`.toUpperCase();
                      return (
                        <div key={app.id} className="appt-list-item d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', background: '#f1f5f9', color: '#475569', fontSize: '14px' }}>
                              {initials || 'PT'}
                            </div>
                            <div>
                              <h6 className="mb-1 fw-bold text-dark fs-14">{app.patient?.firstName} {app.patient?.lastName}</h6>
                              <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px' }}>
                                <i className="ti ti-clock" /> {dayjs(app.scheduledAt).format('hh:mm A')}
                              </div>
                            </div>
                          </div>
                          <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ 
                            background: app.status === 'Completed' ? '#dcfce7' : '#eff6ff', 
                            color: app.status === 'Completed' ? '#16a34a' : '#2563eb',
                            fontSize: '11px' 
                          }}>
                            {app.status}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Holidays (RESTORED) */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fff7ed', color: '#ea580c', boxShadow: 'none' }}>
                      <i className="ti ti-beach" />
                    </div>
                    Upcoming Holidays
                  </h3>
                </div>
                <div className="analytic-card-body" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '12px' }}>
                  {holidays.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="ti ti-calendar-off fs-40 mb-3 d-block" style={{ color: '#cbd5e1' }} />
                      <p className="text-muted fw-medium fs-14">No holidays scheduled.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {holidays.map((h: any) => (
                        <div key={h.id} className="p-3 rounded-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                          <h6 className="fw-bold mb-1 fs-14 text-dark">{h.title}</h6>
                          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px' }}>
                            <i className="ti ti-calendar" />
                            {dayjs(h.date).format('MMM DD, YYYY')} {h.endDate && \`- \${dayjs(h.endDate).format('MMM DD, YYYY')}\`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Holiday Calendar (RESTORED) */}
              <div className="analytic-card">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#fce7f3', color: '#db2777', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-heart" />
                    </div>
                    Holiday Calendar
                  </h3>
                  <Link to={all_routes.holidays} className="btn-link text-decoration-none fs-13">View All</Link>
                </div>
                <div className="analytic-card-body p-3">
                  <div className="premium-calendar-wrapper">
                    <Calendar fullscreen={false} cellRender={cellRender} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      <div className={\`modal custom-modal fade \${showAddAppointment ? "show d-block" : "d-none"}\`} role="dialog" style={{ zIndex: 1055, background: showAddAppointment ? 'rgba(15,23,42,0.4)' : 'transparent', backdropFilter: 'blur(4px)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center bg-white">
              <h5 className="modal-title fw-bold fs-20 text-dark">Schedule Appointment</h5>
              <button type="button" className="btn-close shadow-none" onClick={() => setShowAddAppointment(false)}></button>
            </div>
            <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {showAddAppointment && (
                <AppointmentFormPage
                  mode="create"
                  isModal={true}
                  onSuccess={() => setShowAddAppointment(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
`;

fs.writeFileSync('c:\\Users\\somya\\OneDrive\\Desktop\\projects\\docyatri\\clinic-product-frontend\\src\\feature-module\\components\\pages\\dashboard\\dashboard.tsx', topPart + newReturn);
console.log('Restored elements perfectly!');