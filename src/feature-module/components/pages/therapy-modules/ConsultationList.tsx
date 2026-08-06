import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { apiGet, apiDelete, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import EmptyState from "../../../../core/common/emptyState";
import { all_routes } from "../../../routes/all_routes";
import Datatable from "../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { resolveMediaUrl, apiUrl } from "../../../../core/config/api";

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

const getInitial = (value?: string) =>
  (value || "").trim().charAt(0).toUpperCase() || "?";

const AVATAR_SIZE = 40;

const paymentBadgeStyle = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("paid") && !s.includes("partial") && !s.includes("unpaid")) {
    return { bg: "#e6f8ef", color: "#198754", icon: "ti ti-circle-check" };
  }
  if (s.includes("partial")) {
    return { bg: "#fff3cd", color: "#fd7e14", icon: "ti ti-clock" };
  }
  // Unpaid / Pending / default
  return { bg: "#fdeded", color: "#dc3545", icon: "ti ti-alert-circle" };
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const style = paymentBadgeStyle(status);
  return (
    <span
      className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 600,
        fontSize: "12px",
      }}
    >
      <i className={`${style.icon} fs-14`} />
      {status}
    </span>
  );
};

const ConsultationList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const getDoctorImg = (doctor: any) => {
    if (!doctor?.profileImage || doctor.profileImage.trim() === "" || doctor.profileImage.includes("placeholder")) {
      return null;
    }
    return resolveMediaUrl(doctor.profileImage);
  };

  const customSelectStyles = `
    .compact-table .ant-table-tbody > tr > td {
      padding: 8px 12px !important;
    }
    .compact-table .avatar-equal {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      flex-shrink: 0;
    }
    .compact-table .avatar-equal img {
      width: 40px !important;
      height: 40px !important;
      object-fit: cover;
    }
    .compact-table .datatable-table-shell {
      margin-bottom: 12px !important;
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

  const handleMarkPaymentPaid = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/appointments/${appointmentId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentStatus: "Paid" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update payment status");
      }
      toast.success("Payment marked as Paid");
      fetchConsultancyData();
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      toast.error(err.message || "Failed to update payment status");
    }
  };

  const counts = useMemo(() => {
    return {
      all: items.length,
      started: items.filter(item => !!item.consultation).length,
      notStarted: items.filter(item => !item.consultation).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (filterStatus !== "All") {
        if (filterStatus === "Started") {
          if (!item.consultation) return false;
        } else if (filterStatus === "Not Started") {
          if (item.consultation) return false;
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
      width: 90,
      className: "text-nowrap",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", minWidth: 90 },
      }),
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
        const code = c ? c.consultationCode : (app?.appointmentCode || "—");
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span
              className="badge px-2 py-1 fw-semibold"
              style={{
                backgroundColor: "transparent",
                color: "#4f46e5",
                border: "1px solid #4f46e5",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {code}
            </span>
            {!c && (
              <span className="badge bg-secondary-subtle text-secondary small" style={{ fontSize: 9, borderRadius: 4 }}>
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
        if (!app?.patient) return <span className="text-muted">—</span>;
        const fullName = `${app.patient.firstName || ""} ${app.patient.lastName || ""}`.trim();
        return (
          <div className="d-flex align-items-center">
            <Link
              to={all_routes.patientDetails.replace(":id", app.patient.id)}
              className="avatar avatar-equal me-2"
            >
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  fontSize: 16,
                }}
              >
                {getInitial(fullName)}
              </span>
            </Link>
            <div className="lh-1">
              <Link
                to={all_routes.patientDetails.replace(":id", app.patient.id)}
                className="text-dark fw-bold d-block mb-1 fs-13 text-nowrap"
              >
                {fullName || "—"}
              </Link>
              <span className="text-muted fs-11">{app.patient.phone || "—"}</span>
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
        if (!app?.doctor) return <span className="text-muted">—</span>;
        const name = app.doctor.fullName || "—";
        const img = getDoctorImg(app.doctor);
        return (
          <div className="d-flex align-items-center">
            <Link
              to={all_routes.doctorsDetails.replace(":id", app.doctor.id)}
              className="avatar avatar-equal me-2"
            >
              {img ? (
                <ImageWithBasePath
                  src={img}
                  alt="Doctor"
                  className="rounded-circle"
                  style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, objectFit: "cover" }}
                />
              ) : (
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    fontSize: 16,
                  }}
                >
                  {getInitial(name)}
                </span>
              )}
            </Link>
            <Link
              to={all_routes.doctorsDetails.replace(":id", app.doctor.id)}
              className="text-dark fw-medium fs-13 text-nowrap"
            >
              {name}
            </Link>
          </div>
        );
      },
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      sorter: (a: any, b: any) => {
        const timeA = a.appointment?.scheduledAt ? new Date(a.appointment.scheduledAt).getTime() : 0;
        const timeB = b.appointment?.scheduledAt ? new Date(b.appointment.scheduledAt).getTime() : 0;
        return timeA - timeB;
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        return (
          <div className="d-flex align-items-center fw-semibold text-dark fs-13">
            <i className="ti ti-calendar-event me-2 text-primary fs-16" />
            {formatDate(app?.scheduledAt)}
          </div>
        );
      },
    },
    {
      title: "Invoice Details",
      dataIndex: "invoiceDetails",
      render: (_: any, record: any) => {
        const c = record.consultation;
        const inv = c?.invoice;
        if (!c || !inv) {
          return <span className="text-muted fs-12">—</span>;
        }

        const total = inv.totalAmount || 0;
        const paid = inv.amountPaid || 0;
        const remaining = Math.max(0, total - paid);
        const status = inv.paymentStatus || "Unpaid";

        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="fw-semibold text-dark fs-13">{inv.invoiceCode || "—"}</span>
            {(total > 0 || remaining > 0) && (
              <div className="text-muted fs-11" style={{ lineHeight: "1.2" }}>
                {total > 0 && <div>Total: ₹{total.toLocaleString()}</div>}
                {remaining > 0 && <div className="fw-medium text-danger">Due: ₹{remaining.toLocaleString()}</div>}
              </div>
            )}
            <PaymentStatusBadge status={status} />
          </div>
        );
      },
    },
    {
      title: "Total Amt",
      dataIndex: "totalAmount",
      sorter: (a: any, b: any) => {
        const amtA = a.consultation ? (a.consultation.finalTotalAmount || 0) : (a.appointment?.finalFee || a.appointment?.consultationFee || 0);
        const amtB = b.consultation ? (b.consultation.finalTotalAmount || 0) : (b.appointment?.finalFee || b.appointment?.consultationFee || 0);
        return amtA - amtB;
      },
      render: (_: any, record: any) => {
        const app = record.appointment;
        const c = record.consultation;

        const amount = c ? (c.finalTotalAmount || 0) : (app?.finalFee || app?.consultationFee || 0);
        const status = c?.invoice ? c.invoice.paymentStatus : (app?.paymentStatus || "Unpaid");
        const isPaid = status === "Paid";

        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="text-dark fw-bold">₹{amount.toLocaleString()}</span>
            <PaymentStatusBadge status={status} />
            {!isPaid && !c && app && (
              <button
                className="btn btn-xs btn-outline-success py-0 px-1 fs-10 fw-bold mt-1 text-uppercase"
                onClick={() => handleMarkPaymentPaid(app.id)}
                style={{ borderRadius: "4px" }}
              >
                Mark Paid
              </button>
            )}
          </div>
        );
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
            
            {/* Tab Filters: All, Started, Not Started */}
            <div className="status-buttons-group ms-auto">
              {[
                { key: "All", label: "All", count: counts.all },
                { key: "Started", label: "Started", count: counts.started },
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

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : finalFiltered.length === 0 ? (
            <div className="border rounded bg-white p-4">
              <EmptyState
                title="No consultancy appointments found"
                message="Confirmed therapy appointments will show up here to start or view consultations."
              />
            </div>
          ) : (
            <div className="table-responsive compact-table">
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
    </>
  );
};

export default ConsultationList;
