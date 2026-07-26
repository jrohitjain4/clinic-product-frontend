import React from "react";

interface IpdViewDetailsModalProps {
  show: boolean;
  onClose: () => void;
  admission: any;
}

const formatCurrency = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return `₹${val.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const IpdViewDetailsModal: React.FC<IpdViewDetailsModalProps> = ({ show, onClose, admission }) => {
  if (!show || !admission) return null;

  const patient = admission.patient || {};
  const patientName =
    patient.fullName ||
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    "Patient";
  const doctorName = admission.doctor?.fullName ? `Dr. ${admission.doctor.fullName}` : "Primary Doctor";
  const wardName = admission.ward?.wardName || "Ward";
  const wardType = admission.ward?.wardType || "";
  const wardCharge = admission.ward?.chargePerNight || 0;

  const isDischarged = admission.status === "Discharged";

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
          
          {/* Header */}
          <div className="modal-header bg-light border-bottom py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle me-1">
                <i className="ti ti-eye fs-20" />
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-dark">
                  IPD Admission Details — <span className="text-primary">{admission.admissionCode || "IPD"}</span>
                </h5>
                <span className="text-muted fs-12">Complete Inpatient Stay & Billing Summary</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4">

            {/* Top Status & Date Banner */}
            <div className="p-3 bg-soft-light rounded-3 border mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">ADMISSION STATUS</span>
                {isDischarged ? (
                  <span className="badge bg-danger py-1 px-3 fs-13 fw-bold mt-1">
                    <i className="ti ti-user-check me-1" /> DISCHARGED
                  </span>
                ) : (
                  <span className="badge bg-success py-1 px-3 fs-13 fw-bold mt-1">
                    <i className="ti ti-activity me-1" /> ACTIVE INPATIENT
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">ADMISSION DATE</span>
                <span className="fw-bold fs-14 text-dark">{formatDate(admission.admissionDate)}</span>
              </div>

              {isDischarged && (
                <div>
                  <span className="text-muted fs-12 d-block fw-semibold uppercase">DISCHARGE DATE</span>
                  <span className="fw-bold fs-14 text-dark">{formatDate(admission.dischargeDate)}</span>
                </div>
              )}

              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">PAYMENT STATUS</span>
                <span
                  className={`badge py-1 px-3 fs-13 fw-bold mt-1 ${
                    admission.paymentStatus === "Paid"
                      ? "bg-soft-success text-success border border-success"
                      : admission.paymentStatus === "Partial"
                      ? "bg-soft-warning text-warning border border-warning"
                      : "bg-soft-danger text-danger border border-danger"
                  }`}
                >
                  {admission.paymentStatus || "Unpaid"}
                </span>
              </div>
            </div>

            {/* Grid 1: Patient & Medical Team Details */}
            <div className="row g-3 mb-4">
              {/* Patient Info Card */}
              <div className="col-md-6">
                <div className="card border shadow-none h-100 mb-0">
                  <div className="card-header bg-light py-2 px-3 border-bottom">
                    <h6 className="mb-0 fw-bold fs-13 text-dark">
                      <i className="ti ti-user me-1 text-primary" /> Patient Information
                    </h6>
                  </div>
                  <div className="card-body p-3 fs-13">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Full Name</span>
                        <strong className="text-dark">{patientName}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">UHID / Patient Code</span>
                        <span className="badge bg-soft-dark text-dark fw-bold">
                          {patient.patientCode || "—"}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Phone Number</span>
                        <span className="text-dark fw-semibold">{patient.phone || "—"}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Age / Gender / Blood</span>
                        <span className="text-dark fw-semibold">
                          {[patient.age ? `${patient.age} Yrs` : null, patient.gender, patient.bloodGroup]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor & Ward Info Card */}
              <div className="col-md-6">
                <div className="card border shadow-none h-100 mb-0">
                  <div className="card-header bg-light py-2 px-3 border-bottom">
                    <h6 className="mb-0 fw-bold fs-13 text-dark">
                      <i className="ti ti-stethoscope me-1 text-info" /> Doctor & Ward Assignment
                    </h6>
                  </div>
                  <div className="card-body p-3 fs-13">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Primary Doctor</span>
                        <strong className="text-primary">{doctorName}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Assigned Ward</span>
                        <strong className="text-dark">{wardName}</strong>
                        {wardType && <span className="text-muted fs-11 ms-1">({wardType})</span>}
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Doctor Visit Charge</span>
                        <span className="text-dark fw-semibold">
                          {formatCurrency(admission.doctorFee || admission.doctor?.visitCharge || 500)}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Ward Charge / Night</span>
                        <span className="text-dark fw-semibold">{formatCurrency(wardCharge)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment / Surgery Details (If any) */}
            {admission.treatment && (
              <div className="card border shadow-none mb-4">
                <div className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-activity me-1 text-success" /> Surgery & Treatment Procedure
                  </h6>
                  <span className="badge bg-soft-info text-info fw-semibold">
                    {admission.treatment.category || "Surgery"}
                  </span>
                </div>
                <div className="card-body p-3 fs-13">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <span className="text-muted d-block fs-12">Procedure Name</span>
                      <strong className="text-dark fs-14">
                        {admission.treatment.procedureName || admission.treatment.name || "—"}
                      </strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted d-block fs-12">Estimated Package Cost</span>
                      <strong className="text-success fs-14">
                        {formatCurrency(admission.treatment.totalCharge || admission.treatment.procedureFee || admission.estimatedTotal)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Summary Box */}
            <div className="card border shadow-none bg-light mb-0">
              <div className="card-header bg-white py-2 px-3 border-bottom">
                <h6 className="mb-0 fw-bold fs-13 text-dark">
                  <i className="ti ti-receipt me-1 text-warning" /> Billing & Payment Summary
                </h6>
              </div>
              <div className="card-body p-3">
                <div className="row text-center g-3">
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted fs-11 d-block fw-semibold">ESTIMATED TOTAL</span>
                      <h6 className="fw-bold mb-0 text-dark mt-1">
                        {formatCurrency(admission.estimatedTotal || admission.totalBilled)}
                      </h6>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted fs-11 d-block fw-semibold">ADVANCE DEPOSIT</span>
                      <h6 className="fw-bold mb-0 text-info mt-1">
                        {formatCurrency(admission.advancePaid)}
                      </h6>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted fs-11 d-block fw-semibold">TOTAL PAID</span>
                      <h6 className="fw-bold mb-0 text-success mt-1">
                        {formatCurrency(admission.totalPaid)}
                      </h6>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted fs-11 d-block fw-semibold">DUE BALANCE</span>
                      <h6
                        className={`fw-bold mb-0 mt-1 ${
                          (admission.dueAmount || 0) > 0 ? "text-danger" : "text-success"
                        }`}
                      >
                        {formatCurrency(admission.dueAmount)}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-4 border-top d-flex align-items-center justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm fw-semibold"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer me-1" /> Print IPD Summary
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm px-4 fw-semibold"
              onClick={onClose}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IpdViewDetailsModal;
