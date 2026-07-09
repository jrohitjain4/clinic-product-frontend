import React, { useMemo } from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { useMedicines } from "../../../../../core/hooks/useMedicines";

interface PrescriptionPadSlipProps {
  appointment: any;
  prescription: any;
}

const PrescriptionPadSlip: React.FC<PrescriptionPadSlipProps> = ({ appointment, prescription }) => {
  const { medicines: pharmacyMedicines } = useMedicines();

  const getMedicineCategory = (name: string) => {
    const found = pharmacyMedicines.find((m: any) => m.medicineName.toLowerCase() === name.toLowerCase());
    return found?.category?.name || "General Medicine";
  };

  const patient = appointment?.patient || prescription?.patient || {};
  const doctor = appointment?.doctor || prescription?.doctor || {};

  const patientAge = patient.age !== null && patient.age !== undefined
    ? patient.age
    : patient.dob
      ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj.clinic || {};
  } catch (e) { }

  const clinic = appointment?.clinic || prescription?.clinic || loginClinic || {};

  const clinicName = clinic?.name || appointment?.clinicName || prescription?.clinicName || "City Care Clinic";
  const clinicTagline = clinic?.landingPage?.tagline || "Smart Clinic Management";

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
    : "22, Green Park, Near Metro Station, Lucknow, Uttar Pradesh - 226001";

  const clinicPhone = clinic?.phone || "0522-1234567";
  const clinicEmail = clinic?.ownerEmail || clinic?.email || "info@citycareclinic.com";
  const clinicLogo = clinic?.landingPage?.logo || null;

  const apptDate = appointment?.scheduledAt || prescription?.appointment?.scheduledAt || prescription?.createdAt;
  const presDate = prescription?.createdAt || new Date();
  const followUpDate = prescription?.followUpDate || appointment?.followUpDate;

  const doctorFullName = doctor?.fullName || appointment?.doctorName || "Dr. Abhishek Verma";
  const doctorQualification = doctor?.designation?.name || "MBBS, MD (Medicine)";
  const doctorRegNo = doctor?.details?.registrationNumber || "UP-65231";
  const doctorDept = doctor?.department?.name || "General Medicine";

  // Dynamic Prescription ID matching PR-YYMMDD-XXXX
  const prescriptionId = useMemo(() => {
    const dateObj = presDate ? new Date(presDate) : new Date();
    const yymmdd = dayjs(dateObj).format("YYMMDD");
    const lastFour = prescription?.id ? prescription.id.slice(-4).toUpperCase() : "0012";
    return `PR-${yymmdd}-${lastFour}`;
  }, [presDate, prescription]);

  const visitNo = appointment?.visitNumber || prescription?.appointment?.visitNumber || "8";
  const patientIdVal = patient.patientCode || "DOCYOR10234";

  // Parse advice into array
  const adviceList = useMemo(() => {
    const text = prescription?.advice || "";
    return text.split("\n").map((line: string) => line.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  }, [prescription?.advice]);

  return (
    <div className="prescription-pad-card" id="print-prescription-pad">

      {/* ========== HEADER ========== */}
      <div className="pad-header d-flex justify-content-between align-items-center">
        {/* Logo and Name */}
        <div className="d-flex align-items-center gap-3" style={{ maxWidth: '28%' }}>
          {clinicLogo ? (
            <img
              src={resolveMediaUrl(clinicLogo)}
              alt="Clinic Logo"
              style={{ maxHeight: "55px", maxWidth: "160px", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="d-flex align-items-center gap-2">
              <div className="pad-logo-box d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                <span className="fw-bold fs-16">Rx</span>
              </div>
              <div>
                <h2 className="pad-brand-name" style={{ fontSize: '18px' }}>DocYori</h2>
                <p className="pad-brand-sub">{clinicTagline}</p>
              </div>
            </div>
          )}
        </div>

        {/* Clinic Name and Contact */}
        <div className="text-center px-3" style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', flex: 1, margin: '0 20px' }}>
          <h3 className="pad-clinic-name text-primary">{clinicName}</h3>
          <p className="pad-clinic-address text-muted mb-0">{clinicAddress}</p>
          <div className="d-flex align-items-center justify-content-center gap-3 fs-11 mt-1 text-dark fw-semibold">
            <span><i className="ti ti-phone text-primary" /> {clinicPhone}</span>
            <span><i className="ti ti-mail text-primary" /> {clinicEmail}</span>
          </div>
        </div>

        {/* OPD Timings */}
        <div className="pad-timings text-end text-dark fs-10.5">
          <div className="fw-bold text-primary mb-1">
            <i className="ti ti-clock" /> OPD Timings
          </div>
          <div>Mon - Sat: 9:00 AM - 9:00 PM</div>
          <div>Sunday: 10:00 AM - 2:00 PM</div>
          <div className="d-flex align-items-center justify-content-end gap-1.5 mt-1.5 text-primary">
            <i className="ti ti-brand-facebook" />
            <i className="ti ti-brand-instagram" />
            <i className="ti ti-brand-whatsapp" />
          </div>
        </div>
      </div>

      <div className="divider-main" />

      {/* ========== TITLE BADGE & PRESCRIPTION ID ========== */}
      <div className="d-flex align-items-center justify-content-between my-3">
        <div className="rx-pill-badge d-flex align-items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-pill">
          <i className="ti ti-pill" />
          <span className="fw-bold tracking-wider fs-11.5">PRESCRIPTION</span>
        </div>
        <div className="pres-id-tag text-dark fw-bold fs-12">
          Prescription ID : <span className="text-primary">{prescriptionId}</span>
        </div>
      </div>

      {/* ========== THREE-COLUMN DATA GRID ========== */}
      <div className="pad-meta-grid row g-3 p-3 bg-light-subtle border rounded-3 mb-4">
        {/* Patient Details */}
        <div className="col-sm-4 px-2" style={{ borderRight: '1px solid #cbd5e1' }}>
          <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2.5">
            <i className="ti ti-user" /> PATIENT DETAILS
          </h6>
          <table className="pad-table">
            <tbody>
              <tr><td className="pad-lbl">Patient Name</td><td className="pad-val">: {patient.firstName || "Riya"} {patient.lastName || "Sharma"}</td></tr>
              <tr><td className="pad-lbl">Age / Gender</td><td className="pad-val">: {patientAge !== null ? `${patientAge} Y` : "27 Y"} / {patient.gender || "Female"}</td></tr>
              <tr><td className="pad-lbl">Mobile No.</td><td className="pad-val">: {patient.phone || "9876543210"}</td></tr>
              <tr><td className="pad-lbl">Address</td><td className="pad-val">: {patient.address1 || patient.address || "22, Green Park, Lucknow, Uttar Pradesh - 226001"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Doctor Details */}
        <div className="col-sm-4 px-2" style={{ borderRight: '1px solid #cbd5e1' }}>
          <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2.5">
            <i className="ti ti-stethoscope" /> DOCTOR DETAILS
          </h6>
          <table className="pad-table">
            <tbody>
              <tr><td className="pad-lbl">Doctor Name</td><td className="pad-val">: {doctorFullName}</td></tr>
              <tr><td className="pad-lbl">Qualification</td><td className="pad-val">: {doctorQualification}</td></tr>
              <tr><td className="pad-lbl">Reg. No.</td><td className="pad-val">: {doctorRegNo}</td></tr>
              <tr><td className="pad-lbl">Department</td><td className="pad-val">: {doctorDept}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Visit Details */}
        <div className="col-sm-4 px-2">
          <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2.5">
            <i className="ti ti-calendar" /> VISIT DETAILS
          </h6>
          <table className="pad-table">
            <tbody>
              <tr><td className="pad-lbl">Visit No.</td><td className="pad-val">: {visitNo}</td></tr>
              <tr><td className="pad-lbl">Visit Date &amp; Time</td><td className="pad-val">: {apptDate ? dayjs(apptDate).format("DD MMM YYYY, hh:mm A") : "08 Jul 2026, 10:30 AM"}</td></tr>
              <tr><td className="pad-lbl">Patient ID</td><td className="pad-val">: {patientIdVal}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== MEDICINES TABLE ========== */}
      <div className="medicines-section-wrapper mb-4">
        <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2">
          <i className="ti ti-pill" /> MEDICINES
        </h6>
        <div className="table-responsive border rounded-3">
          <table className="table table-bordered mb-0 align-middle">
            <thead className="table-primary-header">
              <tr className="text-white text-center fw-bold fs-11 uppercase">
                <th style={{ width: '50px', padding: '10px 5px' }}>S.No.</th>
                <th className="text-start" style={{ padding: '10px 10px' }}>Medicine Name (Category)</th>
                <th style={{ width: '100px', padding: '10px 5px' }}>Strength</th>
                <th style={{ width: '100px', padding: '10px 5px' }}>Dose</th>
                <th style={{ width: '90px', padding: '10px 5px' }}>Frequency</th>
                <th style={{ width: '95px', padding: '10px 5px' }}>Duration</th>
                <th style={{ width: '140px', padding: '10px 5px' }}>Before / After Food</th>
              </tr>
            </thead>
            <tbody>
              {prescription?.medicines && prescription.medicines.length > 0 ? (
                prescription.medicines.map((med: any, idx: number) => (
                  <tr key={med.id || idx} className="text-center text-dark fw-semibold fs-11.5">
                    <td className="text-muted">{idx + 1}</td>
                    <td className="text-start text-dark fw-bold" style={{ paddingLeft: '10px' }}>
                      {med.medicineName}
                      <small className="d-block text-muted fw-normal" style={{ fontSize: '9.5px', marginTop: '1.5px' }}>
                        ({getMedicineCategory(med.medicineName)})
                      </small>
                    </td>
                    <td>{med.strength || "—"}</td>
                    <td>{med.dosage || "1 Tablet"}</td>
                    <td>{med.frequency || "1-0-1"}</td>
                    <td>{med.duration || "5 Days"}</td>
                    <td>{med.timings || "After Food"}</td>
                  </tr>
                ))
              ) : (
                // Mock elements showing in screenshot if prescription has no medicines
                <>
                  <tr className="text-center text-dark fw-semibold fs-11.5">
                    <td className="text-muted">1</td>
                    <td className="text-start text-dark fw-bold" style={{ paddingLeft: '10px' }}>
                      Azithral 500
                      <small className="d-block text-muted fw-normal" style={{ fontSize: '9.5px', marginTop: '1.5px' }}>
                        (Antibiotic)
                      </small>
                    </td>
                    <td>500 mg</td>
                    <td>1 Tablet</td>
                    <td>1-0-1</td>
                    <td>5 Days</td>
                    <td>After Food</td>
                  </tr>
                  <tr className="text-center text-dark fw-semibold fs-11.5">
                    <td className="text-muted">2</td>
                    <td className="text-start text-dark fw-bold" style={{ paddingLeft: '10px' }}>
                      Dolo 650
                      <small className="d-block text-muted fw-normal" style={{ fontSize: '9.5px', marginTop: '1.5px' }}>
                        (Analgesic / Antipyretic)
                      </small>
                    </td>
                    <td>650 mg</td>
                    <td>1 Tablet</td>
                    <td>1-1-1</td>
                    <td>3 Days</td>
                    <td>After Food</td>
                  </tr>
                  <tr className="text-center text-dark fw-semibold fs-11.5">
                    <td className="text-muted">3</td>
                    <td className="text-start text-dark fw-bold" style={{ paddingLeft: '10px' }}>
                      Pantocid 40
                      <small className="d-block text-muted fw-normal" style={{ fontSize: '9.5px', marginTop: '1.5px' }}>
                        (Antacid)
                      </small>
                    </td>
                    <td>40 mg</td>
                    <td>1 Tablet</td>
                    <td>0-0-1</td>
                    <td>5 Days</td>
                    <td>Before Food</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        <div className="note-alert-box d-flex align-items-center gap-2 mt-2 px-3 py-2 bg-light rounded-3 text-secondary-emphasis fs-10.5 border">
          <i className="ti ti-pill text-primary fs-14" />
          <span><strong>Note :</strong> Take medicines as advised by the doctor. Do not self medicate.</span>
        </div>
      </div>

      {/* ========== ADVICE & FOLLOW-UP SIDE BY SIDE ========== */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '0' }}>
        {/* Advice Card */}
        <div style={{ flex: 1 }}>
          <div className="card h-100 border bg-white rounded-3 shadow-none position-relative overflow-hidden" style={{ minHeight: '130px', borderLeft: '3px solid #4f46e5', padding: '14px 16px' }}>
            {/* Watermark outline icon */}
            <div className="advice-card-watermark">
              <i className="ti ti-plus" />
            </div>

            <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2.5">
              <i className="ti ti-notes" /> ADVICE
            </h6>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {adviceList.length > 0 ? (
                adviceList.map((item: string, idx: number) => (
                  <div key={idx} className="d-flex align-items-start gap-2 mb-1.5" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                    <span style={{ color: '#4f46e5', fontSize: '8px', marginTop: '4px' }}>●</span>
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <>
                  {["Drink plenty of water.", "Take medicines as directed.", "Complete the full course.", "Avoid cold food and oily items.", "Get adequate rest and sleep."].map((item, idx) => (
                    <div key={idx} className="d-flex align-items-start gap-2 mb-1.5" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
                      <span style={{ color: '#4f46e5', fontSize: '8px', marginTop: '4px' }}>●</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Follow-up Card */}
        <div style={{ flex: 1 }}>
          <div className="card h-100 border bg-white rounded-3 shadow-none" style={{ minHeight: '130px', borderLeft: '3px solid #4f46e5', padding: '14px 16px' }}>
            <h6 className="pad-section-title d-flex align-items-center gap-1.5 mb-2.5">
              <i className="ti ti-calendar" /> NEXT FOLLOW-UP
            </h6>

            {/* Follow-up Date */}
            <div className="d-flex align-items-start gap-2 mb-2" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
              <span style={{ color: '#4f46e5', fontSize: '8px', marginTop: '4px' }}>●</span>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Follow-up Date:</span>
                <div className="follow-date-badge d-inline-flex align-items-center gap-2 px-2.5 py-1 border rounded-2 bg-light text-dark fw-bold fs-11 ms-2">
                  <i className="ti ti-calendar text-primary" style={{ fontSize: '12px' }} />
                  {followUpDate ? dayjs(followUpDate).format("DD MMM YYYY") : "16 Jul 2026"}
                </div>
              </div>
            </div>

            {/* Follow-up Remarks */}
            <div className="d-flex align-items-start gap-2 mb-1.5" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
              <span style={{ color: '#4f46e5', fontSize: '8px', marginTop: '4px' }}>●</span>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Remarks:</span>{' '}
                <span>{prescription?.followUpNotes || "Review after 1 week or earlier if symptoms worsen."}</span>
              </div>
            </div>

            {/* Visit Number */}
            <div className="d-flex align-items-start gap-2 mb-1.5" style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>
              <span style={{ color: '#4f46e5', fontSize: '8px', marginTop: '4px' }}>●</span>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Visit No:</span>{' '}
                <span>{visitNo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '2px solid #4f46e5', textAlign: 'center', fontSize: '9px', color: '#64748b', fontWeight: 600 }}>
        <i className="ti ti-info-circle" style={{ color: '#4f46e5', fontSize: '11px', marginRight: '4px' }} />
        This prescription is generated electronically and does not require a physical signature. For any queries, contact the clinic.
      </div>

      {/* ========== STYLES ========== */}
      <style>{`
        .prescription-pad-card {
          width: 21cm;
          height: 29.7cm;
          max-height: 29.7cm;
          box-sizing: border-box;
          padding: 0.8cm 1cm;
          display: flex;
          flex-direction: column;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden !important;
          border: 1px solid #e2e8f0;
        }
        .prescription-pad-card * {
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }
        .prescription-pad-card td,
        .prescription-pad-card th,
        .prescription-pad-card h2,
        .prescription-pad-card h3,
        .prescription-pad-card h5,
        .prescription-pad-card h6,
        .prescription-pad-card p,
        .prescription-pad-card small {
          color: #000000;
        }

        /* ---- HEADER ---- */
        .pad-logo-box {
          width: 44px;
          height: 44px;
          background-color: #4f46e5 !important;
        }
        .pad-brand-name {
          font-size: 24px;
          font-weight: 900 !important;
          color: #4f46e5 !important;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }
        .pad-brand-sub {
          font-size: 10px;
          font-weight: 700 !important;
          color: #64748b !important;
          margin: 0;
        }
        .pad-clinic-name {
          font-size: 18px;
          font-weight: 800 !important;
          color: #4f46e5 !important;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }
        .pad-clinic-address {
          font-size: 10px;
          font-weight: 600 !important;
          color: #64748b !important;
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.35;
        }

        /* ---- DIVIDERS ---- */
        .divider-main {
          height: 2px;
          background-color: #4f46e5 !important;
          margin: 12px 0;
          flex-shrink: 0;
        }

        /* ---- BADGES ---- */
        .rx-pill-badge {
          background-color: #4f46e5 !important;
          border: 1px solid #4f46e5 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .rx-pill-badge span {
          color: #ffffff !important;
          letter-spacing: 0.8px;
        }
        .rx-pill-badge i {
          color: #ffffff !important;
        }
        .pres-id-tag span {
          color: #4f46e5 !important;
        }

        /* ---- THREE COLUMN GRID ---- */
        .pad-section-title {
          font-size: 11px;
          font-weight: 800 !important;
          color: #4f46e5 !important;
          letter-spacing: 0.5px;
        }
        .pad-section-title i {
          color: #4f46e5 !important;
        }
        table.pad-table {
          font-size: 10px;
          line-height: 1.45;
          border-collapse: collapse;
          width: 100%;
        }
        table.pad-table td {
          padding: 2.5px 0 !important;
          vertical-align: top;
        }
        table.pad-table .pad-lbl {
          font-weight: 600 !important;
          color: #475569 !important;
          width: 90px;
          white-space: nowrap;
        }
        table.pad-table .pad-val {
          color: #0f172a !important;
          font-weight: 700 !important;
          padding-left: 4px;
        }

        /* ---- MEDICINES TABLE ---- */
        .table-primary-header {
          background-color: #4f46e5 !important;
        }
        .table-primary-header th {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          border-color: #4f46e5 !important;
        }
        .note-alert-box i {
          color: #4f46e5 !important;
        }
        .note-alert-box span {
          color: #334155 !important;
        }

        /* ---- CARDS ---- */
        .advice-card-watermark {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.06;
          z-index: 0;
          pointer-events: none;
        }
        .advice-card-watermark i {
          font-size: 120px !important;
          color: #4f46e5 !important;
        }
        .advice-bullets li {
          color: #1e293b !important;
        }
        .follow-date-badge {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        .follow-date-badge i {
          color: #4f46e5 !important;
        }
        .text-primary-stamp {
          color: #4f46e5 !important;
        }

        /* ---- FOOTER ---- */
        .pad-signature-qr-row i {
          color: #4f46e5 !important;
        }
        .sig-divider-line {
          border-top: 1px solid #cbd5e1 !important;
        }
        .bottom-disclaimer-box i {
          color: #4f46e5 !important;
        }
        .bottom-disclaimer-box {
          color: #64748b !important;
        }

        /* ---- PRINT ---- */
        @media print {
          @page { size: A4; margin: 0; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { visibility: hidden !important; }
          #print-prescription-pad, #print-prescription-pad * { visibility: visible !important; }
          #print-prescription-pad {
            visibility: visible !important;
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important;
            height: 29.7cm !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 0.8cm 1cm !important;
            margin: 0 !important;
            overflow: hidden !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};



export default PrescriptionPadSlip;
