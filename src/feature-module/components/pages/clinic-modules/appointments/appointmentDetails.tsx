import { Link, useParams } from "react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import AddPrescriptionModal from "../../doctor-modules/doctors-prescriptions/AddPrescriptionModal";
import {
    statusBadgeClass,
    formatAppointmentTimeRange
} from "../../../../../core/utils/appointmentForm";
import { Modal, DatePicker } from "antd";
import dayjs from "dayjs";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import html2pdf from 'html2pdf.js';
import { useNotes } from "../../../../../core/hooks/useNotes";
import Footer from "../../../../../core/common/footer/footer";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { APPOINTMENT_STATUS_OPTIONS } from "../../../../../core/utils/appointmentForm";
import { authHeaders } from "../../../../../core/utils/apiClient";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
import AppointmentPrintSlip from "./AppointmentPrintSlip";
import PrescriptionPadSlip from "./PrescriptionPadSlip";
import PrescriptionPad from "./PrescriptionPad";

const AppointmentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { appointment, loading, error, refetch } = useClinicAppointment(id);
    const { prescriptions, createPrescription, updatePrescription, deletePrescription, refetch: refetchPres } = usePrescriptions();
    const { patient: fullPatientData } = useClinicPatient(appointment?.patientId);

    const [showPresModal, setShowPresModal] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState<any>(null);
    const [selectedPres, setSelectedPres] = useState<any>(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [clinicalNote, setClinicalNote] = useState("");
    const [noteTitle, setNoteTitle] = useState("Physician Notes");
    const [savingNote, setSavingNote] = useState(false);
    const [editingNote, setEditingNote] = useState<any>(null);
    const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
    const [presDropdownOpen, setPresDropdownOpen] = useState(false);
    const [midTab, setMidTab] = useState<"visitNotes" | "previousVisits" | "documents">("visitNotes");

    useEffect(() => {
        const handleClickOutside = () => {
            setPrintDropdownOpen(false);
            setPresDropdownOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);


    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpDate, setFollowUpDate] = useState<dayjs.Dayjs | null>(null);
    const [followUpTimeSlot, setFollowUpTimeSlot] = useState<string | null>(null);
    const [followUpStatus, setFollowUpStatus] = useState("Schedule");
    const [followUpPayment, setFollowUpPayment] = useState("Unpaid");
    const [followUpReason, setFollowUpReason] = useState("");
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
    const [doctorAvailability, setDoctorAvailability] = useState<any>(null);
    const [showFollowUpSlotsDropdown, setShowFollowUpSlotsDropdown] = useState(false);
    const [isFollowUpSlotsDropdownFocused, setIsFollowUpSlotsDropdownFocused] = useState(false);
    const followUpDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (followUpDropdownRef.current && !followUpDropdownRef.current.contains(event.target as Node)) {
                setShowFollowUpSlotsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const { notes, addNote, deleteNote, updateNote, loading: loadingNotes } = useNotes({ appointmentId: id });

    // Fetch patient's full history
    const { appointments: history, updateAppointmentStatus, refetch: refetchHistory } = useClinicAppointments(
        appointment?.patientId ? { patientId: appointment.patientId } : undefined
    );


    // Fetch services for session appointment display
    const { services } = useClinicServices();


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

    // Calculate fully linked chain (all non-cancelled appointments for this specific patient with this doctor)
    const chainAppointments = useMemo(() => {
        if (!appointment || !history) return [];
        return history.filter(
            (a: any) =>
                a.patientId === appointment.patientId &&
                a.doctorId === appointment.doctorId &&
                a.status !== "Cancelled"
        );
    }, [history, appointment?.patientId, appointment?.doctorId]);
    const chainIds = useMemo(() => chainAppointments.map(a => a.id), [chainAppointments]);

    const sortedChain = [...chainAppointments].sort((a, b) => dayjs(a.scheduledAt).isBefore(dayjs(b.scheduledAt)) ? -1 : 1);

    const linkedPrescriptions = prescriptions.filter(p =>
        chainIds.includes(p.appointmentId) ||
        chainIds.includes(p.appointment?.id || "")
    );

    // Prescription specifically linked to the current appointment (for edit-first logic)
    const currentApptPrescription = prescriptions.find(p => p.appointmentId === id) || null;


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
            refetch(); // Refetch active appointment details
            refetchHistory(); // Refetch patient history to load follow-up changes
        } catch (e) {
            console.error(e);
            toast.error(editingPrescription ? "Failed to update prescription" : "Failed to create prescription");
        }
    };

    const handleNoteSave = async () => {
        if (!id || !clinicalNote.trim()) return;
        setSavingNote(true);
        try {
            const title = noteTitle || "Physician Notes";
            if (editingNote) {
                await updateNote(editingNote.id, {
                    content: clinicalNote,
                    title,
                });
                toast.success("Note updated");
            } else {
                await addNote({
                    title,
                    content: clinicalNote,
                    priority: title === "General Notes" ? "Low" : "Medium",
                    noteDate: new Date().toISOString(),
                    appointmentId: id
                });
                toast.success("Note added");
            }
            setClinicalNote("");
            setEditingNote(null);
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
        if (!Array.isArray(daySchedule) || daySchedule.length === 0) return [];

        return daySchedule.map((session: any, idx: number) => {
            const sessionLabel = session.label || (idx === 0 ? "Morning Session" : idx === 1 ? "Evening Session" : `Session ${idx + 1}`);
            const fromFormatted = dayjs(session.from, "HH:mm").format("hh:mm A");
            const toFormatted = dayjs(session.to, "HH:mm").format("hh:mm A");

            const isTwentyFourSeven =
                session.session === "24 Hours Available" ||
                session.label === "24 Hours Available" ||
                (session.from === "00:00:00" && session.to === "23:59:00") ||
                (session.from === "00:00" && session.to === "23:59") ||
                (session.from === "00:00:00" && session.to === "23:59:59") ||
                (session.from === "00:00" && session.to === "23:59:59");

            return {
                value: session.from,
                label: isTwentyFourSeven
                    ? "24 Hours Available"
                    : `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
            };
        });
    }, [doctorAvailability, followUpDate]);

    const isSlotBookingActive = useMemo(() => {
        return !!(
            doctorAvailability &&
            doctorAvailability.duration &&
            doctorAvailability.duration > 0 &&
            doctorAvailability.maxBookingsPerSlot &&
            doctorAvailability.maxBookingsPerSlot > 0
        );
    }, [doctorAvailability]);

    const slotOptions = useMemo(() => {
        if (!isSlotBookingActive || !doctorAvailability || !followUpDate) return [];
        const dayName = followUpDate.format("dddd");
        const dateStr = followUpDate.format("YYYY-MM-DD");
        const daySchedule = doctorAvailability.schedules?.[dayName] || [];

        const duration = doctorAvailability.duration || 30;
        const maxBookings = doctorAvailability.maxBookingsPerSlot || 1;
        const slots: any[] = [];

        daySchedule.forEach((session: any) => {
            let currentSlot = dayjs(session.from, "HH:mm");
            const sessionEnd = dayjs(session.to, "HH:mm");

            while (currentSlot.isBefore(sessionEnd)) {
                const slotTime = currentSlot.format("HH:mm");
                const bookedCount = doctorAvailability.appointments?.filter((a: any) => {
                    return (
                        dayjs(a.start).format("YYYY-MM-DD") === dateStr &&
                        dayjs(a.start).format("HH:mm") === slotTime
                    );
                }).length || 0;

                const bookingsAvailable = Math.max(0, maxBookings - bookedCount);

                slots.push({
                    value: slotTime,
                    label: `${currentSlot.format("hh:mm A")} (${bookingsAvailable} slots remaining)`,
                    bookingsAvailable,
                    isDisabled: bookingsAvailable <= 0
                });

                currentSlot = currentSlot.add(duration, "minute");
            }
        });

        return slots;
    }, [isSlotBookingActive, doctorAvailability, followUpDate]);


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
            refetchHistory(); // Reload history to include the new follow-up!
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    const handleDownload = () => {
        const element = document.getElementById('print-appointment');
        if (!element || !appointment) return;

        // Temporarily display the element block so html2pdf can capture it
        const originalDisplay = element.style.display;
        element.style.display = 'block';

        const opt = {
            margin: 0,
            filename: `Appointment-Slip-${appointment.appointmentCode || 'Record'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all'] as const }
        };

        html2pdf()
            .from(element)
            .set(opt)
            .save()
            .then(() => {
                element.style.display = originalDisplay;
            })
            .catch((err: any) => {
                console.error("PDF generation failed:", err);
                element.style.display = originalDisplay;
            });
    };

    const handlePrescriptionPadPrint = () => {
        const pad = document.getElementById('print-prescription-pad');
        const slip = document.getElementById('print-appointment');
        const presSlip = document.getElementById('print-prescription-slip');
        if (!pad) return;
        pad.style.display = 'block';
        pad.setAttribute('data-print-active', 'true');
        if (slip) slip.setAttribute('data-hidden-for-print', 'true');
        if (presSlip) {
            presSlip.setAttribute('data-hidden-for-print', 'true');
            presSlip.removeAttribute('data-print-active');
        }
        window.print();
        setTimeout(() => {
            pad.style.display = 'none';
            pad.removeAttribute('data-print-active');
            if (slip) slip.removeAttribute('data-hidden-for-print');
            if (presSlip) presSlip.removeAttribute('data-hidden-for-print');
        }, 1500);
    };

    const handlePrescriptionPadDownload = () => {
        const element = document.getElementById('print-prescription-pad');
        if (!element || !appointment) return;
        const originalDisplay = element.style.display;
        element.style.display = 'block';
        const opt = {
            margin: 0,
            filename: `Prescription-Pad-${appointment.appointmentCode || 'Record'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all'] as const }
        };
        html2pdf()
            .from(element)
            .set(opt)
            .save()
            .then(() => { element.style.display = originalDisplay; })
            .catch((err: any) => {
                console.error("Prescription Pad PDF failed:", err);
                element.style.display = originalDisplay;
            });
    };

    const handlePrescriptionSlipPrint = () => {
        const slip = document.getElementById('print-prescription-slip');
        const pad = document.getElementById('print-prescription-pad');
        const apptSlip = document.getElementById('print-appointment');
        if (!slip) return;
        slip.style.display = 'block';
        slip.setAttribute('data-print-active', 'true');
        if (pad) {
            pad.setAttribute('data-hidden-for-print', 'true');
            pad.removeAttribute('data-print-active');
        }
        if (apptSlip) apptSlip.setAttribute('data-hidden-for-print', 'true');
        window.print();
        setTimeout(() => {
            slip.style.display = 'none';
            slip.removeAttribute('data-print-active');
            if (pad) pad.removeAttribute('data-hidden-for-print');
            if (apptSlip) apptSlip.removeAttribute('data-hidden-for-print');
        }, 1500);
    };

    const handlePrescriptionSlipDownload = () => {
        const element = document.getElementById('print-prescription-slip');
        if (!element || !appointment || !selectedPres) return;
        const originalDisplay = element.style.display;
        element.style.display = 'block';
        const opt = {
            margin: 0,
            filename: `Prescription-Slip-${selectedPres.prescriptionCode || 'Record'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all'] as const }
        };
        html2pdf()
            .from(element)
            .set(opt)
            .save()
            .then(() => { element.style.display = originalDisplay; })
            .catch((err: any) => {
                console.error("Prescription Slip PDF failed:", err);
                element.style.display = originalDisplay;
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


    const truncateReason = (reason: string | null | undefined) => {
        if (!reason) return "—";
        const words = reason.trim().split(/\s+/);
        if (words.length <= 2) return reason;
        return words.slice(0, 2).join(' ') + '...';
    };

    // Derived patient/doctor display helpers for redesigned layout
    const nestedPatient = appointment.patient;
    const fullPatient = fullPatientData;
    const patientFirst = fullPatient?.firstName || nestedPatient?.firstName || "";
    const patientLast = fullPatient?.lastName || nestedPatient?.lastName || "";
    const patientName = `${patientFirst} ${patientLast}`.trim() || appointment.patientName || "Patient";
    const patientInitial = (patientFirst?.[0] || patientName?.[0] || "P").toUpperCase();
    const patientCode = fullPatient?.patientCode || nestedPatient?.patientCode || appointment.patientId?.slice(-6).toUpperCase();
    const patientGender = fullPatient?.gender || nestedPatient?.gender || "—";
    const patientDob = fullPatient?.dob || nestedPatient?.dob;
    const patientAge = patientDob ? dayjs().diff(patientDob, "year") : (fullPatient?.age ?? null);
    const patientPhone = fullPatient?.phone || nestedPatient?.phone || "—";
    const patientEmail = fullPatient?.email || "—";
    const patientBlood = fullPatient?.bloodGroup || nestedPatient?.bloodGroup || "—";
    const patientMarital = fullPatient?.maritalStatus || nestedPatient?.maritalStatus || "—";
    const patientOccupation = fullPatient?.occupation || "—";
    const patientStatus = (fullPatient?.status || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active";
    const patientAddress = [
        fullPatient?.address1 || nestedPatient?.address1,
        fullPatient?.address2 || nestedPatient?.address2,
        fullPatient?.city || nestedPatient?.city,
        fullPatient?.state || nestedPatient?.state,
        fullPatient?.pincode || nestedPatient?.pincode,
    ].filter((p) => p && String(p).trim() !== "").join(", ") || "—";

    const doctor = appointment.doctor;
    const doctorName = doctor?.fullName || appointment.doctorName || "Doctor";
    const doctorInitial = doctorName.replace(/^Dr\.?\s*/i, "").trim()?.[0]?.toUpperCase() || "D";
    const doctorHasPhoto = doctor?.profileImage && !doctor.profileImage.includes("placeholder") && !doctor.profileImage.includes("300x300");

    const vitalsRaw = (fullPatient?.vitals || {}) as Record<string, unknown>;
    const vitalsTiles = [
        { key: "bp", label: "Blood Pressure", unit: "mmHg", icon: "ti-heartbeat", keys: ["bp", "bloodPressure", "BP"] },
        { key: "hr", label: "Heart Rate", unit: "bpm", icon: "ti-activity-heartbeat", keys: ["hr", "heartRate", "pulse", "Pulse"] },
        { key: "temp", label: "Temperature", unit: "°F", icon: "ti-temperature", keys: ["temp", "temperature", "Temperature"] },
        { key: "spo2", label: "SpO2", unit: "%", icon: "ti-lungs", keys: ["spo2", "SpO2", "oxygen"] },
        { key: "sugar", label: "Blood Sugar", unit: "mg/dL", icon: "ti-droplet", keys: ["sugar", "bloodSugar", "glucose"] },
        { key: "weight", label: "Weight", unit: "kg", icon: "ti-scale", keys: ["weight", "Weight"] },
    ].map((t) => {
        let value: unknown;
        for (const k of t.keys) {
            if (vitalsRaw[k] !== undefined && vitalsRaw[k] !== null && vitalsRaw[k] !== "") {
                value = vitalsRaw[k];
                break;
            }
        }
        return { ...t, value };
    });
    const hasAnyVital = vitalsTiles.some((t) => t.value !== undefined);
    const vitalsUpdatedAt = (vitalsRaw.updatedAt || vitalsRaw.lastUpdated || vitalsRaw.recordedAt) as string | undefined;

    const physicianNotes = notes.filter((n) =>
        ["Physician Notes", "Clinical Note", "Physician Note"].includes(n.title) || !n.title
    );
    const clinicalFindings = notes.filter((n) => n.title === "Clinical Findings");
    const generalNotes = notes.filter((n) => n.title === "General Notes" || n.title === "General Notes (Private)");

    const previousVisits = (history || [])
        .filter((h) => h.id !== appointment.id)
        .sort((a, b) => dayjs(b.scheduledAt).valueOf() - dayjs(a.scheduledAt).valueOf());

    const visitHistoryRows = (history || [])
        .slice()
        .sort((a, b) => dayjs(b.scheduledAt).valueOf() - dayjs(a.scheduledAt).valueOf());

    const nextFollowUp = sortedChain.find((a) => a.id !== appointment.id && dayjs(a.scheduledAt).isAfter(dayjs()));
    const paymentLabel = appointment.paymentStatus || (
        ["confirmed", "checked in", "checked out"].includes((appointment.status || "").toLowerCase()) ? "Paid" : "Unpaid"
    );

    const paymentPillClass = (payment?: string | null) => {
        const p = (payment || "").toLowerCase();
        if (!p || p === "—") return "av-pill av-pill-muted";
        if (p.includes("unpaid") || p === "pending") return "av-pill av-pill-unpaid";
        if (p === "free") return "av-pill av-pill-info";
        if (p.includes("paid")) return "av-pill av-pill-paid";
        return "av-pill av-pill-muted";
    };

    const statusPillClass = (status?: string | null) => {
        const s = (status || "").toLowerCase();
        if (s === "checked in") return "av-pill av-pill-checked-in";
        if (s === "checked out" || s === "completed") return "av-pill av-pill-completed";
        if (s === "cancelled") return "av-pill av-pill-cancelled";
        if (s === "schedule" || s === "scheduled") return "av-pill av-pill-schedule";
        if (s === "confirmed") return "av-pill av-pill-confirmed";
        if (s.includes("follow")) return "av-pill av-pill-paid";
        return "av-pill av-pill-muted";
    };

    const openNoteModal = (title: string, note?: any) => {
        const resolvedTitle =
            note?.title === "Clinical Note" || note?.title === "Physician Note"
                ? "Physician Notes"
                : note?.title === "General Notes (Private)"
                    ? "General Notes"
                    : (note?.title || title);
        setNoteTitle(resolvedTitle);
        setClinicalNote(note?.content || "");
        setEditingNote(note || null);
        setShowNoteModal(true);
    };

    const renderNoteBlock = (title: string, list: typeof notes, accent: string) => (
        <div className="av-note-block mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="av-note-block-title mb-0">
                    <span className="av-note-dot" style={{ background: accent }} />
                    {title}
                </h6>
                <button type="button" className="btn btn-link btn-sm p-0 fw-semibold text-primary" onClick={() => openNoteModal(title)}>
                    <i className="ti ti-plus me-1" />Add
                </button>
            </div>
            {list.length === 0 ? (
                <p className="text-muted fs-13 mb-0 av-note-empty">No notes yet.</p>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {list.map((note) => (
                        <div key={note.id} className="av-note-item">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <p className="mb-1 fs-13 text-dark" style={{ whiteSpace: "pre-wrap" }}>{note.content}</p>
                                <div className="d-flex gap-1 flex-shrink-0">
                                    <button type="button" className="btn btn-sm p-0 text-primary border-0 bg-transparent" title="Edit" onClick={() => openNoteModal(title, note)}>
                                        <i className="ti ti-edit fs-14" />
                                    </button>
                                    <button type="button" className="btn btn-sm p-0 text-danger border-0 bg-transparent" title="Delete" onClick={() => { if (window.confirm("Delete this note?")) deleteNote(note.id); }}>
                                        <i className="ti ti-trash fs-14" />
                                    </button>
                                </div>
                            </div>
                            <span className="text-muted fs-11">{dayjs(note.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="page-wrapper p-0 appointment-view-page">
            <div className="content">
                <div className="mb-2">
                    <h6 className="fw-semibold fs-14 mb-0">
                        <Link to={all_routes.appointments}>
                            <i className="ti ti-chevron-left me-1" />
                            Appointments
                        </Link>
                    </h6>
                </div>

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <h3 className="fw-bold mb-0 fs-20">Visit # {appointment.appointmentCode || id?.slice(-6).toUpperCase()}</h3>
                    <div className="d-flex flex-wrap align-items-center gap-2 action-buttons-row">
                        <div className="dropdown">
                            <button
                                className="btn btn-sm btn-outline-light border bg-white text-dark dropdown-toggle d-flex align-items-center gap-2 fw-bold shadow-sm fs-14"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPrintDropdownOpen(!printDropdownOpen); setPresDropdownOpen(false); }}
                                aria-expanded={printDropdownOpen}
                            >
                                <i className="ti ti-printer" /> Appt. Slip
                            </button>
                            <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${printDropdownOpen ? "show" : ""}`} style={{ display: printDropdownOpen ? "block" : "none" }}>
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => {
                                        setPrintDropdownOpen(false);
                                        const appt = document.getElementById('print-appointment');
                                        const pad = document.getElementById('print-prescription-pad');
                                        const pres = document.getElementById('print-prescription-slip');
                                        if (appt) {
                                            appt.style.display = 'block';
                                            appt.removeAttribute('data-hidden-for-print');
                                        }
                                        if (pad) {
                                            pad.setAttribute('data-hidden-for-print', 'true');
                                            pad.removeAttribute('data-print-active');
                                        }
                                        if (pres) {
                                            pres.setAttribute('data-hidden-for-print', 'true');
                                            pres.removeAttribute('data-print-active');
                                        }
                                        window.print();
                                        setTimeout(() => {
                                            if (appt) appt.style.display = 'none';
                                            if (pad) pad.removeAttribute('data-hidden-for-print');
                                            if (pres) pres.removeAttribute('data-hidden-for-print');
                                        }, 1500);
                                    }}>
                                        <i className="ti ti-printer" /> Print Slip
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPrintDropdownOpen(false); handleDownload(); }}>
                                        <i className="ti ti-download" /> Download Slip PDF
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="dropdown">
                            <button
                                className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-2 fw-bold shadow-sm fs-14"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPresDropdownOpen(!presDropdownOpen); setPrintDropdownOpen(false); }}
                                aria-expanded={presDropdownOpen}
                            >
                                <i className="ti ti-file-text" /> Prescription Pad
                            </button>
                            <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${presDropdownOpen ? "show" : ""}`} style={{ display: presDropdownOpen ? "block" : "none" }}>
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPresDropdownOpen(false); handlePrescriptionPadPrint(); }}>
                                        <i className="ti ti-printer" /> Print Prescription Pad
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPresDropdownOpen(false); handlePrescriptionPadDownload(); }}>
                                        <i className="ti ti-download" /> Download Prescription PDF
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <button className="btn btn-sm btn-soft-info d-flex align-items-center gap-2 fw-bold shadow-sm fs-12" onClick={() => { setSelectedPres(null); setEditingPrescription(currentApptPrescription); setShowPresModal(true); }}>
                            <i className="ti ti-file-plus" /> {currentApptPrescription ? "Edit Prescription" : "Prescription"}
                        </button>

                        <Link to={all_routes.editAppointment.replace(":id", appointment.id)} className="btn btn-sm btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm fs-12">
                            <i className="ti ti-edit" /> Edit
                        </Link>

                        {(appointment.status === "Confirmed" || appointment.status === "Schedule") && (
                            <button className="btn btn-sm btn-danger d-flex align-items-center gap-2 fw-bold shadow-sm fs-12" onClick={handleCancelAppointment}>
                                <i className="ti ti-circle-x" /> Cancel
                            </button>
                        )}
                    </div>
                </div>
                <div className="av-card av-summary mb-3">
                    <div className="row g-0 align-items-stretch">
                        <div className="col-lg-5 av-summary-patient p-4">
                            <div className="d-flex align-items-start gap-3">
                                <span
                                    className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                    style={{
                                        width: 64,
                                        height: 64,
                                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                        fontSize: 24,
                                    }}
                                >
                                    {patientInitial}
                                </span>
                                <div className="flex-grow-1 min-w-0">
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                        <h4 className="fw-bold mb-0 text-dark fs-18">{patientName}</h4>
                                        <span className={`badge rounded-pill px-2 py-1 fs-11 fw-semibold ${patientStatus === "Active" ? "av-badge-active" : "av-badge-inactive"}`}>
                                            {patientStatus}
                                        </span>
                                    </div>
                                    <p className="text-muted fs-13 mb-2">
                                        #{patientCode} <span className="mx-1">|</span> {patientGender}
                                        {patientAge != null ? ` | ${patientAge} Yrs` : ""}
                                        {patientDob ? ` (${dayjs(patientDob).format("DD MMM YYYY")})` : ""}
                                    </p>
                                    <div className="d-flex flex-column gap-1 fs-13 text-dark">
                                        <span className="d-flex align-items-center gap-2"><i className="ti ti-phone text-primary" />{patientPhone}</span>
                                        <span className="d-flex align-items-center gap-2"><i className="ti ti-mail text-primary" />{patientEmail}</span>
                                        <span className="d-flex align-items-start gap-2"><i className="ti ti-map-pin text-primary mt-1" /><span>{patientAddress}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-7 av-summary-visit p-4">
                            <div className="av-meta-row">
                                <div className="av-meta-item">
                                    <div className="av-meta-label"><i className="ti ti-hash" /> Visit ID</div>
                                    <div className="av-meta-value">#{appointment.appointmentCode || "—"}</div>
                                </div>
                                <div className="av-meta-item">
                                    <div className="av-meta-label"><i className="ti ti-calendar" /> Visit Date</div>
                                    <div className="av-meta-value">{dayjs(appointment.scheduledAt).format("DD MMM, YYYY")}</div>
                                    <div className="text-muted fs-12">{dayjs(appointment.scheduledAt).format("hh:mm A")}</div>
                                </div>
                                <div className="av-meta-item">
                                    <div className="av-meta-label"><i className="ti ti-stethoscope" /> Visit Type</div>
                                    <div className="av-meta-value">{appointment.appointmentType || appointment.mode || "Routine"}</div>
                                </div>
                                <div className="av-meta-item">
                                    <div className="av-meta-label"><i className="ti ti-circle-check" /> Status</div>
                                    <span className={`badge ${statusBadgeClass(appointment.status)} rounded-pill px-2 py-1 fw-bold fs-11`}>{appointment.status}</span>
                                </div>
                                <div className="av-meta-item">
                                    <div className="av-meta-label"><i className="ti ti-wallet" /> Payment</div>
                                    <span className={`badge rounded-pill px-2 py-1 fw-bold fs-11 ${String(paymentLabel).toLowerCase().includes("paid") && !String(paymentLabel).toLowerCase().includes("unpaid") ? "av-badge-paid" : "av-badge-unpaid"}`}>
                                        {paymentLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-xl-4 col-md-6">
                        <div className="av-card h-100 p-3">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="av-icon-box"><i className="ti ti-calendar-event" /></span>
                                <h6 className="fw-bold mb-0">Appointment Details</h6>
                            </div>
                            <div className="av-kv">
                                <div className="av-kv-row"><span>Scheduled Slot</span><strong>{formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt)}</strong></div>
                                <div className="av-kv-row"><span>Consulting Mode</span><strong>{appointment.mode || "—"}</strong></div>
                                <div className="av-kv-row"><span>Department</span><strong>{appointment.department?.name || doctor?.department?.name || "General"}</strong></div>
                                <div className="av-kv-row"><span>Duration</span><strong>{doctor?.appointmentDuration || 30} Mins</strong></div>
                                <div className="av-kv-row"><span>Reason</span><strong className="text-end" style={{ maxWidth: "60%" }}>{appointment.reason || "—"}</strong></div>
                                <div className="av-kv-row"><span>Created On</span><strong>{appointment.createdAt ? dayjs(appointment.createdAt).format("DD MMM YYYY") : "—"}</strong></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                        <div className="av-card h-100 p-3 d-flex flex-column">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="av-icon-box"><i className="ti ti-user" /></span>
                                <h6 className="fw-bold mb-0">Patient Registration Details</h6>
                            </div>
                            <div className="av-kv flex-grow-1">
                                <div className="av-kv-row"><span>Blood Group</span><strong>{patientBlood}</strong></div>
                                <div className="av-kv-row"><span>Gender</span><strong>{patientGender}</strong></div>
                                <div className="av-kv-row"><span>Date of Birth</span><strong>{patientDob ? dayjs(patientDob).format("DD MMM YYYY") : "—"}</strong></div>
                                <div className="av-kv-row"><span>Marital Status</span><strong>{patientMarital}</strong></div>
                                <div className="av-kv-row"><span>Occupation</span><strong>{patientOccupation}</strong></div>
                                <div className="av-kv-row"><span>Address</span><strong className="text-end" style={{ maxWidth: "60%" }}>{patientAddress}</strong></div>
                            </div>
                            <Link to={all_routes.patientDetails.replace(":id", appointment.patientId)} className="btn btn-sm av-btn-outline mt-3 align-self-start">
                                View Full Profile <i className="ti ti-chevron-right ms-1" />
                            </Link>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-12">
                        <div className="av-card h-100 p-3 d-flex flex-column">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="av-icon-box"><i className="ti ti-stethoscope" /></span>
                                <h6 className="fw-bold mb-0">Assigned Doctor</h6>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                {doctorHasPhoto ? (
                                    <div className="avatar avatar-lg rounded-circle overflow-hidden flex-shrink-0">
                                        <ImageWithBasePath src={doctor!.profileImage!} className="rounded-circle img-fluid" alt="Doctor" />
                                    </div>
                                ) : (
                                    <span
                                        className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                        style={{ width: 48, height: 48, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", fontSize: 18 }}
                                    >
                                        {doctorInitial}
                                    </span>
                                )}
                                <div>
                                    <div className="d-flex align-items-center gap-1">
                                        <h6 className="fw-bold mb-0">{doctorName}</h6>
                                        <i className="ti ti-rosette-discount-check text-primary fs-16" title="Verified" />
                                    </div>
                                    <span className="badge av-badge-dept mt-1">{doctor?.designation?.name || doctor?.department?.name || "Consultant"}</span>
                                </div>
                            </div>
                            <div className="av-kv flex-grow-1">
                                <div className="av-kv-row"><span>Experience</span><strong>{doctor?.yearOfExperience ? `${doctor.yearOfExperience}+ Yrs` : "—"}</strong></div>
                                <div className="av-kv-row"><span>Consultation Fee</span><strong>₹{doctor?.consultationCharge ?? "—"}</strong></div>
                                <div className="av-kv-row"><span>Phone</span><strong>{doctor?.phone || "—"}</strong></div>
                            </div>
                            <Link to={all_routes.doctorsDetails.replace(":id", appointment.doctorId)} className="btn btn-sm av-btn-outline mt-3 align-self-start">
                                View Doctor Profile <i className="ti ti-chevron-right ms-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="av-card p-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="av-icon-box av-icon-heart"><i className="ti ti-heart-rate-monitor" /></span>
                            <h6 className="fw-bold mb-0">Vitals &amp; Basic Information</h6>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary fw-semibold"
                            onClick={() => toast.info("Vitals save API is not available yet. This is a placeholder.")}
                        >
                            <i className="ti ti-plus me-1" /> Add New
                        </button>
                    </div>
                    {hasAnyVital ? (
                        <div className="row g-3">
                            {vitalsTiles.map((t) => (
                                <div key={t.key} className="col-6 col-md-4 col-xl-2">
                                    <div className="av-vital-tile">
                                        <i className={`ti ${t.icon} av-vital-icon`} />
                                        <div className="av-vital-label">{t.label}</div>
                                        <div className="av-vital-value">
                                            {t.value !== undefined ? String(t.value) : "—"}
                                            {t.value !== undefined && <span className="av-vital-unit"> {t.unit}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="av-empty-vitals text-center py-4">
                            <i className="ti ti-heart-off fs-28 text-muted opacity-50 mb-2 d-block" />
                            <p className="text-muted mb-0 fs-13">No vitals recorded for this patient.</p>
                        </div>
                    )}
                    {vitalsUpdatedAt && (
                        <div className="text-muted fs-12 mt-3 pt-2 border-top">Last Updated: {dayjs(vitalsUpdatedAt).format("DD MMM YYYY, hh:mm A")}</div>
                    )}
                </div>
                <div className="row g-3 mb-3">
                    <div className="col-lg-7">
                        <div className="av-card p-3 h-100">
                            <ul className="nav av-tabs mb-3">
                                <li>
                                    <button type="button" className={`av-tab ${midTab === "visitNotes" ? "active" : ""}`} onClick={() => setMidTab("visitNotes")}>
                                        Visit Notes
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className={`av-tab ${midTab === "previousVisits" ? "active" : ""}`} onClick={() => setMidTab("previousVisits")}>
                                        Previous Visits ({previousVisits.length})
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className={`av-tab ${midTab === "documents" ? "active" : ""}`} onClick={() => setMidTab("documents")}>
                                        Documents
                                    </button>
                                </li>
                            </ul>

                            {midTab === "visitNotes" && (
                                <div>
                                    {loadingNotes ? (
                                        <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div>
                                    ) : (
                                        <>
                                            {renderNoteBlock("Physician Notes", physicianNotes, "#6366f1")}
                                            {renderNoteBlock("Clinical Findings", clinicalFindings, "#0ea5e9")}
                                            {renderNoteBlock("General Notes", generalNotes, "#94a3b8")}
                                        </>
                                    )}
                                </div>
                            )}

                            {midTab === "previousVisits" && (
                                <div>
                                    {previousVisits.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <i className="ti ti-calendar-off fs-28 opacity-50 mb-2 d-block" />
                                            No previous visits found.
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {previousVisits.slice(0, 10).map((v) => (
                                                <Link
                                                    key={v.id}
                                                    to={all_routes.appointmentDetails.replace(":id", v.id)}
                                                    className="av-prev-visit text-decoration-none"
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="fw-semibold text-dark fs-13">{dayjs(v.scheduledAt).format("DD MMM YYYY")} · {v.doctorName || v.doctor?.fullName || "—"}</div>
                                                            <div className="text-muted fs-12">{v.reason || v.appointmentCode || "Visit"} · {v.mode}</div>
                                                        </div>
                                                        <span className={`badge ${statusBadgeClass(v.status)} rounded-pill fs-11`}>{v.status}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {midTab === "documents" && (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-file-off fs-28 opacity-50 mb-2 d-block" />
                                    <p className="mb-0 fs-13">No documents uploaded yet.</p>
                                    <p className="fs-12 mb-0 mt-1">Document upload will be available once the API is ready.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="av-card p-3 mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="av-icon-box"><i className="ti ti-prescription" /></span>
                                    <h6 className="fw-bold mb-0">Prescriptions</h6>
                                </div>
                                {linkedPrescriptions.length > 0 && (
                                    <button type="button" className="btn btn-link btn-sm p-0 fw-semibold" onClick={() => { setEditingPrescription(linkedPrescriptions[0]); setShowPresModal(true); }}>
                                        View All
                                    </button>
                                )}
                            </div>
                            {currentApptPrescription || linkedPrescriptions[0] ? (
                                (() => {
                                    const p = currentApptPrescription || linkedPrescriptions[0];
                                    const medCount = p?.medicines?.length || 0;
                                    return (
                                        <div className="av-pres-summary">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <div className="fw-bold text-primary fs-14">{p.prescriptionCode || `Rx-${String(p.id).slice(0, 6)}`}</div>
                                                    <div className="text-muted fs-12">{dayjs(p.createdAt).format("DD MMM YYYY")} · {medCount} medicine{medCount === 1 ? "" : "s"}</div>
                                                </div>
                                                <button type="button" className="btn btn-sm av-btn-outline" onClick={() => { setEditingPrescription(p); setShowPresModal(true); }}>
                                                    <i className="ti ti-edit me-1" />Edit
                                                </button>
                                            </div>
                                            {p.advice && <p className="fs-13 text-muted mb-0 text-truncate">{p.advice}</p>}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="av-pres-empty text-center py-4">
                                    <i className="ti ti-prescription fs-32 text-muted opacity-40 mb-2 d-block" />
                                    <p className="text-muted fs-13 mb-3">No prescription for this visit yet.</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm fw-semibold"
                                        onClick={() => { setEditingPrescription(null); setShowPresModal(true); }}
                                    >
                                        <i className="ti ti-plus me-1" /> Generate Prescription
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="av-card p-3">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="av-icon-box"><i className="ti ti-bell" /></span>
                                    <h6 className="fw-bold mb-0">Follow-up &amp; Reminders</h6>
                                </div>
                                {appointment?.doctor?.followUpEnabled && (
                                    <button type="button" className="btn btn-sm btn-primary fw-semibold" onClick={() => setShowFollowUpModal(true)} disabled={appointment.status === "Cancelled"}>
                                        Schedule
                                    </button>
                                )}
                            </div>
                            <div className="av-kv">
                                <div className="av-kv-row"><span>Follow-up Fee</span><strong>₹{doctor?.followUpFee ?? 0}</strong></div>
                                <div className="av-kv-row"><span>Validity</span><strong>{doctor?.followUpValidityDays ?? 0} Days</strong></div>
                                <div className="av-kv-row"><span>Free Limit</span><strong>{doctor?.freeFollowUpLimit === 0 ? "Unlimited" : `${doctor?.freeFollowUpLimit ?? 0} Visits`}</strong></div>
                                <div className="av-kv-row">
                                    <span>Next Follow-up</span>
                                    <strong>
                                        {nextFollowUp
                                            ? dayjs(nextFollowUp.scheduledAt).format("DD MMM YYYY")
                                            : (appointment.followUps?.[0] ? dayjs(appointment.followUps[0].scheduledAt).format("DD MMM YYYY") : "—")}
                                    </strong>
                                </div>
                            </div>
                            {!doctor?.followUpEnabled && (
                                <p className="text-muted fs-12 mb-0 mt-2">Follow-up is not enabled for this doctor.</p>
                            )}
                        </div>
                    </div>
                </div>

                {isSessionAppointment && (
                    <div className="av-card p-3 mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold mb-0"><i className="ti ti-calendar-event me-2 text-primary" />Session Appointments</h6>
                            <span className="badge bg-primary fs-12 fw-bold px-3 py-1">{sessionChildren.length} / {totalSessionDays} Days</span>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm mb-0 av-table">
                                <thead>
                                    <tr>
                                        <th>Day</th>
                                        <th>Date</th>
                                        <th>Code</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionChildren.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center text-muted py-3">No session appointments yet.</td></tr>
                                    ) : sessionChildren.map((child, idx) => (
                                        <tr key={child.id} className={child.id === appointment.id ? "av-row-current" : ""}>
                                            <td>Day {idx + 1}</td>
                                            <td>{dayjs(child.scheduledAt).format("DD MMM YYYY")}</td>
                                            <td className="fw-semibold text-primary">{child.appointmentCode || "—"}</td>
                                            <td><span className={`badge ${statusBadgeClass(child.status)} fs-11`}>{child.status}</span></td>
                                            <td>
                                                <Link to={all_routes.appointmentDetails.replace(":id", child.id)} className="btn btn-sm av-btn-outline py-0 px-2">
                                                    <i className="ti ti-eye" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="av-card p-3 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <span className="av-icon-box"><i className="ti ti-history" /></span>
                        <h6 className="fw-bold mb-0">Visit History</h6>
                    </div>
                    <div className="table-responsive">
                        <table className="table av-table mb-0">
                            <thead>
                                <tr>
                                    <th>Visit Date</th>
                                    <th>Doctor</th>
                                    <th>Reason</th>
                                    <th>Mode</th>
                                    <th>Prescription</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitHistoryRows.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center text-muted py-4">No visit history.</td></tr>
                                ) : visitHistoryRows.map((v) => {
                                    const hasRx = prescriptions.some((p) => p.appointmentId === v.id || p.appointment?.id === v.id);
                                    const pay = v.paymentStatus || "Unpaid";
                                    return (
                                        <tr key={v.id} className={v.id === appointment.id ? "av-row-current" : ""}>
                                            <td className="text-nowrap">{dayjs(v.scheduledAt).format("DD MMM YYYY")}</td>
                                            <td>{v.doctorName || v.doctor?.fullName || "—"}</td>
                                            <td>{truncateReason(v.reason)}</td>
                                            <td>{v.mode || "—"}</td>
                                            <td>{hasRx ? <span className="text-success fw-semibold">Yes</span> : <span className="text-muted">—</span>}</td>
                                            <td><span className={paymentPillClass(pay)}>{pay}</span></td>
                                            <td><span className={statusPillClass(v.status)}>{v.status}</span></td>
                                            <td className="text-center">
                                                <Link to={all_routes.appointmentDetails.replace(":id", v.id)} className="btn btn-sm p-1 text-primary border-0 bg-transparent" title="View">
                                                    <i className="ti ti-eye fs-16" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
                    appointment={appointment}
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
                                            {isSlotBookingActive ? (
                                                <div className="position-relative" ref={followUpDropdownRef}>
                                                    <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                        <i className="ti ti-clock-hour-4 me-1 text-primary" /> Select Slot
                                                    </label>
                                                    <div
                                                        onClick={() => {
                                                            if (followUpDate && slotOptions.length > 0) {
                                                                setShowFollowUpSlotsDropdown(!showFollowUpSlotsDropdown);
                                                            }
                                                        }}
                                                        onFocus={() => setIsFollowUpSlotsDropdownFocused(true)}
                                                        onBlur={() => setIsFollowUpSlotsDropdownFocused(false)}
                                                        tabIndex={0}
                                                        className="form-control d-flex align-items-center justify-content-between"
                                                        style={{
                                                            minHeight: "46px",
                                                            borderRadius: "12px",
                                                            border: isFollowUpSlotsDropdownFocused || showFollowUpSlotsDropdown ? "1.5px solid #2e37a4" : "1.5px solid #cbd5e1",
                                                            boxShadow: isFollowUpSlotsDropdownFocused || showFollowUpSlotsDropdown ? "0 0 0 1px #2e37a4" : "none",
                                                            fontSize: "15px",
                                                            fontWeight: "500",
                                                            padding: "8px 16px",
                                                            cursor: !followUpDate || slotOptions.length === 0 ? "not-allowed" : "pointer",
                                                            backgroundColor: !followUpDate || slotOptions.length === 0 ? "#f8fafc" : "white",
                                                            transition: "all 0.2s ease-in-out",
                                                            outline: "none",
                                                        }}
                                                    >
                                                        <span className={followUpTimeSlot ? "text-dark fw-semibold" : "text-muted"}>
                                                            {!followUpDate
                                                                ? "Select date first"
                                                                : slotOptions.length === 0
                                                                    ? "No slots available"
                                                                    : followUpTimeSlot
                                                                        ? dayjs(followUpTimeSlot, "HH:mm").format("hh:mm A")
                                                                        : "Select slot"}
                                                        </span>
                                                        <i className={`ti ti-chevron-${showFollowUpSlotsDropdown ? 'up' : 'down'} text-secondary`} style={{ fontSize: "12px" }} />
                                                    </div>

                                                    {showFollowUpSlotsDropdown && followUpDate && slotOptions.length > 0 && (
                                                        <div
                                                            className="position-absolute w-100 mt-1 p-3 border rounded shadow bg-white"
                                                            style={{
                                                                zIndex: 1050,
                                                                borderRadius: "12px",
                                                                borderColor: "#cbd5e1",
                                                                maxHeight: "300px",
                                                                overflowY: "auto",
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                                                                <span className="small text-muted fw-bold">AVAILABLE SLOTS</span>
                                                                <span className="badge bg-soft-primary text-primary px-2 py-0.5 rounded-pill fs-11" style={{ textTransform: "none", backgroundColor: "#eef2ff", color: "#6366f1" }}>
                                                                    {slotOptions.length} Options
                                                                </span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                                                    gap: "8px",
                                                                }}
                                                            >
                                                                <style>{`
                                                                    .select-slot-block {
                                                                        transition: all 0.2s ease-in-out;
                                                                    }
                                                                    .select-slot-block:hover:not(.filled) {
                                                                        transform: translateY(-2px);
                                                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                                                    }
                                                                `}</style>
                                                                {slotOptions.map((opt: any, idx: number) => {
                                                                    const isSelected = followUpTimeSlot === opt.value;
                                                                    const isFilled = opt.bookingsAvailable === 0;
                                                                    const isLastSlot = opt.bookingsAvailable === 1;

                                                                    let bg = "#ecfdf5"; // available
                                                                    let border = "#a7f3d0";
                                                                    let text = "#047857";
                                                                    let badgeText = `${opt.bookingsAvailable} Left`;

                                                                    if (isFilled) {
                                                                        bg = "#fef2f2";
                                                                        border = "#fca5a5";
                                                                        text = "#ef4444";
                                                                        badgeText = "Filled";
                                                                    } else if (isLastSlot) {
                                                                        bg = "#fff7ed";
                                                                        border = "#fdba74";
                                                                        text = "#f97316";
                                                                        badgeText = "Last Slot";
                                                                    }

                                                                    if (isSelected) {
                                                                        bg = "#2e37a4";
                                                                        border = "#2e37a4";
                                                                        text = "#ffffff";
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={opt.value || idx}
                                                                            onClick={() => {
                                                                                if (isFilled) {
                                                                                    toast.warning("This slot is already filled.");
                                                                                    return;
                                                                                }
                                                                                setFollowUpTimeSlot(opt.value);
                                                                                setShowFollowUpSlotsDropdown(false);
                                                                            }}
                                                                            className={`text-center px-2 py-2 select-slot-block ${isFilled ? 'filled' : ''}`}
                                                                            style={{
                                                                                borderRadius: "8px",
                                                                                border: `1px solid ${border}`,
                                                                                backgroundColor: bg,
                                                                                color: text,
                                                                                cursor: isFilled ? "not-allowed" : "pointer",
                                                                                opacity: isFilled && !isSelected ? 0.6 : 1,
                                                                            }}
                                                                        >
                                                                            <div className="fw-bold" style={{ fontSize: "13px" }}>
                                                                                {dayjs(opt.value, "HH:mm").format("hh:mm A")}
                                                                            </div>
                                                                            <div className="fw-semibold mt-1" style={{ fontSize: "10px", opacity: 0.9 }}>
                                                                                {badgeText}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="form-label fw-bold text-dark small text-uppercase mb-2 letter-spacing-1">
                                                        <i className="ti ti-clock-hour-4 me-1 text-primary" /> Select Shift
                                                    </label>
                                                    <CommonSelect
                                                        key={`session-${sessionOptions.length}-${followUpDate?.toString()}`}
                                                        options={sessionOptions}
                                                        value={sessionOptions.find((o: any) => o.value === followUpTimeSlot)}
                                                        onChange={(opt: any) => setFollowUpTimeSlot(opt?.value)}
                                                        placeholder={followUpDate ? "Choose session" : "Select date first"}
                                                        isDisabled={!followUpDate || sessionOptions.length === 0}
                                                    />
                                                </div>
                                            )}
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
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => { setShowNoteModal(false); setEditingNote(null); }} />
                    <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title fw-bold text-white mb-0">{editingNote ? "Edit Note" : "Add Note"}</h5>
                                <button className="btn-close btn-close-white" onClick={() => { setShowNoteModal(false); setEditingNote(null); }} />
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">Note Type</label>
                                <select
                                    className="form-select mb-3"
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    disabled={!!editingNote}
                                >
                                    <option value="Physician Notes">Physician Notes</option>
                                    <option value="Clinical Findings">Clinical Findings</option>
                                    <option value="General Notes">General Notes</option>
                                </select>
                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">Findings &amp; Assessment</label>
                                <textarea
                                    className="form-control fs-14 text-dark border-primary-light"
                                    rows={8}
                                    value={clinicalNote}
                                    onChange={(e) => setClinicalNote(e.target.value)}
                                    placeholder="Type patient assessment, clinical findings, or additional notes here..."
                                />
                            </div>
                            <div className="modal-footer bg-light border-top-0 p-3">
                                <button className="btn btn-light fw-bold px-4" onClick={() => { setShowNoteModal(false); setEditingNote(null); }}>Cancel</button>
                                <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handleNoteSave} disabled={savingNote}>
                                    {savingNote ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-check me-1" />}
                                    {editingNote ? "Save Changes" : "Add Note"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

            {/* Printable Appointment Summary */}
            <div id="print-appointment" style={{ display: 'none' }}>
                <AppointmentPrintSlip appointment={appointment} notes={notes} linkedPrescriptions={linkedPrescriptions} />
            </div>

            {/* Prescription Pad (pre-printed blank pad) */}
            <div id="print-prescription-pad" style={{ display: 'none' }}>
                <PrescriptionPad appointment={appointment} prescription={selectedPres || linkedPrescriptions?.[0] || null} />
            </div>

            {/* Prescription Slip (detailed slip with medicines) */}
            <div id="print-prescription-slip" style={{ display: 'none' }}>
                <PrescriptionPadSlip appointment={appointment} prescription={selectedPres || linkedPrescriptions?.[0] || null} />
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden !important; }
                    #print-appointment:not([data-hidden-for-print]), #print-appointment:not([data-hidden-for-print]) * {
                        visibility: visible !important;
                    }
                    #print-appointment:not([data-hidden-for-print]) {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: white !important;
                        z-index: 99999 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #print-prescription-pad[data-print-active],
                    #print-prescription-pad[data-print-active] * {
                        visibility: visible !important;
                    }
                    #print-prescription-pad[data-print-active] {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        z-index: 99999 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #print-prescription-pad:not([data-print-active]),
                    #print-prescription-pad:not([data-print-active]) * {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    #print-prescription-slip[data-print-active],
                    #print-prescription-slip[data-print-active] * {
                        visibility: visible !important;
                    }
                    #print-prescription-slip[data-print-active] {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        max-height: 297mm !important;
                        height: auto !important;
                        overflow: hidden !important;
                        background: white !important;
                        z-index: 99999 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    #print-prescription-slip:not([data-print-active]),
                    #print-prescription-slip:not([data-print-active]) * {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    [data-hidden-for-print] { display: none !important; visibility: hidden !important; }
                    .bg-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
                }
                /* Badge Contrast and Visibility Fixes */
                .badge {
                    color: #fff !important;
                }
                .badge.bg-light, .badge.text-dark, .badge.text-black {
                    color: #000 !important;
                }
                .badge.bg-soft-primary, .badge.badge-soft-primary, .badge.text-primary {
                    color: #4f46e5 !important;
                    background-color: rgba(79, 70, 229, 0.1) !important;
                }
                .badge.bg-soft-success, .badge.badge-soft-success, .badge.text-success {
                    color: #27ae60 !important;
                    background-color: rgba(39, 174, 96, 0.1) !important;
                }
                .badge.bg-soft-info, .badge.badge-soft-info, .badge.text-info {
                    color: #00cfdd !important;
                    background-color: rgba(0, 207, 221, 0.1) !important;
                }
                .badge.bg-soft-warning, .badge.badge-soft-warning, .badge.text-warning {
                    color: #d97706 !important;
                    background-color: rgba(217, 119, 6, 0.1) !important;
                }
                .badge.bg-soft-danger, .badge.badge-soft-danger, .badge.text-danger {
                    color: #dc2626 !important;
                    background-color: rgba(220, 38, 38, 0.1) !important;
                }
                .badge.badge-soft-purple, .badge.text-purple {
                    color: #8b5cf6 !important;
                    background-color: rgba(139, 92, 246, 0.1) !important;
                }
                .badge.badge-soft-dark, .badge.text-dark {
                    color: #374151 !important;
                    background-color: rgba(55, 65, 81, 0.1) !important;
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
                    height: 40px !important;
                    padding: 0 16px !important;
                    font-size: 13px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 6px !important;
                    border-radius: 8px !important;
                    font-weight: 700 !important;
                }
                .action-buttons-row .btn i, .action-buttons-row a.btn i {
                    font-size: 16px !important;
                }

                .appointment-view-page {
                    background: #f8fafc;
                }
                .appointment-view-page .av-card {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
                    border: none;
                }
                .appointment-view-page .av-summary {
                    overflow: hidden;
                }
                .appointment-view-page .av-summary-patient {
                    border-right: 1px solid #f1f5f9;
                }
                @media (max-width: 991.98px) {
                    .appointment-view-page .av-summary-patient {
                        border-right: none;
                        border-bottom: 1px solid #f1f5f9;
                    }
                }
                .appointment-view-page .av-meta-row {
                    display: flex;
                    align-items: stretch;
                    height: 100%;
                    flex-wrap: wrap;
                }
                .appointment-view-page .av-meta-item {
                    flex: 1 1 0;
                    min-width: 110px;
                    padding: 4px 16px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    border-right: 1px solid #e2e8f0;
                }
                .appointment-view-page .av-meta-item:first-child {
                    padding-left: 0;
                }
                .appointment-view-page .av-meta-item:last-child {
                    border-right: none;
                    padding-right: 0;
                }
                @media (max-width: 991.98px) {
                    .appointment-view-page .av-meta-item {
                        flex: 1 1 40%;
                        border-right: none;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 12px 8px;
                    }
                    .appointment-view-page .av-meta-item:nth-last-child(-n+2) {
                        border-bottom: none;
                    }
                }
                .appointment-view-page .av-meta-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: #94a3b8;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .appointment-view-page .av-meta-label i {
                    font-size: 14px;
                    color: #6366f1;
                }
                .appointment-view-page .av-meta-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .appointment-view-page .av-badge-active {
                    background: rgba(16, 185, 129, 0.12) !important;
                    color: #059669 !important;
                }
                .appointment-view-page .av-badge-inactive {
                    background: rgba(148, 163, 184, 0.2) !important;
                    color: #64748b !important;
                }
                .appointment-view-page .av-badge-paid {
                    background: rgba(16, 185, 129, 0.12) !important;
                    color: #059669 !important;
                }
                .appointment-view-page .av-badge-unpaid {
                    background: rgba(245, 158, 11, 0.12) !important;
                    color: #d97706 !important;
                }
                .appointment-view-page .av-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 600;
                    line-height: 1.3;
                    white-space: nowrap;
                    border: 1px solid transparent;
                }
                .appointment-view-page .av-pill-unpaid {
                    background: #fff7ed !important;
                    color: #c2410c !important;
                    border-color: #fdba74 !important;
                }
                .appointment-view-page .av-pill-paid {
                    background: #ecfdf5 !important;
                    color: #047857 !important;
                    border-color: #6ee7b7 !important;
                }
                .appointment-view-page .av-pill-checked-in {
                    background: #f3e8ff !important;
                    color: #7e22ce !important;
                    border-color: #d8b4fe !important;
                }
                .appointment-view-page .av-pill-completed {
                    background: #ecfdf5 !important;
                    color: #047857 !important;
                    border-color: #6ee7b7 !important;
                }
                .appointment-view-page .av-pill-cancelled {
                    background: #fef2f2 !important;
                    color: #b91c1c !important;
                    border-color: #fca5a5 !important;
                }
                .appointment-view-page .av-pill-schedule {
                    background: #eef2ff !important;
                    color: #4338ca !important;
                    border-color: #c7d2fe !important;
                }
                .appointment-view-page .av-pill-confirmed {
                    background: #eff6ff !important;
                    color: #1d4ed8 !important;
                    border-color: #bfdbfe !important;
                }
                .appointment-view-page .av-pill-info {
                    background: #ecfeff !important;
                    color: #0e7490 !important;
                    border-color: #a5f3fc !important;
                }
                .appointment-view-page .av-pill-muted {
                    background: #f1f5f9 !important;
                    color: #64748b !important;
                    border-color: #e2e8f0 !important;
                }
                .appointment-view-page .av-badge-dept {
                    background: rgba(99, 102, 241, 0.1) !important;
                    color: #6366f1 !important;
                    font-weight: 600;
                    font-size: 11px;
                }
                .appointment-view-page .av-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }
                .appointment-view-page .av-icon-heart {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                .appointment-view-page .av-kv-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 8px 0;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                }
                .appointment-view-page .av-kv-row:last-child {
                    border-bottom: none;
                }
                .appointment-view-page .av-kv-row span {
                    color: #64748b;
                }
                .appointment-view-page .av-kv-row strong {
                    color: #0f172a;
                    font-weight: 600;
                    text-align: right;
                }
                .appointment-view-page .av-btn-outline {
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    color: #6366f1;
                    font-weight: 600;
                    border-radius: 8px;
                }
                .appointment-view-page .av-btn-outline:hover {
                    background: #eef2ff;
                    border-color: #c7d2fe;
                    color: #4f46e5;
                }
                .appointment-view-page .av-vital-tile {
                    background: #f8fafc;
                    border: 1px dashed #e2e8f0;
                    border-radius: 12px;
                    padding: 14px 12px;
                    text-align: center;
                    height: 100%;
                }
                .appointment-view-page .av-vital-icon {
                    font-size: 20px;
                    color: #6366f1;
                    margin-bottom: 6px;
                    display: block;
                }
                .appointment-view-page .av-vital-label {
                    font-size: 11px;
                    color: #94a3b8;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .appointment-view-page .av-vital-value {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .appointment-view-page .av-vital-unit {
                    font-size: 11px;
                    font-weight: 500;
                    color: #94a3b8;
                }
                .appointment-view-page .av-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 12px;
                }
                .appointment-view-page .av-tab {
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 13px;
                    padding: 8px 12px;
                    border-radius: 8px;
                }
                .appointment-view-page .av-tab.active {
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                }
                .appointment-view-page .av-note-block-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .appointment-view-page .av-note-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .appointment-view-page .av-note-item {
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 10px 12px;
                }
                .appointment-view-page .av-prev-visit {
                    display: block;
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 12px;
                    transition: background 0.15s ease;
                }
                .appointment-view-page .av-prev-visit:hover {
                    background: #eef2ff;
                }
                .appointment-view-page .av-pres-summary {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 14px;
                }
                .appointment-view-page .av-table thead th {
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                    white-space: nowrap;
                }
                .appointment-view-page .av-table td {
                    font-size: 13px;
                    vertical-align: middle;
                    border-color: #f1f5f9;
                }
                .appointment-view-page .av-row-current {
                    background: rgba(99, 102, 241, 0.06);
                }
                .btn-soft-info { background-color: #0dcaf0; color: white; border: none; }
                .btn-soft-info:hover { background-color: #0baccc; color: white; }
                .btn-soft-success { background-color: #27ae60; color: white; border: none; }
                .btn-soft-success:hover { background-color: #1e8449; color: white; }
            `}</style>
        </div>
    );
};

export default AppointmentDetails;
