import { useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import PatientsDeleteModal from "../patients/patientsDeleteModal";
import { HasPermission } from "../../../../../core/utils/staffPermissions";

const PatientsGrid = () => {
  const { patients, loading, error, refetch, reload } = useClinicPatients();
  const [selected, setSelected] = useState<ClinicPatient | null>(null);

  const patientDetailsPath = (id: string) =>
    all_routes.patientDetails.replace(":id", id);
  const editPatientPath = (id: string) =>
    all_routes.editPatient.replace(":id", id);

  const placeholders = [
    "user-08.jpg",
    "user-16.jpg",
    "user-06.jpg",
    "user-25.jpg",
    "user-39.jpg",
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Patient Grid
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {loading ? "…" : patients.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="d-flex align-items-center gap-2 me-2">
                <Link
                  to={all_routes.patients}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={all_routes.patientsGrid}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
              <HasPermission module="Patients" action="CREATE">
                <Link
                  to={all_routes.createPatient}
                  className="btn btn-primary ms-2 fs-13 btn-md"
                >
                  New Patient <i className="ti ti-plus ms-2" /></Link>
              </HasPermission>
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

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="row g-2">
              {patients.map((p, index) => {
                const img =
                  p.profileImage ||
                  `assets/img/users/${placeholders[index % placeholders.length]}`;
                const location =
                  p.fullAddress && p.fullAddress !== "—"
                    ? p.fullAddress
                    : p.addressShort || "—";
                return (
                  <div key={p.id} className="col-xl-4 col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center">
                            <Link
                              to={patientDetailsPath(p.id)}
                              className="avatar avatar-lg me-2"
                            >
                              <ImageWithBasePath
                                src={img}
                                alt={p.fullName || "Patient"}
                                className="rounded-circle"
                              />
                            </Link>
                            <Link
                              to={patientDetailsPath(p.id)}
                              className="text-dark fw-semibold"
                            >
                              {p.fullName || `${p.firstName} ${p.lastName}`}
                              <span className="text-body fs-13 fw-normal d-block">
                                {p.ageGenderLabel || "—"}
                              </span>
                            </Link>
                          </div>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical" />
                            </button>
                            <ul className="dropdown-menu p-2">
                              <HasPermission module="Patients" action="EDIT">
                                <li>
                                  <Link
                                    to={editPatientPath(p.id)}
                                    className="dropdown-item"
                                  >
                                    Edit
                                  </Link>
                                </li>
                              </HasPermission>
                              <HasPermission module="Patients" action="DELETE">
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_patient_modal"
                                    onClick={() => setSelected(p)}
                                  >
                                    Delete
                                  </button>
                                </li>
                              </HasPermission>
                              <li>
                                <Link
                                  to={all_routes.appointments}
                                  className="dropdown-item"
                                >
                                  Appointment
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <p className="mb-2 text-truncate fs-13 d-flex align-items-center">
                          <i className="ti ti-calendar me-1 text-dark" />
                          Last Visit : {p.lastVisitLabel || "—"}
                        </p>
                        <p className="mb-0 text-truncate fs-13 d-flex align-items-center">
                          <i className="ti ti-location-pin me-1 text-dark" />
                          {location}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && patients.length === 0 && !error && (
            <div className="text-center py-5">
              <p className="text-muted mb-3">No patients found.</p>
              <HasPermission module="Patients" action="CREATE">
                <Link to={all_routes.createPatient} className="btn btn-primary">
                  New Patient
                </Link>
              </HasPermission>
            </div>
          )}
        </div>
      </div>

      <PatientsDeleteModal
        patient={selected}
        onClear={() => setSelected(null)}
        onDeleted={refetch}
      />
    </>
  );
};

export default PatientsGrid;
