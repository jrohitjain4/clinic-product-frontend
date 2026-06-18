import { Link, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import AddPrescriptionModal from "../../doctor-modules/doctors-prescriptions/AddPrescriptionModal";
import {
    statusBadgeClass,
    formatAppointmentDate,
    formatAppointmentTimeRange
} from "../../../../../core/utils/appointmentForm";
import { Modal, DatePicker } from "antd";
import dayjs from "dayjs";
import { apiUrl, resolveMediaUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import html2pdf from 'html2pdf.js';
import { useNotes } from "../../../../../core/hooks/useNotes";
import Footer from "../../../../../core/common/footer/footer";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { APPOINTMENT_STATUS_OPTIONS } from "../../../../../core/utils/appointmentForm";
import { authHeaders } from "../../../../../core/utils/apiClient";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";

const AppointmentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { appointment, loading, error, refetch } = useClinicAppointment(id);
    const { prescriptions, createPrescription, updatePrescription, deletePrescription, refetch: refetchPres } = usePrescriptions();

    const [showPresModal, setShowPresModal] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState<any>(null);
    const [selectedPres, setSelectedPres] = useState<any>(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [clinicalNote, setClinicalNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    // Selection state
    const [selectedPresKeys, setSelectedPresKeys] = useState<any[]>([]);
    const [selectedFollowUpKeys, setSelectedFollowUpKeys] = useState<any[]>([]);

    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpDate, setFollowUpDate] = useState<dayjs.Dayjs | null>(null);
    const [followUpTimeSlot, setFollowUpTimeSlot] = useState<string | null>(null);
    const [followUpStatus, setFollowUpStatus] = useState("Schedule");
    const [followUpPayment, setFollowUpPayment] = useState("Unpaid");
    const [followUpReason, setFollowUpReason] = useState("");
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
    const [doctorAvailability, setDoctorAvailability] = useState<any>(null);

    const { notes, addNote, loading: loadingNotes } = useNotes({ appointmentId: id });

    // Fetch patient's full history
    const { appointments: history, updateAppointmentStatus } = useClinicAppointments(
        appointment?.patientId ? { patientId: appointment.patientId } : undefined
    );

    // Fetch all appointments to compute dynamic queue/expected-time ranks
    const { appointments: allAppointments } = useClinicAppointments();

    // Fetch services for session appointment display
    const { services } = useClinicServices();

    const slotDetails = useMemo(() => {
        if (!appointment || !allAppointments || allAppointments.length === 0) return { expectedTime: "—", checkinHisNo: "—" };

        const dateStr = dayjs(appointment.scheduledAt).format("YYYY-MM-DD");
        const timeStr = dayjs(appointment.scheduledAt).format("HH:mm");
        const doctorId = appointment.doctorId;

        // Group appointments by doctor, date, and slot time
        const group = allAppointments.filter((a) => {
            const aDate = dayjs(a.scheduledAt).format("YYYY-MM-DD");
            const aTime = dayjs(a.scheduledAt).format("HH:mm");
            return a.doctorId === doctorId && aDate === dateStr && aTime === timeStr;
        }).sort((a, b) => {
            const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (createA !== createB) return createA - createB;
            return (a.id || "").localeCompare(b.id || "");
        });

        const indexInGroup = group.findIndex((item) => item.id === appointment.id);
        const queueNo = indexInGroup !== -1 ? indexInGroup + 1 : 1;

        const slotStartTime = dayjs(appointment.scheduledAt);
        const expectedTime = indexInGroup !== -1
            ? slotStartTime.add(indexInGroup * 15, "minute").format("hh:mm A")
            : slotStartTime.format("hh:mm A");

        const checkinsBefore = indexInGroup !== -1
            ? group.slice(0, indexInGroup).filter((item) => ["Checked In", "Checked Out"].includes(item.status)).length
            : 0;

        const checkinHisNo = `${checkinsBefore} / ${queueNo}`;

        return { expectedTime, checkinHisNo };
    }, [appointment, allAppointments]);

    const handleCancelAppointment = async () => {
        if (!appointment) return;
        Modal.confirm({
            title: <span className="text-danger fw-bold">Cancel Appointment</span>,
            content: "Are you sure you want to cancel this appointment?",
            okText: "Yes, Cancel",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    await updateAppointmentStatus(appointment.id, "Cancelled");
                    toast.success("Appointment cancelled successfully");
                    refetch();
                } catch (e: any) {
                    toast.error(e.message || "Failed to cancel appointment");
                }
            }
        });
    };

    // Calculate fully linked chain (Root Parent + all its Follow-ups)
    const rootId = appointment?.parentAppointmentId || appointment?.id;
    const chainAppointments = history.filter(a => a.id === rootId || a.parentAppointmentId === rootId);
    const chainIds = chainAppointments.map(a => a.id);

    const sortedChain = [...chainAppointments].sort((a, b) => dayjs(a.scheduledAt).isBefore(dayjs(b.scheduledAt)) ? -1 : 1);

    const linkedPrescriptions = prescriptions.filter(p =>
        chainIds.includes(p.appointmentId) ||
        chainIds.includes(p.appointment?.id || "")
    );
    const patientHistory = history.filter(h => !chainIds.includes(h.id)); // Other visits

    // Session appointment support
    const isSessionAppointment = appointment?.serviceIds && appointment.serviceIds.length > 0;
    const sessionServices = useMemo(() => {
        if (!isSessionAppointment || !services.length) return [];
        return services.filter(s => appointment.serviceIds?.includes(s.id));
    }, [isSessionAppointment, appointment?.serviceIds, services]);
    const totalSessionDays = useMemo(() => {
        return sessionServices.reduce((sum, s) => {
            const match = (s.duration || '').match(/(\d+)/);
            return sum + (match ? parseInt(match[1], 10) : 0);
        }, 0);
    }, [sessionServices]);
    // Session children: appointments linked via parentAppointmentId to current or current is parent
    const sessionChildren = useMemo(() => {
        if (!isSessionAppointment || !appointment) return [];
        const parentId = appointment.parentAppointmentId || appointment.id;
        return history
            .filter(a => a.id === parentId || a.parentAppointmentId === parentId)
            .filter(a => (a as any).serviceIds && (a as any).serviceIds.length > 0)
            .sort((a, b) => dayjs(a.scheduledAt).isBefore(dayjs(b.scheduledAt)) ? -1 : 1);
    }, [isSessionAppointment, appointment, history]);

    const handlePresSubmit = async (data: any) => {
        try {
            if (editingPrescription) {
                await updatePrescription(editingPrescription.id, {
                    ...data,
                    appointmentId: data.appointmentId || id,
                    patientId: appointment?.patientId,
                    doctorId: appointment?.doctorId
                });
                toast.success("Prescription updated successfully");
            } else {
                await createPrescription({
                    ...data,
                    appointmentId: data.appointmentId || id,
                    patientId: appointment?.patientId,
                    doctorId: appointment?.doctorId
                });
                toast.success("Prescription created successfully");
            }
            setShowPresModal(false);
            setEditingPrescription(null);
            refetchPres();
        } catch (e) {
            console.error(e);
            toast.error(editingPrescription ? "Failed to update prescription" : "Failed to create prescription");
        }
    };

    const handleNoteSave = async () => {
        if (!id || !clinicalNote.trim()) return;
        setSavingNote(true);
        try {
            await addNote({
                title: "Clinical Note",
                content: clinicalNote,
                priority: "Medium",
                noteDate: new Date().toISOString(),
                appointmentId: id
            });
            toast.success("Clinical note added");
            setClinicalNote("");
            setShowNoteModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingNote(false);
        }
    };

    // ── Fetch Doctor Availability for Follow-up ──────────────
    useEffect(() => {
        if (showFollowUpModal && appointment?.doctorId) {
            const start = dayjs().startOf("month").subtract(1, "month").toISOString();
            const end = dayjs().endOf("month").add(3, "month").toISOString();
            fetch(apiUrl(`/api/doctors/${appointment.doctorId}/availability?startDate=${start}&endDate=${end}`), {
                headers: authHeaders(),
            })
                .then(r => r.json())
                .then(setDoctorAvailability)
                .catch(console.error);
        }
    }, [showFollowUpModal, appointment?.doctorId]);

    // ── Reset defaults when modal opens ──────────────
    useEffect(() => {
        if (showFollowUpModal) {
            setFollowUpStatus("Schedule");
            // Auto-detect payment status recommendation based on full treatment chain
            const freeLimit = appointment?.doctor?.freeFollowUpLimit || 0;
            const currentCount = chainAppointments?.length || 0;
            const isFree = freeLimit === 0 || currentCount <= freeLimit;
            setFollowUpPayment(isFree ? "Free" : "Unpaid");
        }
    }, [showFollowUpModal, appointment]);

    const sessionOptions = useMemo(() => {
        if (!doctorAvailability || !followUpDate) return [];
        const dayName = followUpDate.format("dddd"); // Match main form logic
        const daySchedule = doctorAvailability.schedules?.[dayName] || [];

        return daySchedule.map((session: any, idx: number) => {
            const sessionLabel = session.label || (idx === 0 ? "Morning Session" : idx === 1 ? "Evening Session" : `Session ${idx + 1}`);
            const fromFormatted = dayjs(session.from, "HH:mm").format("hh:mm A");
            const toFormatted = dayjs(session.to, "HH:mm").format("hh:mm A");

            return {
                value: session.from,
                label: `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
            };
        });
    }, [doctorAvailability, followUpDate]);

    const handleFollowUpSubmit = async () => {
        if (!id || !followUpDate || !followUpTimeSlot) {
            toast.error("Please select a date and time slot for the follow-up");
            return;
        }
        setIsSubmittingFollowUp(true);
        try {
            const token = localStorage.getItem("token");
            const scheduledAt = dayjs(followUpDate.format("YYYY-MM-DD") + " " + followUpTimeSlot).toISOString();

            const res = await fetch(apiUrl(`/api/appointments/${id}/follow-up`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    scheduledAt,
                    reason: followUpReason,
                    status: followUpStatus,
                    paymentStatus: followUpPayment,
                    followUpStatus: followUpPayment === "Free" ? "Free Follow-up" : "Paid Follow-up"
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to schedule follow-up");
            }

            toast.success("Follow-up scheduled successfully!");
            setShowFollowUpModal(false);
            setFollowUpDate(null);
            setFollowUpTimeSlot(null);
            setFollowUpReason("");
            refetch(); // Reload appointment to show new follow-ups
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    const handleDownload = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !appointment) return;

        const html = `<html>
            <head>
              <title>Clinical Report - ${appointment.appointmentCode || 'Record'}</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
              <style>
                body { background: #fff; padding: 40px; font-family: 'Inter', sans-serif; color: #1e293b; }
                .report-header { border-bottom: 2px solid #4f46e5; margin-bottom: 30px; padding-bottom: 20px; }
                .logo-box { width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff; }
                .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px; font-size: 11px; color: #64748b; letter-spacing: 1px; }
                .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 700; }
                .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
                @media print { body { padding: 0; } .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="d-flex justify-content-between align-items-center report-header">
                <div class="d-flex gap-3 align-items-center">
                  <div class="logo-box">
                    <img src="${resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 60px; max-width: 60px; object-fit: contain;">
                  </div>
                  <div>
                    <h4 class="fw-bold mb-1" style="color: #1e293b; font-size: 22px;">${appointment.clinicName || "DocYari Health Hub"}</h4>
                    <p class="mb-0 text-muted small">${appointment.location || "Clinic Location"}</p>
                  </div>
                </div>
                <div class="text-end">
                   <h6 class="fw-bold mb-1">CLINICAL VISIT REPORT</h6>
                   <span class="badge bg-primary px-3 py-1 fw-bold fs-10 text-uppercase">${appointment.status || 'Scheduled'}</span>
                </div>
              </div>

              <div class="row g-4 mb-5">
                <div class="col-6">
                   <h6 class="section-title">Patient Profile</h6>
                   <div class="p-3 border rounded bg-light-subtle">
                      <div class="row g-3">
                         <div class="col-6">
                            <div class="info-label">Full Name</div>
                            <div class="info-value">${appointment.patient?.firstName} ${appointment.patient?.lastName}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Patient ID</div>
                            <div class="info-value">#${appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Age / Gender</div>
                            <div class="info-value">${appointment.patient?.dob ? dayjs().diff(appointment.patient.dob, 'year') : '--'}Y / ${appointment.patient?.gender || '--'}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Contact</div>
                            <div class="info-value">${appointment.patient?.phone || 'N/A'}</div>
                         </div>
                      </div>
                   </div>
                </div>
                <div class="col-6">
                   <h6 class="section-title">Visit Summary</h6>
                   <div class="p-3 border rounded bg-light-subtle h-100">
                      <div class="row g-3">
                         <div class="col-6">
                            <div class="info-label">Visit ID</div>
                            <div class="info-value text-primary">${appointment.appointmentCode || 'N/A'}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Visit Date</div>
                            <div class="info-value">${dayjs(appointment.scheduledAt).format('DD MMM YYYY')}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Practitioner</div>
                            <div class="info-value">${appointment.doctor?.fullName?.startsWith('Dr.') ? appointment.doctor.fullName : `Dr. ${appointment.doctor?.fullName}`}</div>
                         </div>
                         <div class="col-6">
                            <div class="info-label">Department</div>
                            <div class="info-value">${appointment.doctor?.department?.name || 'General'}</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div class="mb-5">
                <h6 class="section-title">Clinical Findings & Advice</h6>
                <div class="p-4 border rounded" style="min-height: 150px; background: #fff; line-height: 1.6;">
                   ${(notes && notes.length > 0) ? notes.map((n: any) => `<div class="mb-3"><strong>${n.title || 'Note'}:</strong> ${n.content}</div>`).join('') : '<p class="text-muted italic">No clinical findings recorded for this visit.</p>'}
                </div>
              </div>

              <div class="mt-auto pt-5 text-center border-top">
                <p class="mb-1 fw-bold fs-11 text-muted text-uppercase letter-spacing-1">Generated via Docyari PHR System</p>
                <div class="d-flex justify-content-center gap-5 mt-4">
                    <div class="text-center">
                        <p class="info-label mb-1">Authorised Signatory</p>
                        <p class="fw-bold small mb-0">${appointment.doctor?.fullName?.startsWith('Dr.') ? appointment.doctor.fullName : `Dr. ${appointment.doctor?.fullName}`}</p>
                    </div>
                </div>
                <p class="mb-0 text-muted small mt-4">This is a system generated document. For any discrepancies, please contact the clinic.</p>
              </div>

              <script>
                window.onload = () => {
                  setTimeout(() => { window.print(); window.close(); }, 500);
                };
              </script>
            </body>
          </html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleBulkDelete = async () => {
        if (selectedPresKeys.length === 0) return;

        Modal.confirm({
            title: <span className="text-danger fw-bold">Bulk Delete Prescriptions</span>,
            content: `Are you sure you want to delete ${selectedPresKeys.length} selected prescriptions? This action cannot be undone.`,
            okText: "Yes, Delete All",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    for (const key of selectedPresKeys) {
                        await deletePrescription(key);
                    }
                    toast.success(`${selectedPresKeys.length} prescriptions deleted successfully`);
                    setSelectedPresKeys([]);
                    refetchPres();
                } catch (e) {
                    toast.error("Failed to delete some prescriptions");
                }
            }
        });
    };

    const handleDelete = async (presId: string) => {
        Modal.confirm({
            title: <span className="text-danger fw-bold">Delete Prescription</span>,
            content: "Are you sure you want to delete this prescription?",
            okText: "Delete",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    await deletePrescription(presId);
                    toast.success("Prescription deleted successfully");
                    refetchPres();
                } catch (e) {
                    toast.error("Failed to delete prescription");
                }
            }
        });
    };

    const handleFollowUpDelete = async (followUpId: string) => {
        if (followUpId === appointment?.id) {
            toast.error("Cannot delete the current parent appointment from here.");
            return;
        }
        Modal.confirm({
            title: <span className="text-danger fw-bold">Delete Follow-up</span>,
            content: "Are you sure you want to delete this follow-up appointment?",
            okText: "Delete",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(apiUrl(`/api/appointments/${followUpId}`), {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    if (!res.ok) throw new Error("Failed to delete");
                    toast.success("Follow-up deleted successfully");
                    refetch();
                } catch (e) {
                    toast.error("Failed to delete follow-up");
                }
            }
        });
    };

    const handleFollowUpBulkDelete = async () => {
        if (selectedFollowUpKeys.length === 0) return;

        Modal.confirm({
            title: <span className="text-danger fw-bold">Bulk Delete Follow-ups</span>,
            content: `Are you sure you want to delete ${selectedFollowUpKeys.length} selected follow-up visits?`,
            okText: "Delete All",
            okType: "danger",
            centered: true,
            onOk: async () => {
                try {
                    const token = localStorage.getItem("token");
                    for (const key of selectedFollowUpKeys) {
                        if (key === appointment?.id) continue; // Skip parent
                        await fetch(apiUrl(`/api/appointments/${key}`), {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                    }
                    toast.success("Follow-ups deleted successfully");
                    setSelectedFollowUpKeys([]);
                    refetch();
                } catch (e) {
                    toast.error("Failed to delete some follow-ups");
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="content d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '350px' }}>
                    <span className="spinner-border text-primary" role="status" />
                    <p className="mt-2 text-muted">Loading Clinical Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="page-wrapper">
                <div className="content text-center py-5">
                    <div className="alert alert-danger d-inline-block shadow-sm">
                        {error || "Appointment not found"}
                    </div>
                    <div className="mt-3">
                        <Link to={all_routes.appointments} className="btn btn-primary">
                            Back to Appointments
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const getProfileImage = (img?: string | null, type: 'patient' | 'doctor' = 'patient') => {
        if (!img || img.trim() === "" || img.includes("300x300") || img.includes("placeholder")) {
            return type === 'patient' ? "assets/img/patient-placeholder.png" : "assets/img/doctor-placeholder.png";
        }
        return img;
    };

    const truncateReason = (reason: string | null | undefined) => {
        if (!reason) return "—";
        const words = reason.trim().split(/\s+/);
        if (words.length <= 2) return reason;
        return words.slice(0, 2).join(' ') + '...';
    };

    const columns = [
        {
            title: "Sr No",
            dataIndex: "id",
            render: (_: any, __: any, index: number) => (
                <span className="fw-bold">{String(index + 1).padStart(2, "0")}</span>
            ),
        },
        {
            title: "Prescription ID",
            dataIndex: "prescriptionCode",
            render: (text: any, record: any) => (
                <span className="fw-semibold text-primary cursor-pointer" onClick={() => setSelectedPres(record)} style={{ cursor: "pointer" }}>
                    {text || record.id?.substring(0, 8)}
                </span>
            ),
            sorter: (a: any, b: any) => (a.prescriptionCode || "").localeCompare(b.prescriptionCode || ""),
        },
        {
            title: "Linked Visit",
            dataIndex: "appointmentId",
            render: (apptId: string) => {
                const appt = sortedChain.find(a => a.id === apptId);
                if (!appt) return <span className="text-muted">—</span>;
                const idx = sortedChain.findIndex(a => a.id === apptId);
                const isParent = idx === 0;
                const ordinal = idx;
                const suffix = ordinal === 1 ? 'st' : ordinal === 2 ? 'nd' : ordinal === 3 ? 'rd' : 'th';

                return (
                    <div className="d-flex flex-column">
                        <span className="text-secondary fw-medium fs-12">{appt.appointmentCode || appt.id.substring(0, 8)}</span>
                        {isParent ? (
                            <span className="text-muted fs-10 fw-bold text-uppercase">Parent Visit</span>
                        ) : (
                            <span className="text-primary fs-10 fw-bold text-uppercase">{ordinal}{suffix} Follow-up</span>
                        )}
                    </div>
                );
            }
        },
        {
            title: "Patient",
            dataIndex: "patient",
            render: (_: any, record: any) => (
                <div className="d-flex align-items-center">
                    <div className="avatar avatar-md me-2 bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center">
                        <span className="fw-bold text-primary fs-13">
                            {`${appointment?.patient?.firstName?.[0] || ""}${appointment?.patient?.lastName?.[0] || ""}`}
                        </span>
                    </div>
                    <div>
                        <span className="fw-medium text-dark d-block">
                            {record.patientName || `${appointment?.patient?.firstName || ""} ${appointment?.patient?.lastName || ""}`}
                        </span>
                        <span className="text-muted fs-12">{appointment?.patient?.phone || ""}</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Doctor",
            dataIndex: "doctor",
            render: (_: any, record: any) => (
                <span>{record.doctorName || appointment?.doctor?.fullName || "-"}</span>
            ),
        },
        {
            title: "Medicines",
            dataIndex: "medicines",
            render: (_: any, record: any) => (
                <span className="badge bg-info-subtle text-info-emphasis border border-info">
                    {record.medicines?.length || 0} medicines
                </span>
            ),
        },
        {
            title: "Prescribed On",
            dataIndex: "createdAt",
            render: (text: string) => new Date(text).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
        {
            title: "Action",
            className: "text-center text-nowrap",
            align: 'center',
            width: 130,
            render: (_: any, record: any) => (
                <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
                    <button className="bg-transparent border-0 text-info p-1" onClick={() => { setSelectedPres(record); toast.info("Viewing prescription details"); }} title="View Detail"><i className="ti ti-eye fs-18" /></button>
                    <button className="bg-transparent border-0 text-primary p-1" title="Edit" onClick={() => { setEditingPrescription(record); setShowPresModal(true); }}><i className="ti ti-edit fs-18" /></button>
                    <button className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={() => handleDelete(record.id)}><i className="ti ti-trash fs-18" /></button>
                </div>
            ),
        },
    ];

    const followUpColumns = [
        {
            title: "Sr No",
            dataIndex: "id",
            render: (_: any, __: any, index: number) => (
                <span className="fw-bold">{String(index + 1).padStart(2, "0")}</span>
            ),
        },
        {
            title: "Appointment ID",
            dataIndex: "appointmentCode",
            render: (text: string, record: any, index: number) => {
                const isRoot = !record.parentAppointmentId;
                const isCurrent = record.id === appointment?.id;
                const ordinal = index;
                const suffix = ordinal === 1 ? 'st' : ordinal === 2 ? 'nd' : ordinal === 3 ? 'rd' : 'th';

                return (
                    <div className="d-flex flex-column">
                        <span className={`badge ${isCurrent ? 'bg-primary text-white' : 'badge-soft-info'} fs-12 mb-1`} style={{ width: 'fit-content' }}>
                            {text || record.id?.substring(0, 8)}
                            {isCurrent && <span className="ms-1" style={{ fontSize: '8px' }}>(CURRENT)</span>}
                        </span>
                        {isRoot ? (
                            <span className="text-secondary fs-10 fw-bold text-uppercase tracking-wider">Original Visit</span>
                        ) : (
                            <span className="text-primary fs-10 fw-bold text-uppercase tracking-wider">{ordinal}{suffix} Follow-up</span>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Original Date",
            render: () => {
                const chain = (appointment as any)?.followUpChain;
                const root = chain && chain.length > 0 ? chain[0] : appointment;
                return dayjs(root?.scheduledAt).format('DD MMM YYYY');
            },
        },
        {
            title: "Follow-up Date",
            dataIndex: "scheduledAt",
            render: (text: string, record: any) => (
                record.id !== appointment?.id ?
                    <span className="fw-bold text-primary">{dayjs(text).format('DD MMM YYYY, hh:mm A')}</span> :
                    <span className="text-muted">— (Parent)</span>
            ),
            sorter: (a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        },
        {
            title: "Patient",
            render: () => (
                <span className="fw-medium text-dark">{appointment?.patientName}</span>
            ),
        },
        {
            title: "Doctor",
            render: () => (
                <span>Dr. {appointment?.doctorName}</span>
            ),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            render: (text: string) => (
                <span title={text}>{truncateReason(text || "Initial Visit")}</span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: string) => (
                <span className={`badge ${statusBadgeClass(text)}`}>{text}</span>
            ),
        },
        {
            title: "Follow-up Type",
            dataIndex: "followUpStatus",
            render: (text: string, record: any) => {
                if (record.id === appointment?.id && !record.isFollowUp) return <span className="badge badge-soft-secondary">Standard Visit</span>;
                const status = text || (record.isFollowUp ? "Follow-up" : "Standard");
                const cls = status.includes("Free") ? "badge-soft-success" : "badge-soft-info";
                return <span className={`badge ${cls}`}>{status}</span>;
            }
        },
        {
            title: "Payment Status",
            dataIndex: "paymentStatus",
            render: (text: string, record: any) => {
                if (record.id === appointment?.id && !record.isFollowUp) return <span className="badge badge-soft-light text-dark">N/A</span>;
                const status = text || "Unpaid";
                const cls = status === "Paid" ? "badge-soft-success" : status === "Free" ? "badge-soft-info" : "badge-soft-danger";
                return <span className={`badge ${cls}`}>{status}</span>;
            }
        },
        {
            title: "Action",
            className: "text-center text-nowrap",
            align: 'center',
            width: 130,
            render: (_: any, record: any) => (
                <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
                    <Link to={all_routes.appointmentDetails.replace(":id", record.id)} className="text-info p-1" title="View Details"><i className="ti ti-eye fs-18" /></Link>
                    <button className="bg-transparent border-0 text-primary p-1" title="Edit" onClick={() => toast.warning("Edit functionality coming soon")}><i className="ti ti-edit fs-18" /></button>
                    <button className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={() => handleFollowUpDelete(record.id)}><i className="ti ti-trash fs-18" /></button>
                </div>
            ),
        },
    ];

    return (
        <div className="page-wrapper p-0">
            <div className="content">
                <div className="mb-2">
                    <h6 className="fw-semibold fs-14 mb-0">
                        <Link to={all_routes.appointments}>
                            <i className="ti ti-chevron-left me-1" />
                            Appointments
                        </Link>
                    </h6>
                </div>
                <div className="d-md-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h3 className="fw-bold mb-0">Visit # {appointment.appointmentCode || id?.slice(-6).toUpperCase()}</h3>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 action-buttons-row">
                        {/* Print / Download Dropdown */}
                        <div className="dropdown">
                            <button className="btn btn-outline-light border bg-white text-dark dropdown-toggle d-flex align-items-center gap-2 fw-bold shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="ti ti-printer" /> Print / Download
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark" onClick={() => window.print()}>
                                        <i className="ti ti-printer" /> Print
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark" onClick={handleDownload}>
                                        <i className="ti ti-download" /> Download PDF
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Add Prescription Button */}
                        <button className="btn btn-soft-info d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => { setSelectedPres(null); setEditingPrescription(null); setShowPresModal(true); }}>
                            <i className="ti ti-file-plus" /> Add Prescription
                        </button>

                        {/* Add Note Button */}
                        <button className="btn btn-soft-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
                            <i className="ti ti-notes" /> Add Note
                        </button>

                        {/* Schedule Follow-up Button */}
                        {appointment?.doctor?.followUpEnabled && (
                            <button
                                className="btn btn-soft-success d-flex align-items-center gap-2 fw-bold shadow-sm"
                                onClick={() => setShowFollowUpModal(true)}
                                disabled={appointment.status === "Cancelled"}
                            >
                                <i className="ti ti-calendar-plus" /> Schedule Follow-up
                            </button>
                        )}

                        {/* Edit Button */}
                        <Link to={all_routes.editAppointment.replace(":id", appointment.id)} className="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm">
                            <i className="ti ti-edit" /> Edit
                        </Link>

                        {/* Cancel Appointment Button (Only shown in Confirmed/Schedule status) */}
                        {(appointment.status === "Confirmed" || appointment.status === "Schedule") && (
                            <button className="btn btn-danger d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={handleCancelAppointment}>
                                <i className="ti ti-circle-x" /> Cancel Appointment
                            </button>
                        )}
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    {/* Patient Info */}
                    <div className="col-xl-4 col-lg-4 col-md-6">
                        <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
                            <div className="card-body p-4 position-relative z-index-1" style={{ color: '#000' }}>
                                <div className="d-flex align-items-start gap-3">
                                    <div className="avatar avatar-xxl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                                        <ImageWithBasePath
                                            src={getProfileImage(appointment.patient?.profileImage, 'patient')}
                                            className="rounded-circle img-fluid"
                                            alt="Patient"
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <span className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-1">Patient</span>
                                            <span className="text-black fw-bold fs-11">#{appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <h5 className="fw-bold text-dark mb-2 fs-18">{appointment.patient?.firstName} {appointment.patient?.lastName}</h5>

                                        <div className="d-flex flex-wrap gap-x-3 gap-y-1 mb-3">
                                            <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                                                <i className="ti ti-user fs-14 text-primary" />
                                                <span>{appointment.patient?.gender || "N/A"}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                                                <i className="ti ti-calendar fs-14 text-primary" />
                                                <span>{appointment.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')} Yrs` : "N/A"}</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                                                <i className="ti ti-droplet fs-14 text-danger" />
                                                <span>{appointment.patient?.bloodGroup || "O+"}</span>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-end justify-content-between pt-2">
                                            <div className="flex-grow-1">
                                                <p className="text-black fw-bold fs-13 mb-1 d-flex align-items-center gap-1">
                                                    <i className="ti ti-phone-filled fs-14 text-primary" />
                                                    {appointment.patient?.phone || "N/A"}
                                                </p>
                                                <Link to={all_routes.patientDetails.replace(":id", appointment.patientId)} className="btn btn-soft-primary btn-sm rounded-pill fw-bold px-3 fs-11 d-inline-flex align-items-center gap-1 transition-all">
                                                    History <i className="ti ti-chevron-right fs-12" />
                                                </Link>
                                            </div>
                                            <div className="text-end bg-light p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                                                <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Insurance</p>
                                                <span className="badge bg-soft-success text-success fs-10 fw-bold border-0 p-0 text-uppercase">Verified ✓</span>
                                            </div>
                                        </div>
                                        {(appointment.appointmentType === "Online Booking" || appointment.mode === "Clinic Landing page" || appointment.mode === "Clinic Landing") && (
                                            <div className="mt-3 pt-2 border-top">
                                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", border: "1px solid #c7d2fe" }}>
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 28, height: 28, background: "#4f46e5" }}>
                                                        <i className="ti ti-world text-white" style={{ fontSize: 14 }} />
                                                    </div>
                                                    <div>
                                                        <span className="fw-bold" style={{ fontSize: 12, color: "#1e1b4b", letterSpacing: "0.3px" }}>Booked via </span>
                                                        <span className="fw-bold" style={{ fontSize: 12, color: "#4f46e5", letterSpacing: "0.3px" }}>Clinic Landing</span>
                                                    </div>
                                                    <span className="ms-auto badge rounded-pill px-2 py-1" style={{ background: "#4f46e5", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px" }}>ONLINE</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="card-decoration-circle" />
                        </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="col-xl-4 col-lg-4 col-md-6">
                        <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
                            <div className="card-body p-4 position-relative z-index-1" style={{ color: '#000' }}>
                                <div className="d-flex align-items-start gap-3">
                                    <div className="avatar avatar-xxl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                                        <ImageWithBasePath
                                            src={getProfileImage(appointment.doctor?.profileImage, 'doctor')}
                                            className="rounded-circle img-fluid"
                                            alt="Doctor"
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <span className="badge bg-soft-info text-info fw-bold text-uppercase fs-10 tracking-wider px-2 py-1">Practitioner</span>
                                            <div className="d-flex gap-1 text-warning fs-10">
                                                <i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" />
                                            </div>
                                        </div>
                                        <h5 className="fw-bold text-dark mb-2 fs-18">{appointment.doctor?.fullName}</h5>

                                        <div className="d-flex flex-wrap gap-x-3 gap-y-1 mb-3">
                                            <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                                                <i className="ti ti-briefcase fs-14 text-info" />
                                                <span>{appointment.doctor?.yearOfExperience || "8"}+ Yrs Exp</span>
                                            </div>
                                            <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                                                <i className="ti ti-building fs-14 text-info" />
                                                <span>{appointment.doctor?.department?.name || "General"}</span>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-end justify-content-between pt-2">
                                            <div className="flex-grow-1">
                                                <div className="text-black fw-bold fs-13 mb-1 d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '120px' }}>
                                                    <i className="ti ti-shield-check-filled fs-14 text-info" />
                                                    {appointment.doctor?.designation?.name || "Consultant"}
                                                </div>
                                                <Link to={all_routes.doctorsDetails.replace(":id", appointment.doctorId)} className="btn btn-soft-info btn-sm rounded-pill fw-bold px-3 fs-11 d-inline-flex align-items-center gap-1 transition-all">
                                                    Full Profile <i className="ti ti-chevron-right fs-12" />
                                                </Link>
                                            </div>
                                            <div className="text-end bg-info-soft p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                                                <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Availability</p>
                                                <span className="fs-11 fw-bold text-info d-flex align-items-center gap-1 justify-content-end">
                                                    <span className="pulse-dot-info" /> AVAILABLE
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-decoration-circle bg-info-light" />
                        </div>
                    </div>

                    {/* Slot Details */}
                    <div className="col-xl-4 col-lg-4 col-md-12">
                        <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden bg-white border-primary-light hover-shadow transition-all position-relative">
                            <div className="card-body p-4 position-relative z-index-1">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="d-flex flex-column gap-1">
                                        <div className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-1" style={{ width: 'fit-content' }}>Visit Slot</div>
                                        {appointment.isFollowUp && (
                                            <span className="badge bg-soft-success text-success fw-bold text-uppercase fs-10 tracking-wider px-2 py-1 animate__animated animate__pulse animate__infinite">Follow-up ✓</span>
                                        )}
                                    </div>
                                    <span className={`badge ${statusBadgeClass(appointment.status)} rounded-pill px-3 py-1 fw-bold border-0 fs-11 shadow-xs`}>
                                        {appointment.status}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="avatar avatar-lg bg-soft-primary text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center shadow-xs">
                                        <i className="ti ti-calendar-event fs-24" />
                                    </div>
                                    <div>
                                        <p className="text-muted fs-11 fw-bold text-uppercase mb-0 tracking-wider opacity-75">Date & Visit Type</p>
                                        <h5 className="fw-bold text-dark mb-0 fs-15">
                                            {dayjs(appointment.scheduledAt).format('DD MMM, YYYY')}
                                            <span className="text-primary fs-11 ms-2 fw-medium px-2 py-1 bg-soft-primary rounded-pill">{appointment.appointmentType || "Routine"}</span>
                                        </h5>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="avatar avatar-lg bg-soft-info text-info rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center shadow-xs">
                                        <i className="ti ti-clock-hour-4 fs-24" />
                                    </div>
                                    <div>
                                        <p className="text-muted fs-11 fw-bold text-uppercase mb-0 tracking-wider opacity-75">Scheduled Slot</p>
                                        <h5 className="fw-bold text-dark mb-0 fs-15">{formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt)}</h5>
                                    </div>
                                </div>

                                {/* Expected Time & Check-in / His No. */}
                                <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ti ti-hourglass-low text-warning fs-18" />
                                        <div>
                                            <p className="text-muted mb-0" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Expected Time</p>
                                            <h6 className="fw-bold text-dark mb-0 fs-13">{slotDetails.expectedTime}</h6>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="ti ti-users text-success fs-18" />
                                        <div>
                                            <p className="text-muted mb-0" style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Check-in / His No.</p>
                                            <h6 className="fw-bold text-dark mb-0 fs-13">{slotDetails.checkinHisNo}</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-decoration-circle bg-primary-light-large" />
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <ul className="nav nav-pills nav-pills-primary gap-2 mb-3 bg-white p-2 rounded shadow-sm border" role="tablist">
                            <li className="nav-item border-0">
                                <button className="nav-link active fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#overview" type="button" role="tab">Overview</button>
                            </li>
                            <li className="nav-item border-0">
                                <button className="nav-link fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#prescription" type="button" role="tab">Prescriptions ({linkedPrescriptions.length})</button>
                            </li>

                            <li className="nav-item border-0">
                                <button className="nav-link fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#followup" type="button" role="tab">
                                    Follow-ups {(appointment as any)?.followUpChain?.length > 1 ? `(${(appointment as any).followUpChain.length - 1})` : ""}
                                </button>
                            </li>
                            {isSessionAppointment && (
                                <li className="nav-item border-0">
                                    <button className="nav-link fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#session" type="button" role="tab">
                                        <i className="ti ti-calendar-event me-1" />
                                        Session ({sessionChildren.length}/{totalSessionDays} days)
                                    </button>
                                </li>
                            )}
                        </ul>

                        <div className="tab-content bg-white p-4 rounded shadow-sm border shadow-none">
                            {/* Overview */}
                            <div className="tab-pane fade show active" id="overview" role="tabpanel">
                                <div className="row g-4">
                                    <div className="col-lg-7">
                                        <div className="mb-4">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="fw-bold text-primary mb-0">Reason for Appointment</h6>
                                                <button className="btn btn-soft-primary btn-xs fw-bold shadow-sm" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
                                                    <i className="ti ti-plus me-1" /> Add Note
                                                </button>
                                            </div>
                                            <div className="p-3 bg-light rounded border fs-14 text-dark">
                                                {appointment.reason || "General Check-up / Consultation"}
                                            </div>
                                        </div>
                                        <div className="mb-0">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="fw-bold text-primary mb-0">Physician Notes ({notes.length})</h6>
                                                <button className="btn btn-primary btn-xs fw-bold shadow-sm px-3" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
                                                    <i className="ti ti-plus me-1" /> Add Note
                                                </button>
                                            </div>
                                            <div className="p-0 bg-transparent rounded border-0 fs-14 text-dark min-height-200 shadow-none overflow-auto" style={{ maxHeight: '400px' }}>
                                                {notes.length > 0 ? (
                                                    <div className="d-flex flex-column gap-3">
                                                        {notes.map((note) => (
                                                            <div key={note.id} className="p-3 bg-light rounded border shadow-sm border-start-4 border-start-primary">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <span className="badge bg-soft-primary text-primary px-2 py-1 fs-11">
                                                                        <i className="ti ti-calendar-event me-1" />
                                                                        {dayjs(note.createdAt).format('DD MMM YYYY, hh:mm A')}
                                                                    </span>
                                                                    <span className="text-muted fs-11 fw-medium text-uppercase">Assessment</span>
                                                                </div>
                                                                <div className="white-space-pre-wrap text-dark fs-13 line-height-base italic">
                                                                    "{note.content}"
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-light rounded border text-muted text-center py-5">
                                                        <i className="ti ti-notes fs-30 mb-2 opacity-50" /><br />
                                                        No physician notes recorded yet.<br />
                                                        Click <strong>Add Note</strong> to record findings.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-5">
                                        <h6 className="fw-bold text-primary mb-3 text-uppercase fs-12 letter-spacing-1">Visit Details</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm border-0 mb-0">
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted border-0 py-2 ps-0">Department</td>
                                                        <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.department?.name || "General"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted border-0 py-2 ps-0">Duration</td>
                                                        <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.doctor?.appointmentDuration || 30} Mins</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted border-0 py-2 ps-0">Consultating Mode</td>
                                                        <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.mode}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted border-0 py-2 ps-0">Date Created</td>
                                                        <td className="fw-bold text-dark border-0 py-2 text-end">{dayjs(appointment.createdAt).format('DD MMM YYYY')}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Follow-up Policy Section */}
                                        <div className="mt-4 p-3 bg-primary-subtle rounded-4 border border-dashed border-primary shadow-sm position-relative overflow-hidden">
                                            <div className="position-absolute top-0 end-0 p-2 opacity-10">
                                                <i className="ti ti-calendar-stats fs-40 text-primary" style={{ transform: 'rotate(-15deg)' }} />
                                            </div>
                                            <h6 className="fw-bold text-primary mb-3 text-uppercase fs-12 letter-spacing-1 d-flex align-items-center gap-2">
                                                <i className="ti ti-repeat text-primary fs-14" /> Follow-up Policy
                                            </h6>
                                            <div className="d-flex flex-column gap-2">
                                                <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-light-subtle shadow-xs">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar avatar-xs bg-soft-success text-success rounded-circle d-flex align-items-center justify-content-center">
                                                            <i className="ti ti-currency-rupee fs-12" />
                                                        </div>
                                                        <span className="text-dark fw-medium fs-12">Follow-up Fee</span>
                                                    </div>
                                                    <span className="badge bg-success text-white fw-bold fs-12 px-2">₹{appointment.doctor?.followUpFee || 0}</span>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-light-subtle shadow-xs">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar avatar-xs bg-soft-info text-info rounded-circle d-flex align-items-center justify-content-center">
                                                            <i className="ti ti-calendar fs-12" />
                                                        </div>
                                                        <span className="text-dark fw-medium fs-12">Validity Period</span>
                                                    </div>
                                                    <span className="badge bg-info text-white fw-bold fs-12 px-2">{appointment.doctor?.followUpValidityDays || 0} Days</span>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-light-subtle shadow-xs">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar avatar-xs bg-soft-warning text-warning rounded-circle d-flex align-items-center justify-content-center">
                                                            <i className="ti ti-user-check fs-12" />
                                                        </div>
                                                        <span className="text-dark fw-medium fs-12">Free Limit</span>
                                                    </div>
                                                    <span className="badge bg-warning text-white fw-bold fs-12 px-2">{appointment.doctor?.freeFollowUpLimit || 1} Visits</span>
                                                </div>
                                            </div>

                                            {appointment.doctor?.followUpEnabled ? (
                                                <div className="mt-3 pt-2 text-center border-top border-primary border-opacity-10">
                                                    <div className="d-inline-flex align-items-center gap-1 text-primary fw-bold fs-10 text-uppercase tracking-wider">
                                                        <span className="pulse-dot-primary" /> System Active
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 pt-2 text-center border-top border-primary border-opacity-10">
                                                    <span className="text-muted fw-bold fs-10 text-uppercase tracking-wider opacity-75">System Disabled</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Prescriptions */}
                            <div className="tab-pane fade" id="prescription" role="tabpanel">
                                {!selectedPres ? (
                                    <>
                                        <div className="d-flex align-items-center justify-content-between mb-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <h5 className="fw-bold mb-0 text-dark">Visit Prescriptions</h5>
                                                {selectedPresKeys.length > 0 && (
                                                    <button className="btn btn-soft-danger btn-sm fw-bold d-flex align-items-center gap-1 animate__animated animate__fadeIn" onClick={handleBulkDelete}>
                                                        <i className="ti ti-trash fs-14" /> Delete Selected ({selectedPresKeys.length})
                                                    </button>
                                                )}
                                            </div>
                                            <button className="btn btn-primary btn-sm fw-bold shadow-sm" onClick={() => { setShowPresModal(true); toast.info("Opening prescription form"); }}>
                                                <i className="ti ti-plus me-1" /> Add Prescription
                                            </button>
                                        </div>

                                        {linkedPrescriptions.length > 0 ? (
                                            <div className="table-responsive">
                                                <Datatable
                                                    columns={columns}
                                                    dataSource={linkedPrescriptions}
                                                    Selection={true}
                                                    onSelectionChange={(keys) => setSelectedPresKeys(keys)}
                                                    searchText=""
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center py-5 border rounded bg-light">
                                                <i className="ti ti-prescription fs-36 text-muted opacity-50 mb-2" /><br />
                                                <span className="text-muted fs-14">No prescriptions linked to this visit.</span><br />
                                                <button className="btn btn-primary btn-sm fw-bold mt-3 shadow-sm" onClick={() => setShowPresModal(true)}>
                                                    <i className="ti ti-plus me-1" /> Create First Prescription
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="d-flex align-items-center justify-content-between mb-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <button className="btn btn-sm btn-icon btn-light" onClick={() => setSelectedPres(null)}>
                                                    <i className="ti ti-chevron-left" />
                                                </button>
                                                <h5 className="fw-bold mb-0 text-dark">Visit Prescriptions</h5>
                                            </div>
                                            <button className="btn btn-primary btn-sm fw-bold shadow-sm" onClick={() => setShowPresModal(true)}>
                                                <i className="ti ti-plus me-1" /> Add Prescription
                                            </button>
                                        </div>

                                        <div className="card shadow-sm border rounded-4 mt-2">
                                            <div className="card-body">
                                                {/* Clinic + Doctor Info */}
                                                <div className="header-banner d-flex align-items-center justify-content-between flex-wrap gap-2 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", padding: "24px", borderRadius: "8px", marginBottom: "25px" }}>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="logo-box" style={{ width: 70, height: 70, background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
                                                            <img src={resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png'} alt="logo" style={{ maxHeight: 55, maxWidth: 55, objectFit: 'contain' }} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white fw-bold mb-1" style={{ fontSize: "22px" }}>{(appointment as any)?.clinic?.name || (appointment as any)?.clinicName || "Preclinic Central"}</h4>
                                                            <p className="mb-2 text-white opacity-90 fs-13 d-flex align-items-center gap-1">
                                                                <i className="ti ti-map-pin" />
                                                                {(appointment as any)?.clinic
                                                                    ? [(appointment as any).clinic.addressLine1, (appointment as any).clinic.addressLine2, (appointment as any).clinic.city].filter(Boolean).join(", ")
                                                                    : (appointment as any)?.location || "City Med Tower, 4F"}
                                                            </p>
                                                            <h6 className="text-white mb-1 fw-bold">{appointment.doctorName || appointment.doctor?.fullName || "-"}</h6>
                                                            <p className="mb-0 text-white opacity-90 fs-13">
                                                                {appointment?.doctor?.designation?.name || ""}{appointment?.doctor?.department?.name ? ` · ${appointment.doctor.department.name}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-lg-end text-white">
                                                        <div className="mb-2">
                                                            <span className="badge bg-white text-primary fw-bold py-1 px-3 fs-13" style={{ borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                                {selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                                                            </span>
                                                        </div>
                                                        <p className="text-white mb-1 fw-semibold opacity-90">
                                                            Department: <span className="text-white fw-bold">{appointment?.doctor?.department?.name || "-"}</span>
                                                        </p>
                                                        <p className="text-white mb-1 fw-semibold opacity-90">
                                                            Prescribed on: <span className="text-white fw-bold">
                                                                {new Date(selectedPres.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                            </span>
                                                        </p>
                                                        {selectedPres.followUpDate && (
                                                            <p className="text-white mb-0 fw-semibold opacity-90">
                                                                Follow Up: <span className="text-white fw-bold">
                                                                    {new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Patient Details */}
                                                <div className="mb-4">
                                                    <h6 className="section-title" style={{ fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '15px', fontSize: '12px', color: '#0f172a', letterSpacing: '0.5px' }}>Patient Clinical Profile</h6>
                                                    <table className="table table-bordered mb-0">
                                                        <thead style={{ backgroundColor: "#0f172a" }}>
                                                            <tr>
                                                                <th className="text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>PATIENT NAME</th>
                                                                <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>AGE / GENDER</th>
                                                                <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>BLOOD GROUP</th>
                                                                <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>PATIENT ID</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td className="text-primary" style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a8a", padding: "12px 10px" }}>{appointment?.patient?.firstName} {appointment?.patient?.lastName}</td>
                                                                <td className="text-center" style={{ padding: "12px 10px" }}>{appointment?.patient?.dob ? Math.floor((Date.now() - new Date(appointment?.patient?.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '--'}Y / {appointment?.patient?.gender || "—"}</td>
                                                                <td className="text-center" style={{ padding: "12px 10px" }}>{appointment?.patient?.bloodGroup || 'N/A'}</td>
                                                                <td className="text-center" style={{ padding: "12px 10px" }}>{appointment?.patient?.patientCode || appointment?.patientId?.slice(-6).toUpperCase()}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="text-center mb-4 pt-3">
                                                    <h5 className="fw-bold text-dark text-uppercase tracking-wider" style={{ borderBottom: '3px solid #0f172a', display: 'inline-block', paddingBottom: '8px' }}>
                                                        Prescription Details
                                                    </h5>
                                                </div>

                                                {/* Medicines Table */}
                                                <div className="mb-4">
                                                    <h6 className="section-title" style={{ fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '15px', fontSize: '12px', color: '#0f172a', letterSpacing: '0.5px' }}>Medicines Details</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered mb-0">
                                                            <thead style={{ backgroundColor: "#0f172a" }}>
                                                                <tr>
                                                                    <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>S.NO</th>
                                                                    <th className="text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>Medicine Name</th>
                                                                    <th className="text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>Dosage</th>
                                                                    <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>Frequency</th>
                                                                    <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>Duration</th>
                                                                    <th className="text-center text-white" style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "12px", padding: "12px 10px" }}>Timings</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedPres.medicines && selectedPres.medicines.length > 0 ? selectedPres.medicines.map((med: any, i: number) => (
                                                                    <tr key={med.id || i}>
                                                                        <td className="text-center text-muted" style={{ padding: "12px 10px" }}>{String(i + 1).padStart(2, "0")}</td>
                                                                        <td className="text-primary" style={{ fontWeight: 700, color: "#1e3a8a", padding: "12px 10px" }}>{med.medicineName}</td>
                                                                        <td style={{ padding: "12px 10px" }}>{med.dosage || "—"}</td>
                                                                        <td className="text-center" style={{ padding: "12px 10px" }}>{med.frequency || "—"}</td>
                                                                        <td className="text-center" style={{ padding: "12px 10px" }}>{med.duration || "—"}</td>
                                                                        <td className="text-center" style={{ padding: "12px 10px" }}>{med.timings || "—"}</td>
                                                                    </tr>
                                                                )) : (
                                                                    <tr>
                                                                        <td colSpan={6} className="text-center text-muted py-3">No medicines added</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Advice */}
                                                {selectedPres.advice && (
                                                    <div className="pb-3 mb-3 border-bottom">
                                                        <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
                                                        <p className="mb-0">{selectedPres.advice}</p>
                                                    </div>
                                                )}

                                                {/* Follow Up */}
                                                <div className="pb-3 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                    <div>
                                                        <h6 className="mb-1 fs-14 fw-semibold text-uppercase tracking-wider opacity-75 text-secondary">Follow Up</h6>
                                                        <p className="mb-0 fw-bold">
                                                            {selectedPres.followUpDate
                                                                ? new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                                                                : "—"}
                                                            {selectedPres.followUpNotes ? ` · ${selectedPres.followUpNotes}` : ""}
                                                        </p>
                                                    </div>
                                                    <div className="text-end">
                                                        <h6 className="fs-14 fw-semibold mb-0">{appointment?.doctorName || appointment?.doctor?.fullName || "—"}</h6>
                                                        <p className="fs-13 fw-normal text-muted mb-0">{appointment?.doctor?.designation?.name || ""}</p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="text-center d-flex align-items-center justify-content-center gap-2 mt-4">
                                                    <button onClick={() => {
                                                        const printWindow = window.open('', '_blank');
                                                        if (!printWindow || !appointment) return;
                                                        const medicinesHtml = selectedPres.medicines && selectedPres.medicines.length > 0
                                                            ? selectedPres.medicines.map((med: any, i: number) => `
                                                                <tr>
                                                                    <td class="text-center text-muted">${String(i + 1).padStart(2, "0")}</td>
                                                                    <td class="text-primary" style="font-weight: 700;">${med.medicineName}</td>
                                                                    <td>${med.dosage || "—"}</td>
                                                                    <td class="text-center">${med.frequency || "—"}</td>
                                                                    <td class="text-center">${med.duration || "—"}</td>
                                                                    <td class="text-center">${med.timings || "—"}</td>
                                                                </tr>
                                                            `).join('')
                                                            : `<tr><td colspan="6" class="text-center text-muted">No medicines added</td></tr>`;

                                                        const logoSrc = resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png';
                                                        const clinicName = (appointment as any)?.clinic?.name || (appointment as any)?.clinicName || "Preclinic Central";
                                                        const clinicAddress = (appointment as any)?.clinic
                                                            ? [(appointment as any).clinic.addressLine1, (appointment as any).clinic.addressLine2, (appointment as any).clinic.city].filter(Boolean).join(", ")
                                                            : (appointment as any)?.location || "City Med Tower, 4F";

                                                        const html = `<html>
                                                            <head>
                                                              <title>Prescription Summary - ${selectedPres.prescriptionCode || 'Record'}</title>
                                                              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
                                                              <style>
                                                                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                                                body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                                                                .header-banner {
                                                                  background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                                  color: #ffffff !important;
                                                                  padding: 24px !important;
                                                                  border-radius: 8px !important;
                                                                  margin-bottom: 25px !important;
                                                                  display: flex;
                                                                  justify-content: space-between;
                                                                  align-items: center;
                                                                  -webkit-print-color-adjust: exact;
                                                                  print-color-adjust: exact;
                                                                }
                                                                .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                                                                .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                                                                .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                                                                .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                                                                .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
                                                                
                                                                /* Dark Styled Tables */
                                                                .table-bordered { border: 2px solid #0f172a !important; }
                                                                .table-bordered th { 
                                                                  background-color: #0f172a !important; 
                                                                  color: #ffffff !important; 
                                                                  border: 2px solid #0f172a !important; 
                                                                  font-weight: 700; 
                                                                  font-size: 12px; 
                                                                  letter-spacing: 0.5px; 
                                                                  padding: 12px 10px !important;
                                                                  -webkit-print-color-adjust: exact;
                                                                  print-color-adjust: exact;
                                                                }
                                                                .table-bordered td { border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; font-size: 13px; padding: 12px 10px !important; }
                                                                
                                                                .text-primary { color: #1e3a8a !important; }
                                                                .clinical-findings { border: 2px solid #0f172a !important; padding: 20px; background: #f8fafc; min-height: 120px; line-height: 1.6; font-size: 13px; color: #000000 !important; font-weight: 500; border-radius: 6px; }
                                                                @media print { 
                                                                  .no-print { display: none; } 
                                                                  body { padding: 0; }
                                                                  .header-banner {
                                                                    background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                    print-color-adjust: exact;
                                                                  }
                                                                  .table-bordered th {
                                                                    background-color: #0f172a !important;
                                                                    color: #ffffff !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                    print-color-adjust: exact;
                                                                  }
                                                                }
                                                              </style>
                                                            </head>
                                                            <body>
                                                              <div class="header-banner">
                                                                <div class="d-flex align-items-center gap-3">
                                                                  <div class="logo-box">
                                                                    <img src="${logoSrc}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
                                                                  </div>
                                                                  <div>
                                                                    <h4>${clinicName}</h4>
                                                                    <p><i class="ti ti-map-pin"></i> ${clinicAddress}</p>
                                                                    <h6>${appointment.doctorName || appointment.doctor?.fullName}</h6>
                                                                    <p>${appointment.doctor?.designation?.name || "Consultant"} · ${appointment.doctor?.department?.name || "Medicine"}</p>
                                                                  </div>
                                                                </div>
                                                                <div class="text-end text-white">
                                                                  <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                                    ${selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                                                                  </span>
                                                                  <div class="small mt-1 opacity-90">
                                                                    <div class="mb-1"><strong>Dept:</strong> ${appointment.doctor?.department?.name || "General"}</div>
                                                                    <div><strong>Date:</strong> ${new Date(selectedPres.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                                  </div>
                                                                </div>
                                                              </div>

                                                              <div class="mb-4">
                                                                <h6 class="section-title">Patient Clinical Profile</h6>
                                                                <table class="table table-bordered mb-0">
                                                                  <thead>
                                                                    <tr>
                                                                      <th class="text-white">PATIENT NAME</th>
                                                                      <th class="text-center text-white">AGE / GENDER</th>
                                                                      <th class="text-center text-white">BLOOD GROUP</th>
                                                                      <th class="text-center text-white">PATIENT ID</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    <tr>
                                                                      <td class="text-primary" style="font-size: 15px; font-weight: 700;">${appointment.patient?.firstName} ${appointment.patient?.lastName}</td>
                                                                      <td class="text-center">${appointment.patient?.dob ? Math.floor((new Date().getTime() - new Date(appointment.patient.dob).getTime()) / 31557600000) : '--'}Y / ${appointment.patient?.gender || '--'}</td>
                                                                      <td class="text-center">${appointment.patient?.bloodGroup || 'N/A'}</td>
                                                                      <td class="text-center">${appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </div>

                                                              <div class="text-center mb-4 pt-3">
                                                                <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #0f172a; display: inline-block; padding-bottom: 8px;">
                                                                  Prescription Summary
                                                                </h5>
                                                              </div>

                                                              <div class="mb-4">
                                                                <h6 class="section-title">Medicines Details</h6>
                                                                <table class="table table-bordered mb-0">
                                                                  <thead>
                                                                    <tr>
                                                                      <th class="text-center text-white">S.NO</th>
                                                                      <th class="text-white">Medicine Name</th>
                                                                      <th class="text-white">Dosage</th>
                                                                      <th class="text-center text-white">Frequency</th>
                                                                      <th class="text-center text-white">Duration</th>
                                                                      <th class="text-center text-white">Timings</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    ${medicinesHtml}
                                                                  </tbody>
                                                                </table>
                                                              </div>

                                                              ${selectedPres.advice ? `
                                                              <div class="mb-4">
                                                                <h6 class="section-title">Advice / Instructions</h6>
                                                                <div class="clinical-findings">
                                                                  ${selectedPres.advice}
                                                                </div>
                                                              </div>
                                                              ` : ''}

                                                              <div class="pb-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-5">
                                                                <div>
                                                                    <h6 class="mb-1 fs-14 fw-semibold text-uppercase tracking-wider opacity-75 text-secondary">Follow Up</h6>
                                                                    <p class="mb-0 fw-bold">
                                                                        ${selectedPres.followUpDate
                                                                ? new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                                                                : "—"}
                                                                        ${selectedPres.followUpNotes ? ` · ${selectedPres.followUpNotes}` : ""}
                                                                    </p>
                                                                </div>
                                                                <div class="text-end">
                                                                    <h6 class="fs-14 fw-bold mb-0">${appointment.doctorName || appointment.doctor?.fullName || "—"}</h6>
                                                                    <p class="fs-13 fw-normal text-muted mb-0">${appointment.doctor?.designation?.name || ""}</p>
                                                                </div>
                                                              </div>

                                                              <div class="mt-auto pt-4 border-top text-center text-muted small">
                                                                <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #1e3a8a;">Docyari</span>, All Rights Reserved</p>
                                                                <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated prescription summary and does not require a physical signature.</p>
                                                              </div>

                                                              <script>
                                                                window.onload = () => {
                                                                  setTimeout(() => { window.print(); window.close(); }, 500);
                                                                };
                                                              </script>
                                                            </body>
                                                          </html>`;

                                                        printWindow.document.write(html);
                                                        printWindow.document.close();
                                                    }} className="btn btn-md btn-dark d-flex align-items-center">
                                                        <i className="ti ti-printer me-1" /> Print
                                                    </button>
                                                    <button onClick={() => {
                                                        const printWindow = window.open('', '_blank');
                                                        if (!printWindow || !appointment) return;
                                                        const medicinesHtml = selectedPres.medicines && selectedPres.medicines.length > 0
                                                            ? selectedPres.medicines.map((med: any, i: number) => `
                                                                <tr>
                                                                    <td class="text-center text-muted">${String(i + 1).padStart(2, "0")}</td>
                                                                    <td class="text-primary" style="font-weight: 700;">${med.medicineName}</td>
                                                                    <td>${med.dosage || "—"}</td>
                                                                    <td class="text-center">${med.frequency || "—"}</td>
                                                                    <td class="text-center">${med.duration || "—"}</td>
                                                                    <td class="text-center">${med.timings || "—"}</td>
                                                                </tr>
                                                            `).join('')
                                                            : `<tr><td colspan="6" class="text-center text-muted">No medicines added</td></tr>`;

                                                        const logoSrc = resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png';
                                                        const clinicName = (appointment as any)?.clinic?.name || (appointment as any)?.clinicName || "Preclinic Central";
                                                        const clinicAddress = (appointment as any)?.clinic
                                                            ? [(appointment as any).clinic.addressLine1, (appointment as any).clinic.addressLine2, (appointment as any).clinic.city].filter(Boolean).join(", ")
                                                            : (appointment as any)?.location || "City Med Tower, 4F";

                                                        const html = `<html>
                                                            <head>
                                                              <title>Prescription Summary - ${selectedPres.prescriptionCode || 'Record'}</title>
                                                              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
                                                              <style>
                                                                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                                                body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                                                                .header-banner {
                                                                  background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                                  color: #ffffff !important;
                                                                  padding: 24px !important;
                                                                  border-radius: 8px !important;
                                                                  margin-bottom: 25px !important;
                                                                  display: flex;
                                                                  justify-content: space-between;
                                                                  align-items: center;
                                                                  -webkit-print-color-adjust: exact;
                                                                  print-color-adjust: exact;
                                                                }
                                                                .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                                                                .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                                                                .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                                                                .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                                                                .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
                                                                
                                                                /* Dark Styled Tables */
                                                                .table-bordered { border: 2px solid #0f172a !important; }
                                                                .table-bordered th { 
                                                                  background-color: #0f172a !important; 
                                                                  color: #ffffff !important; 
                                                                  border: 2px solid #0f172a !important; 
                                                                  font-weight: 700; 
                                                                  font-size: 12px; 
                                                                  letter-spacing: 0.5px; 
                                                                  padding: 12px 10px !important;
                                                                  -webkit-print-color-adjust: exact;
                                                                  print-color-adjust: exact;
                                                                }
                                                                .table-bordered td { border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; font-size: 13px; padding: 12px 10px !important; }
                                                                
                                                                .text-primary { color: #1e3a8a !important; }
                                                                .clinical-findings { border: 2px solid #0f172a !important; padding: 20px; background: #f8fafc; min-height: 120px; line-height: 1.6; font-size: 13px; color: #000000 !important; font-weight: 500; border-radius: 6px; }
                                                                @media print { 
                                                                  .no-print { display: none; } 
                                                                  body { padding: 0; }
                                                                  .header-banner {
                                                                    background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                    print-color-adjust: exact;
                                                                  }
                                                                  .table-bordered th {
                                                                    background-color: #0f172a !important;
                                                                    color: #ffffff !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                    print-color-adjust: exact;
                                                                  }
                                                                }
                                                              </style>
                                                            </head>
                                                            <body>
                                                              <div class="header-banner">
                                                                <div class="d-flex align-items-center gap-3">
                                                                  <div class="logo-box">
                                                                    <img src="${logoSrc}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
                                                                  </div>
                                                                  <div>
                                                                    <h4>${clinicName}</h4>
                                                                    <p><i class="ti ti-map-pin"></i> ${clinicAddress}</p>
                                                                    <h6>${appointment.doctorName || appointment.doctor?.fullName}</h6>
                                                                    <p>${appointment.doctor?.designation?.name || "Consultant"} · ${appointment.doctor?.department?.name || "Medicine"}</p>
                                                                  </div>
                                                                </div>
                                                                <div class="text-end text-white">
                                                                  <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                                    ${selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                                                                  </span>
                                                                  <div class="small mt-1 opacity-90">
                                                                    <div class="mb-1"><strong>Dept:</strong> ${appointment.doctor?.department?.name || "General"}</div>
                                                                    <div><strong>Date:</strong> ${new Date(selectedPres.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                                  </div>
                                                                </div>
                                                              </div>

                                                              <div class="mb-4">
                                                                <h6 class="section-title">Patient Clinical Profile</h6>
                                                                <table class="table table-bordered mb-0">
                                                                  <thead>
                                                                    <tr>
                                                                      <th class="text-white">PATIENT NAME</th>
                                                                      <th class="text-center text-white">AGE / GENDER</th>
                                                                      <th class="text-center text-white">BLOOD GROUP</th>
                                                                      <th class="text-center text-white">PATIENT ID</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    <tr>
                                                                      <td class="text-primary" style="font-size: 15px; font-weight: 700;">${appointment.patient?.firstName} ${appointment.patient?.lastName}</td>
                                                                      <td class="text-center">${appointment.patient?.dob ? Math.floor((new Date().getTime() - new Date(appointment.patient.dob).getTime()) / 31557600000) : '--'}Y / ${appointment.patient?.gender || '--'}</td>
                                                                      <td class="text-center">${appointment.patient?.bloodGroup || 'N/A'}</td>
                                                                      <td class="text-center">${appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </div>

                                                              <div class="text-center mb-4 pt-3">
                                                                <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #0f172a; display: inline-block; padding-bottom: 8px;">
                                                                  Prescription Summary
                                                                </h5>
                                                              </div>

                                                              <div class="mb-4">
                                                                <h6 class="section-title">Medicines Details</h6>
                                                                <table class="table table-bordered mb-0">
                                                                  <thead>
                                                                    <tr>
                                                                      <th class="text-center text-white">S.NO</th>
                                                                      <th class="text-white">Medicine Name</th>
                                                                      <th class="text-white">Dosage</th>
                                                                      <th class="text-center text-white">Frequency</th>
                                                                      <th class="text-center text-white">Duration</th>
                                                                      <th class="text-center text-white">Timings</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    ${medicinesHtml}
                                                                  </tbody>
                                                                </table>
                                                              </div>

                                                              ${selectedPres.advice ? `
                                                              <div class="mb-4">
                                                                <h6 class="section-title">Advice / Instructions</h6>
                                                                <div class="clinical-findings">
                                                                  ${selectedPres.advice}
                                                                </div>
                                                              </div>
                                                              ` : ''}

                                                              <div class="pb-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-5">
                                                                <div>
                                                                    <h6 class="mb-1 fs-14 fw-semibold text-uppercase tracking-wider opacity-75 text-secondary">Follow Up</h6>
                                                                    <p class="mb-0 fw-bold">
                                                                        ${selectedPres.followUpDate
                                                                ? new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                                                                : "—"}
                                                                        ${selectedPres.followUpNotes ? ` · ${selectedPres.followUpNotes}` : ""}
                                                                    </p>
                                                                </div>
                                                                <div class="text-end">
                                                                    <h6 class="fs-14 fw-bold mb-0">${appointment.doctorName || appointment.doctor?.fullName || "—"}</h6>
                                                                    <p class="fs-13 fw-normal text-muted mb-0">${appointment.doctor?.designation?.name || ""}</p>
                                                                </div>
                                                              </div>

                                                              <div class="mt-auto pt-4 border-top text-center text-muted small">
                                                                <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #1e3a8a;">Docyari</span>, All Rights Reserved</p>
                                                                <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated prescription summary and does not require a physical signature.</p>
                                                              </div>

                                                              <script>
                                                                window.onload = () => {
                                                                  setTimeout(() => { window.print(); window.close(); }, 500);
                                                                };
                                                              </script>
                                                            </body>
                                                          </html>`;

                                                        printWindow.document.write(html);
                                                        printWindow.document.close();
                                                    }} className="btn btn-md btn-primary d-flex align-items-center">
                                                        <i className="ti ti-download me-1" /> Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>



                            {/* Follow-up Tab */}
                            <div className="tab-pane fade" id="followup" role="tabpanel">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <h5 className="fw-bold mb-0 text-dark">Follow-up Chain</h5>
                                        {selectedFollowUpKeys.length > 0 && (
                                            <button className="btn btn-soft-danger btn-sm fw-bold d-flex align-items-center gap-1 animate__animated animate__fadeIn" onClick={handleFollowUpBulkDelete}>
                                                <i className="ti ti-trash fs-14" /> Delete Selected ({selectedFollowUpKeys.length})
                                            </button>
                                        )}
                                    </div>
                                    {appointment?.doctor?.followUpEnabled && (
                                        <button className="btn btn-primary btn-sm fw-bold shadow-sm" onClick={() => setShowFollowUpModal(true)}>
                                            <i className="ti ti-plus me-1" /> Schedule Follow-up
                                        </button>
                                    )}
                                </div>

                                {appointment?.parentAppointment && (
                                    <div className="alert alert-info border-dashed d-flex align-items-center gap-2 mb-4 bg-info-subtle text-info-emphasis shadow-sm">
                                        <i className="ti ti-info-circle fs-18" />
                                        <div>
                                            This visit is a follow-up for appointment
                                            <Link to={all_routes.appointmentDetails.replace(":id", appointment.parentAppointment.id)} className="fw-bold text-decoration-underline ms-1">
                                                {appointment.parentAppointment.appointmentCode || "View Original"}
                                            </Link>
                                            on {dayjs(appointment.parentAppointment.scheduledAt).format('DD MMM YYYY')}.
                                        </div>
                                    </div>
                                )}

                                <div className="p-0 border-0 bg-transparent">
                                    <Datatable
                                        columns={followUpColumns}
                                        dataSource={(appointment as any)?.followUpChain || (appointment ? [appointment, ...(appointment.followUps || [])] : [])}
                                        Selection={true}
                                        onSelectionChange={(keys) => setSelectedFollowUpKeys(keys)}
                                        searchText=""
                                    />
                                </div>
                            </div>

                            {/* Session Appointments Tab */}
                            {isSessionAppointment && (
                                <div className="tab-pane fade" id="session" role="tabpanel">
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <h5 className="fw-bold mb-0 text-dark">
                                                    <i className="ti ti-calendar-event me-2 text-primary" />
                                                    Session Appointments
                                                </h5>
                                                <span className="badge bg-primary fs-12 fw-bold px-3 py-1">
                                                    {sessionChildren.length} / {totalSessionDays} Days
                                                </span>
                                            </div>
                                        </div>

                                        {/* Services Info */}
                                        <div className="card border mb-4 shadow-sm">
                                            <div className="card-header bg-light py-2 px-3">
                                                <h6 className="fw-bold mb-0 fs-13 text-uppercase text-muted">
                                                    <i className="ti ti-medical-cross me-1" /> Selected Services
                                                </h6>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-borderless table-hover mb-0">
                                                        <thead className="bg-light">
                                                            <tr>
                                                                <th className="fw-bold fs-12 text-muted py-2 px-3">Service</th>
                                                                <th className="fw-bold fs-12 text-muted py-2 px-3">Duration</th>
                                                                <th className="fw-bold fs-12 text-muted py-2 px-3">Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sessionServices.map((s) => (
                                                                <tr key={s.id}>
                                                                    <td className="fw-bold fs-13 py-2 px-3">{s.serviceName}</td>
                                                                    <td className="fs-13 py-2 px-3">{s.duration || '—'}</td>
                                                                    <td className="fs-13 py-2 px-3">₹{s.price || 0}</td>
                                                                </tr>
                                                            ))}
                                                            <tr className="border-top">
                                                                <td className="fw-bold fs-13 py-2 px-3 text-primary">Total</td>
                                                                <td className="fw-bold fs-13 py-2 px-3 text-primary">{totalSessionDays} Days</td>
                                                                <td className="fw-bold fs-13 py-2 px-3 text-primary">₹{sessionServices.reduce((sum, s) => sum + (s.price || 0), 0)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Session Timeline */}
                                        <div className="card border shadow-sm">
                                            <div className="card-header bg-light py-2 px-3 d-flex justify-content-between align-items-center">
                                                <h6 className="fw-bold mb-0 fs-13 text-uppercase text-muted">
                                                    <i className="ti ti-list me-1" /> Daily Appointments
                                                </h6>
                                                {sessionChildren.length < totalSessionDays && appointment?.status === 'Schedule' && (
                                                    <span className="badge bg-warning text-dark fs-11">
                                                        <i className="ti ti-alert-triangle me-1" />
                                                        Confirm this appointment to generate all {totalSessionDays} daily sessions
                                                    </span>
                                                )}
                                            </div>
                                            <div className="card-body p-0">
                                                {sessionChildren.length === 0 ? (
                                                    <div className="text-center py-5 text-muted">
                                                        <i className="ti ti-calendar-off fs-30 mb-2 opacity-50" /><br />
                                                        No session appointments created yet.<br />
                                                        <span className="fs-12">Confirm this appointment to automatically create {totalSessionDays} daily sessions.</span>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover mb-0">
                                                            <thead className="bg-light">
                                                                <tr>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">S.No.</th>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">Day</th>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">Date</th>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">Code</th>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">Status</th>
                                                                    <th className="fw-bold fs-12 text-muted py-2 px-3">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sessionChildren.map((child, idx) => (
                                                                    <tr key={child.id} className={child.id === appointment?.id ? 'bg-primary-subtle' : ''}>
                                                                        <td className="fs-13 py-2 px-3">{idx + 1}</td>
                                                                        <td className="fw-bold fs-13 py-2 px-3">
                                                                            Day {idx + 1}
                                                                        </td>
                                                                        <td className="fs-13 py-2 px-3">
                                                                            {dayjs(child.scheduledAt).format('DD MMM YYYY')}
                                                                            <span className="text-muted ms-1 fs-11">
                                                                                ({dayjs(child.scheduledAt).format('dddd')})
                                                                            </span>
                                                                        </td>
                                                                        <td className="fw-bold fs-13 py-2 px-3 text-primary">
                                                                            {child.appointmentCode || '—'}
                                                                        </td>
                                                                        <td className="py-2 px-3">
                                                                            <span className={`badge ${statusBadgeClass(child.status)} fw-bold fs-11`}>
                                                                                {child.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3">
                                                                            <Link
                                                                                to={all_routes.appointmentDetails.replace(':id', child.id)}
                                                                                className="btn btn-sm btn-soft-primary fw-bold fs-11 px-2 py-1"
                                                                            >
                                                                                <i className="ti ti-eye me-1" /> View
                                                                            </Link>
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showPresModal && appointment && (
                <AddPrescriptionModal
                    onClose={() => { setShowPresModal(false); setEditingPrescription(null); }}
                    onSubmit={handlePresSubmit}
                    initialPatientId={appointment.patientId}
                    initialDoctorId={appointment.doctorId}
                    initialAppointmentId={appointment.id}
                    linkedAppointments={chainAppointments}
                    initialPrescription={editingPrescription}
                />
            )}

            {/* Follow-up Modal */}
            {showFollowUpModal && (
                <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowFollowUpModal(false)} />
                    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
                        <div className="modal-content border-0 shadow-lg animate__animated animate__zoomIn animate__faster">
                            <div className="modal-header bg-primary text-white py-3 px-4">
                                <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center">
                                    <i className="ti ti-calendar-event me-2 fs-20" />
                                    Schedule Follow-up Visit
                                </h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowFollowUpModal(false)} />
                            </div>
                            <div className="modal-body p-4">
                                <div className="alert bg-success-subtle border-dashed border-success mb-4 fs-13 text-success-emphasis py-3 px-4 rounded-3 shadow-sm">
                                    <div className="d-flex align-items-start gap-3">
                                        <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center mt-1" style={{ width: '32px', height: '32px' }}>
                                            <i className="ti ti-info-circle fs-18" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold mb-1 fs-14">Follow-up Policy for Dr. {appointment?.doctor?.fullName}</div>
                                            <p className="mb-0 opacity-90">
                                                Offers <strong>{appointment?.doctor?.freeFollowUpLimit === 0 ? 'Unlimited' : appointment?.doctor?.freeFollowUpLimit}</strong> free visits
                                                within <strong>{appointment?.doctor?.followUpValidityDays}</strong> days.
                                            </p>
                                            {(chainAppointments?.length || 0) >= (appointment?.doctor?.freeFollowUpLimit || 0) && appointment?.doctor?.freeFollowUpLimit !== 0 ? (
                                                <div className="mt-2 text-danger fw-heavy d-flex align-items-center gap-1">
                                                    <i className="ti ti-alert-triangle" /> Note: Free limit reached. Marked as PAID (₹{appointment?.doctor?.followUpFee}).
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-success fw-heavy d-flex align-items-center gap-1">
                                                    <i className="ti ti-gift" /> This visit qualifies as a FREE follow-up.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                <i className="ti ti-calendar-check me-1 text-primary" /> Select Date
                                            </label>
                                            <DatePicker
                                                format="YYYY-MM-DD"
                                                className="form-control py-2 fs-14 border-primary-light"
                                                value={followUpDate}
                                                onChange={(d) => { setFollowUpDate(d); setFollowUpTimeSlot(null); }}
                                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                getPopupContainer={(trigger) => trigger.parentElement!}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                <i className="ti ti-clock-hour-4 me-1 text-primary" /> Select Shift
                                            </label>
                                            <CommonSelect
                                                options={sessionOptions}
                                                value={sessionOptions.find((o: any) => o.value === followUpTimeSlot)}
                                                onChange={(opt: any) => setFollowUpTimeSlot(opt?.value)}
                                                placeholder={followUpDate ? "Choose slot" : "Select date first"}
                                                isDisabled={!followUpDate || sessionOptions.length === 0}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                <i className="ti ti-chart-bar me-1 text-primary" /> Appointment Status
                                            </label>
                                            <CommonSelect
                                                options={APPOINTMENT_STATUS_OPTIONS}
                                                value={APPOINTMENT_STATUS_OPTIONS.find((o: any) => o.value === followUpStatus)}
                                                onChange={(opt: any) => setFollowUpStatus(opt?.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-0">
                                            <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                <i className="ti ti-coin me-1 text-primary" /> Payment Status
                                            </label>
                                            <CommonSelect
                                                options={[
                                                    { value: "Free", label: "Free" },
                                                    { value: "Paid", label: "Paid" },
                                                    { value: "Unpaid", label: "Unpaid" },
                                                ]}
                                                value={{ value: followUpPayment, label: followUpPayment }}
                                                onChange={(opt: any) => setFollowUpPayment(opt?.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-0">
                                    <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                        <i className="ti ti-message-2 me-1 text-primary" /> Follow-up Reason
                                    </label>
                                    <textarea
                                        className="form-control fs-14 p-3 border-primary-light bg-light-subtle"
                                        rows={3}
                                        placeholder="e.g. Review blood report, Routine check-up..."
                                        value={followUpReason}
                                        onChange={(e) => setFollowUpReason(e.target.value)}
                                        style={{ borderRadius: '8px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer bg-light p-3 border-top-0 rounded-bottom-4">
                                <button className="btn btn-white border fw-bold px-4" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
                                <button
                                    className="btn btn-primary fw-bold px-4 shadow-sm"
                                    onClick={handleFollowUpSubmit}
                                    disabled={isSubmittingFollowUp || !followUpDate || !followUpTimeSlot}
                                >
                                    {isSubmittingFollowUp ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-check me-2" />}
                                    Confirm & Schedule Follow-up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNoteModal && (
                <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowNoteModal(false)} />
                    <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0">Add Clinical Note</h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowNoteModal(false)} />
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">Physician Findings & Assessment</label>
                                <textarea
                                    className="form-control fs-14 text-dark border-primary-light"
                                    rows={8}
                                    value={clinicalNote}
                                    onChange={(e) => setClinicalNote(e.target.value)}
                                    placeholder="Type patient assessment, clinical findings, or additional notes here..."
                                />
                            </div>
                            <div className="modal-footer bg-light border-top-0 p-3">
                                <button className="btn btn-light fw-bold px-4" onClick={() => setShowNoteModal(false)}>Cancel</button>
                                <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handleNoteSave} disabled={savingNote}>
                                    {savingNote ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-check me-1" />}
                                    {appointment?.reason ? "Save Changes" : "Add Note"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

            {/* Printable Appointment Summary */}
            <div id="print-appointment" style={{ display: 'none' }}>
                <div className="p-4" style={{ minHeight: '29.7cm', width: '21cm', margin: 'auto', background: '#fff', color: '#000', fontFamily: "'Inter', sans-serif" }}>

                    {/* Header (Cloned from Prescription Style) */}
                    {/* Header (Cloned from Prescription Style) */}
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <div className="d-flex gap-3">
                            <div className="rounded p-1 d-flex align-items-center justify-content-center border-dashed" style={{ width: '80px', height: '80px', borderColor: '#4f46e5', backgroundColor: '#fff' }}>
                                <img src={resolveMediaUrl(appointment?.clinic?.landingPage?.logo) || "/logo.png"} alt="logo" style={{ maxHeight: '70px', maxWidth: '70px', objectFit: 'contain' }} />
                            </div>
                            <div>
                                <h4 className="fw-bold mb-1 mt-1 text-dark" style={{ fontSize: '20px' }}>{appointment?.clinic?.name || appointment?.clinicName || "Clinical Center"}</h4>
                                <p className="mb-1 text-muted fs-12 d-flex align-items-center gap-1">
                                    <i className="ti ti-map-pin fs-10" /> {appointment?.clinic?.landingPage?.address || appointment?.location || "Clinic Address Not Set"}
                                </p>
                                <h6 className="fw-bold fs-14 mb-0 text-dark">{appointment?.doctor?.fullName}</h6>
                                <p className="text-muted fs-11 mb-0">{appointment?.doctor?.designation?.name || "Consultant"} · {appointment?.doctor?.department?.name || "Clinical"}</p>
                            </div>
                        </div>
                        <div className="text-end">
                            <span className="badge bg-white text-primary border border-primary-subtle fw-bold px-3 py-2 mb-2" style={{ fontSize: '11px', borderRadius: '4px' }}>
                                {appointment?.appointmentCode || "#---"}
                            </span>
                            <div className="text-muted fs-11 mt-1">
                                <div className="mb-1 text-dark"><strong>Dept:</strong> {appointment?.doctor?.department?.name || "General"}</div>
                                <div className="mb-1 text-dark"><strong>Date:</strong> {dayjs(appointment?.scheduledAt).format('DD MMM YYYY')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Details Table (Tabular Style - Requested) */}
                    <div className="mb-4">
                        <h6 className="fw-bold text-uppercase border-bottom pb-2 fs-11 text-muted mb-3 tracking-wide">Patient Clinical Profile</h6>
                        <div className="table-responsive shadow-sm">
                            <table className="table table-bordered fs-12 mb-0" style={{ borderColor: '#cbd5e1' }}>
                                <thead style={{ background: '#1e293b' }}>
                                    <tr>
                                        <th className="py-3 text-white fw-bold border-bottom-0" style={{ width: '30%' }}>PATIENT NAME</th>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">AGE / GENDER</th>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">BLOOD GROUP</th>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">PATIENT ID</th>
                                    </tr>
                                </thead>
                                <tbody style={{ background: '#fff' }}>
                                    <tr>
                                        <td className="py-3 fw-heavy text-primary" style={{ fontSize: '15px' }}>{appointment?.patient?.firstName} {appointment?.patient?.lastName}</td>
                                        <td className="py-3 text-center text-dark fw-bold">{appointment?.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')}Y / ${appointment?.patient?.gender || "N/A"}` : "N/A"}</td>
                                        <td className="py-3 text-center text-dark fw-heavy">{appointment?.patient?.bloodGroup || "N/A"}</td>
                                        <td className="py-3 text-center text-dark fw-heavy">{appointment?.patient?.patientCode || appointment?.patientId?.slice(-6).toUpperCase()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Centered Title */}
                    <div className="text-center mb-4 pt-4">
                        <h5 className="fw-bold text-dark text-uppercase tracking-wider" style={{ borderBottom: '3px solid #1e293b', display: 'inline-block', paddingBottom: '8px' }}>
                            Clinical Appointment Summary
                        </h5>
                    </div>

                    {/* Appointment Summary Table (Requested) */}
                    <div className="mb-4">
                        <h6 className="fw-bold text-uppercase border-bottom pb-2 fs-11 text-muted mb-3 tracking-wide">Appointment Registration Details</h6>
                        <div className="table-responsive shadow-sm">
                            <table className="table table-bordered fs-12 mb-0" style={{ borderColor: '#cbd5e1' }}>
                                <thead style={{ background: '#1e293b' }}>
                                    <tr>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">S.NO</th>
                                        <th className="py-3 text-white fw-bold border-bottom-0">APPOINT ID</th>
                                        <th className="py-3 text-white fw-bold border-bottom-0">PATIENT NAME</th>
                                        <th className="py-3 text-white fw-bold border-bottom-0">DOCTOR NAME</th>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">MODE</th>
                                        <th className="py-3 text-center text-white fw-bold border-bottom-0">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody style={{ background: '#fff' }}>
                                    <tr>
                                        <td className="py-3 text-center text-muted fw-heavy">#01</td>
                                        <td className="py-3 fw-heavy text-dark" style={{ fontSize: '13px' }}>{appointment?.appointmentCode}</td>
                                        <td className="py-3 fw-heavy text-primary" style={{ fontSize: '14px' }}>{appointment?.patient?.firstName} {appointment?.patient?.lastName}</td>
                                        <td className="py-3 fw-heavy text-dark">{appointment?.doctor?.fullName}</td>
                                        <td className="py-3 text-center text-dark fw-bold">{appointment?.mode || "In-person"}</td>
                                        <td className="py-3 text-center">
                                            <span className="badge bg-light text-dark border border-secondary-subtle px-3 py-2 fw-bold text-uppercase" style={{ fontSize: '10px' }}>{appointment?.status}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mb-5">
                        <h6 className="fw-bold text-uppercase border-bottom pb-2 fs-11 text-muted mb-3 tracking-wide">Clinical Findings / Assessment</h6>
                        <div className="p-3 border rounded-1 shadow-sm" style={{ minHeight: '150px', lineHeight: '1.7', fontSize: '13px', borderLeft: '4px solid #1e293b', background: '#fff', color: '#334155' }}>
                            <div className="fw-medium text-dark italic mb-2 opacity-50 fs-10">Physician Clinical Assessment:</div>
                            {appointment?.reason || "Patient presented for follow-up review. Clinical status stable."}
                        </div>
                    </div>

                    {/* Medicines Table (If any) */}
                    {linkedPrescriptions && linkedPrescriptions.length > 0 && (
                        <div className="mb-5">
                            <div className="text-center mb-3 pt-2">
                                <h6 className="fw-bold text-dark text-uppercase fs-12">Medication Summary</h6>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-bordered fs-12 mb-0 border-light-subtle">
                                    <thead style={{ background: '#f8f9fa' }}>
                                        <tr>
                                            <th className="py-2 text-center" style={{ width: '50px' }}>SNO</th>
                                            <th className="py-2">Medicine Name</th>
                                            <th className="py-2 text-center">Dosage</th>
                                            <th className="py-2 text-center">Frequency</th>
                                            <th className="py-2 text-center">Duration</th>
                                            <th className="py-2 text-center">Timings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {linkedPrescriptions.flatMap(p => p.medicines || []).map((m: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-2 text-center text-muted fw-medium">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="py-2 fw-bold text-dark">{m.medicineName}</td>
                                                <td className="py-2 text-center">{m.dosage}</td>
                                                <td className="py-2 text-center fw-bold text-primary">{m.frequency}</td>
                                                <td className="py-2 text-center">{m.duration}</td>
                                                <td className="py-2 text-center">{m.timings}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Advice Section */}
                    <div className="mb-4 pt-3">
                        <h6 className="fw-bold text-dark fs-13 mb-2">Advice</h6>
                        <p className="text-muted fs-13">{appointment?.reason ? "Follow directed medication and maintenance of hygiene." : "Rest and follow-up as scheduled."}</p>
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-auto pt-5">
                        <div className="d-flex justify-content-between align-items-end">
                            <div>
                                <p className="mb-1 text-dark fs-12"><strong>Follow Up:</strong> {appointment?.followUps?.[0]?.scheduledAt ? dayjs(appointment.followUps[0].scheduledAt).format('DD MMMM YYYY') : "As needed"}</p>
                                {appointment.isFollowUp && (
                                    <p className="mb-1 text-dark fs-12"><strong>Follow-up Type:</strong> {appointment.followUpStatus || "Regular"} ({appointment.paymentStatus || "Unpaid"})</p>
                                )}
                                <p className="mb-0 text-muted fs-11">Notes: Patient to review if symptoms persist.</p>
                            </div>
                            <div className="text-end" style={{ width: '200px' }}>
                                <img src="/assets/img/icons/signature-img.svg" alt="signature" style={{ height: '50px', marginBottom: '5px' }} />
                                <h6 className="fw-bold fs-14 mb-0" style={{ color: '#000' }}>{appointment?.doctor?.fullName}</h6>
                                <p className="text-muted fs-11 mb-0">{appointment?.doctor?.designation?.name || "Senior Consultant"}</p>
                            </div>
                        </div>
                        <div className="mt-5 pt-3 border-top text-center text-muted fs-11">
                            <p className="mb-0 fw-medium">2025 &copy; <span className="text-primary">Docyari</span>, All Rights Reserved</p>
                            <p className="mt-1 opacity-50 italic fs-9">This is a computer-generated document and does not require a physical signature.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden !important; }
                    #print-appointment, #print-appointment * {
                        visibility: visible !important;
                    }
                    #print-appointment {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        z-index: 99999 !important;
                        padding: 1.5cm !important;
                        margin: 0 !important;
                    }
                    .bg-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
                }

                .bg-primary-dark { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); }
                .min-height-200 { min-height: 200px; }
                .btn-xs { padding: 4px 10px; font-size: 11px; border-radius: 6px; }
                .avatar-xxl { width: 64px; height: 64px; }
                .hover-primary:hover { color: var(--bs-primary) !important; }
                .btn-soft-primary { background-color: #4f46e5; color: white; border: none; }
                .btn-soft-primary:hover { background-color: #3730a3; color: white; }
                .btn-soft-info { background-color: #0dcaf0; color: white; border: none; }
                .btn-soft-info:hover { background-color: #0baccc; color: white; }
                .btn-soft-success { background-color: #27ae60; color: white; border: none; }
                .btn-soft-success:hover { background-color: #1e8449; color: white; }
                .nav-pills-primary .nav-link.active { background-color: #4f46e5 !important; color: white !important; }
                .nav-link { color: #64748b; }
                .badge-soft-info { background-color: rgba(0, 207, 221, 0.1); color: #00cfdd; }
                .letter-spacing-1 { letter-spacing: 1px; }
                .white-space-pre-wrap { white-space: pre-wrap; }
                .border-primary-light { border: 1px solid rgba(79, 70, 229, 0.1) !important; }
                .shadow-xs { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .tracking-wider { letter-spacing: 0.05em; }
                .rounded-4 { border-radius: 12px !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-shadow:hover { box-shadow: 0 8px 15px rgba(0,0,0,0.1); transform: translateY(-2px); }

                .card-decoration-circle {
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    background: rgba(79, 70, 229, 0.03);
                    border-radius: 50%;
                    top: -50px;
                    right: -50px;
                    z-index: 0;
                }
                .bg-info-light { background: rgba(0, 207, 221, 0.03); }
                .bg-primary-light-large { width: 250px; height: 250px; background: rgba(79, 70, 229, 0.02); bottom: -100px; top: auto; right: -80px; }
                .border-dashed { border: 1px dashed rgba(0,0,0,0.1) !important; }
                .border-dashed-1 { border: 1px dashed rgba(0,0,0,0.05) !important; }
                .bg-light-soft { background: rgba(248, 249, 250, 0.5); }
                .bg-info-soft { background: rgba(0, 207, 221, 0.05); }
                .bg-success-soft { background: rgba(28, 200, 138, 0.1); }
                .pulse-dot-info {
                    width: 8px;
                    height: 8px;
                    background-color: #00cfdd;
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse-info 2s infinite;
                }
                @keyframes pulse-info {
                    0% { box-shadow: 0 0 0 0 rgba(0, 207, 221, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 207, 221, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 207, 221, 0); }
                }
                .pulse-dot-primary {
                    width: 7px;
                    height: 7px;
                    background-color: #4f46e5;
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse-primary 2s infinite;
                }
                @keyframes pulse-primary {
                    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
                .shadow-none { box-shadow: none !important; }
                .italic { font-style: italic; }
                .line-height-base { line-height: 1.5; }
                .vr { width: 1px; background-color: #cbd5e1; }

                .action-buttons-row .btn, .action-buttons-row a.btn {
                    height: 48px !important;
                    padding: 0 24px !important;
                    font-size: 15px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    border-radius: 8px !important;
                    font-weight: 700 !important;
                }
                .action-buttons-row .btn i, .action-buttons-row a.btn i {
                    font-size: 18px !important;
                }
            `}</style>
        </div>
    );
};

export default AppointmentDetails;
