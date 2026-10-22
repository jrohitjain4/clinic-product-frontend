import { useState } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import PatientsDeleteModal from "../patients/patientsDeleteModal";
import { HasPermission } from "../../../../../core/utils/staffPermissions";

const getInitial = (value?: string) =>
  (value || "").trim().charAt(0).toUpperCase() || "?";

const PatientsGrid = () => {
  const { patients, loading, error, refetch, reload } = useClinicPatients();
  const [selected, setSelected] = useState<ClinicPatient | null>(null);

  const patientDetailsPath = (id: string) =>
    all_routes.patientDetails.replace(":id", id);
  const editPatientPath = (id: string) =>
    all_routes.editPatient.replace(":id", id);

  if (loading) {
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
                Patients Grid
                <span className="badge badge-soft-primary fw-bold border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {patients.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
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
                  className="btn btn-primary ms-1 fw-bold fs-13"
                  style={{ height: '38px' }}
                >
                  New Patient <i className="ti ti-plus ms-1" /></Link>
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

          <div className="row g-2">
            {patients.map((p) => {
              const displayName = p.fullName || `${p.firstName} ${p.lastName}`;

              // Ensure location is concise and doesn't include emails
              const location =
                p.city && p.city !== "—"
                  ? `${p.city}${p.state ? `, ${p.state}` : ""}`
                  : p.addressShort || "—";

              const statusLabel = p.status === "Active" ? "Available" : (p.status === "Inactive" ? "Unavailable" : p.status);

              return (
                <div key={p.id} className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 mb-2">
                  <div className="card h-100 shadow-sm border-0 border-top border-3 border-primary transition-all position-relative">
                    <div className="card-body d-flex align-items-center p-2 overflow-hidden">
                      <div className="me-2 ps-1">
                        <Link
                          to={patientDetailsPath(p.id)}
                          className="d-flex align-items-center justify-content-center overflow-hidden rounded-circle border border-2 border-primary-light p-1"
                          style={{ width: "85px", height: "85px" }}
                        >
                          <span
                            className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white w-100 h-100"
                            style={{
                              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                              fontSize: "28px",
                            }}
                          >
                            {getInitial(displayName)}
                          </span>
                        </Link>
                      </div>
                      <div className="flex-fill pe-2 overflow-hidden">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <h5 className="mb-0 fw-bold">
                            <Link to={patientDetailsPath(p.id)} className="text-dark text-truncate d-block" style={{ maxWidth: '140px' }}>
                              {displayName}
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
                              <HasPermission module="Patients" action="EDIT">
                                <li>
                                  <Link to={editPatientPath(p.id)} className="dropdown-item d-flex align-items-center py-2">
                                    <i className="ti ti-edit me-2 text-primary" /> Edit
                                  </Link>
                                </li>
                              </HasPermission>
                              <li>
                                <Link to={all_routes.appointments} className="dropdown-item d-flex align-items-center py-2">
                                  <i className="ti ti-calendar-event me-2 text-info" /> Appointment
                                </Link>
                              </li>
                              <HasPermission module="Patients" action="DELETE">
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item d-flex align-items-center py-2 text-danger"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_patient_modal"
                                    onClick={() => setSelected(p)}
                                  >
                                    <i className="ti ti-trash me-2" /> Delete
                                  </Link>
                                </li>
                              </HasPermission>
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

          {!loading && patients.length === 0 && !error && (
            <div className="border rounded bg-white">
              <EmptyState
                title="No patients yet"
                message="Add your first patient to see them grouped here."
                action={
                  <HasPermission module="Patients" action="CREATE">
                    <Link to={all_routes.createPatient} className="btn btn-primary">
                      New Patient <i className="ti ti-plus ms-1" />
                    </Link>
                  </HasPermission>
                }
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
    </>
  );
};

export default PatientsGrid;
