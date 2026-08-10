import React from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";

interface ClinicInvoicePrintLayoutProps {
  invoice: any;
}

const money = (val?: number | null) =>
  `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ClinicInvoicePrintLayout: React.FC<ClinicInvoicePrintLayoutProps> = ({ invoice }) => {
  if (!invoice) return null;

  const clinic = invoice.clinic || {};
  const addressParts = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.pincode ? `PIN - ${clinic.pincode}` : "",
  ].filter(Boolean);

  const clinicName = clinic.name || invoice.clinicName || "Your Clinic";
  const clinicAddress =
    addressParts.length > 0 ? addressParts.join(", ") : "Billing address on file";
  const clinicPhone = clinic.phone || clinic.whatsappNumber || "";
  const clinicEmail = clinic.ownerEmail || "";

  const patient = invoice.patient;
  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Patient not found (Deleted)";

  const items = invoice.items || [];
  const dueInDays = dayjs(invoice.dueDate).diff(dayjs(), "day");
  const taxAmount = (Number(invoice.subTotal) * Number(invoice.tax || 0)) / 100;

  const statusClass =
    invoice.paymentStatus === "Paid"
      ? "cip-badge-success"
      : invoice.paymentStatus === "Partially Paid"
        ? "cip-badge-warning"
        : "cip-badge-danger";

  const printNode = (
    <div id="clinic-invoice-print" className="cip-print-root">
      <div className="cip-print-page">
        <div className="cip-sheet">
          {/* Top bar */}
          <div className="cip-top">
            <h1 className="cip-code">{invoice.invoiceCode}</h1>
            <div className="cip-badges">
              <span className={`cip-badge ${statusClass}`}>{invoice.paymentStatus}</span>
              {dueInDays >= 0 ? (
                <span className="cip-badge cip-badge-danger">Due in {dueInDays} day{dueInDays !== 1 ? "s" : ""}</span>
              ) : (
                <span className="cip-badge cip-badge-dark">
                  Overdue by {Math.abs(dueInDays)} day{Math.abs(dueInDays) !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="cip-meta-row">
            <div className="cip-meta-col">
              <h2 className="cip-section-title">Invoice Details</h2>
              <p className="cip-line">
                Invoice Number : <strong>{invoice.invoiceCode}</strong>
              </p>
              <p className="cip-line">
                Issued On : <span>{dayjs(invoice.invoiceDate).format("DD MMM YYYY")}</span>
              </p>
              <p className="cip-line">
                Due Date : <span>{dayjs(invoice.dueDate).format("DD MMM YYYY")}</span>
              </p>
              <p className="cip-line">
                Payment Method : <span>{invoice.paymentMethod || "—"}</span>
              </p>
              {invoice.appointment && (
                <p className="cip-line cip-line-sm">
                  Appointment : #{invoice.appointment.appointmentCode || invoice.appointment.id?.slice(-6)} (
                  {invoice.appointment.doctor?.fullName
                    ? `Dr. ${invoice.appointment.doctor.fullName}`
                    : "Doctor"}{" "}
                  - {dayjs(invoice.appointment.scheduledAt).format("DD MMM YYYY, hh:mm A")})
                </p>
              )}
            </div>

            <div className="cip-meta-col">
              <h2 className="cip-section-title">Clinic</h2>
              <p className="cip-line cip-strong">{clinicName}</p>
              <p className="cip-line">{clinicAddress}</p>
              {clinicPhone && <p className="cip-line">{clinicPhone}</p>}
              {clinicEmail && <p className="cip-line">{clinicEmail}</p>}
            </div>

            <div className="cip-meta-col cip-meta-right">
              <h2 className="cip-section-title">Invoice To</h2>
              <p className="cip-line cip-strong">{patientName}</p>
              {patient?.email && <p className="cip-line">{patient.email}</p>}
              {patient?.phone && <p className="cip-line">{patient.phone}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="cip-items">
            <h2 className="cip-items-title">Products / Service Items</h2>
            <table className="cip-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product / Item</th>
                  <th>Description</th>
                  <th className="tc">Unit Cost</th>
                  <th className="tc">Quantity</th>
                  <th className="tr">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td className="fw">{item.service?.serviceName || "Service"}</td>
                      <td className="muted">{item.description || ""}</td>
                      <td className="tc">{money(item.unitCost)}</td>
                      <td className="tc">{item.quantity}</td>
                      <td className="tr fw">{money(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="tc muted">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="cip-totals-wrap">
            <div className="cip-notes">
              {invoice.otherInfo && (
                <>
                  <h3 className="cip-notes-title">Notes</h3>
                  <p className="cip-line">{invoice.otherInfo}</p>
                </>
              )}
            </div>
            <div className="cip-totals">
              <div className="cip-total-row">
                <span>Sub Total</span>
                <strong>{money(invoice.subTotal)}</strong>
              </div>
              <div className="cip-total-row">
                <span>Tax ({invoice.tax || 0}%)</span>
                <strong>{money(taxAmount)}</strong>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="cip-total-row">
                  <span>Discount</span>
                  <strong className="cip-discount">-{money(invoice.discount)}</strong>
                </div>
              )}
              <div className="cip-total-row cip-grand">
                <span>Total (INR)</span>
                <strong>{money(invoice.totalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cip-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .cip-print-page {
          width: 210mm;
          background: #fff;
        }
        .cip-sheet {
          font-family: Inter, system-ui, -apple-system, sans-serif;
          color: #334155;
          background: #fff;
          padding: 18px 20px;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .cip-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          margin-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
        }
        .cip-code {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #4f46e5;
        }
        .cip-badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .cip-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
        }
        .cip-badge-success { background: #198754; }
        .cip-badge-warning { background: #ffc107; color: #212529; }
        .cip-badge-danger { background: #dc3545; }
        .cip-badge-dark { background: #212529; }
        .cip-meta-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .cip-section-title {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .cip-line {
          margin: 0 0 4px;
          font-size: 13px;
          line-height: 1.45;
          color: #64748b;
        }
        .cip-line span, .cip-line strong { color: #0f172a; }
        .cip-line-sm { font-size: 11px; }
        .cip-strong { font-weight: 700; color: #0f172a !important; }
        .cip-meta-right { text-align: right; }
        .cip-items-title {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .cip-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          font-size: 12px;
        }
        .cip-table th {
          background: #f8fafc;
          color: #0f172a;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .cip-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }
        .cip-table tr:last-child td { border-bottom: none; }
        .cip-table .tc { text-align: center; }
        .cip-table .tr { text-align: right; }
        .cip-table .fw { font-weight: 700; color: #0f172a; }
        .cip-table .muted { color: #64748b; }
        .cip-totals-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }
        .cip-notes-title {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .cip-totals { margin-left: auto; width: 100%; max-width: 280px; }
        .cip-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 13px;
          color: #64748b;
        }
        .cip-total-row strong { color: #0f172a; font-weight: 700; }
        .cip-discount { color: #dc3545 !important; }
        .cip-grand {
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 16px;
        }
        .cip-grand strong { color: #4f46e5; font-size: 18px; }

        @media print {
          @page { size: A4; margin: 10mm; }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#clinic-invoice-print) {
            display: none !important;
          }
          #clinic-invoice-print.cip-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: auto !important;
            visibility: visible !important;
          }
          #clinic-invoice-print,
          #clinic-invoice-print * {
            visibility: visible !important;
          }
          .cip-print-page,
          .cip-sheet {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .cip-table thead { display: table-header-group; }
          .cip-table tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(printNode, document.body);
};

export default ClinicInvoicePrintLayout;
