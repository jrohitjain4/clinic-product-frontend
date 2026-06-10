import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import PatientsDeleteModal from "../../clinic-modules/patients/patientsDeleteModal";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import AddPrescriptionModal from "../doctors-prescriptions/AddPrescriptionModal";

const MyPatients = () => {
    const [user, setUser] = useState<any>(null);
    const { doctors, loading: loadingDoctors } = useClinicDoctors();
    const { patients, loading, error, refetch, reload } = useClinicPatients();
    const { createPrescription } = usePrescriptions();
    const [selected, setSelected] = useState<ClinicPatient | null>(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [prescriptionPatientId, setPrescriptionPatientId] = useState<string | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const currentDoctor = useMemo(() => {
        if (!user || user.role !== "DOCTOR" || doctors.length === 0) return null;
        return doctors.find(
            (d: any) => d.email === user.email || d.userId === user.id || d.id === user.id
        );
    }, [doctors, user]);

    const myPatients = useMemo(() => {
        if (!currentDoctor) return [];
        // Since primaryDoctorId was removed, show all patients for now
        // In the future, filter by patients who have appointments with this doctor
        return patients;
    }, [patients, currentDoctor]);

    const patientDetailsPath = (id: string) =>
        all_routes.patientDetails.replace(":id", id);
    const editPatientPath = (id: string) =>
        all_routes.editPatient.replace(":id", id);

    if (loading || loadingDoctors) {
        return (
            <div className="page-wrapper">
                <div className="content">
                    <div className="text-center py-5">
                        <span className="spinner-border text-primary" role="status" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="page-wrapper">
                <div className="content">
                    <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                        <div className="flex-grow-1">
                            <h4 className="fw-bold mb-0 text-dark">
                                My Patients
                                <span className="badge badge-soft-primary fw-bold border py-1 px-2 border-primary fs-13 ms-1">
                                    Total Patients : {myPatients.length}
                                </span>
                            </h4>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger d-flex justify-content-between mb-3">
                            <span>{error}</span>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => reload()}>
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="row g-2">
                        {myPatients.map((p) => {
                            const hasImage = p.profileImage && p.profileImage.trim() !== "" && !p.profileImage.includes("300x300");
                            const img = hasImage ? resolveMediaUrl(p.profileImage!) : "assets/img/patient-placeholder.png";

                            const location =
                                p.city && p.city !== "—"
                                    ? `${p.city}${p.state ? `, ${p.state}` : ""}`
                                    : p.addressShort || "—";

                            const statusLabel = p.status === "Active" ? "Available" : (p.status === "Inactive" ? "Unavailable" : p.status);

                            return (
                                <div key={p.id} className="col-xl-3 col-lg-4 col-md-6 mb-2">
                                    <div className="card h-100 shadow-sm border-0 border-top border-3 border-primary transition-all position-relative">
                                        <div className="card-body d-flex align-items-center p-2 overflow-hidden">
                                            <div className="me-2 ps-1">
                                                <Link to={patientDetailsPath(p.id)} className="d-block overflow-hidden rounded-circle border border-2 border-primary-light p-1" style={{ width: "85px", height: "85px" }}>
                                                    <ImageWithBasePath
                                                        src="assets/img/patient-placeholder.png"
                                                        className="w-100 h-100 rounded-circle"
                                                        alt={p.fullName || "Patient"}
                                                        style={{ objectFit: "cover" }}
                                                    />
                                                </Link>
                                            </div>
                                            <div className="flex-fill pe-2 overflow-hidden">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <h5 className="mb-0 fw-bold">
                                                        <Link to={patientDetailsPath(p.id)} className="text-dark text-truncate d-block" style={{ maxWidth: '140px' }}>
                                                            {p.fullName || `${p.firstName} ${p.lastName}`}
                                                        </Link>
                                                    </h5>
                                                    <div className="dropdown">
                                                        <Link
                                                            to="#"
                                                            data-bs-toggle="dropdown"
                                                            className="avatar avatar-xs border text-muted rounded-circle d-inline-flex align-items-center justify-content-center bg-transparent"
                                                        >
                                                            <i className="ti ti-dots-vertical" />
                                                        </Link>
                                                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 p-1">
                                                            <li>
                                                                <Link to={patientDetailsPath(p.id)} className="dropdown-item d-flex align-items-center py-2">
                                                                    <i className="ti ti-eye me-2 text-info" /> View Details
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link to={all_routes.doctorsappointments} className="dropdown-item d-flex align-items-center py-2">
                                                                    <i className="ti ti-calendar-event me-2 text-success" /> Appointments
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link
                                                                    to="#"
                                                                    className="dropdown-item d-flex align-items-center py-2"
                                                                    onClick={() => {
                                                                        setPrescriptionPatientId(p.id);
                                                                        setShowPrescriptionModal(true);
                                                                    }}
                                                                >
                                                                    <i className="ti ti-file-plus me-2 text-primary" /> Add Prescription
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <span className="d-block mb-1 fs-13 text-primary fw-medium text-truncate">
                                                    {p.ageGenderLabel || "—"} {p.bloodGroup ? `| ${p.bloodGroup}` : ""}
                                                </span>
                                                <div className="mb-2 d-flex align-items-center gap-2">
                                                    <span
                                                        className={`badge ${statusLabel === "Available"
                                                            ? "badge-soft-success border-success"
                                                            : "badge-soft-danger border-danger"
                                                            } border rounded-pill fs-11 fw-bold`}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <div className="border-top pt-2 mt-1">
                                                    <p className="mb-1 text-truncate fs-12 d-flex align-items-center text-muted">
                                                        <i className="ti ti-calendar me-1" />
                                                        Last Visit: <span className="text-dark ms-1 fw-medium text-truncate">{p.lastVisitLabel || "—"}</span>
                                                    </p>
                                                    <p className="mb-0 text-truncate fs-12 d-flex align-items-center text-muted w-100">
                                                        <i className="ti ti-location-pin me-1" />
                                                        <span className="text-dark text-truncate d-block flex-fill" title={location}>{location}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!loading && myPatients.length === 0 && !error && (
                        <div className="border rounded bg-white">
                            <EmptyState
                                title="No patients assigned to you yet"
                                message="Your patients will appear here once they are assigned to you."
                            />
                        </div>
                    )}
                </div>
            </div>

            <PatientsDeleteModal
                patient={selected}
                onClear={() => setSelected(null)}
                onDeleted={refetch}
            />

            {showPrescriptionModal && (
                <AddPrescriptionModal
                    onClose={() => setShowPrescriptionModal(false)}
                    initialPatientId={prescriptionPatientId || undefined}
                    initialDoctorId={currentDoctor?.id}
                    onSubmit={async (data: Record<string, any>) => {
                        await createPrescription(data);
                        setShowPrescriptionModal(false);
                    }}
                />
            )}
        </>
    );
};

export default MyPatients;
