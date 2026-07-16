import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
  const [filterStatus, setFilterStatus] = useState("All");

  const customSelectStyles = `
    .compact-table .ant-table-tbody > tr > td {
      padding: 8px 12px !important;
    }
    .compact-table .avatar-md {
      width: 38px !important;
      height: 38px !important;
    }
    .compact-table .avatar-xs {
      width: 24px !important;
      height: 24px !important;
    }
    .compact-table .card {
      margin-bottom: 0 !important;
      border-radius: 8px !important;
    }

    .appointments-filter-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      width: 100%;
    }
    .appointments-filter-line h4 {
      font-size: 16px !important;
    }
    .status-buttons-group {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 4px;
      margin-left: auto !important;
    }
    .status-btn {
      padding: 0 8px !important;
      font-weight: 700 !important;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 1px;
      text-wrap: nowrap;
      border-radius: 6px !important;
      height: 32px !important;
      font-size: 11px !important;
    }
    .count-badge {
      font-size: 10px !important;
      padding: 2px 4px !important;
    }
  `;

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

  const counts = useMemo(() => {
    return {
      all: items.length,
      checkedOut: items.filter(item => item.appointment?.status === "Check Out").length,
      checkedIn: items.filter(item => item.appointment?.status === "Check In").length,
      confirmed: items.filter(item => item.appointment?.status === "Confirmed").length,
      notStarted: items.filter(item => !item.consultation).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (filterStatus !== "All") {
        if (filterStatus === "Not Started") {
          if (item.consultation) return false;
        } else {
          if (item.appointment?.status !== filterStatus) return false;
        }
      }

      // 2. Search Term Filter
      const app = item.appointment;
      const c = item.consultation;
      const pat = `${app?.patient?.firstName || ""} ${app?.patient?.lastName || ""}`.toLowerCase();
      const doc = (app?.doctor?.fullName || "").toLowerCase();
      const code = (c?.consultationCode || app?.appointmentCode || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return pat.includes(term) || doc.includes(term) || code.includes(term);
    });
  }, [items, filterStatus, searchTerm]);

  const finalFiltered = useMemo(() => {
    return filtered.map((item, index) => ({
      ...item,
      sr_no: index + 1,
    }));
  }, [filtered]);

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const columns = [
    {
      title: "Sr No.",
      dataIndex: "sr_no",
      render: (text: number) => <span className="fs-13 fw-medium text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.sr_no - b.sr_no,
      width: 70,
    },
    {
      title: "Consultation Code",
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
          <div className="d-flex flex-column align-items-start">
            <span className="text-primary fw-semibold">
              {c ? c.consultationCode : (app?.appointmentCode || "—")}
            </span>
            {!c && (
              <span className="badge bg-secondary-subtle text-secondary mt-1 small" style={{ fontSize: 9, borderRadius: 4 }}>
                Not Started
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Patient Name",
      dataIndex: "patient",
      sorter: (a: any, b: any) => {
        const nameA = `${a.appointment?.patient?.firstName || ""} ${a.appointment?.patient?.lastName || ""}`;
        const nameB = `${b.appointment?.patient?.firstName || ""} ${b.appointment?.patient?.lastName || ""}`;
        return nameA.localeCompare(nameB);
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        return (
          <div className="d-flex flex-column lh-1">
            <span className="fw-semibold text-dark fs-14">
              {app?.patient?.firstName} {app?.patient?.lastName}
            </span>
            {app?.patient?.phone && (
              <span className="text-muted fs-11 mt-1">{app.patient.phone}</span>
            )}
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
        return <span className="text-secondary">{app?.doctor?.fullName || "—"}</span>;
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
        const status = c?.invoice ? c.invoice.paymentStatus : "Unpaid";
        const isPaid = status === "Paid";
        const isPartial = status === "Partial Paid";
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="text-dark fw-bold">₹{(c?.finalTotalAmount || 0).toLocaleString()}</span>
            {c && (
              <span className={`badge border ${
                isPaid 
                  ? "badge-soft-success border-success text-success" 
                  : isPartial 
                  ? "badge-soft-warning border-warning text-warning" 
                  : "badge-soft-danger border-danger text-danger"
              } px-1 py-0.5 fs-11`}>
                {status}
              </span>
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
        let badgeColor = "badge-soft-secondary border-secondary text-secondary";
        if (status === "Confirmed") badgeColor = "badge-soft-success border-success text-success";
        if (status === "Draft") badgeColor = "badge-soft-warning border-warning text-warning";
        return (
          <span className={`badge border ${badgeColor} px-2 py-1 fs-12`}>
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
        return <span className="text-dark fs-13">{formatDate(app?.scheduledAt)}</span>;
      },
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: any) => {
        const app = record.appointment;
        const c = record.consultation;
        return (
          <div className="d-flex align-items-center justify-content-center gap-1">
            {!c ? (
              <button
                className="bg-transparent border-0 text-success p-1"
                title="Start Consultation"
                disabled={startingId === app?.id}
                onClick={() => handleStartConsultation(app.id)}
              >
                {startingId === app?.id ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="ti ti-player-play-filled fs-14" />
                )}
              </button>
            ) : c.status === "Draft" ? (
              <button
                className="bg-transparent border-0 text-success p-1"
                title="Resume Consultation"
                onClick={() => navigate(`/therapy-consultations/${c.id}`)}
              >
                <i className="ti ti-player-play-filled fs-14" />
              </button>
            ) : (
              <button
                className="bg-transparent border-0 text-info p-1"
                title="View Details"
                onClick={() => navigate(`/therapy-consultations/${c.id}`)}
              >
                <i className="ti ti-eye fs-14" />
              </button>
            )}
            {c && (
              <button
                className="bg-transparent border-0 text-danger p-1"
                title="Delete"
                disabled={deletingId === c.id}
                onClick={() => handleDelete(c.id)}
              >
                {deletingId === c.id ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="ti ti-trash fs-14" />
                )}
              </button>
            )}
          </div>
        );
      },
      width: 100,
    },
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="appointments-filter-line pb-3 mb-3 border-bottom">
            <h4 className="fw-bold mb-0 text-dark flex-shrink-0">Therapy Consultations</h4>
            
            {/* Tab Filters: All, Checked Out, Checked In, Confirmed, Not Started */}
            <div className="status-buttons-group ms-auto">
              {[
                { key: "All", label: "All", count: counts.all },
                { key: "Check Out", label: "Checked Out", count: counts.checkedOut },
                { key: "Check In", label: "Check In", count: counts.checkedIn },
                { key: "Confirmed", label: "Confirmed", count: counts.confirmed },
                { key: "Not Started", label: "Not Started", count: counts.notStarted }
              ].map((s) => (
                <button
                  key={s.key}
                  className={`btn btn-sm ${filterStatus === s.key ? "btn-primary shadow-sm" : "btn-light border bg-white"} status-btn`}
                  onClick={() => setFilterStatus(s.key)}
                >
                  {s.label}
                  <span className={`badge ${filterStatus === s.key ? "bg-white text-primary" : "bg-light text-dark"} ms-1 count-badge`}>
                    {s.count}
                  </span>
                </button>
              ))}
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
                  dataSource={finalFiltered}
                  Selection={false}
                  searchText=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ConsultationList;
