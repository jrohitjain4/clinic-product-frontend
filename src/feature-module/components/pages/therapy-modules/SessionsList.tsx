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

  const selectedPatientLabel = selectedPatientId
    ? (() => {
        const p = patients.find((x) => x.id === selectedPatientId);
        return p ? `${p.firstName} ${p.lastName}`.trim() : "Patient";
      })()
    : "All Patients";

  const selectedDoctorLabel = selectedDoctorId
    ? doctors.find((d) => d.id === selectedDoctorId)?.fullName || "Therapist"
    : "All Therapists";

  const selectedTherapyLabel = selectedTherapyId
    ? therapies.find((t) => t.id === selectedTherapyId)?.serviceName || "Therapy"
    : "All Therapies";

  const dateFilterLabel =
    datePreset === "All"
      ? "All Dates"
      : datePreset === "7Days"
      ? "7 Days"
      : datePreset === "Custom"
      ? "Custom Range"
      : datePreset;

  return (
    <div className="page-wrapper">
      <div className="content sessions-list-page">
        <style>{`
          .sessions-list-page .sessions-header-search {
            width: 280px;
            min-width: 220px;
            max-width: 320px;
            flex: 1 1 280px;
          }
          .sessions-list-page .sessions-header-search .icon-field-shell {
            height: 48px !important;
            min-height: 45px !important;
            max-height: 38px !important;
            padding: 0 10px 0 8px !important;
            gap: 8px !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          .sessions-list-page .sessions-header-search .icon-field-shell:focus-within {
            box-shadow: none !important;
          }
          .sessions-list-page .sessions-header-search .icon-field-box {
            width: 22px !important;
            height: 22px !important;
            border-radius: 5px !important;
          }
          .sessions-list-page .sessions-header-search .icon-field-box i {
            font-size: 12px !important;
          }
          .sessions-list-page .sessions-header-search .form-control,
          .sessions-list-page .sessions-header-search .form-control-sm,
          .sessions-list-page .sessions-header-search .icon-field-input {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          .sessions-list-page .sessions-filters-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            overflow: visible;
          }
          .sessions-list-page .appointments-filter-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            flex: 1 1 auto;
            min-width: 0;
            overflow: visible;
          }
          .sessions-list-page .sessions-filters-row .dropdown {
            position: relative;
          }
          .sessions-list-page .sessions-filters-row .dropdown-menu.show {
            display: block !important;
            z-index: 1055 !important;
          }
          .sessions-list-page .sessions-filter-select {
            height: 38px !important;
            min-height: 38px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            padding: 0 32px 0 8px !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            min-width: 130px !important;
            max-width: 150px !important;
            width: 140px !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            background-position: right 8px center !important;
            background-size: 11px 9px !important;
            display: inline-flex !important;
            align-items: center !important;
          }
          .sessions-list-page .sessions-filter-select > span {
            display: block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 8px;
            line-height: 1 !important;
          }
          .sessions-list-page .clear-filter-btn {
            height: 38px !important;
            min-height: 38px !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            padding: 0 10px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            background-color: #dc3545 !important;
            color: #fff !important;
            border-color: #dc3545 !important;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 2px;
            box-sizing: border-box !important;
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
          /* Book Therapy Session — forced size to match Book Appointment visual */
          .sessions-list-page a.sessions-book-btn,
          .sessions-list-page a.sessions-book-btn:link,
          .sessions-list-page a.sessions-book-btn:visited,
          .sessions-list-page a.sessions-book-btn:hover,
          .sessions-list-page a.sessions-book-btn:focus,
          .sessions-list-page a.sessions-book-btn:active,
          .sessions-list-page a.sessions-book-btn:focus-visible {
            box-sizing: border-box !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            width: auto !important;
            height: 48px !important;
            min-height: 48px !important;
            max-height: 48px !important;
            padding: 0 20px !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 8px !important;
            font-family: inherit !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            line-height: 1 !important;
            color: #fff !important;
            text-decoration: none !important;
            white-space: nowrap !important;
            cursor: pointer !important;
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%) !important;
            background-image: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%) !important;
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.25) !important;
            transition: background 0.2s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out !important;
            outline: none !important;
            appearance: none !important;
            -webkit-appearance: none !important;
          }
          .sessions-list-page a.sessions-book-btn i {
            font-size: 16px !important;
            line-height: 1 !important;
            color: #fff !important;
          }
          .sessions-list-page a.sessions-book-btn:hover,
          .sessions-list-page a.sessions-book-btn:focus {
            background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%) !important;
            background-image: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%) !important;
            box-shadow: 0 6px 14px rgba(139, 92, 246, 0.35) !important;
            color: #fff !important;
            text-decoration: none !important;
          }
          .sessions-list-page a.sessions-book-btn:active {
            transform: scale(0.98) !important;
          }
        `}</style>

        {/* Same header layout as Therapy Appointments */}
        <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
          <div className="flex-grow-1">
            <h4 className="page-title fw-bold mb-0 d-flex align-items-center flex-wrap gap-2">
              Therapy Sessions
              <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13">
                Total Sessions : {loading ? "…" : sessions.length}
              </span>
            </h4>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/book-therapy-appointment"
              className="sessions-book-btn"
              style={{
                height: 48,
                minHeight: 48,
                maxHeight: 48,
                padding: "0 20px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#fff",
                textDecoration: "none",
                background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 10px rgba(139, 92, 246, 0.25)",
                border: "none",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              <i className="ti ti-plus" /> Book Therapy Session
            </Link>
          </div>
        </div>

        <div className="sessions-filters-row mb-3">
          <div className="sessions-header-search table-search mb-0">
            <div className="search-input w-100">
              <IconFormControl
                type="text"
                fieldLabel="search"
                className="form-control-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="appointments-filter-actions">
            <div className="dropdown flex-shrink-0">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center sessions-filter-select"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
              >
                <span className="text-truncate">
                  <span className="text-muted">
                    <i className="ti ti-calendar me-1" />
                  </span>
                  {dateFilterLabel}
                </span>
              </Link>
              <ul
                className="dropdown-menu dropdown-menu-end p-2"
                style={{ minWidth: 180, zIndex: 1050 }}
              >
                {[
                  { value: "All", label: "All Dates" },
                  { value: "Today", label: "Today" },
                  { value: "Tomorrow", label: "Tomorrow" },
                  { value: "7Days", label: "7 Days" },
                  { value: "Custom", label: "Custom Range" },
                ].map((preset) => (
                  <li key={preset.value}>
                    <Link
                      to="#"
                      className={`dropdown-item rounded-1 fs-12 py-2 ${
                        datePreset === preset.value ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (preset.value === "Custom") e.stopPropagation();
                        setDatePreset(preset.value);
                        if (preset.value !== "Custom") {
                          setStartDate("");
                          setEndDate("");
                        }
                      }}
                    >
                      {preset.label}
                    </Link>
                  </li>
                ))}
                {datePreset === "Custom" && (
                  <li className="p-2 border-top mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex flex-column gap-1">
                      <label className="text-muted fs-10 fw-bold text-uppercase mb-0">Start Date</label>
                      <input
                        type="date"
                        className="form-control fs-12 px-2 py-1"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label className="text-muted fs-10 fw-bold text-uppercase mb-0 mt-1">End Date</label>
                      <input
                        type="date"
                        className="form-control fs-12 px-2 py-1"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <div className="dropdown flex-shrink-0">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center sessions-filter-select"
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate pe-1">
                  <span className="text-muted">
                    <i className="ti ti-user me-1" />
                  </span>
                  {selectedPatientLabel}
                </span>
              </Link>
              <ul
                className="dropdown-menu dropdown-menu-end p-2"
                style={{ minWidth: 200, maxHeight: 280, overflowY: "auto", zIndex: 1050 }}
              >
                <li>
                  <Link
                    to="#"
                    className={`dropdown-item rounded-1 fs-12 py-2 ${!selectedPatientId ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPatientId("");
                    }}
                  >
                    All Patients
                  </Link>
                </li>
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="#"
                      className={`dropdown-item rounded-1 fs-12 py-2 ${
                        selectedPatientId === p.id ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedPatientId(p.id);
                      }}
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dropdown flex-shrink-0">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center sessions-filter-select"
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate pe-1">
                  <span className="text-muted">
                    <i className="ti ti-user-heart me-1" />
                  </span>
                  {selectedDoctorLabel}
                </span>
              </Link>
              <ul
                className="dropdown-menu dropdown-menu-end p-2"
                style={{ minWidth: 200, maxHeight: 280, overflowY: "auto", zIndex: 1050 }}
              >
                <li>
                  <Link
                    to="#"
                    className={`dropdown-item rounded-1 fs-12 py-2 ${!selectedDoctorId ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedDoctorId("");
                    }}
                  >
                    All Therapists
                  </Link>
                </li>
                {doctors.map((d) => (
                  <li key={d.id}>
                    <Link
                      to="#"
                      className={`dropdown-item rounded-1 fs-12 py-2 ${
                        selectedDoctorId === d.id ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedDoctorId(d.id);
                      }}
                    >
                      {d.fullName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dropdown flex-shrink-0">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center sessions-filter-select"
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate pe-1">
                  <span className="text-muted">
                    <i className="ti ti-activity me-1" />
                  </span>
                  {selectedTherapyLabel}
                </span>
              </Link>
              <ul
                className="dropdown-menu dropdown-menu-end p-2"
                style={{ minWidth: 200, maxHeight: 280, overflowY: "auto", zIndex: 1050 }}
              >
                <li>
                  <Link
                    to="#"
                    className={`dropdown-item rounded-1 fs-12 py-2 ${!selectedTherapyId ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTherapyId("");
                    }}
                  >
                    All Therapies
                  </Link>
                </li>
                {therapies.map((t) => (
                  <li key={t.id}>
                    <Link
                      to="#"
                      className={`dropdown-item rounded-1 fs-12 py-2 ${
                        selectedTherapyId === t.id ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTherapyId(t.id);
                      }}
                    >
                      {t.serviceName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {hasActiveFilters && (
              <button type="button" className="btn clear-filter-btn" onClick={handleClearFilters}>
                <i className="ti ti-x" /> Clear
              </button>
            )}
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
