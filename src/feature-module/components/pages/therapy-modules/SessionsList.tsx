import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { PrescriptionModal } from "./PrescriptionModal";
import { IconFormControl } from "../../../../core/common/form-fields";
import Datatable from "../../../../core/common/dataTable";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Doctor {
  id: string;
  fullName: string;
}

interface Therapy {
  id: string;
  serviceName: string;
}

interface SessionAppointment {
  id: string;
  appointmentCode: string;
  scheduledAt: string;
  status: string;
  paymentStatus: string;
  sessionNumber: number | null;
  patient: Patient | null;
  doctor: Doctor | null;
  therapyPlan: {
    id: string;
    therapyId: string | null;
    therapyName: string | null;
    totalSessions: number;
  } | null;
  consultation: {
    id: string;
    status: string;
    paymentStatus: string;
    finalTotalAmount: number;
    amountPaid: number;
  } | null;
}

const getInitial = (value?: string) =>
  (value || "").trim().charAt(0).toUpperCase() || "?";

const getStatusStyle = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("checked out") || s.includes("completed")) {
    return { bg: "#e6f8ef", color: "#198754", icon: "ti ti-circle-check" };
  }
  if (s.includes("confirmed") || s.includes("approved")) {
    return { bg: "#f0eaff", color: "#6610f2", icon: "ti ti-circle-check" };
  }
  if (s.includes("checked in") || s.includes("in-progress") || s.includes("pending")) {
    return { bg: "#fff3cd", color: "#fd7e14", icon: "ti ti-clock" };
  }
  if (s.includes("schedule")) {
    return { bg: "#e8f3ff", color: "#0d6efd", icon: "ti ti-calendar-event" };
  }
  if (s.includes("cancel")) {
    return { bg: "#fdeded", color: "#dc3545", icon: "ti ti-circle-x" };
  }
  return { bg: "#f8f9fa", color: "#6c757d", icon: "ti ti-point" };
};

const SessionsList = () => {
  const [sessions, setSessions] = useState<SessionAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [datePreset, setDatePreset] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedTherapyId, setSelectedTherapyId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);

  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  const handleStatusToggle = async (appointmentId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "Schedule" || currentStatus === "Scheduled") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Checked In";
    else if (currentStatus === "Checked In") nextStatus = "Checked Out";

    if (nextStatus) {
      setTogglingId(appointmentId);
      try {
        await apiPut(`/api/appointments/${appointmentId}`, { status: nextStatus });
        toast.success(`Session marked as ${nextStatus}`);
        fetchSessions();
      } catch (err: any) {
        toast.error(err.message || "Failed to update session status");
      } finally {
        setTogglingId(null);
      }
    }
  };

  const fetchMetadata = async () => {
    try {
      const [pts, docs, ths] = await Promise.all([
        apiGet<Patient[]>("/api/patients"),
        apiGet<Doctor[]>("/api/doctors?type=therapist"),
        apiGet<Therapy[]>("/api/services?type=therapy"),
      ]);
      setPatients(Array.isArray(pts) ? pts : []);
      setDoctors(Array.isArray(docs) ? docs : []);
      setTherapies(Array.isArray(ths) ? ths : []);
    } catch (err) {
      console.error("Failed to load filter metadata:", err);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<SessionAppointment[]>("/api/appointments?appointmentType=therapy");
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load therapy sessions");
      toast.error("Failed to load therapy sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchSessions();
  }, []);

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const dt = new Date(dateTimeStr);
      return dt.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateTimeStr;
    }
  };

  const handleClearFilters = () => {
    setDatePreset("All");
    setStartDate("");
    setEndDate("");
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setSelectedTherapyId("");
    setSearchTerm("");
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const patientName = `${session.patient?.firstName || ""} ${session.patient?.lastName || ""}`.toLowerCase();
        const docName = (session.doctor?.fullName || "").toLowerCase();
        const code = (session.appointmentCode || "").toLowerCase();
        const thName = (session.therapyPlan?.therapyName || "").toLowerCase();
        if (!patientName.includes(term) && !docName.includes(term) && !code.includes(term) && !thName.includes(term)) {
          return false;
        }
      }

      let matchDate = true;
      const sessionTime = new Date(session.scheduledAt).getTime();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (datePreset === "Today") {
        matchDate = sessionTime >= todayStart.getTime() && sessionTime <= todayEnd.getTime();
      } else if (datePreset === "Tomorrow") {
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);
        matchDate = sessionTime >= tomorrowStart.getTime() && sessionTime <= tomorrowEnd.getTime();
      } else if (datePreset === "7Days") {
        const sevenDaysLaterEnd = new Date();
        sevenDaysLaterEnd.setDate(sevenDaysLaterEnd.getDate() + 7);
        sevenDaysLaterEnd.setHours(23, 59, 59, 999);
        matchDate = sessionTime >= todayStart.getTime() && sessionTime <= sevenDaysLaterEnd.getTime();
      } else if (datePreset === "Custom") {
        if (startDate) {
          const start = new Date(startDate).setHours(0, 0, 0, 0);
          if (sessionTime < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (sessionTime > end) matchDate = false;
        }
      }
      if (!matchDate) return false;

      if (selectedPatientId && session.patient?.id !== selectedPatientId) return false;
      if (selectedDoctorId && session.doctor?.id !== selectedDoctorId) return false;
      if (selectedTherapyId && session.therapyPlan?.therapyId !== selectedTherapyId) return false;

      return true;
    });
  }, [
    sessions,
    searchTerm,
    datePreset,
    startDate,
    endDate,
    selectedPatientId,
    selectedDoctorId,
    selectedTherapyId,
  ]);

  const tableData = useMemo(
    () =>
      filteredSessions.map((session) => {
        const patientName = session.patient
          ? `${session.patient.firstName} ${session.patient.lastName}`.trim()
          : "—";
        return {
          key: session.id,
          Session_Code: session.appointmentCode || "—",
          Date_Time: formatDateTime(session.scheduledAt),
          Patient: patientName,
          Therapist: session.doctor?.fullName || "—",
          Therapy_Service: session.therapyPlan?.therapyName || "—",
          Session_Number: session.sessionNumber
            ? `Session ${session.sessionNumber} of ${session.therapyPlan?.totalSessions || "—"}`
            : "—",
          Status: session.status,
          _raw: session,
        };
      }),
    [filteredSessions]
  );

  const columns = [
    {
      title: "Session Code",
      dataIndex: "Session_Code",
      render: (text: string) => <span className="fw-semibold text-dark fs-13">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Session_Code.localeCompare(b.Session_Code),
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      render: (text: string) => (
        <div className="d-flex align-items-center fw-semibold text-dark fs-13">
          <i className="ti ti-calendar-event me-2 text-primary fs-16" />
          {text || "—"}
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <span className="avatar me-2">
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                fontSize: "16px",
              }}
            >
              {getInitial(text)}
            </span>
          </span>
          <div className="lh-1">
            <h6 className="mb-0 fs-14 fw-semibold text-dark">{text}</h6>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Therapist",
      dataIndex: "Therapist",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Therapist.localeCompare(b.Therapist),
    },
    {
      title: "Therapy Service",
      dataIndex: "Therapy_Service",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Therapy_Service.localeCompare(b.Therapy_Service),
    },
    {
      title: "Session Number",
      dataIndex: "Session_Number",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Session_Number.localeCompare(b.Session_Number),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: (typeof tableData)[0]) => {
        const style = getStatusStyle(text);
        const session = record._raw;
        return (
          <div className="d-flex flex-column align-items-start gap-1">
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
              {text}
            </span>
            {["Schedule", "Scheduled", "Confirmed", "Checked In"].includes(session.status) && (
              <div
                className="form-check form-switch p-0 d-flex align-items-center gap-1 mt-1"
                style={{ minHeight: "auto" }}
              >
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  checked={togglingId === session.id}
                  onChange={() => handleStatusToggle(session.id, session.status)}
                  style={{ cursor: "pointer", width: "30px", height: "16px" }}
                  disabled={togglingId === session.id}
                />
                <span className="text-dark fw-bold small" style={{ fontSize: "10px" }}>
                  {session.status === "Schedule" || session.status === "Scheduled"
                    ? "Confirm"
                    : session.status === "Confirmed"
                    ? "Checkin"
                    : "Checkout"}
                </span>
              </div>
            )}
          </div>
        );
      },
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "Prescription",
      className: "text-center text-nowrap",
      align: "center" as const,
      width: 130,
      render: (_: unknown, record: (typeof tableData)[0]) => {
        const session = record._raw;
        return (
          <button
            type="button"
            className={`btn btn-sm sessions-rx-btn ${
              session.consultation ? "rx-success" : "rx-primary"
            } d-inline-flex align-items-center justify-content-center gap-1 text-nowrap`}
            style={{
              borderRadius: 8,
              fontSize: 12,
              minWidth: 96,
              padding: "6px 14px",
              whiteSpace: "nowrap",
              border: "1px solid",
            }}
            data-bs-toggle="modal"
            data-bs-target="#prescription_modal"
            onClick={() => setSelectedAppt(session)}
          >
            <i className="ti ti-pill" style={{ flexShrink: 0 }} />
            <span>{session.consultation ? "Edit Rx" : "Add Rx"}</span>
          </button>
        );
      },
    },
  ];

  const hasActiveFilters =
    datePreset !== "All" ||
    !!startDate ||
    !!endDate ||
    !!selectedPatientId ||
    !!selectedDoctorId ||
    !!selectedTherapyId ||
    !!searchTerm;

  return (
    <div className="page-wrapper">
      <div className="content sessions-list-page">
        <style>{`
          .sessions-list-page .sessions-filter-card {
            border: none !important;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
          }
          .sessions-list-page .sessions-filter-card::before,
          .sessions-list-page .sessions-filter-card::after {
            display: none !important;
          }
          .sessions-list-page .sessions-rx-btn,
          .sessions-list-page .sessions-rx-btn:hover,
          .sessions-list-page .sessions-rx-btn:focus,
          .sessions-list-page .sessions-rx-btn:active {
            background: #fff !important;
            box-shadow: none !important;
          }
          .sessions-list-page .sessions-rx-btn.rx-success,
          .sessions-list-page .sessions-rx-btn.rx-success:hover,
          .sessions-list-page .sessions-rx-btn.rx-success:focus,
          .sessions-list-page .sessions-rx-btn.rx-success:active {
            color: #198754 !important;
            border-color: #198754 !important;
          }
          .sessions-list-page .sessions-rx-btn.rx-primary,
          .sessions-list-page .sessions-rx-btn.rx-primary:hover,
          .sessions-list-page .sessions-rx-btn.rx-primary:focus,
          .sessions-list-page .sessions-rx-btn.rx-primary:active {
            color: #0d6efd !important;
            border-color: #0d6efd !important;
          }
        `}</style>
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">
              Therapy Sessions
              <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                Total Sessions : {loading ? "…" : sessions.length}
              </span>
            </h4>
            <p className="text-muted mb-0 fs-13 mt-1">
              Track, manage and review scheduled client sessions.
            </p>
          </div>
          <div className="text-end d-flex">
            <Link
              to="/book-therapy-appointment"
              className="btn btn-primary ms-2 fs-13 btn-md"
            >
              <i className="ti ti-plus me-1" /> Book Therapy Session
            </Link>
          </div>
        </div>

        {/* Filter Card — no border, soft shadow */}
        <div
          className="card mb-3 sessions-filter-card"
          style={{
            border: "none",
            outline: "none",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="card-body py-3">
            <div className="row g-3 align-items-end">
              <div className={datePreset === "Custom" ? "col-lg-2 col-md-4 col-sm-6" : "col-lg-3 col-md-6 col-sm-6"}>
                <label className="form-label mb-1 fw-semibold small text-muted">Date Filter</label>
                <select
                  className="form-select form-select-sm"
                  value={datePreset}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDatePreset(val);
                    if (val !== "Custom") {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  style={{ borderRadius: 8 }}
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="7Days">7 Days</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              {datePreset === "Custom" && (
                <>
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <label className="form-label mb-1 fw-semibold small text-muted">From Date</label>
                    <IconFormControl
                      type="date"
                      fieldLabel="From Date"
                      className="form-control-sm"
                      placeholder="From Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <label className="form-label mb-1 fw-semibold small text-muted">To Date</label>
                    <IconFormControl
                      type="date"
                      fieldLabel="To Date"
                      className="form-control-sm"
                      placeholder="To Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </>
              )}

              <div className={datePreset === "Custom" ? "col-lg-2 col-md-4 col-sm-6" : "col-lg-3 col-md-6 col-sm-6"}>
                <label className="form-label mb-1 fw-semibold small text-muted">Patient</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  style={{ borderRadius: 8 }}
                >
                  <option value="">All Patients</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className={datePreset === "Custom" ? "col-lg-2 col-md-4 col-sm-6" : "col-lg-3 col-md-6 col-sm-6"}>
                <label className="form-label mb-1 fw-semibold small text-muted">Therapist</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{ borderRadius: 8 }}
                >
                  <option value="">All Therapists</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className={datePreset === "Custom" ? "col-lg-2 col-md-4 col-sm-6" : "col-lg-3 col-md-6 col-sm-6"}>
                <label className="form-label mb-1 fw-semibold small text-muted">Therapy Service</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedTherapyId}
                  onChange={(e) => setSelectedTherapyId(e.target.value)}
                  style={{ borderRadius: 8 }}
                >
                  <option value="">All Therapies</option>
                  {therapies.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.serviceName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-3 border-top">
              <div className="flex-grow-1" style={{ maxWidth: "350px" }}>
                <div className="table-search mb-0 w-100">
                  <div className="search-input w-100">
                    <IconFormControl
                      type="text"
                      fieldLabel="search"
                      className="form-control-sm"
                      placeholder="Search code, patient, therapist..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="fs-13 text-muted">
                  Showing <strong>{filteredSessions.length}</strong> of <strong>{sessions.length}</strong> Sessions
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={handleClearFilters}
                    style={{ borderRadius: 6 }}
                  >
                    <i className="ti ti-rotate-clockwise" /> Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={fetchSessions}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0">Loading sessions…</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={tableData}
              Selection={false}
              searchText=""
              emptyTitle="No therapy sessions"
              emptyMessage="No therapy sessions match your selected filters."
            />
          </div>
        )}
      </div>

      <PrescriptionModal
        appointment={selectedAppt}
        onSaveSuccess={fetchSessions}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  );
};

export default SessionsList;
