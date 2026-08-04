import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../core/config/api";
import PrescriptionPad from "../clinic-modules/appointments/PrescriptionPad";
import InvoiceSlip from "../patient-modules/patient-invoice-details/InvoiceSlip";

interface IpdAdmissionPrintSummaryProps {
  admission: any;
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

/** Multi-page IPD print: Admission Slip → Blank Rx Pad → Discharge Paper → Invoice(s) */
const IpdAdmissionPrintSummary: React.FC<IpdAdmissionPrintSummaryProps> = ({ admission }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  let loginClinic: any = {};
  try {
    loginClinic = JSON.parse(localStorage.getItem("user") || "{}")?.clinic || {};
  } catch {
    /* ignore */
  }

  const clinic = { ...loginClinic, ...(admission?.clinic || {}) };

  const padAppointment = useMemo(() => {
    if (!admission) return null;
    return {
      appointmentCode: admission.admissionCode || "IPD",
      scheduledAt: admission.admissionDate,
      mode: "IPD Admission",
      isFollowUp: false,
      patient: admission.patient || {},
      doctor: admission.doctor || {},
      clinic: { ...loginClinic, ...(admission.clinic || {}) },
    };
  }, [admission]);

  if (!admission || !padAppointment) return null;

  const rawLogo =
    clinic.landingPage?.logo || clinic.clinicLogo || clinic.logo || loginClinic.landingPage?.logo || "";
  const clinicLogoUrl = isValidClinicLogo(rawLogo) ? resolveMediaUrl(rawLogo) : "";

  const clinicName = clinic.name || clinic.clinicName || "Clinic";
  const clinicTagline =
    clinic.landingPage?.tagline || loginClinic?.landingPage?.tagline || "Advanced Care, Always Here";
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
    .filter(Boolean)
    .join(", ");

  const patient = admission.patient || {};
  const patientName =
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
  const patientGender = patient.gender || "—";
  const patientPhone = patient.phone || patient.alternateMobile || "—";
  const patientEmail = patient.email || "—";
  const patientBlood = patient.bloodGroup || "—";
  const patientAddress =
    [patient.address1, patient.address2, patient.city, patient.state, patient.country, patient.pincode]
      .filter(Boolean)
      .join(", ") || "—";

  const doctor = admission.doctor || {};
  const doctorDisplay = doctor.fullName ? `Dr. ${doctor.fullName}` : "Unassigned";
  const doctorInitial = (doctor.fullName?.trim()?.[0] || "D").toUpperCase();
  const doctorHasPhoto = Boolean(doctor.profileImage);
  const doctorDept =
    doctor.department?.name ||
    doctor.specializations?.[0]?.name ||
    doctor.specialization?.name ||
    "—";
  const doctorCreds =
    [doctor.designation?.name, doctor.qualification, doctor.medicalLicenseNumber]
      .filter(Boolean)
      .join(" · ") || "—";
  const doctorPhone = doctor.phone || "—";
  const doctorEmail = doctor.email || "—";
  const doctorExp =
    doctor.yearOfExperience != null ? `${doctor.yearOfExperience} Yrs` : "—";
  const doctorVisitCharge =
    admission.doctorVisitCharge ?? doctor.ipdVisitCharge ?? doctor.consultationCharge ?? 0;

  const ward = admission.ward || {};
  const wardName = ward.wardName || "Not Assigned";
  const wardType = ward.wardType || "—";
  const wardCode = ward.wardCode || "—";
  const wardFloor = ward.floorNumber || "—";
  const wardCharge = ward.chargePerNight ?? admission.wardCharge ?? 0;
  const nursingCharge = ward.nursingChargePerNight ?? admission.nursingFee ?? 0;
  const wardBeds =
    ward.totalBeds != null
      ? `${ward.occupiedBeds ?? 0} / ${ward.totalBeds} beds`
      : "—";
  const wardAmenities = Array.isArray(ward.amenities)
    ? ward.amenities.filter(Boolean).join(", ")
    : typeof ward.amenities === "string"
    ? ward.amenities
    : "";

  const treatment = admission.treatment || null;
  const procedureName =
    treatment?.procedureName || treatment?.name || admission.treatmentReason || "—";
  const procedureCode = treatment?.procedureCode || "—";
  const procedureCategory =
    treatment?.categoryRef?.name || treatment?.category || "—";
  const procedureDept = treatment?.department?.name || "—";
  const procedureDuration = treatment?.estimatedDuration || "—";
  const procedureFee =
    admission.treatmentFee ||
    treatment?.totalPrice ||
    treatment?.procedureFee ||
    treatment?.totalCharge ||
    0;

  const admissionCode = admission.admissionCode || "IPD";
  const admissionType = admission.admissionType || "Direct";
  const isDischarged = admission.status === "Discharged";
  const paymentStatus = admission.paymentStatus || "Unpaid";
  const isPaid =
    String(paymentStatus).toLowerCase().includes("paid") &&
    !String(paymentStatus).toLowerCase().includes("unpaid");
  const estimatedTotal =
    admission.estimatedTotal ||
    admission.totalEstimatedAmount ||
    admission.totalBilled ||
    admission.computed?.runningTotalWithWard ||
    0;

  const genDate = dayjs().format("DD MMM YYYY");
  const genTime = dayjs().format("hh:mm A");

  const invoices = Array.isArray(admission.invoices) ? admission.invoices : [];
  const mappedInvoices = invoices.map((inv: any) => ({
    ...inv,
    invoiceCode: inv.invoiceNumber || inv.invoiceCode,
    invoiceDate: inv.createdAt || inv.invoiceDate,
    paymentStatus: inv.paymentStatus || paymentStatus,
    paymentMethod: inv.paymentMethod || admission.paymentMethod || "—",
    totalAmount: inv.totalAmount,
    subTotal: inv.subTotal || inv.totalAmount,
    discount: inv.discount || 0,
    tax: inv.tax || 0,
    patient,
    doctor,
    clinic: admission.clinic || clinic,
    items: (inv.items || []).map((it: any) => ({
      ...it,
      description: it.itemName || it.description || it.name,
      itemName: it.itemName || it.description || it.name,
      quantity: it.quantity || 1,
      amount: it.totalPrice ?? it.amount ?? it.unitPrice ?? 0,
      totalPrice: it.totalPrice ?? it.amount ?? 0,
    })),
  }));

  const billItems = [
    admission.admissionFee > 0 && {
      itemName: "IPD Admission Fee",
      amount: admission.admissionFee,
      totalPrice: admission.admissionFee,
      quantity: 1,
    },
    procedureFee > 0 && {
      itemName: `Procedure: ${procedureName}`,
      amount: procedureFee,
      totalPrice: procedureFee,
      quantity: 1,
    },
    doctorVisitCharge > 0 && {
      itemName: "Doctor Visit Charge",
      amount: doctorVisitCharge,
      totalPrice: doctorVisitCharge,
      quantity: 1,
    },
    wardCharge > 0 && {
      itemName: "Ward Charge / Night",
      amount: wardCharge,
      totalPrice: wardCharge,
      quantity: 1,
    },
    nursingCharge > 0 && {
      itemName: "Nursing Charge / Night",
      amount: nursingCharge,
      totalPrice: nursingCharge,
      quantity: 1,
    },
    admission.otherCharges > 0 && {
      itemName: "Other Charges",
      amount: admission.otherCharges,
      totalPrice: admission.otherCharges,
      quantity: 1,
    },
  ].filter(Boolean) as any[];

  const fallbackInvoice = {
    invoiceCode: `IPD-BILL-${admissionCode}`,
    invoiceDate: admission.admissionDate || new Date().toISOString(),
    createdAt: admission.admissionDate || new Date().toISOString(),
    paymentStatus,
    paymentMethod: admission.paymentMethod || "—",
    totalAmount: estimatedTotal || admission.dueAmount || 0,
    subTotal: estimatedTotal || admission.dueAmount || 0,
    discount: admission.discountAmount || 0,
    tax: 0,
    patient,
    doctor,
    clinic: admission.clinic || clinic,
    items:
      billItems.length > 0
        ? billItems
        : [
            {
              itemName: "IPD Admission / Stay Charges",
              description: "IPD Admission / Stay Charges",
              quantity: 1,
              amount: estimatedTotal || admission.dueAmount || 0,
              totalPrice: estimatedTotal || admission.dueAmount || 0,
            },
          ],
  };

  const invoicePages = mappedInvoices.length > 0 ? mappedInvoices : [fallbackInvoice];

  // Prefer clinic from admission API when present
  const printClinic = admission.clinic || clinic;
  const printClinicName = printClinic.name || clinicName;
  const printClinicTagline =
    printClinic.landingPage?.tagline || clinicTagline;
  const printClinicPhone =
    printClinic.phone || printClinic.whatsappNumber || clinicPhone;
  const printClinicEmail =
    printClinic.landingPage?.email || printClinic.ownerEmail || clinicEmail;
  const printClinicAddress =
    [
      printClinic.addressLine1,
      printClinic.addressLine2,
      printClinic.city,
      printClinic.state,
      printClinic.country,
      printClinic.pincode ? `- ${printClinic.pincode}` : "",
    ]
      .filter(Boolean)
      .join(", ") || clinicAddress;
  const printLogoRaw = printClinic.landingPage?.logo || rawLogo;
  const printLogoUrl = isValidClinicLogo(printLogoRaw) ? resolveMediaUrl(printLogoRaw) : clinicLogoUrl;
  const showPrintLogo = Boolean(printLogoUrl) && !logoFailed;
  const printClinicInitial = (printClinicName.trim()?.[0] || "C").toUpperCase();

  return (
    <div id="ipd-admission-print-summary" className="ipd-print-root">
      {/* ═══ 1. ADMISSION SLIP ═══ */}
      <div className="as-slip ipd-print-page">
        <div className="as-slip-body">
          <div className="as-title-bar">
            <h1>IPD ADMISSION SLIP</h1>
          </div>

          <div className="as-patient-bar as-clinic-bar">
            <div className="as-patient-left">
              {showPrintLogo ? (
                <img
                  src={printLogoUrl}
                  alt={printClinicName}
                  className="as-avatar as-avatar-lg as-clinic-avatar-img"
                  crossOrigin="anonymous"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="as-avatar as-avatar-lg">{printClinicInitial}</div>
              )}
              <div className="as-patient-meta">
                <div className="as-patient-name-row">
                  <h2>{printClinicName}</h2>
                  <span className="as-pill as-pill-blue">Clinic</span>
                </div>
                <div className="as-patient-line">
                  {printClinicTagline && (
                    <span>
                      <i className="ti ti-heartbeat" /> {printClinicTagline}
                    </span>
                  )}
                  {printClinicPhone && (
                    <span>
                      <i className="ti ti-phone" /> {printClinicPhone}
                    </span>
                  )}
                  {printClinicEmail && (
                    <span>
                      <i className="ti ti-mail" /> {printClinicEmail}
                    </span>
                  )}
                </div>
                <div className="as-patient-line">
                  {printClinicAddress && (
                    <span>
                      <i className="ti ti-map-pin" /> {printClinicAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>
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
                    <i className="ti ti-id" /> {patient.patientCode || "—"}
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
              <div className="as-id-label mt-2">ADMISSION TYPE</div>
              <div className="as-id-type">{admissionType}</div>
            </div>
          </div>

          <div className="as-main-grid">
            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-bed" /> ADMISSION DETAILS
              </div>
              {kv("Admission ID", admissionCode)}
              {kv("Admission Type", admissionType)}
              {kv("Admission Date", fmtDateTime(admission.admissionDate))}
              {kv("UHID / Patient Code", patient.patientCode || "—")}
              {kv("Blood Group", patientBlood)}
              {kv("Referral / Apt", admission.referralAppointmentCode || "—")}
              {kv(
                "Status",
                <span className={`as-pill ${isDischarged ? "as-pill-orange" : "as-pill-green"}`}>
                  {isDischarged ? "Discharged" : admission.status || "Admitted"}
                </span>
              )}
              {kv("Diagnosis / Notes", admission.diagnosis || "—")}
              {kv("Admission Fee", money(admission.admissionFee))}
            </div>

            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-stethoscope" /> DOCTOR &amp; SURGERY
              </div>
              <div className="as-doctor-row">
                {doctorHasPhoto ? (
                  <img src={resolveMediaUrl(doctor.profileImage)} alt="" className="as-avatar as-avatar-md" />
                ) : (
                  <div className="as-avatar as-avatar-md">{doctorInitial}</div>
                )}
                <div>
                  <div className="as-doctor-name">
                    {doctorDisplay}{" "}
                    {doctor.fullName ? <i className="ti ti-rosette-discount-check as-verified" /> : null}
                  </div>
                  <div className="as-doctor-creds">{doctorCreds}</div>
                  {doctorDept !== "—" ? <span className="as-pill as-pill-purple">{doctorDept}</span> : null}
                </div>
              </div>
              {kv("Experience", doctorExp)}
              {kv("Doctor Phone", doctorPhone)}
              {kv("Doctor Email", doctorEmail)}
              {kv("Doctor Visit Charge", money(doctorVisitCharge))}
              {kv("Procedure / Surgery", procedureName)}
              {kv("Procedure Code", procedureCode)}
              {kv("Category", procedureCategory)}
              {kv("Dept", procedureDept)}
              {kv("Duration", procedureDuration)}
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
              {kv("Occupancy", wardBeds)}
              {kv("Charge / Night", money(wardCharge))}
              {kv("Nursing / Night", money(nursingCharge))}
              {wardAmenities ? kv("Amenities", wardAmenities) : null}
            </div>
          </div>

          <div className="as-mid-row">
            <div className="as-instructions">
              <div className="as-col-head">IMPORTANT INSTRUCTIONS</div>
              <ul>
                <li>
                  <i className="ti ti-circle-check" /> Keep this admission slip with you during the hospital stay.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Inform nursing staff of any allergies or ongoing medication.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Visitor policy and ward timings must be followed.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Contact billing desk for advance / due payments.
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
              {kv("Estimated Total", money(estimatedTotal))}
              {kv("Advance Deposit", money(admission.advancePaid))}
              {kv("Total Paid", money(admission.totalPaid))}
              {kv("Due Balance", money(admission.dueAmount ?? admission.computed?.runningDueAmount))}
              {kv("Payment Mode", admission.paymentMethod || "—")}
            </div>
          </div>

          <div className="as-cut">
            <i className="ti ti-scissors" />
            <span className="as-cut-line" />
            <span className="as-cut-text">Keep this slip for your reference</span>
            <span className="as-cut-line" />
          </div>

          <div className="as-footer">
            <div className="as-footer-left">
              <i className="ti ti-heartbeat" /> Thank you for choosing {printClinicName}. We wish you good health!
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
      </div>

      {/* ═══ 2. BLANK PRESCRIPTION PAD ═══ */}
      <div className="ipd-print-page ipd-print-pad-wrap">
        <PrescriptionPad appointment={padAppointment} prescription={null} />
      </div>

      {/* ═══ 3. DISCHARGE PAPER ═══ */}
      <div className="as-slip ipd-print-page">
        <div className="as-slip-body">
          <div className="as-title-bar">
            <h1>IPD DISCHARGE PAPER</h1>
          </div>

          <div className="as-patient-bar as-clinic-bar">
            <div className="as-patient-left">
              {showPrintLogo ? (
                <img
                  src={printLogoUrl}
                  alt={printClinicName}
                  className="as-avatar as-avatar-lg as-clinic-avatar-img"
                  crossOrigin="anonymous"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="as-avatar as-avatar-lg">{printClinicInitial}</div>
              )}
              <div className="as-patient-meta">
                <div className="as-patient-name-row">
                  <h2>{printClinicName}</h2>
                  <span className="as-pill as-pill-blue">Clinic</span>
                </div>
                <div className="as-patient-line">
                  {printClinicTagline && (
                    <span>
                      <i className="ti ti-heartbeat" /> {printClinicTagline}
                    </span>
                  )}
                  {printClinicPhone && (
                    <span>
                      <i className="ti ti-phone" /> {printClinicPhone}
                    </span>
                  )}
                  {printClinicEmail && (
                    <span>
                      <i className="ti ti-mail" /> {printClinicEmail}
                    </span>
                  )}
                </div>
                <div className="as-patient-line">
                  {printClinicAddress && (
                    <span>
                      <i className="ti ti-map-pin" /> {printClinicAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="as-patient-bar">
            <div className="as-patient-left">
              <div className="as-avatar as-avatar-lg">{patientInitial}</div>
              <div className="as-patient-meta">
                <div className="as-patient-name-row">
                  <h2>{patientName}</h2>
                  <span className={`as-pill ${isDischarged ? "as-pill-orange" : "as-pill-blue"}`}>
                    {isDischarged ? "Discharged" : "Pending Discharge"}
                  </span>
                </div>
                <div className="as-patient-line">
                  <span>
                    <i className="ti ti-id" /> {patient.patientCode || "—"}
                  </span>
                  <span>
                    <i className="ti ti-user" /> {patientGender}
                    {patientAge != null ? ` · ${patientAge} Yrs` : ""}
                  </span>
                  <span>
                    <i className="ti ti-phone" /> {patientPhone}
                  </span>
                </div>
              </div>
            </div>
            <div className="as-id-box">
              <div className="as-id-label">ADMISSION ID</div>
              <div className="as-id-value">#{admissionCode}</div>
              <div className="as-id-label mt-2">DOCUMENT</div>
              <div className="as-id-type">Discharge Summary</div>
            </div>
          </div>

          <div className="as-main-grid">
            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-calendar-event" /> STAY SUMMARY
              </div>
              {kv("Admission Date", fmtDateTime(admission.admissionDate))}
              {kv("Discharge Date", isDischarged ? fmtDateTime(admission.dischargeDate) : "_______________")}
              {kv("Ward", wardName)}
              {kv("Ward Code / Type", `${wardCode} · ${wardType}`)}
              {kv("Primary Doctor", doctorDisplay)}
              {kv("Doctor Phone", doctorPhone)}
              {kv("Department", doctorDept)}
            </div>

            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-activity" /> CLINICAL SUMMARY
              </div>
              {kv("Procedure / Surgery", procedureName)}
              {kv("Procedure Charge", money(procedureFee))}
              {kv("Category", procedureCategory)}
              {kv("Diagnosis", admission.diagnosis || "_______________")}
              {kv("Discharge Notes", admission.dischargeNotes || "_______________")}
              {kv("Advice on Discharge", "_______________")}
              {kv("Follow-up Date", "_______________")}
            </div>

            <div className="as-col">
              <div className="as-col-head">
                <i className="ti ti-credit-card" /> BILLING AT DISCHARGE
              </div>
              {kv(
                "Payment Status",
                <span className={`as-pill ${isPaid ? "as-pill-green" : "as-pill-orange"}`}>{paymentStatus}</span>
              )}
              {kv("Estimated Total", money(estimatedTotal))}
              {kv("Advance Deposit", money(admission.advancePaid))}
              {kv("Total Paid", money(admission.totalPaid))}
              {kv("Due Balance", money(admission.dueAmount ?? admission.computed?.runningDueAmount))}
              {kv("Payment Mode", admission.paymentMethod || "—")}
              {kv("Admission Fee", money(admission.admissionFee))}
            </div>
          </div>

          <div className="as-mid-row">
            <div className="as-instructions">
              <div className="as-col-head">POST-DISCHARGE INSTRUCTIONS</div>
              <ul>
                <li>
                  <i className="ti ti-circle-check" /> Take medicines exactly as prescribed on the prescription pad.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Report immediately for fever, bleeding, or severe pain.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Keep wound / surgical site clean and dry as advised.
                </li>
                <li>
                  <i className="ti ti-circle-check" /> Attend follow-up visit on the scheduled date.
                </li>
              </ul>
            </div>
            <div className="as-payment">
              <div className="as-col-head">
                <i className="ti ti-signature" /> AUTHORIZATION
              </div>
              {kv("Treating Doctor", doctorDisplay)}
              {kv("Doctor Sign", "_______________")}
              {kv("Patient / Attendant Sign", "_______________")}
              {kv("Discharge Cleared By", "_______________")}
            </div>
          </div>

          <div className="as-footer">
            <div className="as-footer-left">
              <i className="ti ti-heartbeat" /> Get well soon — {printClinicName}
            </div>
            <div className="as-footer-divider" />
            <div className="as-footer-right">
              <div>Computer generated discharge paper.</div>
              <div>
                Date: {genDate} | Time: {genTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 4. INVOICE(S) ═══ */}
      {invoicePages.map((inv: any, idx: number) => (
        <div key={inv.id || inv.invoiceCode || idx} className="ipd-print-page ipd-print-inv-wrap">
          <InvoiceSlip invoice={inv} />
        </div>
      ))}

      <style>{`
        .ipd-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .ipd-print-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          page-break-after: always;
          break-after: page;
        }
        .ipd-print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .ipd-print-pad-wrap,
        .ipd-print-inv-wrap {
          padding: 0;
          box-sizing: border-box;
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
          padding: 8px 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1 1 auto;
          min-height: 0;
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
          padding: 12px 0;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .as-clinic-bar {
          padding-top: 4px;
        }
        .as-clinic-avatar-img {
          object-fit: contain !important;
          background: #f8fafc;
          border-radius: 10px !important;
          padding: 4px;
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
          text-align: center;
          background: #f8fbff;
          flex-shrink: 0;
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
        }
        .as-col {
          padding: 12px 16px;
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
        .as-kv-value { color: #0f172a !important; font-weight: 700; text-align: right; max-width: 60%; word-break: break-word; }
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
        .as-doctor-name { font-size: 13px; font-weight: 800; color: #0f172a !important; }
        .as-verified { color: #2563eb !important; font-size: 14px; }
        .as-doctor-creds { font-size: 10px; color: #64748b !important; margin: 2px 0 4px; }
        .as-mid-row {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 14px;
          background: #f3f0ff !important;
          border: 1px solid #ddd6fe;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .as-instructions ul {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .as-instructions li {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 11px; color: #334155 !important; line-height: 1.45;
        }
        .as-instructions li i { color: #7c3aed !important; font-size: 15px; flex-shrink: 0; }
        .as-payment {
          background: #ffffff !important;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .as-cut {
          display: flex; align-items: center; gap: 8px; margin: 4px 0;
        }
        .as-cut i { font-size: 14px; color: #94a3b8 !important; }
        .as-cut-line { flex: 1; border-top: 1.5px dashed #cbd5e1; }
        .as-cut-text {
          font-size: 10px; font-weight: 600; color: #6366f1 !important; white-space: nowrap;
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
          #ipd-admission-print-summary,
          #ipd-admission-print-summary * {
            visibility: visible !important;
          }
          #ipd-admission-print-summary.ipd-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 99999 !important;
          }
          .ipd-print-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .ipd-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default IpdAdmissionPrintSummary;
