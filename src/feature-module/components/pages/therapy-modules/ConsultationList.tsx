import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiGet, apiDelete, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import EmptyState from "../../../../core/common/emptyState";
import { all_routes } from "../../../routes/all_routes";

const routes = all_routes;

const statusColors: Record<string, string> = {
  Draft: "warning",
  Confirmed: "success",
  "Not Started": "secondary",
};

const payStatusColors: Record<string, string> = {
  Paid: "success",
  "Partial Paid": "warning",
  Unpaid: "danger",
};

const ConsultationList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchConsultancyData = async () => {
    setLoading(true);
    try {
      const apptsData = await apiGet<any[]>("/api/appointments?appointmentType=therapy");
      const consultsData = await apiGet<any[]>("/api/consultations");
      
      const appts = Array.isArray(apptsData) ? apptsData : [];
      const consults = Array.isArray(consultsData) ? consultsData : [];
      
      const targetAppts = appts.filter(app => 
        !app.parentAppointmentId && 
        ["Confirmed", "Check In", "Check Out"].includes(app.status)
      );
      
      const combined = targetAppts.map(app => {
        const match = consults.find(c => c.appointmentId === app.id);
        return {
          id: app.id,
          appointment: app,
          consultation: match || null,
        };
      });
      
      setItems(combined);
    } catch (err: any) {
      toast.error(err.message || "Failed to load consultancy list data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultancyData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this consultation? This will also remove all related sessions.")) return;
    setDeletingId(id);
    try {
      await apiDelete(`/api/consultations/${id}`);
      toast.success("Consultation deleted");
      fetchConsultancyData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartConsultation = async (apptId: string) => {
    setStartingId(apptId);
    try {
      const consult = await apiPost<any>("/api/consultations", {
        appointmentId: apptId,
        status: "Draft",
      });
      navigate(`/therapy-consultations/${consult.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start consultation");
    } finally {
      setStartingId(null);
    }
  };

  const filtered = items.filter((item) => {
    const app = item.appointment;
    const c = item.consultation;
    const pat = `${app?.patient?.firstName || ""} ${app?.patient?.lastName || ""}`.toLowerCase();
    const doc = (app?.doctor?.fullName || "").toLowerCase();
    const code = (c?.consultationCode || app?.appointmentCode || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return pat.includes(term) || doc.includes(term) || code.includes(term);
  });

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="page-title">Therapy Consultations</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Consultations</li>
              </ul>
            </div>
            <div className="col-auto">
              <Link
                to={routes.createConsultation}
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ borderRadius: "10px", fontWeight: 600 }}
              >
                <i className="ti ti-plus" />
                New Consultation
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Consultations", value: items.filter(item => item.consultation).length, icon: "ti-stethoscope", color: "#6366f1" },
            {
              label: "Confirmed",
              value: items.filter((item) => item.consultation?.status === "Confirmed").length,
              icon: "ti-circle-check",
              color: "#10b981",
            },
            {
              label: "Pending Payment",
              value: items.filter((item) => item.consultation && item.consultation.paymentStatus !== "Paid").length,
              icon: "ti-currency-rupee",
              color: "#f59e0b",
            },
            {
              label: "Sessions Created",
              value: items.reduce((s: number, item: any) => s + (item.consultation?.therapyPlans?.reduce((a: number, p: any) => a + (p.totalSessions || 0), 0) || 0), 0),
              icon: "ti-calendar",
              color: "#3b82f6",
            },
          ].map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div
                className="card border-0 h-100"
                style={{
                  background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                }}
              >
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 52, height: 52, background: `${stat.color}18`, flexShrink: 0 }}
                  >
                    <i className={`ti ${stat.icon} fs-4`} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="fw-bold fs-4" style={{ lineHeight: 1.2 }}>
                      {stat.value}
                    </div>
                    <div className="text-muted small">{stat.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div
          className="card border-0"
          style={{ borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
        >
          <div className="card-header border-0 bg-white d-flex align-items-center justify-content-between flex-wrap gap-2"
            style={{ borderRadius: "16px 16px 0 0", padding: "20px 24px" }}>
            <h5 className="mb-0 fw-semibold">All Consultations</h5>
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text border-0 bg-light">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 bg-light"
                placeholder="Search patient, therapist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: "0 8px 8px 0" }}
              />
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No consultancy appointments found"
                message="Confirmed therapy appointments will show up here to start or view consultations."
              />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th className="px-4 py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Code</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Patient</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Therapist</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Therapies</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Total Amt</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Invoice</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Status</th>
                      <th className="py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Date</th>
                      <th className="pe-4 py-3 text-muted fw-medium border-0" style={{ fontSize: 13 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const app = item.appointment;
                      const c = item.consultation;
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td className="px-4">
                            <span
                              className="fw-semibold"
                              style={{ color: "#6366f1", fontFamily: "monospace", fontSize: 13 }}
                            >
                              {c ? c.consultationCode : (app?.appointmentCode || "—")}
                            </span>
                            {!c && (
                              <span className="badge bg-secondary-subtle text-secondary ms-2 small" style={{ fontSize: 9, borderRadius: 4 }}>
                                Not Started
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {app?.patient?.profileImage ? (
                                <img
                                  src={app.patient.profileImage}
                                  alt=""
                                  className="rounded-circle"
                                  style={{ width: 34, height: 34, objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: 34, height: 34, background: "#6366f120", color: "#6366f1", fontSize: 13 }}
                                >
                                  {(app?.patient?.firstName?.[0] || "P").toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold" style={{ fontSize: 14 }}>
                                  {app?.patient?.firstName} {app?.patient?.lastName}
                                </div>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                  {app?.patient?.phone || "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 14 }}>{app?.doctor?.fullName || "—"}</div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {c ? (
                                c.therapyPlans?.map((p: any, i: number) => (
                                  <span
                                    key={i}
                                    className="badge bg-indigo bg-opacity-10 text-primary"
                                    style={{
                                      background: "#6366f118",
                                      color: "#4f46e5",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      padding: "3px 8px",
                                    }}
                                  >
                                    {p.therapyName || "Therapy"} × {p.totalSessions}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted small">No prescription prescribed</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">₹{(c?.finalTotalAmount || 0).toLocaleString()}</div>
                            {c && c.amountPaid > 0 && (
                              <div className="text-muted" style={{ fontSize: 11 }}>
                                Paid: ₹{(c.amountPaid || 0).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td>
                            {c?.invoice ? (
                              <span
                                className={`badge bg-${payStatusColors[c.invoice.paymentStatus] || "secondary"}-subtle text-${payStatusColors[c.invoice.paymentStatus] || "secondary"}`}
                                style={{ borderRadius: 6, fontSize: 11 }}
                              >
                                {c.invoice.paymentStatus}
                              </span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge bg-${statusColors[c ? c.status : "Not Started"] || "secondary"}-subtle text-${statusColors[c ? c.status : "Not Started"] || "secondary"}`}
                              style={{ borderRadius: 6, padding: "4px 10px" }}
                            >
                              {c ? c.status : "Not Started"}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: 13 }}>{formatDate(app?.scheduledAt)}</div>
                          </td>
                          <td className="pe-4">
                            <div className="d-flex gap-2">
                              {!c ? (
                                <button
                                  className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
                                  style={{ borderRadius: 8, padding: "5px 10px" }}
                                  title="Start Consultation"
                                  disabled={startingId === app?.id}
                                  onClick={() => handleStartConsultation(app.id)}
                                >
                                  {startingId === app?.id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm" /> Starting
                                    </>
                                  ) : (
                                    <>
                                      <i className="ti ti-player-play-filled" /> Start
                                    </>
                                  )}
                                </button>
                              ) : c.status === "Draft" ? (
                                <button
                                  className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
                                  style={{ borderRadius: 8, padding: "5px 10px" }}
                                  title="Resume Consultation"
                                  onClick={() => navigate(`/therapy-consultations/${c.id}`)}
                                >
                                  <i className="ti ti-player-play-filled" /> Start
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                  style={{ borderRadius: 8, padding: "5px 10px" }}
                                  title="View Details"
                                  onClick={() => navigate(`/therapy-consultations/${c.id}`)}
                                >
                                  <i className="ti ti-eye" /> View
                                </button>
                              )}
                              {c && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  style={{ borderRadius: 8 }}
                                  title="Delete"
                                  disabled={deletingId === c.id}
                                  onClick={() => handleDelete(c.id)}
                                >
                                  {deletingId === c.id ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    <i className="ti ti-trash" />
                                  )}
                                </button>
                              )}
                            </div>
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
    </div>
  );
};

export default ConsultationList;
