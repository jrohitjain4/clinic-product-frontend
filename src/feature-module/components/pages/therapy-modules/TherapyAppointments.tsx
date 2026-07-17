import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Datatable from "../../../../core/common/dataTable";
import { apiGet, apiDelete, apiPost, apiPut } from "../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import EmptyState from "../../../../core/common/emptyState";
import { apiUrl } from "../../../../core/config/api";
import { useMedicines } from "../../../../core/hooks/useMedicines";

const TherapyAppointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isConsultancy = location.pathname.includes("consultations");
  const { medicines: pharmacyMedicines } = useMedicines();
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

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
        dosage: m.frequency || m.dosage || "1-0-1",
        duration: m.duration || "5 Days",
        instructions: m.timings || "After Food",
      }));
    }

    setSelectedConsultation({
      ...selectedConsultation,
      medicines: medicinesToCopy,
      advice: adviceToCopy,
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
      attachments: [],
    });
    toast.info("Cleared prescription inputs.");
  };

  const statusBadgeClass = (status: string) => {
    if (status === "Checked Out") return "badge-soft-info text-info border-info";
    if (status === "Checked In") return "badge-soft-warning text-warning border-warning";
    if (status === "Cancelled") return "badge-soft-danger text-danger border-danger";
    if (status === "Schedule") return "badge-soft-primary text-primary border-primary";
    if (status === "Confirmed") return "badge-soft-success text-success border-success";
    return "badge-soft-secondary text-secondary border-secondary";
  };

  // Auto-expand parents if they have a child appointment scheduled for today
  useEffect(() => {
    if (appointments.length > 0) {
      const todayStr = new Date().toDateString();
      const todayParentIds = appointments
        .filter((a: any) => {
          if (!a.parentAppointmentId || !a.scheduledAt) return false;
          return new Date(a.scheduledAt).toDateString() === todayStr;
        })
        .map((a: any) => a.parentAppointmentId);
      
      if (todayParentIds.length > 0) {
        setExpandedRowKeys((prev) => {
          const merged = [...prev, ...todayParentIds];
          return Array.from(new Set(merged)) as string[];
        });
      }
    }
  }, [appointments]);

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
      <div className="p-3 bg-light rounded-3" style={{ border: "1px solid #e2e8f0" }}>
        <h6 className="fw-bold mb-2 text-dark fs-13 d-flex align-items-center gap-1">
          <i className="ti ti-link text-primary"></i> Connected Sessions / Slots
        </h6>
        <div className="table-responsive bg-white rounded-2 border">
          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "11px" }}>
            <thead className="bg-light text-muted">
              <tr>
                <th className="py-2 px-3 border-0" style={{ width: 80 }}>Session No</th>
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
                const isPaid = child.paymentStatus === "Paid";
                const isPartial = child.paymentStatus === "Partial Paid";
                return (
                  <tr key={child.id}>
                    <td className="py-2 px-3 border-0 fw-semibold text-dark">
                      Session {child.sessionNumber || "—"}
                    </td>
                    <td className="py-2 px-3 border-0 fw-semibold text-primary">
                      {child.appointmentCode}
                    </td>
                    <td className="py-2 px-3 border-0 text-dark">
                      {child.dateTimeLabel || new Date(child.scheduledAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="py-2 px-3 border-0 text-secondary">
                      {child.doctorName || child.doctor?.fullName || "—"}
                    </td>
                    <td className="py-2 px-3 border-0">
                      <span className="badge bg-light text-dark border px-2 py-0.5">
                        {child.mode}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <span className="text-dark fw-semibold">₹{child.finalFee || child.consultationFee || 0}</span>
                      <span className={`badge border ms-2 ${
                        isPaid 
                          ? "badge-soft-success border-success text-success" 
                          : isPartial 
                          ? "badge-soft-warning border-warning text-warning" 
                          : "badge-soft-danger border-danger text-danger"
                      } px-1 py-0.2 fs-10`}>
                        {child.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-0">
                      <div className="d-flex align-items-center gap-1">
                        <span className={`badge border ${statusBadgeClass(child.status)} px-2 py-0.5 fs-11`}>
                          {child.status}
                        </span>
                        {["Schedule", "Confirmed", "Checked In"].includes(child.status) && (
                          <div className="form-check form-switch p-0 ms-2" style={{ minHeight: 'auto', display: 'inline-block' }}>
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                              checked={togglingId === child.id}
                              onChange={() => handleStatusToggle(child.id, child.status)}
                              style={{ cursor: 'pointer', width: '25px', height: '14px' }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-0 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className={`bg-transparent border-0 p-1 ${child.consultation ? "text-success" : "text-primary"}`}
                          title={child.consultation ? "View / Upload Prescription Scan" : "Create Prescription Upload"}
                          data-bs-toggle="modal"
                          data-bs-target="#prescription_modal"
                          onClick={() => handleOpenPrescriptionModal(child)}
                        >
                          <i className="ti ti-pill fs-14"></i>
                        </button>
                        <button
                          className="bg-transparent border-0 text-info p-1"
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
                          <i className="ti ti-eye fs-14"></i>
                        </button>
                        <button
                          className="bg-transparent border-0 text-danger p-1"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_therapy_appt"
                          onClick={() => setSelectedAppt(child)}
                          title="Cancel Appointment"
                        >
                          <i className="ti ti-trash fs-14"></i>
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
      render: (text: number) => <span className="fs-13 fw-medium text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.sr_no - b.sr_no,
      width: 60,
    },
    {
      title: "Appointment ID",
      dataIndex: "code",
      render: (text: string) => <span className="text-primary fw-semibold">{text}</span>,
      sorter: (a: any, b: any) => a.code.localeCompare(b.code),
    },
    {
      title: "Patient Name",
      dataIndex: "patientName",
      render: (text: string) => <span className="fw-semibold text-dark fs-14">{text}</span>,
      sorter: (a: any, b: any) => a.patientName.localeCompare(b.patientName),
    },
    {
      title: "Therapist",
      dataIndex: "therapist",
      render: (text: string) => <span className="text-secondary">{text}</span>,
      sorter: (a: any, b: any) => a.therapist.localeCompare(b.therapist),
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      render: (text: string) => <span className="text-dark fs-13">{text}</span>,
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
        
        const isPaid = status === "Paid";
        const isPartial = status === "Partial Paid" || status === "Partially Paid";
        
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            {invoiceCode && <span className="fw-semibold text-dark fs-13">{invoiceCode}</span>}
            <div className="text-muted fs-11" style={{ lineHeight: '1.2' }}>
              <div>Total: ₹{total.toLocaleString()}</div>
              <div className="fw-medium text-danger">Due: ₹{remaining.toLocaleString()}</div>
            </div>
            <span className={`badge border ${
              isPaid 
                ? "badge-soft-success border-success text-success" 
                : isPartial 
                ? "badge-soft-warning border-warning text-warning" 
                : "badge-soft-danger border-danger text-danger"
            } px-1.5 py-0.2 fs-10 mt-1`}>
              {status}
            </span>
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
        const isPartial = status === "Partial Paid";
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="text-dark fw-bold">₹{text}</span>
            <span className={`badge border ${
              isPaid 
                ? "badge-soft-success border-success text-success" 
                : isPartial 
                ? "badge-soft-warning border-warning text-warning" 
                : "badge-soft-danger border-danger text-danger"
            } px-1 py-0.5 fs-11`}>
              {status}
            </span>
            {!isPaid && (
              <button
                className="btn btn-xs btn-outline-success py-0 px-1 fs-10 fw-bold mt-1 text-uppercase"
                onClick={() => handleMarkPaymentPaid(raw.id)}
                style={{ borderRadius: "4px" }}
              >
                Mark Paid
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
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge border ${statusBadgeClass(text)} px-2 py-1 fs-12`}>
              {text}
            </span>
            {["Schedule", "Confirmed", "Checked In"].includes(text) && (
              <div className="form-check form-switch p-0 ms-2" style={{ minHeight: 'auto' }}>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  checked={togglingId === raw.id}
                  onChange={() => handleStatusToggle(raw.id, text)}
                  style={{ cursor: 'pointer', width: '30px', height: '16px' }}
                />
                <label className="text-black fw-bold small ms-1" style={{ fontSize: '10px' }}>
                  {text === "Schedule" ? "Confirm" : text === "Confirmed" ? "Checkin" : "Checkout"}
                </label>
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
        const hasConsult = !!raw.consultation;
        const children = appointments.filter((a: any) => a.parentAppointmentId === raw.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedRowKeys.includes(raw.id);

        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            {hasChildren && (
              <button
                type="button"
                className={`bg-transparent border-0 p-1 ${isExpanded ? "text-primary" : "text-muted"}`}
                title={isExpanded ? "Hide Connected Sessions" : "Show Connected Sessions"}
                onClick={() => handleToggleExpand(raw.id)}
              >
                <i className={`ti ${isExpanded ? "ti-chevron-up" : "ti-chevron-down"} fs-18`}></i>
              </button>
            )}

            {!isChildAppt && (
              <button
                type="button"
                className={`bg-transparent border-0 p-1 ${hasConsult ? "text-success" : "text-primary"}`}
                title={hasConsult ? "View / Upload Prescription Scan" : "Create Prescription Upload"}
                data-bs-toggle="modal"
                data-bs-target="#prescription_modal"
                onClick={() => handleOpenPrescriptionModal(raw)}
              >
                <i className="ti ti-pill fs-18"></i>
              </button>
            )}

            <button
              className="bg-transparent border-0 text-info p-1"
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
              <i className="ti ti-eye fs-18"></i>
            </button>
            <button
              className="bg-transparent border-0 text-danger p-1"
              data-bs-toggle="modal"
              data-bs-target="#delete_therapy_appt"
              onClick={() => setSelectedAppt(record.raw)}
              title="Cancel Appointment"
            >
              <i className="ti ti-trash fs-18"></i>
            </button>
          </div>
        );
      },
      width: 120,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0">
                {isConsultancy ? "Therapy Consultancy" : "Therapy Appointments"}
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  {isConsultancy ? "Total Consultations" : "Total Bookings"}: {loading ? "" : data.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/book-therapy-appointment"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ minHeight: "38px" }}
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
            <div className="table-responsive">
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
          <span className={`badge border ${statusBadgeClass(viewAppt?.status || "Schedule")} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewAppt?.status || "Schedule"}
          </span>
        }
        highlightColor="#e0e7ff"
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
      >
        {viewAppt?.mode?.toLowerCase() === "online" && viewAppt?.onlineLink && (
          <div className="px-4 pb-3">
            <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
              Online Meeting Link
            </label>
            <div className="fs-14 text-primary leading-relaxed bg-light p-2 rounded">
              <a href={viewAppt.onlineLink} target="_blank" rel="noreferrer" className="text-break">
                {viewAppt.onlineLink}
              </a>
            </div>
          </div>
        )}

        {viewAppt?.mode?.toLowerCase().includes("home") && viewAppt?.homeAddress && (
          <div className="px-4 pb-3">
            <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
              Home Visit Address
            </label>
            <div className="fs-14 text-secondary leading-relaxed bg-light p-2 rounded">
              {viewAppt.homeAddress}
            </div>
          </div>
        )}

        {viewAppt?.reason && (
          <div className="px-4 pb-3">
            <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
              Reason / Remarks
            </label>
            <div className="fs-14 text-secondary leading-relaxed bg-light p-2 rounded">
              {viewAppt.reason}
            </div>
          </div>
        )}

        {viewConsultation && (
          <div className="px-4 pb-3 border-top pt-3">
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
                        <div className="fw-bold text-primary small">{selectedConsultation.appointment?.dateTimeLabel || "Today"}</div>
                      </div>
                      <div className="d-none d-sm-block">
                        <div className="text-muted small">Patient: <strong>{selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}</strong></div>
                        <div className="text-muted small">Appointment ID: <strong>{selectedConsultation.appointment?.appointmentCode}</strong></div>
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

export default TherapyAppointments;
