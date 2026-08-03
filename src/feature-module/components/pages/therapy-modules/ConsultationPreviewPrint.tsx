import { useState } from "react";
import BodyDiagram3D from "./BodyDiagram3D";
import type { BodyPartDef } from "./BodyDiagram3D";

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
  medicines = [],
  advice,
  severityColor,
}: ConsultationPreviewPrintProps) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "—";
  const clinicInitial = (clinic.name || "C").trim().charAt(0).toUpperCase() || "C";
  const logoSrc = typeof clinic.logo === "string" ? clinic.logo.trim() : "";
  const showLogo = Boolean(logoSrc) && !logoFailed;
  const bothViews = examHasFront && examHasBack;

  return (
    <div id="consultation-preview-print" className="cprev-root">
      <header className="cprev-header">
        <div className="cprev-brand">
          {showLogo ? (
            <img
              src={logoSrc}
              alt={clinic.name || "Clinic"}
              className="cprev-logo"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="cprev-logo-fallback">{clinicInitial}</div>
          )}
          <div>
            <div className="cprev-clinic-name">{clinic.name || "Clinic"}</div>
            {clinic.address && <div className="cprev-meta">{clinic.address}</div>}
            <div className="cprev-meta">
              {[clinic.phone, clinic.email].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
        <div className="cprev-head-right">
          <div className="cprev-doc-title">Consultation Plan</div>
          <div className="cprev-sub">Preview & Confirm</div>
          <div className="cprev-meta">
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
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

      {/* Prescription */}
      <section className="cprev-card">
        <div className="cprev-card-title">Prescription & Advice</div>
        <div className="cprev-label" style={{ marginBottom: 4 }}>
          Doctor Advice
        </div>
        <div className="cprev-notes">{advice?.trim() || "No advice recorded."}</div>
        <div className="cprev-label" style={{ marginTop: 12, marginBottom: 6 }}>
          Prescribed Medicines
        </div>
        {medicines.length === 0 ? (
          <div className="cprev-empty">No medicines prescribed.</div>
        ) : (
          <table className="cprev-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m, i) => (
                <tr key={i}>
                  <td className="cprev-strong">{m.name || m.medicineName || "—"}</td>
                  <td>{m.dosage || m.frequency || "—"}</td>
                  <td>{m.duration || "—"}</td>
                  <td>{m.instructions || m.timings || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          gap: 16px;
          align-items: flex-start;
          padding: 18px 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          margin-bottom: 14px;
        }
        .cprev-brand { display: flex; gap: 12px; align-items: center; min-width: 0; }
        .cprev-logo {
          width: 52px; height: 52px; border-radius: 12px; object-fit: cover;
          background: #fff; flex-shrink: 0;
        }
        .cprev-logo-fallback {
          width: 52px; height: 52px; border-radius: 12px;
          background: #fff; color: #4f46e5;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 22px; flex-shrink: 0;
        }
        .cprev-clinic-name { font-size: 18px; font-weight: 700; }
        .cprev-meta { font-size: 11px; opacity: 0.9; margin-top: 2px; line-height: 1.35; }
        .cprev-head-right { text-align: right; flex-shrink: 0; }
        .cprev-doc-title { font-size: 15px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; }
        .cprev-sub { font-size: 12px; opacity: 0.9; margin-top: 2px; }

        .cprev-card {
          border-radius: 12px;
          background: #f8fafc;
          padding: 14px 16px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          break-inside: avoid;
          page-break-inside: avoid;
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
          @page { size: A4; margin: 10mm; }
          html, body {
            background: #fff !important;
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
            margin: 0 !important;
            padding: 0 !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 1 !important;
          }
          .consult-print-canvas-img {
            visibility: visible !important;
            width: 100% !important;
            max-height: 200px !important;
            object-fit: contain !important;
            display: block !important;
          }
          .body-diagram-3d canvas {
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsultationPreviewPrint;
