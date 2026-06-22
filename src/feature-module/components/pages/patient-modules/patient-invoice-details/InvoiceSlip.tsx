import React from "react";
import { resolveMediaUrl } from "../../../../../core/config/api";
import dayjs from "dayjs";

interface InvoiceSlipProps {
  invoice: any;
}

const InvoiceSlip: React.FC<InvoiceSlipProps> = ({ invoice }) => {
  if (!invoice) return null;

  const clinic = invoice.clinic || {};
  const patient = invoice.patient || {};
  const doctor = invoice.doctor || invoice.appointment?.doctor || {};
  const items = invoice.items || [];

  const clinicName = clinic.name || invoice.clinicName || "City Care Clinic";
  const clinicTagline = clinic.landingPage?.tagline || "Compassionate Care, Better Health";
  const clinicLogo = clinic.landingPage?.logo || null;
  const clinicAddress = clinic.addressLine1
    ? `${clinic.addressLine1}${clinic.addressLine2 ? ", " + clinic.addressLine2 : ""}, ${clinic.city || ""}, ${clinic.state || ""}`
    : "Green Valley Road, Near City Mall, Civil Lines";
  const clinicPhone = clinic.phone || "+91 98765 43210";
  const clinicEmail = clinic.email || "info@citycareclinic.com";

  const invoiceNo = invoice.invoiceCode || `INV-${invoice.id?.slice(0, 8).toUpperCase()}`;
  const invoiceDate = invoice.invoiceDate || invoice.createdAt;
  const generatedOn = invoice.createdAt;
  const paymentMode = invoice.paymentMethod || "UPI";
  const transactionId = invoice.transactionId || invoice.razorpayPaymentId || "—";
  const paymentStatus = invoice.paymentStatus || "Pending";

  const doctorName = doctor?.fullName || invoice.appointment?.doctorName || "—";
  const visitDate = invoice.appointment?.scheduledAt || invoice.createdAt;
  const department = doctor?.department?.name || invoice.appointment?.doctor?.department?.name || "General";

  const subTotal = invoice.subTotal || items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const discount = invoice.discount || 0;
  const tax = invoice.tax || 0;
  const taxAmount = (subTotal * tax) / 100;
  const totalAmount = invoice.totalAmount || (subTotal - discount + taxAmount);

  return (
    <div className="inv-slip">
      {/* ========== HEADER ========== */}
      <div className="inv-header">
        <div className="inv-header-left">
          {clinicLogo ? (
            <img
              src={resolveMediaUrl(clinicLogo)}
              alt="logo"
              className="inv-logo"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="inv-logo-placeholder">
              <i className="ti ti-building-hospital" style={{ fontSize: 30, color: "#1565c0" }} />
            </div>
          )}
          <div className="inv-clinic-info">
            <h1 className="inv-clinic-name">{clinicName.toUpperCase()}</h1>
            <p className="inv-clinic-tagline">— {clinicTagline} —</p>
          </div>
        </div>
        <div className="inv-header-right">
          <div className="inv-badge">INVOICE</div>
        </div>
      </div>

      {/* ========== CLINIC ADDRESS BAR ========== */}
      <div className="inv-address-bar">
        <div className="inv-addr-item"><i className="ti ti-map-pin" />{clinicAddress}</div>
        <div className="inv-addr-item"><i className="ti ti-phone" />{clinicPhone}</div>
        <div className="inv-addr-item"><i className="ti ti-mail" />{clinicEmail}</div>
      </div>

      {/* ========== INVOICE META ========== */}
      <div className="inv-meta-row">
        <div>
          <span className="inv-meta-lbl">Invoice No.</span>
          <span className="inv-meta-val">{invoiceNo}</span>
        </div>
        <div>
          <span className="inv-meta-lbl">Invoice Date</span>
          <span className="inv-meta-val">{invoiceDate ? dayjs(invoiceDate).format("DD MMMM YYYY") : "—"}</span>
        </div>
        <div>
          <span className="inv-meta-lbl">Generated On</span>
          <span className="inv-meta-val">{generatedOn ? dayjs(generatedOn).format("DD MMMM YYYY") : "—"}</span>
        </div>
      </div>

      {/* ========== PATIENT + DOCTOR INFO ========== */}
      <div className="inv-info-grid">
        <div className="inv-info-block">
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-user" /></span>
            <span className="inv-info-lbl">Patient Name</span>
            <span className="inv-info-val">{patient.firstName || ""} {patient.lastName || ""}</span>
          </div>
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-id-badge" /></span>
            <span className="inv-info-lbl">Patient ID</span>
            <span className="inv-info-val">{patient.patientCode || `PT-${patient.id?.slice(0, 5).toUpperCase() || "00001"}`}</span>
          </div>
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-phone" /></span>
            <span className="inv-info-lbl">Mobile No.</span>
            <span className="inv-info-val">{patient.phone || "—"}</span>
          </div>
        </div>
        <div className="inv-info-divider" />
        <div className="inv-info-block">
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-stethoscope" /></span>
            <span className="inv-info-lbl">Doctor Name</span>
            <span className="inv-info-val">{doctorName}</span>
          </div>
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-calendar" /></span>
            <span className="inv-info-lbl">Visit Date</span>
            <span className="inv-info-val">{visitDate ? dayjs(visitDate).format("DD MMMM YYYY") : "—"}</span>
          </div>
          <div className="inv-info-row">
            <span className="inv-info-icon"><i className="ti ti-building" /></span>
            <span className="inv-info-lbl">Department</span>
            <span className="inv-info-val">{department}</span>
          </div>
        </div>
      </div>

      {/* ========== ITEMS TABLE ========== */}
      <table className="inv-table">
        <thead>
          <tr>
            <th style={{ width: "45%" }}>DESCRIPTION</th>
            <th style={{ width: "20%", textAlign: "center" }}>QTY.</th>
            <th style={{ width: "35%", textAlign: "right" }}>AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <tr key={i}>
              <td>
                <div style={{ fontWeight: 700 }}>{item.service?.serviceName || item.name || item.item || "Consultation"}</div>
                {item.description && <div style={{ fontSize: "7px", color: "#64748b", marginTop: "2px" }}>{item.description}</div>}
              </td>
              <td style={{ textAlign: "center" }}>{item.quantity || 1}</td>
              <td style={{ textAlign: "right" }}>{(item.amount || 0).toFixed(2)}</td>
            </tr>
          )) : (
            <tr>
              <td>Consultation Fee</td>
              <td style={{ textAlign: "center" }}>1</td>
              <td style={{ textAlign: "right" }}>{totalAmount.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="inv-subtotal-row">
            <td colSpan={2} style={{ textAlign: "right" }}>Sub Total</td>
            <td style={{ textAlign: "right" }}>₹ {subTotal.toFixed(2)}</td>
          </tr>
          {discount > 0 && (
            <tr className="inv-discount-row">
              <td colSpan={2} style={{ textAlign: "right" }}>Discount</td>
              <td style={{ textAlign: "right", color: "#c0392b" }}>- ₹ {discount.toFixed(2)}</td>
            </tr>
          )}
          {tax > 0 && (
            <tr className="inv-tax-row">
              <td colSpan={2} style={{ textAlign: "right" }}>Tax ({tax}%)</td>
              <td style={{ textAlign: "right" }}>₹ {taxAmount.toFixed(2)}</td>
            </tr>
          )}
          <tr className="inv-total-row">
            <td colSpan={2} style={{ textAlign: "right" }}>TOTAL AMOUNT</td>
            <td style={{ textAlign: "right" }}>₹ {totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ========== PAYMENT DETAILS ========== */}
      <div className="inv-payment-section">
        <div className="inv-section-title">
          <i className="ti ti-credit-card" /> PAYMENT DETAILS
        </div>
        <div className="inv-payment-row">
          <span className="inv-pay-item"><strong>Payment Mode :</strong> {paymentMode}</span>
          <span className="inv-pay-item"><strong>Transaction ID :</strong> {transactionId}</span>
          <span className="inv-pay-item">
            <strong>Payment Status :</strong>{" "}
            <span className={paymentStatus === "Paid" ? "inv-status-paid" : "inv-status-pending"}>
              {paymentStatus}
            </span>
          </span>
        </div>
      </div>

      {/* ========== NOTES ========== */}
      <div className="inv-notes-section">
        <div className="inv-section-title">
          <i className="ti ti-notes" /> NOTES
        </div>
        <ul className="inv-notes-list">
          <li>Thank you for visiting our clinic.</li>
          <li>Please keep this invoice for future reference.</li>
          {invoice.notes && <li>{invoice.notes}</li>}
        </ul>
      </div>

      {/* ========== SIGNATURES ========== */}
      <div className="inv-sig-row">
        <div className="inv-sig-block">
          <div className="inv-sig-line" />
          <p className="inv-sig-label">Authorised Signatory</p>
        </div>
        <div className="inv-sig-block inv-sig-right">
          <div className="inv-sig-line" />
          <p className="inv-sig-label">Doctor Seal</p>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="inv-footer">
        <div className="inv-footer-addr">
          <i className="ti ti-map-pin" /> {clinicAddress}
        </div>
        <div className="inv-footer-contacts">
          <span><i className="ti ti-phone" /> {clinicPhone}</span>
          <span><i className="ti ti-mail" /> {clinicEmail}</span>
        </div>
        <div className="inv-footer-tagline">Thank you for trusting us with your health. ❤️</div>
      </div>

      {/* ========== STYLES ========== */}
      <style>{`
        .inv-slip {
          width: 21cm;
          max-height: 29.7cm;
          box-sizing: border-box;
          padding: 0.45cm 0.6cm;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          color: #0f172a;
          overflow: hidden;
          position: relative;
        }
        .inv-slip * { box-sizing: border-box; }

        /* HEADER */
        .inv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .inv-header-left { display: flex; align-items: center; gap: 10px; }
        .inv-logo { max-height: 52px; max-width: 120px; object-fit: contain; }
        .inv-logo-placeholder { width: 52px; height: 52px; border: 2px solid #1565c0; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .inv-clinic-name { font-size: 18px; font-weight: 900; color: #1565c0; margin: 0; line-height: 1.1; letter-spacing: 0.3px; }
        .inv-clinic-tagline { font-size: 8.5px; color: #2e7d32; font-weight: 600; margin: 2px 0 0 0; font-style: italic; }
        .inv-badge {
          background: #0d47a1;
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 2px;
          padding: 6px 18px;
          border-radius: 4px;
          border: 2px solid #0d47a1;
        }

        /* ADDRESS BAR */
        .inv-address-bar {
          background: #f0f4ff;
          border: 1px solid #c8d8f0;
          border-radius: 4px;
          display: flex;
          gap: 12px;
          padding: 4px 10px;
          font-size: 7.8px;
          color: #1a237e;
          margin-bottom: 5px;
          flex-wrap: wrap;
        }
        .inv-addr-item { display: flex; align-items: center; gap: 3px; }
        .inv-addr-item i { font-size: 9px; color: #1565c0; }

        /* META ROW */
        .inv-meta-row {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          font-size: 8px;
          margin-bottom: 6px;
          padding-right: 2px;
        }
        .inv-meta-lbl { color: #546e7a; margin-right: 3px; }
        .inv-meta-val { font-weight: 700; color: #0f172a; }

        /* PATIENT + DOCTOR INFO */
        .inv-info-grid {
          border: 1.5px solid #bbdefb;
          border-radius: 5px;
          display: flex;
          padding: 7px 10px;
          gap: 0;
          margin-bottom: 6px;
          background: #fafcff;
        }
        .inv-info-block { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .inv-info-divider { width: 1.5px; background: #bbdefb; margin: 0 14px; }
        .inv-info-row { display: flex; align-items: center; gap: 5px; font-size: 8px; }
        .inv-info-icon { color: #1565c0; font-size: 10px; width: 14px; text-align: center; }
        .inv-info-lbl { color: #546e7a; font-weight: 600; width: 72px; flex-shrink: 0; }
        .inv-info-val { color: #0f172a; font-weight: 700; }

        /* TABLE */
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5px;
          margin-bottom: 5px;
        }
        .inv-table thead tr {
          background: #0d47a1;
          color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .inv-table thead th {
          padding: 6px 8px;
          font-weight: 700;
          font-size: 8px;
          letter-spacing: 0.3px;
          border: 1px solid #0d47a1;
          color: #fff;
          background: #0d47a1;
        }
        .inv-table tbody tr { border-bottom: 1px solid #e2e8f0; }
        .inv-table tbody tr:nth-child(even) { background: #f5f9ff; }
        .inv-table tbody td {
          padding: 5px 8px;
          color: #1e293b;
          font-weight: 500;
          border: 1px solid #e2e8f0;
        }
        .inv-table tfoot td {
          padding: 3px 8px;
          border: none;
          font-size: 8.5px;
        }
        .inv-subtotal-row td { color: #546e7a; font-weight: 600; }
        .inv-discount-row td { font-weight: 600; }
        .inv-total-row {
          background: #0d47a1;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .inv-total-row td {
          color: #ffffff !important;
          font-weight: 900 !important;
          font-size: 10px !important;
          padding: 5px 8px !important;
          background: #0d47a1;
        }

        /* PAYMENT */
        .inv-payment-section {
          border: 1.5px solid #bbdefb;
          border-radius: 4px;
          padding: 5px 10px;
          margin-bottom: 5px;
          background: #fafcff;
        }
        .inv-section-title {
          font-size: 8.5px;
          font-weight: 800;
          color: #1565c0;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .inv-payment-row { display: flex; gap: 20px; font-size: 8px; flex-wrap: wrap; }
        .inv-pay-item { color: #334155; }
        .inv-status-paid { color: #15803d; font-weight: 800; background: #dcfce7; padding: 1px 6px; border-radius: 3px; }
        .inv-status-pending { color: #b45309; font-weight: 800; background: #fef3c7; padding: 1px 6px; border-radius: 3px; }

        /* NOTES */
        .inv-notes-section {
          border: 1.5px solid #e2e8f0;
          border-radius: 4px;
          padding: 5px 10px;
          margin-bottom: 5px;
        }
        .inv-notes-list { margin: 0; padding-left: 14px; font-size: 8px; color: #475569; }
        .inv-notes-list li { margin-bottom: 1px; }

        /* SIGNATURES */
        .inv-sig-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 5px;
          padding: 0 5px;
        }
        .inv-sig-block { text-align: center; width: 130px; }
        .inv-sig-right { text-align: center; }
        .inv-sig-line { border-top: 1px solid #334155; width: 100%; margin-bottom: 3px; }
        .inv-sig-label { font-size: 7.5px; color: #64748b; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.3px; }
        .inv-stamp-block { display: flex; flex-direction: column; align-items: center; }
        .inv-stamp-img { height: 55px; width: 55px; object-fit: contain; border: 1.5px solid #c8d8f0; border-radius: 50%; padding: 4px; }
        .inv-stamp-placeholder { width: 55px; height: 55px; border: 1.5px solid #1565c0; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; color: #1565c0; font-weight: 700; text-align: center; padding: 4px; }

        /* FOOTER */
        .inv-footer {
          border-top: 2px solid #1565c0;
          padding-top: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: #f0f4ff;
          padding: 4px 10px;
          border-radius: 0 0 4px 4px;
          margin-top: auto;
        }
        .inv-footer-addr { font-size: 7.5px; color: #1a237e; display: flex; align-items: center; gap: 3px; }
        .inv-footer-contacts { display: flex; gap: 15px; font-size: 7.5px; color: #334155; }
        .inv-footer-contacts span { display: flex; align-items: center; gap: 3px; }
        .inv-footer-tagline { font-size: 8px; font-weight: 800; color: #1565c0; letter-spacing: 0.3px; }

        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #print-invoice-slip, #print-invoice-slip * { visibility: visible !important; }
          #print-invoice-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important;
            height: 29.7cm !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          .inv-slip {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-badge {
            background-color: #0d47a1 !important;
            color: #ffffff !important;
            border-color: #0d47a1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-address-bar {
            background-color: #f0f4ff !important;
            border-color: #c8d8f0 !important;
            color: #1a237e !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-info-grid {
            border-color: #bbdefb !important;
            background-color: #fafcff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-table thead tr {
            background-color: #0d47a1 !important;
          }
          .inv-table thead th {
            color: #ffffff !important;
            background-color: #0d47a1 !important;
            border-color: #0d47a1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-table tbody tr:nth-child(even) {
            background-color: #f5f9ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-total-row {
            background-color: #0d47a1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-total-row td {
            color: #ffffff !important;
            background-color: #0d47a1 !important;
          }
          .inv-payment-section {
            border-color: #bbdefb !important;
            background-color: #fafcff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-status-paid {
            color: #15803d !important;
            background-color: #dcfce7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-status-pending {
            color: #b45309 !important;
            background-color: #fef3c7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .inv-footer {
            border-top-color: #1565c0 !important;
            background-color: #f0f4ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceSlip;
