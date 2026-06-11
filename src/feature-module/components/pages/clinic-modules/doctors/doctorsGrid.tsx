import { Link } from "react-router";
import EmptyState from "../../../../../core/common/emptyState";
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
  onDelete: (id: string) => void;
}

const DoctorsGrid = ({ doctors, loading, error, onRetry, onDelete }: DoctorsGridProps) => {
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
      <div className="border rounded bg-white py-3">
        <EmptyState
          title="No doctors yet"
          message="Every great clinic needs amazing doctors. Start by adding your first medical professional."
          action={
            <Link to={all_routes.addDoctors} className="btn btn-primary">
              Add Doctor <i className="ti ti-plus ms-2" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="row g-2">
        {doctors.map((doctor, index) => {
          const img = doctor.profileImage || "assets/img/doctor-placeholder.png";
          const designation = doctor.designation?.name || "Doctor";
          const fee = doctor.consultationCharge
            ? `₹${doctor.consultationCharge}`
            : "—";
          const statusLabel = doctor.status === "Active" ? "Available" : (doctor.status === "Inactive" ? "Unable" : doctor.status);

          return (
            <div key={doctor.id} className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 mb-3">
              <div className="card h-100 shadow-sm border-0 border-top border-3 border-primary transition-all doctor-grid-card">
                <div className="card-body d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3 p-3">
                  <div className="me-2 ps-1">
                    <Link to={doctorDetailsPath(doctor.id)} className="d-block overflow-hidden rounded-circle border border-2 border-primary-light p-1" style={{ width: "100px", height: "100px" }}>
                      <ImageWithBasePath
                        src={img}
                        className="w-100 h-100 rounded-circle"
                        alt={doctor.fullName}
                        style={{ objectFit: "cover" }}
                      />
                    </Link>
                  </div>
                  <div className="flex-fill pe-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <h5 className="mb-0 fw-bold">
                        <Link to={doctorDetailsPath(doctor.id)} className="text-dark">{doctor.fullName}</Link>
                      </h5>
                      <div className="action-item">
                        <Link
                          to="#"
                          data-bs-toggle="dropdown"
                          className="avatar avatar-xs border text-muted rounded-circle d-inline-flex align-items-center justify-content-center bg-transparent"
                        >
                          <i className="ti ti-dots-vertical" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0">
                          <li>
                            <Link
                              to={editDoctorPath(doctor.id)}
                              className="dropdown-item d-flex align-items-center py-2"
                            >
                              <i className="ti ti-edit me-2 text-primary" /> Edit
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item d-flex align-items-center py-2 text-danger"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                              onClick={() => onDelete(doctor.id)}
                            >
                              <i className="ti ti-trash me-2" /> Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <span className="d-block mb-1 fs-14 text-primary fw-medium">{designation}</span>
                    <p className="mb-2 fs-13 d-flex align-items-center gap-2">
                      <span className="text-muted fw-medium">{doctor.department?.name || "—"}</span>
                      <span className="text-muted">|</span>
                      <span
                        className={`badge ${statusLabel === "Available"
                          ? "badge-soft-success"
                          : "badge-soft-danger"
                          } rounded-pill fs-12`}
                      >
                        {statusLabel}
                      </span>
                    </p>
                    <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                      <h6 className="text-dark fs-15 mb-0 fw-bold">
                        <span className="text-muted fs-13 fw-normal">Starts From : </span>
                        {fee}
                      </h6>
                      <div
                        className="d-flex align-items-center justify-content-center border-primary border-2 border rounded-circle text-primary fw-bold"
                        style={{ width: "38px", height: "38px", fontSize: "10px", backgroundColor: "#f0f0ff" }}
                        title="Profile Completion"
                      >
                        85%
                      </div>
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
