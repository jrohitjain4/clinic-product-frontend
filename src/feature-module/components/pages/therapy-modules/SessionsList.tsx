import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPut, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { useMedicines } from "../../../../core/hooks/useMedicines";
import { apiUrl } from "../../../../core/config/api";
import ImageWithBasePath from "../../../../core/imageWithBasePath";

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
  const { medicines: pharmacyMedicines } = useMedicines();
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [previousConsultations, setPreviousConsultations] = useState<any[]>([]);
  const [previousClinicPrescriptions, setPreviousClinicPrescriptions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const medicineOptions = useMemo(() => {
    return (pharmacyMedicines || []).map((m: any) => ({
      name: m.medicineName,
      category: m.category?.name || "General Medicine",
      strength: m.unit || "",
    }));
  }, [pharmacyMedicines]);

  const handleSelectMedicine = (index: number, opt: any) => {
    setSelectedConsultation((prev: any) => {
      if (!prev) return prev;
      const updatedMeds = [...(prev.medicines || [])];
      updatedMeds[index] = {
        ...updatedMeds[index],
        name: `${opt.name} - ${opt.category}`,
      };
      return { ...prev, medicines: updatedMeds };
    });
    setActiveSearchIndex(null);
  };

  const handleOpenPrescriptionModal = async (raw: any) => {
    setSelectedAppt(raw);
    setSelectedConsultation(null);
    setPreviousConsultations([]);
    setPreviousClinicPrescriptions([]);
    try {
      let consult: any;
      if (raw.consultation) {
        consult = await apiGet<any>(`/api/consultations/${raw.consultation.id}`);
      } else {
        consult = await apiPost<any>("/api/consultations", {
          appointmentId: raw.id,
          status: "Draft",
        });
        await fetchSessions();
      }
      setSelectedConsultation(consult);

      const pId = consult.patientId || raw.patientId;
      if (pId) {
        // Fetch past consultations
        const pastConsults = await apiGet<any[]>(`/api/consultations?patientId=${pId}`);
        setPreviousConsultations((pastConsults || []).filter((p: any) => p.id !== consult.id));

        // Fetch clinic prescriptions
        const clinicPres = await apiGet<any[]>(`/api/prescriptions`);
        setPreviousClinicPrescriptions((clinicPres || []).filter((p: any) => p.patientId === pId));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load/create prescription");
    }
  };

  const handleModalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConsultation) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/uploads/therapy-image"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to upload file");
        }

        const resData = await res.json();
        return { url: resData.url, remark: "" };
      });

      const newAttachments = await Promise.all(uploadPromises);
      const currentAttachments = selectedConsultation.attachments || [];
      const updatedAttachments = [...currentAttachments, ...newAttachments];

      const updatedConsult = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        attachments: updatedAttachments,
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
      });
      setSelectedConsultation(updatedConsult);
      toast.success("Prescription file(s) uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file(s)");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleUpdateModalRemark = (idx: number, remark: string) => {
    if (!selectedConsultation) return;
    const currentAttachments = [...(selectedConsultation.attachments || [])];
    currentAttachments[idx] = { ...currentAttachments[idx], remark };
    setSelectedConsultation({
      ...selectedConsultation,
      attachments: currentAttachments,
    });
  };

  const handleSaveModalAttachments = async () => {
    if (!selectedConsultation) return;
    try {
      const updated = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        attachments: selectedConsultation.attachments,
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
      });
      setSelectedConsultation(updated);
    } catch (err: any) {
      console.error("Failed to save attachments:", err);
    }
  };

  const handleRemoveModalAttachment = async (idx: number) => {
    if (!selectedConsultation) return;
    try {
      const currentAttachments = (selectedConsultation.attachments || []).filter((_: any, i: number) => i !== idx);
      const updatedConsult = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        attachments: currentAttachments,
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
      });
      setSelectedConsultation(updatedConsult);
      toast.success("Attachment removed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove attachment");
    }
  };

  const addModalMedicineRow = () => {
    if (!selectedConsultation) return;
    const currentMeds = [...(selectedConsultation.medicines || [])];
    currentMeds.push({ name: "", dosage: "1-0-1", duration: "5 Days", instructions: "After Food" });
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: currentMeds,
    });
  };

  const updateModalMedicineRow = (idx: number, field: string, value: string) => {
    if (!selectedConsultation) return;
    const currentMeds = [...(selectedConsultation.medicines || [])];
    currentMeds[idx] = { ...currentMeds[idx], [field]: value };
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: currentMeds,
    });
  };

  const removeModalMedicineRow = (idx: number) => {
    if (!selectedConsultation) return;
    const currentMeds = (selectedConsultation.medicines || []).filter((_: any, i: number) => i !== idx);
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: currentMeds,
    });
  };

  const updateModalAdvice = (value: string) => {
    if (!selectedConsultation) return;
    setSelectedConsultation({
      ...selectedConsultation,
      advice: value,
    });
  };

  const handleSaveModalConsultation = async () => {
    if (!selectedConsultation) return;
    try {
      const updated = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
        attachments: selectedConsultation.attachments || [],
      });
      setSelectedConsultation(updated);
      await fetchSessions();
      toast.success("Prescription saved successfully!");
      document.getElementById("close-prescription-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to save prescription");
    }
  };

  const handleCopyPreviousPrescription = (prevConsult: any, type: "therapy" | "clinic") => {
    if (!selectedConsultation) return;

    let medicinesToCopy: any[] = [];
    let adviceToCopy = prevConsult.advice || "";

    if (type === "therapy") {
      medicinesToCopy = prevConsult.medicines ? [...prevConsult.medicines] : [];
    } else if (type === "clinic") {
      medicinesToCopy = (prevConsult.medicines || []).map((m: any) => ({
        name: m.medicineName || "",
        dosage: m.frequency || m.dosage || "1-0-1",
        duration: m.duration || "5 Days",
        instructions: m.timings || "After Food",
      }));
    }

    setSelectedConsultation({
      ...selectedConsultation,
      medicines: medicinesToCopy,
      advice: adviceToCopy,
    });
    toast.info("Copied medicines & advice from past prescription.");
  };

  const handleClearPrescription = () => {
    if (!selectedConsultation) return;
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: [],
      advice: "",
    });
    toast.info("Cleared prescription inputs.");
  };

  const handleCopyPrescriptionText = (consult: any) => {
    if (!consult) return;
    
    let text = `Prescription Details:\n`;
    if (consult.medicines && consult.medicines.length > 0) {
      text += `\nMedicines:\n`;
      consult.medicines.forEach((med: any, idx: number) => {
        text += `${idx + 1}. ${med.name} - Dose: ${med.dosage}, Freq: ${med.frequency}, Dur: ${med.duration}, Timing: ${med.instructions}\n`;
      });
    }
    if (consult.advice) {
      text += `\nAdvice:\n${consult.advice}\n`;
    }
    
    navigator.clipboard.writeText(text);
    toast.success("Prescription text copied to clipboard!");
  };

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
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <label className="form-label mb-1 fw-semibold small text-muted">To Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
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
                    <input
                      type="text"
                      className="form-control form-control-sm"
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
                              onClick={() => handleOpenPrescriptionModal(session)}
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

      {/* ===== PRESCRIPTION SCANS & ATTACHMENTS MODAL ===== */}
      <div className="modal fade" id="prescription_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content" style={{ borderRadius: 16 }}>
            {/* Modal Header with circular Rx badge */}
            <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                  <span className="fw-bold" style={{ fontSize: 14 }}>Rx</span>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0">Generate Prescription</h5>
                  <span className="text-muted fs-12">Create prescription for this visit</span>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="close-prescription-modal"></button>
            </div>

            <div className="modal-body pt-3">
              {selectedConsultation ? (
                <div>
                  {/* Current Visit Header bar */}
                  <div className="mb-4 d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white border rounded px-3 py-2 text-center" style={{ minWidth: 120 }}>
                        <div className="text-muted small uppercase fw-bold" style={{ fontSize: 10 }}>Current Visit</div>
                        <div className="fw-bold text-primary small">
                          {selectedAppt ? formatDateTime(selectedAppt.scheduledAt) : "Today"}
                        </div>
                      </div>
                      <div className="d-none d-sm-block">
                        <div className="text-muted small">
                          Patient: <strong>{selectedAppt?.patient ? `${selectedAppt.patient.firstName} ${selectedAppt.patient.lastName}` : "—"}</strong>
                        </div>
                        <div className="text-muted small">
                          Appointment ID: <strong>{selectedAppt?.appointmentCode}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* LEFT COLUMN: PRESCRIPTION INPUTS */}
                    <div className="col-lg-8 border-end pr-lg-4">
                      {/* Medicines List */}
                      <div className="card border-0 shadow-none mb-4 bg-transparent">
                        <div className="card-header bg-transparent border-0 p-0 mb-2 d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                            <i className="ti ti-pill text-primary"></i> Medicines
                          </h6>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                            style={{ borderRadius: 6, fontSize: 11 }}
                            onClick={addModalMedicineRow}
                          >
                            <i className="ti ti-plus" /> Add Medicine
                          </button>
                        </div>
                        <div className="card-body p-0">
                          {(!selectedConsultation.medicines || selectedConsultation.medicines.length === 0) ? (
                            <div className="text-center py-4 border rounded-3 bg-light" style={{ borderStyle: "dashed" }}>
                              <span className="text-muted small">No medicines prescribed yet. Click "+ Add Medicine" to prescribe.</span>
                            </div>
                          ) : (
                            <div style={{ overflow: "visible" }}>
                              <table className="table table-hover align-middle mb-0" style={{ fontSize: 12 }}>
                                <thead>
                                  <tr className="bg-light">
                                    <th className="border-0 py-2">Medicine Name *</th>
                                    <th className="border-0 py-2" style={{ width: 120 }}>Dose</th>
                                    <th className="border-0 py-2" style={{ width: 120 }}>Frequency</th>
                                    <th className="border-0 py-2" style={{ width: 110 }}>Duration</th>
                                    <th className="border-0 py-2" style={{ width: 130 }}>Timing</th>
                                    <th className="border-0 py-2 text-end" style={{ width: 40 }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedConsultation.medicines.map((m: any, idx: number) => (
                                    <tr key={idx}>
                                      <td 
                                        className="border-0 py-1 position-relative"
                                        style={{ zIndex: activeSearchIndex === idx ? 1000 : 1 }}
                                      >
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Search/Enter Medicine..."
                                          value={m.name}
                                          onChange={(e) => updateModalMedicineRow(idx, "name", e.target.value)}
                                          onFocus={() => setActiveSearchIndex(idx)}
                                          onBlur={() => {
                                            setTimeout(() => {
                                              setActiveSearchIndex(null);
                                            }, 250);
                                          }}
                                          style={{ borderRadius: 6 }}
                                          autoComplete="off"
                                        />
                                        {activeSearchIndex === idx && (
                                          <div
                                            className="position-absolute bg-white border rounded shadow-lg mb-1"
                                            style={{
                                              zIndex: 1000,
                                              maxHeight: '180px',
                                              overflowY: 'auto',
                                              bottom: '100%',
                                              left: 0,
                                              minWidth: '280px'
                                            }}
                                          >
                                            {medicineOptions
                                              .filter((opt: any) => {
                                                const search = (m.name || "").toLowerCase();
                                                return (opt.name || "").toLowerCase().includes(search) ||
                                                       (opt.category || "").toLowerCase().includes(search);
                                              })
                                              .slice(0, 50)
                                              .map((opt: any, itemIdx: number) => (
                                                <div
                                                   key={itemIdx}
                                                   className="px-3 py-2 text-dark border-bottom text-start"
                                                   onMouseDown={() => handleSelectMedicine(idx, opt)}
                                                   style={{ cursor: "pointer", transition: "background 0.1s" }}
                                                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                 >
                                                   <span className="fw-semibold text-dark" style={{ fontSize: 13 }}>{opt.name} - {opt.category}</span>
                                                 </div>
                                              ))}
                                            {medicineOptions.filter((opt: any) => {
                                              const search = (m.name || "").toLowerCase();
                                              return (opt.name || "").toLowerCase().includes(search) ||
                                                     (opt.category || "").toLowerCase().includes(search);
                                            }).length === 0 && (
                                              <div className="px-3 py-2 text-muted text-start" style={{ fontSize: 11 }}>
                                                No matching medicines found
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="border-0 py-1">
                                        <select
                                          className="form-select form-select-sm"
                                          value={m.dosage || "1 Tablet"}
                                          onChange={(e) => updateModalMedicineRow(idx, "dosage", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        >
                                          <option value="1 Tablet">1 Tablet</option>
                                          <option value="2 Tablets">2 Tablets</option>
                                          <option value="1 Spoon">1 Spoon</option>
                                          <option value="2 Spoons">2 Spoons</option>
                                          <option value="1 Drop">1 Drop</option>
                                          <option value="2 Drops">2 Drops</option>
                                          <option value="5 ml">5 ml</option>
                                          <option value="10 ml">10 ml</option>
                                          <option value="1 Injection">1 Injection</option>
                                          <option value="As Needed">As Needed</option>
                                        </select>
                                      </td>
                                      <td className="border-0 py-1">
                                        <select
                                          className="form-select form-select-sm"
                                          value={m.frequency || "1-0-1"}
                                          onChange={(e) => updateModalMedicineRow(idx, "frequency", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        >
                                          <option value="1-0-1">1-0-1 (Twice Daily)</option>
                                          <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                                          <option value="1-0-0">1-0-0 (Morning Only)</option>
                                          <option value="0-1-0">0-1-0 (Afternoon Only)</option>
                                          <option value="0-0-1">0-0-1 (Night Only)</option>
                                          <option value="1-1-1-1">1-1-1-1 (Four times)</option>
                                          <option value="Every 4 Hours">Every 4 Hours</option>
                                          <option value="Every 6 Hours">Every 6 Hours</option>
                                          <option value="Every 8 Hours">Every 8 Hours</option>
                                          <option value="Once a week">Once a week</option>
                                          <option value="As Needed">As Needed</option>
                                        </select>
                                      </td>
                                      <td className="border-0 py-1">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g. 5 Days"
                                          value={m.duration || ""}
                                          onChange={(e) => updateModalMedicineRow(idx, "duration", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        />
                                      </td>
                                      <td className="border-0 py-1">
                                        <select
                                          className="form-select form-select-sm"
                                          value={m.instructions || "After Food"}
                                          onChange={(e) => updateModalMedicineRow(idx, "instructions", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        >
                                          <option value="After Food">After Food</option>
                                          <option value="Before Food">Before Food</option>
                                          <option value="With Food">With Food</option>
                                          <option value="Empty Stomach">Empty Stomach</option>
                                        </select>
                                      </td>
                                      <td className="border-0 py-1 text-end">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0 border-0"
                                          onClick={() => removeModalMedicineRow(idx)}
                                        >
                                          <i className="ti ti-trash fs-14" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Advice and Diagnostic Tests Row */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                            <i className="ti ti-message-report text-primary"></i> Advice
                          </h6>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={selectedConsultation.advice || ""}
                            onChange={(e) => updateModalAdvice(e.target.value)}
                            placeholder="Enter doctor's instructions, recommendations, or advices..."
                            style={{ borderRadius: 10, fontSize: 13 }}
                          />
                        </div>
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                            <i className="ti ti-stethoscope text-primary"></i> Diagnostic Tests
                          </h6>
                          <input
                            type="text"
                            className="form-control form-control-sm mb-2"
                            placeholder="Search/Add Diagnostic Test..."
                            disabled
                            style={{ borderRadius: 8 }}
                          />
                          <div className="text-center py-4 border rounded-3 bg-light text-muted small" style={{ borderStyle: "dashed" }}>
                            No diagnostic tests prescribed.
                          </div>
                        </div>
                      </div>

                      {/* Photo / Scan Upload Area */}
                      <div className="mb-2">
                        <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                          <i className="ti ti-photo-plus text-primary"></i> Prescription Scans & Attachments
                        </h6>
                        <div className="p-3 border rounded-3 bg-light text-center mb-3" style={{ borderStyle: "dashed" }}>
                          <input
                            type="file"
                            id="modal-scan-upload"
                            className="d-none"
                            accept="image/*"
                            multiple
                            onChange={handleModalUpload}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-primary d-flex align-items-center gap-2 mx-auto"
                            onClick={() => document.getElementById("modal-scan-upload")?.click()}
                            disabled={uploading}
                            style={{ borderRadius: 8 }}
                          >
                            {uploading ? (
                              <>
                                <span className="spinner-border spinner-border-sm"></span> Uploading...
                              </>
                            ) : (
                              <>
                                <i className="ti ti-upload"></i> Upload Prescription/Scan Image
                              </>
                            )}
                          </button>
                          <div className="text-muted small mt-1" style={{ fontSize: 11 }}>Upload scan, diagnostic report, or printed prescription photo.</div>
                        </div>

                        {selectedConsultation.attachments && selectedConsultation.attachments.length > 0 && (
                          <div className="row g-2 mb-2">
                            {selectedConsultation.attachments.map((att: any, idx: number) => (
                              <div key={idx} className="col-md-4">
                                <div className="p-2 border rounded-3 bg-white h-100 shadow-sm d-flex flex-column gap-2" style={{ position: "relative" }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center"
                                    onClick={() => handleRemoveModalAttachment(idx)}
                                    style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, zIndex: 10 }}
                                  >
                                    <i className="ti ti-x" style={{ fontSize: 10 }}></i>
                                  </button>
                                  <a 
                                    href={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPreviewImage(att.url.startsWith("/") ? apiUrl(att.url) : att.url);
                                    }}
                                  >
                                    <img
                                      src={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                                      alt="Prescription Scan"
                                      className="rounded-2"
                                      style={{ width: "100%", height: 90, objectFit: "cover", cursor: "zoom-in" }}
                                    />
                                  </a>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Add remark..."
                                    value={att.remark || ""}
                                    onChange={(e) => handleUpdateModalRemark(idx, e.target.value)}
                                    onBlur={handleSaveModalAttachments}
                                    style={{ borderRadius: 6, fontSize: 11 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIOUS PRESCRIPTIONS */}
                    <div className="col-lg-4">
                      <div className="card border-0 bg-transparent shadow-none">
                        <div className="card-header bg-transparent border-0 p-0 mb-2">
                          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                            <i className="ti ti-history text-muted"></i> Previous Prescriptions
                          </h6>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: "450px", overflowY: "auto" }}>
                          {/* Therapy prescriptions list */}
                          {previousConsultations.length > 0 && (
                            <div className="mb-3">
                              <div className="text-muted small fw-bold mb-1 uppercase" style={{ fontSize: 10 }}>Therapy Visits</div>
                              {previousConsultations.map((pc: any) => (
                                <button
                                  key={pc.id}
                                  type="button"
                                  className="btn btn-outline-light text-start text-dark border w-100 p-2 mb-2 bg-white d-flex align-items-center justify-content-between"
                                  onClick={() => handleCopyPreviousPrescription(pc, "therapy")}
                                  style={{ borderRadius: 8 }}
                                  title="Click to copy prescription"
                                >
                                  <div>
                                    <span className="fw-semibold text-primary d-block" style={{ fontSize: 11 }}>{pc.appointment?.dateTimeLabel || "Past Visit"}</span>
                                    <span className="text-muted small text-truncate d-block" style={{ maxWidth: 200, fontSize: 10 }}>
                                      {pc.medicines?.map((m: any) => m.name).join(", ") || "No medicines"}
                                    </span>
                                  </div>
                                  <i className="ti ti-copy text-muted fs-12" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Clinic prescriptions list */}
                          {previousClinicPrescriptions.length > 0 && (
                            <div className="mb-3">
                              <div className="text-muted small fw-bold mb-1 uppercase" style={{ fontSize: 10 }}>Clinic Visits</div>
                              {previousClinicPrescriptions.map((cp: any) => (
                                <button
                                  key={cp.id}
                                  type="button"
                                  className="btn btn-outline-light text-start text-dark border w-100 p-2 mb-2 bg-white d-flex align-items-center justify-content-between"
                                  onClick={() => handleCopyPreviousPrescription(cp, "clinic")}
                                  style={{ borderRadius: 8 }}
                                  title="Click to copy prescription"
                                >
                                  <div>
                                    <span className="fw-semibold text-success d-block" style={{ fontSize: 11 }}>
                                      {cp.prescriptionCode || "Prescription"}
                                    </span>
                                    <span className="text-muted small text-truncate d-block" style={{ maxWidth: 200, fontSize: 10 }}>
                                      {cp.medicines?.map((m: any) => m.medicineName).join(", ") || "No medicines"}
                                    </span>
                                  </div>
                                  <i className="ti ti-copy text-muted fs-12" />
                                </button>
                              ))}
                            </div>
                          )}

                          {previousConsultations.length === 0 && previousClinicPrescriptions.length === 0 && (
                            <div className="p-3 text-center border rounded-3 bg-light text-muted">
                              <i className="ti ti-info-circle mb-1 fs-18"></i>
                              <div className="small">No previous prescriptions recorded.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                  <div className="text-muted mt-2">Initializing prescription record...</div>
                </div>
              )}
            </div>

            <div className="modal-footer border-top bg-light justify-content-between" style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <div>
                <button type="button" className="btn btn-outline-secondary me-2" disabled style={{ borderRadius: 8 }}>
                  <i className="ti ti-printer me-1"></i> Print
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled style={{ borderRadius: 8 }}>
                  <i className="ti ti-download me-1"></i> PDF
                </button>
              </div>
              <div>
                <button type="button" className="btn btn-light btn-sm px-3 py-1.5" data-bs-dismiss="modal" style={{ borderRadius: 8 }}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm px-4 py-1.5" onClick={handleSaveModalConsultation} style={{ borderRadius: 8 }}>Generate Prescription</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== GORGEOUS LIGHTBOX PREVIEW MODAL ===== */}
      {previewImage && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900 with high opacity
            backdropFilter: "blur(8px)",
            transition: "all 0.3s ease"
          }}
          onClick={() => setPreviewImage(null)}
        >
          {/* Close button */}
          <button
            type="button"
            className="btn btn-link text-white position-absolute border-0"
            style={{ top: 20, right: 20, fontSize: 30, textDecoration: "none" }}
            onClick={() => setPreviewImage(null)}
          >
            <i className="ti ti-x"></i>
          </button>
          
          {/* Image Container */}
          <div 
            className="position-relative d-flex align-items-center justify-content-center p-3"
            style={{ maxWidth: "90%", maxHeight: "80%" }}
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image
          >
            <img
              src={previewImage}
              alt="Preview"
              className="img-fluid rounded shadow-2xl animate__animated animate__zoomIn"
              style={{ 
                maxHeight: "80vh", 
                objectFit: "contain", 
                border: "4px solid rgba(255,255,255,0.1)"
              }}
            />
          </div>
          
          {/* Action buttons */}
          <div className="d-flex gap-2 mt-3">
            <a
              href={previewImage}
              download
              className="btn btn-primary btn-sm px-4 py-2 d-flex align-items-center gap-2"
              style={{ borderRadius: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <i className="ti ti-download"></i> Download Image
            </a>
            <button
              type="button"
              className="btn btn-light btn-sm px-4 py-2 d-flex align-items-center gap-2"
              style={{ borderRadius: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(window.location.origin + previewImage);
                toast.success("Image URL copied to clipboard!");
              }}
            >
              <i className="ti ti-copy"></i> Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
