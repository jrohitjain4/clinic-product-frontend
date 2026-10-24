import React from "react";

interface IpdSettledReceiptSlipProps {
  admission: any;
  isPrintOnly?: boolean;
}

const getPatientName = (p?: any) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

const IpdSettledReceiptSlip: React.FC<IpdSettledReceiptSlipProps> = ({ admission, isPrintOnly = false }) => {
  if (!admission) return null;

  let loginClinic: any = {};
  try {
    loginClinic = JSON.parse(localStorage.getItem("user") || "{}")?.clinic || {};
  } catch {}

  const clinicName = loginClinic?.name || admission?.clinic?.name || "DocYori Hospital";

  const dischargedDateStr = admission.dischargeDate
    ? new Date(admission.dischargeDate).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "Completed";

  const admissionDateStr = admission.admissionDate
    ? new Date(admission.admissionDate).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  const patientName = getPatientName(admission.patient);
  const uhid = admission.patient?.patientCode || admission.patient?.uhid || "—";
  const doctorName = admission.doctor?.fullName || "Primary Doctor";
  const wardName = admission.ward?.wardName || "Assigned Ward";

  const totalBilled = Number(admission.totalAmount || 0);
  const discount = Number(admission.discountAmount || 0);
  const totalPaid = Number(admission.totalPaid || 0);
  const remainingDue = Number(admission.dueAmount || 0);

  return (
    <div className={`ipd-settled-receipt-card ${isPrintOnly ? "print-mode" : ""}`}>
      {/* ── Top Header Section ── */}
      <div className="receipt-header-row">
        <div>
          <h2 className="receipt-clinic-name">{clinicName}</h2>
          <p className="receipt-subtitle">Official Final Settlement &amp; Discharge Summary</p>
        </div>
        <div className="receipt-status-wrap">
          <span className="receipt-status-badge">STATUS: DISCHARGED</span>
          <div className="receipt-discharged-date">
            Discharged On: {dischargedDateStr}
          </div>
        </div>
      </div>

      {/* ── Patient Details Section ── */}
      <div className="receipt-patient-card">
        <div className="patient-col">
          <span className="col-label">PATIENT NAME</span>
          <h4 className="col-value-dark">{patientName}</h4>
          <span className="col-subtext">UHID: {uhid}</span>
        </div>

        <div className="patient-col">
          <span className="col-label">ATTENDING DOCTOR</span>
          <h4 className="col-value-doctor">{doctorName}</h4>
        </div>

        <div className="patient-col">
          <span className="col-label">RELEASED WARD</span>
          <div>
            <span className="ward-badge">{wardName}</span>
          </div>
        </div>

        <div className="patient-col text-end-on-desktop">
          <span className="col-label">ADMISSION DATE</span>
          <h4 className="col-value-dark">{admissionDateStr}</h4>
        </div>
      </div>

      {/* ── Final Payment & Concession Breakdown ── */}
      <div className="receipt-breakdown-card">
        <h3 className="breakdown-title">Final Payment &amp; Concession Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-col">
            <span className="breakdown-label">TOTAL Billed</span>
            <div className="breakdown-val text-dark">₹{totalBilled.toLocaleString("en-IN")}</div>
          </div>

          <div className="breakdown-col">
            <span className="breakdown-label">CONCESSION / DISCOUNT</span>
            <div className="breakdown-val text-amber">- ₹{discount.toLocaleString("en-IN")}</div>
          </div>

          <div className="breakdown-col">
            <span className="breakdown-label">TOTAL PAID SETTLED</span>
            <div className="breakdown-val text-green">₹{totalPaid.toLocaleString("en-IN")}</div>
          </div>

          <div className="breakdown-col">
            <span className="breakdown-label">REMAINING DUE BALANCE</span>
            <div className="breakdown-val text-red">₹{remainingDue.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* ── Remarks & Notes (if any) ── */}
      {admission.dischargeNotes && (
        <div className="receipt-remarks-card">
          <span className="col-label">DISCHARGE REMARKS &amp; NOTES</span>
          <p className="remarks-text">{admission.dischargeNotes}</p>
        </div>
      )}

      {/* ── Print-only Signatures & Timestamp Footer ── */}
      {isPrintOnly && (
        <div className="receipt-print-footer">
          <div className="receipt-footer-left">
            <span>Admission Code: #{admission.admissionCode}</span>
            <span>Printed on: {new Date().toLocaleString()}</span>
          </div>
          <div className="receipt-footer-right">
            <div className="sig-line-dark" />
            <span className="sig-label">Authorized Signatory / Billing Desk</span>
          </div>
        </div>
      )}

      <style>{`
        .ipd-settled-receipt-card {
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          box-sizing: border-box;
          width: 100%;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .ipd-settled-receipt-card.print-mode {
          padding: 24px 30px;
          max-width: 210mm;
          margin: 0 auto;
        }

        /* Header */
        .receipt-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          margin-bottom: 22px;
          border-bottom: 1.5px solid #e2e8f0;
          gap: 16px;
        }

        .receipt-clinic-name {
          font-size: 26px;
          font-weight: 800;
          color: #242976 !important;
          margin: 0 0 4px 0;
          letter-spacing: -0.4px;
        }

        .receipt-subtitle {
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b !important;
          margin: 0;
        }

        .receipt-status-wrap {
          text-align: right;
          flex-shrink: 0;
        }

        .receipt-status-badge {
          display: inline-block;
          background-color: #ef4444 !important;
          color: #ffffff !important;
          font-size: 13px;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 8px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .receipt-discharged-date {
          font-size: 12px;
          font-weight: 500;
          color: #64748b !important;
        }

        /* Patient Card */
        .receipt-patient-card {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px;
          padding: 18px 24px;
          margin-bottom: 22px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          align-items: start;
        }

        .patient-col {
          display: flex;
          flex-direction: column;
        }

        .text-end-on-desktop {
          text-align: right;
        }

        .col-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b !important;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }

        .col-value-dark {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0;
        }

        .col-value-doctor {
          font-size: 16px;
          font-weight: 800;
          color: #3b82f6 !important;
          margin: 0;
        }

        .col-subtext {
          font-size: 12px;
          font-weight: 600;
          color: #64748b !important;
          margin-top: 3px;
        }

        .ward-badge {
          display: inline-block;
          background-color: #e0f2fe !important;
          color: #0284c7 !important;
          font-size: 13px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 6px;
        }

        /* Breakdown Card */
        .receipt-breakdown-card {
          background-color: #f0fdf4 !important;
          border: 1.5px solid #22c55e !important;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 22px;
        }

        .breakdown-title {
          font-size: 16px;
          font-weight: 800;
          color: #16a34a !important;
          margin: 0 0 16px 0;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          align-items: start;
        }

        .breakdown-col {
          display: flex;
          flex-direction: column;
        }

        .breakdown-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b !important;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }

        .breakdown-val {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }

        .breakdown-val.text-dark {
          color: #0f172a !important;
        }

        .breakdown-val.text-amber {
          color: #eab308 !important;
        }

        .breakdown-val.text-green {
          color: #16a34a !important;
        }

        .breakdown-val.text-red {
          color: #ef4444 !important;
        }

        /* Remarks */
        .receipt-remarks-card {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px;
          padding: 14px 20px;
          margin-bottom: 22px;
        }

        .remarks-text {
          font-size: 13px;
          color: #1e293b !important;
          margin: 0;
          line-height: 1.5;
        }

        /* Print Footer */
        .receipt-print-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1.5px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .receipt-footer-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: #64748b !important;
          font-weight: 500;
        }

        .receipt-footer-right {
          text-align: center;
          width: 200px;
        }

        .sig-line-dark {
          border-top: 1.5px solid #0f172a;
          margin-bottom: 6px;
        }

        .sig-label {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a !important;
        }

        @media (max-width: 768px) {
          .receipt-patient-card,
          .breakdown-grid {
            grid-template-columns: 1fr 1fr;
          }
          .text-end-on-desktop {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default IpdSettledReceiptSlip;
