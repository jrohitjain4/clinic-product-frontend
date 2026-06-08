import { useState, useMemo } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";

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

const AddPrescriptionModal = ({ onClose, onSubmit, initialPatientId, initialDoctorId, initialAppointmentId, linkedAppointments }: Props) => {
    const { appointments } = useClinicAppointments();

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

    const [patientId, setPatientId] = useState(initialPatientId || "");
    const [doctorId, setDoctorId] = useState(initialDoctorId || loggedDoctorFromAppointment?.id || "");
    const [appointmentId, setAppointmentId] = useState(initialAppointmentId || "");
    const [advice, setAdvice] = useState("");
    const [followUpDate, setFollowUpDate] = useState<any>(null);
    const [followUpNotes, setFollowUpNotes] = useState("");
    const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()]);
    const [submitting, setSubmitting] = useState(false);

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

    const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);
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
                        <div className="modal-header bg-primary text-white" style={{ flexShrink: 0 }}>
                            <h5 className="modal-title fw-bold text-white">
                                <i className="ti ti-file-plus me-2" />
                                Add New Prescription
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                                {/* Patient & Doctor */}
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

                                {/* Appointment Link (New Section) */}
                                {(linkedAppointments && linkedAppointments.length > 0) && (
                                    <div className="mb-4 p-3 border rounded bg-info-subtle border-info-subtle">
                                        <label className="form-label fw-bold text-info-emphasis d-flex align-items-center">
                                            <i className="ti ti-link me-2" />
                                            Select Visit for this Prescription
                                        </label>
                                        <div className="row g-2">
                                            {linkedAppointments.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((apt) => (
                                                <div className="col-md-4" key={apt.id}>
                                                    <div
                                                        className={`card h-100 cursor-pointer border-2 transition-all ${appointmentId === apt.id ? 'border-primary bg-primary-subtle' : 'border-light-subtle'}`}
                                                        onClick={() => setAppointmentId(apt.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="card-body p-2 d-flex align-items-center gap-2">
                                                            <div className={`rounded-circle p-1 ${appointmentId === apt.id ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                                                                <i className={`ti ${appointmentId === apt.id ? 'ti-check' : 'ti-circle'}`} />
                                                            </div>
                                                            <div>
                                                                <span className="d-block fw-bold fs-12">
                                                                    {apt.status === 'Follow-up' ? 'Follow-up Visit' : 'Main Consultation'}
                                                                </span>
                                                                <small className="text-muted d-block fs-11">
                                                                    {dayjs(apt.scheduledAt).format('DD MMM, YYYY')}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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

                                    <div className="table-responsive border rounded">
                                        <table className="table table-bordered mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: 40 }}>#</th>
                                                    <th>Medicine Name <span className="text-danger">*</span></th>
                                                    <th>Dosage</th>
                                                    <th>Frequency</th>
                                                    <th>Duration</th>
                                                    <th>Timings</th>
                                                    <th style={{ width: 48 }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medicines.map((med, index) => (
                                                    <tr key={index}>
                                                        <td className="text-muted fw-medium text-center">
                                                            {String(index + 1).padStart(2, "0")}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="e.g. Paracetamol 500mg"
                                                                value={med.medicineName}
                                                                onChange={(e) => updateMedicine(index, "medicineName", e.target.value)}
                                                                required
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="e.g. 1 tablet"
                                                                value={med.dosage}
                                                                onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={med.frequency}
                                                                onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                                                            >
                                                                {FREQUENCY_OPTIONS.map((f) => (
                                                                    <option key={f} value={f}>{f}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={med.duration}
                                                                onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                                                            >
                                                                {DURATION_OPTIONS.map((d) => (
                                                                    <option key={d} value={d}>{d}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={med.timings}
                                                                onChange={(e) => updateMedicine(index, "timings", e.target.value)}
                                                            >
                                                                {TIMING_OPTIONS.map((t) => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="text-center">
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
                                        <><i className="ti ti-plus me-1" /> Add Prescription</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddPrescriptionModal;
