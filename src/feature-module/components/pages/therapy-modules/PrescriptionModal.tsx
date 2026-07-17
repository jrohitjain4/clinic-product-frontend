import React, { useState, useEffect, useMemo, useRef } from "react";
import { apiGet, apiPut, apiPost } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { useMedicines } from "../../../../core/hooks/useMedicines";
import { apiUrl } from "../../../../core/config/api";

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
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [previousConsultations, setPreviousConsultations] = useState<any[]>([]);
  const [previousClinicPrescriptions, setPreviousClinicPrescriptions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSaveModalConsultation = async () => {
    if (!selectedConsultation) return;
    try {
      const updated = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
        attachments: selectedConsultation.attachments || [],
        painLevel: selectedConsultation.painLevel,
      });
      setSelectedConsultation(updated);
      onSaveSuccess();
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
      attachments: [],
    });
    toast.info("Cleared prescription inputs.");
  };

  return (
    <>
      {/* ===== PRESCRIPTION SCANS & ATTACHMENTS MODAL ===== */}
      <div className="modal fade" id="prescription_modal" tabIndex={-1} aria-hidden="true" ref={modalRef}>
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
                          {selectedConsultation.appointment?.dateTimeLabel || 
                           (appointment?.dateTimeLabel || "Today")}
                        </div>
                      </div>
                      <div className="d-none d-sm-block">
                        <div className="text-muted small">Patient: <strong>{selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}</strong></div>
                        <div className="text-muted small">Appointment ID: <strong>{selectedConsultation.appointment?.appointmentCode || appointment?.appointmentCode || "N/A"}</strong></div>
                      </div>
                    </div>
                    <div className="bg-white border rounded px-3 py-2 text-center text-muted small">
                      <i className="ti ti-activity me-1 text-success"></i> Admit Recommendation: <strong>N/A</strong>
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

                      {/* Pain Level Scale (1 to 10) */}
                      <div className="card border-0 mb-4" style={{ borderRadius: 12, backgroundColor: "#fdf8f8", border: "1px solid #fce8e8 !important" }}>
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#d946ef" }}>
                              <i className="ti ti-activity text-danger fs-5"></i> How much pain left? (Pain Scale: 1 to 10)
                            </h6>
                            {selectedConsultation.painLevel ? (
                              <span className={`badge px-3 py-2 fs-13 ${
                                selectedConsultation.painLevel <= 3 ? "bg-success" :
                                selectedConsultation.painLevel <= 7 ? "bg-warning text-dark" : "bg-danger"
                              }`}>
                                Current Pain: <strong>{selectedConsultation.painLevel} / 10</strong>
                              </span>
                            ) : (
                              <span className="badge bg-secondary px-3 py-2 fs-13">Not Rated</span>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-between gap-1 mt-2 flex-wrap flex-md-nowrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                              const isSelected = selectedConsultation.painLevel === num;
                              let btnClass = "btn btn-outline-secondary";
                              if (isSelected) {
                                if (num <= 3) {
                                  btnClass = "btn btn-success text-white border-success";
                                } else if (num <= 7) {
                                  btnClass = "btn btn-warning text-dark border-warning fw-bold";
                                } else {
                                  btnClass = "btn btn-danger text-white border-danger";
                                }
                              }
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  className={`flex-fill py-2 text-center fw-bold ${btnClass}`}
                                  onClick={() => updateModalPainLevel(num)}
                                  style={{
                                    borderRadius: 8,
                                    fontSize: 14,
                                    minWidth: "35px",
                                    transition: "all 0.2s",
                                    ...(isSelected ? { transform: "scale(1.05)", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } : {})
                                  }}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                          <div className="d-flex justify-content-between mt-2 text-muted small px-1" style={{ fontSize: 11 }}>
                            <span className="text-success"><i className="ti ti-circle-check"></i> 1-3 Mild / Recovering</span>
                            <span className="text-warning"><i className="ti ti-alert-triangle"></i> 4-7 Moderate</span>
                            <span className="text-danger"><i className="ti ti-bolt"></i> 8-10 Severe Pain</span>
                          </div>
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
                      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <i className="ti ti-history text-muted"></i> Previous Prescriptions
                        </h6>
                      </div>

                      <div className="overflow-auto pr-1" style={{ maxHeight: 380 }}>
                        {/* Therapy consultations list */}
                        {previousConsultations.length > 0 && (
                          <div className="mb-3">
                            <div className="text-muted fw-bold small uppercase mb-2" style={{ fontSize: 10 }}>Therapy Visits</div>
                            {previousConsultations.map((pc: any) => (
                              <div
                                key={pc.id}
                                className="p-3 border rounded-3 mb-2 bg-light-soft hover-bg-light cursor-pointer shadow-none"
                                onClick={() => handleCopyPreviousPrescription(pc, "therapy")}
                                style={{ cursor: "pointer", transition: "background 0.2s" }}
                                title="Click to copy prescription"
                              >
                                <div className="fw-bold text-primary small d-flex justify-content-between mb-1">
                                  <span>{pc.consultationCode || "Therapy Plan"}</span>
                                  <span className="text-muted">{pc.appointment?.scheduledAt ? new Date(pc.appointment.scheduledAt).toLocaleDateString() : new Date(pc.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-muted fs-11 mb-2 pb-1" style={{ borderBottom: "1px dashed #e2e8f0" }}>
                                  <div><i className="ti ti-calendar me-1"></i>Appt: <strong>{pc.appointment?.appointmentCode || "N/A"}</strong></div>
                                  <div><i className="ti ti-user me-1"></i>Therapist: <strong>{pc.doctor?.fullName || "N/A"}</strong></div>
                                </div>
                                {pc.medicines && pc.medicines.length > 0 && (
                                  <div className="text-secondary small mt-1 fs-11" style={{ lineHeight: "1.4" }}>
                                    <strong>Meds:</strong> {pc.medicines.map((m: any) => `${m.name} (${m.dosage})`).join(", ")}
                                  </div>
                                )}
                                {pc.painLevel !== undefined && pc.painLevel !== null && (
                                  <div className="text-danger small mt-1 fs-11">
                                    <i className="ti ti-activity me-1"></i>Pain Scale: <span className="badge bg-danger-light text-danger">{pc.painLevel} / 10</span>
                                  </div>
                                )}
                                {pc.advice && (
                                  <div className="text-muted small mt-1 fs-11 text-truncate">
                                    <strong>Advice:</strong> {pc.advice}
                                  </div>
                                )}
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
                                className="p-3 border rounded-3 mb-2 bg-light-soft hover-bg-light cursor-pointer shadow-none"
                                onClick={() => handleCopyPreviousPrescription(cp, "clinic")}
                                style={{ cursor: "pointer", transition: "background 0.2s" }}
                                title="Click to copy prescription"
                              >
                                <div className="fw-bold text-success small d-flex justify-content-between mb-1">
                                  <span>{cp.prescriptionCode || "Prescription"}</span>
                                  <span className="text-muted">{cp.appointment?.scheduledAt ? new Date(cp.appointment.scheduledAt).toLocaleDateString() : new Date(cp.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-muted fs-11 mb-2 pb-1" style={{ borderBottom: "1px dashed #e2e8f0" }}>
                                  <div><i className="ti ti-calendar me-1"></i>Appt: <strong>{cp.appointment?.appointmentCode || "N/A"}</strong></div>
                                  <div><i className="ti ti-user me-1"></i>Doctor: <strong>{cp.doctor?.fullName || "N/A"}</strong></div>
                                </div>
                                {cp.medicines && cp.medicines.length > 0 && (
                                  <div className="text-secondary small mt-1 fs-11" style={{ lineHeight: "1.4" }}>
                                    <strong>Meds:</strong> {cp.medicines.map((m: any) => `${m.medicineName || m.name}`).join(", ")}
                                  </div>
                                )}
                                {cp.advice && (
                                  <div className="text-muted small mt-1 fs-11 text-truncate">
                                    <strong>Advice:</strong> {cp.advice}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {previousConsultations.length === 0 && previousClinicPrescriptions.length === 0 && (
                          <div className="text-center py-5 text-muted border rounded-3 bg-light">
                            <i className="ti ti-clipboard-x fs-24 mb-2 d-block text-muted"></i>
                            <div className="small">No previous prescriptions recorded.</div>
                          </div>
                        )}
                      </div>

                      {/* Clear button */}
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100 mt-4 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2"
                        onClick={handleClearPrescription}
                        style={{ borderRadius: 8 }}
                      >
                        <i className="ti ti-reload"></i> Clear Prescription
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <span className="spinner-border text-primary"></span>
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
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal" style={{ borderRadius: 8 }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveModalConsultation} style={{ borderRadius: 8 }}>Generate Prescription</button>
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
    </>
  );
};
