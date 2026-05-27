import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import {
  all_routes,
  doctorDetailsPath,
  editDoctorPath,
} from "../../../../routes/all_routes";
import type { ClinicDoctor } from "../../../../../core/types/clinicDoctor";

const PLACEHOLDER_IMAGES = [
  "doctor-01.jpg",
  "doctor-02.jpg",
  "doctor-03.jpg",
  "doctor-04.jpg",
  "doctor-05.jpg",
];

interface DoctorsGridProps {
  doctors: ClinicDoctor[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const DoctorsGrid = ({ doctors, loading, error, onRetry }: DoctorsGridProps) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2 mb-0">Loading doctors…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <span>{error}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-5 border rounded bg-white">
        <i className="ti ti-stethoscope fs-1 text-muted d-block mb-2" />
        <h6 className="fw-bold">No doctors yet</h6>
        <p className="text-muted mb-3">Add your first doctor to see them here.</p>
        <Link to={all_routes.addDoctors} className="btn btn-primary">
          <i className="ti ti-plus me-1" />
          Add Doctor
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="row">
        {doctors.map((doctor, index) => {
          const img =
            doctor.profileImage ||
            `assets/img/doctors/${PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}`;
          const designation = doctor.designation?.name || "Doctor";
          const fee = doctor.consultationCharge
            ? `$${doctor.consultationCharge}`
            : "—";
          const statusLabel = doctor.status === "Active" ? "Available" : doctor.status;

          return (
            <div key={doctor.id} className="col-xl-4 col-md-6">
              <div className="card">
                <div className="card-body d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3">
                  <div className="me-3 doctor-profile-img">
                    <Link to={doctorDetailsPath(doctor.id)}>
                      <ImageWithBasePath src={img} className="rounded" alt={doctor.fullName} />
                    </Link>
                  </div>
                  <div className="flex-fill">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <h6 className="mb-0 fw-semibold">
                        <Link to={doctorDetailsPath(doctor.id)}>{doctor.fullName}</Link>
                      </h6>
                      <div className="action-item">
                        <Link to="#" data-bs-toggle="dropdown">
                          <i className="ti ti-dots-vertical" />
                        </Link>
                        <ul className="dropdown-menu">
                          <li>
                            <Link
                              to={editDoctorPath(doctor.id)}
                              className="dropdown-item d-flex align-items-center"
                            >
                              Edit
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item d-flex align-items-center"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <span className="d-block mb-2 fs-13">{designation}</span>
                    <p className="mb-2 fs-13">
                      {doctor.department?.name || "—"} ·{" "}
                      <span
                        className={
                          statusLabel === "Available"
                            ? "text-success"
                            : "text-muted"
                        }
                      >
                        {statusLabel}
                      </span>
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="text-primary fs-14 mb-0">
                        <span className="text-muted fs-13 fw-normal">Starts From : </span>
                        {fee}
                      </h6>
                      <Link
                        to={all_routes.appointmentCalendar}
                        className="avatar avatar-xs border text-muted fs-14"
                      >
                        <i className="ti ti-calendar-cog" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DoctorsGrid;
