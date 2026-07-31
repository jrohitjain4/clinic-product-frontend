import React, { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { formatAppointmentTimeRange } from "../../../../../core/utils/appointmentForm";

dayjs.extend(customParseFormat);

interface AppointmentPrintSlipProps {
  appointment: any;
  notes?: any[];
  linkedPrescriptions?: any[];
  isDiagnostic?: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTimeLabel = (raw?: string) => {
  if (!raw) return "";
  const parsed = dayjs(raw, ["HH:mm", "HH:mm:ss", "h:mm A", "hh:mm A"], true);
  return parsed.isValid() ? parsed.format("hh:mm A") : raw;
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

const AppointmentPrintSlip: React.FC<AppointmentPrintSlipProps> = ({
  appointment,
  isDiagnostic = false,
}) => {
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
    landingPage: {
      ...(loginClinic?.landingPage || {}),
      ...(appointment?.clinic?.landingPage || {}),
    },
  };

  const workingConfig = clinic.workingDaysConfig || loginClinic?.workingDaysConfig;
  const rawLogoCandidate =
    clinic.landingPage?.logo ||
    loginClinic?.landingPage?.logo ||
    clinic.clinicLogo ||
    loginClinic?.clinicLogo ||
    "";
  const clinicLogoUrl = isValidClinicLogo(rawLogoCandidate) ? resolveMediaUrl(rawLogoCandidate) : "";
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [clinicLogoUrl]);

  const timingLines = useMemo(() => {
    const schedules = workingConfig?.schedules;
    const offDays: number[] = workingConfig?.offDays || [];

    if (Array.isArray(schedules) && schedules.length > 0) {
      const active = schedules.filter((s: any) => s.isActive !== false);
      if (active.length === 0) return [{ label: "Clinic Hours", value: "Closed" }];

      const byRange: Record<string, string[]> = {};
      active.forEach((s: any) => {
        const dayLabel = typeof s.day === "number" ? DAY_NAMES[s.day] : s.day || "Day";
        const start = formatTimeLabel(s.startTime || s.from);
        const end = formatTimeLabel(s.endTime || s.to);
        const range = start && end ? `${start} - ${end}` : "—";
        if (!byRange[range]) byRange[range] = [];
        byRange[range].push(dayLabel);
      });

      const lines = Object.entries(byRange).map(([range, days]) => ({
        label: days.length >= 5 ? `${days[0]} - ${days[days.length - 1]}` : days.join(", "),
        value: range,
      }));

      if (offDays.length > 0) {
        lines.push({
          label: offDays.map((d) => DAY_NAMES[d] || String(d)).join(", "),
          value: "Closed",
        });
      }
      return lines.slice(0, 3);
    }

    return [
      { label: "Monday - Saturday", value: "09:00 AM - 08:00 PM" },
      { label: "Sunday", value: "10:00 AM - 02:00 PM" },
    ];
  }, [workingConfig]);

  if (!appointment) return null;

  const clinicName = clinic.name || appointment?.clinicName || "Clinic";
  const clinicTagline =
    clinic.landingPage?.tagline || loginClinic?.landingPage?.tagline || "Advanced Care, Always Here";
  const showClinicLogo = Boolean(clinicLogoUrl) && !logoFailed;
  const clinicInitial = (clinicName?.trim()?.[0] || "C").toUpperCase();
  const clinicPhone = clinic.phone || clinic.landingPage?.whatsapp || "";
  const clinicEmail = clinic.landingPage?.email || clinic.ownerEmail || clinic.email || "";
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

  const clinicWebsite = clinic.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${clinic.username}`
    : clinic.website || clinic.landingPage?.website || "";

  const patient = appointment.patient || {};
  const patientName =
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
    appointment.patientName ||
    "—";
  const patientInitial = (patient.firstName?.[0] || patientName?.[0] || "P").toUpperCase();
  const patientDob = patient.dob ? dayjs(patient.dob).format("DD MMM YYYY") : null;
  const patientAge = patient.dob
    ? dayjs().diff(patient.dob, "year")
    : patient.age != null
      ? patient.age
      : null;
  const patientPhone = patient.phone || "—";
  const patientEmail = patient.email || "—";
  const patientGender = patient.gender || "—";
  const patientStatus = (patient.status || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active";
  const patientAddress =
    [patient.address1, patient.address2, patient.city, patient.state, patient.country, patient.pincode]
      .filter((p) => p && String(p).trim() !== "")
      .join(", ") || "—";

  const doctor = appointment.doctor || {};
  const doctorName = doctor.fullName || appointment.doctorName || "—";
  const doctorDisplay = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;
  const doctorInitial = doctorName.replace(/^Dr\.?\s*/i, "").trim()?.[0]?.toUpperCase() || "D";
  const doctorDept = doctor.department?.name || appointment.department?.name || "General";
  const doctorDesignation = doctor.designation?.name || "";
  const doctorCreds = [doctorDesignation, doctorDept].filter(Boolean).join(" - ") || doctorDept;
  const doctorPhone = doctor.phone || "—";
  const doctorEmail = doctor.email || "—";
  const doctorFee = doctor.consultationCharge != null ? `₹${doctor.consultationCharge}` : "—";
  const doctorExp = doctor.yearOfExperience ? `${doctor.yearOfExperience}+ Years` : "—";
  const doctorHasPhoto =
    doctor.profileImage &&
    !String(doctor.profileImage).includes("placeholder") &&
    !String(doctor.profileImage).includes("300x300");

  const apptCode = appointment.appointmentCode || appointment.bookingCode || "—";
  const visitType =
    appointment.appointmentType ||
    (isDiagnostic ? "Diagnostic" : appointment.isFollowUp ? "Follow-up" : "Consultation");
  const visitDate = appointment.scheduledAt
    ? dayjs(appointment.scheduledAt).format("DD MMMM YYYY")
    : "—";
  const visitTime = appointment.scheduledAt
    ? dayjs(appointment.scheduledAt).format("hh:mm A")
    : "—";
  const scheduledSlot = formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt);
  const duration = `${doctor.appointmentDuration || 30} Minutes`;
  const paymentStatus = appointment.paymentStatus || "Unpaid";
  const paymentAmount =
    appointment.amount != null
      ? `₹${appointment.amount}`
      : doctor.consultationCharge != null
        ? `₹${doctor.consultationCharge}`
        : "—";
  const paymentMode = appointment.paymentMode || appointment.paymentMethod || "—";

  const genDate = dayjs().format("DD MMM YYYY");
  const genTime = dayjs().format("hh:mm A");

  const isPaid =
    String(paymentStatus).toLowerCase().includes("paid") &&
    !String(paymentStatus).toLowerCase().includes("unpaid");

  const kv = (label: string, value: React.ReactNode) => (
    <div className="as-kv">
      <span className="as-kv-label">{label}</span>
      <span className="as-kv-value">{value}</span>
    </div>
  );

  return (
    <>
      <div className="as-slip">
        <div className="as-slip-body">
        <div className="as-title-bar">
          <h1>APPOINTMENT SLIP</h1>
        </div>

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
                  <i className="ti ti-user" /> {patientGender}
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
                  <i className="ti ti-map-pin" /> {patientAddress}
                </span>
              </div>
            </div>
          </div>
          <div className="as-id-box">
            <div className="as-id-label">APPOINTMENT ID</div>
            <div className="as-id-value">#{apptCode}</div>
            <div className="as-id-label mt-2">VISIT TYPE</div>
            <div className="as-id-type">{visitType}</div>
          </div>
        </div>

        <div className="as-main-grid">
          <div className="as-col">
            <div className="as-col-head">
              <i className="ti ti-calendar-event" /> APPOINTMENT DETAILS
            </div>
            {kv("Visit Date", visitDate)}
            {kv("Visit Time", visitTime)}
            {kv("Scheduled Slot", scheduledSlot)}
            {kv("Consulting Mode", appointment.mode || "—")}
            {kv("Department", doctorDept)}
            {kv("Consultation Duration", duration)}
            {kv("Reason for Visit", appointment.reason || "—")}
            {kv(
              "Status",
              <span className="as-pill as-pill-blue">{appointment.status || "—"}</span>
            )}
          </div>

          <div className="as-col">
            <div className="as-col-head">
              <i className="ti ti-stethoscope" /> ASSIGNED DOCTOR
            </div>
            <div className="as-doctor-row">
              {doctorHasPhoto ? (
                <img src={resolveMediaUrl(doctor.profileImage)} alt="" className="as-avatar as-avatar-md" />
              ) : (
                <div className="as-avatar as-avatar-md">{doctorInitial}</div>
              )}
              <div>
                <div className="as-doctor-name">
                  {doctorDisplay} <i className="ti ti-rosette-discount-check as-verified" />
                </div>
                <div className="as-doctor-creds">{doctorCreds}</div>
                <span className="as-pill as-pill-purple">{doctorDept}</span>
              </div>
            </div>
            {kv("Experience", doctorExp)}
            {kv("Consultation Fee", doctorFee)}
            {kv("Phone", doctorPhone)}
            {kv("Email", doctorEmail)}
          </div>

          <div className="as-col">
            <div className="as-col-head">
              <i className="ti ti-building-hospital" /> CLINIC INFORMATION
            </div>
            <div className="as-clinic-brand">
              {showClinicLogo ? (
                <img
                  src={clinicLogoUrl}
                  alt={clinicName}
                  className="as-clinic-logo"
                  crossOrigin="anonymous"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="as-clinic-logo-fallback" aria-hidden>
                  {clinicInitial}
                </div>
              )}
              <div className="as-clinic-name">{clinicName}</div>
              <div className="as-clinic-tagline">{clinicTagline}</div>
            </div>
            <div className="as-clinic-lines">
              {clinicAddress && (
                <div>
                  <i className="ti ti-map-pin" /> {clinicAddress}
                </div>
              )}
              {clinicPhone && (
                <div>
                  <i className="ti ti-phone" /> {clinicPhone}
                </div>
              )}
              {clinicWebsite ? (
                <div>
                  <i className="ti ti-world" /> {clinicWebsite.replace(/^https?:\/\//, "")}
                </div>
              ) : clinicEmail ? (
                <div>
                  <i className="ti ti-mail" /> {clinicEmail}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="as-mid-row">
          <div className="as-instructions">
            <div className="as-col-head">IMPORTANT INSTRUCTIONS</div>
            <ul>
              <li>
                <i className="ti ti-circle-check" /> Please reach at least 15 minutes before your appointment time.
              </li>
              <li>
                <i className="ti ti-circle-check" /> Bring any previous medical records or reports, if available.
              </li>
              <li>
                <i className="ti ti-circle-check" /> Carry a valid ID proof for verification.
              </li>
              <li>
                <i className="ti ti-circle-check" /> In case you are unable to attend, please reschedule or cancel in advance.
              </li>
            </ul>
          </div>
          <div className="as-payment">
            <div className="as-col-head">
              <i className="ti ti-credit-card" /> PAYMENT INFORMATION
            </div>
            {kv(
              "Payment Status",
              <span className={`as-pill ${isPaid ? "as-pill-green" : "as-pill-orange"}`}>{paymentStatus}</span>
            )}
            {kv("Amount", paymentAmount)}
            {kv("Payment Mode", paymentMode === "—" ? "–" : paymentMode)}
          </div>
        </div>

        <div className="as-cut">
          <i className="ti ti-scissors" />
          <span className="as-cut-line" />
          <span className="as-cut-text">Keep this slip for your reference</span>
          <span className="as-cut-line" />
        </div>

        <div className="as-bottom-row">
          <div className="as-next">
            <div className="as-col-head">NEXT STEPS</div>
            <div className="as-step">
              <div className="as-step-icon">
                <i className="ti ti-calendar" />
              </div>
              <div>
                <strong>Consultation</strong>
                <p>Attend your consultation on the given date &amp; time.</p>
              </div>
            </div>
            <div className="as-step">
              <div className="as-step-icon">
                <i className="ti ti-clipboard-list" />
              </div>
              <div>
                <strong>Follow Doctor&apos;s Advice</strong>
                <p>Follow the prescription and instructions given by the doctor.</p>
              </div>
            </div>
            <div className="as-step">
              <div className="as-step-icon">
                <i className="ti ti-users" />
              </div>
              <div>
                <strong>Next Follow-up</strong>
                <p>Book your next appointment if a follow-up is required.</p>
              </div>
            </div>
          </div>

          <div className="as-side-cards">
            <div className="as-card">
              <div className="as-col-head">
                <i className="ti ti-clock" /> CLINIC TIMINGS
              </div>
              {timingLines.map((t, i) => (
                <div className="as-kv" key={i}>
                  <span className="as-kv-label">{t.label}</span>
                  <span className="as-kv-value">{t.value}</span>
                </div>
              ))}
            </div>
            <div className="as-card as-card-help">
              <div className="as-col-head">
                <i className="ti ti-headset" /> NEED HELP?
              </div>
              <p className="as-help-title">We&apos;re here to assist you!</p>
              <div className="as-help-contacts">
                {clinicPhone && (
                  <span>
                    <i className="ti ti-phone" /> {clinicPhone}
                  </span>
                )}
                {clinicPhone && clinicEmail && <span className="as-sep">|</span>}
                {clinicEmail && (
                  <span>
                    <i className="ti ti-mail" /> {clinicEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="as-footer">
          <div className="as-footer-left">
            <i className="ti ti-heartbeat" /> Thank you for choosing {clinicName}. We wish you good health!
          </div>
          <div className="as-footer-divider" />
          <div className="as-footer-right">
            <div>This is a computer generated slip.</div>
            <div>
              Date: {genDate} | Time: {genTime}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .as-slip {
          width: 210mm;
          min-height: 297mm;
          height: 297mm;
          margin: 0 auto;
          background: #fff;
          color: #0f172a;
          font-family: Inter, system-ui, sans-serif;
          box-sizing: border-box;
          padding: 0;
          display: flex;
          flex-direction: column;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .as-slip-body {
          padding: 8px 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1 1 auto;
          min-height: 0;
          justify-content: space-between;
        }
        .as-slip * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .as-title-bar {
          text-align: center;
          padding: 4px 0 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .as-title-bar h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #1e3a8a !important;
        }
        .as-patient-bar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border: none;
          border-radius: 10px;
          padding: 12px 0;
          align-items: center;
        }
        .as-patient-left {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-width: 0;
          flex: 1;
        }
        .as-avatar {
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          object-fit: cover;
        }
        .as-avatar-lg { width: 56px; height: 56px; font-size: 22px; }
        .as-avatar-md { width: 40px; height: 40px; font-size: 16px; }
        .as-patient-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .as-patient-name-row h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a !important;
        }
        .as-patient-line {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
          font-size: 11px;
          color: #334155 !important;
          margin-bottom: 4px;
        }
        .as-patient-line i { color: #6366f1 !important; margin-right: 3px; }
        .as-id-box {
          border: 1.5px dashed #93c5fd;
          border-radius: 10px;
          padding: 10px 14px;
          min-width: 150px;
          text-align: right;
          background: #f8fbff;
        }
        .as-id-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #2563eb !important;
        }
        .as-id-value {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a !important;
        }
        .as-id-type {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb !important;
        }
        .as-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: visible;
        }
        .as-col {
          padding: 12px 16px;
          border-right: none;
          position: relative;
        }
        .as-col:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 12px;
          bottom: 12px;
          width: 1px;
          background: #e2e8f0;
        }
        .as-col:first-child { padding-left: 16px; }
        .as-col:last-child { padding-right: 16px; }
        .as-col-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #1e40af !important;
          margin-bottom: 10px;
        }
        .as-col-head i { font-size: 14px; color: #2563eb !important; }
        .as-kv {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          padding: 4px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .as-kv:last-child { border-bottom: none; }
        .as-kv-label { color: #64748b !important; font-weight: 500; }
        .as-kv-value { color: #0f172a !important; font-weight: 700; text-align: right; max-width: 60%; }
        .as-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid transparent;
        }
        .as-pill-green { background: #ecfdf5 !important; color: #047857 !important; border-color: #6ee7b7 !important; }
        .as-pill-blue { background: #eff6ff !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }
        .as-pill-orange { background: #fff7ed !important; color: #c2410c !important; border-color: #fdba74 !important; }
        .as-pill-purple { background: #f3e8ff !important; color: #7e22ce !important; border-color: #d8b4fe !important; }
        .as-pill-muted { background: #f1f5f9 !important; color: #64748b !important; border-color: #e2e8f0 !important; }
        .as-doctor-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .as-doctor-name {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a !important;
        }
        .as-verified { color: #2563eb !important; font-size: 14px; }
        .as-doctor-creds {
          font-size: 10px;
          color: #64748b !important;
          margin: 2px 0 4px;
        }
        .as-clinic-brand {
          text-align: center;
          margin-bottom: 10px;
        }
        .as-clinic-logo {
          width: 52px;
          height: 52px;
          object-fit: contain;
          margin: 0 auto 6px;
          display: block;
          border-radius: 10px;
          background: #f8fafc;
        }
        .as-clinic-logo-fallback {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff !important;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 22px;
          margin: 0 auto 6px;
        }
        .as-clinic-name {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a !important;
        }
        .as-clinic-tagline {
          font-size: 10px;
          color: #64748b !important;
          font-style: italic;
        }
        .as-clinic-lines {
          font-size: 11px;
          color: #334155 !important;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .as-clinic-lines i { color: #2563eb !important; margin-right: 4px; }
        .as-mid-row {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 14px;
          align-items: stretch;
          background: #f3f0ff !important;
          border: 1px solid #ddd6fe;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .as-instructions {
          border: none;
          background: transparent;
          padding: 2px 4px 2px 0;
        }
        .as-payment {
          background: #ffffff !important;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .as-instructions ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .as-instructions li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 11px;
          color: #334155 !important;
          line-height: 1.45;
        }
        .as-instructions li i {
          color: #7c3aed !important;
          font-size: 15px;
          margin-top: 0;
          flex-shrink: 0;
        }
        .as-mid-row .as-col-head {
          color: #312e81 !important;
        }
        .as-mid-row .as-col-head i {
          color: #6366f1 !important;
        }
        .as-cut {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 4px 0;
        }
        .as-cut i { font-size: 14px; color: #94a3b8 !important; }
        .as-cut-line {
          flex: 1;
          border-top: 1.5px dashed #cbd5e1;
        }
        .as-cut-text {
          font-size: 10px;
          font-weight: 600;
          color: #6366f1 !important;
          white-space: nowrap;
        }
        .as-bottom-row {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 0;
          align-items: stretch;
        }
        .as-next {
          padding-right: 18px;
          position: relative;
        }
        .as-next::after {
          content: "";
          position: absolute;
          right: 0;
          top: 10px;
          bottom: 10px;
          border-right: 1.5px dotted #cbd5e1;
        }
        .as-side-cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-left: 18px;
        }
        .as-step {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          position: relative;
        }
        .as-step:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 13px;
          top: 28px;
          bottom: -12px;
          width: 2px;
          background: #ddd6fe;
        }
        .as-step-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ede9fe;
          color: #5b21b6 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 14px;
          position: relative;
          z-index: 1;
        }
        .as-step strong {
          display: block;
          font-size: 12px;
          color: #0f172a !important;
        }
        .as-step p {
          margin: 2px 0 0;
          font-size: 10px;
          color: #64748b !important;
        }
        .as-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
        }
        .as-card-help {
          background: #f3f0ff !important;
          border: none;
        }
        .as-help-title {
          font-size: 12px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #0f172a !important;
        }
        .as-help-contacts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 11px;
          color: #334155 !important;
          align-items: center;
        }
        .as-help-contacts i { color: #6366f1 !important; }
        .as-sep { color: #94a3b8 !important; }
        .as-footer {
          margin-top: auto;
          margin-left: 0;
          margin-right: 0;
          width: 100%;
          background: #1e3a8a !important;
          color: #fff !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 18px;
          font-size: 11px;
        }
        .as-footer * { color: #fff !important; }
        .as-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        .as-footer-left i { font-size: 16px; }
        .as-footer-divider {
          width: 1px;
          align-self: stretch;
          background: rgba(255,255,255,0.35);
        }
        .as-footer-right {
          text-align: right;
          font-size: 10px;
          opacity: 0.95;
        }
        @media print {
          .as-slip {
            width: 100% !important;
            min-height: 100vh !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .as-slip-body {
            padding: 5mm 6mm 4mm !important;
            gap: 6px !important;
            flex: 1 1 auto !important;
            justify-content: space-between !important;
          }
          .as-footer {
            margin: 0 !important;
            width: 100% !important;
            flex-shrink: 0 !important;
          }
          .as-patient-bar {
            padding: 6px 0 !important;
          }
          .as-title-bar {
            padding: 2px 0 6px !important;
          }
          .as-mid-row {
            padding: 10px 12px !important;
          }
          .as-col {
            padding: 10px 12px !important;
          }
        }
      `}</style>
    </>
  );
};

export default AppointmentPrintSlip;
