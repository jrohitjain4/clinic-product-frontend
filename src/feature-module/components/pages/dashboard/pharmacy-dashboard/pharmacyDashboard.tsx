import { useState } from "react";
import { Link } from "react-router";
import dayjs from "dayjs";
import { usePharmacyDashboard } from "../../../../../core/hooks/usePharmacyDashboard";
import { all_routes } from "../../../../routes/all_routes";
import CreatePharmacyBillModal from "./CreatePharmacyBillModal";

const routes = all_routes;

const PharmacyDashboard = () => {
  const { stats, loading, refetch } = usePharmacyDashboard();
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);

  const statCards = [
    {
      title: "Total Bills",
      value: stats?.totalBills ?? 0,
      icon: "ti-receipt",
      bg: "#6366f1",
      iconBg: "#e0e7ff",
      iconColor: "#4338ca",
      badge: "All Time",
      badgeColor: "#6366f1", badgeBg: "#e0e7ff", badgeBorder: "#c7d2fe",
      sub: "All pharmacy invoices",
    },
    {
      title: "Today's Bills",
      value: stats?.todayBills ?? 0,
      icon: "ti-calendar-event",
      bg: "#3b82f6",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      badge: "Today",
      badgeColor: "#3b82f6", badgeBg: "#eff6ff", badgeBorder: "#bfdbfe",
      sub: "Bills generated today",
    },
    {
      title: "Paid Bills",
      value: stats?.paidBills ?? 0,
      icon: "ti-circle-check",
      bg: "#10b981",
      iconBg: "#d1fae5",
      iconColor: "#059669",
      badge: "Paid",
      badgeColor: "#10b981", badgeBg: "#ecfdf5", badgeBorder: "#a7f3d0",
      sub: "Successfully paid",
    },
    {
      title: "Unpaid Bills",
      value: stats?.unpaidBills ?? 0,
      icon: "ti-clock",
      bg: "#f97316",
      iconBg: "#ffedd5",
      iconColor: "#c2410c",
      badge: "Unpaid",
      badgeColor: "#f97316", badgeBg: "#fff7ed", badgeBorder: "#fed7aa",
      sub: "Pending collection",
    },
    {
      title: "Today's Revenue",
      value: `₹${(stats?.todayRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-currency-rupee",
      bg: "#0d9488",
      iconBg: "#ccfbf1",
      iconColor: "#0f766e",
      badge: "Today",
      badgeColor: "#0d9488", badgeBg: "#f0fdfa", badgeBorder: "#99f6e4",
      sub: "Revenue collected today",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-cash",
      bg: "#2563eb",
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      badge: "Total",
      badgeColor: "#2563eb", badgeBg: "#dbeafe", badgeBorder: "#bfdbfe",
      sub: "All time pharmacy revenue",
    },
    {
      title: "Total Medicines",
      value: stats?.totalMedicines ?? 0,
      icon: "ti-pill",
      bg: "#8b5cf6",
      iconBg: "#f3e8ff",
      iconColor: "#7c3aed",
      badge: "Active",
      badgeColor: "#8b5cf6", badgeBg: "#f5f3ff", badgeBorder: "#ddd6fe",
      sub: "Active medicines in stock",
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStockCount ?? 0,
      icon: "ti-alert-triangle",
      bg: "#ef4444",
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      badge: "Alert",
      badgeColor: "#ef4444", badgeBg: "#fef2f2", badgeBorder: "#fecaca",
      sub: "Medicines with zero stock",
    },
  ];

  return (
    <>
      <div className="page-wrapper ph-dashboard-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          .ph-dashboard-wrapper {
            background-color: #F8FAFC !important;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            color: #0f172a;
          }
          .ph-dashboard-wrapper .content {
            background: transparent !important;
            padding: 32px 32px 20px 32px !important;
            max-width: 1600px;
            margin: 0 auto;
          }

          /* Premium Hero Cards */
          .ph-dashboard-wrapper .hero-card {
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
          .ph-dashboard-wrapper .hero-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
            border-color: rgba(203, 213, 225, 1);
          }
          .ph-dashboard-wrapper .hero-card-bg-glow {
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
          .ph-dashboard-wrapper .hero-icon-box {
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
            flex-shrink: 0;
          }
          .ph-dashboard-wrapper .hero-val {
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
          .ph-dashboard-wrapper .hero-title {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 1;
            position: relative;
          }
          .ph-dashboard-wrapper .hero-sub {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
            z-index: 1;
            position: relative;
          }

          /* Analytics Cards */
          .ph-dashboard-wrapper .analytic-card {
            background: #ffffff;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 20px;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
            margin-bottom: 0;
            overflow: hidden;
            transition: all 0.3s ease;
            height: auto;
          }
          .ph-dashboard-wrapper .analytic-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
            border-color: rgba(203, 213, 225, 1);
          }
          .ph-dashboard-wrapper .analytic-card-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(241, 245, 249, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
          }
          .ph-dashboard-wrapper .analytic-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ph-dashboard-wrapper .analytic-card-body {
            padding: 24px;
          }
          .ph-dashboard-wrapper .ph-bill-overview-card {
            min-height: 360px;
          }
          .ph-dashboard-wrapper .ph-bill-overview-body {
            min-height: 290px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 20px;
          }

          .ph-dashboard-wrapper .btn-link {
            color: #4f46e5 !important;
            font-weight: 600 !important;
            transition: all 0.2s ease;
          }
          .ph-dashboard-wrapper .btn-link:hover {
            color: #3730a3 !important;
          }

          .ph-sale-row:hover { background: #f8fafc; }

          .ph-quick-link {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 14px !important;
            background: #ffffff !important;
          }
          .ph-quick-link:hover {
            background: #f8fafc !important;
            border-color: #6366f1 !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.1);
          }
          .ph-quick-link:hover span { color: #4f46e5; }

          /* Animations */
          .ph-dashboard-wrapper .fade-in-up {
            animation: phFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
          }
          @keyframes phFadeInUp {
            to { opacity: 1; transform: translateY(0); }
          }
          .ph-dashboard-wrapper .delay-1 { animation-delay: 0.1s; }
          .ph-dashboard-wrapper .delay-2 { animation-delay: 0.2s; }
          .ph-dashboard-wrapper .delay-3 { animation-delay: 0.3s; }
          .ph-dashboard-wrapper .delay-4 { animation-delay: 0.4s; }

          .ph-dashboard-wrapper .btn-premium {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
            font-weight: 600 !important;
            padding: 10px 20px !important;
            border-radius: 10px !important;
            transition: all 0.3s ease !important;
          }
          .ph-dashboard-wrapper .btn-premium:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35) !important;
            color: white !important;
          }
        `}</style>

        <div className="content pb-0">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 fade-in-up flex-wrap gap-3">
            <div>
              <h1 className="fw-bold mb-1" style={{ fontSize: "32px", letterSpacing: "-0.5px", color: "#0f172a" }}>
                Pharmacy Dashboard
              </h1>
              <p className="mb-0" style={{ color: "#64748b", fontSize: "15px" }}>
                Here's what's happening in your pharmacy today.
              </p>
            </div>
            <button
              type="button"
              className="btn-premium d-flex align-items-center gap-2"
              onClick={() => setShowCreateBillModal(true)}
            >
              <i className="ti ti-plus fs-16" /> Create Bill
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Alerts row */}
              {((stats?.expiredCount ?? 0) > 0 || (stats?.outOfStockCount ?? 0) > 0) && (
                <div className="row g-3 mb-4 fade-in-up delay-1">
                  {(stats?.expiredCount ?? 0) > 0 && (
                    <div className="col-md-6 col-12">
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 py-2 px-3" style={{ fontSize: "13px", borderRadius: "14px", border: "1px solid #fecaca" }}>
                        <i className="ti ti-calendar-x fs-18 flex-shrink-0" />
                        <div>
                          <strong>{stats?.expiredCount} expired medicine{(stats?.expiredCount ?? 0) > 1 ? "s" : ""}</strong> in stock — remove them to prevent sale errors.
                        </div>
                      </div>
                    </div>
                  )}
                  {(stats?.outOfStockCount ?? 0) > 0 && (
                    <div className="col-md-6 col-12">
                      <div className="alert alert-warning d-flex align-items-center gap-2 mb-0 py-2 px-3" style={{ fontSize: "13px", borderRadius: "14px", border: "1px solid #fde68a" }}>
                        <i className="ti ti-alert-triangle fs-18 flex-shrink-0" />
                        <div>
                          <strong>{stats?.outOfStockCount} medicine{(stats?.outOfStockCount ?? 0) > 1 ? "s" : ""} out of stock</strong> — restock needed.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 1 — Stat Cards */}
              <div className="row g-4 mb-4">
                {statCards.slice(0, 4).map((card, i) => (
                  <div className={`col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12 fade-in-up delay-${(i % 4) + 1}`} key={i}>
                    <div className="hero-card">
                      <div className="hero-card-bg-glow" style={{ background: card.bg }} />
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="hero-icon-box" style={{ background: card.iconBg, color: card.iconColor }}>
                          <i className={`ti ${card.icon}`} />
                        </div>
                        <span className="badge fw-semibold" style={{ color: card.badgeColor, backgroundColor: card.badgeBg, border: `1px solid ${card.badgeBorder}`, borderRadius: "6px", padding: "4px 8px", fontSize: "10px", zIndex: 1, position: "relative" }}>{card.badge}</span>
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
                        <div className="hero-icon-box" style={{ background: card.iconBg, color: card.iconColor }}>
                          <i className={`ti ${card.icon}`} />
                        </div>
                        <span className="badge fw-semibold" style={{ color: card.badgeColor, backgroundColor: card.badgeBg, border: `1px solid ${card.badgeBorder}`, borderRadius: "6px", padding: "4px 8px", fontSize: "10px", zIndex: 1, position: "relative" }}>{card.badge}</span>
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

              {/* Row 2 — Recent Sales + Side Panels */}
              <div className="row g-4 mb-4">
                {/* Recent Sales */}
                <div className="col-xl-8 col-12 fade-in-up delay-2 d-flex">
                  <div className="analytic-card h-100 w-100">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: "32px", height: "32px", fontSize: "16px", background: "#e0e7ff", color: "#4f46e5", boxShadow: "none" }}>
                          <i className="ti ti-receipt" />
                        </div>
                        Recent Sales
                      </h3>
                      <Link to={routes.pharmacySalesHistory} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: "#4f46e5", fontSize: "13px" }}>View All</Link>
                    </div>
                    <div className="analytic-card-body">
                      {stats?.recentSales && stats.recentSales.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table mb-0" style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>
                            <thead>
                              <tr style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th className="border-0 pb-2 fw-semibold">Patient</th>
                                <th className="border-0 pb-2 fw-semibold">Invoice</th>
                                <th className="border-0 pb-2 fw-semibold">Medicines</th>
                                <th className="border-0 pb-2 fw-semibold">Date</th>
                                <th className="border-0 pb-2 fw-semibold text-end">Amount</th>
                                <th className="border-0 pb-2 fw-semibold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recentSales.map((sale, idx) => {
                                const name = sale.patient ? `${sale.patient.firstName} ${sale.patient.lastName}` : sale.customerName || "Walk-in";
                                const initials = name.slice(0, 2).toUpperCase();
                                const avatarBgColors = ["#f5f3ff", "#ecfdf5", "#eff6ff", "#fff7ed", "#fdf2f8"];
                                const avatarTextColors = ["#8b5cf6", "#10b981", "#3b82f6", "#f97316", "#ec4899"];
                                const ci = (name.charCodeAt(0) || 0) % avatarBgColors.length;
                                return (
                                  <tr key={idx} className="ph-sale-row">
                                    <td className="border-0 py-2">
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold" style={{ width: "32px", height: "32px", backgroundColor: avatarBgColors[ci], color: avatarTextColors[ci], fontSize: "11px" }}>
                                          {initials}
                                        </div>
                                        <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>{name}</span>
                                      </div>
                                    </td>
                                    <td className="border-0 py-2 text-primary fw-bold" style={{ fontSize: "13px" }}>{sale.invoiceNo}</td>
                                    <td className="border-0 py-2 text-dark" style={{ fontSize: "12px" }}>
                                      {sale.items?.map(it => it.medicineName).join(", ").slice(0, 30) || "—"}
                                      {(sale.items?.map(it => it.medicineName).join(", ") || "").length > 30 ? "…" : ""}
                                    </td>
                                    <td className="border-0 py-2 text-dark" style={{ fontSize: "12px" }}>{dayjs(sale.invoiceDate).format("DD MMM, hh:mm A")}</td>
                                    <td className="border-0 py-2 text-end fw-bold text-dark" style={{ fontSize: "13px" }}>₹{Number(sale.totalAmount).toLocaleString("en-IN")}</td>
                                    <td className="border-0 py-2 text-center">
                                      <span className="badge fw-semibold" style={{
                                        backgroundColor: sale.paymentStatus === "Paid" ? "#ecfdf5" : "#fff7ed",
                                        color: sale.paymentStatus === "Paid" ? "#10b981" : "#f97316",
                                        border: `1px solid ${sale.paymentStatus === "Paid" ? "#a7f3d0" : "#fed7aa"}`,
                                        borderRadius: "6px", padding: "3px 8px", fontSize: "10px"
                                      }}>{sale.paymentStatus}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ti ti-receipt-off fs-48 text-muted mb-3 d-inline-block" />
                          <p className="text-muted mb-0 fw-medium">No sales yet</p>
                          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>Bills created will appear here</p>
                        </div>
                      )}
                      {stats?.recentSales && stats.recentSales.length > 0 && (
                        <Link to={routes.pharmacySalesHistory} className="d-flex align-items-center justify-content-between text-decoration-none border-top pt-3 mt-3" style={{ color: "#4f46e5", fontWeight: 600, fontSize: "12px" }}>
                          <span>View all sales</span>
                          <i className="ti ti-arrow-right fs-16" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-xl-4 col-12 fade-in-up delay-3">
                  {/* Bill Overview */}
                  <div className="analytic-card ph-bill-overview-card mb-4">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: "32px", height: "32px", fontSize: "16px", background: "#dbeafe", color: "#2563eb", boxShadow: "none" }}>
                          <i className="ti ti-chart-donut" />
                        </div>
                        Bill Overview
                      </h3>
                    </div>
                    <div className="analytic-card-body ph-bill-overview-body">
                      <div className="d-flex flex-column gap-2">
                        {[
                          { label: "Paid", val: stats?.paidBills ?? 0, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
                          { label: "Unpaid", val: stats?.unpaidBills ?? 0, color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
                          { label: "Today's Bills", val: stats?.todayBills ?? 0, color: "#6366f1", bg: "#f5f3ff", border: "#ddd6fe" },
                          { label: "Out of Stock", val: stats?.outOfStockCount ?? 0, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                        ].map((item, i) => {
                          const total = Math.max(stats?.totalBills || 1, 1);
                          const pct = Math.min(100, Math.round((item.val / total) * 100));
                          return (
                            <div key={i}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="rounded-circle" style={{ width: "8px", height: "8px", backgroundColor: item.color, display: "inline-block" }} />
                                  <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>{item.label}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{item.val}</span>
                                  <span className="badge fw-semibold" style={{ color: item.color, backgroundColor: item.bg, border: `1px solid ${item.border}`, borderRadius: "6px", padding: "2px 6px", fontSize: "10px" }}>{pct}%</span>
                                </div>
                              </div>
                              <div className="progress" style={{ height: "5px", borderRadius: "3px", backgroundColor: "#f1f5f9" }}>
                                <div className="progress-bar" role="progressbar" style={{ width: `${pct}%`, backgroundColor: item.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-3 rounded-3 mt-3 d-flex justify-content-between align-items-center" style={{ fontSize: "11px", background: "#f8fafc", border: "1px solid rgba(226,232,240,0.8)" }}>
                        <div>
                          <span className="text-muted d-block" style={{ fontSize: "9px" }}>Today's Revenue</span>
                          <strong className="text-success" style={{ fontSize: "11px" }}>₹{(stats?.todayRevenue ?? 0).toLocaleString("en-IN")}</strong>
                        </div>
                        <div className="text-end">
                          <span className="text-muted d-block" style={{ fontSize: "9px" }}>Total Revenue</span>
                          <strong className="text-dark" style={{ fontSize: "11px" }}>₹{(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Alert */}
                  <div className="analytic-card">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: "32px", height: "32px", fontSize: "16px", background: "#fef3c7", color: "#d97706", boxShadow: "none" }}>
                          <i className="ti ti-alert-circle" />
                        </div>
                        Low Stock
                      </h3>
                      {(stats?.lowStockMedicines?.length ?? 0) > 0 && (
                        <span className="badge bg-warning-subtle text-warning border border-warning fw-semibold" style={{ fontSize: "10px" }}>
                          {stats?.lowStockMedicines?.length} medicines
                        </span>
                      )}
                    </div>
                    <div className="analytic-card-body">
                      {stats?.lowStockMedicines && stats.lowStockMedicines.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {stats.lowStockMedicines.slice(0, 6).map((med, idx) => (
                            <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px" }}>
                              <div>
                                <span className="fw-semibold text-dark d-block" style={{ fontSize: "12px" }}>{med.medicineName}</span>
                                <span className="text-muted" style={{ fontSize: "10px" }}>{med.medicineCode || med.category?.name || "—"}</span>
                              </div>
                              <div className="text-end">
                                <span className="fw-bold text-danger d-block" style={{ fontSize: "13px" }}>{med.currentStock}</span>
                                <span className="text-muted" style={{ fontSize: "9px" }}>Min: {med.minimumStockAlert}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i className="ti ti-circle-check fs-32 text-success mb-2 d-inline-block" />
                          <p className="text-muted mb-0" style={{ fontSize: "12px" }}>All medicines well stocked</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3 — Expired Medicines */}
              {(stats?.expiredMedicines?.length ?? 0) > 0 && (
                <div className="row g-4 mb-4 fade-in-up delay-3">
                  <div className="col-12">
                    <div className="analytic-card" style={{ borderLeft: "4px solid #ef4444" }}>
                      <div className="analytic-card-header">
                        <h3 className="analytic-card-title">
                          <div className="hero-icon-box" style={{ width: "32px", height: "32px", fontSize: "16px", background: "#fee2e2", color: "#ef4444", boxShadow: "none" }}>
                            <i className="ti ti-calendar-x" />
                          </div>
                          Expired Medicines
                          <span className="badge bg-danger-subtle text-danger border border-danger fw-semibold ms-1" style={{ fontSize: "10px" }}>
                            {stats?.expiredMedicines?.length} items
                          </span>
                        </h3>
                        <Link to={routes.pharmacyMedicines} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: "#ef4444", fontSize: "13px" }}>Manage →</Link>
                      </div>
                      <div className="analytic-card-body">
                        <div className="table-responsive">
                          <table className="table mb-0" style={{ fontSize: "12px" }}>
                            <thead>
                              <tr style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>
                                <th className="border-0 fw-semibold pb-2">Medicine</th>
                                <th className="border-0 fw-semibold pb-2">Category</th>
                                <th className="border-0 fw-semibold pb-2">SKU</th>
                                <th className="border-0 fw-semibold pb-2">Stock</th>
                                <th className="border-0 fw-semibold pb-2">Expired On</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats?.expiredMedicines?.slice(0, 5).map((med, idx) => (
                                <tr key={idx}>
                                  <td className="border-0 py-1 fw-semibold text-danger">{med.medicineName}</td>
                                  <td className="border-0 py-1 text-dark">{med.category?.name || "—"}</td>
                                  <td className="border-0 py-1 text-muted">{med.medicineCode || "—"}</td>
                                  <td className="border-0 py-1">
                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary fw-semibold" style={{ fontSize: "10px" }}>{med.currentStock} units</span>
                                  </td>
                                  <td className="border-0 py-1 text-danger fw-medium">{dayjs(med.expiryDate).format("DD MMM YYYY")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4 — Quick Links */}
              <div className="row g-4 mb-4 fade-in-up delay-4">
                <div className="col-12">
                  <div className="analytic-card">
                    <div className="analytic-card-header">
                      <h3 className="analytic-card-title">
                        <div className="hero-icon-box" style={{ width: "32px", height: "32px", fontSize: "16px", background: "#ecfdf5", color: "#059669", boxShadow: "none" }}>
                          <i className="ti ti-link" />
                        </div>
                        Quick Links
                      </h3>
                    </div>
                    <div className="analytic-card-body">
                      <div className="d-flex flex-wrap gap-3 align-items-stretch">
                        {[
                          { to: routes.pharmacyCategories, icon: "ti-tags", color: "#6366f1", bg: "#f5f3ff", label: "Category Management", sub: "Manage medicine categories" },
                          { to: routes.pharmacyMedicines, icon: "ti-pill", color: "#3b82f6", bg: "#eff6ff", label: "Medicines", sub: "View & manage medicines" },
                          { to: routes.pharmacyInventory, icon: "ti-package", color: "#10b981", bg: "#ecfdf5", label: "Inventory", sub: "Check stock levels" },
                          { to: routes.pharmacyBilling, icon: "ti-file-invoice", color: "#f97316", bg: "#fff7ed", label: "Pharmacy Billing", sub: "Create new bills" },
                          { to: routes.pharmacySalesHistory, icon: "ti-chart-line", color: "#8b5cf6", bg: "#f5f3ff", label: "Sales History", sub: "All pharmacy invoices" },
                        ].map((link, i) => (
                          <div key={i} className="flex-fill" style={{ minWidth: "200px", flex: "1 1 0px" }}>
                            <Link to={link.to} className="ph-quick-link d-flex align-items-center gap-3 p-3 h-100">
                              <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: link.bg, color: link.color, borderRadius: "12px" }}>
                                <i className={`ti ${link.icon} fs-20`} />
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <span className="text-dark fw-semibold d-block" style={{ fontSize: "13px" }}>{link.label}</span>
                                <span className="text-muted" style={{ fontSize: "11px" }}>{link.sub}</span>
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
          <p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      <CreatePharmacyBillModal
        open={showCreateBillModal}
        onClose={() => setShowCreateBillModal(false)}
        onCreated={() => refetch()}
      />
    </>
  );
};

export default PharmacyDashboard;
