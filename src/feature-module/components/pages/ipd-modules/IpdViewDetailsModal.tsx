import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../core/config/api";
import IpdAdmissionPrintSummary from "./IpdAdmissionPrintSummary";

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
  const [fullAdmission, setFullAdmission] = useState<any>(admission);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!show || !admission?.id) return;
    setFullAdmission(admission);
    let cancelled = false;
    setLoadingDetails(true);
    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/ipd/admissions/${admission.id}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Failed to load admission details");
        return data;
      })
      .then((data) => {
        if (!cancelled && data?.id) setFullAdmission(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message || "Could not refresh admission details");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show, admission?.id]);

  if (!show || !admission) return null;

  const adm = fullAdmission || admission;
  const patient = adm.patient || {};
  const patientName =
    patient.fullName ||
    [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") ||
    "Patient";
  const doctorName = adm.doctor?.fullName ? `Dr. ${adm.doctor.fullName}` : "Unassigned";
  const wardName = adm.ward?.wardName || "Not Assigned";
  const wardType = adm.ward?.wardType || "";
  const wardCharge = adm.ward?.chargePerNight ?? adm.wardCharge ?? 0;

  const isDischarged = adm.status === "Discharged";

  const handlePrintIpdSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/ipd/admissions/${adm.id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) setFullAdmission(data);
    } catch {
      /* print with whatever we have */
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        const root = document.getElementById("ipd-admission-print-summary");
        if (!root) {
          toast.error("Print layout not ready");
          return;
        }
        window.print();
      }, 200);
    });
  };

  return (
    <div
      className="modal fade show d-block ipd-view-details-modal"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "12px", overflow: "hidden" }}
        >
          <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36 }}
              >
                <i className="ti ti-eye text-primary fs-18" />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0">
                  IPD Admission Details — {adm.admissionCode || "IPD"}
                </h5>
                <p className="mb-0 text-white-50 fs-12">
                  Complete Inpatient Stay & Billing Summary
                  {loadingDetails ? " · Loading full details…" : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body p-4 bg-light-subtle">
            <div className="p-3 bg-white rounded-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2 ipd-vd-card">
              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">ADMISSION STATUS</span>
                {isDischarged ? (
                  <span className="badge bg-danger py-1 px-3 fs-13 fw-bold mt-1">
                    <i className="ti ti-user-check me-1" /> DISCHARGED
                  </span>
                ) : (
                  <span className="badge bg-success py-1 px-3 fs-13 fw-bold mt-1">
                    <i className="ti ti-activity me-1" /> {(adm.status || "ACTIVE").toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">ADMISSION DATE</span>
                <span className="fw-bold fs-14 text-dark">{formatDate(adm.admissionDate)}</span>
              </div>

              {isDischarged && (
                <div>
                  <span className="text-muted fs-12 d-block fw-semibold uppercase">DISCHARGE DATE</span>
                  <span className="fw-bold fs-14 text-dark">{formatDate(adm.dischargeDate)}</span>
                </div>
              )}

              <div>
                <span className="text-muted fs-12 d-block fw-semibold uppercase">PAYMENT STATUS</span>
                <span
                  className={`badge py-1 px-3 fs-13 fw-bold mt-1 ${
                    adm.paymentStatus === "Paid"
                      ? "bg-soft-success text-success"
                      : adm.paymentStatus === "Partial"
                      ? "bg-soft-warning text-warning"
                      : "bg-soft-danger text-danger"
                  }`}
                >
                  {adm.paymentStatus || "Unpaid"}
                </span>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card ipd-vd-card h-100 mb-0" style={{ borderRadius: 10 }}>
                  <div className="card-header bg-white py-2 px-3">
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
                        <span className="text-dark fw-semibold">
                          {patient.phone || patient.alternateMobile || "—"}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Email</span>
                        <span className="text-dark fw-semibold">{patient.email || "—"}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Age / Gender / Blood</span>
                        <span className="text-dark fw-semibold">
                          {[
                            patient.age != null ? `${patient.age} Yrs` : null,
                            patient.gender,
                            patient.bloodGroup,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">DOB</span>
                        <span className="text-dark fw-semibold">
                          {patient.dob ? formatDate(patient.dob)?.split(",")[0] : "—"}
                        </span>
                      </div>
                      <div className="col-12 mt-2">
                        <span className="text-muted d-block fs-12">Address</span>
                        <span className="text-dark fw-semibold">
                          {[patient.address1, patient.address2, patient.city, patient.state, patient.pincode]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card ipd-vd-card h-100 mb-0" style={{ borderRadius: 10 }}>
                  <div className="card-header bg-white py-2 px-3">
                    <h6 className="mb-0 fw-bold fs-13 text-dark">
                      <i className="ti ti-stethoscope me-1 text-info" /> Doctor & Ward Assignment
                    </h6>
                  </div>
                  <div className="card-body p-3 fs-13">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Primary Doctor</span>
                        <strong className="text-primary">{doctorName}</strong>
                        {adm.doctor?.department?.name && (
                          <span className="text-muted fs-11 d-block">{adm.doctor.department.name}</span>
                        )}
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Assigned Ward</span>
                        <strong className="text-dark">{wardName}</strong>
                        {wardType && <span className="text-muted fs-11 ms-1">({wardType})</span>}
                        {adm.ward?.wardCode && (
                          <span className="text-muted fs-11 d-block">Code: {adm.ward.wardCode}</span>
                        )}
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Doctor Phone</span>
                        <span className="text-dark fw-semibold">{adm.doctor?.phone || "—"}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Doctor Visit Charge</span>
                        <span className="text-dark fw-semibold">
                          {formatCurrency(adm.doctorVisitCharge || adm.doctor?.ipdVisitCharge || 0)}
                        </span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Ward Charge / Night</span>
                        <span className="text-dark fw-semibold">{formatCurrency(wardCharge)}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <span className="text-muted d-block fs-12">Nursing / Night</span>
                        <span className="text-dark fw-semibold">
                          {formatCurrency(adm.ward?.nursingChargePerNight ?? adm.nursingFee ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(adm.treatment || adm.treatmentReason) && (
              <div className="card ipd-vd-card mb-4" style={{ borderRadius: 10 }}>
                <div className="card-header bg-white py-2 px-3 d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-activity me-1 text-success" /> Surgery & Treatment Procedure
                  </h6>
                  <span className="badge bg-soft-info text-info fw-semibold">
                    {adm.treatment?.categoryRef?.name || adm.treatment?.category || "Procedure"}
                  </span>
                </div>
                <div className="card-body p-3 fs-13">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <span className="text-muted d-block fs-12">Procedure Name</span>
                      <strong className="text-dark fs-14">
                        {adm.treatment?.procedureName || adm.treatmentReason || "—"}
                      </strong>
                      {adm.treatment?.procedureCode && (
                        <span className="text-muted fs-11 d-block">Code: {adm.treatment.procedureCode}</span>
                      )}
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted d-block fs-12">Package / Total Charge</span>
                      <strong className="text-success fs-14">
                        {formatCurrency(
                          adm.treatmentFee || adm.treatment?.totalPrice || adm.treatment?.procedureFee || 0
                        )}
                      </strong>
                    </div>
                    {adm.treatment?.estimatedDuration && (
                      <div className="col-md-6 mt-2">
                        <span className="text-muted d-block fs-12">Duration</span>
                        <span className="text-dark fw-semibold">{adm.treatment.estimatedDuration}</span>
                      </div>
                    )}
                    {adm.treatment?.department?.name && (
                      <div className="col-md-6 mt-2">
                        <span className="text-muted d-block fs-12">Department</span>
                        <span className="text-dark fw-semibold">{adm.treatment.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="card ipd-vd-card mb-0" style={{ borderRadius: 10 }}>
              <div className="card-header bg-white py-2 px-3">
                <h6 className="mb-0 fw-bold fs-13 text-dark">
                  <i className="ti ti-receipt me-1 text-warning" /> Billing & Payment Summary
                </h6>
              </div>
              <div className="card-body p-3 bg-light">
                <div className="row text-center g-3">
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded ipd-vd-stat">
                      <span className="text-muted fs-11 d-block fw-semibold">ESTIMATED TOTAL</span>
                      <h6 className="fw-bold mb-0 text-dark mt-1">
                        {formatCurrency(
                          adm.estimatedTotal ||
                            adm.totalEstimatedAmount ||
                            adm.totalBilled ||
                            adm.computed?.runningTotalWithWard
                        )}
                      </h6>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded ipd-vd-stat">
                      <span className="text-muted fs-11 d-block fw-semibold">ADVANCE DEPOSIT</span>
                      <h6 className="fw-bold mb-0 text-info mt-1">{formatCurrency(adm.advancePaid)}</h6>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded ipd-vd-stat">
                      <span className="text-muted fs-11 d-block fw-semibold">TOTAL PAID</span>
                      <h6 className="fw-bold mb-0 text-success mt-1">{formatCurrency(adm.totalPaid)}</h6>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-white rounded ipd-vd-stat">
                      <span className="text-muted fs-11 d-block fw-semibold">DUE BALANCE</span>
                      <h6
                        className={`fw-bold mb-0 mt-1 ${
                          (adm.dueAmount || adm.computed?.runningDueAmount || 0) > 0
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(adm.dueAmount ?? adm.computed?.runningDueAmount)}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-md-6">
                <div className="card ipd-vd-card h-100 mb-0" style={{ borderRadius: 10 }}>
                  <div className="card-header bg-white py-2 px-3">
                    <h6 className="mb-0 fw-bold fs-13 text-dark">
                      <i className="ti ti-file-invoice me-1 text-primary" /> Invoice & Billings History
                    </h6>
                  </div>
                  <div className="card-body p-3 fs-13" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {!adm.invoices || adm.invoices.length === 0 ? (
                      <span className="text-muted d-block py-4 text-center">
                        No invoices generated yet for this admission.
                      </span>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {adm.invoices.map((inv: any, idx: number) => (
                          <div key={inv.id || idx} className="p-3 rounded bg-white ipd-vd-stat">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-soft-dark text-dark fw-bold">{inv.invoiceNumber}</span>
                              <span
                                className={`badge py-0.5 px-2 fs-11 fw-semibold ${
                                  inv.paymentStatus === "Paid"
                                    ? "bg-soft-success text-success"
                                    : inv.paymentStatus === "Partial"
                                    ? "bg-soft-warning text-warning"
                                    : "bg-soft-danger text-danger"
                                }`}
                              >
                                {inv.paymentStatus}
                              </span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="text-muted fs-12">
                                {formatDate(inv.createdAt || inv.invoiceDate)}
                              </span>
                              <strong className="text-success fs-14">
                                {formatCurrency(inv.totalAmount)}
                              </strong>
                            </div>
                            <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(15,23,42,0.06)" }}>
                              <span className="text-muted d-block fs-11 fw-semibold mb-1">INVOICE CHARGES:</span>
                              <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                                {(inv.items || []).map((it: any, iIdx: number) => (
                                  <li
                                    key={it.id || iIdx}
                                    className="fs-12 text-dark d-flex align-items-center justify-content-between"
                                  >
                                    <span>
                                      • {it.itemName} {it.quantity > 1 ? `(x${it.quantity})` : ""}
                                    </span>
                                    <span className="fw-semibold">{formatCurrency(it.totalPrice)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card ipd-vd-card h-100 mb-0" style={{ borderRadius: 10 }}>
                  <div className="card-header bg-white py-2 px-3">
                    <h6 className="mb-0 fw-bold fs-13 text-dark">
                      <i className="ti ti-history me-1 text-info" /> Inpatient Stay Timeline
                    </h6>
                  </div>
                  <div className="card-body p-3 fs-13" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <div
                      className="timeline-container ps-3 position-relative ms-2 py-2"
                      style={{ borderLeft: "2px solid rgba(15,23,42,0.08)" }}
                    >
                      <div className="timeline-item position-relative mb-4">
                        <div
                          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            left: "-27px",
                            top: "0",
                            width: "20px",
                            height: "20px",
                            backgroundColor: "#6366f1",
                            boxShadow: "0 0 0 2px #fff",
                          }}
                        >
                          <i className="ti ti-login text-white fs-10" />
                        </div>
                        <div className="ps-2">
                          <span className="text-muted fs-11 d-block fw-semibold">
                            {formatDate(adm.admissionDate)}
                          </span>
                          <strong className="text-dark fs-13 d-block mt-0.5">Patient Admitted</strong>
                          <span className="text-muted fs-12">
                            Admitted under {doctorName} in {wardName}
                            {adm.admissionType ? ` · Type: ${adm.admissionType}` : ""}.
                          </span>
                        </div>
                      </div>

                      {(adm.treatment || adm.treatmentReason) && (
                        <div className="timeline-item position-relative mb-4">
                          <div
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              left: "-27px",
                              top: "0",
                              width: "20px",
                              height: "20px",
                              backgroundColor: "#10b981",
                              boxShadow: "0 0 0 2px #fff",
                            }}
                          >
                            <i className="ti ti-activity text-white fs-10" />
                          </div>
                          <div className="ps-2">
                            <span className="text-muted fs-11 d-block fw-semibold">
                              {formatDate(adm.admissionDate)}
                            </span>
                            <strong className="text-dark fs-13 d-block mt-0.5">Procedure Scheduled</strong>
                            <span className="text-muted fs-12">
                              {adm.treatment?.procedureName || adm.treatmentReason} (Charge:{" "}
                              {formatCurrency(adm.treatmentFee || adm.treatment?.totalPrice || 0)}).
                            </span>
                          </div>
                        </div>
                      )}

                      {(adm.invoices || []).map((inv: any, idx: number) => (
                        <div key={inv.id || idx} className="timeline-item position-relative mb-4">
                          <div
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              left: "-27px",
                              top: "0",
                              width: "20px",
                              height: "20px",
                              backgroundColor: "#eab308",
                              boxShadow: "0 0 0 2px #fff",
                            }}
                          >
                            <i className="ti ti-receipt text-white fs-10" />
                          </div>
                          <div className="ps-2">
                            <span className="text-muted fs-11 d-block fw-semibold">
                              {formatDate(inv.createdAt || inv.invoiceDate)}
                            </span>
                            <strong className="text-dark fs-13 d-block mt-0.5">
                              Invoice Generated: {inv.invoiceNumber}
                            </strong>
                            <span className="text-muted fs-12">
                              Billed amount:{" "}
                              <strong className="text-dark">{formatCurrency(inv.totalAmount)}</strong> (Paid:{" "}
                              {formatCurrency(inv.paidAmount)}, Due: {formatCurrency(inv.dueAmount)}).
                            </span>
                          </div>
                        </div>
                      ))}

                      {adm.status === "Discharged" && (
                        <div className="timeline-item position-relative">
                          <div
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              left: "-27px",
                              top: "0",
                              width: "20px",
                              height: "20px",
                              backgroundColor: "#ef4444",
                              boxShadow: "0 0 0 2px #fff",
                            }}
                          >
                            <i className="ti ti-logout text-white fs-10" />
                          </div>
                          <div className="ps-2">
                            <span className="text-muted fs-11 d-block fw-semibold">
                              {formatDate(adm.dischargeDate)}
                            </span>
                            <strong className="text-dark fs-13 d-block mt-0.5">Patient Discharged</strong>
                            <span className="text-muted fs-12">
                              Stay ended, billing records archived. {adm.dischargeNotes || "Completed stay"}.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer px-4 py-3 bg-white d-flex align-items-center justify-content-between">
            <button
              type="button"
              className="btn btn-light fw-medium d-flex align-items-center"
              onClick={handlePrintIpdSummary}
              disabled={loadingDetails}
            >
              <i className="ti ti-printer me-2" /> Print IPD Summary
            </button>
            <button type="button" className="btn btn-primary fw-medium px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      <IpdAdmissionPrintSummary admission={adm} />

      <style>{`
        .ipd-view-details-modal .ipd-vd-card,
        .ipd-view-details-modal .card.ipd-vd-card {
          border: none !important;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.1) !important;
          border-radius: 12px !important;
          background: #fff !important;
        }
        .ipd-view-details-modal .ipd-vd-card > .card-header {
          border: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }
        .ipd-view-details-modal .ipd-vd-card > .card-body {
          border: none !important;
        }
        .ipd-view-details-modal .ipd-vd-stat {
          border: none !important;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08) !important;
        }
        .ipd-view-details-modal .modal-footer {
          border-top: none !important;
          box-shadow: 0 -2px 12px rgba(15, 23, 42, 0.06);
        }
      `}</style>
    </div>
  );
};

export default IpdViewDetailsModal;
