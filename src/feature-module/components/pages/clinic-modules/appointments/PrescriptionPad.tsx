import React from "react";
import { resolveMediaUrl } from "../../../../../core/config/api";

interface PrescriptionPadProps {
  appointment: any;
  prescription: any;
}

const PrescriptionPad: React.FC<PrescriptionPadProps> = ({ appointment, prescription }) => {
  const patient = appointment?.patient || prescription?.patient || {};
  const doctor = appointment?.doctor || prescription?.doctor || {};

  const patientAge = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj.clinic || {};
  } catch (e) {}

  const clinic = appointment?.clinic || prescription?.clinic || loginClinic || {};

  const clinicName = clinic?.name || appointment?.clinicName || prescription?.clinicName || "City Care Clinic";
  const clinicTagline = clinic?.landingPage?.tagline || "Compassionate Care, Better Health";

  const addressParts = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.pincode ? `PIN - ${clinic.pincode}` : ""
  ].filter(Boolean);
  const clinicAddress = addressParts.length > 0 
    ? addressParts.join(", ") 
    : "123, Green Valley Road, Near City Mall, Civil Lines, Lucknow - 226001";

  const clinicPhone = clinic?.phone || "+91 98765 43210";
  const clinicEmail = clinic?.ownerEmail || clinic?.email || "info@citycareclinic.com";
  const clinicWebsite = clinic?.website || "www.citycareclinic.com";
  const clinicRegNo = clinic?.gstNumber || "CCC/2023/00125";
  const clinicLogo = clinic?.landingPage?.logo || null;

  const apptCode = appointment?.appointmentCode || prescription?.appointment?.appointmentCode || "N/A";
  const visitType = appointment?.isFollowUp || prescription?.appointment?.isFollowUp ? "Follow-up" : "First Consultation";
  const apptDate = appointment?.scheduledAt || prescription?.appointment?.scheduledAt || prescription?.createdAt;
  const presDate = prescription?.createdAt;
  const followUpDate = prescription?.followUpDate || appointment?.followUpDate;
  const consultMode = prescription?.appointment?.mode || appointment?.mode || "In-Person";

  const doctorFullName = doctor?.fullName || appointment?.doctorName || "—";
  const doctorQualification = doctor?.designation?.name || "MBBS, MD";
  const doctorRegNo = doctor?.details?.registrationNumber || "MED-IN-100456";
  const doctorDept = doctor?.department?.name || "General";

  return (
    <div className="prescription-pad-card">

      {/* ========== HEADER ========== */}
      <div className="pad-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div className="pad-logo">
            {clinicLogo ? (
              <img
                src={resolveMediaUrl(clinicLogo)}
                alt="Clinic Logo"
                style={{ maxHeight: "46px", maxWidth: "100px", objectFit: "contain" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : null}
          </div>
          <div>
            <h2 className="pad-clinic-name">{clinicName.toUpperCase()}</h2>
            <p className="pad-clinic-tagline">{clinicTagline}</p>
          </div>
        </div>

        <div className="pad-contact-grid d-flex flex-column text-end">
          <div className="d-flex align-items-center justify-content-end gap-1 mb-1">
            <i className="ti ti-map-pin" />
            <span>{clinicAddress}</span>
          </div>
          <div className="d-flex justify-content-end gap-3 mb-1">
            <div className="d-flex align-items-center gap-1"><i className="ti ti-mail" /><span>{clinicEmail}</span></div>
          </div>
          <div className="d-flex justify-content-end gap-3">
            <div className="d-flex align-items-center gap-1"><i className="ti ti-clock" /><span>Mon-Sat: 9AM-8PM | Sun: 10AM-2PM</span></div>
            <div className="d-flex align-items-center gap-1"><i className="ti ti-receipt" /><span>Reg: {clinicRegNo}</span></div>
          </div>
        </div>
      </div>

      <div className="divider-thick" />

      {/* ========== THREE-COLUMN META GRID ========== */}
      <div className="pad-meta-grid row g-0">
        {/* Patient Details */}
        <div className="col-sm-4 border-right-divider px-2">
          <h6 className="pad-section-title">PATIENT DETAILS</h6>
          <table className="pad-table mb-0">
            <tbody>
              <tr><td className="pad-lbl">Patient Name</td><td className="pad-val">: {patient.firstName || ""} {patient.lastName || ""}</td></tr>
              <tr><td className="pad-lbl">Patient ID</td><td className="pad-val">: {patient.patientCode || "N/A"}</td></tr>
              <tr><td className="pad-lbl">Age / Gender</td><td className="pad-val">: {patientAge !== null ? `${patientAge} Yrs` : "N/A"} / {patient.gender || "N/A"}</td></tr>
              <tr><td className="pad-lbl">Mobile No.</td><td className="pad-val">: {patient.phone || "N/A"}</td></tr>
              <tr><td className="pad-lbl">Address</td><td className="pad-val">: {patient.address1 || patient.address || "N/A"}</td></tr>
              <tr><td className="pad-lbl">Referred By</td><td className="pad-val">: {appointment?.referredBy || prescription?.appointment?.referredBy || "Self"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Appointment Details */}
        <div className="col-sm-4 border-right-divider px-2">
          <h6 className="pad-section-title">APPOINTMENT DETAILS</h6>
          <table className="pad-table mb-0">
            <tbody>
              <tr><td className="pad-lbl">Appointment ID</td><td className="pad-val">: {apptCode}</td></tr>
              <tr><td className="pad-lbl">Visit Type</td><td className="pad-val">: {visitType}</td></tr>
              <tr><td className="pad-lbl">Date</td><td className="pad-val">: {apptDate ? new Date(apptDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</td></tr>
              <tr><td className="pad-lbl">Time</td><td className="pad-val">: {apptDate ? new Date(apptDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td></tr>
              <tr><td className="pad-lbl">Doctor</td><td className="pad-val">: {doctorFullName}</td></tr>
              <tr><td className="pad-lbl">Department</td><td className="pad-val">: {doctorDept}</td></tr>
              <tr><td className="pad-lbl">Follow Up Date</td><td className="pad-val">: {followUpDate ? new Date(followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "___________"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Doctor Details */}
        <div className="col-sm-4 px-2">
          <h6 className="pad-section-title">DOCTOR DETAILS</h6>
          <table className="pad-table mb-0">
            <tbody>
              <tr><td className="pad-lbl">Doctor Name</td><td className="pad-val">: {doctorFullName}</td></tr>
              <tr><td className="pad-lbl">Qualification</td><td className="pad-val">: {doctorQualification}</td></tr>
              <tr><td className="pad-lbl">Reg. No.</td><td className="pad-val">: {doctorRegNo}</td></tr>
              <tr><td className="pad-lbl">Consult. Type</td><td className="pad-val">: {consultMode}</td></tr>
              <tr><td className="pad-lbl">Pres. Date</td><td className="pad-val">: {presDate ? new Date(presDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="divider-thin" />

      {/* ========== DOCUMENTS ROW ========== */}
      <div className="pad-docs-row d-flex align-items-center gap-3">
        <span className="docs-title">DOCUMENTS PROVIDED BY PATIENT (IF ANY)</span>
        <div className="d-flex align-items-center gap-1"><span className="checkbox-box" /> Previous Prescription</div>
        <div className="d-flex align-items-center gap-1"><span className="checkbox-box" /> Reports</div>
        <div className="d-flex align-items-center gap-1"><span className="checkbox-box" /> ID Proof</div>
        <div className="d-flex align-items-center gap-1"><span className="checkbox-box" /> Others _______________</div>
      </div>

      <div className="divider-thin" />

      {/* ========== MAIN BODY ========== */}
      <div className="pad-body-container">
        {/* Left: Clinical Notes */}
        <div className="pad-left-notes-col">
          <h6 className="notes-col-title">CLINICAL NOTES</h6>
          <div className="notes-vitals-list">
            <div className="vital-item">B.P. : _______________</div>
            <div className="vital-item">SUGAR : _______________</div>
            <div className="vital-item">PULSE : _______________</div>
            <div className="vital-item">TEMP. : _______________</div>
            <div className="vital-item">WEIGHT : _______________</div>
            <div className="vital-item">HEIGHT : _______________</div>
            <div className="vital-item">SPO₂ : _______________</div>
            <div className="vital-item">RESP. RATE : _______________</div>
            <div className="vital-item">PAIN SCALE : _______________</div>
            <div className="vital-item">ALLERGIES : _______________</div>
          </div>
          <div className="ruled-notes-lines">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="notes-ruled-line" />
            ))}
          </div>
        </div>

        {/* Right: Rx Area */}
        <div className="pad-right-rx-col">
          <div className="rx-watermark-container">
            {clinicLogo ? (
              <img
                src={resolveMediaUrl(clinicLogo)}
                alt="watermark"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : null}
            <h3 className="watermark-clinic-name">{clinicName.toUpperCase()}</h3>
            <p className="watermark-clinic-tagline">{clinicTagline}</p>
          </div>
          <div className="rx-signature-container mt-auto">
            <div className="sig-line" />
            <span className="sig-text">Doctor's Signature &amp; Seal</span>
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="divider-thin" />
      <div className="pad-footer d-flex flex-column align-items-center">
        <p className="footer-thanks">Thank you for trusting {clinicName.toUpperCase()} for your healthcare needs.</p>
        <div className="footer-contacts d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1"><i className="ti ti-phone" /> {clinicPhone}</div>
          <span>|</span>
          <div className="d-flex align-items-center gap-1"><i className="ti ti-mail" /> {clinicEmail}</div>
        </div>
      </div>

      {/* ========== STYLES ========== */}
      <style>{`
        .prescription-pad-card {
          width: 21cm;
          height: 29.7cm;
          max-height: 29.7cm;
          box-sizing: border-box;
          padding: 0.3cm 0.45cm;
          display: flex;
          flex-direction: column;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden !important;
        }
        .prescription-pad-card * {
          color: #000000 !important;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }

        /* ---- HEADER ---- */
        .pad-header { margin-bottom: 16px !important; }
        .pad-clinic-name { font-size: 20px; font-weight: 800 !important; color: #0d4b83 !important; margin: 0; line-height: 1.1; }
        .pad-clinic-tagline { font-size: 11px; font-weight: 600 !important; color: #55ad6f !important; margin: 0; }
        .pad-contact-grid { font-size: 9.5px; color: #111111 !important; line-height: 1.35; }
        .pad-contact-grid i { color: #0d4b83 !important; }

        /* ---- DIVIDERS ---- */
        .divider-thick { height: 2.5px; background-color: #0d4b83 !important; margin: 10px 0 20px 0; flex-shrink: 0; }
        .divider-thin { height: 1px; background-color: #0d4b83 !important; margin: 4px 0; flex-shrink: 0; }

        /* ---- META GRID ---- */
        .pad-section-title { font-size: 11px; font-weight: 800 !important; color: #0d4b83 !important; letter-spacing: 0.4px; margin-bottom: 4px; }
        .border-right-divider { border-right: 1.5px solid #0d4b83 !important; }
        table.pad-table { font-size: 10.5px; line-height: 1.25; border-collapse: collapse; width: 100%; }
        table.pad-table tr { line-height: 1.25; }
        table.pad-table td,
        table.pad-table th { padding: 2px 2px !important; margin: 0 !important; border: none !important; line-height: 1.25; vertical-align: top; }
        table.pad-table .pad-lbl { font-weight: 700 !important; color: #000000 !important; width: 100px; white-space: nowrap; }
        table.pad-table .pad-val { color: #000000 !important; font-weight: 700 !important; }

        /* ---- DOCS ROW ---- */
        .checkbox-box { width: 12px; height: 12px; border: 1.5px solid #000000 !important; display: inline-block; vertical-align: middle; margin-right: 4px; flex-shrink: 0; }
        .pad-docs-row { font-size: 10px; font-weight: 700 !important; color: #000000 !important; padding: 2px 0; flex-shrink: 0; }
        .docs-title { font-weight: 800 !important; color: #0d4b83 !important; }

        /* ---- BODY ---- */
        .pad-body-container {
          display: flex;
          flex: 1 1 0;
          min-height: 0;
          border: 1.5px solid #0d4b83 !important;
          margin-top: 4px;
          overflow: hidden;
        }
        .pad-left-notes-col {
          width: 28%;
          border-right: 1.5px solid #0d4b83 !important;
          display: flex;
          flex-direction: column;
          padding: 8px 8px;
          overflow: hidden;
        }
        .notes-col-title { font-size: 11px; font-weight: 800 !important; color: #0d4b83 !important; border-bottom: 1.5px solid #0d4b83 !important; padding-bottom: 4px; margin-bottom: 8px; text-align: center; flex-shrink: 0; }
        .notes-vitals-list { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }
        .vital-item { font-size: 12px; font-weight: 700 !important; color: #000000 !important; line-height: 1.35; }
        .ruled-notes-lines { flex: 1 1 0; display: flex; flex-direction: column; margin-top: 10px; justify-content: space-evenly; min-height: 0; }
        .notes-ruled-line { border-bottom: 0.75px solid #000000 !important; opacity: 0.3; min-height: 0; }

        .pad-right-rx-col {
          width: 72%;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .rx-watermark-container { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); text-align: center; opacity: 0.04; pointer-events: none; width: 80%; }
        .rx-watermark-container img { max-height: 90px; max-width: 90px; object-fit: contain; }
        .watermark-clinic-name { font-size: 15px; font-weight: 850 !important; margin: 4px 0 0 0; color: #0d4b83 !important; }
        .watermark-clinic-tagline { font-size: 8px; font-weight: 600 !important; margin: 0; }
        .rx-signature-container { align-self: flex-end; text-align: center; width: 150px; margin-bottom: 5px; }
        .sig-line { border-top: 1px solid #000000 !important; width: 100%; margin-bottom: 3px; }
        .sig-text { font-size: 10px; font-weight: 700 !important; color: #000000 !important; }

        /* ---- FOOTER ---- */
        .pad-footer { text-align: center; padding: 2px 0 0 0; font-size: 9.5px; flex-shrink: 0; }
        .footer-thanks { font-weight: 800 !important; color: #0d4b83 !important; margin-bottom: 1px; }
        .footer-contacts { color: #555555 !important; font-size: 9px; }

        /* ---- PRINT ---- */
        @media print {
          @page { size: A4; margin: 0; }
          body { visibility: hidden !important; }
          #print-prescription-pad, #print-prescription-pad * { visibility: visible !important; }
          #print-prescription-pad {
            visibility: visible !important;
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important;
            height: 29.7cm !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          .prescription-pad-card {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionPad;
