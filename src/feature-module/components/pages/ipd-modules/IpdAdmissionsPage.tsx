import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

interface Patient {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  patientCode?: string;
  phone?: string;
}

const getPatientName = (p?: Patient | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

interface Doctor {
  id: string;
  fullName: string;
  doctorType?: string;
  ipdVisitCharge?: number | null;
}

interface Ward {
  id: string;
  wardName: string;
  wardCode?: string;
  wardType: string;
  chargePerNight: number;
  nursingChargePerNight: number;
  totalBeds: number;
  occupiedBeds: number;
}

interface Treatment {
  id: string;
  procedureName: string;
  totalPrice: number;
}

interface Admission {
  id: string;
  admissionCode: string;
  admissionType: string;
  patient: Patient;
  doctor?: Doctor | null;
  ward?: Ward | null;
  treatment?: Treatment | null;
  admissionDate: string;
  diagnosis?: string | null;
  status: string;
  admissionFee: number;
  treatmentFee: number;
  wardCharge: number;
  doctorVisitCharge: number;
  nursingFee: number;
  otherCharges: number;
  totalEstimatedAmount: number;
  advancePaid: number;
  totalPaid: number;
  dueAmount: number;
  paymentStatus: string;
  createdAt: string;
  ipdPrescriptions?: any[];
}

const IpdAdmissionsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDue, setFilterDue] = useState(""); // "" = All, "due" = Has Due, "paid" = Fully Paid, "advance" = Advance Paid

  // Admission Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form Fields
  const [admissionType, setAdmissionType] = useState<"Direct" | "Refer to OPD" | "Emergency">("Direct");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  // Financial Breakdown Fields
  const [admissionFee, setAdmissionFee] = useState("500");
  const [treatmentFee, setTreatmentFee] = useState("0");
  const [wardCharge, setWardCharge] = useState("0");
  const [doctorVisitCharge, setDoctorVisitCharge] = useState("0");
  const [nursingFee, setNursingFee] = useState("0");
  const [otherCharges, setOtherCharges] = useState("0");

  // Advance Payment Fields
  const [advancePaid, setAdvancePaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionAdmission, setPrescriptionAdmission] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState("");
  
  interface MedicineRow {
    name: string;
    dosage: string;
    strength: string;
    frequency: string;
    duration: string;
    instructions: string;
  }
  const [medicinesList, setMedicinesList] = useState<MedicineRow[]>([]);
  
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedStrength, setNewMedStrength] = useState("");
  const [newMedFrequency, setNewMedFrequency] = useState("Once daily");
  const [newMedDuration, setNewMedDuration] = useState("");
  const [newMedInstructions, setNewMedInstructions] = useState("");

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [viewAdmission, setViewAdmission] = useState<Admission | null>(null);

  // System medicines for autocomplete
  const [systemMedicines, setSystemMedicines] = useState<any[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medDropdownOpen, setMedDropdownOpen] = useState(false);
  const medInputRef = useRef<HTMLInputElement>(null);

  const getMedName = (m: any) => m?.medicineName || m?.name || m?.brandName || "Medicine";

  const filteredSysMeds = useMemo(() => {
    const q = (medSearch || "").trim().toLowerCase();
    if (!q) return (systemMedicines || []).slice(0, 15);
    return (systemMedicines || [])
      .filter((m: any) => {
        const name = getMedName(m).toLowerCase();
        const gen = (m?.genericName || "").toLowerCase();
        const brand = (m?.brandName || "").toLowerCase();
        return name.includes(q) || gen.includes(q) || brand.includes(q);
      })
      .slice(0, 15);
  }, [systemMedicines, medSearch]);

  // Calculated Total Admission Amount
  const totalEstimatedAmount = useMemo(() => {
    const adm = parseFloat(admissionFee) || 0;
    const trt = parseFloat(treatmentFee) || 0;
    const wrd = parseFloat(wardCharge) || 0;
    const doc = parseFloat(doctorVisitCharge) || 0;
    const nrs = parseFloat(nursingFee) || 0;
    const oth = parseFloat(otherCharges) || 0;
    return adm + trt + wrd + doc + nrs + oth;
  }, [admissionFee, treatmentFee, wardCharge, doctorVisitCharge, nursingFee, otherCharges]);

  // Calculated Remaining Due
  const dueAmount = useMemo(() => {
    const adv = parseFloat(advancePaid) || 0;
    return Math.max(0, totalEstimatedAmount - adv);
  }, [totalEstimatedAmount, advancePaid]);

  // Fetch Master Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [admRes, patRes, docRes, wrdRes, trtRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/admissions"), { headers }),
        fetch(apiUrl("/api/patients"), { headers }),
        fetch(apiUrl("/api/doctors?type=IPD"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
        fetch(apiUrl("/api/ipd/treatments"), { headers }),
      ]);

      if (admRes.ok) {
        const data = await admRes.json();
        setAdmissions(Array.isArray(data) ? data : []);
      }
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(Array.isArray(data) ? data : []);
      }
      if (docRes.ok) {
        const data = await docRes.json();
        setDoctors(Array.isArray(data) ? data : []);
      }
      if (wrdRes.ok) {
        const data = await wrdRes.json();
        setWards(Array.isArray(data) ? data.filter((w: any) => w.status === "Active") : []);
      }
      if (trtRes.ok) {
        const data = await trtRes.json();
        setTreatments(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast.error("Failed to load IPD admission data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch system medicines for autocomplete
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/medicines"), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setSystemMedicines(Array.isArray(d) ? d : (d?.data ? d.data : [])))
      .catch(() => {});
  }, []);

  // Auto-fill charges when Doctor, Ward, or Treatment is selected
  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const foundDoc = doctors.find((d) => d.id === docId);
    if (foundDoc && foundDoc.ipdVisitCharge) {
      setDoctorVisitCharge(String(foundDoc.ipdVisitCharge));
    }
  };

  const handleWardChange = (wId: string) => {
    setSelectedWardId(wId);
    const foundWard = wards.find((w) => w.id === wId);
    if (foundWard) {
      setWardCharge(String(foundWard.chargePerNight || 0));
      setNursingFee(String(foundWard.nursingChargePerNight || 0));
    }
  };

  const handleTreatmentChange = (tId: string) => {
    setSelectedTreatmentId(tId);
    const foundTrt = treatments.find((t) => t.id === tId);
    if (foundTrt) {
      setTreatmentFee(String(foundTrt.totalPrice || 0));
    }
  };

  // Reset Form
  const resetForm = () => {
    setAdmissionType("Direct");
    setSelectedPatientId(patients[0]?.id || "");
    setSelectedDoctorId(doctors[0]?.id || "");
    setSelectedWardId(wards[0]?.id || "");
    setSelectedTreatmentId("");
    setDiagnosis("");
    setAdmissionFee("500");
    setTreatmentFee("0");
    setWardCharge("0");
    setDoctorVisitCharge("0");
    setNursingFee("0");
    setOtherCharges("0");
    setAdvancePaid("");
    setPaymentMethod("Cash");
  };

  const handleOpenModal = (type: "Direct" | "Refer to OPD" | "Emergency") => {
    resetForm();
    setAdmissionType(type);

    if (patients.length > 0) setSelectedPatientId(patients[0].id);
    if (doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
      if (doctors[0].ipdVisitCharge) setDoctorVisitCharge(String(doctors[0].ipdVisitCharge));
    }
    if (wards.length > 0) {
      setSelectedWardId(wards[0].id);
      setWardCharge(String(wards[0].chargePerNight || 0));
      setNursingFee(String(wards[0].nursingChargePerNight || 0));
    }

    setShowModal(true);
  };

  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error("Please select a patient.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    const payload = {
      admissionType,
      patientId: selectedPatientId,
      doctorId: selectedDoctorId || undefined,
      wardId: selectedWardId || undefined,
      treatmentId: selectedTreatmentId || undefined,
      diagnosis: diagnosis.trim() || undefined,
      admissionFee: parseFloat(admissionFee) || 0,
      treatmentFee: parseFloat(treatmentFee) || 0,
      wardCharge: parseFloat(wardCharge) || 0,
      doctorVisitCharge: parseFloat(doctorVisitCharge) || 0,
      nursingFee: parseFloat(nursingFee) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      paymentMethod,
    };

    try {
      const res = await fetch(apiUrl("/api/ipd/admissions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to admit patient");
      }

        toast.success("Patient admitted successfully! Advance receipt generated.");
        setShowModal(false);
        resetForm();
        fetchData();
      } catch (err: any) {
        toast.error(err.message || "Error admitting patient");
      } finally {
        setSubmitting(false);
      }
    };

  const handleAddMedicineRow = () => {
    if (!newMedName.trim()) {
      toast.error("Please enter medicine name");
      return;
    }
    setMedicinesList((prev) => [
      ...prev,
      {
        name: newMedName.trim(),
        dosage: newMedDosage.trim(),
        strength: newMedStrength.trim(),
        frequency: newMedFrequency,
        duration: newMedDuration.trim(),
        instructions: newMedInstructions.trim(),
      },
    ]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedStrength("");
    setNewMedFrequency("Once daily");
    setNewMedDuration("");
    setNewMedInstructions("");
  };

  const handleRemoveMedicineRow = (idx: number) => {
    setMedicinesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(apiUrl("/api/uploads/ipd-prescription"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAttachedImages((prev) => [...prev, data.url]);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveAttachedImage = (url: string) => {
    setAttachedImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionAdmission) return;

    const token = localStorage.getItem("token");
    const payload = {
      admissionId: prescriptionAdmission.id,
      dischargeSummary: dischargeSummary.trim(),
      medicineAdvice: medicinesList,
      images: attachedImages,
    };

    try {
      const res = await fetch(apiUrl("/api/ipd/prescriptions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save prescription");
      toast.success("IPD Prescription saved successfully!");
      setShowPrescriptionModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving prescription");
    }
  };

  const handleOpenPrescriptionModal = (adm: Admission) => {
    setPrescriptionAdmission(adm);
    setDischargeSummary(adm.diagnosis || "");
    setMedicinesList([]);
    setAttachedImages([]);
    setNewMedName(""); setMedSearch(""); setMedDropdownOpen(false);
    setShowPrescriptionModal(true);
  };

  const handleViewPrescription = (prsc: any, adm: Admission) => {
    setSelectedPrescription(prsc);
    setViewAdmission(adm);
    setShowViewPrescriptionModal(true);
  };

  // Filtered Admissions List
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const matchWard = !filterWard || adm.ward?.id === filterWard;
      const matchPatient = !filterPatient || adm.patient?.id === filterPatient;
      const matchDoctor = !filterDoctor || adm.doctor?.id === filterDoctor;
      let matchDue = true;
      if (filterDue === "due") matchDue = adm.dueAmount > 0;
      else if (filterDue === "paid") matchDue = adm.dueAmount <= 0 && adm.totalPaid > 0;
      else if (filterDue === "advance") matchDue = adm.advancePaid > 0;
      return matchWard && matchPatient && matchDoctor && matchDue;
    });
  }, [admissions, filterWard, filterPatient, filterDoctor, filterDue]);

  const hasActiveFilters = filterWard || filterPatient || filterDoctor || filterDue;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-0">IPD Admission Desk</h3>
            <p className="text-muted fs-13 mb-0">
              Admit Patients, Select Treatment & Wards, Record Advance Deposits & Raise Initial Receipts
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button className="btn btn-primary" onClick={() => handleOpenModal("Direct")}>
              <i className="ti ti-user-plus me-1" /> + Add Patient Admission
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-3 px-4">
            <div className="d-flex align-items-end gap-3 flex-wrap">

              {/* Ward Filter */}
              <div style={{ minWidth: '170px', flex: '1 1 170px' }}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6b7280' }}>
                  <i className="ti ti-building-hospital me-1" />Ward
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filterWard}
                  onChange={(e) => setFilterWard(e.target.value)}
                >
                  <option value="">All Wards</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.wardName} ({w.wardType})</option>
                  ))}
                </select>
              </div>

              {/* Patient Filter */}
              <div style={{ minWidth: '190px', flex: '1 1 190px' }}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6b7280' }}>
                  <i className="ti ti-user me-1" />Patient
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filterPatient}
                  onChange={(e) => setFilterPatient(e.target.value)}
                >
                  <option value="">All Patients</option>
                  {/* unique admitted patients only */}
                  {Array.from(
                    new Map(admissions.map((a) => [a.patient?.id, a.patient] as [string | undefined, any]).filter(([id]) => id)).values()
                  ).map((p: any) => (
                    <option key={p.id} value={p.id}>{getPatientName(p)} {p.patientCode ? `(${p.patientCode})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Doctor Filter */}
              <div style={{ minWidth: '190px', flex: '1 1 190px' }}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6b7280' }}>
                  <i className="ti ti-stethoscope me-1" />Doctor
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                >
                  <option value="">All Doctors</option>
                  {Array.from(
                    new Map(admissions.filter((a) => a.doctor?.id).map((a) => [a.doctor!.id, a.doctor!])).values()
                  ).map((d: any) => (
                    <option key={d.id} value={d.id}>Dr. {d.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Due Amount Filter */}
              <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#6b7280' }}>
                  <i className="ti ti-currency-rupee me-1" />Due Amount
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filterDue}
                  onChange={(e) => setFilterDue(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="due">Has Due Amount</option>
                  <option value="paid">Fully Paid</option>
                  <option value="advance">Advance Paid</option>
                </select>
              </div>

              {/* Stats badge + clear */}
              <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
                <span
                  className="badge py-2 px-3 fw-semibold"
                  style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '12px', borderRadius: '8px' }}
                >
                  <i className="ti ti-users me-1" />{filteredAdmissions.length} Inpatients
                </span>
                {hasActiveFilters && (
                  <button
                    className="btn btn-sm btn-light border fw-semibold"
                    style={{ fontSize: '12px', borderRadius: '8px' }}
                    onClick={() => { setFilterWard(""); setFilterPatient(""); setFilterDoctor(""); setFilterDue(""); }}
                  >
                    <i className="ti ti-x me-1" />Clear
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Admissions Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="text-muted mt-2 mb-0">Loading IPD Admissions...</p>
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-user-plus fs-40 text-muted mb-2 d-block" />
                <h5 className="fw-bold">No Inpatient Admissions Found</h5>
                <p className="text-muted fs-13 mb-3">
                  Click below to admit your first patient to IPD with ward & treatment selection.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal("Direct")}>
                  <i className="ti ti-plus me-1" /> + Add Patient Admission
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Admission Code</th>
                      <th>Patient Details</th>
                      <th>Primary Doctor</th>
                      <th>Assigned Ward</th>
                      <th>Treatment / Surgery</th>
                      <th>Est. Total</th>
                      <th>Advance Paid</th>
                      <th>Due Amount</th>
                      <th>Payment Status</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmissions.map((adm) => (
                      <tr key={adm.id}>
                        <td>
                          <span className="badge bg-soft-dark text-dark fw-bold">
                            {adm.admissionCode}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-dark d-block">{getPatientName(adm.patient)}</span>
                          <small className="text-muted">
                            UHID: {adm.patient?.patientCode || "—"} | {adm.patient?.phone || "—"}
                          </small>
                        </td>
                        <td>
                          <span className="fw-semibold text-primary d-block">
                            {adm.doctor?.fullName || "Unassigned"}
                          </span>
                          {adm.doctorVisitCharge > 0 && (
                            <small className="text-muted">Visit: ₹{adm.doctorVisitCharge}</small>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-soft-primary text-primary fw-medium d-block mb-1">
                            {adm.ward?.wardName || "Not Assigned"}
                          </span>
                          {adm.wardCharge > 0 && (
                            <small className="text-muted">Rate: ₹{adm.wardCharge}/night</small>
                          )}
                        </td>
                        <td>
                          <span className="fw-medium text-dark d-block">
                            {adm.treatment?.procedureName || "Standard IPD Care"}
                          </span>
                          {adm.treatmentFee > 0 && (
                            <small className="text-muted">Proc Fee: ₹{adm.treatmentFee}</small>
                          )}
                        </td>
                        <td>
                          <span className="fw-bold text-dark fs-14">
                            ₹{adm.totalEstimatedAmount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success fs-14">
                            ₹{adm.advancePaid.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-danger fs-14">
                            ₹{adm.dueAmount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              adm.paymentStatus === "Paid"
                                ? "bg-soft-success text-success"
                                : adm.paymentStatus === "Partial"
                                ? "bg-soft-warning text-warning"
                                : "bg-soft-danger text-danger"
                            }`}
                          >
                            {adm.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              adm.status === "Admitted" ? "bg-success" : "bg-secondary"
                            }`}
                          >
                            {adm.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-light dropdown-toggle border"
                                type="button"
                                data-bs-toggle="dropdown"
                              >
                                Actions
                              </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                              <li>
                                <Link
                                  to={all_routes.ipdDischarge}
                                  className="dropdown-item d-flex align-items-center text-success fw-semibold"
                                >
                                  <i className="ti ti-user-check me-2 fs-16" /> Process Discharge & Settle
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to={all_routes.ipdBillings}
                                  className="dropdown-item d-flex align-items-center"
                                >
                                  <i className="ti ti-file-invoice me-2 text-primary" /> View Invoices & Receipts
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to={all_routes.ipdBillings}
                                  className="dropdown-item d-flex align-items-center text-info"
                                >
                                  <i className="ti ti-plus me-2" /> + Raise IPD Charge
                                </Link>
                              </li>
                            </ul>
                          </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADMISSION MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-user-plus me-2" />
                  New Patient Admission
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitAdmission}>
                <div className="modal-body p-4">
                  {/* Step 1: Basic Fields & Patient Selection */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Step 1: Patient & Primary Doctor
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Select Patient <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        required
                      >
                        <option value="">Choose Patient</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {getPatientName(p)} ({p.patientCode || "No Code"}) - {p.phone || "No Phone"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Primary Doctor Assigned</label>
                      <select
                        className="form-select"
                        value={selectedDoctorId}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} {d.ipdVisitCharge ? `(Visit: ₹${d.ipdVisitCharge})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Diagnosis / Admission Reason</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Acute Appendicitis, High Fever, Post-op Recovery..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Step 2: Treatment & Ward Assignment */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-info rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Step 2: Assign Treatment Procedure & Ward
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Select Treatment / Surgery Procedure</label>
                      <select
                        className="form-select"
                        value={selectedTreatmentId}
                        onChange={(e) => handleTreatmentChange(e.target.value)}
                      >
                        <option value="">No Procedure (General Medical Care)</option>
                        {treatments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.procedureName} (Price: ₹{t.totalPrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assign Ward / Room & Bed</label>
                      <select
                        className="form-select"
                        value={selectedWardId}
                        onChange={(e) => handleWardChange(e.target.value)}
                      >
                        <option value="">No Ward Assigned</option>
                        {wards.map((w) => {
                          const isFull = w.occupiedBeds >= w.totalBeds;
                          return (
                            <option key={w.id} value={w.id} disabled={isFull}>
                              {isFull ? "🔴 FULL — " : ""}{w.wardName} ({w.wardType}) - Rate: ₹{w.chargePerNight}/night{isFull ? " [No Beds Available]" : ` [${w.totalBeds - w.occupiedBeds} beds free]`}
                            </option>
                          );
                        })}
                      </select>
                      {selectedWardId && (() => {
                        const selW = wards.find((w) => w.id === selectedWardId);
                        if (selW && selW.occupiedBeds >= selW.totalBeds) {
                          return (
                            <div className="mt-1 text-danger fw-semibold fs-12">
                              ⚠️ This ward is full. Please select another ward.
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Step 3: Financial Breakdown */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-warning rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Step 3: Initial Admission Financial Charges
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Admission Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={admissionFee}
                        onChange={(e) => setAdmissionFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Treatment / Surgery Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={treatmentFee}
                        onChange={(e) => setTreatmentFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Ward Per Night Charge (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={wardCharge}
                        onChange={(e) => setWardCharge(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Doctor Visit Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={doctorVisitCharge}
                        onChange={(e) => setDoctorVisitCharge(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Nursing Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={nursingFee}
                        onChange={(e) => setNursingFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Others (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Summary Box & Advance Deposit */}
                  <div className="p-3 bg-soft-primary border border-primary rounded-3 mb-3">
                    <div className="row align-items-center g-3">
                      <div className="col-md-6">
                        <span className="fs-13 text-secondary fw-semibold d-block">
                          Total Estimated Initial Charges:
                        </span>
                        <h3 className="fw-bold text-primary mb-0">
                          ₹{totalEstimatedAmount.toLocaleString("en-IN")}
                        </h3>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold text-dark mb-1">
                          Advance Payment (₹)
                        </label>
                        <input
                          type="number"
                          className="form-control fw-bold text-success fs-16"
                          placeholder="e.g. 5000"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(e.target.value)}
                          min={0}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-semibold mb-1">Payment Method</label>
                        <select
                          className="form-select"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay / PhonePe</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between px-2">
                    <span className="text-muted fs-13">
                      Remaining Due Amount at Admission: <strong className="text-danger">₹{dueAmount.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Admitting...
                      </>
                    ) : (
                      "Admit Patient & Raise Receipt"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      <Footer />
    </div>
  );
};

export default IpdAdmissionsPage;
