import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { PrescriptionModal } from "./PrescriptionModal";
import { IconFormControl } from "../../../../core/common/form-fields";

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

const SessionsList = () => {
  const [sessions, setSessions] = useState<SessionAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters state
  const [datePreset, setDatePreset] = useState("All"); // All, Today, Tomorrow, 7Days, Custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedTherapyId, setSelectedTherapyId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Metadata dropdowns
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);

  // Prescription states
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
      case "Completed":
      case "Checked Out":
        return "bg-soft-success text-success border-success";
      case "Checked In":
      case "In-Progress":
        return "bg-soft-warning text-warning border-warning";
      case "Schedule":
      case "Scheduled":
        return "bg-soft-primary text-primary border-primary";
      case "Cancelled":
        return "bg-soft-danger text-danger border-danger";
      default:
        return "bg-soft-secondary text-secondary border-secondary";
    }
  };

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

  // Filter logic
  const filteredSessions = sessions.filter((session) => {
    // 1. Search term match
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

    // 2. Date match
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

    // 3. Dropdowns
    if (selectedPatientId && session.patient?.id !== selectedPatientId) return false;
    if (selectedDoctorId && session.doctor?.id !== selectedDoctorId) return false;
    if (selectedTherapyId && session.therapyPlan?.therapyId !== selectedTherapyId) return false;

    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-4 pb-3 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">Therapy Sessions</h4>
            <p className="text-muted mb-0 fs-13">Track, manage and review scheduled client sessions.</p>
          </div>
          <div className="text-end d-flex">
            <Link to="/book-therapy-appointment" className="btn btn-primary ms-2 fs-13 btn-md" style={{ borderRadius: 10 }}>
              <i className="ti ti-plus me-1" /> Book Therapy Session
            </Link>
          </div>
        </div>

        {/* Filter Card */}
        <div className="card border shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body py-3">
            <div className="row g-3 align-items-end">
              {/* Date Preset Selector */}
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

              {/* Custom Date Inputs */}
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

              {/* Patient Selector */}
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

              {/* Therapist Selector */}
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

              {/* Therapy Selector */}
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
                {(datePreset !== "All" || startDate || endDate || selectedPatientId || selectedDoctorId || selectedTherapyId || searchTerm) && (
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

        {/* Sessions Table */}
        <div className="card border shadow-sm" style={{ borderRadius: 12, overflow: "hidden" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr style={{ fontSize: 13, textTransform: "uppercase" }}>
                    <th className="py-3 px-4">Session Code</th>
                    <th className="py-3">Date & Time</th>
                    <th className="py-3">Patient</th>
                    <th className="py-3">Therapist</th>
                    <th className="py-3">Therapy Service</th>
                    <th className="py-3">Session Number</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center">Prescription</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14 }}>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-danger fw-semibold">
                        {error}
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No therapy sessions match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const patientName = session.patient
                        ? `${session.patient.firstName} ${session.patient.lastName}`.trim()
                        : "—";
                      const therapistName = session.doctor?.fullName || "—";
                      const therapyName = session.therapyPlan?.therapyName || "—";
                      const sessionText = session.sessionNumber
                        ? `Session ${session.sessionNumber} of ${session.therapyPlan?.totalSessions || "—"}`
                        : "—";

                      return (
                        <tr key={session.id}>
                          <td className="px-4">
                            <span className="fw-bold text-dark">{session.appointmentCode}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1.5 text-slate-700">
                              <i className="ti ti-calendar text-muted fs-14" />
                              <span>{formatDateTime(session.scheduledAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-xs me-2">
                                <span className="avatar-title rounded-circle bg-soft-primary text-primary fw-semibold fs-11" style={{ width: 26, height: 26 }}>
                                  {patientName[0]}
                                </span>
                              </div>
                              <span className="fw-semibold text-dark">{patientName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-slate-700">{therapistName}</span>
                          </td>
                          <td>
                            <span className="text-dark fw-medium">{therapyName}</span>
                          </td>
                          <td>
                            <span className="text-slate-600">{sessionText}</span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column align-items-center gap-1">
                              <span className={`badge border ${getStatusBadge(session.status)} px-2.5 py-1 fs-12`} style={{ borderRadius: 6 }}>
                                {session.status}
                              </span>
                              {["Schedule", "Scheduled", "Confirmed", "Checked In"].includes(session.status) && (
                                <div className="form-check form-switch p-0 d-flex align-items-center justify-content-center gap-1 mt-1" style={{ minHeight: 'auto' }}>
                                  <input
                                    className="form-check-input ms-0"
                                    type="checkbox"
                                    role="switch"
                                    checked={togglingId === session.id}
                                    onChange={() => handleStatusToggle(session.id, session.status)}
                                    style={{ cursor: 'pointer', width: '30px', height: '16px' }}
                                    disabled={togglingId === session.id}
                                  />
                                  <span className="text-dark fw-bold small ms-1" style={{ fontSize: '10px' }}>
                                    {(session.status === "Schedule" || session.status === "Scheduled") ? "Confirm" : session.status === "Confirmed" ? "Checkin" : "Checkout"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className={`btn btn-sm ${session.consultation ? "btn-outline-success" : "btn-outline-primary"} d-inline-flex align-items-center gap-1 py-1 px-2.5`}
                              style={{ borderRadius: 6, fontSize: 12 }}
                              data-bs-toggle="modal"
                              data-bs-target="#prescription_modal"
                              onClick={() => setSelectedAppt(session)}
                            >
                              <i className="ti ti-pill" />
                              {session.consultation ? "Edit Rx" : "Add Rx"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
