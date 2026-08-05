import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Datatable from "../../../../core/common/dataTable";
import { apiGet, apiDelete, apiPost, apiPut } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import EmptyState from "../../../../core/common/emptyState";
import { apiUrl } from "../../../../core/config/api";
import { useMedicines } from "../../../../core/hooks/useMedicines";
import { useLabTests } from "../../../../core/hooks/useLabTests";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";
import html2pdf from "html2pdf.js";
import PrescriptionPadSlip from "../clinic-modules/appointments/PrescriptionPadSlip";
import AppointmentPrintSlip from "../clinic-modules/appointments/AppointmentPrintSlip";

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

const TherapyAppointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isConsultancy = location.pathname.includes("consultations");
  const { medicines: pharmacyMedicines } = useMedicines();
  const { tests: labTests } = useLabTests();
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [testSearchText, setTestSearchText] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);

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
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [viewAppt, setViewAppt] = useState<any>(null);
  const [slipPrintAppointment, setSlipPrintAppointment] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const handleToggleExpand = (id: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [viewConsultation, setViewConsultation] = useState<any>(null);
  const [previousConsultations, setPreviousConsultations] = useState<any[]>([]);
  const [previousClinicPrescriptions, setPreviousClinicPrescriptions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<any[]>("/api/appointments?appointmentType=therapy");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load therapy appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!slipPrintAppointment) return;

    document.body.classList.add("printing-therapy-appt-slip");
    const pad = document.getElementById("therapy-modal-print-prescription-pad");
    pad?.setAttribute("data-hidden-for-print", "true");

    const handleAfterPrint = () => {
      document.body.classList.remove("printing-therapy-appt-slip");
      pad?.removeAttribute("data-hidden-for-print");
      setSlipPrintAppointment(null);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    const timer = setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-therapy-appt-slip");
      pad?.removeAttribute("data-hidden-for-print");
    };
  }, [slipPrintAppointment]);

  const handlePrintAppointmentSlip = async (raw: any) => {
    const normalizeForSlip = (src: any) => {
      const patient = src.patient || {};
      const doctor = src.doctor || {};
      const nameFromFlat = String(src.patientName || "").trim();
      const nameParts = nameFromFlat ? nameFromFlat.split(/\s+/) : [];
      const baseFee = src.consultationFee ?? doctor.consultationCharge ?? 0;
      const finalFee = src.finalFee ?? src.amount ?? baseFee;
      return {
        ...src,
        appointmentType: src.appointmentType || "Therapy",
        amount: finalFee,
        consultationFee: baseFee,
        finalFee,
        paymentMode: src.paymentMethod || src.paymentMode || "—",
        paymentMethod: src.paymentMethod || src.paymentMode || "—",
        paymentStatus: src.paymentStatus || "Unpaid",
        patient: {
          ...patient,
          firstName: patient.firstName || nameParts[0] || "",
          lastName: patient.lastName || nameParts.slice(1).join(" ") || "",
          phone: patient.phone || src.patientPhone || "",
          email: patient.email || src.patientEmail || "",
        },
        doctor: {
          ...doctor,
          fullName: doctor.fullName || src.doctorName || "",
          consultationCharge: doctor.consultationCharge ?? baseFee,
          phone: doctor.phone || src.doctorPhone || "",
          email: doctor.email || src.doctorEmail || "",
        },
      };
    };

    try {
      const full = await apiGet<any>(`/api/appointments/${raw.id}`);
      setSlipPrintAppointment(normalizeForSlip({ ...raw, ...(full || {}) }));
    } catch {
      setSlipPrintAppointment(normalizeForSlip(raw));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/appointments/${id}`);
      toast.success("Appointment cancelled successfully");
      fetchAppointments();
      document.getElementById("close-delete-appt-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel appointment");
    }
  };

  const handleStatusToggle = async (appointmentId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "Schedule") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Checked In";
    else if (currentStatus === "Checked In") nextStatus = "Checked Out";

    if (nextStatus) {
      setTogglingId(appointmentId);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/appointments/${appointmentId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to update status");
        }
        toast.success(`Appointment marked as ${nextStatus}`);
        fetchAppointments();
      } catch (err: any) {
        console.error("Error updating status:", err);
        toast.error(err.message || "Failed to update status");
      } finally {
        setTogglingId(null);
      }
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
      fetchAppointments();
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      toast.error(err.message || "Failed to update payment status");
    }
  };

  const handleOpenPrescriptionModal = async (raw: any) => {
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
        await fetchAppointments();
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
      toast.error(err.message || "Failed to load/create consultation");
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
    currentMeds.push({
      name: "",
      dosage: "1 Tablet",
      frequency: "1-0-1",
      duration: "5 Days",
      instructions: "After Food",
    });
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

  const printAppointment = useMemo(() => {
    const appt = selectedConsultation?.appointment || {};
    return {
      ...appt,
      id: appt.id || selectedConsultation?.appointmentId,
      appointmentCode: appt.appointmentCode,
      scheduledAt: appt.scheduledAt || selectedConsultation?.createdAt || new Date(),
      patient: selectedConsultation?.patient || appt.patient,
      doctor: selectedConsultation?.doctor || appt.doctor,
      clinic: appt.clinic || selectedConsultation?.clinic,
      department: appt.department || selectedConsultation?.doctor?.department,
    };
  }, [selectedConsultation]);

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

  const handleSaveModalConsultation = async () => {
    if (!selectedConsultation) return;
    try {
      const updated = await apiPut<any>(`/api/consultations/${selectedConsultation.id}`, {
        medicines: selectedConsultation.medicines || [],
        advice: selectedConsultation.advice || "",
        attachments: selectedConsultation.attachments || [],
        diagnosticTests: selectedConsultation.diagnosticTests || [],
      });
      setSelectedConsultation(updated);
      await fetchAppointments();
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
        dosage: m.dosage || "1 Tablet",
        frequency: m.frequency || "1-0-1",
        duration: m.duration || "5 Days",
        instructions: m.timings || "After Food",
      }));
    }

    setSelectedConsultation({
      ...selectedConsultation,
      medicines: medicinesToCopy,
      advice: adviceToCopy,
      diagnosticTests: Array.isArray(prevConsult.diagnosticTests) ? [...prevConsult.diagnosticTests] : [],
      attachments: attachmentsToCopy,
    });
    toast.info("Copied medicines, advice & images from past prescription.");
  };

  const handleClearPrescription = () => {
    if (!selectedConsultation) return;
    setSelectedConsultation({
      ...selectedConsultation,
      medicines: [],
      advice: "",
      diagnosticTests: [],
      attachments: [],
    });
    toast.info("Cleared prescription inputs.");
  };

  const statusMeta = (status: string) => {
    if (status === "Checked Out")
      return { cls: "ta-badge ta-badge-info", icon: "ti ti-circle-check", label: status };
    if (status === "Checked In")
      return { cls: "ta-badge ta-badge-warning", icon: "ti ti-login", label: status };
    if (status === "Cancelled")
      return { cls: "ta-badge ta-badge-danger", icon: "ti ti-ban", label: status };
    if (status === "Schedule")
      return { cls: "ta-badge ta-badge-primary", icon: "ti ti-calendar-event", label: status };
    if (status === "Confirmed")
      return { cls: "ta-badge ta-badge-success", icon: "ti ti-rosette-discount-check", label: status };
    return { cls: "ta-badge ta-badge-muted", icon: "ti ti-point", label: status || "—" };
  };

  const statusBadgeClass = (status: string) => statusMeta(status).cls;

  const paymentMeta = (status: string) => {
    const isPaid = status === "Paid";
    const isPartial = status === "Partial Paid" || status === "Partially Paid";
    if (isPaid) return { cls: "ta-badge ta-badge-success", icon: "ti ti-cash", label: status };
    if (isPartial) return { cls: "ta-badge ta-badge-warning", icon: "ti ti-coins", label: status };
    return { cls: "ta-badge ta-badge-danger", icon: "ti ti-alert-circle", label: status || "Unpaid" };
  };

  const expandedRowRender = (record: any) => {
    const children = appointments.filter((a: any) => a.parentAppointmentId === record.id);
    const sortedChildren = [...children].sort((a: any, b: any) => {
      if (a.sessionNumber && b.sessionNumber) return a.sessionNumber - b.sessionNumber;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    if (sortedChildren.length === 0) {
      return <div className="p-3 text-muted text-center fs-12">No connected sessions found.</div>;
    }

    return (
      <div className="ta-expand p-3">
        <h6 className="fw-bold mb-3 text-dark fs-13 d-flex align-items-center gap-2">
          <span className="ta-mini-icon"><i className="ti ti-link" /></span>
          Connected Sessions / Slots
          <span className="ta-badge ta-badge-muted ms-1">{sortedChildren.length} sessions</span>
        </h6>
        <div className="table-responsive bg-white rounded-3 border overflow-hidden">
          <table className="table table-sm align-middle mb-0 ta-child-table">
            <thead>
              <tr>
                <th className="py-2 px-3 border-0" style={{ width: 90 }}>Session</th>
                <th className="py-2 px-3 border-0">Appointment ID</th>
                <th className="py-2 px-3 border-0">Date & Time</th>
                <th className="py-2 px-3 border-0">Therapist</th>
                <th className="py-2 px-3 border-0">Mode</th>
                <th className="py-2 px-3 border-0">Fee</th>
                <th className="py-2 px-3 border-0">Status</th>
                <th className="py-2 px-3 border-0 text-end" style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedChildren.map((child: any) => {
                const pay = paymentMeta(child.paymentStatus || "Unpaid");
                const st = statusMeta(child.status);
                return (
                  <tr key={child.id}>
                    <td className="py-2 px-3 border-0">
                      <span className="ta-session-chip">Session {child.sessionNumber || "—"}</span>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <span className="ta-code">{child.appointmentCode}</span>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <div className="ta-meta-line">
                        <i className="ti ti-calendar-event" />
                        <span>
                          {child.dateTimeLabel || new Date(child.scheduledAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <div className="ta-meta-line text-secondary">
                        <i className="ti ti-user" />
                        <span>{child.doctorName || child.doctor?.fullName || "—"}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <span className="ta-mode-chip">
                        <i className={`ti ${child.mode === "Online" ? "ti-video" : "ti-building"}`} />
                        {child.mode}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <div className="d-flex flex-column align-items-start gap-1">
                        <span className="fw-bold text-dark">₹{child.finalFee || child.consultationFee || 0}</span>
                        <span className={pay.cls}><i className={pay.icon} />{pay.label}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className={st.cls}><i className={st.icon} />{st.label}</span>
                        {["Schedule", "Confirmed", "Checked In"].includes(child.status) && (
                          <div className="form-check form-switch p-0 mb-0" style={{ minHeight: "auto" }}>
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                              checked={togglingId === child.id}
                              onChange={() => handleStatusToggle(child.id, child.status)}
                              style={{ cursor: "pointer", width: "28px", height: "15px" }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-0 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="ta-action-btn primary"
                          title="Print Appointment Slip"
                          onClick={() => handlePrintAppointmentSlip(child)}
                        >
                          <i className="ti ti-printer" />
                        </button>
                        <button
                          type="button"
                          className="ta-action-btn info"
                          title="View Details"
                          data-bs-toggle="modal"
                          data-bs-target="#view_therapy_appt"
                          onClick={async () => {
                            setViewAppt(child);
                            setViewConsultation(null);
                            if (child.consultation) {
                              try {
                                const consult = await apiGet<any>(`/api/consultations/${child.consultation.id}`);
                                setViewConsultation(consult);
                              } catch (err) {
                                console.error("Failed to load consultation details for view:", err);
                              }
                            }
                          }}
                        >
                          <i className="ti ti-eye" />
                        </button>
                        <button
                          type="button"
                          className="ta-action-btn danger"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_therapy_appt"
                          onClick={() => setSelectedAppt(child)}
                          title="Cancel Appointment"
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const data = useMemo(() => {
    // Only show top-level (parent) appointments in the main list
    const parents = appointments.filter((a: any) => !a.parentAppointmentId);
    return parents.map((a, index) => ({
      key: a.id,
      id: a.id,
      sr_no: index + 1,
      code: a.appointmentCode || "N/A",
      patientName: a.patientName || "N/A",
      therapist: a.doctorName || "N/A",
      date: a.dateTimeLabel || "N/A",
      mode: a.mode || "Offline",
      fee: a.finalFee || a.consultationFee || 0,
      status: a.status || "Schedule",
      raw: a,
    }));
  }, [appointments]);

  const columns = [
    {
      title: "Sr No.",
      dataIndex: "sr_no",
      render: (text: number) => (
        <span className="ta-sr">{text}</span>
      ),
      sorter: (a: any, b: any) => a.sr_no - b.sr_no,
      width: 90,
      className: "ta-col-sr",
    },
    {
      title: "Appointment ID",
      dataIndex: "code",
      render: (text: string) => <span className="ta-code">{text}</span>,
      sorter: (a: any, b: any) => a.code.localeCompare(b.code),
      width: 150,
      className: "ta-col-code",
    },
    {
      title: "Patient Name",
      dataIndex: "patientName",
      render: (text: string) => (
        <div className="d-flex align-items-center gap-2">
          <span className="ta-avatar">{(text || "?").charAt(0).toUpperCase()}</span>
          <span className="fw-semibold text-dark">{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.patientName.localeCompare(b.patientName),
    },
    {
      title: "Therapist",
      dataIndex: "therapist",
      render: (text: string) => (
        <div className="ta-meta-line text-secondary">
          <i className="ti ti-stethoscope" />
          <span className="fw-medium">{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.therapist.localeCompare(b.therapist),
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      render: (text: string) => (
        <div className="ta-meta-line text-dark">
          <i className="ti ti-calendar-event" />
          <span className="fs-13">{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.date.localeCompare(b.date),
    },
    {
      title: "Invoice Details",
      dataIndex: "invoiceDetails",
      render: (_: any, record: any) => {
        const appt = record.raw;
        const c = appt.consultation;
        const inv = c?.invoice;
        if (!c) {
          return <span className="text-muted fs-12">—</span>;
        }
        
        // Use consultation-level amounts as primary (they're always up to date)
        // Fall back to invoice amounts only if consultation amounts are missing
        const total = c.finalTotalAmount || inv?.totalAmount || 0;
        const paid = c.amountPaid || inv?.amountPaid || 0;
        const remaining = Math.max(0, total - paid);
        const status = c.paymentStatus || inv?.paymentStatus || "Unpaid";
        const invoiceCode = inv?.invoiceCode || "";
        const pay = paymentMeta(status);
        
        return (
          <div className="ta-invoice-cell d-flex flex-column align-items-start gap-1">
            {invoiceCode && <span className="ta-invoice-code">{invoiceCode}</span>}
            {(total > 0 || remaining > 0) && (
              <div className="ta-amount-stack">
                {total > 0 && (
                  <span>Total <strong>₹{total.toLocaleString()}</strong></span>
                )}
                {remaining > 0 && (
                  <span className="due">Due <strong>₹{remaining.toLocaleString()}</strong></span>
                )}
              </div>
            )}
            <span className={pay.cls}><i className={pay.icon} />{pay.label}</span>
          </div>
        );
      },
    },
    {
      title: "Fee Paid",
      dataIndex: "fee",
      render: (text: number, record: any) => {
        const raw = record.raw;
        const hasConsult = !!raw.consultation;
        const status = hasConsult ? "Paid" : (raw.paymentStatus || "Unpaid");
        const isPaid = status === "Paid";
        const pay = paymentMeta(status);
        return (
          <div className="d-flex flex-column align-items-start gap-1" style={{ minWidth: 110 }}>
            <span className="ta-fee">₹{Number(text).toLocaleString()}</span>
            <span className={pay.cls}><i className={pay.icon} />{pay.label}</span>
            {!isPaid && (
              <button
                type="button"
                className="ta-mark-paid"
                onClick={() => handleMarkPaymentPaid(raw.id)}
              >
                <i className="ti ti-check" /> Mark Paid
              </button>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.fee - b.fee,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string, record: any) => {
        const raw = record.raw;
        const st = statusMeta(text);
        return (
          <div className="d-flex flex-column align-items-start gap-2">
            <span className={st.cls}><i className={st.icon} />{st.label}</span>
            {["Schedule", "Confirmed", "Checked In"].includes(text) && (
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch p-0 mb-0" style={{ minHeight: "auto" }}>
                  <input
                    className="form-check-input ms-0"
                    type="checkbox"
                    role="switch"
                    checked={togglingId === raw.id}
                    onChange={() => handleStatusToggle(raw.id, text)}
                    style={{ cursor: "pointer", width: "32px", height: "17px" }}
                  />
                </div>
                <span className="ta-status-hint">
                  {text === "Schedule" ? "Confirm" : text === "Confirmed" ? "Check-in" : "Check-out"}
                </span>
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_text: string, record: any) => {
        const raw = record.raw;
        const isChildAppt = !!raw.parentAppointmentId;
        const children = appointments.filter((a: any) => a.parentAppointmentId === raw.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedRowKeys.includes(raw.id);

        return (
          <div className="d-flex align-items-center justify-content-center gap-1">
            {hasChildren && (
              <button
                type="button"
                className={`ta-action-btn ${isExpanded ? "primary" : "muted"}`}
                title={isExpanded ? "Hide Connected Sessions" : "Show Connected Sessions"}
                onClick={() => handleToggleExpand(raw.id)}
              >
                <i className={`ti ${isExpanded ? "ti-chevron-up" : "ti-chevron-down"}`} />
              </button>
            )}

            {!isChildAppt && (
              <button
                type="button"
                className="ta-action-btn primary"
                title="Print Appointment Slip"
                onClick={() => handlePrintAppointmentSlip(raw)}
              >
                <i className="ti ti-printer" />
              </button>
            )}

            <button
              type="button"
              className="ta-action-btn info"
              title="View Details"
              onClick={async () => {
                if (isConsultancy) {
                  // In consultancy mode: navigate directly to consultation form
                  if (record.raw.consultation?.id) {
                    navigate(`/therapy-consultations/${record.raw.consultation.id}`);
                  } else {
                    navigate(`/therapy-consultations/create?appointmentId=${record.raw.id}`);
                  }
                } else {
                  // In appointments mode: open the view modal
                  setViewAppt(record.raw);
                  setViewConsultation(null);
                  if (record.raw.consultation) {
                    try {
                      const consult = await apiGet<any>(`/api/consultations/${record.raw.consultation.id}`);
                      setViewConsultation(consult);
                    } catch (err) {
                      console.error("Failed to load consultation details for view:", err);
                    }
                  }
                  // open modal
                  const modalEl = document.getElementById("view_therapy_appt");
                  if (modalEl) {
                    const bootstrap = (window as any).bootstrap;
                    if (bootstrap && bootstrap.Modal) {
                      new bootstrap.Modal(modalEl).show();
                    }
                  }
                }
              }}
            >
              <i className="ti ti-eye" />
            </button>
            <button
              type="button"
              className="ta-action-btn danger"
              data-bs-toggle="modal"
              data-bs-target="#delete_therapy_appt"
              onClick={() => setSelectedAppt(record.raw)}
              title="Cancel Appointment"
            >
              <i className="ti ti-trash" />
            </button>
          </div>
        );
      },
      width: 140,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content therapy-appt-page">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center flex-wrap gap-2">
                {isConsultancy ? "Therapy Consultancy" : "Therapy Appointments"}
                <span className="ta-badge ta-badge-primary">
                  <i className="ti ti-calendar-check" />
                  {isConsultancy ? "Total Consultations" : "Total Bookings"}: {loading ? "" : data.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/book-therapy-appointment"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{
                  height: 48,
                  minHeight: 48,
                  maxHeight: 48,
                  padding: "0 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  lineHeight: 1,
                }}
              >
                <i className="ti ti-plus" /> Book Appointment
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={fetchAppointments}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : data.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No therapy appointments yet"
                message="Book a therapy appointment or session sequence to schedule a therapist."
                action={
                  <Link
                    to="/book-therapy-appointment"
                    className="btn btn-primary d-flex align-items-center gap-2"
                  >
                    <i className="ti ti-plus" /> Book Appointment
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="table-responsive ta-table-wrap">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                expandable={{
                  expandedRowRender,
                  rowExpandable: (record: any) => {
                    const children = appointments.filter((a: any) => a.parentAppointmentId === record.id);
                    return children.length > 0;
                  },
                  expandedRowKeys,
                  onExpandedRowsChange: (keys: any[]) => {
                    setExpandedRowKeys(keys as string[]);
                  },
                  showExpandColumn: false,
                }}
              />
            </div>
          )}

          <style>{`
            .ta-badge {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              border-radius: 999px;
              padding: 5px 10px;
              font-size: 11px;
              font-weight: 600;
              line-height: 1.2;
              border: 1px solid transparent;
              white-space: nowrap;
              flex-shrink: 0;
            }
            .ta-badge i { font-size: 13px; }
            .ta-badge-primary {
              background: rgba(79, 70, 229, 0.1);
              color: #4f46e5;
              border-color: rgba(79, 70, 229, 0.25);
            }
            .ta-badge-success {
              background: rgba(25, 135, 84, 0.1);
              color: #198754;
              border-color: rgba(25, 135, 84, 0.28);
            }
            .ta-badge-warning {
              background: rgba(245, 158, 11, 0.12);
              color: #b45309;
              border-color: rgba(245, 158, 11, 0.3);
            }
            .ta-badge-danger {
              background: rgba(220, 53, 69, 0.1);
              color: #dc3545;
              border-color: rgba(220, 53, 69, 0.28);
            }
            .ta-badge-info {
              background: rgba(13, 202, 240, 0.12);
              color: #0aa2c0;
              border-color: rgba(13, 202, 240, 0.3);
            }
            .ta-badge-muted {
              background: #f1f5f9;
              color: #64748b;
              border-color: #e2e8f0;
            }
            .therapy-appt-page .ta-table-wrap {
              background: #fff;
              border: 1px solid #e8edf3;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
            }
            .therapy-appt-page .ta-table-wrap .ant-table-thead > tr > th {
              white-space: nowrap !important;
            }
            .therapy-appt-page .ta-table-wrap .ant-table-thead > tr > th .ant-table-column-title {
              white-space: nowrap !important;
            }
            .therapy-appt-page .ta-table-wrap .ant-table-thead > tr > th.ta-col-sr,
            .therapy-appt-page .ta-table-wrap .ant-table-tbody > tr > td.ta-col-sr {
              width: 90px;
              min-width: 90px;
              max-width: 90px;
            }
            .therapy-appt-page .ta-table-wrap .ant-table-thead > tr > th.ta-col-code,
            .therapy-appt-page .ta-table-wrap .ant-table-tbody > tr > td.ta-col-code {
              width: 150px;
              min-width: 150px;
            }
            .therapy-appt-page .ta-table-wrap .ant-table-tbody > tr > td {
              border-bottom: 1px solid #f1f5f9 !important;
              vertical-align: middle;
              padding-top: 14px !important;
              padding-bottom: 14px !important;
            }
            .therapy-appt-page .ta-table-wrap .ant-table-tbody > tr:hover > td {
              background: #fafbff !important;
            }
            .therapy-appt-page .ta-sr {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 28px;
              height: 28px;
              border-radius: 8px;
              background: #f1f5f9;
              color: #475569;
              font-size: 12px;
              font-weight: 700;
            }
            .therapy-appt-page .ta-code {
              display: inline-flex;
              color: #4f46e5;
              font-weight: 700;
              font-size: 13px;
              background: rgba(79, 70, 229, 0.06);
              border: 1px solid rgba(79, 70, 229, 0.14);
              border-radius: 8px;
              padding: 4px 8px;
              white-space: nowrap;
            }
            .therapy-appt-page .ta-invoice-code {
              display: inline-block;
              color: #4f46e5;
              font-weight: 700;
              font-size: 10px;
              line-height: 1.2;
              background: rgba(79, 70, 229, 0.06);
              border: 1px solid rgba(79, 70, 229, 0.14);
              border-radius: 6px;
              padding: 3px 6px;
              white-space: nowrap;
              max-width: 100%;
            }
            .therapy-appt-page .ta-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 700;
              flex-shrink: 0;
            }
            .therapy-appt-page .ta-meta-line {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;
            }
            .therapy-appt-page .ta-meta-line i {
              color: #94a3b8;
              font-size: 15px;
            }
            .therapy-appt-page .ta-amount-stack {
              display: flex;
              flex-direction: column;
              gap: 2px;
              font-size: 11px;
              color: #64748b;
            }
            .therapy-appt-page .ta-amount-stack .due {
              color: #dc3545;
            }
            .therapy-appt-page .ta-fee {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .therapy-appt-page .ta-mark-paid {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              border: 1px solid rgba(25, 135, 84, 0.35);
              background: rgba(25, 135, 84, 0.08);
              color: #198754;
              border-radius: 999px;
              padding: 3px 10px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.02em;
              white-space: nowrap;
              flex-shrink: 0;
            }
            .therapy-appt-page .ta-mark-paid:hover {
              background: rgba(25, 135, 84, 0.14);
            }
            .therapy-appt-page .ta-status-hint {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .therapy-appt-page .ta-action-btn {
              width: 32px;
              height: 32px;
              border-radius: 9px;
              border: 1px solid #e2e8f0;
              background: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: #64748b;
              transition: all 0.15s ease;
            }
            .therapy-appt-page .ta-action-btn i { font-size: 15px; }
            .therapy-appt-page .ta-action-btn:hover { transform: translateY(-1px); }
            .therapy-appt-page .ta-action-btn.primary { color: #4f46e5; background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.2); }
            .therapy-appt-page .ta-action-btn.success { color: #198754; background: rgba(25,135,84,0.08); border-color: rgba(25,135,84,0.22); }
            .therapy-appt-page .ta-action-btn.info { color: #0aa2c0; background: rgba(13,202,240,0.1); border-color: rgba(13,202,240,0.25); }
            .therapy-appt-page .ta-action-btn.danger { color: #dc3545; background: rgba(220,53,69,0.08); border-color: rgba(220,53,69,0.22); }
            .therapy-appt-page .ta-action-btn.muted { color: #94a3b8; }
            .therapy-appt-page .ta-expand {
              background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
              border-top: 1px solid #e8edf3;
            }
            .therapy-appt-page .ta-mini-icon {
              width: 26px;
              height: 26px;
              border-radius: 8px;
              background: rgba(79, 70, 229, 0.1);
              color: #4f46e5;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .therapy-appt-page .ta-child-table thead tr {
              background: #f8fafc;
              color: #64748b;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .therapy-appt-page .ta-child-table tbody tr:hover {
              background: #fafbff;
            }
            .therapy-appt-page .ta-session-chip {
              display: inline-flex;
              align-items: center;
              background: #eef2ff;
              color: #4338ca;
              border-radius: 8px;
              padding: 4px 8px;
              font-size: 11px;
              font-weight: 700;
            }
            .therapy-appt-page .ta-mode-chip {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              color: #334155;
              border-radius: 999px;
              padding: 4px 9px;
              font-size: 11px;
              font-weight: 600;
            }
          `}</style>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025{" "}
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      {/* ===== VIEW DETAILS MODAL ===== */}
      <ViewModal
        id="view_therapy_appt"
        title="Therapy Appointment Details"
        subtitle="Detailed booking information and notification preferences"
        headerIcon={<i className="ti ti-calendar" />}
        highlightTitle={viewAppt ? `Appointment ID: ${viewAppt.appointmentCode}` : "Appointment"}
        highlightStatus={
          <span className={statusBadgeClass(viewAppt?.status || "Schedule")}>
            <i className={statusMeta(viewAppt?.status || "Schedule").icon} />
            {viewAppt?.status || "Schedule"}
          </span>
        }
        highlightColor="#dbeafe"
        details={[
          { icon: <i className="ti ti-user" />, label: "Patient", value: viewAppt?.patientName || "N/A" },
          { icon: <i className="ti ti-id" />, label: "Therapist / Doctor", value: viewAppt?.doctorName || "N/A" },
          { icon: <i className="ti ti-calendar-event" />, label: "Date & Time", value: viewAppt?.dateTimeLabel || "N/A" },
          { icon: <i className="ti ti-map-pin" />, label: "Mode", value: viewAppt?.mode || "N/A" },
          { icon: <i className="ti ti-cash" />, label: "Base Fee", value: `₹${viewAppt?.consultationFee || 0}` },
          { icon: <i className="ti ti-discount" />, label: "Discount Applied", value: viewAppt?.discountAmount ? `₹${viewAppt.discountAmount} (${viewAppt.discountType === "percentage" ? `${viewAppt.discountValue}%` : "Fixed"})` : "None" },
          { icon: <i className="ti ti-wallet" />, label: "Final Fee", value: `₹${viewAppt?.finalFee || viewAppt?.consultationFee || 0}` },
          { icon: <i className="ti ti-credit-card" />, label: "Payment Status", value: viewAppt?.paymentStatus || "Unpaid" },
          { icon: <i className="ti ti-brand-whatsapp" />, label: "WhatsApp Alerts", value: viewAppt?.whatsappNotification ? "Enabled" : "Disabled" }
        ]}
        footerStart={
          viewAppt && !viewAppt.parentAppointmentId ? (
            <button
              type="button"
              className="btn btn-outline-primary fw-medium d-flex align-items-center gap-2"
              onClick={() => {
                const raw = viewAppt;
                const viewEl = document.getElementById("view_therapy_appt");
                const bootstrap = (window as any).bootstrap;
                if (viewEl && bootstrap?.Modal) {
                  const viewInstance = bootstrap.Modal.getInstance(viewEl) || new bootstrap.Modal(viewEl);
                  viewInstance.hide();
                }
                void handleOpenPrescriptionModal(raw);
                setTimeout(() => {
                  const rxEl = document.getElementById("prescription_modal");
                  if (rxEl && bootstrap?.Modal) {
                    const rxInstance = bootstrap.Modal.getInstance(rxEl) || new bootstrap.Modal(rxEl);
                    rxInstance.show();
                  }
                }, 250);
              }}
            >
              <i className="ti ti-prescription" />
              Generate Prescription
            </button>
          ) : null
        }
      >
        {viewAppt?.mode?.toLowerCase() === "online" && viewAppt?.onlineLink && (
          <div className="mt-3 p-3 bg-white rounded-3 view-modal-card">
            <label className="text-muted fs-12 mb-1 text-uppercase fw-semibold d-block">
              Online Meeting Link
            </label>
            <div className="fs-14 text-primary leading-relaxed">
              <a href={viewAppt.onlineLink} target="_blank" rel="noreferrer" className="text-break">
                {viewAppt.onlineLink}
              </a>
            </div>
          </div>
        )}

        {viewAppt?.mode?.toLowerCase().includes("home") && viewAppt?.homeAddress && (
          <div className="mt-3 p-3 bg-white rounded-3 view-modal-card">
            <label className="text-muted fs-12 mb-1 text-uppercase fw-semibold d-block">
              Home Visit Address
            </label>
            <div className="fs-14 text-secondary leading-relaxed">
              {viewAppt.homeAddress}
            </div>
          </div>
        )}

        {viewAppt?.reason && (
          <div className="mt-3 p-3 bg-white rounded-3 view-modal-card">
            <label className="text-muted fs-12 mb-1 text-uppercase fw-semibold d-block">
              Reason / Remarks
            </label>
            <div className="fs-14 text-secondary leading-relaxed">
              {viewAppt.reason}
            </div>
          </div>
        )}

        {viewConsultation && (
          <div className="mt-3 p-3 bg-white rounded-3 view-modal-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                <i className="ti ti-report-medical text-primary fs-18"></i> Examination & Consultation Report
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2"
                style={{ borderRadius: 6, fontSize: 11 }}
                onClick={() => handleCopyPrescriptionText(viewConsultation)}
              >
                <i className="ti ti-copy"></i> Copy Text
              </button>
            </div>

            {/* Examination Notes */}
            {viewConsultation.examinationNotes && (
              <div className="mb-3">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Examination Notes / Diagnosis
                </label>
                <div className="fs-13 text-secondary bg-light p-2 rounded-3 border-start border-primary border-3">
                  {viewConsultation.examinationNotes}
                </div>
              </div>
            )}

            {/* Body pain points */}
            {viewConsultation.bodyPoints && viewConsultation.bodyPoints.length > 0 && (
              <div className="mb-3">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Marked Symptoms / Pain Points
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {viewConsultation.bodyPoints.map((pt: any, idx: number) => (
                    <span key={idx} className="badge bg-light text-dark border p-2 rounded-3 d-flex align-items-center gap-1">
                      <strong className="text-capitalize text-danger">{pt.part}</strong>: {pt.remark} 
                      <span className="badge bg-danger-soft text-danger ms-1">Severity: {pt.severity}/10</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Therapy Plan details */}
            {viewConsultation.therapyPlans && viewConsultation.therapyPlans.length > 0 && (
              <div className="mb-3">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Prescribed Therapies & Sessions
                </label>
                <div className="table-responsive border rounded-3">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: 12 }}>
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="py-2 px-3 border-0">Therapy / Service</th>
                        <th className="py-2 px-3 border-0">Total Sessions</th>
                        <th className="py-2 px-3 border-0 text-end">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewConsultation.therapyPlans.map((plan: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 border-0 fw-semibold">{plan.therapyName || plan.service?.name || "Therapy Service"}</td>
                          <td className="py-2 px-3 border-0">{plan.totalSessions} Sessions</td>
                          <td className="py-2 px-3 border-0 text-end fw-bold">₹{plan.totalPrice || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Medicines List */}
            {viewConsultation.medicines && viewConsultation.medicines.length > 0 && (
              <div className="mb-3">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Prescribed Medicines
                </label>
                <div className="table-responsive border rounded-3">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: 12 }}>
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="py-2 px-3 border-0">Medicine</th>
                        <th className="py-2 px-3 border-0">Dosage</th>
                        <th className="py-2 px-3 border-0">Duration</th>
                        <th className="py-2 px-3 border-0">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewConsultation.medicines.map((med: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 border-0 fw-semibold">{med.name}</td>
                          <td className="py-2 px-3 border-0">{med.dosage}</td>
                          <td className="py-2 px-3 border-0">{med.duration}</td>
                          <td className="py-2 px-3 border-0"><span className="badge bg-primary-soft text-primary">{med.instructions}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Advice */}
            {viewConsultation.advice && (
              <div className="mb-3">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Doctor's Advice
                </label>
                <div className="fs-13 text-secondary bg-light p-2 rounded-3 border">
                  {viewConsultation.advice}
                </div>
              </div>
            )}

            {/* Scan Attachments */}
            {viewConsultation.attachments && viewConsultation.attachments.length > 0 && (
              <div className="mb-2">
                <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
                  Prescription Scans / Reports
                </label>
                <div className="row g-2">
                  {viewConsultation.attachments.map((att: any, idx: number) => (
                    <div key={idx} className="col-4">
                      <div className="p-1 border rounded bg-white">
                        <a 
                          href={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                          onClick={(e) => {
                            e.preventDefault();
                            setPreviewImage(att.url.startsWith("/") ? apiUrl(att.url) : att.url);
                          }}
                        >
                          <img
                            src={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                            alt="Scan"
                            className="rounded"
                            style={{ width: "100%", height: 75, objectFit: "cover", cursor: "zoom-in" }}
                          />
                        </a>
                        {att.remark && <div className="text-muted fs-10 text-center mt-1 truncate">{att.remark}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ViewModal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <div className="modal fade" id="delete_therapy_appt">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Cancel Appointment</h5>
              <p className="mb-3 text-muted">Are you sure want to cancel appointment {selectedAppt?.appointmentCode}?</p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                  id="close-delete-appt-modal"
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => selectedAppt && handleDelete(selectedAppt.id)}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===== GENERATE PRESCRIPTION MODAL (clinic appointment UI theme) ===== */}
      <div className="modal fade prescription-modal-wrapper" id="prescription_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div
            className="modal-content text-dark border-0 shadow-lg overflow-hidden"
            style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12 }}
          >
            <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
              <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center">
                <i className="ti ti-prescription me-2 fs-20" />
                Generate Prescription
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="close-prescription-modal" />
            </div>

            {selectedConsultation && (
              <div className="visits-bar bg-light border-bottom p-2 px-3 d-flex align-items-center justify-content-between flex-shrink-0">
                <div className="d-flex align-items-center gap-2 overflow-auto" style={{ flex: 1 }}>
                  <div className="visit-tab-card p-2 px-3 rounded border active bg-white border-primary shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-calendar fs-14 text-primary" />
                      <div className="lh-1">
                        <span className="d-block fw-bold fs-12 text-primary">Current Visit</span>
                        <small className="fs-10 text-muted">{selectedConsultation.appointment?.dateTimeLabel || "Today"}</small>
                      </div>
                    </div>
                  </div>
                  <div className="d-none d-md-block ms-2">
                    <div className="text-dark fw-bold fs-12">
                      {selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}
                    </div>
                    <small className="text-muted fs-11">{selectedConsultation.appointment?.appointmentCode || "N/A"}</small>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-body bg-light-subtle p-0 d-flex overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
              {selectedConsultation ? (
                <>
                  <div className="prescription-main-content p-3" style={{ flex: 1, overflowY: "auto" }}>
                      <div className="bg-white border rounded-3 shadow-sm p-3 mb-3" style={{ overflow: "visible" }}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="ti ti-pill text-primary fs-18" />
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
                            <div className="d-flex flex-column gap-3" style={{ overflow: "visible" }}>
                              {selectedConsultation.medicines.map((m: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="border rounded-3 p-3 bg-light-subtle position-relative"
                                  style={{ overflow: "visible", zIndex: activeSearchIndex === idx ? 1000 : 1 }}
                                >
                                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold"
                                        style={{ width: 30, height: 30, fontSize: 12 }}
                                      >
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <div className="fw-bold text-dark fs-13">Medicine {idx + 1}</div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>
                                          Add medicine details and schedule
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger p-0 d-flex align-items-center gap-1"
                                      onClick={() => removeModalMedicineRow(idx)}
                                    >
                                      <i className="ti ti-trash fs-5" />
                                    </button>
                                  </div>

                                  <div className="row g-3">
                                    <div
                                      className="col-12 position-relative"
                                      style={{ zIndex: activeSearchIndex === idx ? 1001 : 1 }}
                                    >
                                      <label className="form-label fw-semibold small text-muted mb-1">
                                        Medicine Name *
                                      </label>
                                      <IconFormControl
                                        type="text"
                                        fieldLabel="medicine"
                                        className="form-control-sm"
                                        placeholder="Search or enter medicine name"
                                        value={m.name}
                                        onChange={(e) => updateModalMedicineRow(idx, "name", e.target.value)}
                                        onFocus={() => setActiveSearchIndex(idx)}
                                        onBlur={() => {
                                          setTimeout(() => {
                                            setActiveSearchIndex(null);
                                          }, 250);
                                        }}
                                        style={{ borderRadius: 8 }}
                                        autoComplete="off"
                                      />
                                      {activeSearchIndex === idx && (
                                        <div
                                          className="position-absolute bg-white border rounded-3 shadow-lg mt-1 w-100"
                                          style={{
                                            zIndex: 1002,
                                            maxHeight: "180px",
                                            overflowY: "auto",
                                            top: "100%",
                                            left: 0,
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
                                                <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>
                                                  {opt.name}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>
                                                  {opt.category}
                                                </div>
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
                                    </div>

                                    <div className="col-md-3 col-sm-6">
                                      <label className="form-label fw-semibold small text-muted mb-1">Dose</label>
                                      <select
                                        className="form-select form-select-sm"
                                        value={m.dosage || "1 Tablet"}
                                        onChange={(e) => updateModalMedicineRow(idx, "dosage", e.target.value)}
                                        style={{ borderRadius: 8 }}
                                      >
                                        <option value="1 Tablet">1 Tablet</option>
                                        <option value="2 Tablets">2 Tablets</option>
                                        <option value="1 Spoon">1 Spoon</option>
                                        <option value="0.5 Tablet">0.5 Tablet</option>
                                        <option value="1 Capsule">1 Capsule</option>
                                        <option value="2 Capsules">2 Capsules</option>
                                        <option value="As Directed">As Directed</option>
                                      </select>
                                    </div>

                                    <div className="col-md-3 col-sm-6">
                                      <label className="form-label fw-semibold small text-muted mb-1">Frequency</label>
                                      <select
                                        className="form-select form-select-sm"
                                        value={m.frequency || "1-0-1"}
                                        onChange={(e) => updateModalMedicineRow(idx, "frequency", e.target.value)}
                                        style={{ borderRadius: 8 }}
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
                                    </div>

                                    <div className="col-md-3 col-sm-6">
                                      <label className="form-label fw-semibold small text-muted mb-1">Duration</label>
                                      <select
                                        className="form-select form-select-sm"
                                        value={m.duration || "5 Days"}
                                        onChange={(e) => updateModalMedicineRow(idx, "duration", e.target.value)}
                                        style={{ borderRadius: 8 }}
                                      >
                                        <option value="3 Days">3 Days</option>
                                        <option value="5 Days">5 Days</option>
                                        <option value="7 Days">7 Days</option>
                                        <option value="10 Days">10 Days</option>
                                        <option value="2 Weeks">2 Weeks</option>
                                        <option value="1 Month">1 Month</option>
                                      </select>
                                    </div>

                                    <div className="col-md-3 col-sm-6">
                                      <label className="form-label fw-semibold small text-muted mb-1">Timing</label>
                                      <select
                                        className="form-select form-select-sm"
                                        value={m.instructions || "After Food"}
                                        onChange={(e) => updateModalMedicineRow(idx, "instructions", e.target.value)}
                                        style={{ borderRadius: 8 }}
                                      >
                                        <option value="After Food">After Food</option>
                                        <option value="Before Food">Before Food</option>
                                        <option value="With Food">With Food</option>
                                        <option value="Empty Stomach">Empty Stomach</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Advice and Diagnostic Tests Row */}
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <div className="bg-white border rounded-3 shadow-sm p-3 h-100">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="ti ti-message-dots text-primary fs-18" />
                              <h6 className="fw-bold text-dark mb-0 fs-14">Advice</h6>
                            </div>
                            <IconTextarea
                              fieldLabel="notes"
                              rows={4}
                              className="text-dark border-secondary-subtle p-2"
                              value={selectedConsultation.advice || ""}
                              onChange={(e) => updateModalAdvice(e.target.value)}
                              placeholder="Enter doctor's instructions, recommendations, or advices..."
                              style={{ borderRadius: 8, fontSize: 13 }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="bg-white border rounded-3 shadow-sm p-3 h-100 d-flex flex-column">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="ti ti-activity text-primary fs-18" />
                              <h6 className="fw-bold text-dark mb-0 fs-14">Diagnostic Tests</h6>
                            </div>
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
                                        className="px-3 py-2 d-flex align-items-center justify-content-between text-dark medicine-dropdown-item"
                                        style={{ cursor: "pointer", borderBottom: "1px solid #f8fafc", fontSize: 13 }}
                                        onMouseDown={() => addDiagnosticTest(t.name)}
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
                              className="flex-grow-1 border rounded-3 p-2 bg-light-subtle d-flex flex-wrap gap-2 align-content-start"
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
                                <div className="text-center w-100 my-auto text-muted small d-flex align-items-center justify-content-center">
                                  No diagnostic tests prescribed.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Photo / Scan Upload Area */}
                      <div className="bg-white border rounded-3 shadow-sm p-3 mb-2">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <i className="ti ti-photo-plus text-primary fs-18" />
                          <h6 className="fw-bold text-dark mb-0 fs-14">Prescription Scans & Attachments</h6>
                        </div>
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

                  {/* RIGHT: previous prescriptions sidebar */}
                  <div
                    className="prescription-sidebar bg-white border-start p-3"
                    style={{ width: 250, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}
                  >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-history text-primary fs-18" />
                        <h6 className="fw-bold text-dark mb-0 fs-14">Previous Prescriptions</h6>
                      </div>

                      <div className="alert bg-warning-subtle border-0 rounded-3 mb-3 p-2 d-flex align-items-start gap-2 text-warning-emphasis fs-12" style={{ lineHeight: 1.45 }}>
                        <i className="ti ti-bulb fs-15 text-warning" />
                        <span>Click on any visit to copy its prescription and continue.</span>
                      </div>

                      <div className="previous-prescriptions-list d-flex flex-column gap-2" style={{ flex: 1 }}>
                        {previousConsultations.length > 0 && (
                          <div className="mb-2">
                            <div className="text-muted fw-bold small uppercase mb-2" style={{ fontSize: 10 }}>Therapy Visits</div>
                            {previousConsultations.map((pc: any) => (
                              <div
                                key={pc.id}
                                className="card border rounded-3 p-3 mb-2 hover-shadow bg-light-subtle"
                                onClick={() => handleCopyPreviousPrescription(pc, "therapy")}
                                style={{ cursor: "pointer" }}
                                title="Click to copy prescription"
                              >
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <span className="fw-bold fs-13 text-dark">{pc.consultationCode || "Therapy Plan"}</span>
                                  <i className="ti ti-copy fs-14 text-primary" />
                                </div>
                                <small className="d-block text-muted fs-11 mb-1">
                                  <i className="ti ti-calendar me-1" />
                                  {pc.appointment?.scheduledAt ? new Date(pc.appointment.scheduledAt).toLocaleDateString() : new Date(pc.createdAt).toLocaleDateString()}
                                </small>
                                <span className="badge bg-soft-primary text-primary px-2 rounded fs-10 fw-bold">
                                  {pc.medicines?.length || 0} Medicines
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {previousClinicPrescriptions.length > 0 && (
                          <div className="mb-2">
                            <div className="text-muted fw-bold small uppercase mb-2" style={{ fontSize: 10 }}>Clinic Visits</div>
                            {previousClinicPrescriptions.map((cp: any) => (
                              <div
                                key={cp.id}
                                className="card border rounded-3 p-3 mb-2 hover-shadow bg-light-subtle"
                                onClick={() => handleCopyPreviousPrescription(cp, "clinic")}
                                style={{ cursor: "pointer" }}
                                title="Click to copy prescription"
                              >
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <span className="fw-bold fs-13 text-dark">{cp.prescriptionCode || "Prescription"}</span>
                                  <i className="ti ti-copy fs-14 text-primary" />
                                </div>
                                <small className="d-block text-muted fs-11 mb-1">
                                  <i className="ti ti-calendar me-1" />
                                  {cp.appointment?.scheduledAt ? new Date(cp.appointment.scheduledAt).toLocaleDateString() : new Date(cp.createdAt).toLocaleDateString()}
                                </small>
                                <span className="badge bg-soft-primary text-primary px-2 rounded fs-10 fw-bold">
                                  {cp.medicines?.length || 0} Medicines
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {previousConsultations.length === 0 && previousClinicPrescriptions.length === 0 && (
                          <div className="text-center py-5 text-muted">
                            <i className="ti ti-folder-off fs-30 opacity-50 mb-2" /><br />
                            No previous prescriptions recorded.
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-top" style={{ flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 fs-13"
                          onClick={handleClearPrescription}
                        >
                          <i className="ti ti-refresh fs-14" /> Clear Prescription
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
      {slipPrintAppointment && (
        <div id="print-therapy-appointment-slip" style={{ display: "none" }}>
          <AppointmentPrintSlip appointment={slipPrintAppointment} />
        </div>
      )}
      <style>{`
        .prescription-modal-wrapper .modal-xl { max-width: 1080px; width: 92%; }
        .prescription-modal-wrapper .visit-tab-card {
          min-width: 120px; display: flex; align-items: center;
          background-color: #f8fafc !important; border: 1px solid #cbd5e1 !important;
          padding: 6px 12px !important; border-radius: 8px !important;
        }
        .prescription-modal-wrapper .visit-tab-card.active {
          background-color: #fff !important; border: 2px solid #4f46e5 !important;
        }
        .prescription-modal-wrapper .bg-soft-primary {
          background-color: rgba(79,70,229,0.1) !important; color: #4f46e5 !important;
        }
        .prescription-modal-wrapper .hover-shadow:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-1px);
        }
        .prescription-modal-wrapper .medicine-dropdown-item {
          padding: 8px 14px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f8fafc;
        }
        .prescription-modal-wrapper .medicine-dropdown-item:hover { background-color: #f1f5f9; }
        .prescription-modal-wrapper .btn-outline-primary { color: #4f46e5 !important; border-color: #4f46e5 !important; }
        .prescription-modal-wrapper .btn-outline-primary:hover { background-color: #4f46e5 !important; color: #fff !important; }

        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            height: auto !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
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
          #print-therapy-appointment-slip,
          [data-hidden-for-print],
          [data-hidden-for-print] * {
            display: none !important;
            visibility: hidden !important;
          }
          #therapy-modal-print-prescription-pad,
          #therapy-modal-print-prescription-pad * {
            visibility: visible !important;
          }
          #therapy-modal-print-prescription-pad {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            max-height: 297mm !important;
            min-height: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            border: none !important;
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

        /* Appointment slip print (same design as /appointments) */
        @media print {
          body.printing-therapy-appt-slip * {
            visibility: hidden !important;
          }
          body.printing-therapy-appt-slip #therapy-modal-print-prescription-pad,
          body.printing-therapy-appt-slip #therapy-modal-print-prescription-pad * {
            display: none !important;
            visibility: hidden !important;
          }
          body.printing-therapy-appt-slip #print-therapy-appointment-slip,
          body.printing-therapy-appt-slip #print-therapy-appointment-slip * {
            visibility: visible !important;
          }
          body.printing-therapy-appt-slip #print-therapy-appointment-slip {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            background: #fff !important;
            z-index: 99999 !important;
            margin: 0 !important;
            padding: 0 !important;
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

export default TherapyAppointments;
