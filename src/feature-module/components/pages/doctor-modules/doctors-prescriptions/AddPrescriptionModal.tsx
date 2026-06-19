import { useState, useMemo } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicProducts } from "../../../../../core/hooks/useClinicProducts";

interface Medicine {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    timings: string;
}

interface Props {
    onClose: () => void;
    onSubmit: (data: Record<string, any>) => Promise<void>;
    initialPatientId?: string;
    initialDoctorId?: string;
    initialAppointmentId?: string;
    linkedAppointments?: any[];
    initialPrescription?: any;
}

const FREQUENCY_OPTIONS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "1-1-0", "SOS"];
const TIMING_OPTIONS = ["Before meal", "After meal", "With meal", "Empty stomach", "At bedtime", "Any time"];
const DURATION_OPTIONS = ["3 days", "5 days", "1 week", "10 days", "2 weeks", "1 month", "2 months", "3 months", "As needed"];

const emptyMedicine = (): Medicine => ({
    medicineName: "",
    dosage: "",
    frequency: "1-0-1",
    duration: "1 month",
    timings: "After meal",
});

const AddPrescriptionModal = ({ onClose, onSubmit, initialPatientId, initialDoctorId, initialAppointmentId, linkedAppointments, initialPrescription }: Props) => {
    const { appointments } = useClinicAppointments();
    const { products } = useClinicProducts();

    const medicineOptions = useMemo(() => {
        return products
            .filter((p: any) => p.key === "Medicine")
            .map((p: any) => p.name);
    }, [products]);

    // Get logged-in user from localStorage
    const loggedUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
    }, []);
    const isDoctor = loggedUser?.role === "DOCTOR";

    // Only show patients from "Schedule" appointments
    const scheduledAppointments = useMemo(
        () => appointments.filter((a) => a.status === "Schedule"),
        [appointments]
    );

    // Unique patients from scheduled appointments
    const scheduledPatients = useMemo(() => {
        const seen = new Set<string>();
        return scheduledAppointments
            .filter((a) => a.patient && !seen.has(a.patient.id) && seen.add(a.patient.id))
            .map((a) => a.patient);
    }, [scheduledAppointments]);

    // If logged in as DOCTOR, derive their record from scheduled appointments
    const loggedDoctorFromAppointment = useMemo(() => {
        if (!isDoctor) return null;
        // Backend already scopes appointments to this doctor — grab first one
        const match = scheduledAppointments.find((a) => a.doctor);
        return match?.doctor || null;
    }, [scheduledAppointments, isDoctor]);

    const [patientId, setPatientId] = useState(initialPrescription?.patientId || initialPatientId || "");
    const [doctorId, setDoctorId] = useState(initialPrescription?.doctorId || initialDoctorId || loggedDoctorFromAppointment?.id || "");
    const [appointmentId, setAppointmentId] = useState(initialPrescription?.appointmentId || initialAppointmentId || "");
    const [advice, setAdvice] = useState(initialPrescription?.advice || "");
    const [followUpDate, setFollowUpDate] = useState<any>(initialPrescription?.followUpDate ? dayjs(initialPrescription.followUpDate) : null);
    const [followUpNotes, setFollowUpNotes] = useState(initialPrescription?.followUpNotes || "");
    const [medicines, setMedicines] = useState<Medicine[]>(initialPrescription?.medicines || [emptyMedicine()]);
    const [submitting, setSubmitting] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

    // When patient is selected, auto-fill doctor from their latest scheduled appointment
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

    // Get doctors from scheduled appointments for selected patient
    const availableDoctors = useMemo(() => {
        if (!patientId) return [];
        const seen = new Set<string>();
        return scheduledAppointments
            .filter((a) => a.patient?.id === patientId && a.doctor && !seen.has(a.doctor.id) && seen.add(a.doctor.id))
            .map((a) => a.doctor);
    }, [patientId, scheduledAppointments]);

    const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
        setMedicines((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        );
    };

    const addMedicine = () => setMedicines((prev) => [emptyMedicine(), ...prev]);
    const removeMedicine = (index: number) =>
        setMedicines((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !doctorId) return alert("Please select a patient and doctor.");
        if (medicines.some((m) => !m.medicineName)) return alert("Please fill in all medicine names.");

        setSubmitting(true);
        try {
            await onSubmit({
                patientId,
                doctorId,
                appointmentId: appointmentId || undefined,
                advice,
                followUpDate: followUpDate ? followUpDate.toISOString() : null,
                followUpNotes,
                medicines,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1040 }}
                onClick={onClose}
            />
            {/* Modal */}
            <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header bg-primary border-bottom p-3 px-4 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
                            <h5 className="modal-title fw-bold text-white">
                                {initialPrescription ? "Edit Prescription" : "Add New Prescription"}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white opacity-100"
                                onClick={onClose}
                            />
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                                {/* Patient & Doctor (Hidden if pre-decided) */}
                                {(!initialPatientId || !initialDoctorId) && (
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">
                                                Patient (Scheduled Only) <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select text-dark"
                                                value={patientId}
                                                onChange={(e) => handlePatientChange(e.target.value)}
                                                required
                                                disabled={!!initialPatientId}
                                            >
                                                <option value="">-- Select Patient --</option>
                                                {scheduledPatients.map((p: any) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.firstName} {p.lastName} {p.patientCode ? `(${p.patientCode})` : ""}
                                                    </option>
                                                ))}
                                                {/* Fallback if initial patient is not in scheduled list */}
                                                {initialPatientId && !scheduledPatients.find(p => p.id === initialPatientId) && (
                                                    <option value={initialPatientId}>Current Patient</option>
                                                )}
                                            </select>
                                            {scheduledPatients.length === 0 && (
                                                <small className="text-muted mt-1 d-block">
                                                    <i className="ti ti-info-circle me-1" />
                                                    No patients with scheduled appointments found.
                                                </small>
                                            )}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">
                                                Doctor <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select text-dark"
                                                value={doctorId}
                                                onChange={(e) => setDoctorId(e.target.value)}
                                                required
                                                disabled={isDoctor || !!initialDoctorId || availableDoctors.length === 0}
                                            >
                                                <option value="">-- Select Doctor --</option>
                                                {// If it's a doctor, we make sure they appear even if availableDoctors is somehow missing them 
                                                    // But they should already be in availableDoctors.
                                                    availableDoctors.map((d: any) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.fullName}
                                                        </option>
                                                    ))}
                                                {/* Fallback if initial doctor is not in filtered list */}
                                                {initialDoctorId && !availableDoctors.find(d => d.id === initialDoctorId) && (
                                                    <option value={initialDoctorId}>Selected Doctor</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Appointment Link (Styled Premium) */}
                                {(linkedAppointments && linkedAppointments.length > 0) && (
                                    <div className="mb-4 p-4 border-0 rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                                        <label className="form-label fw-bold text-dark fs-13 d-flex align-items-center mb-3 letter-spacing-1 text-uppercase tracking-wider">
                                            <i className="ti ti-link me-2 text-primary fs-18" />
                                            Select Visit for this Prescription
                                        </label>
                                        <div className="row g-3">
                                            {linkedAppointments.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((apt) => {
                                                const isSelected = appointmentId === apt.id;
                                                return (
                                                    <div className="col-md-4" key={apt.id}>
                                                        <div
                                                            className="card h-100 border-0 rounded-3 position-relative overflow-hidden"
                                                            onClick={() => setAppointmentId(apt.id)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                border: isSelected ? '2px solid #2563eb' : '1px solid #bfdbfe',
                                                                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                                                transition: 'all 0.2s ease-in-out',
                                                                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)'
                                                            }}
                                                        >
                                                            <div className="card-body p-3.5 d-flex align-items-center gap-3">
                                                                <div 
                                                                    className={`rounded-circle d-flex align-items-center justify-content-center ${isSelected ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                                                    style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                                >
                                                                    <i className={`ti ${isSelected ? 'ti-check' : 'ti-calendar-event'}`} style={{ fontSize: '18px' }} />
                                                                </div>
                                                                <div className="lh-base flex-grow-1">
                                                                    <span className={`d-block fw-bold fs-15 ${isSelected ? 'text-primary' : 'text-dark'}`}>
                                                                        {apt.status === 'Follow-up' ? 'Follow-up Visit' : 'Main Consultation'}
                                                                    </span>
                                                                    <small className="text-muted d-block fs-13 mt-1 fw-medium">
                                                                        <i className="ti ti-calendar me-1 text-primary" />
                                                                        {dayjs(apt.scheduledAt).format('DD MMM, YYYY')}
                                                                    </small>
                                                                    <small className="text-primary d-block fs-12 mt-1 fw-bold bg-primary-subtle px-2 py-0.5 rounded" style={{ width: 'fit-content' }}>
                                                                        <i className="ti ti-hash me-1" />
                                                                        ID: {apt.appointmentCode || apt.id?.substring(0, 8).toUpperCase()}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Medicines Table */}
                                <div className="mb-4">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <h6 className="fw-semibold mb-0">
                                            <i className="ti ti-pill me-1 text-primary" /> Medicines
                                        </h6>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={addMedicine}
                                        >
                                            Add Medicine <i className="ti ti-plus ms-2" /></button>
                                    </div>

                                    <div className="table-responsive border rounded" style={{ overflow: 'visible' }}>
                                        <table className="table mb-0" style={{ overflow: 'visible', borderCollapse: 'collapse', width: '100%' }}>
                                            <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
                                                <tr className="text-dark fw-bold">
                                                    <th style={{ width: 50, color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569', textAlign: 'center' }}>#</th>
                                                    <th style={{ color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569' }}>Medicine Name <span className="text-danger">*</span></th>
                                                    <th style={{ color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569' }}>Dosage</th>
                                                    <th style={{ color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569' }}>Frequency</th>
                                                    <th style={{ color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569' }}>Duration</th>
                                                    <th style={{ color: '#1e293b', fontWeight: 'bold', border: '1.5px solid #475569' }}>Timings</th>
                                                    <th style={{ width: 50, border: '1.5px solid #475569' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medicines.map((med, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #475569' }}>
                                                        <td className="text-dark fw-bold text-center" style={{ border: '1px solid #475569', verticalAlign: 'middle', color: '#0f172a' }}>
                                                            {String(index + 1).padStart(2, "0")}
                                                        </td>
                                                        <td style={{ position: 'relative', zIndex: activeSearchIndex === index ? 10 : 1, border: '1px solid #475569' }}>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm text-dark fw-medium border-secondary"
                                                                placeholder="e.g. Paracetamol 500mg"
                                                                value={med.medicineName}
                                                                onChange={(e) => {
                                                                    updateMedicine(index, "medicineName", e.target.value);
                                                                    setActiveSearchIndex(index);
                                                                }}
                                                                onFocus={() => setActiveSearchIndex(index)}
                                                                onBlur={() => {
                                                                    setTimeout(() => setActiveSearchIndex(null), 250);
                                                                }}
                                                                required
                                                                autoComplete="off"
                                                            />
                                                            {activeSearchIndex === index && (
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
                                                                        .filter((opt: string) => 
                                                                            opt.toLowerCase().includes((med.medicineName || "").toLowerCase())
                                                                        )
                                                                        .map((opt: string) => (
                                                                            <div
                                                                                key={opt}
                                                                                className="medicine-dropdown-item text-dark fw-medium"
                                                                                onMouseDown={() => {
                                                                                    updateMedicine(index, "medicineName", opt);
                                                                                    setActiveSearchIndex(null);
                                                                                }}
                                                                            >
                                                                                {opt}
                                                                            </div>
                                                                        ))}
                                                                    {medicineOptions.filter((opt: string) => 
                                                                        opt.toLowerCase().includes((med.medicineName || "").toLowerCase())
                                                                    ).length === 0 && (
                                                                        <div className="px-3 py-2 text-muted fs-12">
                                                                            No matching medicines
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ border: '1px solid #475569' }}>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm text-dark fw-medium border-secondary"
                                                                placeholder="e.g. 1 tablet"
                                                                value={med.dosage}
                                                                onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                                                            />
                                                        </td>
                                                        <td style={{ border: '1px solid #475569' }}>
                                                            <select
                                                                className="form-select form-select-sm text-dark fw-medium border-secondary"
                                                                value={med.frequency}
                                                                onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                                                            >
                                                                {FREQUENCY_OPTIONS.map((f) => (
                                                                    <option key={f} value={f}>{f}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td style={{ border: '1px solid #475569' }}>
                                                            <select
                                                                className="form-select form-select-sm text-dark fw-medium border-secondary"
                                                                value={med.duration}
                                                                onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                                                            >
                                                                {DURATION_OPTIONS.map((d) => (
                                                                    <option key={d} value={d}>{d}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td style={{ border: '1px solid #475569' }}>
                                                            <select
                                                                className="form-select form-select-sm text-dark fw-medium border-secondary"
                                                                value={med.timings}
                                                                onChange={(e) => updateMedicine(index, "timings", e.target.value)}
                                                            >
                                                                {TIMING_OPTIONS.map((t) => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="text-center" style={{ border: '1px solid #475569', verticalAlign: 'middle' }}>
                                                            {medicines.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeMedicine(index)}
                                                                >
                                                                    <i className="ti ti-trash" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Advice */}
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Advice / Notes</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Doctor's advice and instructions..."
                                        value={advice}
                                        onChange={(e) => setAdvice(e.target.value)}
                                    />
                                </div>

                                {/* Follow Up */}
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-medium">Follow Up Date</label>
                                        <DatePicker
                                            className="form-control"
                                            format="DD-MM-YYYY"
                                            value={followUpDate}
                                            onChange={(date) => setFollowUpDate(date)}
                                            placeholder="Select date"
                                            suffixIcon={null}
                                            disabledDate={(d) => d && d < dayjs().startOf("day")}
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label fw-medium">Follow Up Notes</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Come fasting, bring reports"
                                            value={followUpNotes}
                                            onChange={(e) => setFollowUpNotes(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light border-top py-3 px-4" style={{ flexShrink: 0 }}>
                                <button type="button" className="btn btn-outline-secondary fw-bold px-4 me-2" onClick={onClose} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={submitting}>
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                                    ) : (
                                        initialPrescription ? <><i className="ti ti-check me-1" /> Save Changes</> : <><i className="ti ti-plus me-1" /> Add Prescription</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`
                .medicine-dropdown-item {
                    padding: 8px 12px;
                    font-size: 13px;
                    color: #1e293b;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    text-align: left;
                }
                .medicine-dropdown-item:hover {
                    background-color: #f1f5f9;
                    color: #4f46e5;
                    font-weight: 500;
                }
            `}</style>
        </>
    );
};

export default AddPrescriptionModal;
