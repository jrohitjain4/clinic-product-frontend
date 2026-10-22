import { useMemo, useState } from "react";
import BodyDiagram3D from "./BodyDiagram3D";
import type { BodyPartDef } from "./BodyDiagram3D";
import { buildTherapyScheduleBlocks } from "./therapySchedule";

export interface ConsultationPrintClinic {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
}

export interface ConsultationPrintBodyPoint {
  part: string;
  label: string;
  remark?: string;
  severity: number;
  daysSince?: number;
}

export interface ConsultationPrintPlanProps {
  clinic: ConsultationPrintClinic;
  consultationCode?: string;
  status?: string;
  createdAt?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    patientCode?: string;
    gender?: string;
    age?: number | string;
    dateOfBirth?: string;
  };
  doctor?: { fullName?: string };
  appointment?: { appointmentCode?: string };
  bodyParts: BodyPartDef[];
  bodyPoints: ConsultationPrintBodyPoint[];
  examHasFront: boolean;
  examHasBack: boolean;
  examinationNotes?: string;
  therapyPlans?: Array<{
    therapyName?: string;
    totalSessions?: number;
    scheduleType?: string;
    startDate?: string;
    sessionTime?: string;
    sessionFee?: number;
    notes?: string;
  }>;
  sessions?: Array<{
    sessionNumber?: number;
    therapyName?: string;
    scheduledAt?: string;
    appointmentCode?: string;
    status?: string;
    paymentStatus?: string;
  }>;
  billing?: {
    consultationFee?: number;
    therapyTotal?: number;
    discountType?: string;
    discountValue?: number;
    finalTotalAmount?: number;
    amountPaid?: number;
    paymentStatus?: string;
    paymentMethod?: string;
    invoiceCode?: string;
  };
  medicines?: Array<{
    name?: string;
    medicineName?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    timings?: string;
  }>;
  advice?: string;
  severityColor: (s: number) => string;
  availability?: any;
}

const fmtDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};

const money = (n?: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ConsultationPrintPlan = ({
  clinic,
  consultationCode,
  status,
  createdAt,
  patient,
  doctor,
  appointment,
  bodyParts,
  bodyPoints,
  examHasFront,
  examHasBack,
  examinationNotes,
  therapyPlans = [],
  sessions = [],
  billing = {},
  severityColor,
  availability,
}: ConsultationPrintPlanProps) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "—";
  const balance = Math.max(0, Number(billing.finalTotalAmount || 0) - Number(billing.amountPaid || 0));
  const bothViews = examHasFront && examHasBack;
  const clinicInitial = (clinic.name || "C").trim().charAt(0).toUpperCase() || "C";
  const logoSrc = typeof clinic.logo === "string" ? clinic.logo.trim() : "";
  const showLogo = Boolean(logoSrc) && !logoFailed;
  const generatedSchedules = useMemo(
    () => buildTherapyScheduleBlocks(therapyPlans || [], availability),
    [therapyPlans, availability]
  );

  return (
    <div id="consultation-print-plan" className="cpp-root">
      {/* Clinic header — patient-bar style with dashed ID card */}
      <header className="cpp-header">
        <div className="cpp-header-left">
          {showLogo ? (
            <img
              src={logoSrc}
              alt={clinic.name || "Clinic"}
              className="cpp-avatar"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="cpp-avatar cpp-avatar-fallback" aria-hidden="true">
              {clinicInitial}
            </div>
          )}
          <div className="cpp-brand-text">
            <div className="cpp-name-row">
              <h2 className="cpp-clinic-name">{clinic.name || "Clinic"}</h2>
              {status && <span className="cpp-status-pill">{status}</span>}
            </div>
            <div className="cpp-info-line">
              {clinic.phone && (
                <span>
                  <i className="ti ti-phone" /> {clinic.phone}
                </span>
              )}
              {clinic.email && (
                <span>
                  <i className="ti ti-mail" /> {clinic.email}
                </span>
              )}
              {createdAt && (
                <span>
                  <i className="ti ti-calendar" /> {fmtDate(createdAt)}
                </span>
              )}
            </div>
            {clinic.address && (
              <div className="cpp-info-line">
                <span>
                  <i className="ti ti-map-pin" /> {clinic.address}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="cpp-id-box">
          <div className="cpp-id-label">CONSULTATION ID</div>
          <div className="cpp-id-value">#{consultationCode || "—"}</div>
          <div className="cpp-id-label cpp-id-label-gap">DOCUMENT TYPE</div>
          <div className="cpp-id-type">Consultation Details</div>
        </div>
      </header>

      {/* Patient */}
      <section className="cpp-card">
        <div className="cpp-card-title">Patient Details</div>
        <div className="cpp-grid-4">
          <div className="cpp-field">
            <span className="cpp-label">Patient Name</span>
            <span className="cpp-value">{patientName}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">UHID / Code</span>
            <span className="cpp-value">{patient?.patientCode || "—"}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">Phone</span>
            <span className="cpp-value">{patient?.phone || "—"}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">Therapist</span>
            <span className="cpp-value">Dr. {doctor?.fullName || "—"}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">Parent Appointment</span>
            <span className="cpp-value">{appointment?.appointmentCode || "—"}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">Gender / Age</span>
            <span className="cpp-value">
              {[patient?.gender, patient?.age != null ? `${patient.age} yrs` : null]
                .filter(Boolean)
                .join(" · ") || "—"}
            </span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">Email</span>
            <span className="cpp-value">{patient?.email || "—"}</span>
          </div>
          <div className="cpp-field">
            <span className="cpp-label">DOB</span>
            <span className="cpp-value">{fmtDate(patient?.dateOfBirth)}</span>
          </div>
        </div>
      </section>

      {/* Body diagram + marked areas */}
      <section className="cpp-card">
        <div className="cpp-card-title">Body Diagram & Marked Areas</div>
        {bodyPoints.length > 0 && (examHasFront || examHasBack) ? (
          <div className={bothViews ? "cpp-diagrams-pair" : "cpp-diagrams-single"}>
            {examHasFront && (
              <div className="cpp-diagram-box">
                <div className="cpp-diagram-label">Front View</div>
                <BodyDiagram3D
                  parts={bodyParts}
                  marks={bodyPoints}
                  interactive={false}
                  severityColor={severityColor}
                  height={bothViews ? 220 : 260}
                  lockedView="front"
                />
              </div>
            )}
            {examHasBack && (
              <div className="cpp-diagram-box">
                <div className="cpp-diagram-label">Back View</div>
                <BodyDiagram3D
                  parts={bodyParts}
                  marks={bodyPoints}
                  interactive={false}
                  severityColor={severityColor}
                  height={bothViews ? 220 : 260}
                  lockedView="back"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="cpp-empty">No body parts marked during examination.</div>
        )}

        {bodyPoints.length > 0 && (
          <div className="cpp-marks">
            {bodyPoints.map((bp) => (
              <div key={bp.part} className="cpp-mark-item" style={{ borderColor: `${severityColor(bp.severity)}55` }}>
                <div className="cpp-mark-top">
                  <span className="cpp-dot" style={{ background: severityColor(bp.severity) }} />
                  <strong>{bp.label}</strong>
                  <span className="cpp-sev" style={{ color: severityColor(bp.severity) }}>
                    {bp.severity}/10
                  </span>
                </div>
                {(bp.daysSince || 0) > 0 && (
                  <div className="cpp-mark-meta">Since {bp.daysSince} days</div>
                )}
                {bp.remark && <div className="cpp-mark-note">{bp.remark}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="cpp-card">
        <div className="cpp-card-title">General Examination Notes</div>
        <div className="cpp-notes">{examinationNotes?.trim() || "No examination notes recorded."}</div>
      </section>

      {/* Therapy plan */}
      <section className="cpp-card">
        <div className="cpp-card-title">Recommended Therapy Plan</div>
        {therapyPlans.length === 0 ? (
          <div className="cpp-empty">No therapy plan recorded.</div>
        ) : (
          <table className="cpp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Therapy</th>
                <th>Sessions</th>
                <th>Schedule</th>
                <th>Start Date</th>
                <th>Time</th>
                <th>Fee / Session</th>
              </tr>
            </thead>
            <tbody>
              {therapyPlans.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="cpp-strong">{p.therapyName || "—"}</td>
                  <td>{p.totalSessions ?? "—"}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.scheduleType || "—"}</td>
                  <td>{fmtDate(p.startDate)}</td>
                  <td>{p.sessionTime || "Any available"}</td>
                  <td>{money(p.sessionFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Sessions — saved appointments, or generated schedule when not yet confirmed */}
      <section className="cpp-card">
        <div className="cpp-card-title">
          Scheduled Therapy Sessions
          {sessions.length
            ? ` (${sessions.length})`
            : generatedSchedules.reduce((n, b) => n + b.entries.length, 0) > 0
            ? ` (${generatedSchedules.reduce((n, b) => n + b.entries.length, 0)})`
            : ""}
        </div>
        {sessions.length > 0 ? (
          <table className="cpp-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Therapy</th>
                <th>Date & Time</th>
                <th>Code</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.appointmentCode || i}>
                  <td>#{s.sessionNumber ?? i + 1}</td>
                  <td className="cpp-strong">{s.therapyName || "—"}</td>
                  <td>{fmtDateTime(s.scheduledAt)}</td>
                  <td className="cpp-mono">{s.appointmentCode || "—"}</td>
                  <td>{s.status || "—"}</td>
                  <td>{s.paymentStatus || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : therapyPlans.length > 0 ? (
          generatedSchedules.map((block, pIdx) => (
            <div key={pIdx} className="cpp-schedule-block">
              <div className="cpp-schedule-head">
                <span className="cpp-schedule-badge">{block.therapyName}</span>
                <span className="cpp-schedule-meta">
                  {block.sessionCount} session{block.sessionCount === 1 ? "" : "s"} over{" "}
                  {block.totalDays} day{block.totalDays === 1 ? "" : "s"} ({block.scheduleType})
                </span>
              </div>
              {block.entries.length > 0 ? (
                <table className="cpp-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Date</th>
                      <th>Day of Week</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.entries.map((entry) => (
                      <tr key={`${pIdx}-${entry.day}`}>
                        <td>
                          <span className="cpp-day-pill">Day {entry.day}</span>
                        </td>
                        <td className="cpp-strong">
                          {entry.date.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>{entry.date.toLocaleDateString("en-US", { weekday: "long" })}</td>
                        <td>{block.sessionTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="cpp-empty">
                  Start date not set — schedule will be generated upon confirmation.
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="cpp-empty">No sessions scheduled yet.</div>
        )}
      </section>

      {/* Billing */}
      <section className="cpp-card">
        <div className="cpp-card-title">Billing History</div>
        <div className="cpp-billing">
          <div className="cpp-billing-left">
            <div className="cpp-bill-row">
              <span>Consultation Fee</span>
              <span>{money(billing.consultationFee)}</span>
            </div>
            <div className="cpp-bill-row">
              <span>Therapy Total</span>
              <span>{money(billing.therapyTotal)}</span>
            </div>
            {Number(billing.discountValue || 0) > 0 && (
              <div className="cpp-bill-row cpp-discount">
                <span>
                  Discount
                  {billing.discountType === "percentage"
                    ? ` (${billing.discountValue}%)`
                    : ""}
                </span>
                <span>
                  −
                  {billing.discountType === "percentage"
                    ? money(
                        ((Number(billing.consultationFee || 0) + Number(billing.therapyTotal || 0)) *
                          Number(billing.discountValue || 0)) /
                          100
                      )
                    : money(billing.discountValue)}
                </span>
              </div>
            )}
            <div className="cpp-bill-row cpp-total">
              <span>Final Total</span>
              <span>{money(billing.finalTotalAmount)}</span>
            </div>
            <div className="cpp-bill-row">
              <span>Amount Paid{billing.paymentMethod ? ` (${billing.paymentMethod})` : ""}</span>
              <span className="cpp-paid">{money(billing.amountPaid)}</span>
            </div>
            <div className="cpp-bill-row">
              <span>Balance Due</span>
              <span className={balance > 0 ? "cpp-due" : "cpp-paid"}>{money(balance)}</span>
            </div>
          </div>
          <div className="cpp-billing-right">
            {billing.invoiceCode && (
              <div className="cpp-field">
                <span className="cpp-label">Invoice</span>
                <span className="cpp-value cpp-mono">{billing.invoiceCode}</span>
              </div>
            )}
            <div className="cpp-field">
              <span className="cpp-label">Payment Status</span>
              <span className="cpp-status-pill">{billing.paymentStatus || "—"}</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="cpp-footer">
        <div>Generated by {clinic.name || "Clinic"} · Therapy Consultation Plan</div>
        <div>Printed on {new Date().toLocaleString("en-GB")}</div>
      </footer>

      <style>{`
        #consultation-print-plan.cpp-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #fff;
          max-width: 100%;
          margin: 0 auto;
          padding: 12px;
          box-sizing: border-box;
        }

        .cpp-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          margin-bottom: 14px;
          background: #fff;
          border: none;
        }
        .cpp-header-left {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-width: 0;
          flex: 1;
        }
        .cpp-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          background: #eef2ff;
        }
        .cpp-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-weight: 700;
          font-size: 22px;
        }
        .cpp-brand-text { min-width: 0; }
        .cpp-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .cpp-clinic-name {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .cpp-status-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #e8f5e9;
          color: #2e7d32;
          font-size: 11px;
          font-weight: 600;
        }
        .cpp-info-line {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
          font-size: 11px;
          color: #334155;
          margin-bottom: 4px;
        }
        .cpp-info-line i {
          color: #6366f1;
          margin-right: 3px;
        }
        .cpp-id-box {
          border: 1.5px dashed #93c5fd;
          border-radius: 10px;
          padding: 10px 14px;
          min-width: 150px;
          text-align: center;
          background: #f8fbff;
          flex-shrink: 0;
        }
        .cpp-id-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #2563eb;
          text-transform: uppercase;
        }
        .cpp-id-label-gap { margin-top: 8px; }
        .cpp-id-value {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .cpp-id-type {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
        }
        .cpp-pill {
          display: inline-block; padding: 2px 8px; border-radius: 999px;
          background: #e0e7ff; color: #3730a3; font-weight: 600; font-size: 10px;
        }
        .cpp-schedule-block { margin-bottom: 14px; }
        .cpp-schedule-block:last-child { margin-bottom: 0; }
        .cpp-schedule-head {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 12px;
          margin-bottom: 8px;
        }
        .cpp-schedule-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
        }
        .cpp-schedule-meta { font-size: 11px; color: #64748b; }
        .cpp-day-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #0f172a;
          font-size: 11px;
          font-weight: 600;
        }

        .cpp-card {
          border-radius: 12px;
          background: #f8fafc;
          padding: 14px 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
          border: 1px solid #e2e8f0;
          break-inside: auto;
          page-break-inside: auto;
        }
        .cpp-card-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.55px;
          text-transform: uppercase;
          color: #4f46e5;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #c7d2fe;
        }

        .cpp-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px 12px;
        }
        .cpp-field { min-width: 0; }
        .cpp-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 2px;
        }
        .cpp-value { display: block; font-size: 12.5px; font-weight: 600; color: #0f172a; word-break: break-word; }
        .cpp-strong { font-weight: 700; }
        .cpp-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }

        .cpp-diagrams-pair {
          display: flex; gap: 12px; align-items: stretch; margin-bottom: 12px;
        }
        .cpp-diagrams-single {
          display: flex; justify-content: center; margin-bottom: 12px;
        }
        .cpp-diagram-box {
          flex: 1 1 0; min-width: 0; background: #fff; border-radius: 10px;
          padding: 8px; border: 1px solid #e2e8f0;
        }
        .cpp-diagrams-single .cpp-diagram-box { max-width: 320px; width: 100%; }
        .cpp-diagram-label {
          text-align: center; font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;
        }

        .cpp-marks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .cpp-mark-item {
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
        }
        .cpp-mark-top { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .cpp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cpp-sev { margin-left: auto; font-size: 11px; font-weight: 700; }
        .cpp-mark-meta { font-size: 10px; color: #64748b; margin-top: 4px; }
        .cpp-mark-note { font-size: 11px; color: #334155; margin-top: 4px; }

        .cpp-notes {
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          line-height: 1.5;
          white-space: pre-wrap;
          border-left: 3px solid #6366f1;
        }
        .cpp-empty {
          font-size: 12px; color: #64748b; padding: 10px 0; font-style: italic;
        }

        .cpp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
        }
        .cpp-table th {
          text-align: left;
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          padding: 8px 10px;
          border-bottom: 1px solid #c7d2fe;
        }
        .cpp-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .cpp-table tr:last-child td { border-bottom: none; }

        .cpp-billing {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr;
          gap: 14px;
        }
        .cpp-billing-left, .cpp-billing-right {
          background: #fff;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid #e2e8f0;
        }
        .cpp-bill-row {
          display: flex; justify-content: space-between; gap: 12px;
          font-size: 12px; padding: 5px 0;
        }
        .cpp-bill-row.cpp-total {
          border-top: 1px dashed #cbd5e1;
          margin-top: 4px; padding-top: 8px;
          font-weight: 700; font-size: 13px; color: #4f46e5;
        }
        .cpp-discount { color: #047857; }
        .cpp-paid { color: #047857; font-weight: 700; }
        .cpp-due { color: #b91c1c; font-weight: 700; }
        .cpp-status-pill {
          display: inline-block;
          margin-top: 2px;
          padding: 3px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
        }

        .cpp-advice { margin-bottom: 4px; }

        .cpp-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #64748b;
        }

        @media print {
          @page { size: A4; margin: 8mm; }
          html, body {
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #consultation-print-plan,
          #consultation-print-plan * {
            visibility: visible !important;
          }
          #consultation-print-plan.cpp-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 1 !important;
          }
          .cpp-header,
          .cpp-card,
          .cpp-schedule-block,
          .cpp-footer {
            break-inside: auto !important;
            page-break-inside: auto !important;
            break-after: auto !important;
            page-break-after: auto !important;
            break-before: auto !important;
            page-break-before: auto !important;
          }
          .cpp-card {
            margin-bottom: 8px !important;
            padding: 10px 12px !important;
            box-shadow: none !important;
            background: #f8fafc !important;
          }
          .cpp-table tr,
          .cpp-mark-item,
          .cpp-schedule-head {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .consult-print-canvas-img {
            visibility: visible !important;
            width: 100% !important;
            max-height: 160px !important;
            object-fit: contain !important;
            display: block !important;
          }
          .body-diagram-3d canvas {
            visibility: hidden !important;
          }
          .cpp-diagrams-pair,
          .cpp-diagrams-single {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsultationPrintPlan;
