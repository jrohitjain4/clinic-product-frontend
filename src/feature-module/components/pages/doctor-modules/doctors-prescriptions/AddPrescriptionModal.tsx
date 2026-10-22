import { useState, useMemo, useEffect } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useMedicines } from "../../../../../core/hooks/useMedicines";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import html2pdf from "html2pdf.js";
import PrescriptionPadSlip from "../../clinic-modules/appointments/PrescriptionPadSlip";
import RecommendIPDModal from "../../clinic-modules/appointments/RecommendIPDModal";
import { useLabTests } from "../../../../../core/hooks/useLabTests";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import { apiPut } from "../../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import {
    IconFormControl,
    IconTextarea,
} from "../../../../../core/common/form-fields";

interface Medicine {
    medicineName: string;
    strength?: string;
    dosage: string;
    frequency: string;
    duration: string;
    timings: string;
    category?: string;
}

interface Props {
    onClose: () => void;
    onSubmit: (data: Record<string, any>) => Promise<void>;
    initialPatientId?: string;
    initialDoctorId?: string;
    initialAppointmentId?: string;
    linkedAppointments?: any[];
    initialPrescription?: any;
    appointment?: any;
    onRecommendIPD?: () => void;
}

const FREQUENCY_OPTIONS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "1-1-0", "SOS", "As Directed"];
const TIMING_OPTIONS = ["After Food", "Before Food", "With Food", "Empty Stomach"];
const DURATION_OPTIONS = ["3 Days", "5 Days", "7 Days", "10 Days", "2 Weeks", "1 Month", "2 Months", "3 Months", "As needed"];
const DOSE_OPTIONS = ["1 Tablet", "2 Tablets", "1 Spoon", "0.5 Tablet", "1 Capsule", "2 Capsules", "As Directed"];

const emptyMedicine = (): Medicine => ({
    medicineName: "",
    strength: "",
    dosage: "1 Tablet",
    frequency: "1-0-1",
    duration: "5 Days",
    timings: "After Food",
    category: "General Medicine",
});

const AddPrescriptionModal = ({
    onClose,
    onSubmit,
    initialPatientId,
    initialDoctorId,
    initialAppointmentId,
    linkedAppointments = [],
    initialPrescription,
    appointment,
    onRecommendIPD,
}: Props) => {
    const { appointments } = useClinicAppointments();
    const { medicines: pharmacyMedicines } = useMedicines();
    const { prescriptions: allPrescriptions } = usePrescriptions();
    const { tests: labTests } = useLabTests();


    // Map pharmacy medicines for search options
    const medicineOptions = useMemo(() => {
        return pharmacyMedicines.map((m: any) => ({
            name: m.medicineName,
            category: m.category?.name || "General Medicine",
            strength: m.unit || "", // default unit or strength if present
        }));
    }, [pharmacyMedicines]);

    // Derived user and role details
    const loggedUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);
    const isDoctor = loggedUser?.role === "DOCTOR";

    const scheduledAppointments = useMemo(
        () => appointments.filter((a) => a.status === "Schedule"),
        [appointments]
    );

    const scheduledPatients = useMemo(() => {
        const seen = new Set<string>();
        return scheduledAppointments
            .filter((a) => a.patient && !seen.has(a.patient.id) && seen.add(a.patient.id))
            .map((a) => a.patient);
    }, [scheduledAppointments]);

    const loggedDoctorFromAppointment = useMemo(() => {
        if (!isDoctor) return null;
        const match = scheduledAppointments.find((a) => a.doctor);
        return match?.doctor || null;
    }, [scheduledAppointments, isDoctor]);

    // Modal state values
    const [patientId, setPatientId] = useState(initialPrescription?.patientId || initialPatientId || "");
    const [doctorId, setDoctorId] = useState(
        initialPrescription?.doctorId || initialDoctorId || loggedDoctorFromAppointment?.id || ""
    );
    const [appointmentId, setAppointmentId] = useState(initialPrescription?.appointmentId || initialAppointmentId || "");
    const [submitting, setSubmitting] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

    // Diagnostic tests search states
    const [testSearchText, setTestSearchText] = useState("");
    const [showTestDropdown, setShowTestDropdown] = useState(false);

    // Selected visit tab state inside horizontal scroll
    const [selectedVisitTab, setSelectedVisitTab] = useState<string>(initialAppointmentId || "");

    const { patient, refetch: refetchPatient } = useClinicPatient(patientId || undefined);
    const [isIPDRecommended, setIsIPDRecommended] = useState(false);
    const [showRecommendIPDModal, setShowRecommendIPDModal] = useState(false);

    const activeAppointment = useMemo(() => {
        const base = appointment || (appointmentId || selectedVisitTab || initialAppointmentId ? appointments.find((a: any) => a.id === (appointmentId || selectedVisitTab || initialAppointmentId)) : null);
        if (base) {
            return {
                ...base,
                id: base.id || appointmentId || initialAppointmentId || `APT-${Date.now()}`,
                patientId: base.patientId || base.patient?.id || patientId,
                appointmentCode: base.appointmentCode || base.bookingCode || initialPrescription?.appointment?.appointmentCode || `APT-${Date.now().toString().slice(-6)}`,
            };
        }
        if (patientId) {
            return {
                id: appointmentId || initialAppointmentId || `APT-${Date.now()}`,
                appointmentCode: initialPrescription?.appointment?.appointmentCode || `APT-${Date.now().toString().slice(-6)}`,
                patientId: patientId,
                doctorId: doctorId || null,
                patient: patient || initialPrescription?.patient || null,
                doctor: appointments.find((a: any) => a.doctorId === doctorId || a.doctor?.id === doctorId)?.doctor || initialPrescription?.doctor || null,
            };
        }
        return null;
    }, [appointment, appointmentId, selectedVisitTab, initialAppointmentId, appointments, patientId, doctorId, patient, initialPrescription]);

    useEffect(() => {
        if (patient) {
            setIsIPDRecommended(!!patient.suggestIPD);
        }
    }, [patient]);

    const handleToggleIPD = async () => {
        if (onRecommendIPD) {
            onRecommendIPD();
            return;
        }
        setShowRecommendIPDModal(true);
    };

    // State to hold the current visit's draft
    const [currentDraft, setCurrentDraft] = useState<{
        medicines: Medicine[];
        advice: string;
        followUpDate: any;
        followUpNotes: string;
        diagnosticTests: string[];
    }>({
        medicines: initialPrescription?.medicines || [emptyMedicine()],
        advice: initialPrescription?.advice || "",
        followUpDate: initialPrescription?.followUpDate ? dayjs(initialPrescription.followUpDate) : null,
        followUpNotes: initialPrescription?.followUpNotes || "",
        diagnosticTests: initialPrescription?.diagnosticTests || []
    });

    // Sync draft if initialPrescription changes
    useEffect(() => {
        if (initialPrescription) {
            setCurrentDraft({
                medicines: initialPrescription.medicines || [emptyMedicine()],
                advice: initialPrescription.advice || "",
                followUpDate: initialPrescription.followUpDate ? dayjs(initialPrescription.followUpDate) : null,
                followUpNotes: initialPrescription.followUpNotes || "",
                diagnosticTests: initialPrescription.diagnosticTests || []
            });
        }
    }, [initialPrescription]);

    // Fetch patient previous prescriptions
    const patientPrescriptions = useMemo(() => {
        if (!patientId || !allPrescriptions) return [];
        return allPrescriptions.filter(
            (p: any) => p.patientId === patientId && p.id !== initialPrescription?.id
        );
    }, [allPrescriptions, patientId, initialPrescription]);

    // Find prescription for the selected visit tab
    const selectedVisitPrescription = useMemo(() => {
        if (!selectedVisitTab || selectedVisitTab === initialAppointmentId) return null;
        return allPrescriptions.find((p: any) => p.appointmentId === selectedVisitTab);
    }, [selectedVisitTab, allPrescriptions, initialAppointmentId]);

    const isCurrentVisit =
        !selectedVisitTab ||
        selectedVisitTab === (initialAppointmentId || "") ||
        selectedVisitTab === appointmentId;

    // Resolve full appointment (not only "Schedule") for print/download
    const printAppointment = useMemo(() => {
        const fromProp = appointment || null;
        const fromList =
            appointments.find((a: any) => a.id === (appointmentId || initialAppointmentId)) ||
            null;
        const base = fromProp || fromList || {};
        const resolvedPatient =
            base.patient ||
            patient ||
            initialPrescription?.patient ||
            null;
        const resolvedDoctor =
            base.doctor ||
            initialPrescription?.doctor ||
            appointments.find((a: any) => a.doctorId === doctorId || a.doctor?.id === doctorId)?.doctor ||
            null;
        const resolvedClinic =
            base.clinic ||
            initialPrescription?.clinic ||
            null;

        return {
            ...base,
            id: base.id || appointmentId || initialAppointmentId,
            patientId: base.patientId || patientId,
            doctorId: base.doctorId || doctorId,
            patient: resolvedPatient,
            doctor: resolvedDoctor,
            clinic: resolvedClinic,
            scheduledAt: base.scheduledAt || initialPrescription?.appointment?.scheduledAt || new Date(),
            appointmentCode: base.appointmentCode || base.bookingCode,
            paymentStatus: base.paymentStatus,
            amount: base.amount,
            mode: base.mode,
            appointmentType: base.appointmentType,
            department: base.department || resolvedDoctor?.department,
        };
    }, [
        appointment,
        appointments,
        appointmentId,
        initialAppointmentId,
        patient,
        patientId,
        doctorId,
        initialPrescription,
    ]);

    // Active form values depend on whether we are viewing current draft or a past prescription
    const activeMedicines = useMemo(() => {
        if (isCurrentVisit) return currentDraft.medicines;
        return selectedVisitPrescription?.medicines?.map((m: any) => ({
            medicineName: m.medicineName,
            strength: m.strength || "",
            dosage: m.dosage || "1 Tablet",
            frequency: m.frequency || "1-0-1",
            duration: m.duration || "5 Days",
            timings: m.timings || "After Food",
            category: m.category || "General Medicine",
        })) || [emptyMedicine()];
    }, [isCurrentVisit, currentDraft.medicines, selectedVisitPrescription]);

    const activeAdvice = useMemo(() => {
        if (isCurrentVisit) return currentDraft.advice;
        return selectedVisitPrescription?.advice || "";
    }, [isCurrentVisit, currentDraft.advice, selectedVisitPrescription]);

    const activeFollowUpDate = useMemo(() => {
        if (isCurrentVisit) return currentDraft.followUpDate;
        return selectedVisitPrescription?.followUpDate ? dayjs(selectedVisitPrescription.followUpDate) : null;
    }, [isCurrentVisit, currentDraft.followUpDate, selectedVisitPrescription]);

    const activeFollowUpNotes = useMemo(() => {
        if (isCurrentVisit) return currentDraft.followUpNotes;
        return selectedVisitPrescription?.followUpNotes || "";
    }, [isCurrentVisit, currentDraft.followUpNotes, selectedVisitPrescription]);

    const activeDiagnosticTests = useMemo(() => {
        if (isCurrentVisit) return currentDraft.diagnosticTests || [];
        return selectedVisitPrescription?.diagnosticTests || [];
    }, [isCurrentVisit, currentDraft.diagnosticTests, selectedVisitPrescription]);

    const printPrescription = useMemo(
        () => ({
            createdAt: initialPrescription?.createdAt || new Date(),
            id: initialPrescription?.id || "draft",
            prescriptionCode: initialPrescription?.prescriptionCode || "",
            medicines: activeMedicines,
            advice: activeAdvice,
            followUpDate: activeFollowUpDate?.toDate
                ? activeFollowUpDate.toDate()
                : activeFollowUpDate,
            followUpNotes: activeFollowUpNotes,
            diagnosticTests: activeDiagnosticTests,
            patient: printAppointment?.patient || initialPrescription?.patient,
            doctor: printAppointment?.doctor || initialPrescription?.doctor,
            clinic: printAppointment?.clinic || initialPrescription?.clinic,
            department: printAppointment?.department || initialPrescription?.department,
        }),
        [
            initialPrescription,
            activeMedicines,
            activeAdvice,
            activeFollowUpDate,
            activeFollowUpNotes,
            activeDiagnosticTests,
            printAppointment,
        ]
    );

    const handlePrint = () => {
        const pad = document.getElementById('modal-print-prescription-pad');
        if (!pad) return;
        const hideSelectors = [
            '#print-prescription-pad',
            '#print-prescription-slip',
            '#print-appointment',
            '#print-prescription',
        ];
        const hiddenEls: HTMLElement[] = [];
        hideSelectors.forEach((sel) => {
            document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
                if (el === pad || pad.contains(el)) return;
                el.setAttribute('data-hidden-for-print', 'true');
                el.style.setProperty('display', 'none', 'important');
                hiddenEls.push(el);
            });
        });
        const originalDisplay = pad.style.display;
        pad.style.display = 'block';
        // Allow layout to paint filled draft before browser print
        requestAnimationFrame(() => {
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    pad.style.display = originalDisplay;
                    hiddenEls.forEach((el) => {
                        el.removeAttribute('data-hidden-for-print');
                        el.style.removeProperty('display');
                    });
                }, 1500);
            }, 50);
        });
    };

    const handleDownload = () => {
        const element = document.getElementById('modal-print-prescription-pad');
        if (!element) return;
        const originalDisplay = element.style.display;
        element.style.display = 'block';
        const opt = {
            margin: 0,
            filename: `Prescription-${initialPrescription?.prescriptionCode || 'Record'}.pdf`,
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
                console.error("Prescription PDF failed:", err);
                element.style.display = originalDisplay;
            });
    };

    // Copy prescription data from a previous visit
    const handleCopyPrescription = (prevPres: any) => {
        if (prevPres?.medicines && prevPres.medicines.length > 0) {
            const mapped = prevPres.medicines.map((m: any) => ({
                medicineName: m.medicineName,
                strength: m.strength || "",
                dosage: m.dosage || "1 Tablet",
                frequency: m.frequency || "1-0-1",
                duration: m.duration || "5 Days",
                timings: m.timings || "After Food",
                category: m.category || "General Medicine",
            }));

            setCurrentDraft({
                medicines: mapped,
                advice: prevPres.advice || "",
                followUpDate: prevPres.followUpDate ? dayjs(prevPres.followUpDate) : null,
                followUpNotes: prevPres.followUpNotes || "",
                diagnosticTests: Array.isArray(prevPres.diagnosticTests) ? prevPres.diagnosticTests : []
            });
        } else {
            setCurrentDraft(prev => ({
                ...prev,
                advice: prevPres?.advice || prev.advice,
                followUpDate: prevPres?.followUpDate ? dayjs(prevPres.followUpDate) : prev.followUpDate,
                followUpNotes: prevPres?.followUpNotes || prev.followUpNotes,
            }));
        }

        // Switch tab back to Current Visit
        setSelectedVisitTab(initialAppointmentId || "");
    };

    const handlePatientChange = (pid: string) => {
        setPatientId(pid);
        const apt = scheduledAppointments.find((a) => a.patient?.id === pid);
        if (apt) {
            setDoctorId(apt.doctor?.id || "");
            setAppointmentId(apt.id || "");
        } else {
            setDoctorId("");
            setAppointmentId("");
        }
    };

    const availableDoctors = useMemo(() => {
        if (!patientId) return [];
        const seen = new Set<string>();
        return scheduledAppointments
            .filter((a) => a.patient?.id === patientId && a.doctor && !seen.has(a.doctor.id) && seen.add(a.doctor.id))
            .map((a) => a.doctor);
    }, [patientId, scheduledAppointments]);

    const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
        if (!isCurrentVisit) return;
        setCurrentDraft((prev) => ({
            ...prev,
            medicines: prev.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        }));
    };

    const handleSelectMedicine = (index: number, opt: any) => {
        if (!isCurrentVisit) return;
        setCurrentDraft((prev) => ({
            ...prev,
            medicines: prev.medicines.map((m, i) =>
                i === index
                    ? {
                        ...m,
                        medicineName: `${opt.name} - ${opt.category}`,
                        category: opt.category,
                        strength: opt.strength || m.strength || "",
                    }
                    : m
            )
        }));
        setActiveSearchIndex(null);
    };

    const addMedicine = () => {
        if (!isCurrentVisit) return;
        setCurrentDraft((prev) => ({
            ...prev,
            medicines: [...prev.medicines, emptyMedicine()]
        }));
    };

    const removeMedicine = (index: number) => {
        if (!isCurrentVisit) return;
        setCurrentDraft((prev) => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index)
        }));
    };

    const handleClearPrescription = () => {
        if (!isCurrentVisit) return;
        setCurrentDraft({
            medicines: [emptyMedicine()],
            advice: "",
            followUpDate: null,
            followUpNotes: "",
            diagnosticTests: [],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCurrentVisit) return; // only allow generating current visit
        if (!patientId || !doctorId) return alert("Please select a patient and doctor.");

        // Filter out empty medicines (if user left medicine search blank)
        const validMedicines = currentDraft.medicines.filter((m) => m.medicineName && m.medicineName.trim() !== "");

        const invalidMed = validMedicines.find(m => {
            const enteredText = m.medicineName.trim().toLowerCase();
            return !medicineOptions.some(opt =>
                opt.name.toLowerCase() === enteredText ||
                `${opt.name} - ${opt.category}`.toLowerCase() === enteredText
            );
        });
        if (invalidMed) {
            return alert(`"${invalidMed.medicineName}" is not a valid medicine. Please select a medicine from the dropdown list.`);
        }

        setSubmitting(true);
        try {
            await onSubmit({
                patientId,
                doctorId,
                appointmentId: initialAppointmentId || undefined,
                advice: currentDraft.advice,
                followUpDate: currentDraft.followUpDate ? currentDraft.followUpDate.toISOString() : null,
                followUpNotes: currentDraft.followUpNotes,
                diagnosticTests: currentDraft.diagnosticTests || [],
                medicines: validMedicines.map((m) => {
                    let name = m.medicineName;
                    const dashIndex = name.indexOf(" - ");
                    if (dashIndex !== -1) {
                        name = name.substring(0, dashIndex);
                    }
                    return {
                        medicineName: name,
                        strength: m.strength || null,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        duration: m.duration,
                        timings: m.timings,
                    };
                }),
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate visits list sorted by date (newest first)
    const sortedVisits = useMemo(() => {
        return [...linkedAppointments].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    }, [linkedAppointments]);

    const copyablePrescriptionsForSelectedTab = useMemo(() => {
        if (!patientId || !allPrescriptions || !selectedVisitTab) return [];
        const selectedApt = sortedVisits.find((v: any) => v.id === selectedVisitTab);
        if (!selectedApt) return [];
        
        const selectedDate = new Date(selectedApt.scheduledAt).getTime();
        
        return allPrescriptions.filter((p: any) => {
            if (p.patientId !== patientId) return false;
            if (p.id === initialPrescription?.id) return false;
            
            const pDate = p.appointment?.scheduledAt 
                ? new Date(p.appointment.scheduledAt).getTime()
                : new Date(p.createdAt).getTime();
                
            return pDate < selectedDate;
        });
    }, [allPrescriptions, patientId, selectedVisitTab, sortedVisits, initialPrescription]);

    const getPrescriptionTitle = (pres: any) => {
        if (!pres) return "";
        const aptId = pres.appointmentId || pres.appointment?.id;
        if (aptId) {
            if (aptId === initialAppointmentId) {
                return "Current Visit";
            }
            const idx = sortedVisits.findIndex((v: any) => v.id === aptId);
            if (idx !== -1) {
                return `Visit #${sortedVisits.length - idx}`;
            }
        }
        const sortedHistory = [...allPrescriptions]
            .filter((p: any) => p.patientId === patientId)
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const histIdx = sortedHistory.findIndex((p: any) => p.id === pres.id);
        return `Visit #${histIdx !== -1 ? histIdx + 1 : 1}`;
    };

    return (
        <>
            {!showRecommendIPDModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="modal-backdrop fade show"
                        style={{ zIndex: 1040 }}
                        onClick={onClose}
                    />
                    {/* Modal Container */}
                    <div className="modal fade show d-block prescription-modal-wrapper" style={{ zIndex: 1050 }} tabIndex={-1}>
                        <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content text-dark border-0 shadow-lg overflow-hidden" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>

                        {/* Header */}
                        <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
                            <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center">
                                <i className="ti ti-prescription me-2 fs-20" />
                                Generate Prescription
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                aria-label="Close"
                            />
                        </div>

                        {/* Top Visits horizontal bar selector */}
                        {sortedVisits.length > 0 && (
                            <div className="visits-bar bg-light border-bottom p-2 px-3 d-flex align-items-center justify-content-between flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
                                <div className="visits-bar-inner d-flex align-items-center gap-2 overflow-auto" style={{ flex: 1 }}>
                                    {sortedVisits.map((apt, index) => {
                                        const isCurrent = apt.id === initialAppointmentId;
                                        const isSelected = selectedVisitTab === apt.id;
                                        const dateStr = dayjs(apt.scheduledAt).format("DD MMM YYYY");
                                        let title = `Visit #${sortedVisits.length - index}`;
                                        if (isCurrent) {
                                            title = "Current Visit";
                                        }

                                        return (
                                            <div
                                                key={apt.id}
                                                className={`visit-tab-card p-2 px-3 rounded border transition-all cursor-pointer ${isSelected
                                                    ? 'active bg-white border-primary shadow-sm'
                                                    : 'bg-light border-secondary-subtle text-muted'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedVisitTab(apt.id);
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className={`ti ti-calendar fs-14 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                                                    <div className="lh-1">
                                                        <span className={`d-block fw-bold fs-12 ${isSelected ? 'text-primary' : 'text-dark'}`}>{title}</span>
                                                        <small className="fs-10 text-muted">{dateStr}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {patientId && (
                                    <div className="ms-3 flex-shrink-0">
                                        <div
                                            onClick={handleToggleIPD}
                                            className="ipd-recommend-card d-flex align-items-center gap-3 px-3 py-2 rounded-3 border cursor-pointer"
                                            style={{
                                                backgroundColor: isIPDRecommended ? "#fff7ed" : "#ffffff",
                                                borderColor: isIPDRecommended ? "#fb923c" : "#e2e8f0",
                                                minWidth: "220px",
                                            }}
                                            title="Click to toggle IPD admission recommendation"
                                        >
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    backgroundColor: isIPDRecommended ? "#ffedd5" : "#f1f5f9",
                                                }}
                                            >
                                                <i
                                                    className="ti ti-bed fs-18"
                                                    style={{ color: isIPDRecommended ? "#ea580c" : "#64748b" }}
                                                />
                                            </div>
                                            <div className="text-start" style={{ lineHeight: 1.35 }}>
                                                <div
                                                    className="fw-bold text-dark"
                                                    style={{ fontSize: "12px", marginBottom: "2px" }}
                                                >
                                                    IPD Admission
                                                </div>
                                                <div
                                                    className="fw-semibold"
                                                    style={{
                                                        fontSize: "11px",
                                                        color: isIPDRecommended ? "#c2410c" : "#64748b",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    {isIPDRecommended ? "Recommended" : "Not recommended"}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: "10px", fontWeight: 400 }}>
                                                    Click to toggle
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body bg-light-subtle p-0 d-flex overflow-hidden" style={{ flex: 1 }}>

                                {/* Left main scrollable content area */}
                                <div className="prescription-main-content p-3" style={{ flex: 1, overflowY: 'auto' }}>

                                    {/* Past Visit Warning and Copy Action Banner */}
                                    {!isCurrentVisit && (
                                        <div className="alert bg-warning-subtle border border-warning rounded-3 mb-3 p-2 d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-2 text-warning-emphasis fw-medium fs-13">
                                                <i className="ti ti-history fs-16 text-warning" />
                                                {selectedVisitPrescription ? (
                                                    <span>You are viewing the previous prescription from <strong>{dayjs(selectedVisitPrescription.createdAt).format("DD MMM YYYY")}</strong>.</span>
                                                ) : (
                                                    <span>No prescription was generated for this past visit.</span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                {selectedVisitPrescription ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-warning fw-bold text-dark d-flex align-items-center gap-1.5"
                                                        onClick={() => handleCopyPrescription(selectedVisitPrescription)}
                                                    >
                                                        <i className="ti ti-copy" /> Copy to Current Visit
                                                    </button>
                                                ) : (
                                                    <>
                                                        {copyablePrescriptionsForSelectedTab.length > 0 ? (
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                {copyablePrescriptionsForSelectedTab.map((pres: any) => {
                                                                    const title = getPrescriptionTitle(pres);
                                                                    return (
                                                                        <button
                                                                            key={pres.id}
                                                                            type="button"
                                                                            className="btn btn-sm btn-warning fw-bold text-dark d-flex align-items-center gap-1.5"
                                                                            onClick={() => handleCopyPrescription(pres)}
                                                                        >
                                                                            <i className="ti ti-copy" /> Copy {title}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-dark fw-bold"
                                                                    onClick={() => setSelectedVisitTab(initialAppointmentId || "")}
                                                                >
                                                                    Back to Current Visit
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-dark fw-bold"
                                                                onClick={() => setSelectedVisitTab(initialAppointmentId || "")}
                                                            >
                                                                Back to Current Visit
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Patient & Doctor (Hidden if pre-decided) */}
                                    {(!initialPatientId || !initialDoctorId) && (
                                        <div className="row g-2 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-dark fs-12">
                                                    PATIENT (SCHEDULED ONLY) <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select text-dark border-secondary-subtle"
                                                    value={patientId}
                                                    onChange={(e) => handlePatientChange(e.target.value)}
                                                    required
                                                    disabled={!!initialPatientId || !isCurrentVisit}
                                                >
                                                    <option value="">-- Select Patient --</option>
                                                    {scheduledPatients.map((p: any) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.firstName} {p.lastName} {p.patientCode ? `(${p.patientCode})` : ""}
                                                        </option>
                                                    ))}
                                                    {initialPatientId && !scheduledPatients.find(p => p.id === initialPatientId) && (
                                                        <option value={initialPatientId}>Current Patient</option>
                                                    )}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-bold text-dark fs-12">
                                                    DOCTOR <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select text-dark border-secondary-subtle"
                                                    value={doctorId}
                                                    onChange={(e) => setDoctorId(e.target.value)}
                                                    required
                                                    disabled={isDoctor || !!initialDoctorId || availableDoctors.length === 0 || !isCurrentVisit}
                                                >
                                                    <option value="">-- Select Doctor --</option>
                                                    {availableDoctors.map((d: any) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.fullName}
                                                        </option>
                                                    ))}
                                                    {initialDoctorId && !availableDoctors.find(d => d.id === initialDoctorId) && (
                                                        <option value={initialDoctorId}>Selected Doctor</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Medicines table */}
                                    <div className="bg-white border rounded-3 shadow-sm p-3 mb-3" style={{ overflow: 'visible' }}>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ti ti-pill text-primary fs-18" />
                                                <h6 className="fw-bold text-dark mb-0 fs-14">Medicines</h6>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
                                                onClick={addMedicine}
                                                disabled={!isCurrentVisit}
                                            >
                                                <i className="ti ti-plus fs-12" /> Add Medicine
                                            </button>
                                        </div>

                                        <div className="table-responsive border rounded-3" style={{ overflow: 'visible' }}>
                                            <table className="table mb-0 align-middle" style={{ overflow: 'visible', borderCollapse: 'collapse', width: '100%' }}>
                                                <thead className="table-light border-bottom">
                                                    <tr className="text-dark fw-bold text-nowrap" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        <th style={{ padding: '12px 10px', color: '#475569', whiteSpace: 'nowrap' }}>Medicine</th>
                                                        <th style={{ padding: '12px 10px', color: '#475569', width: '130px', whiteSpace: 'nowrap' }}>Dose</th>
                                                        <th style={{ padding: '12px 10px', color: '#475569', width: '110px', whiteSpace: 'nowrap' }}>Frequency</th>
                                                        <th style={{ padding: '12px 10px', color: '#475569', width: '120px', whiteSpace: 'nowrap' }}>Duration</th>
                                                        <th style={{ padding: '12px 10px', color: '#475569', width: '180px', whiteSpace: 'nowrap' }}>Before / After Food</th>
                                                        <th style={{ padding: '12px 10px', width: '50px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeMedicines.map((med: Medicine, index: number) => (
                                                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            {/* Medicine search */}
                                                            <td style={{ position: 'relative', zIndex: activeSearchIndex === index ? 10 : 1, padding: '8px 10px' }}>
                                                                <div className="input-group input-group-sm border rounded-3 bg-white px-2 align-items-center">
                                                                    <i className="ti ti-search text-muted fs-14 me-1.5" />
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm text-dark fw-semibold border-0 p-1"
                                                                        placeholder="Search Medicine..."
                                                                        value={med.medicineName}
                                                                        onChange={(e) => {
                                                                            updateMedicine(index, "medicineName", e.target.value);
                                                                            setActiveSearchIndex(index);
                                                                        }}
                                                                        onFocus={() => isCurrentVisit && setActiveSearchIndex(index)}
                                                                        onBlur={() => {
                                                                            setTimeout(() => {
                                                                                const enteredText = med.medicineName.trim().toLowerCase();
                                                                                const exactMatch = medicineOptions.find((opt: any) => 
                                                                                    opt.name.toLowerCase() === enteredText ||
                                                                                    `${opt.name} - ${opt.category}`.toLowerCase() === enteredText
                                                                                );
                                                                                if (exactMatch) {
                                                                                    updateMedicine(index, "medicineName", `${exactMatch.name} - ${exactMatch.category}`);
                                                                                    updateMedicine(index, "category", exactMatch.category);
                                                                                    updateMedicine(index, "strength", exactMatch.strength || "");
                                                                                } else {
                                                                                    updateMedicine(index, "medicineName", "");
                                                                                    updateMedicine(index, "category", "");
                                                                                    updateMedicine(index, "strength", "");
                                                                                }
                                                                                setActiveSearchIndex(null);
                                                                            }, 250);
                                                                        }}
                                                                        autoComplete="off"
                                                                        disabled={!isCurrentVisit}
                                                                    />
                                                                    {med.medicineName && isCurrentVisit && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link btn-sm text-muted p-0 border-0"
                                                                            onClick={() => updateMedicine(index, "medicineName", "")}
                                                                        >
                                                                            <i className="ti ti-x fs-13" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {activeSearchIndex === index && isCurrentVisit && (
                                                                    <div
                                                                        className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                                                                        style={{
                                                                            zIndex: 1000,
                                                                            maxHeight: '200px',
                                                                            overflowY: 'auto',
                                                                            top: '100%',
                                                                            left: 0
                                                                        }}
                                                                    >
                                                                        {medicineOptions
                                                                            .filter((opt: any) => {
                                                                                const search = (med.medicineName || "").toLowerCase();
                                                                                return opt.name.toLowerCase().includes(search) ||
                                                                                       `${opt.name} - ${opt.category}`.toLowerCase().includes(search);
                                                                            })
                                                                            .map((opt: any) => (
                                                                                <div
                                                                                    key={opt.name}
                                                                                    className="medicine-dropdown-item d-flex flex-column align-items-start text-dark"
                                                                                    onMouseDown={() => handleSelectMedicine(index, opt)}
                                                                                >
                                                                                    <span className="fw-bold text-dark">{opt.name} - {opt.category}</span>
                                                                                </div>
                                                                            ))}
                                                                        {medicineOptions.filter((opt: any) => {
                                                                            const search = (med.medicineName || "").toLowerCase();
                                                                            return opt.name.toLowerCase().includes(search) ||
                                                                                   `${opt.name} - ${opt.category}`.toLowerCase().includes(search);
                                                                        }).length === 0 && (
                                                                                <div className="px-3 py-2 text-muted fs-12">
                                                                                    No matching medicines found
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </td>


                                                            {/* Dose */}
                                                            <td style={{ padding: '8px 10px' }}>
                                                                <select
                                                                    className="form-select form-select-sm text-dark fw-semibold border-secondary-subtle"
                                                                    value={med.dosage}
                                                                    onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                                                                    disabled={!isCurrentVisit}
                                                                >
                                                                    {DOSE_OPTIONS.map((d) => (
                                                                        <option key={d} value={d}>{d}</option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            {/* Frequency */}
                                                            <td style={{ padding: '8px 10px' }}>
                                                                <select
                                                                    className="form-select form-select-sm text-dark fw-semibold border-secondary-subtle"
                                                                    value={med.frequency}
                                                                    onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                                                                    disabled={!isCurrentVisit}
                                                                >
                                                                    {FREQUENCY_OPTIONS.map((f) => (
                                                                        <option key={f} value={f}>{f}</option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            {/* Duration */}
                                                            <td style={{ padding: '8px 10px' }}>
                                                                <select
                                                                    className="form-select form-select-sm text-dark fw-semibold border-secondary-subtle"
                                                                    value={med.duration}
                                                                    onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                                                                    disabled={!isCurrentVisit}
                                                                >
                                                                    {DURATION_OPTIONS.map((d) => (
                                                                        <option key={d} value={d}>{d}</option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            {/* Timings */}
                                                            <td style={{ padding: '8px 10px' }}>
                                                                <select
                                                                    className="form-select form-select-sm text-dark fw-semibold border-secondary-subtle"
                                                                    value={med.timings}
                                                                    onChange={(e) => updateMedicine(index, "timings", e.target.value)}
                                                                    disabled={!isCurrentVisit}
                                                                >
                                                                    {TIMING_OPTIONS.map((t) => (
                                                                        <option key={t} value={t}>{t}</option>
                                                                    ))}
                                                                </select>
                                                            </td>

                                                            {/* Action Delete */}
                                                            <td className="text-center" style={{ padding: '8px 10px' }}>
                                                                {activeMedicines.length > 1 && isCurrentVisit && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-icon btn-outline-danger border-0 rounded-circle"
                                                                        onClick={() => removeMedicine(index)}
                                                                        style={{ width: '28px', height: '28px' }}
                                                                    >
                                                                        <i className="ti ti-trash fs-14" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Advice and Follow-up container */}
                                    <div className="row g-3">

                                        {/* Advice */}
                                        <div className="col-md-4">
                                            <div className="bg-white border rounded-3 shadow-sm p-3 h-100">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <i className="ti ti-message-dots text-primary fs-18" />
                                                    <h6 className="fw-bold text-dark mb-0 fs-14">Advice</h6>
                                                </div>
                                                <div className="position-relative">
                                                    <IconTextarea
                                                        fieldLabel="Advice"
                                                        className="text-dark border-secondary-subtle p-2"
                                                        rows={4}
                                                        placeholder="Enter doctor's instructions, recommendations, or advices..."
                                                        value={activeAdvice}
                                                        onChange={(e) => {
                                                            if (isCurrentVisit && e.target.value.length <= 500) {
                                                                setCurrentDraft(prev => ({ ...prev, advice: e.target.value }));
                                                            }
                                                        }}
                                                        maxLength={500}
                                                        style={{ borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}
                                                        disabled={!isCurrentVisit}
                                                    />
                                                    <span className="position-absolute text-muted fs-11" style={{ bottom: '8px', right: '12px' }}>
                                                        {activeAdvice.length}/500
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Next Follow Up */}
                                        <div className="col-md-4">
                                            <div className="bg-white border rounded-3 shadow-sm p-3 h-100">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <i className="ti ti-calendar-stats text-primary fs-18" />
                                                    <h6 className="fw-bold text-dark mb-0 fs-14">Next Follow-up</h6>
                                                </div>
                                                <div className="row g-2">
                                                    <div className="col-12">
                                                        <label className="form-label fw-medium text-dark fs-13 mb-1">
                                                            Follow-up Date <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="position-relative input-group-sm">
                                                            <DatePicker
                                                                className="form-control py-2 fs-13 text-dark border-secondary-subtle rounded-3"
                                                                format="DD MMM YYYY"
                                                                value={activeFollowUpDate}
                                                                onChange={(date) => {
                                                                    if (isCurrentVisit) {
                                                                        setCurrentDraft(prev => ({ ...prev, followUpDate: date }));
                                                                    }
                                                                }}
                                                                placeholder="Select date"
                                                                suffixIcon={<i className="ti ti-calendar text-muted" />}
                                                                disabledDate={(d) => d && d < dayjs().startOf("day")}
                                                                disabled={!isCurrentVisit}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-medium text-dark fs-13 mb-1">
                                                            Remarks (Optional)
                                                        </label>
                                                        <div className="position-relative">
                                                            <IconFormControl
                                                                fieldLabel="Remarks"
                                                                type="text"
                                                                className="form-control-sm text-dark border-secondary-subtle p-2 px-3 rounded-3"
                                                                placeholder="e.g. Review after 1 week"
                                                                value={activeFollowUpNotes}
                                                                onChange={(e) => {
                                                                    if (isCurrentVisit && e.target.value.length <= 200) {
                                                                        setCurrentDraft(prev => ({ ...prev, followUpNotes: e.target.value }));
                                                                    }
                                                                }}
                                                                maxLength={200}
                                                                style={{ fontSize: '13px' }}
                                                                disabled={!isCurrentVisit}
                                                            />
                                                            <span className="position-absolute text-muted fs-10" style={{ bottom: '-18px', right: '4px' }}>
                                                                {activeFollowUpNotes.length}/200
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Diagnostic Tests */}
                                        <div className="col-md-4">
                                            <div className="bg-white border rounded-3 shadow-sm p-3 h-100 d-flex flex-column">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <i className="ti ti-activity text-primary fs-18" />
                                                    <h6 className="fw-bold text-dark mb-0 fs-14">Diagnostic Tests</h6>
                                                </div>
                                                
                                                {/* Search & Add Input */}
                                                <div className="position-relative mb-3 flex-shrink-0" style={{ zIndex: 5 }}>
                                                    <div className="input-group input-group-sm border rounded-3 bg-white px-2 align-items-center">
                                                        <i className="ti ti-search text-muted fs-14 me-1.5" />
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm text-dark fw-semibold border-0 p-1"
                                                            placeholder="Add Diagnostic Test..."
                                                            value={testSearchText}
                                                            onChange={(e) => {
                                                                setTestSearchText(e.target.value);
                                                                setShowTestDropdown(true);
                                                            }}
                                                            onFocus={() => isCurrentVisit && setShowTestDropdown(true)}
                                                            onBlur={() => {
                                                                setTimeout(() => setShowTestDropdown(false), 250);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = testSearchText.trim();
                                                                    if (val && !currentDraft.diagnosticTests.includes(val)) {
                                                                        setCurrentDraft(prev => ({
                                                                            ...prev,
                                                                            diagnosticTests: [...prev.diagnosticTests, val]
                                                                        }));
                                                                        setTestSearchText("");
                                                                        setShowTestDropdown(false);
                                                                    }
                                                                }
                                                            }}
                                                            disabled={!isCurrentVisit}
                                                        />
                                                        {testSearchText && isCurrentVisit && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm text-muted p-0 border-0"
                                                                onClick={() => setTestSearchText("")}
                                                            >
                                                                <i className="ti ti-x fs-13" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {showTestDropdown && isCurrentVisit && (
                                                        <div
                                                            className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                                                            style={{
                                                                zIndex: 1000,
                                                                maxHeight: '180px',
                                                                overflowY: 'auto',
                                                                top: '100%',
                                                                left: 0
                                                            }}
                                                        >
                                                            {labTests
                                                                .filter((t: any) =>
                                                                    t.name.toLowerCase().includes(testSearchText.toLowerCase())
                                                                )
                                                                .map((t: any) => (
                                                                    <div
                                                                        key={t.id}
                                                                        className="medicine-dropdown-item d-flex align-items-center justify-content-between text-dark"
                                                                        onMouseDown={() => {
                                                                            if (!currentDraft.diagnosticTests.includes(t.name)) {
                                                                                setCurrentDraft(prev => ({
                                                                                    ...prev,
                                                                                    diagnosticTests: [...prev.diagnosticTests, t.name]
                                                                                }));
                                                                            }
                                                                            setTestSearchText("");
                                                                            setShowTestDropdown(false);
                                                                        }}
                                                                    >
                                                                        <span className="fw-bold text-dark">{t.name}</span>
                                                                        {t.testCode && <span className="badge bg-light text-muted fs-10">{t.testCode}</span>}
                                                                    </div>
                                                                ))}
                                                            {testSearchText.trim() && !labTests.some(t => t.name.toLowerCase() === testSearchText.toLowerCase().trim()) && (
                                                                <div
                                                                    className="medicine-dropdown-item text-primary fw-bold text-center border-top cursor-pointer"
                                                                    onMouseDown={() => {
                                                                        const val = testSearchText.trim();
                                                                        if (val && !currentDraft.diagnosticTests.includes(val)) {
                                                                            setCurrentDraft(prev => ({
                                                                                ...prev,
                                                                                diagnosticTests: [...prev.diagnosticTests, val]
                                                                            }));
                                                                        }
                                                                        setTestSearchText("");
                                                                        setShowTestDropdown(false);
                                                                    }}
                                                                >
                                                                    <i className="ti ti-plus me-1" /> Add Custom: "{testSearchText.trim()}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selected Tests List */}
                                                <div className="flex-grow-1 border rounded-3 p-2 bg-light-subtle d-flex flex-wrap gap-2 align-content-start" style={{ minHeight: '72px', overflowY: 'auto' }}>
                                                    {activeDiagnosticTests.length > 0 ? (
                                                        activeDiagnosticTests.map((testName: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="badge bg-soft-primary text-primary px-2.5 py-1.5 rounded-3 fs-11.5 fw-bold d-inline-flex align-items-center gap-1.5 hover-shadow transition-all"
                                                            >
                                                                {testName}
                                                                {isCurrentVisit && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn-close btn-xs p-0 border-0 ms-1"
                                                                        style={{ fontSize: '9px', width: '8px', height: '8px', filter: 'brightness(0.3)' }}
                                                                        onClick={() => {
                                                                            setCurrentDraft(prev => ({
                                                                                ...prev,
                                                                                diagnosticTests: prev.diagnosticTests.filter((_, i) => i !== idx)
                                                                            }));
                                                                        }}
                                                                    />
                                                                )}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <div className="text-center w-100 my-auto text-muted fs-12">
                                                            <i className="ti ti-folder-off fs-20 opacity-50 mb-1" /><br />
                                                            No diagnostic tests prescribed.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right sidebar: Previous Prescriptions */}
                                <div className="prescription-sidebar bg-white border-start p-3" style={{ width: '250px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ti ti-history text-primary fs-18" />
                                            <h6 className="fw-bold text-dark mb-0 fs-14">Previous Prescriptions</h6>
                                        </div>
                                    </div>

                                    {/* Sidebar Info alert box */}
                                    <div className="alert bg-warning-subtle border-0 rounded-3 mb-3 p-2 d-flex align-items-start gap-2 text-warning-emphasis fs-12" style={{ lineHeight: '1.45' }}>
                                        <i className="ti ti-bulb fs-15 text-warning mt-0.5" />
                                        <span>Click on any visit to copy its prescription and continue.</span>
                                    </div>

                                    {/* Prescription list */}
                                    <div className="previous-prescriptions-list d-flex flex-column gap-3.5" style={{ flex: 1 }}>
                                        {patientPrescriptions.length > 0 ? (
                                            patientPrescriptions.map((pres: any, idx: number) => {
                                                const dateStr = dayjs(pres.createdAt).format("DD MMM YYYY");
                                                const apptDate = pres.appointment?.scheduledAt
                                                    ? dayjs(pres.appointment.scheduledAt).format("DD MMM YYYY")
                                                    : null;
                                                const apptCode = pres.appointment?.appointmentCode
                                                    || pres.appointmentId?.substring(0, 8)
                                                    || null;
                                                const medicineCount = pres.medicines?.length || 0;
                                                const followUpStr = pres.followUpDate
                                                    ? dayjs(pres.followUpDate).format("DD MMM YYYY")
                                                    : "None";

                                                return (
                                                    <div
                                                        key={pres.id || idx}
                                                        className="card border rounded-3 p-3 position-relative hover-shadow transition-all bg-light-subtle cursor-pointer"
                                                        onClick={() => handleCopyPrescription(pres)}
                                                        style={{ borderStyle: 'solid', borderWidth: '1px' }}
                                                    >
                                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                                            <span className="fw-bold fs-13 text-dark">Visit #{patientPrescriptions.length - idx}</span>
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-xs p-0 text-primary border-0"
                                                                title="Copy Prescription"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyPrescription(pres);
                                                                }}
                                                            >
                                                                <i className="ti ti-copy fs-14" />
                                                            </button>
                                                        </div>
                                                        {apptCode && (
                                                            <small className="d-block text-dark fw-semibold fs-11 mb-1">
                                                                <i className="ti ti-id me-1 text-info" />
                                                                {apptCode}
                                                            </small>
                                                        )}
                                                        <small className="d-block text-muted fs-11.5 mb-2">
                                                            <i className="ti ti-calendar me-1" />
                                                            {apptDate || dateStr}
                                                        </small>
                                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                                            <span className="badge bg-soft-primary text-primary px-2 py-0.5 rounded fs-10 fw-bold">
                                                                {medicineCount} {medicineCount === 1 ? 'Medicine' : 'Medicines'}
                                                            </span>
                                                            {pres.followUpDate && (
                                                                <span className="badge bg-soft-success text-success px-2 py-0.5 rounded fs-10 fw-bold">
                                                                    Follow-up: {followUpStr}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ti ti-folder-off fs-30 opacity-50 mb-2" /><br />
                                                No previous prescriptions recorded.
                                            </div>
                                        )}
                                    </div>

                                    {/* Clear Prescription */}
                                    <div className="mt-3 pt-2 border-top" style={{ flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 fs-13"
                                            onClick={handleClearPrescription}
                                            disabled={!isCurrentVisit}
                                        >
                                            <i className="ti ti-refresh fs-14" /> Clear Prescription
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="modal-footer bg-light border-top-0 p-3 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-info fw-bold px-3 fs-13 d-flex align-items-center gap-1.5"
                                        onClick={handlePrint}
                                    >
                                        <i className="ti ti-printer" /> Print
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-success fw-bold px-3 fs-13 d-flex align-items-center gap-1.5"
                                        onClick={handleDownload}
                                    >
                                        <i className="ti ti-download" /> Download PDF
                                    </button>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button type="button" className="btn btn-light fw-bold px-4" onClick={onClose} disabled={submitting}>
                                        Cancel
                                    </button>

                                    {isCurrentVisit ? (
                                        <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5" disabled={submitting}>
                                            {submitting ? (
                                                <><span className="spinner-border spinner-border-sm me-1" />Processing...</>
                                            ) : (
                                                <><i className="ti ti-check fs-15" /> Generate Prescription</>
                                            )}
                                        </button>
                                    ) : (
                                        selectedVisitPrescription && (
                                            <button
                                                type="button"
                                                className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5"
                                                onClick={() => handleCopyPrescription(selectedVisitPrescription)}
                                            >
                                                <i className="ti ti-copy" /> Copy to Current Visit
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )}

            {/* Custom Premium Styles overriding default bootstrap variables locally */}
            <style>{`
                .prescription-modal-wrapper .modal-xl {
                    max-width: 1080px;
                    width: 92%;
                }
                .prescription-modal-wrapper .visit-tab-card {
                    min-width: 120px;
                    display: flex;
                    align-items: center;
                    background-color: #f8fafc !important;
                    border: 1px solid #cbd5e1 !important;
                    padding: 6px 12px !important;
                    border-radius: 8px !important;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .prescription-modal-wrapper .visit-tab-card.active {
                    background-color: #ffffff !important;
                    border: 2px solid #4f46e5 !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
                }
                .prescription-modal-wrapper .visit-tab-card span {
                    color: #475569 !important;
                    font-weight: 600 !important;
                }
                .prescription-modal-wrapper .visit-tab-card.active span {
                    color: #4f46e5 !important;
                    font-weight: 700 !important;
                }
                .prescription-modal-wrapper .visit-tab-card small {
                    color: #64748b !important;
                    font-weight: 500 !important;
                }
                .prescription-modal-wrapper .visit-tab-card.active small {
                    color: #6366f1 !important;
                }
                .prescription-modal-wrapper .visit-tab-card i {
                    color: #64748b !important;
                }
                .prescription-modal-wrapper .visit-tab-card.active i {
                    color: #4f46e5 !important;
                }
                .prescription-modal-wrapper .bg-blue-light {
                    background-color: #eff6ff !important;
                }
                .prescription-modal-wrapper .fs-11.5 {
                    font-size: 11.5px;
                }
                .prescription-modal-wrapper .bg-soft-primary {
                    background-color: rgba(79, 70, 229, 0.1) !important;
                    color: #4f46e5 !important;
                }
                .prescription-modal-wrapper .bg-soft-success {
                    background-color: rgba(39, 174, 96, 0.1) !important;
                    color: #27ae60 !important;
                }
                .prescription-modal-wrapper .hover-shadow:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    transform: translateY(-1px);
                }
                .prescription-modal-wrapper .medicine-dropdown-item {
                    padding: 8px 14px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    text-align: left;
                    border-bottom: 1px solid #f8fafc;
                }
                .prescription-modal-wrapper .medicine-dropdown-item:hover {
                    background-color: #f1f5f9;
                }
                .prescription-modal-wrapper .medicine-dropdown-item:hover .text-dark {
                    color: #4f46e5 !important;
                }
                .prescription-modal-wrapper .form-check-input:checked {
                    background-color: #4f46e5;
                    border-color: #4f46e5;
                }
                .prescription-modal-wrapper .btn-outline-primary {
                    color: #4f46e5 !important;
                    border-color: #4f46e5 !important;
                }
                .prescription-modal-wrapper .btn-outline-primary:hover {
                    background-color: #4f46e5 !important;
                    color: #fff !important;
                }
                .prescription-modal-wrapper .input-group {
                    border: 1px solid #cbd5e1 !important;
                    background-color: #ffffff !important;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    padding: 2px 8px !important;
                    border-radius: 6px !important;
                }
                .prescription-modal-wrapper .input-group:focus-within {
                    border-color: #4f46e5 !important;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15) !important;
                }
                .prescription-modal-wrapper .input-group input.form-control {
                    border: none !important;
                    box-shadow: none !important;
                    outline: none !important;
                    background: transparent !important;
                    padding: 4px 6px !important;
                    height: auto !important;
                }
                .prescription-modal-wrapper input,
                .prescription-modal-wrapper select,
                .prescription-modal-wrapper textarea,
                .prescription-modal-wrapper label,
                .prescription-modal-wrapper span:not(.badge):not(.btn *):not(.visit-tab-card *),
                .prescription-modal-wrapper td,
                .prescription-modal-wrapper th,
                .prescription-modal-wrapper h5,
                .prescription-modal-wrapper h6,
                .prescription-modal-wrapper p:not(.text-white):not(.btn *) {
                    color: #000000 !important;
                    font-weight: 700 !important;
                }
                .prescription-modal-wrapper input::placeholder,
                .prescription-modal-wrapper textarea::placeholder {
                    color: #94a3b8 !important;
                    font-weight: 500 !important;
                }

                @media print {
                    @page { size: A4; margin: 0; }
                    html, body {
                        height: auto !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body * { visibility: hidden !important; }
                    #print-prescription-pad,
                    #print-prescription-slip,
                    #print-appointment,
                    #print-prescription,
                    [data-hidden-for-print],
                    [data-hidden-for-print] * {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    #modal-print-prescription-pad,
                    #modal-print-prescription-pad * {
                        visibility: visible !important;
                    }
                    #modal-print-prescription-pad {
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
                }
            `}</style>

            {/* Printable Prescription Pad */}
            <div id="modal-print-prescription-pad" style={{ display: 'none' }}>
                <PrescriptionPadSlip
                    appointment={printAppointment}
                    prescription={printPrescription}
                    suggestIPD={isIPDRecommended}
                />
            </div>

            {showRecommendIPDModal && activeAppointment && (
                <RecommendIPDModal
                    onClose={() => setShowRecommendIPDModal(false)}
                    appointment={activeAppointment}
                    onSuccess={() => {
                        setShowRecommendIPDModal(false);
                        setIsIPDRecommended(true);
                        if (refetchPatient) refetchPatient();
                    }}
                />
            )}
        </>
    );
};

export default AddPrescriptionModal;
