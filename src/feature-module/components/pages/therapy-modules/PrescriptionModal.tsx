import React, { useState, useEffect, useMemo, useRef } from "react";
import { apiGet, apiPut, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { useMedicines } from "../../../../core/hooks/useMedicines";
import { useLabTests } from "../../../../core/hooks/useLabTests";
import { apiUrl } from "../../../../core/config/api";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";
import html2pdf from "html2pdf.js";
import PrescriptionPadSlip from "../clinic-modules/appointments/PrescriptionPadSlip";

const mapTherapyMedToPad = (m: any) => {
  const raw = String(m?.dosage || "").trim();
  const looksLikeFreq =
    /^(\d+-\d+|SOS|As Directed)/i.test(raw) || /^\d+-\d+(-\d+)*/.test(raw);
  return {
    medicineName: m?.name || m?.medicineName || "",
    strength: m?.strength || "",
    dosage: looksLikeFreq ? "1 Tablet" : raw || "1 Tablet",
    frequency: m?.frequency || (looksLikeFreq ? raw : "1-0-1"),
    duration: m?.duration || "5 Days",
    timings: m?.instructions || m?.timings || "After Food",
    category: m?.category || "General Medicine",
  };
};

interface PrescriptionModalProps {
  appointment: any | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointment,
  onSaveSuccess,
  onClose,
}) => {
  const { medicines: pharmacyMedicines } = useMedicines();
  const { tests: labTests } = useLabTests();
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [previousConsultations, setPreviousConsultations] = useState<any[]>([]);
  const [previousClinicPrescriptions, setPreviousClinicPrescriptions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testSearchText, setTestSearchText] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  // Initialize consultation data when appointment is set
  useEffect(() => {
    if (!appointment) {
      setSelectedConsultation(null);
      setPreviousConsultations([]);
      setPreviousClinicPrescriptions([]);
      return;
    }

    const loadConsultationData = async () => {
      setLoading(true);
      try {
        let consult: any;
        if (appointment.consultation) {
          consult = await apiGet<any>(`/api/consultations/${appointment.consultation.id}`);
        } else {
          consult = await apiPost<any>("/api/consultations", {
            appointmentId: appointment.id,
            status: "Draft",
          });
          onSaveSuccess(); // Refresh parent component data to link consultation
        }
        setSelectedConsultation(consult);

        const pId = consult?.patientId || appointment.patientId;
        if (pId) {
          // Fetch past consultations
          const pastConsults = await apiGet<any[]>(`/api/consultations?patientId=${pId}`);
          setPreviousConsultations((pastConsults || []).filter((p: any) => p.id !== consult?.id));

          // Fetch clinic prescriptions
          const clinicPres = await apiGet<any[]>(`/api/prescriptions`);
          setPreviousClinicPrescriptions((clinicPres || []).filter((p: any) => p.patientId === pId));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load/create consultation");
      } finally {
        setLoading(false);
      }
    };

    loadConsultationData();
  }, [appointment]);

  // Bind close/hide event on bootstrap modal to clear parent selection
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const handleHidden = () => {
      onClose();
    };

    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      el.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [onClose]);

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
        painLevel: selectedConsultation.painLevel,
        diagnosticTests: selectedConsultation.diagnosticTests || [],
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
        painLevel: selectedConsultation.painLevel,
        diagnosticTests: selectedConsultation.diagnosticTests || [],
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
        painLevel: selectedConsultation.painLevel,
        diagnosticTests: selectedConsultation.diagnosticTests || [],
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

  const updateModalPainLevel = (value: number | null) => {
    if (!selectedConsultation) return;
    setSelectedConsultation({
      ...selectedConsultation,
      painLevel: value,
    });
  };

  const diagnosticTestsList: string[] = Array.isArray(selectedConsultation?.diagnosticTests)
    ? selectedConsultation.diagnosticTests
    : [];

  const addDiagnosticTest = (name: string) => {
    const val = name.trim();
    if (!selectedConsultation || !val) return;
    const current = Array.isArray(selectedConsultation.diagnosticTests)
      ? selectedConsultation.diagnosticTests
      : [];
    if (current.includes(val)) return;
    setSelectedConsultation({
      ...selectedConsultation,
      diagnosticTests: [...current, val],
    });
    setTestSearchText("");
    setShowTestDropdown(false);
  };

  const removeDiagnosticTest = (idx: number) => {
    if (!selectedConsultation) return;
    const current = Array.isArray(selectedConsultation.diagnosticTests)
      ? selectedConsultation.diagnosticTests
      : [];
    setSelectedConsultation({
      ...selectedConsultation,
      diagnosticTests: current.filter((_: string, i: number) => i !== idx),
    });
  };

  const handleSaveModalConsultation = async () => {
    if (!selectedConsultation) return;
    try {
      const updated = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
        attachments: selectedConsultation.attachments || [],
        painLevel: selectedConsultation.painLevel,
        diagnosticTests: selectedConsultation.diagnosticTests || [],
      });
      setSelectedConsultation(updated);
      onSaveSuccess();
      toast.success("Prescription saved successfully!");
      document.getElementById("close-prescription-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to save prescription");
    }
  };

  const printAppointment = useMemo(() => {
    const appt = selectedConsultation?.appointment || appointment || {};
    return {
      ...appt,
      id: appt.id || selectedConsultation?.appointmentId || appointment?.id,
      appointmentCode: appt.appointmentCode || appointment?.appointmentCode,
      scheduledAt: appt.scheduledAt || selectedConsultation?.createdAt || new Date(),
      patient: selectedConsultation?.patient || appt.patient || appointment?.patient,
      doctor: selectedConsultation?.doctor || appt.doctor || appointment?.doctor,
      clinic: appt.clinic || selectedConsultation?.clinic || appointment?.clinic,
      department: appt.department || selectedConsultation?.doctor?.department,
    };
  }, [selectedConsultation, appointment]);

  const printPrescription = useMemo(() => {
    const meds = (selectedConsultation?.medicines || []).map(mapTherapyMedToPad);
    return {
      createdAt: selectedConsultation?.createdAt || new Date(),
      id: selectedConsultation?.id || "draft",
      prescriptionCode:
        selectedConsultation?.consultationCode ||
        selectedConsultation?.prescriptionCode ||
        "",
      medicines: meds,
      advice: selectedConsultation?.advice || "",
      followUpDate: selectedConsultation?.followUpDate || null,
      followUpNotes: selectedConsultation?.followUpNotes || "",
      diagnosticTests: selectedConsultation?.diagnosticTests || [],
      attachments: selectedConsultation?.attachments || [],
      patient: printAppointment?.patient,
      doctor: printAppointment?.doctor,
      clinic: printAppointment?.clinic,
      department: printAppointment?.department,
    };
  }, [selectedConsultation, printAppointment]);

  const waitForPadImages = (pad: HTMLElement) =>
    Promise.all(
      Array.from(pad.querySelectorAll("img")).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            setTimeout(done, 2500);
          })
      )
    );

  const handlePrintPrescription = () => {
    const pad = document.getElementById("therapy-modal-print-prescription-pad");
    if (!pad) return;
    const hideSelectors = [
      "#print-prescription-pad",
      "#print-prescription-slip",
      "#print-appointment",
      "#print-prescription",
      "#modal-print-prescription-pad",
    ];
    const hiddenEls: HTMLElement[] = [];
    hideSelectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (el === pad || pad.contains(el)) return;
        el.setAttribute("data-hidden-for-print", "true");
        el.style.setProperty("display", "none", "important");
        hiddenEls.push(el);
      });
    });
    const originalDisplay = pad.style.display;
    pad.style.display = "block";
    waitForPadImages(pad).then(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            pad.style.display = originalDisplay;
            hiddenEls.forEach((el) => {
              el.removeAttribute("data-hidden-for-print");
              el.style.removeProperty("display");
            });
          }, 1500);
        }, 50);
      });
    });
  };

  const handleDownloadPrescription = () => {
    const element = document.getElementById("therapy-modal-print-prescription-pad");
    if (!element) return;
    const originalDisplay = element.style.display;
    element.style.display = "block";
    const code =
      selectedConsultation?.consultationCode ||
      printAppointment?.appointmentCode ||
      "Record";
    const opt = {
      margin: 0,
      filename: `Prescription-${code}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"] as const },
    };
    waitForPadImages(element)
      .then(() =>
        html2pdf()
          .from(element)
          .set(opt)
          .save()
      )
      .then(() => {
        element.style.display = originalDisplay;
      })
      .catch((err: any) => {
        console.error("Prescription PDF failed:", err);
        toast.error("Failed to download PDF");
        element.style.display = originalDisplay;
      });
  };

  const handleCopyPreviousPrescription = (prevConsult: any, type: "therapy" | "clinic") => {
    if (!selectedConsultation) return;

    let medicinesToCopy: any[] = [];
    let adviceToCopy = prevConsult.advice || "";
    let attachmentsToCopy: any[] = [];

    if (type === "therapy") {
      medicinesToCopy = prevConsult.medicines ? [...prevConsult.medicines] : [];
      attachmentsToCopy = prevConsult.attachments ? [...prevConsult.attachments] : [];
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
      painLevel: prevConsult.painLevel || null,
      diagnosticTests: Array.isArray(prevConsult.diagnosticTests) ? [...prevConsult.diagnosticTests] : [],
      attachments: attachmentsToCopy,
    });
    toast.info("Copied medicines, advice, pain level & images from past prescription.");
  };

  const handleClearPrescription = () => {
    if (!selectedConsultation) return;
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: [],
      advice: "",
      painLevel: null,
      diagnosticTests: [],
      attachments: [],
    });
    toast.info("Cleared prescription inputs.");
  };

  return (
    <>
      {/* ===== PRESCRIPTION SCANS & ATTACHMENTS MODAL ===== */}
      <div className="modal fade prescription-modal-wrapper" id="prescription_modal" tabIndex={-1} aria-hidden="true" ref={modalRef}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content text-dark border-0 shadow-lg overflow-hidden" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12 }}>
            <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
              <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center">
                <i className="ti ti-prescription me-2 fs-20" />
                Generate Prescription
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="close-prescription-modal"></button>
            </div>

            <div className="modal-body bg-light-subtle p-0 d-flex overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
              {selectedConsultation ? (
                <>
                  <div className="prescription-main-content p-3" style={{ flex: 1, overflowY: "auto" }}>
                  {/* Current Visit Header bar */}
                  <div className="mb-3 d-flex align-items-center gap-2">
                    <div className="visit-tab-card p-2 px-3 rounded border active bg-white border-primary shadow-sm">
                      <div className="d-flex align-items-center gap-2">
                        <i className="ti ti-calendar fs-14 text-primary" />
                        <div className="lh-1">
                          <span className="d-block fw-bold fs-12 text-primary">Current Visit</span>
                          <small className="fs-10 text-muted">
                            {selectedConsultation.appointment?.dateTimeLabel || (appointment?.dateTimeLabel || "Today")}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="d-none d-sm-block ms-1">
                      <div className="text-dark fw-bold fs-12">
                        {selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}
                      </div>
                      <small className="text-muted fs-11">
                        {selectedConsultation.appointment?.appointmentCode || appointment?.appointmentCode || "N/A"}
                      </small>
                    </div>
                  </div>

                  <div className="bg-white border rounded-3 shadow-sm p-3 mb-3" style={{ overflow: "visible" }}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="ti ti-pill text-primary fs-18"></i>
                            <h6 className="fw-bold text-dark mb-0 fs-14">Medicines</h6>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
                            onClick={addModalMedicineRow}
                          >
                            <i className="ti ti-plus fs-12" /> Add Medicine
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
                                        <IconFormControl
                                          type="text"
                                          fieldLabel="medicine"
                                          className="form-control-sm"
                                          placeholder="Medicine Name"
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
                                          <option value="0.5 Tablet">0.5 Tablet</option>
                                          <option value="1 Capsule">1 Capsule</option>
                                          <option value="2 Capsules">2 Capsules</option>
                                          <option value="As Directed">As Directed</option>
                                        </select>
                                      </td>
                                      <td className="border-0 py-1">
                                        <select
                                          className="form-select form-select-sm"
                                          value={m.dosage === "1 Tablet" || m.dosage === "2 Tablets" || m.dosage === "1 Spoon" || m.dosage === "0.5 Tablet" || m.dosage === "1 Capsule" || m.dosage === "2 Capsules" || m.dosage === "As Directed" ? (m.dosage || "1-0-1") : m.dosage}
                                          onChange={(e) => updateModalMedicineRow(idx, "dosage", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        >
                                          <option value="1-0-1">1-0-1 (Twice)</option>
                                          <option value="1-1-1">1-1-1 (Thrice)</option>
                                          <option value="1-0-0">1-0-0 (Morning)</option>
                                          <option value="0-1-0">0-1-0 (Afternoon)</option>
                                          <option value="0-0-1">0-0-1 (Night)</option>
                                          <option value="1-1-1-1">1-1-1-1 (Four times)</option>
                                          <option value="SOS">SOS (As needed)</option>
                                          <option value="As Directed">As Directed</option>
                                        </select>
                                      </td>
                                      <td className="border-0 py-1">
                                        <select
                                          className="form-select form-select-sm"
                                          value={m.duration || "5 Days"}
                                          onChange={(e) => updateModalMedicineRow(idx, "duration", e.target.value)}
                                          style={{ borderRadius: 6 }}
                                        >
                                          <option value="3 Days">3 Days</option>
                                          <option value="5 Days">5 Days</option>
                                          <option value="7 Days">7 Days</option>
                                          <option value="10 Days">10 Days</option>
                                          <option value="2 Weeks">2 Weeks</option>
                                          <option value="1 Month">1 Month</option>
                                        </select>
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
                                          className="btn btn-sm btn-link text-danger p-0"
                                          onClick={() => removeModalMedicineRow(idx)}
                                        >
                                          <i className="ti ti-trash fs-5" />
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

                      {/* Pain Level Scale (1 to 10) — common theme */}
                      <div
                        className="mb-4 p-3 p-md-4"
                        style={{
                          borderRadius: 12,
                          background: "#fff",
                          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                          border: "none",
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "#eff6ff",
                                color: "#2563eb",
                              }}
                            >
                              <i className="ti ti-activity-heartbeat" style={{ fontSize: 18 }} />
                            </span>
                            <div>
                              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: 14 }}>
                                Pain Scale
                              </h6>
                              <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                                How much pain is left? Rate from 1 (mild) to 10 (severe)
                              </p>
                            </div>
                          </div>
                          {selectedConsultation.painLevel ? (
                            <span
                              className="badge fw-semibold px-3 py-2"
                              style={{
                                fontSize: 12,
                                borderRadius: 8,
                                background:
                                  selectedConsultation.painLevel <= 3
                                    ? "#ecfdf5"
                                    : selectedConsultation.painLevel <= 7
                                    ? "#fffbeb"
                                    : "#fef2f2",
                                color:
                                  selectedConsultation.painLevel <= 3
                                    ? "#047857"
                                    : selectedConsultation.painLevel <= 7
                                    ? "#b45309"
                                    : "#b91c1c",
                                border: `1px solid ${
                                  selectedConsultation.painLevel <= 3
                                    ? "#6ee7b7"
                                    : selectedConsultation.painLevel <= 7
                                    ? "#fcd34d"
                                    : "#fca5a5"
                                }`,
                              }}
                            >
                              Selected: {selectedConsultation.painLevel} / 10
                            </span>
                          ) : (
                            <span
                              className="badge fw-semibold px-3 py-2"
                              style={{
                                fontSize: 12,
                                borderRadius: 8,
                                background: "#f1f5f9",
                                color: "#64748b",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              Not rated
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-1 gap-md-2 flex-wrap">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isSelected = selectedConsultation.painLevel === num;
                            const tone =
                              num <= 3 ? "mild" : num <= 7 ? "moderate" : "severe";
                            const palette = {
                              mild: { bg: "#10b981", border: "#059669", soft: "#ecfdf5", text: "#047857" },
                              moderate: { bg: "#f59e0b", border: "#d97706", soft: "#fffbeb", text: "#b45309" },
                              severe: { bg: "#ef4444", border: "#dc2626", soft: "#fef2f2", text: "#b91c1c" },
                            }[tone];

                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => updateModalPainLevel(num)}
                                className="flex-fill d-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  minWidth: 36,
                                  height: 40,
                                  borderRadius: 10,
                                  fontSize: 14,
                                  transition: "all 0.15s ease",
                                  border: `1.5px solid ${isSelected ? palette.border : "#e2e8f0"}`,
                                  background: isSelected ? palette.bg : "#fff",
                                  color: isSelected ? "#fff" : "#334155",
                                  boxShadow: isSelected
                                    ? "0 4px 12px rgba(15, 23, 42, 0.15)"
                                    : "none",
                                  transform: isSelected ? "translateY(-1px)" : "none",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = palette.soft;
                                    e.currentTarget.style.borderColor = palette.border;
                                    e.currentTarget.style.color = palette.text;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = "#fff";
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.color = "#334155";
                                  }
                                }}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>

                        <div className="d-flex flex-wrap gap-2 gap-md-3 mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                          <span
                            className="d-inline-flex align-items-center gap-1 px-2 py-1"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#047857",
                              background: "#ecfdf5",
                              borderRadius: 999,
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            <i className="ti ti-circle-check" /> 1–3 Mild
                          </span>
                          <span
                            className="d-inline-flex align-items-center gap-1 px-2 py-1"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#b45309",
                              background: "#fffbeb",
                              borderRadius: 999,
                              border: "1px solid #fde68a",
                            }}
                          >
                            <i className="ti ti-alert-triangle" /> 4–7 Moderate
                          </span>
                          <span
                            className="d-inline-flex align-items-center gap-1 px-2 py-1"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#b91c1c",
                              background: "#fef2f2",
                              borderRadius: 999,
                              border: "1px solid #fecaca",
                            }}
                          >
                            <i className="ti ti-bolt" /> 8–10 Severe
                          </span>
                        </div>
                      </div>

                      {/* Advice and Diagnostic Tests Row */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                            <i className="ti ti-message-report text-primary"></i> Advice
                          </h6>
                          <IconTextarea
                            fieldLabel="notes"
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

                          <div className="position-relative mb-2" style={{ zIndex: 5 }}>
                            <div
                              className="d-flex align-items-center gap-2 bg-white px-2 py-1"
                              style={{
                                border: "1px solid #d8dbe5",
                                borderRadius: 10,
                                minHeight: 36,
                              }}
                            >
                              <i className="ti ti-search text-muted fs-14 flex-shrink-0" />
                              <input
                                type="text"
                                className="form-control form-control-sm text-dark fw-semibold border-0 shadow-none p-0"
                                placeholder="Search/Add Diagnostic Test..."
                                value={testSearchText}
                                onChange={(e) => {
                                  setTestSearchText(e.target.value);
                                  setShowTestDropdown(true);
                                }}
                                onFocus={() => setShowTestDropdown(true)}
                                onBlur={() => setTimeout(() => setShowTestDropdown(false), 250)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addDiagnosticTest(testSearchText);
                                  }
                                }}
                                style={{ boxShadow: "none", outline: "none", background: "transparent" }}
                              />
                              {testSearchText && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-muted p-0 border-0 flex-shrink-0"
                                  onClick={() => setTestSearchText("")}
                                >
                                  <i className="ti ti-x fs-13" />
                                </button>
                              )}
                            </div>

                            {showTestDropdown && (
                              <div
                                className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                                style={{
                                  zIndex: 1000,
                                  maxHeight: 180,
                                  overflowY: "auto",
                                  top: "100%",
                                  left: 0,
                                }}
                              >
                                {labTests
                                  .filter((t: any) =>
                                    t.name.toLowerCase().includes(testSearchText.toLowerCase())
                                  )
                                  .map((t: any) => (
                                    <div
                                      key={t.id}
                                      className="px-3 py-2 d-flex align-items-center justify-content-between text-dark"
                                      style={{ cursor: "pointer", borderBottom: "1px solid #f8fafc", fontSize: 13 }}
                                      onMouseDown={() => addDiagnosticTest(t.name)}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#f1f5f9";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#fff";
                                      }}
                                    >
                                      <span className="fw-bold">{t.name}</span>
                                      {t.testCode && (
                                        <span className="badge bg-light text-muted" style={{ fontSize: 10 }}>
                                          {t.testCode}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                {testSearchText.trim() &&
                                  !labTests.some(
                                    (t: any) =>
                                      t.name.toLowerCase() === testSearchText.toLowerCase().trim()
                                  ) && (
                                    <div
                                      className="px-3 py-2 text-primary fw-bold text-center border-top"
                                      style={{ cursor: "pointer", fontSize: 13 }}
                                      onMouseDown={() => addDiagnosticTest(testSearchText)}
                                    >
                                      <i className="ti ti-plus me-1" /> Add Custom: &quot;
                                      {testSearchText.trim()}&quot;
                                    </div>
                                  )}
                                {labTests.length === 0 && !testSearchText.trim() && (
                                  <div className="px-3 py-2 text-muted text-center" style={{ fontSize: 12 }}>
                                    No lab tests found. Type to add a custom test.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div
                            className="border rounded-3 p-2 bg-light d-flex flex-wrap gap-2 align-content-start"
                            style={{ minHeight: 72 }}
                          >
                            {diagnosticTestsList.length > 0 ? (
                              diagnosticTestsList.map((testName: string, idx: number) => (
                                <span
                                  key={`${testName}-${idx}`}
                                  className="badge bg-soft-primary text-primary px-2 py-2 rounded-3 fw-bold d-inline-flex align-items-center gap-1"
                                  style={{ fontSize: 12 }}
                                >
                                  {testName}
                                  <button
                                    type="button"
                                    className="btn-close p-0 border-0 ms-1"
                                    style={{ fontSize: 8, width: 10, height: 10 }}
                                    onClick={() => removeDiagnosticTest(idx)}
                                    aria-label={`Remove ${testName}`}
                                  />
                                </span>
                              ))
                            ) : (
                              <div className="text-center w-100 my-auto text-muted" style={{ fontSize: 12 }}>
                                No diagnostic tests prescribed.
                              </div>
                            )}
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
                                  <IconFormControl
                                    type="text"
                                    fieldLabel="notes"
                                    className="form-control-sm"
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

                  <div
                    className="prescription-sidebar bg-white border-start p-3"
                    style={{ width: 250, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}
                  >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-history text-primary fs-18"></i>
                        <h6 className="fw-bold text-dark mb-0 fs-14">Previous Prescriptions</h6>
                      </div>

                      <div className="alert bg-warning-subtle border-0 rounded-3 mb-3 p-2 d-flex align-items-start gap-2 text-warning-emphasis fs-12">
                        <i className="ti ti-bulb fs-15 text-warning" />
                        <span>Click on any visit to copy its prescription and continue.</span>
                      </div>

                      <div className="overflow-auto pr-1" style={{ flex: 1 }}>
                        {/* Therapy consultations list */}
                        {previousConsultations.length > 0 && (
                          <div className="mb-3">
                            <div className="text-muted fw-bold small uppercase mb-2" style={{ fontSize: 10 }}>Therapy Visits</div>
                            {previousConsultations.map((pc: any) => (
                              <div
                                key={pc.id}
                                className="card border rounded-3 p-3 mb-2 hover-shadow bg-light-subtle"
                                onClick={() => handleCopyPreviousPrescription(pc, "therapy")}
                                style={{ cursor: "pointer" }}
                                title="Click to copy prescription"
                              >
                                <div className="fw-bold text-dark small d-flex justify-content-between mb-1">
                                  <span>{pc.consultationCode || "Therapy Plan"}</span>
                                  <i className="ti ti-copy text-primary" />
                                </div>
                                <div className="text-muted fs-11 mb-2">
                                  {pc.appointment?.scheduledAt ? new Date(pc.appointment.scheduledAt).toLocaleDateString() : new Date(pc.createdAt).toLocaleDateString()}
                                </div>
                                <span className="badge bg-soft-primary text-primary px-2 rounded fs-10 fw-bold">
                                  {pc.medicines?.length || 0} Medicines
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Clinic prescriptions list */}
                        {previousClinicPrescriptions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-muted fw-bold small uppercase mb-2" style={{ fontSize: 10 }}>Clinic Visits</div>
                            {previousClinicPrescriptions.map((cp: any) => (
                              <div
                                key={cp.id}
                                className="card border rounded-3 p-3 mb-2 hover-shadow bg-light-subtle"
                                onClick={() => handleCopyPreviousPrescription(cp, "clinic")}
                                style={{ cursor: "pointer" }}
                                title="Click to copy prescription"
                              >
                                <div className="fw-bold text-dark small d-flex justify-content-between mb-1">
                                  <span>{cp.prescriptionCode || "Prescription"}</span>
                                  <i className="ti ti-copy text-primary" />
                                </div>
                                <div className="text-muted fs-11 mb-2">
                                  {cp.appointment?.scheduledAt ? new Date(cp.appointment.scheduledAt).toLocaleDateString() : new Date(cp.createdAt).toLocaleDateString()}
                                </div>
                                <span className="badge bg-soft-primary text-primary px-2 rounded fs-10 fw-bold">
                                  {cp.medicines?.length || 0} Medicines
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {previousConsultations.length === 0 && previousClinicPrescriptions.length === 0 && (
                          <div className="text-center py-5 text-muted">
                            <i className="ti ti-folder-off fs-30 opacity-50 mb-2"></i>
                            <div className="small">No previous prescriptions recorded.</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 fs-13"
                          onClick={handleClearPrescription}
                        >
                          <i className="ti ti-refresh"></i> Clear Prescription
                        </button>
                      </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5 w-100">
                  <span className="spinner-border text-primary"></span>
                  <div className="text-muted mt-2">Initializing prescription record...</div>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light border-top-0 p-3 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-info fw-bold px-3 fs-13 d-flex align-items-center gap-1.5"
                  onClick={handlePrintPrescription}
                  disabled={!selectedConsultation}
                >
                  <i className="ti ti-printer" /> Print
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success fw-bold px-3 fs-13 d-flex align-items-center gap-1.5"
                  onClick={handleDownloadPrescription}
                  disabled={!selectedConsultation}
                >
                  <i className="ti ti-download" /> Download PDF
                </button>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-light fw-bold px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5" onClick={handleSaveModalConsultation}>
                  <i className="ti ti-check fs-15" /> Generate Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="therapy-modal-print-prescription-pad" style={{ display: "none" }}>
        <PrescriptionPadSlip
          appointment={printAppointment}
          prescription={printPrescription}
        />
      </div>
      <style>{`
        .prescription-modal-wrapper .modal-xl { max-width: 1080px; width: 92%; }
        .prescription-modal-wrapper .visit-tab-card {
          min-width: 120px; display: flex; align-items: center;
          background: #f8fafc !important; border: 1px solid #cbd5e1 !important;
          padding: 6px 12px !important; border-radius: 8px !important;
        }
        .prescription-modal-wrapper .visit-tab-card.active {
          background: #fff !important; border: 2px solid #4f46e5 !important;
        }
        .prescription-modal-wrapper .btn-outline-primary { color: #4f46e5 !important; border-color: #4f46e5 !important; }
        .prescription-modal-wrapper .btn-outline-primary:hover { background: #4f46e5 !important; color: #fff !important; }
        .prescription-modal-wrapper .bg-soft-primary {
          background-color: rgba(79,70,229,0.1) !important; color: #4f46e5 !important;
        }
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            height: auto !important; overflow: hidden !important;
            margin: 0 !important; padding: 0 !important;
          }
          html:has(#therapy-modal-print-prescription-pad .rx-slip--with-attachments),
          body:has(#therapy-modal-print-prescription-pad .rx-slip--with-attachments) {
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          #print-prescription-pad,
          #print-prescription-slip,
          #print-appointment,
          #print-prescription,
          #modal-print-prescription-pad,
          [data-hidden-for-print],
          [data-hidden-for-print] * {
            display: none !important; visibility: hidden !important;
          }
          #therapy-modal-print-prescription-pad,
          #therapy-modal-print-prescription-pad * {
            visibility: visible !important;
          }
          #therapy-modal-print-prescription-pad {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 210mm !important; height: auto !important;
            max-height: 297mm !important; min-height: 0 !important;
            background: white !important; z-index: 99999 !important;
            padding: 0 !important; margin: 0 !important;
            overflow: hidden !important; border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #therapy-modal-print-prescription-pad:has(.rx-slip--with-attachments) {
            max-height: none !important;
            overflow: visible !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            page-break-after: auto !important;
          }
        }
      `}</style>
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
    </>
  );
};
