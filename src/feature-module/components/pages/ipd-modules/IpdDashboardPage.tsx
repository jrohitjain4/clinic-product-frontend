import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";

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
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-1 fw-bold">IPD Dashboard</h3>
            <p className="text-muted fs-13 mb-0">
              <i className="ti ti-clock me-1" />
              Live In-Patient Department Overview &nbsp;Â·&nbsp;
              {new Date().toLocaleTimeString("en-IN")}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll} disabled={loading}>
              <i className={`ti ti-refresh me-1`} />
              Refresh
            </button>
            <Link to={all_routes.ipdAdmissions} className="btn btn-primary btn-sm">
              <i className="ti ti-plus me-1" /> New Admission
            </Link>
            <Link to={all_routes.ipdWardManagement} className="btn btn-outline-primary btn-sm">
              <i className="ti ti-building-hospital me-1" /> Wards
            </Link>
          </div>
        </div>

        {/* â”€â”€ Stats Cards â”€â”€ */}
        <div className="row g-3 mb-4">
          {/* Active Inpatients */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block mb-1">Active Inpatients</span>
                    <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: "28px" }}>
                      {loading ? "â€”" : stats.admitted}
                    </h2>
                    <span className={`fs-12 mt-2 d-block fw-medium ${stats.pendingSettlement > 0 ? "text-warning" : "text-success"}`}>
                      {loading ? "" : stats.pendingSettlement > 0
                        ? `${stats.pendingSettlement} with pending dues`
                        : "All payments clear"}
                    </span>
                  </div>
                  <div className="avatar avatar-xl rounded-3 bg-soft-primary text-primary d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <i className="ti ti-bed fs-26" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bed Occupancy */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block mb-1">Bed Occupancy</span>
                    <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: "28px" }}>
                      {loading ? "â€”" : `${stats.occupancyRate}%`}
                    </h2>
                    <span className="text-muted fs-12 mt-2 d-block">
                      {loading ? "" : `${stats.occupiedBeds} / ${stats.totalBeds} beds Â· ${stats.freeBeds} free`}
                    </span>
                  </div>
                  <div className="avatar avatar-xl rounded-3 bg-soft-warning text-warning d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <i className="ti ti-building-community fs-26" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discharges Today */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block mb-1">Discharges Today</span>
                    <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: "28px" }}>
                      {loading ? "â€”" : stats.dischargedToday}
                    </h2>
                    <span className="text-muted fs-12 mt-2 d-block">
                      {loading ? "" : `${stats.discharged} total discharged overall`}
                    </span>
                  </div>
                  <div className="avatar avatar-xl rounded-3 bg-soft-info text-info d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <i className="ti ti-door-exit fs-26" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block mb-1">Total IPD Revenue</span>
                    <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: "24px" }}>
                      {loading ? "—" : formatINR(stats.totalRevenue)}
                    </h2>
                    <span className={`fs-12 mt-2 d-block fw-medium ${stats.totalDue > 0 ? "text-danger" : "text-success"}`}>
                      {loading ? "" : stats.totalDue > 0
                        ? `${formatINR(stats.totalDue)} outstanding`
                        : "No dues pending"}
                    </span>
                  </div>
                  <div className="avatar avatar-xl rounded-3 bg-soft-success text-success d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                    <i className="ti ti-coin fs-26" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Recent Admissions + Ward Occupancy â”€â”€ */}
        <div className="row g-3">
          {/* Recent Admissions Table */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="ti ti-user-plus me-2 text-primary" />
                  Recent Admissions
                </h5>
                <Link to={all_routes.ipdAdmissions} className="btn btn-link btn-sm text-primary p-0 fw-semibold">
                  View All <i className="ti ti-arrow-right ms-1" />
                </Link>
              </div>
              <div className="card-body p-0">
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
                              <td><span className="fs-13">{adm.ward?.wardName || "â€”"}</span></td>
                              <td><span className="fs-13">{adm.doctor ? `Dr. ${adm.doctor.fullName}` : "â€”"}</span></td>
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
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-header bg-transparent border-bottom py-3">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="ti ti-building-community me-2 text-warning" />
                  Ward Occupancy
                </h5>
              </div>
              <div className="card-body" style={{ overflowY: "auto", maxHeight: "360px", flex: 1 }}>
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
              <div className="card-footer bg-transparent border-top pt-3">
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

        {/* â”€â”€ Bottom Row â”€â”€ */}
        <div className="row g-3 mt-1">
          {/* Bed Breakdown */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <h6 className="mb-0 fw-bold"><i className="ti ti-chart-bar me-2 text-info" />Occupancy Breakdown</h6>
              </div>
              <div className="card-body">
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
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <h6 className="mb-0 fw-bold"><i className="ti ti-cash me-2 text-success" />Revenue Overview</h6>
              </div>
              <div className="card-body">
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
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <h6 className="mb-0 fw-bold"><i className="ti ti-layout-grid me-2" />Quick Navigation</h6>
              </div>
              <div className="card-body p-3">
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

