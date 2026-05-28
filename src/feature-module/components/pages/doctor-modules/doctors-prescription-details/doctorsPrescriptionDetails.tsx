import { Link, useSearchParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";

const DoctorsPrescriptionDetails = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { getPrescriptionById } = usePrescriptions();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getPrescriptionById(id)
      .then((data) => setPrescription(data))
      .catch(() => setPrescription(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <i className="ti ti-file-off fs-1 text-muted" />
          <p className="text-muted mt-2">Prescription not found.</p>
          <Link to={all_routes.doctorsprescriptions} className="btn btn-primary btn-sm">
            Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const medicines = prescription.medicines || [];

  const patientAge = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              {/* Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column mb-4">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.doctorsprescriptions} className="me-1 text-primary">
                      <i className="ti ti-chevron-left" /> Prescriptions
                    </Link>
                  </h6>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-body">
                  {/* Logo + Prescription ID */}
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <ImageWithBasePath src="assets/img/logo.svg" alt="logo" />
                    <span className="badge bg-info-subtle text-info-emphasis fs-13 fw-medium border border-primary py-1 px-3">
                      {prescription.prescriptionCode || "#---"}
                    </span>
                  </div>

                  {/* Clinic + Doctor Info */}
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar avatar-xxl rounded bg-light border p-2">
                        <ImageWithBasePath src="./assets/img/icons/trust-care.svg" alt="clinic" className="img-fluid" />
                      </div>
                      <div>
                        <h6 className="text-dark fw-semibold mb-1">Preclinic Medical Center</h6>
                        <p className="mb-1">{doctor.fullName || "-"}</p>
                        <p className="mb-0 text-muted fs-13">
                          {doctor.designation?.name || ""}{doctor.department?.name ? ` · ${doctor.department.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg-end">
                      <p className="text-dark mb-1">
                        Department: <span className="text-body">{doctor.department?.name || "-"}</span>
                      </p>
                      <p className="text-dark mb-1">
                        Prescribed on: <span className="text-body">
                          {new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </p>
                      {prescription.followUpDate && (
                        <p className="text-dark mb-0">
                          Follow Up: <span className="text-body">
                            {new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="mb-3">
                    <h6 className="mb-2 fs-14 fw-medium">Patient Details</h6>
                    <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <h6 className="m-0 fw-semibold fs-16">
                        {patient.firstName} {patient.lastName}
                      </h6>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {patientAge !== null && (
                          <p className="mb-0 text-dark">{patientAge}Y / {patient.gender || "—"}</p>
                        )}
                        {patient.bloodGroup && (
                          <p className="mb-0 text-dark">
                            <span className="text-body">Blood</span> : {patient.bloodGroup}
                          </p>
                        )}
                        {patient.patientCode && (
                          <p className="mb-0 text-dark">
                            Patient ID <span className="text-body">{patient.patientCode}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div className="mb-4">
                    <h6 className="mb-3 fs-16 fw-semibold text-center">
                      {doctor.department?.name ? `${doctor.department.name} Prescription` : "Prescription"}
                    </h6>
                    <div className="table-responsive border bg-white">
                      <table className="table table-nowrap">
                        <thead className="table-light">
                          <tr>
                            <th className="text-dark">SNO</th>
                            <th className="text-dark">Medicine Name</th>
                            <th className="text-dark">Dosage</th>
                            <th className="text-dark">Frequency</th>
                            <th className="text-dark">Duration</th>
                            <th className="text-dark">Timings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.length > 0 ? medicines.map((med: any, i: number) => (
                            <tr key={med.id || i}>
                              <td>{String(i + 1).padStart(2, "0")}</td>
                              <td className="fw-medium">{med.medicineName}</td>
                              <td>{med.dosage || "—"}</td>
                              <td className="text-primary fw-medium">{med.frequency || "—"}</td>
                              <td>{med.duration || "—"}</td>
                              <td>{med.timings || "—"}</td>
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
                  {prescription.advice && (
                    <div className="pb-3 mb-3 border-bottom">
                      <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
                      <p className="mb-0">{prescription.advice}</p>
                    </div>
                  )}

                  {/* Follow Up */}
                  <div className="pb-3 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h6 className="mb-1 fs-14 fw-semibold">Follow Up</h6>
                      <p className="mb-0">
                        {prescription.followUpDate
                          ? new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                          : "—"}
                        {prescription.followUpNotes ? ` · ${prescription.followUpNotes}` : ""}
                      </p>
                    </div>
                    <div className="text-end">
                      <ImageWithBasePath src="assets/img/icons/signature-img.svg" alt="signature" className="img-fluid mb-1" />
                      <h6 className="fs-14 fw-semibold mb-0">{doctor.fullName || "—"}</h6>
                      <p className="fs-13 fw-normal text-muted">{doctor.designation?.name || ""}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="text-center d-flex align-items-center justify-content-center gap-2">
                    <button onClick={handlePrint} className="btn btn-md btn-dark d-flex align-items-center">
                      <i className="ti ti-printer me-1" /> Print
                    </button>
                    <button onClick={handlePrint} className="btn btn-md btn-primary d-flex align-items-center">
                      <i className="ti ti-download me-1" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-white border-top text-center">
        <p className="text-dark text-center mb-0">
          2025 © <span className="text-info">Preclinic</span>, All Rights Reserved
        </p>
      </div>
    </>
  );
};

export default DoctorsPrescriptionDetails;
