import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import Footer from "../../../../core/common/footer/footer";
import Datatable from "../../../../core/common/dataTable";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import IpdViewDetailsModal from "./IpdViewDetailsModal";
import { IconFormControl } from "../../../../core/common/form-fields";

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
  treatmentReason?: string | null;
  referralAppointmentCode?: string | null;
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
  const [activeReferralId, setActiveReferralId] = useState<string | null>(null);

  // Modal Form Fields
  const [admissionType, setAdmissionType] = useState<"Direct" | "Refer to OPD" | "Emergency">("Direct");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [referralAppointmentId, setReferralAppointmentId] = useState<string | null>(null);
  const [referralAppointmentCode, setReferralAppointmentCode] = useState<string | null>(null);

  // Financial Breakdown Fields
  const [defaultAdmissionFee, setDefaultAdmissionFee] = useState("500");
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewAdmission, setSelectedViewAdmission] = useState<any>(null);

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
      const [admRes, patRes, docRes, wrdRes, trtRes, feeRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/admissions"), { headers }),
        fetch(apiUrl("/api/patients"), { headers }),
        fetch(apiUrl("/api/doctors?type=IPD"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
        fetch(apiUrl("/api/ipd/treatments"), { headers }),
        fetch(apiUrl("/api/settings/ipd/admission-fee"), { headers }),
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
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        const val = String(feeData.ipdAdmissionFee !== undefined ? feeData.ipdAdmissionFee : "500");
        setDefaultAdmissionFee(val);
        setAdmissionFee(val);
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
    setActiveReferralId(null);
    setAdmissionType("Direct");
    setSelectedPatientId(patients[0]?.id || "");
    setSelectedDoctorId(doctors[0]?.id || "");
    setSelectedWardId(wards[0]?.id || "");
    setSelectedTreatmentId("");
    setDiagnosis("");
    setAdmissionFee(defaultAdmissionFee);
    setTreatmentFee("0");
    setWardCharge("0");
    setDoctorVisitCharge("0");
    setNursingFee("0");
    setOtherCharges("0");
    setAdvancePaid("");
    setPaymentMethod("Cash");
    setReferralAppointmentId(null);
    setReferralAppointmentCode(null);
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

  const handleStartAdmission = (adm: any) => {
    resetForm();
    setActiveReferralId(adm.id);
    setAdmissionType("Refer to OPD");
    setReferralAppointmentId(adm.referralAppointmentId || null);
    setReferralAppointmentCode(adm.referralAppointmentCode || null);

    setSelectedPatientId(adm.patientId);
    if (adm.doctorId) {
      setSelectedDoctorId(adm.doctorId);
      const foundDoc = doctors.find((d) => d.id === adm.doctorId);
      if (foundDoc && foundDoc.ipdVisitCharge) {
        setDoctorVisitCharge(String(foundDoc.ipdVisitCharge));
      }
    }
    if (adm.treatmentId) {
      setSelectedTreatmentId(adm.treatmentId);
      const foundTrt = treatments.find((t) => t.id === adm.treatmentId);
      if (foundTrt) {
        setTreatmentFee(String(foundTrt.totalPrice || 0));
      }
    }
    if (adm.diagnosis) {
      setDiagnosis(adm.diagnosis);
    } else if (adm.treatmentReason) {
      setDiagnosis(`Referred for Treatment: ${adm.treatmentReason}`);
    }

    if (wards.length > 0) {
      setSelectedWardId(wards[0].id);
      setWardCharge(String(wards[0].chargePerNight || 0));
      setNursingFee(String(wards[0].nursingChargePerNight || 0));
    }

    setShowModal(true);
  };

  const handleDeleteAdmission = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel/delete this IPD recommendation?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/admissions/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete record");
      toast.success("Recommendation deleted successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error deleting record");
    }
  };

  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error("Please select a patient.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    const isRecommendation = !activeReferralId && (admissionType === "Refer to OPD" || !selectedWardId);
    const targetStatus = isRecommendation ? "Incomplete" : "Admitted";
    const refCode = isRecommendation
      ? (referralAppointmentCode || `APT-REF-${Math.floor(1000 + Math.random() * 9000)}`)
      : (referralAppointmentCode || undefined);

    const payload = {
      admissionType,
      patientId: selectedPatientId,
      doctorId: selectedDoctorId || undefined,
      wardId: selectedWardId || undefined,
      treatmentId: selectedTreatmentId || undefined,
      diagnosis: diagnosis.trim() || undefined,
      status: targetStatus,
      admissionFee: parseFloat(admissionFee) || 0,
      treatmentFee: parseFloat(treatmentFee) || 0,
      wardCharge: parseFloat(wardCharge) || 0,
      doctorVisitCharge: parseFloat(doctorVisitCharge) || 0,
      nursingFee: parseFloat(nursingFee) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      paymentMethod,
      referralAppointmentId: referralAppointmentId || undefined,
      referralAppointmentCode: refCode,
    };

    if (activeReferralId) {
      // UPDATE existing recommendation directly to Admitted (Inpatient) status
      const updateUrl = apiUrl(`/api/ipd/admissions/${activeReferralId}`);
      const updatePayload = {
        status: "Admitted",
        wardId: selectedWardId || undefined,
        doctorId: selectedDoctorId || undefined,
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
        const res = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update admission status");
        }

        toast.success("Patient admission started and status updated to Inpatient!");
        setShowModal(false);
        setActiveReferralId(null);
        resetForm();
        fetchData();
        return;
      } catch (err: any) {
        toast.error(err.message || "Error updating admission");
        setSubmitting(false);
        return;
      }
    }

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

  const tableData = useMemo(
    () =>
      filteredAdmissions.map((adm, idx) => ({
        key: adm.id,
        sr: idx + 1,
        admissionCode: adm.admissionCode,
        patientName: getPatientName(adm.patient),
        patientMeta: `UHID: ${adm.patient?.patientCode || "—"} | ${adm.patient?.phone || "—"}`,
        doctorName: adm.doctor?.fullName || "Unassigned",
        doctorVisitCharge: adm.doctorVisitCharge,
        wardName: adm.ward?.wardName || "Not Assigned",
        wardCharge: adm.wardCharge,
        treatmentName: adm.treatment?.procedureName || "Standard IPD Care",
        treatmentReason: adm.treatmentReason || "",
        referralAppointmentCode: adm.referralAppointmentCode || "",
        treatmentFee: adm.treatmentFee,
        totalEstimatedAmount: adm.totalEstimatedAmount,
        advancePaid: adm.advancePaid,
        dueAmount: adm.dueAmount,
        paymentStatus: adm.paymentStatus,
        status: adm.status,
        _raw: adm,
      })),
    [filteredAdmissions]
  );

  const columns = useMemo(
    () => [
      {
        title: "Sr.",
        dataIndex: "sr",
        width: 60,
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) => a.sr - b.sr,
      },
      {
        title: "Admission Code",
        dataIndex: "admissionCode",
        render: (text: string) => (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "#e2e8f0",
              color: "#1e293b",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className="ti ti-hash fs-14" />
            {text}
          </span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.admissionCode.localeCompare(b.admissionCode),
      },
      {
        title: "Referral OPD",
        dataIndex: "referralAppointmentCode",
        render: (text: string) => (
          text ? (
            <span
              className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: "#f5f3ff",
                color: "#7c3aed",
                fontWeight: 600,
                fontSize: "12px",
                border: "1px solid #ddd6fe"
              }}
            >
              <i className="ti ti-link fs-14" />
              {text}
            </span>
          ) : (
            <span className="text-muted fs-12">—</span>
          )
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          (a.referralAppointmentCode || "").localeCompare(b.referralAppointmentCode || ""),
      },
      {
        title: "Patient Details",
        dataIndex: "patientName",
        render: (text: string, record: (typeof tableData)[0]) => (
          <div className="lh-1">
            <h6 className="mb-1 fs-14 fw-semibold text-dark">{text}</h6>
            <span className="text-muted fs-12 fw-normal d-block mt-1">
              {record.patientMeta}
            </span>
          </div>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.patientName.localeCompare(b.patientName),
      },
      {
        title: "Primary Doctor",
        dataIndex: "doctorName",
        render: (text: string, record: (typeof tableData)[0]) => (
          <>
            <span className="fw-semibold text-primary d-block fs-13">{text}</span>
            {record.doctorVisitCharge > 0 && (
              <small className="text-muted d-block mt-1">
                Visit: ₹{record.doctorVisitCharge}
              </small>
            )}
          </>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.doctorName.localeCompare(b.doctorName),
      },
      {
        title: "Assigned Ward",
        dataIndex: "wardName",
        render: (text: string, record: (typeof tableData)[0]) => (
          <>
            <span
              className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1 mb-1"
              style={{
                backgroundColor: "#e0f2fe",
                color: "#2563eb",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              <i className="ti ti-bed fs-14" />
              {text}
            </span>
            {record.wardCharge > 0 && (
              <small className="text-muted d-block mt-1">
                Rate: ₹{record.wardCharge}/night
              </small>
            )}
          </>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.wardName.localeCompare(b.wardName),
      },
      {
        title: "Treatment / Surgery",
        dataIndex: "treatmentName",
        render: (text: string, record: (typeof tableData)[0]) => (
          <>
            <span className="fw-medium text-dark d-block fs-13">{text}</span>
            {record.treatmentReason && (
              <small className="text-muted d-block mt-1 fs-11">
                Reason: {record.treatmentReason}
              </small>
            )}
            {record.treatmentFee > 0 && (
              <small className="text-muted d-block mt-1">
                Proc Fee: ₹{record.treatmentFee}
              </small>
            )}
          </>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.treatmentName.localeCompare(b.treatmentName),
      },

      {
        title: "Status",
        dataIndex: "status",
        render: (text: string) => {
          const isAdmitted = text === "Admitted";
          const isIncomplete = text === "Incomplete";
          
          let bg = "#f1f5f9";
          let color = "#64748b";
          let icon = "ti ti-circle-dashed";
          
          if (isAdmitted) {
            bg = "#e6f8ef";
            color = "#198754";
            icon = "ti ti-circle-check";
          } else if (isIncomplete) {
            bg = "#fef3c7";
            color = "#d97706";
            icon = "ti ti-alert-circle";
          }
          
          return (
            <span
              className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: bg,
                color: color,
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              <i className={`${icon} fs-14`} />
              {text === "Admitted" ? "Inpatient" : text}
            </span>
          );
        },
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.status.localeCompare(b.status),
      },
      {
        title: "Action",
        className: "text-center text-nowrap",
        width: 180,
        align: "center" as const,
        render: (_: unknown, record: (typeof tableData)[0]) => (
          <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
            {record.status === "Incomplete" ? (
              <>
                <button
                  type="button"
                  className="bg-transparent border-0 text-primary p-1"
                  title="View Full IPD Details"
                  onClick={() => {
                    setSelectedViewAdmission(record._raw);
                    setShowViewModal(true);
                  }}
                >
                  <i className="ti ti-eye fs-18" />
                </button>
                <button
                  type="button"
                  className="bg-transparent border-0 text-success p-1"
                  title="Start Patient Admission"
                  onClick={() => handleStartAdmission(record._raw)}
                >
                  <i className="ti ti-player-play-filled fs-18" style={{ color: "#10b981" }} />
                </button>
                <button
                  type="button"
                  className="bg-transparent border-0 text-danger p-1"
                  title="Delete/Reject Recommendation"
                  onClick={() => handleDeleteAdmission(record.key)}
                >
                  <i className="ti ti-trash fs-18" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="bg-transparent border-0 text-primary p-1"
                  title="View Full IPD Details"
                  onClick={() => {
                    setSelectedViewAdmission(record._raw);
                    setShowViewModal(true);
                  }}
                >
                  <i className="ti ti-eye fs-18" />
                </button>
                <Link
                  to={all_routes.ipdDischarge}
                  className="text-success p-1"
                  title="Process Discharge & Settle"
                >
                  <i className="ti ti-user-check fs-18" />
                </Link>
                <Link
                  to={all_routes.ipdBillings}
                  className="text-info p-1"
                  title="View Invoices & Receipts"
                >
                  <i className="ti ti-file-invoice fs-18" />
                </Link>
                <Link
                  to={all_routes.ipdBillings}
                  className="text-primary p-1"
                  title="Raise IPD Charge"
                >
                  <i className="ti ti-plus fs-18" />
                </Link>
              </>
            )}
          </div>
        ),
      },
    ],
    [doctors, treatments, wards]
  );

  const hasActiveFilters = filterWard || filterPatient || filterDoctor || filterDue;

  return (
    <div className="page-wrapper">
      <style>{`
        .page-wrapper .ipd-admissions-empty-card.card,
        .page-wrapper .datatable-main-container .datatable-table-shell.card {
          border: none !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
          border-radius: 12px !important;
        }
      `}</style>
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="page-title mb-0">IPD Admission Desk</h3>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Ward Filter */}
            <select
              className="form-select"
              style={{
                width: "140px",
                height: "46px",
                minHeight: "46px",
                flexShrink: 0,
                borderRadius: "12px",
                borderWidth: "1.5px",
                borderColor: "#6366f1",
                fontSize: "14px",
                fontWeight: 500,
              }}
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
            >
              <option value="">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.wardName} ({w.wardType})</option>
              ))}
            </select>

            {/* Patient Filter */}
            <select
              className="form-select"
              style={{
                width: "150px",
                height: "46px",
                minHeight: "46px",
                flexShrink: 0,
                borderRadius: "12px",
                borderWidth: "1.5px",
                borderColor: "#6366f1",
                fontSize: "14px",
                fontWeight: 500,
              }}
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
            >
              <option value="">All Patients</option>
              {Array.from(
                new Map(admissions.map((a) => [a.patient?.id, a.patient] as [string | undefined, any]).filter(([id]) => id)).values()
              ).map((p: any) => (
                <option key={p.id} value={p.id}>{getPatientName(p)} {p.patientCode ? `(${p.patientCode})` : ""}</option>
              ))}
            </select>

            {/* Doctor Filter */}
            <select
              className="form-select"
              style={{
                width: "140px",
                height: "46px",
                minHeight: "46px",
                flexShrink: 0,
                borderRadius: "12px",
                borderWidth: "1.5px",
                borderColor: "#6366f1",
                fontSize: "14px",
                fontWeight: 500,
              }}
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

            {/* Due Amount Filter */}
            <select
              className="form-select"
              style={{
                width: "130px",
                height: "46px",
                minHeight: "46px",
                flexShrink: 0,
                borderRadius: "12px",
                borderWidth: "1.5px",
                borderColor: "#6366f1",
                fontSize: "14px",
                fontWeight: 500,
              }}
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
            >
              <option value="">All Dues</option>
              <option value="due">Has Due</option>
              <option value="paid">Fully Paid</option>
              <option value="advance">Advance Paid</option>
            </select>

            {hasActiveFilters && (
              <button
                className="btn btn-light border fw-semibold d-inline-flex align-items-center"
                style={{ height: "46px", fontSize: "13px", borderRadius: "12px", flexShrink: 0 }}
                onClick={() => { setFilterWard(""); setFilterPatient(""); setFilterDoctor(""); setFilterDue(""); }}
              >
                <i className="ti ti-x me-1" />Clear
              </button>
            )}

            <button
              className="btn btn-primary d-inline-flex align-items-center ms-md-2"
              style={{ height: "46px", flexShrink: 0, borderRadius: "12px" }}
              onClick={() => handleOpenModal("Direct")}
            >
              <i className="ti ti-user-plus me-1" /> Add Patient Admission
            </button>
          </div>
        </div>

        {/* Admissions Table — same Datatable shell/header/pagination as Patients */}
        {loading ? (
          <div className="card ipd-admissions-empty-card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading IPD Admissions...</p>
            </div>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="card ipd-admissions-empty-card">
            <div className="card-body text-center py-5">
              <i className="ti ti-user-plus fs-40 text-muted mb-2 d-block" />
              <h5 className="fw-bold">No Inpatient Admissions Found</h5>
              <p className="text-muted fs-13 mb-3">
                Click below to admit your first patient to IPD with ward & treatment selection.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal("Direct")}>
                <i className="ti ti-plus me-1" /> + Add Patient Admission
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={tableData}
              Selection={false}
              searchText=""
            />
          </div>
        )}
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
                      <IconFormControl
                        fieldLabel="diagnosis"
                        type="text"
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
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter admission fee"
                        value={admissionFee}
                        onChange={(e) => setAdmissionFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Treatment / Surgery Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter treatment fee"
                        value={treatmentFee}
                        onChange={(e) => setTreatmentFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Ward Per Night Charge (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter per night ward charge"
                        value={wardCharge}
                        onChange={(e) => setWardCharge(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Doctor Visit Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter doctor visit fee"
                        value={doctorVisitCharge}
                        onChange={(e) => setDoctorVisitCharge(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Nursing Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter nursing fee"
                        value={nursingFee}
                        onChange={(e) => setNursingFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4 col-6">
                      <label className="form-label fw-semibold">Others (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Enter other charges"
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
                        <IconFormControl
                          fieldLabel="amount"
                          type="number"
                          className="fw-bold text-success fs-16"
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

export default IpdAdmissionsPage;
