import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { useMedicines } from "../../../../../core/hooks/useMedicines";

interface PrescriptionPadSlipProps {
  appointment: any;
  prescription: any;
  suggestIPD?: boolean;
}

const isValidClinicLogo = (src?: string | null) => {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower === "/logo.png" || lower === "logo.png" || lower.endsWith("/logo.png")) return false;
  if (lower.includes("placeholder") || lower.includes("300x300")) return false;
  return true;
};

const PrescriptionPadSlip: React.FC<PrescriptionPadSlipProps> = ({
  appointment,
  prescription,
  suggestIPD,
}) => {
  const { medicines: pharmacyMedicines } = useMedicines();

  const getMedicineCategory = (name: string) => {
    if (!name) return "General Medicine";
    const found = pharmacyMedicines.find(
      (m: any) => m.medicineName?.toLowerCase() === name.toLowerCase()
    );
    return found?.category?.name || "General Medicine";
  };

  const patient = appointment?.patient || prescription?.patient || {};
  const doctor = appointment?.doctor || prescription?.doctor || {};

  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj.clinic || {};
  } catch {
    /* ignore */
  }

  const clinic = {
    ...loginClinic,
    ...(appointment?.clinic || {}),
    ...(prescription?.clinic || {}),
    landingPage: {
      ...(loginClinic?.landingPage || {}),
      ...(appointment?.clinic?.landingPage || {}),
      ...(prescription?.clinic?.landingPage || {}),
    },
  };

  const rawLogoCandidate =
    clinic.landingPage?.logo ||
    loginClinic?.landingPage?.logo ||
    clinic.clinicLogo ||
    loginClinic?.clinicLogo ||
    "";
  const clinicLogoUrl = isValidClinicLogo(rawLogoCandidate)
    ? resolveMediaUrl(rawLogoCandidate)
    : "";
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [clinicLogoUrl]);

  const clinicName = clinic?.name || appointment?.clinicName || prescription?.clinicName || "Clinic";
  const clinicTagline =
    clinic?.landingPage?.tagline || loginClinic?.landingPage?.tagline || "Better Care, Every Time";
  const clinicInitial = (clinicName?.trim()?.[0] || "C").toUpperCase();
  const showClinicLogo = Boolean(clinicLogoUrl) && !logoFailed;

  const clinicAddress = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.country,
    clinic.pincode ? `- ${clinic.pincode}` : "",
  ]
    .filter((p) => p && String(p).trim() !== "")
    .join(", ");

  const clinicPhone = clinic?.phone || clinic?.landingPage?.whatsapp || "";
  const clinicEmail =
    clinic?.landingPage?.email || clinic?.ownerEmail || clinic?.email || "";
  const clinicWebsite = clinic.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${clinic.username}`
    : clinic.website || clinic.landingPage?.website || "";

  const patientName =
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
    appointment?.patientName ||
    "—";
  const patientInitial = (patient.firstName?.[0] || patientName?.[0] || "P").toUpperCase();
  const patientIdVal =
    patient.patientCode ||
    patient.code ||
    patient.patientId ||
    appointment?.patient?.patientCode ||
    prescription?.patient?.patientCode ||
    (patient.id ? String(patient.id).slice(0, 8).toUpperCase() : "—");
  const patientPhone = patient.phone || "—";
  const patientGender = patient.gender || "—";
  const patientAddress =
    [patient.address1, patient.address2, patient.city, patient.state, patient.country, patient.pincode]
      .filter((p) => p && String(p).trim() !== "")
      .join(", ") ||
    patient.address ||
    "—";

  const computedAge =
    patient.age !== null && patient.age !== undefined && Number(patient.age) > 0
      ? Number(patient.age)
      : patient.dob
        ? dayjs().diff(patient.dob, "year")
        : null;
  const patientAgeDisplay =
    computedAge !== null && !Number.isNaN(computedAge) ? `${computedAge} Yrs` : "—";

  const apptDate =
    appointment?.scheduledAt ||
    prescription?.appointment?.scheduledAt ||
    prescription?.createdAt;
  const presDate = prescription?.createdAt || new Date();
  const followUpDate = prescription?.followUpDate || appointment?.followUpDate;

  const doctorFullName = doctor?.fullName || appointment?.doctorName || "—";
  const doctorDisplay = doctorFullName.startsWith("Dr.")
    ? doctorFullName
    : doctorFullName !== "—"
      ? `Dr. ${doctorFullName}`
      : "—";
  const doctorQualification =
    doctor?.designation?.name || doctor?.qualification || "";
  const doctorRegNo =
    doctor?.details?.registrationNumber ||
    doctor?.registrationNumber ||
    doctor?.medicalLicenseNumber ||
    "—";
  const doctorDept =
    doctor?.department?.name ||
    appointment?.department?.name ||
    prescription?.department?.name ||
    "General";
  const doctorCreds = [doctorQualification, doctorDept].filter(Boolean).join(" - ") || doctorDept;
  const doctorPhone = doctor?.phone || "—";
  const doctorEmail = doctor?.email || "—";
  const doctorExp = doctor?.yearOfExperience
    ? `${doctor.yearOfExperience}+ Years`
    : "—";
  const doctorHasPhoto =
    doctor?.profileImage &&
    !String(doctor.profileImage).includes("placeholder") &&
    !String(doctor.profileImage).includes("300x300");
  const doctorPhotoSrc = doctorHasPhoto
    ? resolveMediaUrl(doctor.profileImage)
    : "/assets/img/doctor-placeholder.png";
  const [docPhotoFailed, setDocPhotoFailed] = useState(false);
  useEffect(() => {
    setDocPhotoFailed(false);
  }, [doctorPhotoSrc]);
  const doctorAvatarSrc = docPhotoFailed
    ? "/assets/img/doctor-placeholder.png"
    : doctorPhotoSrc;
  const rawSignature =
    doctor?.signatureImage ||
    doctor?.details?.signatureImage ||
    prescription?.doctor?.signatureImage ||
    "";
  const doctorSignatureUrl =
    rawSignature &&
    typeof rawSignature === "string" &&
    rawSignature.trim() &&
    !rawSignature.toLowerCase().includes("placeholder")
      ? resolveMediaUrl(rawSignature)
      : "";
  const [sigFailed, setSigFailed] = useState(false);
  useEffect(() => {
    setSigFailed(false);
  }, [doctorSignatureUrl]);
  const showDoctorSignature = Boolean(doctorSignatureUrl) && !sigFailed;
  const doctorFee =
    appointment?.amount != null
      ? `₹${appointment.amount}`
      : doctor?.consultationCharge != null
        ? `₹${doctor.consultationCharge}`
        : "—";

  const prescriptionId = useMemo(() => {
    if (prescription?.prescriptionCode) return prescription.prescriptionCode;
    const dateObj = presDate ? new Date(presDate) : new Date();
    const yymmdd = dayjs(dateObj).format("YYMMDD");
    const lastFour = prescription?.id
      ? String(prescription.id).slice(-4).toUpperCase()
      : "0000";
    return `PR-${yymmdd}-${lastFour}`;
  }, [presDate, prescription]);

  const visitNo =
    appointment?.visitNumber ||
    appointment?.appointmentCode ||
    appointment?.bookingCode ||
    prescription?.appointment?.visitNumber ||
    "—";
  const visitType =
    appointment?.appointmentType ||
    (appointment?.isFollowUp ? "Follow-up" : "Offline Consultation");
  const rawMode = appointment?.mode || "In-person";
  const visitMode =
    /clinic|offline|in[- ]?person|physical/i.test(String(rawMode))
      ? "In-person"
      : String(rawMode);
  const duration = `${doctor?.appointmentDuration || 30} Mins`;
  const paymentStatus = appointment?.paymentStatus || "Unpaid";
  const isPaid =
    String(paymentStatus).toLowerCase().includes("paid") &&
    !String(paymentStatus).toLowerCase().includes("unpaid");

  const adviceList = useMemo(() => {
    const text = prescription?.advice || "";
    return text
      .split("\n")
      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  }, [prescription?.advice]);

  const diagnosticTestsList = useMemo(() => {
    const list = prescription?.diagnosticTests;
    if (Array.isArray(list)) return list.filter(Boolean);
    if (typeof list === "string") {
      try {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        return list.trim() ? [list] : [];
      }
    }
    return [];
  }, [prescription?.diagnosticTests]);

  const medicines = useMemo(() => {
    const list = prescription?.medicines;
    if (!Array.isArray(list)) return [];
    return list.filter((m: any) => m?.medicineName && String(m.medicineName).trim() !== "");
  }, [prescription?.medicines]);

  const additionalNotes =
    prescription?.additionalInstructions ||
    prescription?.clinicalNotes ||
    "";
  const additionalLines = useMemo(() => {
    if (!additionalNotes) return [];
    return String(additionalNotes)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }, [additionalNotes]);

  const kv = (label: string, value: React.ReactNode) => (
    <div className="rx-kv">
      <span className="rx-kv-label">{label}</span>
      <span className="rx-kv-colon">:</span>
      <span className="rx-kv-value">{value}</span>
              </div>
  );

  return (
    <div className="rx-slip">
      <div className="rx-slip-body">
        {/* Title — no DocYori logo / QR */}
        <div className="rx-title-bar">
          <div className="rx-title-ornament" aria-hidden>
            <span className="rx-title-line" />
            <i className="ti ti-heartbeat" />
              </div>
          <h1>PRESCRIPTION</h1>
          <div className="rx-title-ornament" aria-hidden>
            <i className="ti ti-heartbeat" />
            <span className="rx-title-line" />
            </div>
        </div>
        <div className="rx-tagline-wrap">
          <span className="rx-tagline-badge">✧ Better Care, Every Time ✧</span>
        </div>

        {/* Patient | Visit | Prescription */}
        <div className="rx-meta-grid">
          <div className="rx-col rx-col-patient">
            <div className="rx-patient-row">
              <div className="rx-patient-avatar" aria-hidden>
                {patientInitial}
          </div>
              <div className="rx-patient-fields">
                <div className="rx-col-head">
                  <i className="ti ti-user-heart" /> PATIENT DETAILS
        </div>
                {kv("Patient ID", patientIdVal)}
                {kv("Name", patientName)}
                {kv("Age / Gender", `${patientAgeDisplay} / ${patientGender}`)}
                {kv("Phone", patientPhone)}
                {kv("Address", patientAddress)}
          </div>
          </div>
        </div>

          <div className="rx-col">
            <div className="rx-col-head">
              <i className="ti ti-calendar" /> VISIT DETAILS
            </div>
            {kv("Visit ID", visitNo)}
            {kv("Visit Date", apptDate ? dayjs(apptDate).format("DD MMM, YYYY") : "—")}
            {kv("Visit Time", apptDate ? dayjs(apptDate).format("hh:mm A") : "—")}
            {kv("Visit Type", visitType)}
            {kv("Department", doctorDept)}
            {kv("Consulting Mode", visitMode)}
            {kv("Duration", duration)}
      </div>

          <div className="rx-col">
            <div className="rx-col-head">
              <i className="ti ti-prescription" /> PRESCRIPTION DETAILS
        </div>
            {kv("Prescription No", prescriptionId)}
            {kv(
              "Date & Time",
              dayjs(presDate).format("DD MMM, YYYY / hh:mm A")
            )}
            {kv(
              "Follow-up Date",
              followUpDate ? dayjs(followUpDate).format("DD MMM, YYYY") : "—"
            )}
            {kv(
              "Payment Status",
              <span className={`rx-pay-pill ${isPaid ? "rx-pay-paid" : "rx-pay-unpaid"}`}>
                {paymentStatus}
              </span>
            )}
            {kv("Consultation Fee", doctorFee)}
        </div>
      </div>

        {/* Doctor + Clinic + Medicines — one unified block */}
        <div className="rx-rx-block">
          <div className="rx-doctor-clinic">
            <div className="rx-dc-doctor">
              <div className="rx-dc-avatar-wrap">
                <img
                  src={doctorAvatarSrc}
                  alt={doctorDisplay}
                  className="rx-doc-photo"
                  crossOrigin="anonymous"
                  onError={() => setDocPhotoFailed(true)}
                />
              </div>
              <div className="rx-dc-doctor-info">
                <div className="rx-prescribed-label">PRESCRIBED BY</div>
                <div className="rx-doctor-name">
                  {doctorDisplay}
                  <i className="ti ti-rosette-discount-check rx-verified" />
                </div>
                <div className="rx-doctor-creds">
                  {[doctorQualification, doctorDept].filter(Boolean).join(" - ") || doctorCreds}
                </div>
                <span className="rx-dept-pill">{doctorDept}</span>
              </div>
        </div>

            <div className="rx-dc-meta">
              <div className="rx-doc-meta-row">
                <span className="rx-doc-meta-icon"><i className="ti ti-briefcase" /></span>
                <span className="rx-doc-meta-label">Experience</span>
                <span className="rx-doc-meta-colon">:</span>
                <span className="rx-doc-meta-value">{doctorExp}</span>
              </div>
              <div className="rx-doc-meta-row">
                <span className="rx-doc-meta-icon"><i className="ti ti-id" /></span>
                <span className="rx-doc-meta-label">Registration No</span>
                <span className="rx-doc-meta-colon">:</span>
                <span className="rx-doc-meta-value">{doctorRegNo}</span>
              </div>
              <div className="rx-doc-meta-row">
                <span className="rx-doc-meta-icon"><i className="ti ti-phone" /></span>
                <span className="rx-doc-meta-label">Phone</span>
                <span className="rx-doc-meta-colon">:</span>
                <span className="rx-doc-meta-value">{doctorPhone}</span>
              </div>
              <div className="rx-doc-meta-row">
                <span className="rx-doc-meta-icon"><i className="ti ti-mail" /></span>
                <span className="rx-doc-meta-label">Email</span>
                <span className="rx-doc-meta-colon">:</span>
                <span className="rx-doc-meta-value">{doctorEmail}</span>
              </div>
        </div>

            <div className="rx-dc-clinic">
              <div className="rx-clinic-brand">
                {showClinicLogo ? (
                  <img
                    src={clinicLogoUrl}
                    alt={clinicName}
                    className="rx-clinic-logo"
                    crossOrigin="anonymous"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="rx-clinic-logo-fallback" aria-hidden>
                    {clinicInitial}
                  </div>
                )}
                <div>
                  <div className="rx-clinic-name">{clinicName}</div>
                  <div className="rx-clinic-tagline">{clinicTagline}</div>
                </div>
              </div>
              {clinicAddress && (
                <div className="rx-clinic-line">
                  <i className="ti ti-map-pin" />
                  <span>{clinicAddress}</span>
                </div>
              )}
              {clinicPhone && (
                <div className="rx-clinic-line">
                  <i className="ti ti-phone" />
                  <span>{clinicPhone}</span>
                </div>
              )}
        </div>
      </div>

          <div className="rx-meds">
            <div className="rx-section-title">
              <i className="ti ti-prescription rx-rx-icon" />
              <span>MEDICINES</span>
            </div>
            <table className="rx-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th className="rx-th-left">Medicine / Composition</th>
                  <th style={{ width: 88 }}>Dose / Strength</th>
                  <th style={{ width: 78 }}>Frequency</th>
                  <th style={{ width: 72 }}>Duration</th>
                  <th style={{ width: 88 }}>When to Take</th>
                  <th style={{ width: 120 }}>Instructions</th>
              </tr>
            </thead>
            <tbody>
                {medicines.length > 0 ? (
                  medicines.map((med: any, idx: number) => {
                    const composition =
                      med.composition ||
                      med.strength ||
                      med.category ||
                      getMedicineCategory(med.medicineName);
                    const doseStrength =
                      [med.strength, med.dosage].filter(Boolean).join(" · ") || "—";
                    return (
                      <tr key={med.id || idx}>
                        <td className="rx-td-center">{idx + 1}</td>
                        <td>
                          <div className="rx-med-name">{med.medicineName}</div>
                          <div className="rx-med-comp">({composition})</div>
                    </td>
                        <td className="rx-td-center">{doseStrength}</td>
                        <td className="rx-td-center">{med.frequency || "—"}</td>
                        <td className="rx-td-center">{med.duration || "—"}</td>
                        <td className="rx-td-center">{med.timings || "—"}</td>
                        <td>
                          {med.instructions || med.notes || "As directed"}
                        </td>
                  </tr>
                    );
                  })
              ) : (
                <tr>
                    <td colSpan={7} className="rx-td-empty">
                      No medicines prescribed
                    </td>
                </tr>
              )}
            </tbody>
          </table>
            <div className="rx-note">
              <i className="ti ti-info-circle" />
              <span>
                <strong>Note:</strong> Take medicines as advised by the doctor. Do not self medicate.
              </span>
        </div>
        </div>
      </div>

        {/* Advice | Diagnostics | Follow-up — 3 separate cards */}
        <div className="rx-cards-row">
          <div className="rx-card">
            <div className="rx-card-head">
              <i className="ti ti-message-dots" />
              <span>ADVICE</span>
            </div>
              {adviceList.length > 0 ? (
              <ul className="rx-card-bullets">
                {adviceList.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="rx-card-muted">No advice recorded</div>
            )}
        </div>

          <div className="rx-card">
            <div className="rx-card-head">
              <i className="ti ti-flask" />
              <span>DIAGNOSTIC TESTS</span>
                  </div>
            {diagnosticTestsList.length > 0 ? (
              <ul className="rx-card-bullets">
                {diagnosticTestsList.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="rx-diag-empty">
                <p>No diagnostic tests recommended at this visit.</p>
                <div className="rx-diag-watermark" aria-hidden>
                  <i className="ti ti-clipboard-check" />
            </div>
          </div>
            )}
        </div>

          <div className="rx-card">
            <div className="rx-card-head">
              <i className="ti ti-calendar-time" />
              <span>NEXT FOLLOW-UP</span>
                </div>
            <div className="rx-fu-row">
              <span className="rx-fu-label">Date</span>
              <span className="rx-fu-colon">:</span>
              <span className="rx-fu-value">
                {followUpDate ? dayjs(followUpDate).format("DD MMM, YYYY") : "—"}
              </span>
              </div>
            <div className="rx-fu-row">
              <span className="rx-fu-label">Time</span>
              <span className="rx-fu-colon">:</span>
              <span className="rx-fu-value">
                {followUpDate &&
                (dayjs(followUpDate).hour() !== 0 || dayjs(followUpDate).minute() !== 0)
                  ? dayjs(followUpDate).format("hh:mm A")
                  : "—"}
              </span>
            </div>
            <div className="rx-fu-row">
              <span className="rx-fu-label">Purpose</span>
              <span className="rx-fu-colon">:</span>
              <span className="rx-fu-value">
                {followUpDate || prescription?.followUpNotes
                  ? "Follow-up Consultation"
                  : "—"}
                {prescription?.followUpNotes ? (
                  <span className="rx-fu-sub">{prescription.followUpNotes}</span>
                ) : null}
              </span>
            </div>
              </div>
            </div>

        {(suggestIPD || patient.suggestIPD) && (
          <div className="rx-ipd">
            <i className="ti ti-bed" />
            ADMIT RECOMMENDATION: Recommended for IPD Admission
              </div>
        )}

        {/* Additional + Signature */}
        <div className="rx-bottom-row">
          <div className="rx-additional-card">
            <div className="rx-card-head">
              <i className="ti ti-pencil" />
              <span>ADDITIONAL INSTRUCTIONS</span>
            </div>
            {additionalLines.length > 0 ? (
              <div className="rx-additional-body">
                {additionalLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
          </div>
            ) : (
              <p className="rx-additional-empty">—</p>
            )}
          </div>

          <div className="rx-signature">
            <div className="rx-sig-space">
              {showDoctorSignature ? (
                <img
                  src={doctorSignatureUrl}
                  alt="Doctor signature"
                  className="rx-sig-img"
                  crossOrigin="anonymous"
                  onError={() => setSigFailed(true)}
                />
              ) : null}
            </div>
            <div className="rx-sig-line" />
            <div className="rx-sig-name">{doctorDisplay}</div>
            {doctorQualification || doctorDept ? (
              <div className="rx-sig-meta">
                {[doctorQualification, doctorDept].filter(Boolean).join(" - ")}
              </div>
            ) : null}
            {doctorRegNo !== "—" ? (
              <div className="rx-sig-meta">Reg. No. {doctorRegNo}</div>
            ) : null}
        </div>
      </div>

        <div className="rx-thanks">
          <span className="rx-thanks-line" />
          <span className="rx-thanks-text">
            <i className="ti ti-heart" />
            Thank you for trusting {clinicName}. We wish you a speedy recovery!
            <i className="ti ti-heart" />
          </span>
          <span className="rx-thanks-line" />
        </div>
      </div>

      <div className="rx-footer">
        <div className="rx-footer-item">
          <span className="rx-footer-icon"><i className="ti ti-phone" /></span>
          <span>{clinicPhone || "—"}</span>
        </div>
        <span className="rx-footer-sep" />
        <div className="rx-footer-item">
          <span className="rx-footer-icon"><i className="ti ti-mail" /></span>
          <span>{clinicEmail || "—"}</span>
        </div>
        <span className="rx-footer-sep" />
        <div className="rx-footer-item">
          <span className="rx-footer-icon"><i className="ti ti-world" /></span>
          <span>{clinicWebsite || "—"}</span>
        </div>
        <span className="rx-footer-sep" />
        <div className="rx-footer-item rx-footer-addr">
          <span className="rx-footer-icon"><i className="ti ti-map-pin" /></span>
          <span>{clinicAddress || "—"}</span>
        </div>
      </div>

      <style>{`
        .rx-slip {
          width: 210mm;
          max-height: 297mm;
          height: auto;
          box-sizing: border-box;
          background: #fff !important;
          color: #0f172a;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          display: flex;
          flex-direction: column;
          border: 1px solid #d8dbe3;
          overflow: hidden;
          page-break-after: avoid;
          page-break-inside: avoid;
          break-after: avoid;
          break-inside: avoid;
        }
        .rx-slip * { box-sizing: border-box; }
        .rx-slip-body {
          flex: 1;
          padding: 6mm 7mm 4mm;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .rx-title-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .rx-title-bar h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #5b4fcf !important;
        }
        .rx-title-ornament {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #5b4fcf;
          flex: 1;
          max-width: 120px;
        }
        .rx-title-ornament:first-child { justify-content: flex-end; }
        .rx-title-ornament:last-child { justify-content: flex-start; }
        .rx-title-line {
          flex: 1;
          height: 2px;
          background: #5b4fcf;
          border-radius: 2px;
        }
        .rx-tagline-wrap { text-align: center; margin-top: -2px; }
        .rx-tagline-badge {
          display: inline-block;
          background: #ebe8ff !important;
          color: #5b4fcf !important;
          font-size: 10px;
          font-weight: 500;
          padding: 3px 14px;
          border-radius: 999px;
        }

        .rx-meta-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr 1fr;
          border: 1px solid #d8dbe3;
          border-radius: 8px;
          overflow: hidden;
          background: #fff !important;
        }
        .rx-col {
          padding: 12px 14px;
          position: relative;
          background: #fff !important;
        }
        .rx-col:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 14px;
          bottom: 14px;
          width: 1px;
          background: #d8dbe3;
        }
        .rx-col-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.35px;
          color: #5A58D1 !important;
          margin-bottom: 10px;
        }
        .rx-col-head i {
          font-size: 15px;
          color: #5A58D1 !important;
        }

        .rx-meta-grid .rx-kv {
          display: grid;
          grid-template-columns: 78px 8px 1fr;
          align-items: start;
          column-gap: 0;
          font-size: 10.5px;
          line-height: 1.45;
          margin-bottom: 5px;
        }
        .rx-meta-grid .rx-col:nth-child(2) .rx-kv {
          grid-template-columns: 102px 8px 1fr;
        }
        .rx-meta-grid .rx-col:nth-child(3) .rx-kv {
          grid-template-columns: 108px 8px 1fr;
        }
        .rx-meta-grid .rx-kv-label {
          color: #1f1f1f !important;
          font-weight: 500;
          white-space: nowrap;
        }
        .rx-meta-grid .rx-kv-colon {
          color: #1f1f1f !important;
          font-weight: 500;
          text-align: left;
        }
        .rx-meta-grid .rx-kv-value {
          color: #111827 !important;
          font-weight: 600;
          word-break: break-word;
          padding-left: 2px;
        }

        .rx-kv {
          display: grid;
          grid-template-columns: max-content 10px 1fr;
          align-items: start;
          font-size: 10px;
          line-height: 1.35;
          margin-bottom: 3px;
        }
        .rx-kv-label { color: #334155 !important; font-weight: 600; white-space: nowrap; }
        .rx-kv-colon { color: #334155 !important; font-weight: 500; text-align: center; }
        .rx-kv-value { color: #0f172a !important; font-weight: 500; word-break: break-word; padding-left: 4px; }

        .rx-patient-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .rx-patient-fields { flex: 1; min-width: 0; }
        .rx-patient-avatar {
          width: 58px;
          height: 58px;
          min-width: 58px;
          border-radius: 50%;
          overflow: hidden;
          margin-top: 22px;
          flex-shrink: 0;
          background: #E8E7FF !important;
          color: #5A58D1 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
          line-height: 1;
        }
        .rx-rx-block {
          border: 1px solid #d8dbe3;
          border-radius: 10px;
          background: #fff !important;
          overflow: hidden;
        }
        .rx-doctor-clinic {
          display: grid;
          grid-template-columns: 1.35fr 1.1fr 1fr;
          gap: 0;
          border: none;
          border-radius: 0;
          background: #fff !important;
          overflow: visible;
          border-bottom: 1px solid #e8eaf0;
        }
        .rx-dc-doctor,
        .rx-dc-meta,
        .rx-dc-clinic {
          padding: 12px 14px;
          position: relative;
        }
        .rx-dc-doctor:not(:last-child)::after,
        .rx-dc-meta:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 14px;
          bottom: 14px;
          width: 1px;
          background: #e2e5ee;
        }
        .rx-dc-doctor {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .rx-dc-avatar-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          align-self: stretch;
          padding: 2px 0;
        }
        .rx-doc-photo {
          width: 58px;
          height: 58px;
          min-width: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #d8dbe3;
          display: block;
          background: #f1f5f9;
        }
        .rx-dc-doctor-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }
        .rx-prescribed-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.7px;
          color: #5A58D1 !important;
          margin-bottom: 1px;
        }
        .rx-doctor-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a !important;
          line-height: 1.25;
        }
        .rx-verified { color: #2563eb !important; font-size: 15px; }
        .rx-doctor-creds {
          font-size: 9.5px;
          color: #64748b !important;
          font-weight: 500;
          margin: 1px 0 4px;
        }
        .rx-dept-pill {
          display: inline-block;
          align-self: flex-start;
          background: #F3F0FF !important;
          color: #5A58D1 !important;
          font-size: 9px;
          font-weight: 500;
          padding: 2px 10px;
          border-radius: 999px;
        }

        .rx-doc-meta-row {
          display: grid;
          grid-template-columns: 18px 88px 8px 1fr;
          align-items: center;
          gap: 0 2px;
          margin-bottom: 7px;
          font-size: 10px;
        }
        .rx-doc-meta-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #F3F0FF !important;
          color: #5A58D1 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
        }
        .rx-doc-meta-icon i { color: #5A58D1 !important; font-size: 10px; }
        .rx-doc-meta-label {
          color: #475569 !important;
          font-weight: 600;
          white-space: nowrap;
        }
        .rx-doc-meta-colon {
          color: #475569 !important;
          font-weight: 500;
        }
        .rx-doc-meta-value {
          color: #0f172a !important;
          font-weight: 600;
          word-break: break-word;
          padding-left: 2px;
        }

        .rx-clinic-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rx-clinic-logo {
          max-height: 40px;
          max-width: 72px;
          object-fit: contain;
        }
        .rx-clinic-logo-fallback {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          background: #E8E7FF !important;
          color: #5A58D1 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }
        .rx-clinic-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #0f172a !important;
          line-height: 1.2;
        }
        .rx-clinic-tagline {
          font-size: 9px;
          color: #64748b !important;
          font-weight: 500;
          font-style: italic;
          margin-top: 1px;
        }
        .rx-clinic-line {
          font-size: 9.5px;
          color: #334155 !important;
          font-weight: 600;
          margin-top: 4px;
          display: flex;
          gap: 5px;
          align-items: flex-start;
          line-height: 1.35;
        }
        .rx-clinic-line i {
          color: #5A58D1 !important;
          margin-top: 1px;
          font-size: 12px;
          flex-shrink: 0;
        }

        .rx-meds {
          margin-top: 0;
          padding: 12px 14px 10px;
        }
        .rx-section-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: #5A58D1 !important;
          margin-bottom: 8px;
        }
        .rx-section-title span { color: #5A58D1 !important; }
        .rx-rx-icon {
          font-size: 18px !important;
          color: #5A58D1 !important;
          line-height: 1;
        }
        .rx-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          border: 1px solid #e2e5ee;
          border-radius: 6px;
          overflow: hidden;
        }
        .rx-table thead th {
          background: #F3F0FF !important;
          color: #5A58D1 !important;
          font-weight: 600;
          text-align: center;
          padding: 8px 6px;
          border: 1px solid #e2e5ee;
          font-size: 9.5px;
          white-space: nowrap;
        }
        .rx-table thead th.rx-th-left,
        .rx-table thead th:nth-child(2) { text-align: left; }
        .rx-table tbody td {
          padding: 8px 6px;
          border: 1px solid #e8eaf0;
          color: #0f172a !important;
          vertical-align: middle;
          font-weight: 600;
          background: #fff !important;
        }
        .rx-td-center { text-align: center; font-weight: 500; }
        .rx-td-empty {
          text-align: center;
          color: #94a3b8 !important;
          padding: 14px !important;
        }
        .rx-med-name {
          font-weight: 600;
          color: #0f172a !important;
          font-size: 10.5px;
        }
        .rx-med-comp {
          font-size: 8.5px;
          color: #64748b !important;
          font-weight: 500;
          margin-top: 2px;
        }
        .rx-note {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 0;
          margin-left: -14px;
          margin-right: -14px;
          margin-bottom: -10px;
          padding: 8px 14px;
          font-size: 10px;
          color: #5A58D1 !important;
          font-weight: 600;
          line-height: 1.4;
          background: #F3F0FF !important;
          border-top: 1px solid #e2e5ee;
        }
        .rx-note i { color: #5A58D1 !important; font-size: 14px; margin-top: 1px; }
        .rx-note strong { color: #5A58D1 !important; }
        .rx-note span { color: #5A58D1 !important; }

        .rx-avatar {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: #E8E7FF !important;
          color: #5A58D1 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
        }
        .rx-avatar-md { width: 42px; height: 42px; min-width: 42px; font-size: 15px; }

        .rx-pay-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 600;
          line-height: 1.3;
        }
        .rx-pay-unpaid {
          background: #FEE2E2 !important;
          color: #EF4444 !important;
        }
        .rx-pay-paid {
          background: #DCFCE7 !important;
          color: #15803D !important;
        }

        .rx-bullets {
          margin: 0;
          padding-left: 14px;
          font-size: 10px;
          font-weight: 600;
          color: #0f172a !important;
          line-height: 1.45;
        }
        .rx-bullets li { margin-bottom: 3px; }
        .rx-empty {
          font-size: 10px;
          color: #94a3b8 !important;
          font-style: italic;
        }
        .rx-empty-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 54px;
          color: #94a3b8 !important;
          font-size: 9.5px;
          text-align: center;
        }
        .rx-empty-icon i { font-size: 22px; }

        /* Advice / Diagnostics / Follow-up cards */
        .rx-cards-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          align-items: stretch;
        }
        .rx-card {
          background: #fff !important;
          border: 1px solid #e2e5ee;
          border-radius: 8px;
          padding: 14px 16px;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .rx-card-head {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }
        .rx-card-head i {
          font-size: 16px;
          color: #4338CA !important;
          line-height: 1;
        }
        .rx-card-head span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.45px;
          color: #4338CA !important;
          text-transform: uppercase;
        }
        .rx-card-bullets {
          margin: 0;
          padding-left: 16px;
          list-style: disc;
          font-size: 10.5px;
          font-weight: 500;
          color: #1e293b !important;
          line-height: 1.5;
        }
        .rx-card-bullets li {
          margin-bottom: 5px;
          padding-left: 2px;
        }
        .rx-card-bullets li::marker {
          color: #0f172a;
          font-size: 9px;
        }
        .rx-card-muted {
          font-size: 10.5px;
          color: #64748b !important;
          font-weight: 500;
        }
        .rx-diag-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .rx-diag-empty p {
          margin: 0;
          font-size: 10.5px;
          font-weight: 500;
          color: #475569 !important;
          line-height: 1.4;
        }
        .rx-diag-watermark {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 64px;
          margin-top: 6px;
        }
        .rx-diag-watermark i {
          font-size: 56px;
          color: #d1d5db !important;
          opacity: 0.85;
          line-height: 1;
        }
        .rx-fu-row {
          display: grid;
          grid-template-columns: 52px 8px 1fr;
          align-items: start;
          margin-bottom: 7px;
          font-size: 10.5px;
          line-height: 1.35;
        }
        .rx-fu-label {
          color: #334155 !important;
          font-weight: 600;
        }
        .rx-fu-colon {
          color: #334155 !important;
          font-weight: 500;
        }
        .rx-fu-value {
          color: #0f172a !important;
          font-weight: 600;
          word-break: break-word;
        }
        .rx-fu-sub {
          display: block;
          margin-top: 2px;
          font-size: 10px;
          font-weight: 500;
          color: #475569 !important;
        }

        .rx-ipd {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff7ed !important;
          border: 1px solid #fdba74;
          border-radius: 6px;
          padding: 6px 10px;
          color: #c2410c !important;
          font-size: 10px;
          font-weight: 600;
        }

        .rx-bottom-row {
          display: grid;
          grid-template-columns: 1.55fr 1fr;
          gap: 18px;
          margin-top: 4px;
          align-items: stretch;
        }
        .rx-additional-card {
          background: #fff !important;
          border: 1px solid #e2e5ee;
          border-radius: 8px;
          padding: 12px 14px;
          min-height: 0;
        }
        .rx-additional-body p {
          margin: 0 0 4px;
          font-size: 10.5px;
          line-height: 1.45;
          color: #1e293b !important;
          font-weight: 500;
        }
        .rx-additional-body p:last-child { margin-bottom: 0; }
        .rx-additional-empty {
          margin: 0;
          font-size: 10.5px;
          color: #94a3b8 !important;
        }
        .rx-signature {
          text-align: center;
          padding: 4px 8px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-height: 0;
        }
        .rx-sig-space {
          width: 100%;
          min-height: 48px;
          max-height: 56px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .rx-sig-img {
          max-height: 52px;
          max-width: 180px;
          object-fit: contain;
        }
        .rx-sig-line {
          width: 78%;
          border-top: 1.5px dotted #94a3b8;
          margin: 6px auto 8px;
          height: 0;
          background: transparent;
        }
        .rx-sig-name {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a !important;
          line-height: 1.25;
        }
        .rx-sig-meta {
          font-size: 10px;
          font-weight: 500;
          color: #334155 !important;
          margin-top: 1px;
          line-height: 1.3;
        }

        .rx-thanks {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
          padding-top: 8px;
        }
        .rx-thanks-line {
          flex: 1;
          height: 1.5px;
          background: #5A58D1 !important;
          border-radius: 2px;
        }
        .rx-thanks-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 500;
          color: #4338CA !important;
        }
        .rx-thanks-text i {
          color: #5A58D1 !important;
          font-size: 12px;
        }

        .rx-footer {
          display: flex;
          align-items: center;
          gap: 0;
          background: #1a233a !important;
          color: #fff !important;
          padding: 10px 14px;
          font-size: 9.5px;
          font-weight: 600;
          flex-wrap: nowrap;
        }
        .rx-footer * { color: #fff !important; }
        .rx-footer-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 10px;
          white-space: nowrap;
          min-width: 0;
        }
        .rx-footer-icon {
          width: 18px;
          height: 18px;
          min-width: 18px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.75);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .rx-footer-icon i { font-size: 10px; line-height: 1; }
        .rx-footer-addr {
          flex: 1;
          white-space: normal;
          line-height: 1.35;
        }
        .rx-footer-sep {
          width: 1px;
          align-self: stretch;
          min-height: 18px;
          background: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }

        @media print {
          @page { size: A4; margin: 0; }
          .rx-slip {
            border: none !important;
            width: 210mm !important;
            max-height: 297mm !important;
            height: auto !important;
            min-height: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          html, body {
            height: auto !important;
            overflow: hidden !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionPadSlip;
