import React, { useState } from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../core/config/api";

export type MasterStatementItem = {
  itemType: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  invoiceNumber: string;
};

export type MasterStatementData = {
  admissionId?: string;
  admissionCode: string;
  patientName: string;
  patientCode: string;
  wardName: string;
  doctorName: string;
  invoicesCount: number;
  allItems: MasterStatementItem[];
  totalBilled: number;
  totalPaid: number;
  dueAmount: number;
  /** Full admission payload from API when available */
  admission?: any;
};

interface IpdMasterStatementPrintProps {
  data: MasterStatementData | null;
}

const money = (val?: number | null) => {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return "₹0";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const fmtDate = (value?: string | null) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
};

const fmtDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY, hh:mm A") : "—";
};

const isValidClinicLogo = (src?: string | null) => {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower === "/logo.png" || lower === "logo.png" || lower.endsWith("/logo.png")) return false;
  if (lower.includes("placeholder") || lower.includes("300x300")) return false;
  return true;
};

const kv = (label: string, value: React.ReactNode) => (
  <div className="as-kv">
    <span className="as-kv-label">{label}</span>
    <span className="as-kv-value">{value}</span>
  </div>
);

/** Dedicated print layout for IPD Master Statement (billings page). */
const IpdMasterStatementPrint: React.FC<IpdMasterStatementPrintProps> = ({ data }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!data) return null;

  let loginClinic: any = {};
  try {
    loginClinic = JSON.parse(localStorage.getItem("user") || "{}")?.clinic || {};
  } catch {
    /* ignore */
  }

  const admission = data.admission || {};
  const clinic = { ...loginClinic, ...(admission.clinic || {}) };
  const patient = admission.patient || {};
  const doctor = admission.doctor || {};
  const ward = admission.ward || {};
  const treatment = admission.treatment || null;

  const rawLogo =
    clinic.landingPage?.logo || clinic.clinicLogo || clinic.logo || loginClinic.landingPage?.logo || "";
  const clinicLogoUrl = isValidClinicLogo(rawLogo) ? resolveMediaUrl(rawLogo) : "";
  const showClinicLogo = Boolean(clinicLogoUrl) && !logoFailed;
  const clinicName = clinic.name || clinic.clinicName || "Clinic";
  const clinicTagline =
    clinic.landingPage?.tagline || loginClinic?.landingPage?.tagline || "Advanced Care, Always Here";
  const clinicInitial = (clinicName.trim()?.[0] || "C").toUpperCase();
  const clinicPhone = clinic.phone || clinic.whatsappNumber || clinic.landingPage?.whatsapp || "";
  const clinicEmail = clinic.landingPage?.email || clinic.ownerEmail || clinic.email || "";
  const clinicAddress = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.pincode ? `- ${clinic.pincode}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const patientName =
    data.patientName ||
    patient.fullName ||
    [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ").trim() ||
    "Patient";
  const patientInitial = (patientName.trim()?.[0] || "P").toUpperCase();
  const patientStatus = patient.status || "Active";
  const patientDobRaw = patient.dob || patient.dateOfBirth;
  const patientDob = patientDobRaw ? fmtDate(patientDobRaw) : "";
  const patientAge =
    patient.age != null
      ? Number(patient.age)
      : patientDobRaw
      ? Math.floor((Date.now() - new Date(patientDobRaw).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
  const patientPhone = patient.phone || patient.alternateMobile || "—";
  const patientEmail = patient.email || "—";
  const patientBlood = patient.bloodGroup || "—";
  const patientAddress =
    [patient.address1, patient.address2, patient.city, patient.state, patient.country, patient.pincode]
      .filter(Boolean)
      .join(", ") || "—";
  const patientCode = data.patientCode || patient.patientCode || "—";

  const doctorDisplay = doctor.fullName
    ? `Dr. ${doctor.fullName}`
    : data.doctorName?.startsWith("Dr.")
    ? data.doctorName
    : data.doctorName && data.doctorName !== "Primary Doctor"
    ? `Dr. ${data.doctorName}`
    : "Unassigned";
  const doctorInitial = (doctor.fullName || data.doctorName || "D").trim()?.[0]?.toUpperCase() || "D";
  const doctorDept =
    doctor.department?.name || doctor.specializations?.[0]?.name || "—";
  const doctorCreds =
    [doctor.designation?.name, doctor.qualification, doctor.medicalLicenseNumber]
      .filter(Boolean)
      .join(" · ") || "—";
  const doctorPhone = doctor.phone || "—";
  const doctorEmail = doctor.email || "—";
  const doctorVisitCharge =
    admission.doctorVisitCharge ?? doctor.ipdVisitCharge ?? doctor.consultationCharge ?? 0;

  const wardName = ward.wardName || data.wardName || "Not Assigned";
  const wardType = ward.wardType || "—";
  const wardCode = ward.wardCode || "—";
  const wardFloor = ward.floorNumber || "—";
  const wardCharge = ward.chargePerNight ?? admission.wardCharge ?? 0;
  const nursingCharge = ward.nursingChargePerNight ?? admission.nursingFee ?? 0;

  const procedureName =
    treatment?.procedureName || admission.treatmentReason || "—";
  const procedureCategory =
    treatment?.categoryRef?.name || treatment?.category || "—";
  const procedureFee =
    admission.treatmentFee || treatment?.totalPrice || treatment?.procedureFee || 0;

  const admissionCode = data.admissionCode || admission.admissionCode || "IPD";
  const admissionType = admission.admissionType || "Direct";
  const isDischarged = admission.status === "Discharged";
  const paymentStatus =
    data.dueAmount <= 0 && data.totalPaid > 0
      ? "Paid"
      : data.totalPaid > 0
      ? "Partial"
      : admission.paymentStatus || "Unpaid";
  const isPaid = paymentStatus === "Paid";

  const medicines: any[] = Array.isArray(admission.ipdPrescriptions)
    ? admission.ipdPrescriptions.flatMap((p: any) => {
        const list = Array.isArray(p.medicineAdvice)
          ? p.medicineAdvice
          : Array.isArray(p.medicines)
          ? p.medicines
          : [];
        return list.map((m: any) => ({
          ...m,
          prescribedBy: p.doctor?.fullName || doctorDisplay,
          prescribedAt: p.createdAt,
        }));
      })
    : [];

  const genDate = dayjs().format("DD MMM YYYY");
  const genTime = dayjs().format("hh:mm A");

  return (
    <div id="ipd-master-statement-print" className="ipd-ms-print-root">
      <div className="as-slip ipd-ms-print-page">
        <div className="as-slip-body">
          <div className="as-title-bar">
            <h1>IPD MASTER STATEMENT &amp; INVOICE</h1>
          </div>

          {/* Clinic details (same layout as patient bar) */}
          <div className="as-patient-bar as-clinic-bar">
            <div className="as-patient-left">
              {showClinicLogo ? (
                <img
                  src={clinicLogoUrl}
                  alt={clinicName}
                  className="as-avatar as-avatar-lg as-clinic-avatar-img"
                  crossOrigin="anonymous"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="as-avatar as-avatar-lg">{clinicInitial}</div>
              )}
              <div className="as-patient-meta">
                <div className="as-patient-name-row">
                  <h2>{clinicName}</h2>
                  <span className="as-pill as-pill-blue">Clinic</span>
                </div>
                <div className="as-patient-line">
                  {clinicTagline && (
                    <span>
                      <i className="ti ti-heartbeat" /> {clinicTagline}
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
                <div className="as-patient-line">
                  {clinicAddress && (
                    <span>
                      <i className="ti ti-map-pin" /> {clinicAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Patient + Admission ID */}
          <div className="as-patient-bar">
            <div className="as-patient-left">
              <div className="as-avatar as-avatar-lg">{patientInitial}</div>
              <div className="as-patient-meta">
                <div className="as-patient-name-row">
                  <h2>{patientName}</h2>
                  <span className={`as-pill ${patientStatus === "Active" ? "as-pill-green" : "as-pill-muted"}`}>
                    {patientStatus}
                  </span>
                </div>
                <div className="as-patient-line">
                  <span>
                    <i className="ti ti-calendar" />{" "}
                    {patientDob ? `${patientDob}${patientAge != null ? ` (${patientAge} Yrs)` : ""}` : "—"}
                  </span>
                  <span>
                    <i className="ti ti-user" /> {patient.gender || "—"}
                  </span>
                  <span>
                    <i className="ti ti-droplet" /> {patientBlood}
                  </span>
                  <span>
                    <i className="ti ti-phone" /> {patientPhone}
                  </span>
                  <span>
                    <i className="ti ti-mail" /> {patientEmail}
                  </span>
                </div>
                <div className="as-patient-line">
                  <span>
                    <i className="ti ti-id" /> {patientCode}
                  </span>
                  <span>
                    <i className="ti ti-map-pin" /> {patientAddress}
                  </span>
                </div>
              </div>
            </div>
            <div className="as-id-box">
              <div className="as-id-label">ADMISSION ID</div>
              <div className="as-id-value">#{admissionCode}</div>
              <div className="as-id-label mt-2">DOCUMENT TYPE</div>
              <div className="as-id-type">Master Statement</div>
            </div>
          </div>

          {/* Details grid */}
          <div className="as-main-grid">
            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-bed" /> ADMISSION DETAILS
              </div>
              {kv("Admission Type", admissionType)}
              {kv("Admission Date", fmtDateTime(admission.admissionDate))}
              {kv(
                "Status",
                <span className={`as-pill ${isDischarged ? "as-pill-orange" : "as-pill-green"}`}>
                  {isDischarged ? "Discharged" : admission.status || "Admitted"}
                </span>
              )}
              {kv("Diagnosis", admission.diagnosis || "—")}
              {kv("Admission Fee", money(admission.admissionFee))}
              {kv("Invoices Raised", String(data.invoicesCount))}
            </div>

            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-stethoscope" /> DOCTOR &amp; SURGERY
              </div>
              <div className="as-doctor-row">
                <div className="as-avatar as-avatar-md">{doctorInitial}</div>
                <div>
                  <div className="as-doctor-name">{doctorDisplay}</div>
                  <div className="as-doctor-creds">{doctorCreds}</div>
                  {doctorDept !== "—" && <span className="as-pill as-pill-purple">{doctorDept}</span>}
                </div>
              </div>
              {kv("Doctor Phone", doctorPhone)}
              {kv("Doctor Email", doctorEmail)}
              {kv("Visit Charge", money(doctorVisitCharge))}
              {kv("Procedure / Surgery", procedureName)}
              {kv("Category", procedureCategory)}
              {kv("Procedure Charge", money(procedureFee))}
            </div>

            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-building-hospital" /> WARD DETAILS
              </div>
              {kv("Assigned Ward", wardName)}
              {kv("Ward Code", wardCode)}
              {kv("Ward Type", wardType)}
              {kv("Floor", wardFloor)}
              {kv("Charge / Night", money(wardCharge))}
              {kv("Nursing / Night", money(nursingCharge))}
            </div>
          </div>

          {/* Medicines (from IPD prescriptions if any) */}
          {medicines.length > 0 && (
            <div className="ipd-ms-card-block">
              <div className="as-col-head">
                <i className="ti ti-pill" /> PRESCRIBED MEDICINES
              </div>
              <table className="ipd-ms-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="fw">{m.name || m.medicineName || "—"}</td>
                      <td>{m.dosage || m.frequency || "—"}</td>
                      <td>{m.duration || "—"}</td>
                      <td>{m.instructions || m.timings || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Full invoice / itemized charges card */}
          <div className="ipd-ms-card-block">
            <div className="as-col-head">
              <i className="ti ti-receipt" /> FULL INVOICE &amp; ITEMIZED CHARGES
            </div>
            <table className="ipd-ms-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Service / Item</th>
                  <th>Invoice #</th>
                  <th className="tr">Unit (₹)</th>
                  <th className="tc">Qty</th>
                  <th className="tr">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.allItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="tc muted">
                      No charges raised for this IPD admission yet.
                    </td>
                  </tr>
                ) : (
                  data.allItems.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="as-pill as-pill-blue">{it.itemType || "Charge"}</span>
                      </td>
                      <td className="fw">{it.itemName}</td>
                      <td>{it.invoiceNumber || "—"}</td>
                      <td className="tr">{money(it.unitPrice)}</td>
                      <td className="tc">{it.quantity}</td>
                      <td className="tr fw">{money(it.totalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment summary */}
          <div className="as-mid-row">
            <div className="as-instructions">
              <div className="as-col-head">STATEMENT NOTES</div>
              <ul>
                <li>
                  <i className="ti ti-circle-check" /> This is a consolidated master statement of all IPD invoices.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Please clear outstanding dues at the billing desk.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Keep this statement for insurance / reimbursement claims.
                </li>
              </ul>
            </div>
            <div className="as-payment">
              <div className="as-col-head">
                <i className="ti ti-credit-card" /> PAYMENT SUMMARY
              </div>
              {kv(
                "Payment Status",
                <span className={`as-pill ${isPaid ? "as-pill-green" : "as-pill-orange"}`}>{paymentStatus}</span>
              )}
              {kv("Total Billed", money(data.totalBilled))}
              {kv("Total Paid", money(data.totalPaid))}
              {kv("Due Balance", money(data.dueAmount))}
              {kv("Payment Mode", admission.paymentMethod || "—")}
            </div>
          </div>

          <div className="as-footer">
            <div className="as-footer-left">
              <i className="ti ti-heartbeat" /> Thank you for choosing {clinicName}. We wish you good health!
            </div>
            <div className="as-footer-divider" />
            <div className="as-footer-right">
              <div>Computer generated master statement.</div>
              <div>
                Date: {genDate} | Time: {genTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ipd-ms-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .ipd-ms-print-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
        }
        .as-slip {
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
        .as-slip-body {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1 1 auto;
        }
        .as-slip * { box-sizing: border-box; }
        .as-title-bar {
          text-align: center;
          padding: 4px 0 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .as-title-bar h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #1e3a8a !important;
        }
        .as-patient-bar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .as-clinic-bar {
          padding-top: 4px;
        }
        .as-clinic-avatar-img {
          object-fit: contain;
          background: #f8fafc;
          border-radius: 10px !important;
          padding: 4px;
        }
        .as-patient-left { display: flex; gap: 12px; align-items: flex-start; min-width: 0; flex: 1; }
        .as-avatar {
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff !important;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; flex-shrink: 0;
        }
        .as-avatar-lg { width: 52px; height: 52px; font-size: 20px; }
        .as-avatar-md { width: 36px; height: 36px; font-size: 14px; }
        .as-patient-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .as-patient-name-row h2 { margin: 0; font-size: 15px; font-weight: 800; color: #0f172a !important; }
        .as-patient-line {
          display: flex; flex-wrap: wrap; gap: 8px 12px;
          font-size: 10.5px; color: #334155 !important; margin-bottom: 3px;
        }
        .as-patient-line i { color: #6366f1 !important; margin-right: 3px; }
        .as-id-box {
          border: 1.5px dashed #93c5fd;
          border-radius: 10px;
          padding: 10px 14px;
          min-width: 148px;
          text-align: center;
          background: #f8fbff;
          flex-shrink: 0;
        }
        .as-id-label { font-size: 9px; font-weight: 700; letter-spacing: 0.6px; color: #2563eb !important; }
        .as-id-value { font-size: 16px; font-weight: 800; color: #0f172a !important; }
        .as-id-type { font-size: 11px; font-weight: 700; color: #2563eb !important; }
        .as-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }
        .as-col { padding: 10px 12px; position: relative; }
        .as-col:not(:last-child)::after {
          content: "";
          position: absolute; right: 0; top: 10px; bottom: 10px;
          width: 1px; background: #e2e8f0;
        }
        .as-col-head {
          display: flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
          color: #1e40af !important; margin-bottom: 8px;
        }
        .as-col-head i { font-size: 13px; color: #2563eb !important; }
        .as-kv {
          display: flex; justify-content: space-between; gap: 8px;
          font-size: 10.5px; padding: 3px 0; border-bottom: 1px solid #f1f5f9;
        }
        .as-kv:last-child { border-bottom: none; }
        .as-kv-label { color: #64748b !important; font-weight: 500; }
        .as-kv-value { color: #0f172a !important; font-weight: 700; text-align: right; max-width: 62%; word-break: break-word; }
        .as-pill {
          display: inline-flex; align-items: center; padding: 2px 7px;
          border-radius: 999px; font-size: 9.5px; font-weight: 700; border: 1px solid transparent;
        }
        .as-pill-green { background: #ecfdf5 !important; color: #047857 !important; border-color: #6ee7b7 !important; }
        .as-pill-blue { background: #eff6ff !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }
        .as-pill-orange { background: #fff7ed !important; color: #c2410c !important; border-color: #fdba74 !important; }
        .as-pill-purple { background: #f3e8ff !important; color: #7e22ce !important; border-color: #d8b4fe !important; }
        .as-pill-muted { background: #f1f5f9 !important; color: #64748b !important; border-color: #e2e8f0 !important; }
        .as-doctor-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; }
        .as-doctor-name { font-size: 12px; font-weight: 800; color: #0f172a !important; }
        .as-doctor-creds { font-size: 9.5px; color: #64748b !important; margin: 2px 0 4px; }
        .ipd-ms-card-block {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
        }
        .ipd-ms-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
        }
        .ipd-ms-table th {
          text-align: left;
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 6px 8px;
          border-bottom: 1px solid #c7d2fe;
        }
        .ipd-ms-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
          color: #0f172a;
        }
        .ipd-ms-table tr:last-child td { border-bottom: none; }
        .ipd-ms-table .tr { text-align: right; }
        .ipd-ms-table .tc { text-align: center; }
        .ipd-ms-table .fw { font-weight: 700; }
        .ipd-ms-table .muted { color: #64748b; font-style: italic; }
        .as-mid-row {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 12px;
          background: #f3f0ff !important;
          border: 1px solid #ddd6fe;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .as-instructions ul {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .as-instructions li {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 10.5px; color: #334155 !important; line-height: 1.4;
        }
        .as-instructions li i { color: #7c3aed !important; font-size: 14px; flex-shrink: 0; }
        .as-payment {
          background: #fff !important;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .as-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          background: #1e3a8a !important;
          color: #fff !important;
          border-radius: 8px;
          font-size: 10px;
        }
        .as-footer-left { display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .as-footer-divider { width: 1px; align-self: stretch; background: rgba(255,255,255,0.35); }
        .as-footer-right { text-align: right; opacity: 0.95; }

        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #ipd-master-statement-print,
          #ipd-master-statement-print * {
            visibility: visible !important;
          }
          #ipd-master-statement-print.ipd-ms-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 99999 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IpdMasterStatementPrint;
