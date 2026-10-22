import { useMemo, useState } from "react";
import BodyDiagram3D from "./BodyDiagram3D";
import type { BodyPartDef } from "./BodyDiagram3D";
import { buildTherapyScheduleBlocks } from "./therapySchedule";

export interface PreviewPrintClinic {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
}

export interface PreviewPrintBodyPoint {
  part: string;
  label: string;
  remark?: string;
  severity: number;
  daysSince?: number;
}

export interface PreviewPrintTherapyPlan {
  therapyName?: string;
  therapyCategoryName?: string;
  totalSessions?: number | "";
  sessionFee?: number | "";
  startDate?: string;
  sessionTime?: string;
  scheduleType?: string;
  notes?: string;
}

export interface ConsultationPreviewPrintProps {
  clinic: PreviewPrintClinic;
  patient?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    patientCode?: string;
  };
  doctor?: { fullName?: string };
  appointmentCode?: string;
  bodyParts: BodyPartDef[];
  bodyPoints: PreviewPrintBodyPoint[];
  examHasFront: boolean;
  examHasBack: boolean;
  examinationNotes?: string;
  therapyPlans: PreviewPrintTherapyPlan[];
  consultationFee: number;
  therapyTotal: number;
  discountType?: string;
  discountValue?: number | "";
  discountAmt: number;
  finalTotal: number;
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
  /** Doctor/clinic availability used to generate session dates */
  availability?: any;
}

const money = (n?: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Dedicated print layout for Step 3 Preview — does not print the on-screen page. */
const ConsultationPreviewPrint = ({
  clinic,
  patient,
  doctor,
  appointmentCode,
  bodyParts,
  bodyPoints,
  examHasFront,
  examHasBack,
  examinationNotes,
  therapyPlans,
  consultationFee,
  therapyTotal,
  discountType,
  discountValue,
  discountAmt,
  finalTotal,
  severityColor,
  availability,
}: ConsultationPreviewPrintProps) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "—";
  const clinicInitial = (clinic.name || "C").trim().charAt(0).toUpperCase() || "C";
  const logoSrc = typeof clinic.logo === "string" ? clinic.logo.trim() : "";
  const showLogo = Boolean(logoSrc) && !logoFailed;
  const bothViews = examHasFront && examHasBack;
  const scheduleBlocks = useMemo(
    () => buildTherapyScheduleBlocks(therapyPlans, availability),
    [therapyPlans, availability]
  );

  return (
    <div id="consultation-preview-print" className="cprev-root">
      <header className="cprev-header">
        <div className="cprev-header-left">
          {showLogo ? (
            <img
              src={logoSrc}
              alt={clinic.name || "Clinic"}
              className="cprev-avatar"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="cprev-avatar cprev-avatar-fallback">{clinicInitial}</div>
          )}
          <div className="cprev-brand-text">
            <div className="cprev-name-row">
              <h2 className="cprev-clinic-name">{clinic.name || "Clinic"}</h2>
              <span className="cprev-status-pill">Preview</span>
            </div>
            <div className="cprev-info-line">
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
              <span>
                <i className="ti ti-calendar" />{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {clinic.address && (
              <div className="cprev-info-line">
                <span>
                  <i className="ti ti-map-pin" /> {clinic.address}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="cprev-id-box">
          <div className="cprev-id-label">APPOINTMENT ID</div>
          <div className="cprev-id-value">#{appointmentCode || "—"}</div>
          <div className="cprev-id-label cprev-id-label-gap">DOCUMENT TYPE</div>
          <div className="cprev-id-type">Consultation Plan</div>
        </div>
      </header>

      {/* Patient */}
      <section className="cprev-card">
        <div className="cprev-card-title">Patient Details</div>
        <div className="cprev-grid">
          <div className="cprev-field">
            <span className="cprev-label">Patient</span>
            <span className="cprev-value">{patientName}</span>
          </div>
          <div className="cprev-field">
            <span className="cprev-label">Phone</span>
            <span className="cprev-value">{patient?.phone || "—"}</span>
          </div>
          <div className="cprev-field">
            <span className="cprev-label">Therapist</span>
            <span className="cprev-value">Dr. {doctor?.fullName || "—"}</span>
          </div>
          <div className="cprev-field">
            <span className="cprev-label">Appointment</span>
            <span className="cprev-value">{appointmentCode || "—"}</span>
          </div>
        </div>
      </section>

      {/* Examination */}
      <section className="cprev-card">
        <div className="cprev-card-title">Examination Findings</div>
        {bodyPoints.length > 0 && (examHasFront || examHasBack) && (
          <div className={bothViews ? "cprev-diagrams-pair" : "cprev-diagrams-single"}>
            {examHasFront && (
              <div className="cprev-diagram-box">
                <div className="cprev-diagram-label">Front View</div>
                <BodyDiagram3D
                  parts={bodyParts}
                  marks={bodyPoints}
                  interactive={false}
                  severityColor={severityColor}
                  height={bothViews ? 210 : 250}
                  lockedView="front"
                />
              </div>
            )}
            {examHasBack && (
              <div className="cprev-diagram-box">
                <div className="cprev-diagram-label">Back View</div>
                <BodyDiagram3D
                  parts={bodyParts}
                  marks={bodyPoints}
                  interactive={false}
                  severityColor={severityColor}
                  height={bothViews ? 210 : 250}
                  lockedView="back"
                />
              </div>
            )}
          </div>
        )}

        {bodyPoints.length > 0 ? (
          <div className="cprev-marks">
            {bodyPoints.map((bp) => (
              <div
                key={bp.part}
                className="cprev-mark"
                style={{ borderColor: `${severityColor(bp.severity)}55` }}
              >
                <div className="cprev-mark-top">
                  <span className="cprev-dot" style={{ background: severityColor(bp.severity) }} />
                  <strong>{bp.label}</strong>
                  <span className="cprev-sev" style={{ color: severityColor(bp.severity) }}>
                    {bp.severity}/10
                  </span>
                </div>
                {(bp.daysSince || 0) > 0 && (
                  <div className="cprev-muted">Since {bp.daysSince} days</div>
                )}
                {bp.remark && <div className="cprev-note">{bp.remark}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="cprev-empty">No body parts marked during examination.</div>
        )}
      </section>

      <section className="cprev-card">
        <div className="cprev-card-title">General Examination Notes</div>
        <div className="cprev-notes">
          {examinationNotes?.trim() || "No examination notes recorded."}
        </div>
      </section>

      {/* Recommended Therapies — full table */}
      <section className="cprev-card">
        <div className="cprev-card-title">Recommended Therapies</div>
        {therapyPlans.length === 0 ? (
          <div className="cprev-empty">No therapies recommended.</div>
        ) : (
          <table className="cprev-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Therapy</th>
                <th>Category</th>
                <th>Sessions</th>
                <th>Schedule</th>
                <th>Start Date</th>
                <th>Time</th>
                <th>Fee / Session</th>
                <th>Line Total</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {therapyPlans.map((p, i) => {
                const sessions = Number(p.totalSessions) || 0;
                const fee = Number(p.sessionFee) || 0;
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="cprev-strong">{p.therapyName || "—"}</td>
                    <td>{p.therapyCategoryName || "—"}</td>
                    <td>{sessions || "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.scheduleType || "—"}</td>
                    <td>{fmtDate(p.startDate)}</td>
                    <td>{p.sessionTime || "Any available"}</td>
                    <td>{money(fee)}</td>
                    <td className="cprev-strong cprev-accent">{money(sessions * fee)}</td>
                    <td>{p.notes?.trim() || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Daily session schedule — one block per therapy */}
      {therapyPlans.length > 0 && (
        <section className="cprev-card">
          <div className="cprev-card-title">
            Daily Session Schedule
            {scheduleBlocks.reduce((n, b) => n + b.entries.length, 0) > 0
              ? ` (${scheduleBlocks.reduce((n, b) => n + b.entries.length, 0)})`
              : ""}
          </div>
          {scheduleBlocks.map((block, pIdx) => (
            <div key={pIdx} className="cprev-schedule-block">
              <div className="cprev-schedule-head">
                <span className="cprev-schedule-badge">{block.therapyName}</span>
                <span className="cprev-muted">
                  {block.sessionCount} session{block.sessionCount === 1 ? "" : "s"} over{" "}
                  {block.totalDays} day{block.totalDays === 1 ? "" : "s"} ({block.scheduleType})
                </span>
              </div>
              {block.entries.length > 0 ? (
                <table className="cprev-table cprev-schedule-table">
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
                          <span className="cprev-day-pill">Day {entry.day}</span>
                        </td>
                        <td className="cprev-strong">
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
                <div className="cprev-empty">
                  Start date not set — schedule will be generated upon confirmation.
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Pricing summary — no paid/unpaid */}
      <section className="cprev-card">
        <div className="cprev-card-title">Pricing Summary</div>
        <div className="cprev-pricing">
          <div className="cprev-bill-row">
            <span>Consultation Fee</span>
            <span>{money(consultationFee)}</span>
          </div>
          <div className="cprev-bill-row">
            <span>Therapy Total</span>
            <span>{money(therapyTotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="cprev-bill-row cprev-discount">
              <span>
                Discount
                {discountType === "percentage"
                  ? ` (${discountValue}%)`
                  : discountType === "fixed"
                  ? ` (₹${discountValue})`
                  : ""}
              </span>
              <span>−{money(discountAmt)}</span>
            </div>
          )}
          <div className="cprev-bill-row cprev-total">
            <span>Grand Total</span>
            <span>{money(finalTotal)}</span>
          </div>
        </div>
      </section>

      <footer className="cprev-footer">
        <span>{clinic.name || "Clinic"} · Therapy Consultation Preview</span>
        <span>Printed {new Date().toLocaleString("en-GB")}</span>
      </footer>

      <style>{`
        #consultation-preview-print.cprev-root {
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
          padding: 12px;
          box-sizing: border-box;
        }

        .cprev-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          margin-bottom: 14px;
          background: #fff;
          border: none;
        }
        .cprev-header-left {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-width: 0;
          flex: 1;
        }
        .cprev-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          background: #eef2ff;
        }
        .cprev-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-weight: 700;
          font-size: 22px;
        }
        .cprev-brand-text { min-width: 0; }
        .cprev-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .cprev-clinic-name {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .cprev-status-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #e8f5e9;
          color: #2e7d32;
          font-size: 11px;
          font-weight: 600;
        }
        .cprev-info-line {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
          font-size: 11px;
          color: #334155;
          margin-bottom: 4px;
        }
        .cprev-info-line i {
          color: #6366f1;
          margin-right: 3px;
        }
        .cprev-id-box {
          border: 1.5px dashed #93c5fd;
          border-radius: 10px;
          padding: 10px 14px;
          min-width: 150px;
          text-align: center;
          background: #f8fbff;
          flex-shrink: 0;
        }
        .cprev-id-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #2563eb;
          text-transform: uppercase;
        }
        .cprev-id-label-gap { margin-top: 8px; }
        .cprev-id-value {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .cprev-id-type {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
        }

        .cprev-card {
          border-radius: 12px;
          background: #f8fafc;
          padding: 14px 16px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          break-inside: auto;
          page-break-inside: auto;
        }
        .cprev-card-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #4f46e5;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #c7d2fe;
        }

        .cprev-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px 12px;
        }
        .cprev-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 2px;
        }
        .cprev-value { display: block; font-size: 12.5px; font-weight: 600; word-break: break-word; }
        .cprev-strong { font-weight: 700; }
        .cprev-accent { color: #4f46e5; }
        .cprev-muted { font-size: 10px; color: #64748b; margin-top: 4px; }
        .cprev-note { font-size: 11px; color: #334155; margin-top: 4px; }
        .cprev-empty { font-size: 12px; color: #64748b; font-style: italic; padding: 6px 0; }

        .cprev-diagrams-pair { display: flex; gap: 12px; margin-bottom: 12px; }
        .cprev-diagrams-single { display: flex; justify-content: center; margin-bottom: 12px; }
        .cprev-diagram-box {
          flex: 1 1 0; min-width: 0; background: #fff; border-radius: 10px;
          padding: 8px; border: 1px solid #e2e8f0;
        }
        .cprev-diagrams-single .cprev-diagram-box { max-width: 320px; width: 100%; }
        .cprev-diagram-label {
          text-align: center; font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;
        }

        .cprev-marks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .cprev-mark {
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
        }
        .cprev-mark-top { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .cprev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cprev-sev { margin-left: auto; font-size: 11px; font-weight: 700; }

        .cprev-notes {
          background: #fff;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          line-height: 1.5;
          white-space: pre-wrap;
          border-left: 3px solid #6366f1;
        }

        .cprev-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
        }
        .cprev-table th {
          text-align: left;
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
          font-size: 9.5px;
          letter-spacing: 0.25px;
          text-transform: uppercase;
          padding: 8px 8px;
          border-bottom: 1px solid #c7d2fe;
        }
        .cprev-table td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .cprev-table tr:last-child td { border-bottom: none; }

        .cprev-schedule-block { margin-bottom: 14px; }
        .cprev-schedule-block:last-child { margin-bottom: 0; }
        .cprev-schedule-head {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 12px;
          margin-bottom: 8px;
        }
        .cprev-schedule-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
        }
        .cprev-schedule-table { margin-top: 4px; }
        .cprev-day-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #0f172a;
          font-size: 11px;
          font-weight: 600;
        }

        .cprev-pricing {
          background: #fff;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          max-width: 420px;
        }
        .cprev-bill-row {
          display: flex; justify-content: space-between; gap: 12px;
          font-size: 12.5px; padding: 6px 0;
        }
        .cprev-discount { color: #047857; }
        .cprev-bill-row.cprev-total {
          border-top: 1px dashed #cbd5e1;
          margin-top: 6px; padding-top: 10px;
          font-weight: 700; font-size: 14px; color: #4f46e5;
        }

        .cprev-footer {
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
          #consultation-preview-print,
          #consultation-preview-print * {
            visibility: visible !important;
          }
          #consultation-preview-print.cprev-root {
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
          .cprev-header,
          .cprev-card,
          .cprev-schedule-block,
          .cprev-footer {
            break-inside: auto !important;
            page-break-inside: auto !important;
            break-after: auto !important;
            page-break-after: auto !important;
            break-before: auto !important;
            page-break-before: auto !important;
          }
          .cprev-card {
            margin-bottom: 8px !important;
            padding: 10px 12px !important;
            box-shadow: none !important;
          }
          .cprev-table tr,
          .cprev-mark,
          .cprev-schedule-head {
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
          .cprev-diagrams-pair,
          .cprev-diagrams-single {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsultationPreviewPrint;
