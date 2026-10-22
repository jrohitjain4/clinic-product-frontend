import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";

interface DiagnosticPrintSlipProps {
  booking: any;
  doctors?: any[];
  staff?: any[];
}

const displayStatus = (status?: string) => {
  if (!status || status === "Pending") return "Schedule";
  if (status === "Completed") return "Checked Out";
  return status;
};

const inr = (amount: number | string | null | undefined) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const parseTestsList = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getBookingTests = (bk: any) => {
  const fromList = parseTestsList(bk?.testsList).filter((t) => t && (t.name || t.testId));
  if (fromList.length > 0) return fromList;

  if (bk?.test) {
    return [
      {
        testId: bk.test.id,
        name: bk.test.name,
        testCode: bk.test.testCode,
        price: Number(bk.test.price) || Number(bk.totalAmount) || 0,
        categoryName: bk.test.category?.name || "—",
        status:
          bk.status === "Checked Out" || bk.status === "Completed" ? "Completed" : "Pending",
        assignedUserId: bk.assignedUserId,
      },
    ];
  }

  // Last resort: show one line from booking totals so slip is never empty
  if (Number(bk?.totalAmount) > 0 || bk?.bookingCode) {
    return [
      {
        testId: bk.id || "booking-test",
        name: "Diagnostic Test",
        testCode: "—",
        price: Number(bk.totalAmount) || 0,
        categoryName: "—",
        status:
          bk.status === "Checked Out" || bk.status === "Completed" ? "Completed" : "Pending",
        assignedUserId: bk.assignedUserId,
      },
    ];
  }
  return [];
};

const DiagnosticPrintSlip: React.FC<DiagnosticPrintSlipProps> = ({
  booking,
  doctors = [],
  staff = [],
}) => {
  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj.clinic || {};
  } catch {
    /* ignore */
  }

  const clinic = { ...loginClinic, ...(booking?.clinic || {}) };
  const clinicName = clinic.name || booking?.clinicName || "Clinic";
  const rawLogo = clinic.landingPage?.logo || clinic.clinicLogo || "";
  const clinicLogoUrl = rawLogo ? resolveMediaUrl(rawLogo) : "";
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [clinicLogoUrl]);

  const clinicAddress = [
    clinic.addressLine1,
    clinic.addressLine2,
    clinic.city,
    clinic.state,
    clinic.pincode ? `PIN - ${clinic.pincode}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const clinicPhone = clinic.phone || clinic.landingPage?.whatsapp || "";
  const clinicEmail = clinic.landingPage?.email || clinic.email || "";

  const getAssignedName = (assignedUserId?: string) => {
    if (!assignedUserId) return "Auto / Any Available";
    const doc = doctors.find((d: any) => d.id === assignedUserId);
    if (doc) return `Dr. ${doc.fullName}`;
    const stf = staff.find((s: any) => s.id === assignedUserId);
    if (stf) return stf.fullName;
    return "Auto / Any Available";
  };

  const tests = useMemo(() => getBookingTests(booking), [booking]);
  const testsSubtotal = useMemo(
    () => tests.reduce((acc: number, t: any) => acc + (Number(t.price) || 0), 0),
    [tests]
  );
  const discountAmt = Number(booking?.discount) || 0;
  const taxAmt = Number(booking?.tax) || 0;
  const totalAmt = Number(booking?.totalAmount) || 0;
  // Prefer sum of test prices; if missing, reconstruct from total + discount - tax
  const subtotal =
    testsSubtotal > 0
      ? testsSubtotal
      : Math.max(0, totalAmt + discountAmt - taxAmt) || totalAmt;

  if (!booking) return null;

  const patient = booking.patient || {};
  const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "—";
  const patientInitial = (patientName.trim()[0] || "P").toUpperCase();
  const statusLabel = displayStatus(booking.status);
  const isPaid =
    String(booking.paymentStatus || "").toLowerCase().includes("paid") &&
    !String(booking.paymentStatus || "").toLowerCase().includes("unpaid");
  const completedCount = tests.filter((t: any) => t.status === "Completed").length;

  const kv = (label: string, value: React.ReactNode) => (
    <div className="dbs-kv">
      <span className="dbs-kv-label">{label}</span>
      <span className="dbs-kv-value">{value}</span>
    </div>
  );

  const genDate = dayjs().format("DD MMM YYYY");
  const genTime = dayjs().format("hh:mm A");

  return (
    <>
      <div className="dbs-slip">
        <div className="dbs-slip-body">
          <div className="dbs-title-bar">
            <h1>DIAGNOSTIC BOOKING SLIP</h1>
            <p className="dbs-subtitle">Pathology / Laboratory Test Booking Confirmation</p>
          </div>

          <div className="dbs-patient-bar">
            <div className="dbs-patient-left">
              <div className="dbs-avatar dbs-avatar-lg">{patientInitial}</div>
              <div className="dbs-patient-meta">
                <div className="dbs-patient-name-row">
                  <h2>{patientName}</h2>
                  <span className="dbs-pill dbs-pill-blue">{patient.patientCode || "—"}</span>
                </div>
                <div className="dbs-patient-line">
                  <span>
                    <i className="ti ti-phone" /> {patient.phone || "—"}
                  </span>
                  <span>
                    <i className="ti ti-mail" /> {patient.email || "—"}
                  </span>
                  {patient.gender && (
                    <span>
                      <i className="ti ti-user" /> {patient.gender}
                    </span>
                  )}
                  {patient.dateOfBirth && (
                    <span>
                      <i className="ti ti-calendar" /> {dayjs(patient.dateOfBirth).format("DD MMM YYYY")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="dbs-id-box">
              <div className="dbs-id-label">BOOKING CODE</div>
              <div className="dbs-id-value">#{booking.bookingCode || "—"}</div>
              <div className="dbs-id-label mt-2">BOOKING STATUS</div>
              <div className="dbs-id-type">{statusLabel}</div>
            </div>
          </div>

          <div className="dbs-main-grid">
            <div className="dbs-col">
              <div className="dbs-col-head">
                <i className="ti ti-calendar-event" /> BOOKING DETAILS
              </div>
              {kv("Scheduled Date", dayjs(booking.scheduledAt).format("DD MMM YYYY"))}
              {kv(
                "Time Slot / Session",
                booking.sessionSlot || dayjs(booking.scheduledAt).format("hh:mm A")
              )}
              {kv("Booked On", dayjs(booking.createdAt).format("DD MMM YYYY, hh:mm A"))}
              {kv("Assigned To", getAssignedName(booking.assignedUserId))}
              {kv("Referred By", booking.referredBy || "—")}
              {booking.invoiceNo ? kv("Invoice No.", booking.invoiceNo) : null}
              {kv(
                "Status",
                <span className="dbs-pill dbs-pill-blue">{statusLabel}</span>
              )}
            </div>

            <div className="dbs-col">
              <div className="dbs-col-head">
                <i className="ti ti-building-hospital" /> CLINIC INFORMATION
              </div>
              <div className="dbs-clinic-brand">
                {clinicLogoUrl && !logoFailed ? (
                  <img
                    src={clinicLogoUrl}
                    alt={clinicName}
                    className="dbs-clinic-logo"
                    crossOrigin="anonymous"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <div className="dbs-clinic-logo-fallback">{(clinicName[0] || "C").toUpperCase()}</div>
                )}
                <div className="dbs-clinic-name">{clinicName}</div>
              </div>
              <div className="dbs-clinic-lines">
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
                {clinicEmail && (
                  <div>
                    <i className="ti ti-mail" /> {clinicEmail}
                  </div>
                )}
              </div>
            </div>

            <div className="dbs-col">
              <div className="dbs-col-head">
                <i className="ti ti-credit-card" /> PAYMENT SUMMARY
              </div>
              {kv(
                "Payment Status",
                <span className={`dbs-pill ${isPaid ? "dbs-pill-green" : "dbs-pill-orange"}`}>
                  {booking.paymentStatus || "Unpaid"}
                </span>
              )}
              {kv("Payment Method", booking.paymentMethod || "—")}
              {kv("Subtotal", inr(subtotal))}
              {discountAmt > 0 ? kv("Discount", `- ${inr(discountAmt)}`) : null}
              {taxAmt > 0 ? kv("Tax", inr(taxAmt)) : null}
              {kv(
                "Total Amount",
                <strong className="dbs-total">{inr(totalAmt || subtotal)}</strong>
              )}
            </div>
          </div>

          <div className="dbs-tests-section">
            <div className="dbs-col-head">
              <i className="ti ti-test-pipe" /> BOOKED DIAGNOSTIC TESTS ({tests.length})
            </div>
            <table className="dbs-tests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Test Name</th>
                  <th>Test Code</th>
                  <th>Category</th>
                  <th>Assigned Practitioner</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {tests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      No tests listed
                    </td>
                  </tr>
                ) : (
                  tests.map((t: any, idx: number) => (
                    <tr key={t.testId || idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{t.name || "—"}</td>
                      <td>{t.testCode || booking.test?.testCode || "—"}</td>
                      <td>{t.categoryName || booking.test?.category?.name || "—"}</td>
                      <td>{getAssignedName(t.assignedUserId || booking.assignedUserId)}</td>
                      <td className="text-center">
                        <span
                          className={`dbs-pill ${
                            t.status === "Completed" ? "dbs-pill-green" : "dbs-pill-orange"
                          }`}
                        >
                          {t.status === "Completed" ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td className="text-end fw-bold">{inr(t.price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="text-end fw-bold">
                    Grand Total
                  </td>
                  <td className="text-end fw-bold dbs-total">{inr(totalAmt || subtotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {booking.remarks ? (
            <div className="dbs-remarks">
              <div className="dbs-col-head">
                <i className="ti ti-notes" /> REMARKS / SPECIAL INSTRUCTIONS
              </div>
              <p>{booking.remarks}</p>
            </div>
          ) : null}

          <div className="dbs-mid-row">
            <div className="dbs-instructions">
              <div className="dbs-col-head">IMPORTANT INSTRUCTIONS</div>
              <ul>
                <li>
                  <i className="ti ti-circle-check" /> Please arrive 15 minutes before your scheduled slot.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Follow any fasting or preparation guidelines for your test(s).
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Bring previous medical reports and a valid ID proof.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Keep this booking slip for reference at the lab counter.
                </li>
              </ul>
            </div>
            <div className="dbs-summary-card">
              <div className="dbs-col-head">
                <i className="ti ti-list-check" /> BOOKING SUMMARY
              </div>
              {kv("Total Tests", tests.length)}
              {kv("Completed Tests", `${completedCount} / ${tests.length}`)}
              {kv("Booking Code", booking.bookingCode || "—")}
              {booking.invoiceNo ? kv("Invoice No.", booking.invoiceNo) : null}
            </div>
          </div>
        </div>

        <div className="dbs-footer">
          <div className="dbs-footer-left">
            <i className="ti ti-heartbeat" /> Thank you for choosing {clinicName}. We wish you good health!
          </div>
          <div className="dbs-footer-divider" />
          <div className="dbs-footer-right">
            <div>Computer generated diagnostic booking slip</div>
            <div>
              Generated: {genDate} | {genTime}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dbs-slip {
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
        .dbs-slip * { box-sizing: border-box; }
        .dbs-slip-body {
          padding: 10px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dbs-title-bar {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .dbs-title-bar h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #1e3a8a !important;
        }
        .dbs-subtitle {
          margin: 4px 0 0;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        .dbs-patient-bar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .dbs-patient-left { display: flex; gap: 12px; align-items: center; flex: 1; }
        .dbs-avatar {
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }
        .dbs-avatar-lg { width: 52px; height: 52px; font-size: 22px; }
        .dbs-patient-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .dbs-patient-meta h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
        .dbs-patient-line {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
          font-size: 11px;
          color: #475569;
        }
        .dbs-patient-line i { margin-right: 3px; color: #6366f1; }
        .dbs-id-box {
          text-align: right;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          background: #f8fafc;
          min-width: 160px;
        }
        .dbs-id-label { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; }
        .dbs-id-value { font-size: 16px; font-weight: 800; color: #1e3a8a; }
        .dbs-id-type { font-size: 13px; font-weight: 700; color: #0f172a; }
        .dbs-main-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .dbs-col {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          background: #fafbfc;
        }
        .dbs-col-head {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #1e3a8a;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dbs-kv {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          padding: 3px 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        .dbs-kv:last-child { border-bottom: none; }
        .dbs-kv-label { color: #64748b; flex-shrink: 0; }
        .dbs-kv-value { font-weight: 600; color: #0f172a; text-align: right; }
        .dbs-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }
        .dbs-pill-blue { background: #dbeafe; color: #1d4ed8; }
        .dbs-pill-green { background: #dcfce7; color: #15803d; }
        .dbs-pill-orange { background: #ffedd5; color: #c2410c; }
        .dbs-clinic-brand { text-align: center; margin-bottom: 8px; }
        .dbs-clinic-logo { max-height: 44px; max-width: 120px; object-fit: contain; }
        .dbs-clinic-logo-fallback {
          width: 44px; height: 44px; border-radius: 8px;
          background: #eef2ff; color: #4338ca; font-weight: 800;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .dbs-clinic-name { font-weight: 800; font-size: 13px; margin-top: 4px; }
        .dbs-clinic-lines { font-size: 10px; color: #475569; line-height: 1.6; }
        .dbs-clinic-lines i { color: #6366f1; margin-right: 4px; }
        .dbs-total { color: #15803d !important; font-size: 13px; }
        .dbs-tests-section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
        .dbs-tests-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 6px;
        }
        .dbs-tests-table th {
          background: #1e3a8a !important;
          color: #fff !important;
          padding: 6px 8px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .dbs-tests-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .dbs-tests-table tfoot td {
          background: #f1f5f9;
          border-top: 2px solid #cbd5e1;
        }
        .dbs-remarks {
          border: 1px solid #fde68a;
          background: #fffbeb;
          border-radius: 8px;
          padding: 10px;
        }
        .dbs-remarks p { margin: 6px 0 0; font-size: 11px; color: #78350f; }
        .dbs-mid-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 10px;
        }
        .dbs-instructions, .dbs-summary-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          background: #fafbfc;
        }
        .dbs-instructions ul {
          margin: 6px 0 0;
          padding: 0;
          list-style: none;
          font-size: 10px;
          color: #475569;
        }
        .dbs-instructions li {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
          align-items: flex-start;
        }
        .dbs-instructions i { color: #16a34a; margin-top: 1px; flex-shrink: 0; }
        .dbs-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-top: 2px solid #e2e8f0;
          background: #f8fafc;
          font-size: 10px;
          color: #64748b;
          margin-top: auto;
        }
        .dbs-footer-left { font-weight: 600; color: #1e3a8a; }
        .dbs-footer-left i { margin-right: 4px; }
        .dbs-footer-divider { width: 1px; height: 28px; background: #cbd5e1; }
        .dbs-footer-right { text-align: right; }
      `}</style>
    </>
  );
};

export default DiagnosticPrintSlip;
