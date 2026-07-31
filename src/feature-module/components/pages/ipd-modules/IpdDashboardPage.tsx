import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import ImageWithBasePath from "../../../../core/imageWithBasePath";

interface Patient {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  patientCode?: string;
}

interface Doctor {
  id: string;
  fullName: string;
}

interface Ward {
  id: string;
  wardName: string;
  wardType: string;
  totalBeds: number;
  occupiedBeds: number;
  chargePerNight: number;
  nursingChargePerNight: number;
  status: string;
}

interface Admission {
  id: string;
  admissionCode: string;
  patient: Patient;
  doctor?: Doctor | null;
  ward?: Ward | null;
  admissionDate: string;
  dischargeDate?: string | null;
  status: string;
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  paymentStatus: string;
}

const getPatientName = (p?: Patient | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  return `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient";
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const avatarColors = [
  "bg-soft-primary text-primary",
  "bg-soft-success text-success",
  "bg-soft-warning text-warning",
  "bg-soft-danger text-danger",
  "bg-soft-info text-info",
];

const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

// Indian currency formatter: 1L, 1Cr etc
const formatINR = (amount: number): string => {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return "\u20B9" + (cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)) + " Cr";
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return "\u20B9" + (lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)) + " L";
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return "\u20B9" + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
  }
  return "\u20B9" + amount.toLocaleString("en-IN");
};

const IpdDashboardPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [admRes, wardRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/admissions"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
      ]);
      if (admRes.ok) {
        const d = await admRes.json();
        setAdmissions(Array.isArray(d) ? d : []);
      }
      if (wardRes.ok) {
        const d = await wardRes.json();
        setWards(Array.isArray(d) ? d : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const admitted = admissions.filter((a) => a.status === "Admitted");
    const discharged = admissions.filter((a) => a.status === "Discharged");
    const dischargedToday = discharged.filter(
      (a) => a.dischargeDate && new Date(a.dischargeDate).toDateString() === today
    );
    const totalBeds = wards.reduce((s, w) => s + (w.totalBeds || 0), 0);
    const occupiedBeds = wards.reduce((s, w) => s + (w.occupiedBeds || 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const totalRevenue = admissions.reduce((s, a) => s + (a.totalPaid || 0), 0);
    const totalBilled = admissions.reduce((s, a) => s + (a.totalAmount || 0), 0);
    const totalDue = admissions.reduce((s, a) => s + (a.dueAmount || 0), 0);
    const pendingSettlement = admitted.filter((a) => (a.dueAmount || 0) > 0).length;

    return {
      admitted: admitted.length,
      discharged: discharged.length,
      dischargedToday: dischargedToday.length,
      totalBeds,
      occupiedBeds,
      freeBeds: Math.max(0, totalBeds - occupiedBeds),
      occupancyRate,
      totalRevenue,
      totalBilled,
      totalDue,
      pendingSettlement,
    };
  }, [admissions, wards]);

  const recentAdmissions = useMemo(
    () =>
      [...admissions]
        .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
        .slice(0, 8),
    [admissions]
  );

  const wardStats = useMemo(
    () =>
      wards
        .filter((w) => w.status !== "Inactive")
        .map((w) => ({
          ...w,
          pct: w.totalBeds > 0 ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0,
          free: Math.max(0, w.totalBeds - w.occupiedBeds),
        })),
    [wards]
  );

  const getOccupancyColor = (pct: number) => {
    if (pct >= 90) return "bg-danger";
    if (pct >= 65) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="page-wrapper ipd-dashboard-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .ipd-dashboard-wrapper {
          background-color: #F8FAFC !important;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
        }
        .ipd-dashboard-wrapper .content {
          background: transparent !important;
          padding: 32px 32px 20px 32px !important;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Premium Hero Cards — match main dashboard */
        .ipd-dashboard-wrapper .hero-card {
          background: #ffffff;
          border: none;
          border-radius: 18px;
          padding: 20px 20px 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          min-height: 148px;
          width: 100%;
          height: auto;
        }
        .ipd-dashboard-wrapper .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0,0,0,0.04);
        }
        .ipd-dashboard-wrapper .hero-card-bg-glow {
          position: absolute;
          top: -30px;
          right: -20px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          filter: blur(48px);
          opacity: 0.18;
          z-index: 0;
          pointer-events: none;
        }
        .ipd-dashboard-wrapper .hero-card-main {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 12px;
          position: relative;
          z-index: 1;
          height: 100%;
        }
        .ipd-dashboard-wrapper .hero-card-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          flex: 1;
        }
        .ipd-dashboard-wrapper .hero-card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          flex-shrink: 0;
          min-width: 100px;
        }
        .ipd-dashboard-wrapper .hero-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          z-index: 1;
          position: relative;
          box-shadow: none;
        }
        .ipd-dashboard-wrapper .hero-val {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #0f172a;
          margin-top: 10px;
          margin-bottom: 2px;
          z-index: 1;
          position: relative;
          line-height: 1.1;
        }
        .ipd-dashboard-wrapper .hero-title {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          z-index: 1;
          position: relative;
        }
        .ipd-dashboard-wrapper .hero-sub {
          font-size: 12px;
          font-weight: 500;
          margin-top: 0;
          z-index: 1;
          position: relative;
        }
        .ipd-dashboard-wrapper .hero-chart-wrap {
          margin-top: 8px;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          width: 100%;
        }
        .ipd-dashboard-wrapper .hero-chart-wrap img {
          max-width: 100px;
          height: auto;
          display: block;
        }
        .ipd-dashboard-wrapper .hero-chart-caption {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
          text-align: right;
          margin-bottom: 4px;
          line-height: 1.2;
          max-width: 120px;
        }
        .ipd-dashboard-wrapper .hero-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
          width: 100%;
        }
        .ipd-dashboard-wrapper .hero-kpi-grid .hero-card {
          width: 100%;
          max-width: none;
          min-height: 138px;
          padding: 16px;
        }
        .ipd-dashboard-wrapper .hero-period-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        @media (max-width: 1199.98px) {
          .ipd-dashboard-wrapper .hero-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 575.98px) {
          .ipd-dashboard-wrapper .hero-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        /* Analytics Cards */
        .ipd-dashboard-wrapper .analytic-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .ipd-dashboard-wrapper .analytic-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
          border-color: rgba(203, 213, 225, 1);
        }
        .ipd-dashboard-wrapper .analytic-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(241, 245, 249, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
        }
        .ipd-dashboard-wrapper .analytic-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ipd-dashboard-wrapper .analytic-card-body {
          padding: 24px;
        }
        .ipd-dashboard-wrapper .analytic-card-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(241, 245, 249, 1);
          background: #ffffff;
        }
        .ipd-dashboard-wrapper .dash-h-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        /* Buttons */
        .ipd-dashboard-wrapper .btn-premium {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
          font-weight: 600 !important;
          padding: 8px 16px !important;
          border-radius: 10px !important;
          transition: all 0.3s ease !important;
          font-size: 13px !important;
        }
        .ipd-dashboard-wrapper .btn-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35) !important;
          color: white !important;
        }
        .ipd-dashboard-wrapper .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
          border: none !important;
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25) !important;
          transition: all 0.2s ease;
        }
        .ipd-dashboard-wrapper .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35) !important;
        }
        .ipd-dashboard-wrapper .btn-outline-primary {
          border-color: #c7d2fe !important;
          color: #4f46e5 !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          transition: all 0.2s ease;
        }
        .ipd-dashboard-wrapper .btn-outline-primary:hover {
          background: #eef2ff !important;
          border-color: #a5b4fc !important;
          color: #4338ca !important;
        }
        .ipd-dashboard-wrapper .btn-outline-secondary {
          border-color: #e2e8f0 !important;
          color: #475569 !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          background: #ffffff !important;
        }
        .ipd-dashboard-wrapper .btn-outline-secondary:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        .ipd-dashboard-wrapper .btn-outline-success {
          border-color: #a7f3d0 !important;
          color: #059669 !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
        }
        .ipd-dashboard-wrapper .btn-outline-success:hover {
          background: #ecfdf5 !important;
          border-color: #6ee7b7 !important;
        }
        .ipd-dashboard-wrapper .btn-link {
          color: #4f46e5 !important;
          font-weight: 600 !important;
          transition: all 0.2s ease;
        }
        .ipd-dashboard-wrapper .btn-link:hover {
          color: #3730a3 !important;
          text-decoration: underline !important;
        }
        .ipd-dashboard-wrapper .btn-light.border {
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
          background: #ffffff !important;
          transition: all 0.2s ease;
        }
        .ipd-dashboard-wrapper .btn-light.border:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        /* Table polish */
        .ipd-dashboard-wrapper .table thead th {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #64748b;
          border-bottom-color: #f1f5f9 !important;
          background: #f8fafc !important;
        }
        .ipd-dashboard-wrapper .table tbody td {
          border-color: #f1f5f9 !important;
          vertical-align: middle;
        }
        .ipd-dashboard-wrapper .table-hover tbody tr:hover {
          background: #f8fafc !important;
        }

        /* Animations */
        .ipd-dashboard-wrapper .fade-in-up {
          animation: ipdFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes ipdFadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .ipd-dashboard-wrapper .delay-1 { animation-delay: 0.1s; }
        .ipd-dashboard-wrapper .delay-2 { animation-delay: 0.2s; }
        .ipd-dashboard-wrapper .delay-3 { animation-delay: 0.3s; }
        .ipd-dashboard-wrapper .delay-4 { animation-delay: 0.4s; }
      `}</style>
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4 fade-in-up">
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: "32px", letterSpacing: "-0.5px", color: "#0f172a" }}>
              IPD Dashboard
            </h1>
            <p className="mb-0" style={{ color: "#64748b", fontSize: "15px" }}>
              <i className="ti ti-clock me-1" />
              Live In-Patient Department Overview &nbsp;·&nbsp;
              {new Date().toLocaleTimeString("en-IN")}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll} disabled={loading}>
              <i className={`ti ti-refresh me-1`} />
              Refresh
            </button>
            <Link to={all_routes.ipdAdmissions} className="btn btn-premium btn-sm">
              <i className="ti ti-plus me-1" /> New Admission
            </Link>
            <Link to={all_routes.ipdWardManagement} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-building-hospital me-1" /> Wards
            </Link>
          </div>
        </div>

        {/* Stats Cards — same layout as main dashboard */}
        <div className="hero-kpi-grid">
          <div className="hero-card fade-in-up delay-1">
            <div className="hero-card-bg-glow" style={{ background: "#4f46e5" }}></div>
            <div className="hero-card-main">
              <div className="hero-card-left">
                <div className="hero-icon-box" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                  <i className="ti ti-bed" />
                </div>
                <div>
                  <div className="hero-val">{loading ? "—" : stats.admitted}</div>
                  <div className="hero-title">Active Inpatients</div>
                </div>
              </div>
              <div className="hero-card-right">
                <span className={`hero-period-pill ${!loading && stats.pendingSettlement > 0 ? "text-warning" : ""}`}>
                  {loading
                    ? "…"
                    : stats.pendingSettlement > 0
                      ? `${stats.pendingSettlement} dues`
                      : "All clear"}
                </span>
                <div className="hero-chart-wrap">
                  <ImageWithBasePath src="assets/img/charts/patients-donut.svg" alt="Active inpatients" />
                </div>
              </div>
            </div>
          </div>

          <div className="hero-card fade-in-up delay-2">
            <div className="hero-card-bg-glow" style={{ background: "#f59e0b" }}></div>
            <div className="hero-card-main">
              <div className="hero-card-left">
                <div className="hero-icon-box" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <i className="ti ti-building-community" />
                </div>
                <div>
                  <div className="hero-val">{loading ? "—" : `${stats.occupancyRate}%`}</div>
                  <div className="hero-title">Bed Occupancy</div>
                </div>
              </div>
              <div className="hero-card-right">
                <div>
                  <div className="hero-chart-caption">
                    {loading ? "" : `${stats.occupiedBeds} / ${stats.totalBeds} · ${stats.freeBeds} free`}
                  </div>
                  <div className="hero-chart-wrap">
                    <ImageWithBasePath src="assets/img/charts/appointments-bars.svg" alt="Bed occupancy" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-card fade-in-up delay-3">
            <div className="hero-card-bg-glow" style={{ background: "#0ea5e9" }}></div>
            <div className="hero-card-main">
              <div className="hero-card-left">
                <div className="hero-icon-box" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                  <i className="ti ti-door-exit" />
                </div>
                <div>
                  <div className="hero-val">{loading ? "—" : stats.dischargedToday}</div>
                  <div className="hero-title">Discharges Today</div>
                </div>
              </div>
              <div className="hero-card-right">
                <span className="hero-period-pill">Today</span>
                <div className="hero-chart-wrap">
                  <ImageWithBasePath src="assets/img/charts/completed-bars.svg" alt="Discharges today" />
                </div>
              </div>
            </div>
          </div>

          <div className="hero-card fade-in-up delay-4">
            <div className="hero-card-bg-glow" style={{ background: "#10b981" }}></div>
            <div className="hero-card-main">
              <div className="hero-card-left">
                <div className="hero-icon-box" style={{ background: "#d1fae5", color: "#059669" }}>
                  <i className="ti ti-coin" />
                </div>
                <div>
                  <div className="hero-val" style={{ fontSize: !loading && formatINR(stats.totalRevenue).length > 8 ? "22px" : undefined }}>
                    {loading ? "—" : formatINR(stats.totalRevenue)}
                  </div>
                  <div className="hero-title">Total IPD Revenue</div>
                </div>
              </div>
              <div className="hero-card-right">
                <span className={`hero-period-pill ${!loading && stats.totalDue > 0 ? "text-danger" : "text-success"}`}>
                  {loading
                    ? "…"
                    : stats.totalDue > 0
                      ? `${formatINR(stats.totalDue)} due`
                      : "No dues"}
                </span>
                <div className="hero-chart-wrap">
                  <ImageWithBasePath src="assets/img/charts/revenue-area.svg" alt="IPD revenue" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Admissions + Ward Occupancy */}
        <div className="row g-4">
          {/* Recent Admissions Table */}
          <div className="col-lg-8 fade-in-up delay-2 d-flex">
            <div className="analytic-card mb-0 h-100 w-100">
              <div className="analytic-card-header">
                <h3 className="analytic-card-title">
                  <span className="dash-h-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}><i className="ti ti-user-plus" /></span>
                  Recent Admissions
                </h3>
                <Link to={all_routes.ipdAdmissions} className="btn btn-link btn-sm text-primary p-0 fw-semibold">
                  View All <i className="ti ti-arrow-right ms-1" />
                </Link>
              </div>
              <div className="analytic-card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="text-muted mt-2 fs-13 mb-0">Loading admissions...</p>
                  </div>
                ) : recentAdmissions.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-bed-off fs-40 text-muted d-block mb-2" />
                    <p className="text-muted fs-13 mb-0">No admissions found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Admission ID</th>
                          <th>Patient</th>
                          <th>Ward</th>
                          <th>Doctor</th>
                          <th>Admitted</th>
                          <th>Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAdmissions.map((adm) => {
                          const name = getPatientName(adm.patient);
                          const initials = getInitials(name);
                          const colorClass = getAvatarColor(name);
                          return (
                            <tr key={adm.id}>
                              <td>
                                <span className="fw-semibold text-primary fs-13">{adm.admissionCode}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    className={`avatar avatar-xs rounded-circle fw-bold fs-11 ${colorClass}`}
                                    style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                                  >
                                    {initials}
                                  </span>
                                  <div>
                                    <span className="fw-semibold d-block fs-13">{name}</span>
                                    {adm.patient?.patientCode && (
                                      <span className="text-muted fs-11">{adm.patient.patientCode}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td><span className="fs-13">{adm.ward?.wardName || "—"}</span></td>
                              <td><span className="fs-13">{adm.doctor ? `Dr. ${adm.doctor.fullName}` : "—"}</span></td>
                              <td>
                                <span className="fs-13">
                                  {new Date(adm.admissionDate).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                  })}
                                </span>
                              </td>
                              <td>
                                <span className={`fw-semibold fs-13 ${(adm.dueAmount || 0) > 0 ? "text-danger" : "text-success"}`}>
                                  {(adm.dueAmount || 0) > 0
                                    ? formatINR(adm.dueAmount)
                                    : "Paid"}
                                </span>
                              </td>
                              <td>
                                {adm.status === "Admitted" ? (
                                  <span className="badge bg-success py-1 px-2 fs-11">Admitted</span>
                                ) : adm.status === "Discharged" ? (
                                  <span className="badge bg-secondary py-1 px-2 fs-11">Discharged</span>
                                ) : (
                                  <span className="badge bg-warning text-dark py-1 px-2 fs-11">{adm.status}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ward Occupancy Panel */}
          <div className="col-lg-4 fade-in-up delay-3">
            <div className="analytic-card mb-0 h-100" style={{ display: "flex", flexDirection: "column" }}>
              <div className="analytic-card-header">
                <h3 className="analytic-card-title">
                  <span className="dash-h-icon" style={{ background: "#fef3c7", color: "#d97706" }}><i className="ti ti-building-community" /></span>
                  Ward Occupancy
                </h3>
              </div>
              <div className="analytic-card-body" style={{ overflowY: "auto", maxHeight: "360px", flex: 1 }}>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-warning" role="status" />
                  </div>
                ) : wardStats.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="ti ti-building-off fs-36 text-muted d-block mb-2" />
                    <p className="text-muted fs-13 mb-0">No wards configured</p>
                  </div>
                ) : (
                  wardStats.map((w) => (
                    <div className="mb-3" key={w.id}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          <span className="fs-13 fw-semibold d-block">{w.wardName}</span>
                          <span className="fs-11 text-muted">{w.wardType}</span>
                        </div>
                        <div className="text-end ms-2">
                          <span className={`fs-12 fw-bold ${w.pct >= 90 ? "text-danger" : w.pct >= 65 ? "text-warning" : "text-success"}`}>
                            {w.occupiedBeds}/{w.totalBeds}
                          </span>
                          <span className="fs-11 text-muted d-block">{w.free} free</span>
                        </div>
                      </div>
                      <div className="progress" style={{ height: "7px", borderRadius: "4px" }}>
                        <div
                          className={`progress-bar ${getOccupancyColor(w.pct)}`}
                          role="progressbar"
                          style={{ width: `${w.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="analytic-card-footer">
                <div className="d-flex justify-content-between fs-12 text-muted mb-2">
                  <span><span className="badge bg-success me-1" style={{ width: "10px", height: "10px", borderRadius: "50%", display: "inline-block", padding: 0 }} />Available</span>
                  <span><span className="badge bg-warning me-1" style={{ width: "10px", height: "10px", borderRadius: "50%", display: "inline-block", padding: 0 }} />Filling up</span>
                  <span><span className="badge bg-danger me-1" style={{ width: "10px", height: "10px", borderRadius: "50%", display: "inline-block", padding: 0 }} />Near full</span>
                </div>
                <Link to={all_routes.ipdWardManagement} className="btn btn-outline-primary btn-sm w-100">
                  <i className="ti ti-map me-1" /> Full Bed Map
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="row g-4 mt-1">
          {/* Bed Breakdown */}
          <div className="col-md-4 fade-in-up delay-2">
            <div className="analytic-card mb-0">
              <div className="analytic-card-header">
                <h3 className="analytic-card-title">
                  <span className="dash-h-icon" style={{ background: "#ecfeff", color: "#0891b2" }}><i className="ti ti-chart-bar" /></span>
                  Occupancy Breakdown
                </h3>
              </div>
              <div className="analytic-card-body">
                {loading ? (
                  <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-info" role="status" /></div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-soft-success rounded">
                      <span className="fs-13 fw-semibold text-success">Free Beds</span>
                      <span className="fs-20 fw-bold text-success">{stats.freeBeds}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-soft-danger rounded">
                      <span className="fs-13 fw-semibold text-danger">Occupied Beds</span>
                      <span className="fs-20 fw-bold text-danger">{stats.occupiedBeds}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 bg-soft-primary rounded">
                      <span className="fs-13 fw-semibold text-primary">Total Capacity</span>
                      <span className="fs-20 fw-bold text-primary">{stats.totalBeds}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="col-md-4 fade-in-up delay-3">
            <div className="analytic-card mb-0">
              <div className="analytic-card-header">
                <h3 className="analytic-card-title">
                  <span className="dash-h-icon" style={{ background: "#d1fae5", color: "#059669" }}><i className="ti ti-cash" /></span>
                  Revenue Overview
                </h3>
              </div>
              <div className="analytic-card-body">
                {loading ? (
                  <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-success" role="status" /></div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-13 text-muted">Total Billed</span>
                      <span className="fs-14 fw-bold text-dark">{formatINR(stats.totalBilled)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-13 text-muted">Collected</span>
                      <span className="fs-14 fw-bold text-success">{formatINR(stats.totalRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-13 text-muted">Outstanding</span>
                      <span className="fs-14 fw-bold text-danger">{formatINR(stats.totalDue)}</span>
                    </div>
                    <Link to={all_routes.ipdBillings} className="btn btn-outline-success btn-sm w-100 mt-1">
                      <i className="ti ti-file-invoice me-1" /> View Billings
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="col-md-4 fade-in-up delay-4">
            <div className="analytic-card mb-0">
              <div className="analytic-card-header">
                <h3 className="analytic-card-title">
                  <span className="dash-h-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}><i className="ti ti-layout-grid" /></span>
                  Quick Navigation
                </h3>
              </div>
              <div className="analytic-card-body p-3">
                <div className="d-grid gap-2">
                  <Link to={all_routes.ipdAdmissions} className="btn btn-light border d-flex align-items-center gap-2 fw-semibold fs-13">
                    <i className="ti ti-user-plus text-primary fs-16" /> Admissions
                    <span className="badge bg-primary ms-auto">{admissions.length}</span>
                  </Link>
                  <Link to={all_routes.ipdPatients} className="btn btn-light border d-flex align-items-center gap-2 fw-semibold fs-13">
                    <i className="ti ti-bed text-success fs-16" /> Active Inpatients
                    <span className="badge bg-success ms-auto">{stats.admitted}</span>
                  </Link>
                  <Link to={all_routes.ipdDischarge} className="btn btn-light border d-flex align-items-center gap-2 fw-semibold fs-13">
                    <i className="ti ti-door-exit text-info fs-16" /> Discharge
                    <span className="badge bg-info ms-auto">{stats.pendingSettlement}</span>
                  </Link>
                  <Link to={all_routes.ipdWardManagement} className="btn btn-light border d-flex align-items-center gap-2 fw-semibold fs-13">
                    <i className="ti ti-building-hospital text-warning fs-16" /> Ward Management
                    <span className="badge bg-warning text-dark ms-auto">{wards.length}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default IpdDashboardPage;
