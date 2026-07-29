import { Link } from "react-router";
import { useLabDashboard } from "../../../../../core/hooks/useLabBookings";
import dayjs from "dayjs";

const PathlabDashboard = () => {
  const { stats, loading } = useLabDashboard();

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.totalBookings ?? 0,
      icon: "ti-clipboard-list",
      bg: "#6366f1",
      badge: "All Time",
      badgeColor: "#6366f1",
      badgeBg: "#e0e7ff",
      badgeBorder: "#c7d2fe",
      sub: "All diagnostic bookings",
    },
    {
      title: "Today's Bookings",
      value: stats?.todaysBookings ?? 0,
      icon: "ti-calendar-event",
      bg: "#3b82f6",
      badge: "Today",
      badgeColor: "#3b82f6",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      sub: "Bookings scheduled today",
    },
    {
      title: "Pending Bookings",
      value: stats?.pendingBookings ?? 0,
      icon: "ti-clock",
      bg: "#f97316",
      badge: "Pending",
      badgeColor: "#f97316",
      badgeBg: "#fff7ed",
      badgeBorder: "#fed7aa",
      sub: "Awaiting confirmation",
    },
    {
      title: "Confirmed Bookings",
      value: stats?.confirmedBookings ?? 0,
      icon: "ti-circle-check",
      bg: "#8b5cf6",
      badge: "Confirmed",
      badgeColor: "#8b5cf6",
      badgeBg: "#f5f3ff",
      badgeBorder: "#ddd6fe",
      sub: "Confirmed & scheduled",
    },
    {
      title: "Completed Bookings",
      value: stats?.completedBookings ?? 0,
      icon: "ti-checkbox",
      bg: "#10b981",
      badge: "Done",
      badgeColor: "#10b981",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      sub: "Successfully completed",
    },
    {
      title: "Cancelled Bookings",
      value: stats?.cancelledBookings ?? 0,
      icon: "ti-calendar-x",
      bg: "#ef4444",
      badge: "Cancelled",
      badgeColor: "#ef4444",
      badgeBg: "#fef2f2",
      badgeBorder: "#fecaca",
      sub: "Cancelled / No Show",
    },
    {
      title: "Today's Revenue",
      value: `₹${(stats?.todaysRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-currency-rupee",
      bg: "#0d9488",
      badge: "Today",
      badgeColor: "#0d9488",
      badgeBg: "#f0fdfa",
      badgeBorder: "#99f6e4",
      sub: "Revenue collected today",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-cash",
      bg: "#2563eb",
      badge: "Total",
      badgeColor: "#2563eb",
      badgeBg: "#dbeafe",
      badgeBorder: "#bfdbfe",
      sub: "All time lab revenue",
    },
  ];

  const colors = ["#6366f1", "#10b981", "#ef4444", "#f97316", "#3b82f6", "#0d9488", "#ec4899", "#8b5cf6"];

  return (
    <>
      <div className="page-wrapper pathlab-dashboard-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          .pathlab-dashboard-wrapper {
            background-color: #F8FAFC !important;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            color: #0f172a;
          }
          .pathlab-dashboard-wrapper .content {
            background: transparent !important;
            padding: 32px 32px 20px 32px !important;
            max-width: 1600px;
            margin: 0 auto;
          }

          /* Premium Hero Cards */
          .pathlab-dashboard-wrapper .hero-card {
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
            cursor: default;
          }
          .pathlab-dashboard-wrapper .hero-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
            border-color: rgba(203, 213, 225, 1);
          }
          .pathlab-dashboard-wrapper .hero-card-bg-glow {
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
          .pathlab-dashboard-wrapper .hero-icon-box {
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
          .pathlab-dashboard-wrapper .hero-val {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
            color: #0f172a;
            margin-top: 16px;
            margin-bottom: 4px;
            z-index: 1;
            position: relative;
            line-height: 1.1;
          }
          .pathlab-dashboard-wrapper .hero-title {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 1;
            position: relative;
          }
          .pathlab-dashboard-wrapper .hero-sub {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 6px;
            z-index: 1;
            position: relative;
          }

          /* Analytics Cards */
          .pathlab-dashboard-wrapper .analytic-card {
            background: #ffffff;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 20px;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
            margin-bottom: 0;
            overflow: hidden;
            transition: all 0.3s ease;
            height: auto;
          }
          .pathlab-dashboard-wrapper .analytic-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
            border-color: rgba(203, 213, 225, 1);
          }
          .pathlab-dashboard-wrapper .analytic-card-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(241, 245, 249, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
          }
          .pathlab-dashboard-wrapper .analytic-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .pathlab-dashboard-wrapper .analytic-card-body {
            padding: 24px;
          }
          .pathlab-dashboard-wrapper .pathlab-booking-overview-card {
            min-height: 360px;
          }
          .pathlab-dashboard-wrapper .pathlab-booking-overview-body {
            min-height: 290px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 20px;
          }

          .pathlab-dashboard-wrapper .dash-h-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .pathlab-dashboard-wrapper .btn-link {
            color: #4f46e5 !important;
            font-weight: 600 !important;
            transition: all 0.2s ease;
          }
          .pathlab-dashboard-wrapper .btn-link:hover {
            color: #3730a3 !important;
            text-decoration: underline !important;
          }
          .pathlab-booking-row:hover {
            background-color: #f8fafc;
          }
          .pathlab-quick-link {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 16px !important;
            background: #ffffff !important;
          }
          .pathlab-quick-link:hover {
            background: #f8fafc !important;
            border-color: #c7d2fe !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.08);
          }
          .pathlab-quick-link:hover span {
            color: #4f46e5;
          }

          /* Animations */
          .pathlab-dashboard-wrapper .fade-in-up {
            animation: pathlabFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
          }
          @keyframes pathlabFadeInUp {
            to { opacity: 1; transform: translateY(0); }
          }
          .pathlab-dashboard-wrapper .delay-1 { animation-delay: 0.1s; }
          .pathlab-dashboard-wrapper .delay-2 { animation-delay: 0.2s; }
          .pathlab-dashboard-wrapper .delay-3 { animation-delay: 0.3s; }
          .pathlab-dashboard-wrapper .delay-4 { animation-delay: 0.4s; }
        `}</style>

        <div className="content pb-0">

          {/* Page Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 fade-in-up">
            <div>
              <h1 className="fw-bold mb-1" style={{ fontSize: "32px", letterSpacing: "-0.5px", color: "#0f172a" }}>
                PathLab Dashboard
              </h1>
              <p className="mb-0" style={{ color: "#64748b", fontSize: "15px" }}>
                Here's what's happening in your lab today.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Row 1 — Stat Cards (4+4) */}
              <div className="row g-4 mb-4">
                {statCards.slice(0, 4).map((card, i) => (
                  <div className={`col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12 fade-in-up delay-${(i % 4) + 1}`} key={i}>
                    <div className="hero-card">
                      <div className="hero-card-bg-glow" style={{ background: card.bg }} />
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="hero-icon-box" style={{ background: card.badgeBg, color: card.badgeColor }}>
                          <i className={`ti ${card.icon}`} />
                        </div>
                        <span
                          className="badge fw-semibold"
                          style={{
                            color: card.badgeColor,
                            backgroundColor: card.badgeBg,
                            border: `1px solid ${card.badgeBorder}`,
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            zIndex: 1,
                            position: "relative",
                          }}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <div>
                        <div className="hero-val">{card.value}</div>
                        <div className="hero-title">{card.title}</div>
                        <div className="hero-sub">{card.sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-4 mb-4">
                {statCards.slice(4).map((card, i) => (
                  <div className={`col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12 fade-in-up delay-${(i % 4) + 1}`} key={i}>
                    <div className="hero-card">
                      <div className="hero-card-bg-glow" style={{ background: card.bg }} />
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="hero-icon-box" style={{ background: card.badgeBg, color: card.badgeColor }}>
                          <i className={`ti ${card.icon}`} />
                        </div>
                        <span
                          className="badge fw-semibold"
                          style={{
                            color: card.badgeColor,
                            backgroundColor: card.badgeBg,
                            border: `1px solid ${card.badgeBorder}`,
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            zIndex: 1,
                            position: "relative",
                          }}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <div>
                        <div className="hero-val">{card.value}</div>
                        <div className="hero-title">{card.title}</div>
                        <div className="hero-sub">{card.sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 — Recent Bookings + Side Panels */}
              <div className="row g-4 mb-4">
                {/* Recent Bookings Table */}
                <div className="col-xl-8 col-12 fade-in-up delay-2 d-flex">
                  <div className="analytic-card h-100 w-100">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <span className="dash-h-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                          <i className="ti ti-calendar-event" />
                        </span>
                        Upcoming Bookings
                      </h3>
                      <Link
                        to="/pathlab/bookings"
                        className="btn btn-sm btn-link p-0 fw-bold text-decoration-none"
                        style={{ color: "#4f46e5", fontSize: "13px" }}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="analytic-card-body p-3">
                      {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table mb-0" style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>
                            <thead>
                              <tr style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th className="border-0 pb-2 fw-semibold">Patient</th>
                                <th className="border-0 pb-2 fw-semibold">Test</th>
                                <th className="border-0 pb-2 fw-semibold">Category</th>
                                <th className="border-0 pb-2 fw-semibold">Scheduled</th>
                                <th className="border-0 pb-2 fw-semibold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recentBookings.map((bk: any, idx: number) => {
                                const initials = `${bk.patient?.firstName?.charAt(0) || ""}${bk.patient?.lastName?.charAt(0) || ""}`.toUpperCase();
                                const avatarBgColors = ["#f5f3ff", "#ecfdf5", "#eff6ff", "#fff7ed", "#fdf2f8"];
                                const avatarTextColors = ["#8b5cf6", "#10b981", "#3b82f6", "#f97316", "#ec4899"];
                                const colorIdx = (bk.patient?.firstName?.charCodeAt(0) || 0) % avatarBgColors.length;
                                return (
                                  <tr key={idx} className="pathlab-booking-row" style={{ borderRadius: "8px" }}>
                                    <td className="border-0 py-2">
                                      <div className="d-flex align-items-center gap-2">
                                        <div
                                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                                          style={{
                                            width: "32px",
                                            height: "32px",
                                            backgroundColor: avatarBgColors[colorIdx],
                                            color: avatarTextColors[colorIdx],
                                            fontSize: "11px",
                                          }}
                                        >
                                          {initials || "P"}
                                        </div>
                                        <div>
                                          <span className="fw-semibold text-dark d-block" style={{ fontSize: "13px" }}>
                                            {bk.patient ? `${bk.patient.firstName} ${bk.patient.lastName}` : "—"}
                                          </span>
                                          <span className="text-muted" style={{ fontSize: "10px" }}>
                                            {bk.patient?.patientCode || ""}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="border-0 py-2 text-dark fw-medium" style={{ fontSize: "13px" }}>
                                      {bk.test?.name || "—"}
                                    </td>
                                    <td className="border-0 py-2">
                                      <span
                                        className="badge fw-semibold"
                                        style={{
                                          backgroundColor: "#eff6ff",
                                          color: "#3b82f6",
                                          border: "1px solid #bfdbfe",
                                          borderRadius: "4px",
                                          padding: "3px 8px",
                                          fontSize: "10px",
                                        }}
                                      >
                                        {bk.test?.category?.name || "—"}
                                      </span>
                                    </td>
                                    <td className="border-0 py-2 text-dark" style={{ fontSize: "12px" }}>
                                      {dayjs(bk.scheduledAt).format("DD MMM, hh:mm A")}
                                    </td>
                                    <td className="border-0 py-2 text-center">
                                      <span
                                        className="badge fw-semibold"
                                        style={{
                                          backgroundColor:
                                            bk.status === "Completed"
                                              ? "#ecfdf5"
                                              : bk.status === "Cancelled"
                                                ? "#fef2f2"
                                                : bk.status === "Confirmed"
                                                  ? "#f5f3ff"
                                                  : "#fff7ed",
                                          color:
                                            bk.status === "Completed"
                                              ? "#10b981"
                                              : bk.status === "Cancelled"
                                                ? "#ef4444"
                                                : bk.status === "Confirmed"
                                                  ? "#6366f1"
                                                  : "#f97316",
                                          border: `1px solid ${
                                            bk.status === "Completed"
                                              ? "#a7f3d0"
                                              : bk.status === "Cancelled"
                                                ? "#fecaca"
                                                : bk.status === "Confirmed"
                                                  ? "#c7d2fe"
                                                  : "#fed7aa"
                                          }`,
                                          borderRadius: "4px",
                                          padding: "3px 8px",
                                          fontSize: "10px",
                                        }}
                                      >
                                        {bk.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ti ti-calendar-off fs-48 text-muted mb-3 d-inline-block" />
                          <p className="text-muted mb-0 fw-medium">No upcoming bookings</p>
                          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                            New bookings will appear here
                          </p>
                        </div>
                      )}

                      {stats?.recentBookings && stats.recentBookings.length > 0 && (
                        <Link
                          to="/pathlab/bookings"
                          className="d-flex align-items-center justify-content-between text-decoration-none border-top pt-3 mt-3"
                          style={{ color: "#4f46e5", fontWeight: 600, fontSize: "12px" }}
                        >
                          <span>View all bookings</span>
                          <i className="ti ti-arrow-right fs-16" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-xl-4 col-12 fade-in-up delay-3">
                  {/* Booking Status Overview */}
                  <div className="analytic-card pathlab-booking-overview-card mb-4">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <span className="dash-h-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                          <i className="ti ti-chart-donut" />
                        </span>
                        Booking Overview
                      </h3>
                    </div>
                    <div className="analytic-card-body p-3 pathlab-booking-overview-body">
                      {/* Summary pills */}
                      <div className="d-flex flex-column gap-2">
                        {[
                          { label: "Pending", val: stats?.pendingBookings ?? 0, color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
                          { label: "Confirmed", val: stats?.confirmedBookings ?? 0, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
                          { label: "Completed", val: stats?.completedBookings ?? 0, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                          { label: "Cancelled", val: stats?.cancelledBookings ?? 0, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        ].map((item, i) => {
                          const total = stats?.totalBookings || 1;
                          const pct = Math.min(100, Math.round((item.val / total) * 100));
                          return (
                            <div key={i}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    className="rounded-circle"
                                    style={{ width: "8px", height: "8px", backgroundColor: item.color, display: "inline-block" }}
                                  />
                                  <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>{item.label}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{item.val}</span>
                                  <span
                                    className="badge fw-semibold"
                                    style={{
                                      color: item.color,
                                      backgroundColor: item.bg,
                                      border: `1px solid ${item.border}`,
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontSize: "10px",
                                    }}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <div className="progress" style={{ height: "5px", borderRadius: "3px", backgroundColor: "#f1f5f9" }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: item.color,
                                    borderRadius: "3px",
                                    transition: "width 0.6s ease",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Summary box */}
                      <div
                        className="p-2 rounded-3 border bg-light mt-3 d-flex justify-content-between align-items-center"
                        style={{ fontSize: "11px" }}
                      >
                        <div>
                          <span className="text-muted d-block" style={{ fontSize: "9px" }}>
                            Completion Rate
                          </span>
                          <strong className="text-success" style={{ fontSize: "11px" }}>
                            {(stats?.totalBookings ?? 0) > 0
                              ? Math.round(((stats?.completedBookings ?? 0) / (stats?.totalBookings ?? 1)) * 100)
                              : 0}
                            %
                          </strong>
                        </div>
                        <div className="text-end">
                          <span className="text-muted d-block" style={{ fontSize: "9px" }}>
                            Total Revenue Today
                          </span>
                          <strong className="text-dark" style={{ fontSize: "11px" }}>
                            ₹{(stats?.todaysRevenue ?? 0).toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="analytic-card">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <span className="dash-h-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}>
                          <i className="ti ti-tags" />
                        </span>
                        Categories
                      </h3>
                    </div>
                    <div className="analytic-card-body p-3">
                      {stats?.categoryStats && stats.categoryStats.length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                          {stats.categoryStats.slice(0, 5).map((cat: any, idx: number) => {
                            const color = colors[idx % colors.length];
                            const maxTests = Math.max(...stats.categoryStats.map((c: any) => c._count?.tests || 0), 1);
                            const pct = Math.round(((cat._count?.tests || 0) / maxTests) * 100);
                            return (
                              <div key={idx}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <div className="d-flex align-items-center gap-2">
                                    <span
                                      className="rounded-circle"
                                      style={{ width: "8px", height: "8px", backgroundColor: color, display: "inline-block" }}
                                    />
                                    <span className="text-dark fw-medium" style={{ fontSize: "12px" }}>
                                      {cat.name}
                                    </span>
                                  </div>
                                  <span className="text-muted" style={{ fontSize: "11px" }}>
                                    {cat._count?.tests || 0} tests
                                  </span>
                                </div>
                                <div className="progress" style={{ height: "5px", borderRadius: "3px", backgroundColor: "#f1f5f9" }}>
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${pct}%`, backgroundColor: color, borderRadius: "3px" }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i className="ti ti-tags-off fs-32 text-muted mb-2 d-inline-block" />
                          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                            No categories yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3 — Quick Links */}
              <div className="row g-4 mb-4">
                <div className="col-12 fade-in-up delay-4">
                  <div className="analytic-card">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <span className="dash-h-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                          <i className="ti ti-link" />
                        </span>
                        Quick Links
                      </h3>
                    </div>
                    <div className="analytic-card-body p-3">
                      <div className="row g-2">
                        {[
                          { to: "/pathlab/categories", icon: "ti-tags", color: "#6366f1", bg: "#f5f3ff", label: "Category Management", sub: "Manage test categories" },
                          { to: "/pathlab/tests", icon: "ti-microscope", color: "#3b82f6", bg: "#eff6ff", label: "Diagnostic Tests", sub: "View & manage tests" },
                          { to: "/pathlab/bookings", icon: "ti-calendar-event", color: "#10b981", bg: "#ecfdf5", label: "Bookings", sub: "All diagnostic bookings" },
                          { to: "/pathlab/invoices", icon: "ti-file-invoice", color: "#f97316", bg: "#fff7ed", label: "Invoices", sub: "View lab invoices" },
                        ].map((link, i) => (
                          <div className="col-xxl-3 col-xl-3 col-md-6 col-12" key={i}>
                            <Link
                              to={link.to}
                              className="pathlab-quick-link d-flex align-items-center gap-3 p-3"
                              style={{ textDecoration: "none" }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                style={{ width: "40px", height: "40px", backgroundColor: link.bg, color: link.color }}
                              >
                                <i className={`ti ${link.icon} fs-20`} />
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <span className="text-dark fw-semibold d-block" style={{ fontSize: "13px" }}>
                                  {link.label}
                                </span>
                                <span className="text-muted" style={{ fontSize: "11px" }}>
                                  {link.sub}
                                </span>
                              </div>
                              <i className="ti ti-chevron-right text-muted fs-16 flex-shrink-0" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default PathlabDashboard;
