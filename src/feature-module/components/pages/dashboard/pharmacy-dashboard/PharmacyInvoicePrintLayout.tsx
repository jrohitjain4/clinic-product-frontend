import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";

interface PharmacyInvoicePrintLayoutProps {
  invoice: any;
}

const inr = (amount: number | string | null | undefined) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const isValidClinicLogo = (src?: string | null) => {
  if (!src || typeof src !== "string") return false;
  const s = src.trim().toLowerCase();
  if (!s || s === "/logo.png" || s === "logo.png" || s.endsWith("/logo.png")) return false;
  if (s.includes("placeholder") || s.includes("300x300")) return false;
  return true;
};

/** Dedicated A4 print layout for Pharmacy Billing invoices. */
const PharmacyInvoicePrintLayout: React.FC<PharmacyInvoicePrintLayoutProps> = ({ invoice }) => {
  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj?.clinic || {};
  } catch {
    /* ignore */
  }

  const clinic = {
    ...loginClinic,
    ...(invoice?.clinic || {}),
    landingPage: {
      ...(loginClinic?.landingPage || {}),
      ...(invoice?.clinic?.landingPage || {}),
    },
  };

  const clinicName = clinic.name || invoice?.clinicName || "Clinic";
  const clinicTagline =
    clinic.landingPage?.tagline || clinic.tagline || "Your trusted pharmacy partner";
  const rawLogo =
    clinic.landingPage?.logo || clinic.clinicLogo || clinic.logo || loginClinic?.landingPage?.logo || "";
  const clinicLogoUrl = isValidClinicLogo(rawLogo) ? resolveMediaUrl(rawLogo) : "";
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [clinicLogoUrl]);

  if (!invoice) return null;

  const clinicAddress = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.pincode ? `PIN - ${clinic.pincode}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const clinicPhone = clinic.phone || clinic.landingPage?.whatsapp || clinic.whatsappNumber || "";
  const clinicEmail = clinic.landingPage?.email || clinic.ownerEmail || clinic.email || "";

  const patient = invoice.patient || null;
  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : invoice.customerName || "Walk-in Customer";
  const patientCode = patient?.patientCode || "—";
  const patientPhone = patient?.phone || invoice.customerPhone || "—";
  const patientAddress =
    [patient?.address1, patient?.address2, patient?.city, patient?.state, patient?.pincode]
      .filter(Boolean)
      .join(", ") || "—";
  const patientInitial = (patientName.trim()[0] || "P").toUpperCase();

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subTotal = Number(invoice.subTotal) || items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const discount = Number(invoice.discount) || 0;
  const tax = Number(invoice.tax) || 0;
  const totalAmount = Number(invoice.totalAmount) || Math.max(0, subTotal - discount + tax);

  const invoiceNo = invoice.invoiceNo || invoice.invoiceCode || "—";
  const invoiceDate = invoice.invoiceDate || invoice.createdAt;
  const paymentStatus = invoice.paymentStatus || "Unpaid";
  const paymentMethod = invoice.paymentMethod || "—";
  const isPaid =
    String(paymentStatus).toLowerCase().includes("paid") &&
    !String(paymentStatus).toLowerCase().includes("unpaid");

  const genDate = dayjs().format("DD MMM YYYY");
  const genTime = dayjs().format("hh:mm A");

  const kv = (label: string, value: React.ReactNode) => (
    <div className="pharm-kv">
      <span className="pharm-kv-label">{label}</span>
      <span className="pharm-kv-value">{value}</span>
    </div>
  );

  const printNode = (
    <div id="pharmacy-invoice-print" className="pharm-inv-print-root">
      <div className="pharm-inv-print-page">
        <div className="pharm-slip">
          <div className="pharm-slip-body">
            {/* Header */}
            <div className="pharm-header">
              <div className="pharm-header-left">
                {clinicLogoUrl && !logoFailed ? (
                  <img
                    src={clinicLogoUrl}
                    alt={clinicName}
                    className="pharm-logo"
                    crossOrigin="anonymous"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="pharm-logo-fallback">{(clinicName[0] || "C").toUpperCase()}</div>
                )}
                <div>
                  <h1 className="pharm-clinic-name">{clinicName}</h1>
                  <p className="pharm-tagline">{clinicTagline}</p>
                </div>
              </div>
              <div className="pharm-header-right">
                <div className="pharm-badge">PHARMACY INVOICE</div>
                <div className="pharm-inv-no">#{invoiceNo}</div>
              </div>
            </div>

            <div className="pharm-clinic-bar">
              {clinicAddress && (
                <span>
                  <i className="ti ti-map-pin" /> {clinicAddress}
                </span>
              )}
              {clinicPhone && (
                <span>
                  <i className="ti ti-phone" /> {clinicPhone}
                </span>
              )}
              {clinicEmail && (
                <span>
                  <i className="ti ti-mail" /> {clinicEmail}
                </span>
              )}
            </div>

            {/* Patient + Invoice meta */}
            <div className="pharm-meta-grid">
              <div className="pharm-card">
                <div className="pharm-card-head">
                  <i className="ti ti-user" /> PATIENT / CUSTOMER
                </div>
                <div className="pharm-patient-row">
                  <div className="pharm-avatar">{patientInitial}</div>
                  <div>
                    <div className="pharm-patient-name">{patientName}</div>
                    <div className="pharm-patient-code">{patientCode}</div>
                  </div>
                </div>
                {kv("Mobile", patientPhone)}
                {kv("Address", patientAddress)}
              </div>

              <div className="pharm-card">
                <div className="pharm-card-head">
                  <i className="ti ti-file-invoice" /> INVOICE DETAILS
                </div>
                {kv("Invoice No.", invoiceNo)}
                {kv("Invoice Date", invoiceDate ? dayjs(invoiceDate).format("DD MMM YYYY") : "—")}
                {kv("Generated On", dayjs(invoice.createdAt || invoiceDate).format("DD MMM YYYY, hh:mm A"))}
                {kv(
                  "Payment Status",
                  <span className={`pharm-pill ${isPaid ? "pharm-pill-green" : "pharm-pill-orange"}`}>
                    {paymentStatus}
                  </span>
                )}
                {kv("Payment Mode", paymentMethod)}
              </div>

              <div className="pharm-card">
                <div className="pharm-card-head">
                  <i className="ti ti-building-hospital" /> CLINIC
                </div>
                <div className="pharm-clinic-name-sm">{clinicName}</div>
                {clinicAddress && <p className="pharm-muted">{clinicAddress}</p>}
                {clinicPhone && <p className="pharm-muted"><i className="ti ti-phone" /> {clinicPhone}</p>}
                {clinicEmail && <p className="pharm-muted"><i className="ti ti-mail" /> {clinicEmail}</p>}
              </div>
            </div>

            {/* Medicines table */}
            <div className="pharm-items-section">
              <div className="pharm-card-head">
                <i className="ti ti-pill" /> MEDICINE DETAILS ({items.length})
              </div>
              <table className="pharm-table">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>#</th>
                    <th style={{ width: "32%" }}>Medicine</th>
                    <th style={{ width: "14%" }}>SKU / Code</th>
                    <th style={{ width: "12%" }}>Brand / Generic</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Qty</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Unit Cost</th>
                    <th style={{ width: "8%", textAlign: "center" }}>GST %</th>
                    <th style={{ width: "11%", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No medicines listed
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any, idx: number) => {
                      const med = item.medicine || {};
                      const brandGeneric = [med.brandName, med.genericName].filter(Boolean).join(" / ") || "—";
                      return (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="pharm-med-name">{item.medicineName || item.name || "—"}</div>
                            {item.description && (
                              <div className="pharm-med-desc">{item.description}</div>
                            )}
                          </td>
                          <td>{med.medicineCode || item.sku || "—"}</td>
                          <td className="pharm-muted">{brandGeneric}</td>
                          <td style={{ textAlign: "center" }}>{item.quantity ?? 1}</td>
                          <td style={{ textAlign: "right" }}>{inr(item.unitCost)}</td>
                          <td style={{ textAlign: "center" }}>{Number(item.gst || 0)}%</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{inr(item.amount)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} style={{ textAlign: "right" }}>
                      Sub Total
                    </td>
                    <td style={{ textAlign: "right" }}>{inr(subTotal)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr className="pharm-discount-row">
                      <td colSpan={7} style={{ textAlign: "right" }}>
                        Discount
                      </td>
                      <td style={{ textAlign: "right" }}>- {inr(discount)}</td>
                    </tr>
                  )}
                  {tax > 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "right" }}>
                        GST Tax
                      </td>
                      <td style={{ textAlign: "right" }}>{inr(tax)}</td>
                    </tr>
                  )}
                  <tr className="pharm-total-row">
                    <td colSpan={7} style={{ textAlign: "right" }}>
                      TOTAL AMOUNT
                    </td>
                    <td style={{ textAlign: "right" }}>{inr(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment + notes */}
            <div className="pharm-bottom-grid">
              <div className="pharm-card">
                <div className="pharm-card-head">
                  <i className="ti ti-credit-card" /> PAYMENT SUMMARY
                </div>
                {kv("Payment Status", paymentStatus)}
                {kv("Payment Mode", paymentMethod)}
                {kv("Sub Total", inr(subTotal))}
                {discount > 0 ? kv("Discount", `- ${inr(discount)}`) : null}
                {tax > 0 ? kv("GST Tax", inr(tax)) : null}
                {kv("Total Amount", <strong className="pharm-total">{inr(totalAmount)}</strong>)}
              </div>
              <div className="pharm-card">
                <div className="pharm-card-head">
                  <i className="ti ti-notes" /> NOTES
                </div>
                <ul className="pharm-notes">
                  <li>Thank you for purchasing from our pharmacy.</li>
                  <li>Please keep this invoice for future reference / returns.</li>
                  <li>Medicines once sold are subject to clinic return policy.</li>
                  {invoice.notes ? <li>{invoice.notes}</li> : null}
                </ul>
              </div>
            </div>

            <div className="pharm-sig-row">
              <div className="pharm-sig">
                <div className="pharm-sig-line" />
                <span>Customer Signature</span>
              </div>
              <div className="pharm-sig pharm-sig-right">
                <div className="pharm-sig-line" />
                <span>Authorised Signatory</span>
              </div>
            </div>
          </div>

          <div className="pharm-footer">
            <div>
              <i className="ti ti-heartbeat" /> Thank you for choosing {clinicName}.
            </div>
            <div>
              Computer generated pharmacy invoice · {genDate} | {genTime}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pharm-inv-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .pharm-inv-print-page {
          width: 210mm;
          background: #fff;
        }
        .pharm-slip {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          color: #0f172a;
          font-family: Inter, system-ui, sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .pharm-slip * { box-sizing: border-box; }
        .pharm-slip-body {
          padding: 12px 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pharm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .pharm-header-left { display: flex; align-items: center; gap: 12px; }
        .pharm-logo { max-height: 52px; max-width: 120px; object-fit: contain; }
        .pharm-logo-fallback {
          width: 48px; height: 48px; border-radius: 10px;
          background: #eef0ff; color: #2e37a4; font-weight: 800;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .pharm-clinic-name {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .pharm-tagline { margin: 2px 0 0; font-size: 10px; color: #64748b; font-weight: 600; }
        .pharm-header-right { text-align: right; }
        .pharm-badge {
          display: inline-block;
          background: #2e37a4 !important;
          color: #fff !important;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .pharm-inv-no {
          margin-top: 6px;
          font-size: 14px;
          font-weight: 800;
          color: #2e37a4;
        }
        .pharm-clinic-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 10px;
          color: #475569;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .pharm-clinic-bar i { color: #2e37a4; margin-right: 3px; }
        .pharm-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .pharm-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          background: #f8fafc;
        }
        .pharm-card-head {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #2e37a4;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pharm-patient-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .pharm-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #2e37a4, #4f5bd5);
          color: #fff; font-weight: 800; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pharm-patient-name { font-size: 13px; font-weight: 800; }
        .pharm-patient-code { font-size: 10px; color: #64748b; font-weight: 600; }
        .pharm-kv {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          padding: 3px 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        .pharm-kv:last-child { border-bottom: none; }
        .pharm-kv-label { color: #64748b; flex-shrink: 0; }
        .pharm-kv-value { font-weight: 600; color: #0f172a; text-align: right; }
        .pharm-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }
        .pharm-pill-green { background: #dcfce7; color: #15803d; }
        .pharm-pill-orange { background: #ffedd5; color: #c2410c; }
        .pharm-clinic-name-sm { font-weight: 800; font-size: 12px; margin-bottom: 4px; }
        .pharm-muted { font-size: 10px; color: #475569; margin: 0 0 3px; line-height: 1.45; }
        .pharm-items-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
        }
        .pharm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-top: 6px;
        }
        .pharm-table th {
          background: #2e37a4 !important;
          color: #fff !important;
          padding: 6px 7px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          text-align: left;
        }
        .pharm-table td {
          padding: 6px 7px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .pharm-med-name { font-weight: 700; color: #0f172a; }
        .pharm-med-desc { font-size: 9px; color: #64748b; margin-top: 2px; }
        .pharm-table tfoot td {
          background: #f1f5f9;
          font-weight: 600;
          border-top: 1px solid #cbd5e1;
        }
        .pharm-discount-row td { color: #b91c1c !important; }
        .pharm-total-row td {
          background: #eef0ff !important;
          color: #2e37a4 !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          border-top: 2px solid #c7cbf5 !important;
        }
        .pharm-total { color: #2e37a4 !important; font-size: 13px; }
        .pharm-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .pharm-notes {
          margin: 0;
          padding-left: 16px;
          font-size: 10px;
          color: #475569;
          line-height: 1.55;
        }
        .pharm-sig-row {
          display: flex;
          justify-content: space-between;
          margin-top: 18px;
          padding: 0 8px;
        }
        .pharm-sig {
          width: 180px;
          text-align: center;
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .pharm-sig-line {
          border-top: 1px solid #94a3b8;
          margin-bottom: 6px;
          margin-top: 36px;
        }
        .pharm-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border-top: 2px solid #e2e8f0;
          background: #f8fafc;
          font-size: 10px;
          color: #64748b;
          margin-top: auto;
        }
        .pharm-footer i { color: #2e37a4; margin-right: 4px; }

        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#pharmacy-invoice-print) {
            display: none !important;
          }
          #pharmacy-invoice-print.pharm-inv-print-root {
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
          #pharmacy-invoice-print,
          #pharmacy-invoice-print * {
            visibility: visible !important;
          }
          .pharm-inv-print-page,
          .pharm-inv-print-page .pharm-slip {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(printNode, document.body);
};

export default PharmacyInvoicePrintLayout;
