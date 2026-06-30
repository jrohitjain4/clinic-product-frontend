import { Link } from "react-router";
import dayjs from "dayjs";
import { usePharmacyDashboard } from "../../../../../core/hooks/usePharmacyDashboard";
import { all_routes } from "../../../../routes/all_routes";

const routes = all_routes;

const PharmacyDashboard = () => {
  const { stats, loading } = usePharmacyDashboard();

  const statCards = [
    {
      title: "Total Bills",
      value: stats?.totalBills ?? 0,
      icon: "ti-receipt",
      bg: "#6366f1",
      badge: "All Time",
      badgeColor: "#6366f1", badgeBg: "#e0e7ff", badgeBorder: "#c7d2fe",
      sub: "All pharmacy invoices",
    },
    {
      title: "Today's Bills",
      value: stats?.todayBills ?? 0,
      icon: "ti-calendar-event",
      bg: "#3b82f6",
      badge: "Today",
      badgeColor: "#3b82f6", badgeBg: "#eff6ff", badgeBorder: "#bfdbfe",
      sub: "Bills generated today",
    },
    {
      title: "Paid Bills",
      value: stats?.paidBills ?? 0,
      icon: "ti-circle-check",
      bg: "#10b981",
      badge: "Paid",
      badgeColor: "#10b981", badgeBg: "#ecfdf5", badgeBorder: "#a7f3d0",
      sub: "Successfully paid",
    },
    {
      title: "Unpaid Bills",
      value: stats?.unpaidBills ?? 0,
      icon: "ti-clock",
      bg: "#f97316",
      badge: "Unpaid",
      badgeColor: "#f97316", badgeBg: "#fff7ed", badgeBorder: "#fed7aa",
      sub: "Pending collection",
    },
    {
      title: "Today's Revenue",
      value: `₹${(stats?.todayRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-currency-rupee",
      bg: "#0d9488",
      badge: "Today",
      badgeColor: "#0d9488", badgeBg: "#f0fdfa", badgeBorder: "#99f6e4",
      sub: "Revenue collected today",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: "ti-cash",
      bg: "#2563eb",
      badge: "Total",
      badgeColor: "#2563eb", badgeBg: "#dbeafe", badgeBorder: "#bfdbfe",
      sub: "All time pharmacy revenue",
    },
    {
      title: "Total Medicines",
      value: stats?.totalMedicines ?? 0,
      icon: "ti-pill",
      bg: "#8b5cf6",
      badge: "Active",
      badgeColor: "#8b5cf6", badgeBg: "#f5f3ff", badgeBorder: "#ddd6fe",
      sub: "Active medicines in stock",
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStockCount ?? 0,
      icon: "ti-alert-triangle",
      bg: "#ef4444",
      badge: "Alert",
      badgeColor: "#ef4444", badgeBg: "#fef2f2", badgeBorder: "#fecaca",
      sub: "Medicines with zero stock",
    },
  ];

  return (
    <>
      <div className="page-wrapper ph-dashboard-wrapper">
        <style>{`
          .ph-dashboard-wrapper {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%) !important;
            min-height: 100vh;
          }
          .ph-dashboard-wrapper .content {
            background: transparent !important;
            padding: 15px 15px 2px 15px !important;
          }
          .ph-dashboard-wrapper .card {
            border: 1px solid #94a3b8 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04) !important;
            background-color: #ffffff;
            margin-bottom: 0 !important;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .ph-dashboard-wrapper .card:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
          }
          .ph-dashboard-wrapper .card-header {
            padding: 12px 16px !important;
            background: transparent !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .ph-dashboard-wrapper .card-body {
            padding: 14px 16px !important;
          }
          .ph-dashboard-wrapper .row {
            margin-bottom: 8px !important;
          }
          .ph-stat-card { cursor: default; }
          .ph-sale-row:hover { background: #f8fafc; }
          .ph-quick-link {
            transition: all 0.15s ease;
            text-decoration: none !important;
          }
          .ph-quick-link:hover {
            background: #f5f3ff !important;
            border-color: #6366f1 !important;
            transform: translateX(4px);
          }
          .ph-quick-link:hover span { color: #6366f1; }
        `}</style>

        <div className="content pb-0">
          {/* Header */}
          <div className="mb-3">
            <h4 className="fw-bold mb-1 fs-20">Pharmacy Dashboard 💊</h4>
            <p className="text-muted mb-0 fs-13">Here's what's happening in your pharmacy today.</p>
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
                <div className="row g-2 mb-2">
                  {(stats?.expiredCount ?? 0) > 0 && (
                    <div className="col-md-6 col-12">
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3" style={{ fontSize: "13px" }}>
                        <i className="ti ti-calendar-x fs-18 flex-shrink-0" />
                        <div>
                          <strong>{stats?.expiredCount} expired medicine{(stats?.expiredCount ?? 0) > 1 ? "s" : ""}</strong> in stock — remove them to prevent sale errors.
                        </div>
                      </div>
                    </div>
                  )}
                  {(stats?.outOfStockCount ?? 0) > 0 && (
                    <div className="col-md-6 col-12">
                      <div className="alert alert-warning d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-3" style={{ fontSize: "13px" }}>
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
              <div className="row g-2 mb-2">
                {statCards.slice(0, 4).map((card, i) => (
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12" key={i}>
                    <div className="card h-100 border-0 ph-stat-card">
                      <div className="card-body p-3 d-flex flex-column justify-content-between">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: "44px", height: "44px", backgroundColor: card.bg }}>
                              <i className={`ti ${card.icon} fs-22 text-white`} />
                            </div>
                            <div>
                              <p className="mb-0 text-muted" style={{ fontSize: "12px", fontWeight: 500 }}>{card.title}</p>
                              <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "22px" }}>{card.value}</h4>
                            </div>
                          </div>
                          <span className="badge fw-semibold" style={{ color: card.badgeColor, backgroundColor: card.badgeBg, border: `1px solid ${card.badgeBorder}`, borderRadius: "4px", padding: "3px 8px", fontSize: "10px" }}>{card.badge}</span>
                        </div>
                        <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>{card.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-2 mb-3">
                {statCards.slice(4).map((card, i) => (
                  <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12" key={i}>
                    <div className="card h-100 border-0 ph-stat-card">
                      <div className="card-body p-3 d-flex flex-column justify-content-between">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: "44px", height: "44px", backgroundColor: card.bg }}>
                              <i className={`ti ${card.icon} fs-22 text-white`} />
                            </div>
                            <div>
                              <p className="mb-0 text-muted" style={{ fontSize: "12px", fontWeight: 500 }}>{card.title}</p>
                              <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "22px" }}>{card.value}</h4>
                            </div>
                          </div>
                          <span className="badge fw-semibold" style={{ color: card.badgeColor, backgroundColor: card.badgeBg, border: `1px solid ${card.badgeBorder}`, borderRadius: "4px", padding: "3px 8px", fontSize: "10px" }}>{card.badge}</span>
                        </div>
                        <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>{card.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 — Recent Sales + Side Panels */}
              <div className="row g-3 mb-3">
                {/* Recent Sales */}
                <div className="col-xl-8 col-12">
                  <div className="card h-100 border-0">
                    <div className="card-header d-flex align-items-center justify-content-between border-0 bg-transparent py-3">
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                        <i className="ti ti-receipt text-primary me-2 fs-18" />Recent Sales
                      </h5>
                      <Link to={routes.pharmacySalesHistory} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: "#4f46e5", fontSize: "13px" }}>View All</Link>
                    </div>
                    <div className="card-body p-3">
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
                                        borderRadius: "4px", padding: "3px 8px", fontSize: "10px"
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
                <div className="col-xl-4 col-12 d-flex flex-column gap-3">
                  {/* Bill Overview */}
                  <div className="card border-0">
                    <div className="card-header border-0 bg-transparent py-3">
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                        <i className="ti ti-chart-donut text-primary me-2 fs-18" />Bill Overview
                      </h5>
                    </div>
                    <div className="card-body p-3">
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
                                  <span className="badge fw-semibold" style={{ color: item.color, backgroundColor: item.bg, border: `1px solid ${item.border}`, borderRadius: "4px", padding: "2px 6px", fontSize: "10px" }}>{pct}%</span>
                                </div>
                              </div>
                              <div className="progress" style={{ height: "5px", borderRadius: "3px", backgroundColor: "#f1f5f9" }}>
                                <div className="progress-bar" role="progressbar" style={{ width: `${pct}%`, backgroundColor: item.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-2 rounded-3 border bg-light mt-3 d-flex justify-content-between align-items-center" style={{ fontSize: "11px" }}>
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
                  <div className="card border-0">
                    <div className="card-header border-0 bg-transparent py-3 d-flex align-items-center justify-content-between">
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                        <i className="ti ti-alert-circle text-warning me-2 fs-18" />Low Stock
                      </h5>
                      {(stats?.lowStockMedicines?.length ?? 0) > 0 && (
                        <span className="badge bg-warning-subtle text-warning border border-warning fw-semibold" style={{ fontSize: "10px" }}>
                          {stats?.lowStockMedicines?.length} medicines
                        </span>
                      )}
                    </div>
                    <div className="card-body p-3">
                      {stats?.lowStockMedicines && stats.lowStockMedicines.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {stats.lowStockMedicines.slice(0, 6).map((med, idx) => (
                            <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
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
                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <div className="card border-0" style={{ borderLeft: "4px solid #ef4444 !important" }}>
                      <div className="card-header border-0 bg-transparent py-3 d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                          <i className="ti ti-calendar-x text-danger me-2 fs-18" />Expired Medicines
                          <span className="badge bg-danger-subtle text-danger border border-danger fw-semibold ms-2" style={{ fontSize: "10px" }}>
                            {stats?.expiredMedicines?.length} items
                          </span>
                        </h5>
                        <Link to={routes.pharmacyMedicines} className="btn btn-sm btn-link p-0 fw-bold text-decoration-none" style={{ color: "#ef4444", fontSize: "13px" }}>Manage →</Link>
                      </div>
                      <div className="card-body p-3">
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
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <div className="card border-0">
                    <div className="card-header border-0 bg-transparent py-3">
                      <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: "16px" }}>
                        <i className="ti ti-link text-primary me-2 fs-18" />Quick Links
                      </h5>
                    </div>
                    <div className="card-body p-3">
                      <div className="d-flex flex-wrap gap-2 align-items-stretch">
                        {[
                          { to: routes.pharmacyCategories, icon: "ti-tags", color: "#6366f1", bg: "#f5f3ff", label: "Category Management", sub: "Manage medicine categories" },
                          { to: routes.pharmacyMedicines, icon: "ti-pill", color: "#3b82f6", bg: "#eff6ff", label: "Medicines", sub: "View & manage medicines" },
                          { to: routes.pharmacyInventory, icon: "ti-package", color: "#10b981", bg: "#ecfdf5", label: "Inventory", sub: "Check stock levels" },
                          { to: routes.pharmacyBilling, icon: "ti-file-invoice", color: "#f97316", bg: "#fff7ed", label: "Pharmacy Billing", sub: "Create new bills" },
                          { to: routes.pharmacySalesHistory, icon: "ti-chart-line", color: "#8b5cf6", bg: "#f5f3ff", label: "Sales History", sub: "All pharmacy invoices" },
                        ].map((link, i) => (
                          <div key={i} className="flex-fill" style={{ minWidth: "200px", flex: "1 1 0px" }}>
                            <Link to={link.to} className="ph-quick-link d-flex align-items-center gap-3 p-3 rounded-3 border bg-white h-100">
                              <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: "40px", height: "40px", backgroundColor: link.bg, color: link.color }}>
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
    </>
  );
};

export default PharmacyDashboard;
