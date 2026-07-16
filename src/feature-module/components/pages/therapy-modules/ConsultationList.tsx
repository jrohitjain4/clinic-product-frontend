import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiGet, apiDelete, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import EmptyState from "../../../../core/common/emptyState";
import { all_routes } from "../../../routes/all_routes";
import Datatable from "../../../../core/common/dataTable";

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

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      sorter: (a: any, b: any) => {
        const valA = a.consultation?.consultationCode || a.appointment?.appointmentCode || "";
        const valB = b.consultation?.consultationCode || b.appointment?.appointmentCode || "";
        return valA.localeCompare(valB);
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        const c = record.consultation;
        return (
          <div>
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
          </div>
        );
      },
    },
    {
      title: "Patient",
      dataIndex: "patient",
      sorter: (a: any, b: any) => {
        const nameA = `${a.appointment?.patient?.firstName || ""} ${a.appointment?.patient?.lastName || ""}`;
        const nameB = `${b.appointment?.patient?.firstName || ""} ${b.appointment?.patient?.lastName || ""}`;
        return nameA.localeCompare(nameB);
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        return (
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
        );
      },
    },
    {
      title: "Therapist",
      dataIndex: "therapist",
      sorter: (a: any, b: any) => {
        const nameA = a.appointment?.doctor?.fullName || "";
        const nameB = b.appointment?.doctor?.fullName || "";
        return nameA.localeCompare(nameB);
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        return <div style={{ fontSize: 14 }}>{app?.doctor?.fullName || "—"}</div>;
      },
    },
    {
      title: "Therapies",
      dataIndex: "therapies",
      render: (_: any, record: any) => {
        const c = record.consultation;
        return (
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
        );
      },
    },
    {
      title: "Total Amt",
      dataIndex: "totalAmount",
      sorter: (a: any, b: any) => (a.consultation?.finalTotalAmount || 0) - (b.consultation?.finalTotalAmount || 0),
      render: (_: any, record: any) => {
        const c = record.consultation;
        return (
          <div>
            <div className="fw-semibold">₹{(c?.finalTotalAmount || 0).toLocaleString()}</div>
            {c && c.amountPaid > 0 && (
              <div className="text-muted" style={{ fontSize: 11 }}>
                Paid: ₹{(c.amountPaid || 0).toLocaleString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Invoice",
      dataIndex: "invoice",
      render: (_: any, record: any) => {
        const c = record.consultation;
        return c?.invoice ? (
          <span
            className={`badge bg-${payStatusColors[c.invoice.paymentStatus] || "secondary"}-subtle text-${payStatusColors[c.invoice.paymentStatus] || "secondary"}`}
            style={{ borderRadius: 6, fontSize: 11 }}
          >
            {c.invoice.paymentStatus}
          </span>
        ) : (
          <span className="text-muted" style={{ fontSize: 12 }}>—</span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a: any, b: any) => {
        const statusA = a.consultation ? a.consultation.status : "Not Started";
        const statusB = b.consultation ? b.consultation.status : "Not Started";
        return statusA.localeCompare(statusB);
      },
      render: (_: any, record: any) => {
        const c = record.consultation;
        const status = c ? c.status : "Not Started";
        return (
          <span
            className={`badge bg-${statusColors[status] || "secondary"}-subtle text-${statusColors[status] || "secondary"}`}
            style={{ borderRadius: 6, padding: "4px 10px" }}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: any, b: any) => {
        const timeA = a.appointment?.scheduledAt ? new Date(a.appointment.scheduledAt).getTime() : 0;
        const timeB = b.appointment?.scheduledAt ? new Date(b.appointment.scheduledAt).getTime() : 0;
        return timeA - timeB;
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        return <div style={{ fontSize: 13 }}>{formatDate(app?.scheduledAt)}</div>;
      },
    },
    {
      title: "Actions",
      align: "center" as const,
      render: (_: any, record: any) => {
        const app = record.appointment;
        const c = record.consultation;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            {!c ? (
              <button
                className="btn btn-sm btn-success text-white d-flex align-items-center justify-content-center"
                style={{ borderRadius: 8, width: 34, height: 34 }}
                title="Start Consultation"
                disabled={startingId === app?.id}
                onClick={() => handleStartConsultation(app.id)}
              >
                {startingId === app?.id ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="ti ti-player-play-filled" />
                )}
              </button>
            ) : c.status === "Draft" ? (
              <button
                className="btn btn-sm btn-success text-white d-flex align-items-center justify-content-center"
                style={{ borderRadius: 8, width: 34, height: 34 }}
                title="Resume Consultation"
                onClick={() => navigate(`/therapy-consultations/${c.id}`)}
              >
                <i className="ti ti-player-play-filled" />
              </button>
            ) : (
              <button
                className="btn btn-sm btn-primary d-flex align-items-center justify-content-center"
                style={{ borderRadius: 8, width: 34, height: 34 }}
                title="View Details"
                onClick={() => navigate(`/therapy-consultations/${c.id}`)}
              >
                <i className="ti ti-eye" />
              </button>
            )}
            {c && (
              <button
                className="btn btn-sm btn-danger d-flex align-items-center justify-content-center"
                style={{ borderRadius: 8, width: 34, height: 34 }}
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
        );
      },
      width: 110,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="page-title">Therapy Consultations</h3>
            </div>
          </div>
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
                <Datatable
                  columns={columns}
                  dataSource={filtered}
                  Selection={false}
                  searchText=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationList;
