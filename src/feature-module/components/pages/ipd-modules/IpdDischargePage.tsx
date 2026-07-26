import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import IpdViewDetailsModal from "./IpdViewDetailsModal";

interface Patient {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  patientCode?: string;
  phone?: string;
}

interface Doctor {
  id: string;
  fullName: string;
}

interface Ward {
  id: string;
  wardName: string;
  wardType: string;
}

interface Admission {
  id: string;
  admissionCode: string;
  admissionType: string;
  patient: Patient;
  doctor?: Doctor | null;
  ward?: Ward | null;
  admissionDate: string;
  dischargeDate?: string | null;
  diagnosis?: string | null;
  status: string; // Admitted or Discharged
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  discountAmount?: number;
  discountType?: string;
  dischargeNotes?: string;
  paymentStatus: string;
  ipdPrescriptions?: any[];
}

interface MedicineRow {
  name: string;
  dosage: string;
  strength: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const getPatientName = (p?: Patient | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return apiUrl(url.startsWith("/") ? url : `/${url}`);
};

const IpdDischargePage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Admitted" | "Discharged">("All");
  const [wardFilter, setWardFilter] = useState("All");

  // Discharge Settlement Modal State
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [targetAdmission, setTargetAdmission] = useState<Admission | null>(null);

  // View Discharged Settled Receipt Modal State
  const [showSettledReceiptModal, setShowSettledReceiptModal] = useState(false);
  const [settledAdmissionData, setSettledAdmissionData] = useState<Admission | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewAdmission, setSelectedViewAdmission] = useState<any>(null);

  // Discount & Payment Inputs
  const [discountType, setDiscountType] = useState<"Fixed" | "Percentage">("Fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [submittingDischarge, setSubmittingDischarge] = useState(false);

  // Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionAdmission, setPrescriptionAdmission] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState("");
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
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [copyNotify, setCopyNotify] = useState<string | null>(null);

  // System medicines for autocomplete
  const [systemMedicines, setSystemMedicines] = useState<any[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medDropdownOpen, setMedDropdownOpen] = useState(false);
  const medInputRef = useRef<HTMLInputElement>(null);

  // Patient past prescriptions state
  const [pastPatientPrescriptions, setPastPatientPrescriptions] = useState<any[]>([]);
  const [loadingPastHistory, setLoadingPastHistory] = useState(false);

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

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(apiUrl("/api/ipd/admissions"), { headers });
      if (res.ok) {
        const data = await res.json();
        setAdmissions(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast.error("Failed to load IPD admissions for discharge");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch system medicines for autocomplete
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/medicines"), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setSystemMedicines(Array.isArray(d) ? d : (d?.data ? d.data : [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Overview Metrics
  const metrics = useMemo(() => {
    let totalAdmitted = 0;
    let totalDischarged = 0;
    let totalDue = 0;
    let totalPaid = 0;

    admissions.forEach((adm) => {
      if (adm.status === "Admitted") totalAdmitted++;
      if (adm.status === "Discharged") totalDischarged++;
      totalDue += adm.dueAmount || 0;
      totalPaid += adm.totalPaid || 0;
    });

    return { totalAdmitted, totalDischarged, totalDue, totalPaid };
  }, [admissions]);

  // Computed Discount Amount
  const computedDiscount = useMemo(() => {
    if (!targetAdmission) return 0;
    const due = targetAdmission.dueAmount || 0;
    const val = parseFloat(discountValue) || 0;
    if (discountType === "Percentage") {
      return Math.round((due * val) / 100);
    }
    return Math.min(due, val);
  }, [targetAdmission, discountType, discountValue]);

  // Final Net Payable Amount after Discount
  const netPayable = useMemo(() => {
    if (!targetAdmission) return 0;
    return Math.max(0, targetAdmission.dueAmount - computedDiscount);
  }, [targetAdmission, computedDiscount]);

  // Open Discharge Modal for patient
  const handleOpenDischargeModal = (adm: Admission) => {
    setTargetAdmission(adm);
    setDiscountType("Fixed");
    setDiscountValue("0");
    setPaymentAmount(String(Math.max(0, adm.dueAmount)));
    setPaymentMethod("Cash");
    setDischargeNotes("");
    setShowDischargeModal(true);
  };

  // Submit Discharge & Final Settlement
  const handleSubmitDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdmission) return;

    setSubmittingDischarge(true);
    const token = localStorage.getItem("token");
    const payload = {
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      paymentAmount: parseFloat(paymentAmount) || 0,
      paymentMethod,
      dischargeNotes: dischargeNotes.trim() || undefined,
    };

    try {
      const res = await fetch(apiUrl(`/api/ipd/admissions/${targetAdmission.id}/discharge`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to process discharge");
      }

      toast.success(`Patient ${getPatientName(targetAdmission.patient)} discharged & bill settled!`);
      setShowDischargeModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error processing discharge");
    } finally {
      setSubmittingDischarge(false);
    }
  };

  // ── Prescription helpers ──────────────────────────────────────────
  const handleOpenPrescriptionModal = async (adm: Admission) => {
    setPrescriptionAdmission(adm);
    const existing = (adm as any).ipdPrescriptions && (adm as any).ipdPrescriptions.length > 0 ? (adm as any).ipdPrescriptions[0] : null;
    if (existing) {
      setDischargeSummary(existing.dischargeSummary || "");
      const meds: MedicineRow[] = Array.isArray(existing.medicineAdvice)
        ? existing.medicineAdvice.map((m: any) => ({
            name: m.name || "", dosage: m.dosage || "", strength: m.strength || "",
            frequency: m.frequency || "Once daily", duration: m.duration || "", instructions: m.instructions || "",
          }))
        : [];
      setMedicinesList(meds);
      setAttachedImages(Array.isArray(existing.images) ? existing.images : []);
    } else {
      setDischargeSummary(adm.diagnosis || "");
      setMedicinesList([]);
      setAttachedImages([]);
    }
    setNewMedName(""); setMedSearch(""); setMedDropdownOpen(false);
    setNewMedDosage(""); setNewMedStrength("");
    setNewMedFrequency("Once daily"); setNewMedDuration(""); setNewMedInstructions("");
    setShowPrescriptionModal(true);

    // Fetch patient's past prescriptions (both OPD & IPD)
    if (adm.patient?.id) {
      setLoadingPastHistory(true);
      const token = localStorage.getItem("token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const [opdRes, ipdRes] = await Promise.all([
          fetch(apiUrl(`/api/prescriptions`), { headers }),
          fetch(apiUrl(`/api/ipd/prescriptions?patientId=${adm.patient.id}`), { headers }),
        ]);
        let combined: any[] = [];
        if (opdRes.ok) {
          const opdData = await opdRes.json();
          const filteredOpd = Array.isArray(opdData) ? opdData.filter((p: any) => p.patientId === adm.patient.id) : [];
          combined.push(...filteredOpd.map((p: any) => ({ ...p, _type: 'OPD' })));
        }
        if (ipdRes.ok) {
          const ipdData = await ipdRes.json();
          const filteredIpd = Array.isArray(ipdData) ? ipdData.filter((p: any) => p.id !== existing?.id) : [];
          combined.push(...filteredIpd.map((p: any) => ({ ...p, _type: 'IPD' })));
        }
        combined.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
        setPastPatientPrescriptions(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPastHistory(false);
      }
    }
  };

  const handleCopyFromPast = (pastItem: any, isOPD: boolean) => {
    let copiedMeds: MedicineRow[] = [];
    if (isOPD && Array.isArray(pastItem.medicines)) {
      copiedMeds = pastItem.medicines.map((m: any) => ({
        name: m.medicineName || m.name || m.medicine?.medicineName || "Medicine",
        dosage: m.dosage || m.dose || "",
        strength: m.strength || "",
        frequency: m.frequency || m.timing || "Once daily",
        duration: m.duration || (m.days ? `${m.days} days` : ""),
        instructions: m.instructions || m.notes || "",
      }));
      if (pastItem.diagnosis || pastItem.notes) {
        const noteText = pastItem.diagnosis || pastItem.notes;
        setDischargeSummary(prev => prev ? `${prev}\n${noteText}` : noteText);
      }
    } else if (!isOPD && Array.isArray(pastItem.medicineAdvice)) {
      copiedMeds = pastItem.medicineAdvice.map((m: any) => ({
        name: m.name || "",
        dosage: m.dosage || "",
        strength: m.strength || "",
        frequency: m.frequency || "Once daily",
        duration: m.duration || "",
        instructions: m.instructions || "",
      }));
      if (pastItem.dischargeSummary) {
        setDischargeSummary(prev => prev ? `${prev}\n${pastItem.dischargeSummary}` : pastItem.dischargeSummary);
      }
    }

    if (copiedMeds.length > 0) {
      setMedicinesList(prev => [...prev, ...copiedMeds]);
      toast.success(`Copied ${copiedMeds.length} medicine(s) from past prescription!`);
    } else {
      toast.info("No medicines found in this prescription.");
    }
  };

  const handlePrescriptionClick = (adm: Admission) => {
    const existing = (adm as any).ipdPrescriptions && (adm as any).ipdPrescriptions.length > 0 ? (adm as any).ipdPrescriptions[0] : null;
    if (existing) {
      setSelectedPrescription(existing);
      setPrescriptionAdmission(adm);
      setShowViewPrescriptionModal(true);
    } else {
      handleOpenPrescriptionModal(adm);
    }
  };

  const handleAddMedicineRow = () => {
    if (!newMedName.trim()) { toast.error("Enter medicine name"); return; }
    setMedicinesList(prev => [...prev, {
      name: newMedName.trim(), dosage: newMedDosage.trim(), strength: newMedStrength.trim(),
      frequency: newMedFrequency, duration: newMedDuration.trim(), instructions: newMedInstructions.trim(),
    }]);
    setNewMedName(""); setMedSearch(""); setMedDropdownOpen(false);
    setNewMedDosage(""); setNewMedStrength("");
    setNewMedFrequency("Once daily"); setNewMedDuration(""); setNewMedInstructions("");
  };

  const handleRemoveMedicineRow = (idx: number) => {
    setMedicinesList(prev => prev.filter((_, i) => i !== idx));
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAttachedImages(prev => [...prev, data.url]);
      toast.success("Image uploaded");
    } catch { toast.error("Failed to upload image"); }
    finally { setUploadingImage(false); }
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionAdmission) return;
    setSavingPrescription(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl("/api/ipd/prescriptions"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          admissionId: prescriptionAdmission.id,
          dischargeSummary: dischargeSummary.trim(),
          medicineAdvice: medicinesList,
          images: attachedImages,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Prescription saved!");
      setShowPrescriptionModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.message || "Error saving prescription"); }
    finally { setSavingPrescription(false); }
  };

  const handleCopyPrescription = (prsc: any) => {
    setDischargeSummary(prsc.dischargeSummary || "");
    const meds: MedicineRow[] = Array.isArray(prsc.medicineAdvice)
      ? prsc.medicineAdvice.map((m: any) => ({
          name: m.name || "", dosage: m.dosage || "", strength: m.strength || "",
          frequency: m.frequency || "Once daily", duration: m.duration || "", instructions: m.instructions || "",
        }))
      : [];
    setMedicinesList(meds);
    setCopyNotify(prsc.prescriptionCode || "Copied");
    setTimeout(() => setCopyNotify(null), 2500);
  };

  // Unique Ward Options
  const wardOptions = useMemo(() => {
    const names = new Set<string>();
    admissions.forEach((a) => {
      if (a.ward?.wardName) names.add(a.ward.wardName);
    });
    return Array.from(names);
  }, [admissions]);

  // Filtered Admissions List
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const pName = getPatientName(adm.patient);
      const aCode = adm.admissionCode || "";
      const pCode = adm.patient?.patientCode || "";

      const matchQuery =
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusTab === "All" || adm.status === statusTab;
      const matchWard = wardFilter === "All" || adm.ward?.wardName === wardFilter;
      return matchQuery && matchStatus && matchWard;
    });
  }, [admissions, searchQuery, statusTab, wardFilter]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="page-title mb-0">Discharge Management & Final Settlement</h3>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap mt-3 mt-md-0">
            {/* Search Filter Input */}
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: "190px" }}
              placeholder="Search code/patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Status Dropdown Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: "150px" }}
              value={statusTab}
              onChange={(e) => setStatusTab(e.target.value as any)}
            >
              <option value="All">All Statuses ({admissions.length})</option>
              <option value="Admitted">Active ({metrics.totalAdmitted})</option>
              <option value="Discharged">Discharged ({metrics.totalDischarged})</option>
            </select>

            {/* Ward Dropdown Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: "150px" }}
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
            >
              <option value="All">All Wards</option>
              {wardOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            {(searchQuery || statusTab !== "All" || wardFilter !== "All") && (
              <button
                className="btn btn-sm btn-light border fw-semibold"
                style={{ fontSize: '12px', borderRadius: '6px' }}
                onClick={() => {
                  setSearchQuery("");
                  setStatusTab("All");
                  setWardFilter("All");
                }}
              >
                <i className="ti ti-x me-1" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-primary">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">ACTIVE INPATIENTS</span>
                    <h3 className="fw-bold mb-0 text-primary">{metrics.totalAdmitted}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle">
                    <i className="ti ti-bed fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-success">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">DISCHARGED PATIENTS</span>
                    <h3 className="fw-bold mb-0 text-success">{metrics.totalDischarged}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-success text-success rounded-circle">
                    <i className="ti ti-[#1]" />
                    <i className="ti ti-user-check fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-danger">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL OUTSTANDING DUE</span>
                    <h3 className="fw-bold mb-0 text-danger">
                      ₹{metrics.totalDue.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-danger text-danger rounded-circle">
                    <i className="ti ti-alert-circle fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-info">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">SETTLED REVENUE</span>
                    <h3 className="fw-bold mb-0 text-info">
                      ₹{metrics.totalPaid.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-info text-info rounded-circle">
                    <i className="ti ti-wallet fs-20" />
                  </div>
                </div>
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
                <p className="text-muted mt-2 mb-0">Loading Inpatient Records...</p>
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-user-check fs-40 text-muted mb-2 d-block" />
                <h5 className="fw-bold">No Inpatient Records Found</h5>
                <p className="text-muted fs-13 mb-0">All patients in this view are discharged or no records exist.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "46px" }}>Sr.</th>
                      <th>Admission Code</th>
                      <th>Patient Details</th>
                      <th>Primary Doctor & Ward</th>
                      <th>Admission Date</th>
                      <th>Total Billed</th>
                      <th>Paid Amount</th>
                      <th>Due Balance</th>
                      <th>Discharge Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmissions.map((adm, idx) => (
                      <tr key={adm.id}>
                        <td>
                          <span className="text-muted fw-semibold fs-13">{idx + 1}</span>
                        </td>
                        <td>
                          <span className="badge bg-soft-dark text-dark fw-bold">
                            {adm.admissionCode}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-dark d-block">{getPatientName(adm.patient)}</span>
                          <small className="text-muted">UHID: {adm.patient?.patientCode || "—"}</small>
                        </td>
                        <td>
                          <span className="fw-medium text-primary d-block">
                            {adm.doctor?.fullName || "Unassigned"}
                          </span>
                          <span className="badge bg-soft-info text-info fs-11">
                            {adm.ward?.wardName || "Ward"}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted fs-13">
                            {new Date(adm.admissionDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-dark fs-14">
                            ₹{adm.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success fs-14">
                            ₹{adm.totalPaid.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-danger fs-14">
                            ₹{adm.dueAmount.toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td>
                          {adm.status === "Admitted" ? (
                            <span className="badge bg-success py-1 px-2 fs-12 fw-bold d-inline-flex align-items-center gap-1">
                              <i className="ti ti-activity" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="badge bg-danger py-1 px-2 fs-12 fw-bold d-flex flex-column align-items-start gap-0" style={{ lineHeight: 1.4 }}>
                              <span className="d-flex align-items-center gap-1">
                                <i className="ti ti-user-check" /> Discharged
                              </span>
                              <span className="fw-normal fs-11 opacity-75">
                                {adm.dischargeDate
                                  ? new Date(adm.dischargeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                  : "Completed"}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {/* View Admission Details */}
                            <button
                              type="button"
                              className="btn btn-sm btn-soft-secondary p-0 d-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px", borderRadius: "8px" }}
                              title="View Full IPD Details"
                              onClick={() => {
                                setSelectedViewAdmission(adm);
                                setShowViewModal(true);
                              }}
                            >
                              <i className="ti ti-eye fs-16" />
                            </button>
                            {/* Prescription */}
                            <button
                              type="button"
                              className={`btn btn-sm p-0 d-flex align-items-center justify-content-center ${
                                (adm as any).ipdPrescriptions?.length > 0 ? 'btn-soft-success' : 'btn-soft-primary'
                              }`}
                              style={{ width: "32px", height: "32px", borderRadius: "8px" }}
                              title={(adm as any).ipdPrescriptions?.length > 0 ? "View Prescription" : "Write Prescription"}
                              onClick={() => handlePrescriptionClick(adm)}
                            >
                              <i className="ti ti-file-text fs-16" />
                            </button>
                            {/* Settle / Receipt */}
                            {adm.status === "Admitted" ? (
                              <button
                                className="btn btn-sm btn-soft-warning p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", borderRadius: "8px" }}
                                title="Settle & Discharge"
                                onClick={() => handleOpenDischargeModal(adm)}
                              >
                                <i className="ti ti-user-check fs-16" />
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-soft-success p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", borderRadius: "8px" }}
                                title="View Settled Receipt"
                                onClick={() => {
                                  setSettledAdmissionData(adm);
                                  setShowSettledReceiptModal(true);
                                }}
                              >
                                <i className="ti ti-receipt fs-16" />
                              </button>
                            )}
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

      {/* MODAL: DISCHARGE & FINAL BILL SETTLEMENT */}
      {showDischargeModal && targetAdmission && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-user-check me-2" />
                  Process Patient Discharge & Final Bill Settlement
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDischargeModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitDischarge}>
                <div className="modal-body p-4">
                  {/* Patient Banner */}
                  <div className="p-3 bg-light rounded border mb-4 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted fs-12 d-block">Inpatient Details:</span>
                      <h5 className="fw-bold text-dark mb-0">{getPatientName(targetAdmission.patient)}</h5>
                      <small className="text-muted">
                        Code: {targetAdmission.admissionCode} | UHID: {targetAdmission.patient?.patientCode || "—"}
                      </small>
                    </div>

                    <div className="text-end">
                      <span className="badge bg-soft-primary text-primary fw-bold fs-13 d-block mb-1">
                        {targetAdmission.ward?.wardName || "Ward"}
                      </span>
                      <small className="text-muted">Doctor: {targetAdmission.doctor?.fullName || "Doctor"}</small>
                    </div>
                  </div>

                  {/* Financial Due Summary */}
                  <div className="p-3 bg-soft-danger border border-danger rounded-3 mb-4">
                    <div className="row text-center text-md-start align-items-center">
                      <div className="col-md-4">
                        <span className="text-muted fs-12 d-block">TOTAL BILLED AMOUNT</span>
                        <h4 className="fw-bold text-dark mb-0">₹{targetAdmission.totalAmount}</h4>
                      </div>
                      <div className="col-md-4">
                        <span className="text-muted fs-12 d-block">ADVANCE / PAID AMOUNT</span>
                        <h4 className="fw-bold text-success mb-0">₹{targetAdmission.totalPaid}</h4>
                      </div>
                      <div className="col-md-4">
                        <span className="text-muted fs-12 d-block">CURRENT OUTSTANDING DUE</span>
                        <h3 className="fw-bold text-danger mb-0">₹{targetAdmission.dueAmount}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Discount / Concession Section */}
                  <div className="p-3 bg-light rounded border mb-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="ti ti-discount me-1 text-warning fs-18" />
                      Apply Discharge Discount / Concession (Optional)
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fs-13 fw-semibold">Discount Type</label>
                        <div className="d-flex gap-3 pt-1">
                          <label className="form-check-label fw-medium cursor-pointer">
                            <input
                              type="radio"
                              className="form-check-input me-1"
                              name="discType"
                              value="Fixed"
                              checked={discountType === "Fixed"}
                              onChange={() => setDiscountType("Fixed")}
                            />
                            Fixed Amount (₹)
                          </label>
                          <label className="form-check-label fw-medium cursor-pointer">
                            <input
                              type="radio"
                              className="form-check-input me-1"
                              name="discType"
                              value="Percentage"
                              checked={discountType === "Percentage"}
                              onChange={() => setDiscountType("Percentage")}
                            />
                            Percentage (%)
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fs-13 fw-semibold">
                          Discount Value {discountType === "Percentage" ? "(%)" : "(₹)"}
                        </label>
                        <input
                          type="number"
                          className="form-control fw-bold text-warning"
                          placeholder={discountType === "Percentage" ? "e.g. 10" : "e.g. 500"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          min={0}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fs-13 fw-semibold">Discount Deduction</label>
                        <div className="form-control bg-white fw-bold text-danger">
                          - ₹{computedDiscount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Settle Calculation */}
                  <div className="p-3 bg-soft-success border border-success rounded-3 mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <span className="text-muted fs-13 d-block">NET FINAL PAYABLE BALANCE:</span>
                        <h2 className="fw-bold text-success mb-0">
                          ₹{netPayable.toLocaleString("en-IN")}
                        </h2>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm fw-bold"
                        onClick={() => setPaymentAmount(String(netPayable))}
                      >
                        Auto-Fill Full Pay (₹{netPayable})
                      </button>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-semibold">
                          Final Payment Collecting (₹) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control fw-bold text-success fs-18"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min={0}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-semibold">Payment Method</label>
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

                  <div>
                    <label className="form-label fw-semibold">Discharge Summary / Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Patient fully recovered. Prescribed post-op medications for 7 days."
                      value={dischargeNotes}
                      onChange={(e) => setDischargeNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDischargeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4 fw-bold"
                    disabled={submittingDischarge}
                  >
                    {submittingDischarge ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Discharging...
                      </>
                    ) : (
                      "Settle Bill & Discharge Inpatient"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISCHARGED PATIENT SETTLED RECEIPT & SUMMARY */}
      {showSettledReceiptModal && settledAdmissionData && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-receipt me-2 text-success" />
                  Discharged Inpatient Settled Receipt ({settledAdmissionData.admissionCode})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSettledReceiptModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Header & Status Banner */}
                <div className="d-flex justify-content-between align-items-start pb-3 border-bottom mb-4">
                  <div>
                    <h3 className="fw-bold text-primary mb-1">DocYori Hospital</h3>
                    <p className="text-muted fs-13 mb-0">Official Final Settlement & Discharge Summary</p>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-danger fs-14 py-2 px-3 mb-1 d-inline-block fw-bold">
                      STATUS: DISCHARGED
                    </span>
                    <div className="text-muted fs-12">
                      Discharged On:{" "}
                      {settledAdmissionData.dischargeDate
                        ? new Date(settledAdmissionData.dischargeDate).toLocaleString()
                        : "Completed"}
                    </div>
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div className="row g-3 p-3 bg-light rounded border mb-4">
                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">PATIENT NAME</span>
                    <strong className="text-dark fs-15">{getPatientName(settledAdmissionData.patient)}</strong>
                    <small className="text-muted d-block">UHID: {settledAdmissionData.patient?.patientCode || "—"}</small>
                  </div>

                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">ATTENDING DOCTOR</span>
                    <strong className="text-primary fs-15">
                      {settledAdmissionData.doctor?.fullName || "Primary Doctor"}
                    </strong>
                  </div>

                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">RELEASED WARD</span>
                    <span className="badge bg-soft-info text-info fw-bold fs-13">
                      {settledAdmissionData.ward?.wardName || "Assigned Ward"}
                    </span>
                  </div>

                  <div className="col-md-3 col-6 text-md-end">
                    <span className="text-muted fs-12 fw-semibold d-block">ADMISSION DATE</span>
                    <strong className="text-dark fs-14">
                      {new Date(settledAdmissionData.admissionDate).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                {/* Settlement Financial Summary Box */}
                <div className="p-4 bg-soft-success border border-success rounded-3 mb-4">
                  <h6 className="fw-bold text-success mb-3">Final Payment & Concession Breakdown</h6>
                  <div className="row g-3 text-center text-md-start">
                    <div className="col-md-3">
                      <span className="text-muted fs-12 fw-semibold d-block">TOTAL Billed</span>
                      <strong className="text-dark fs-16">
                        ₹{settledAdmissionData.totalAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="col-md-3">
                      <span className="text-muted fs-12 fw-semibold d-block">CONCESSION / DISCOUNT</span>
                      <strong className="text-warning fs-16">
                        - ₹{(settledAdmissionData.discountAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="col-md-3">
                      <span className="text-muted fs-12 fw-semibold d-block">TOTAL PAID SETTLED</span>
                      <strong className="text-success fs-16">
                        ₹{settledAdmissionData.totalPaid.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="col-md-3">
                      <span className="text-muted fs-12 fw-semibold d-block">REMAINING DUE BALANCE</span>
                      <strong className="text-danger fs-16">
                        ₹{settledAdmissionData.dueAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Discharge Notes / Summary */}
                {settledAdmissionData.dischargeNotes && (
                  <div className="p-3 bg-light rounded border">
                    <span className="text-muted fs-12 fw-semibold d-block mb-1">DISCHARGE REMARKS & NOTES</span>
                    <p className="text-dark mb-0 fs-13">{settledAdmissionData.dischargeNotes}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettledReceiptModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="ti ti-printer me-1" /> Print Discharge Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* ── WRITE IPD PRESCRIPTION MODAL (Split Layout with Patient Past Prescriptions History) ── */}
      {showPrescriptionModal && prescriptionAdmission && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <form onSubmit={handleSavePrescription} className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', borderBottom: 0, flexShrink: 0 }}>
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-file-text me-2" />IPD Prescription & Discharge Summary
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPrescriptionModal(false)} />
              </div>
                {/* Patient Banner */}
                <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-light border-bottom">
                  <div>
                    <span className="text-muted fs-12 d-block">Patient</span>
                    <h6 className="fw-bold text-dark mb-0">{getPatientName(prescriptionAdmission.patient)}</h6>
                    <small className="text-muted">Code: {prescriptionAdmission.admissionCode} | UHID: {prescriptionAdmission.patient?.patientCode || ""}</small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-soft-primary text-primary fw-bold fs-13 d-block mb-1">{prescriptionAdmission.ward?.wardName || "Ward"}</span>
                    <small className="text-muted">Dr. {prescriptionAdmission.doctor?.fullName || "Attending Doctor"}</small>
                  </div>
                </div>

                <div className="modal-body p-0" style={{ overflowY: 'auto' }}>
                  <div className="row g-0">

                    {/* ── LEFT: Active Prescription Form ── */}
                    <div className="col-lg-7 border-end p-4">
                      {/* Discharge Summary */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Discharge Summary / Diagnosis Notes</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          placeholder="Enter detailed discharge summary, diagnosis findings, and doctor's advice..."
                          value={dischargeSummary}
                          onChange={(e) => setDischargeSummary(e.target.value)}
                        />
                      </div>

                      {/* Medicine advice */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold"><i className="ti ti-pill me-1 text-success" />Add Medicine Advice</label>
                        <div className="card border bg-light p-3 mb-2">
                          <div className="row g-2 align-items-end mb-2">
                            <div className="col-md-3" style={{ position: 'relative' }}>
                              <label className="form-label fs-11 fw-semibold mb-1">Medicine Name</label>
                              <input
                                ref={medInputRef}
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search medicine..."
                                value={medSearch || newMedName}
                                autoComplete="off"
                                onChange={(e) => {
                                  setMedSearch(e.target.value);
                                  setNewMedName(e.target.value);
                                  setMedDropdownOpen(true);
                                }}
                                onFocus={() => setMedDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setMedDropdownOpen(false), 180)}
                              />
                              {medDropdownOpen && filteredSysMeds.length > 0 && (
                                <div
                                  style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: '#fff', border: '1px solid #d1d5db',
                                    borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    zIndex: 9999, maxHeight: '200px', overflowY: 'auto',
                                  }}
                                >
                                  {filteredSysMeds.map((med) => {
                                    const name = getMedName(med);
                                    return (
                                      <div
                                        key={med.id}
                                        className="d-flex align-items-center justify-content-between px-3 py-2"
                                        style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}
                                        onMouseDown={() => {
                                          setNewMedName(name);
                                          setMedSearch(name);
                                          if (med.unit) setNewMedStrength(med.unit);
                                          setMedDropdownOpen(false);
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                      >
                                        <div>
                                          <span className="fw-semibold text-dark">{name}</span>
                                          {med.genericName && <small className="text-muted ms-1">({med.genericName})</small>}
                                        </div>
                                        <div className="d-flex gap-1 align-items-center">
                                          {med.unit && <span className="badge bg-soft-primary text-primary" style={{ fontSize: '10px' }}>{med.unit}</span>}
                                          {med.category?.name && <span className="badge bg-soft-success text-success" style={{ fontSize: '10px' }}>{med.category.name}</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="col-md-2">
                              <label className="form-label fs-11 fw-semibold mb-1">Dosage</label>
                              <input type="text" className="form-control form-control-sm" placeholder="Dosage" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label fs-11 fw-semibold mb-1">Strength</label>
                              <input type="text" className="form-control form-control-sm" placeholder="Strength" value={newMedStrength} onChange={(e) => setNewMedStrength(e.target.value)} />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label fs-11 fw-semibold mb-1">Frequency</label>
                              <select className="form-select form-select-sm" value={newMedFrequency} onChange={(e) => setNewMedFrequency(e.target.value)}>
                                {["Once daily","Twice daily","Thrice daily","Four times daily","Every 6 hours","Every 8 hours","As needed","At bedtime"].map(f => <option key={f}>{f}</option>)}
                              </select>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label fs-11 fw-semibold mb-1">Duration</label>
                              <input type="text" className="form-control form-control-sm" placeholder="e.g. 5 days" value={newMedDuration} onChange={(e) => setNewMedDuration(e.target.value)} />
                            </div>
                            <div className="col-md-8 mt-2">
                              <input type="text" className="form-control form-control-sm" placeholder="Instructions (e.g. after meal, with water)" value={newMedInstructions} onChange={(e) => setNewMedInstructions(e.target.value)} />
                            </div>
                            <div className="col-md-4 mt-2">
                              <button type="button" className="btn btn-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center shadow-sm" onClick={handleAddMedicineRow}>
                                <i className="ti ti-plus me-1" /> Add Medicine
                              </button>
                            </div>
                          </div>
                        </div>

                        {medicinesList.length > 0 && (
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered align-middle mb-0">
                              <thead className="table-light"><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th></th></tr></thead>
                              <tbody>
                                {medicinesList.map((med, idx) => (
                                  <tr key={idx}>
                                    <td className="fw-semibold">{med.name} {med.strength && <small className="text-muted">({med.strength})</small>}</td>
                                    <td>{med.dosage || "—"}</td>
                                    <td>{med.frequency}</td>
                                    <td>{med.duration || "—"}</td>
                                    <td><button type="button" className="btn btn-xs btn-outline-danger py-0 px-1" onClick={() => handleRemoveMedicineRow(idx)}><i className="ti ti-trash fs-12" /></button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Image upload with working preview */}
                      <div className="mb-2">
                        <label className="form-label fw-semibold"><i className="ti ti-upload text-info me-1" />Upload Reports / Images</label>
                        <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleImageUpload} disabled={uploadingImage} />
                        {uploadingImage && <span className="text-muted fs-12 d-block mt-1"><div className="spinner-border spinner-border-sm text-info me-1" />Uploading...</span>}
                        {attachedImages.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {attachedImages.map((url, i) => (
                              <div key={i} className="position-relative">
                                <img src={getImageUrl(url)} alt="report" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
                                <button type="button" className="btn btn-danger btn-xs position-absolute top-0 end-0 p-0" style={{ width: '20px', height: '20px', fontSize: '12px', lineHeight: 1 }} onClick={() => setAttachedImages(prev => prev.filter((_, ii) => ii !== i))}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── RIGHT: Patient's Past Prescriptions & OPD History Panel ── */}
                    <div className="col-lg-5 p-4" style={{ background: '#f8fafc' }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="ti ti-history me-1 text-purple" style={{ color: '#6d28d9' }} />
                          Patient's Prescriptions History
                        </h6>
                        <span className="badge bg-soft-primary text-primary fs-11 fw-bold">
                          {pastPatientPrescriptions.length} Records
                        </span>
                      </div>

                      {loadingPastHistory ? (
                        <div className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status" />
                          <p className="text-muted fs-12 mt-2 mb-0">Loading patient history...</p>
                        </div>
                      ) : pastPatientPrescriptions.length === 0 ? (
                        <div className="text-center py-5 border rounded bg-white p-3">
                          <i className="ti ti-file-off fs-36 text-muted d-block mb-2" />
                          <p className="text-muted fs-13 mb-0">No previous OPD or IPD prescriptions found for this patient.</p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {pastPatientPrescriptions.map((item: any) => {
                            const isOPD = item._type === 'OPD';
                            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                            const docName = isOPD ? (item.doctor?.fullName ? `Dr. ${item.doctor.fullName}` : 'OPD Doctor') : (item.doctor?.fullName ? `Dr. ${item.doctor.fullName}` : 'IPD Doctor');
                            const medsList = isOPD
                              ? (Array.isArray(item.medicines) ? item.medicines : [])
                              : (Array.isArray(item.medicineAdvice) ? item.medicineAdvice : []);

                            return (
                              <div key={item.id} className="card border shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-header d-flex align-items-center justify-content-between py-2 px-3" style={{ background: isOPD ? '#e0f2fe' : '#ede9fe', borderBottom: 0, borderRadius: '12px 12px 0 0' }}>
                                  <div>
                                    <span className={`badge ${isOPD ? 'bg-info text-white' : 'bg-purple text-white'} fw-bold me-1`} style={{ fontSize: '10px', background: isOPD ? '#0284c7' : '#7c3aed' }}>
                                      {isOPD ? 'OPD Presc' : 'IPD Presc'}
                                    </span>
                                    <small className="fw-semibold text-dark fs-12">{item.prescriptionCode || item.id?.slice(0, 8)}</small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success py-1 px-2.5 fw-bold d-inline-flex align-items-center shadow-sm"
                                    style={{ fontSize: '11px', borderRadius: '6px' }}
                                    onClick={() => handleCopyFromPast(item, isOPD)}
                                    title="Copy all medicines from this prescription"
                                  >
                                    <i className="ti ti-copy me-1" />Copy Medicines
                                  </button>
                                </div>
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <small className="text-muted fw-medium"><i className="ti ti-stethoscope me-1" />{docName}</small>
                                    <small className="text-muted fs-11"><i className="ti ti-calendar me-1" />{dateStr}</small>
                                  </div>

                                  {(item.diagnosis || item.dischargeSummary || item.notes) && (
                                    <p className="text-dark fs-12 mb-2 p-2 bg-light rounded border-start border-3 border-primary">
                                      {item.diagnosis || item.dischargeSummary || item.notes}
                                    </p>
                                  )}

                                  {medsList.length > 0 && (
                                    <div className="d-flex flex-wrap gap-1">
                                      {medsList.map((m: any, idx: number) => {
                                        const mName = m.medicineName || m.name || m.medicine?.medicineName || "Med";
                                        return (
                                          <span key={idx} className="badge bg-soft-success text-success fw-semibold" style={{ fontSize: '11px' }}>
                                            {mName} {m.dosage && `(${m.dosage})`}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <div className="modal-footer bg-light border-top d-flex justify-content-end gap-2" style={{ flexShrink: 0 }}>
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowPrescriptionModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold px-5" disabled={savingPrescription}>
                    {savingPrescription ? <><div className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="ti ti-check me-1" />Save Prescription</>}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
      {showPrescriptionModal && <div className="modal-backdrop fade show" />}

      {/* ── VIEW PRESCRIPTION MODAL ──────────────────────────────── */}
      {showViewPrescriptionModal && selectedPrescription && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderBottom: 0 }}>
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-file-text me-2 text-info" />{selectedPrescription.prescriptionCode || "IPD Prescription Detail"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewPrescriptionModal(false)} />
              </div>
              <div className="modal-body p-4">
                {/* Patient Summary */}
                {prescriptionAdmission && (
                  <div className="p-3 bg-light rounded border mb-4 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted fs-12 d-block">Patient</span>
                      <h6 className="fw-bold text-dark mb-0">{getPatientName(prescriptionAdmission.patient)}</h6>
                      <small className="text-muted">Code: {prescriptionAdmission.admissionCode} | UHID: {prescriptionAdmission.patient?.patientCode || ""}</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-soft-primary text-primary fw-bold fs-13 d-block mb-1">{prescriptionAdmission.ward?.wardName || "Ward"}</span>
                      <small className="text-muted">Dr. {prescriptionAdmission.doctor?.fullName || "Attending Doctor"}</small>
                    </div>
                  </div>
                )}

                {/* Discharge Summary */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-muted fs-12" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discharge Summary / Notes</label>
                  <div className="p-3 rounded-3 bg-light border fs-13 text-dark">{selectedPrescription.dischargeSummary || "No discharge notes available."}</div>
                </div>

                {/* Medicines */}
                {Array.isArray(selectedPrescription.medicineAdvice) && selectedPrescription.medicineAdvice.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted fs-12" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medicine Advice</label>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr><th>Medicine</th><th>Dosage</th><th>Strength</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
                        </thead>
                        <tbody>
                          {selectedPrescription.medicineAdvice.map((m: any, i: number) => (
                            <tr key={i}>
                              <td className="fw-semibold text-dark">{m.name}</td>
                              <td>{m.dosage || "—"}</td>
                              <td>{m.strength || "—"}</td>
                              <td>{m.frequency || "—"}</td>
                              <td>{m.duration || "—"}</td>
                              <td>{m.instructions || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Images with working display URLs */}
                {Array.isArray(selectedPrescription.images) && selectedPrescription.images.length > 0 && (
                  <div>
                    <label className="form-label fw-bold text-muted fs-12" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attached Reports & Images</label>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedPrescription.images.map((url: string, i: number) => (
                        <a key={i} href={getImageUrl(url)} target="_blank" rel="noreferrer" className="d-block border rounded p-1 bg-white shadow-sm" style={{ width: '100px', height: '100px' }}>
                          <img src={getImageUrl(url)} alt="report" className="w-100 h-100 object-fit-cover rounded" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-primary fw-semibold"
                  onClick={() => {
                    setShowViewPrescriptionModal(false);
                    if (prescriptionAdmission) handleOpenPrescriptionModal(prescriptionAdmission);
                  }}
                >
                  <i className="ti ti-edit me-1" /> Edit Prescription
                </button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewPrescriptionModal(false)}>Close</button>
                  <button type="button" className="btn btn-primary" onClick={() => window.print()}><i className="ti ti-printer me-1" /> Print</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW IPD DETAILS MODAL */}
      <IpdViewDetailsModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        admission={selectedViewAdmission}
      />

      <Footer />
    </div>
  );
};

export default IpdDischargePage;
