import React from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";

interface AppointmentPrintSlipProps {
  appointment: any;
  notes?: any[];
  linkedPrescriptions?: any[];
}

const AppointmentPrintSlip: React.FC<AppointmentPrintSlipProps> = ({
  appointment,
  notes = [],
  linkedPrescriptions = [],
}) => {
  const { services } = useClinicServices();

  if (!appointment) return null;

  const isSessionAppointment = appointment?.serviceIds && appointment.serviceIds.length > 0;
  const sessionServices = services.filter((s: any) => appointment.serviceIds?.includes(s.id));

  const totalSessionDays = sessionServices.reduce((sum: number, s: any) => {
    const match = (s.duration || '').match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  const sessionStartDate = appointment?.scheduledAt ? dayjs(appointment.scheduledAt) : null;
  const sessionEndDate = (sessionStartDate && totalSessionDays > 0) 
    ? sessionStartDate.add(totalSessionDays - 1, "day") 
    : sessionStartDate;

  const clinicName = appointment?.clinic?.name || appointment?.clinicName || "CITY CARE CLINIC";
  const clinicTagline = appointment?.clinic?.landingPage?.tagline || "Compassionate Care, Better Health";
  
  const defaultAddress = "123, Green Valley Road, Near City Mall, Civil Lines, Lucknow - 226001, Uttar Pradesh";
  const defaultPhone = "+91 98765 43210";
  const defaultAltPhone = "0522- 4812345";
  const defaultEmail = "info@citycareclinic.com";
  const defaultWebsite = "www.citycareclinic.com";
  const defaultLicense = "CCC/2023/00125";

  const hasRealAddress = appointment?.clinic?.landingPage?.address && appointment?.clinic?.landingPage?.address !== defaultAddress 
    ? appointment.clinic.landingPage.address 
    : (appointment?.location && appointment?.location !== "OPD" && appointment?.location !== defaultAddress ? appointment.location : null);

  const hasRealPhone = appointment?.clinic?.phone && appointment?.clinic?.phone !== defaultPhone ? appointment.clinic.phone : null;
  const hasRealAltPhone = appointment?.clinic?.landingPage?.phone && appointment?.clinic?.landingPage?.phone !== defaultAltPhone ? appointment.clinic.landingPage.phone : null;
  const hasRealEmail = appointment?.clinic?.email && appointment?.clinic?.email !== defaultEmail ? appointment.clinic.email : null;
  const hasRealLicense = appointment?.clinic?.license && appointment?.clinic?.license !== defaultLicense 
    ? appointment.clinic.license 
    : (appointment?.clinic?.landingPage?.license && appointment?.clinic?.landingPage?.license !== defaultLicense ? appointment.clinic.landingPage.license : null);
  
  // Format dates
  const apptDate = appointment?.scheduledAt 
    ? dayjs(appointment.scheduledAt).format("DD MMMM YYYY (dddd)") 
    : "—";
  const apptTime = appointment?.scheduledAt 
    ? dayjs(appointment.scheduledAt).format("hh:mm A") 
    : "—";
  const slipGenDate = appointment?.createdAt 
    ? dayjs(appointment.createdAt).format("DD MMMM YYYY, hh:mm A") 
    : dayjs().format("DD MMMM YYYY, hh:mm A");

  // Patient Details
  const patientName = appointment?.patient 
    ? `${appointment.patient.firstName || ""} ${appointment.patient.lastName || ""}`.trim() 
    : appointment?.patientName || "—";
  const patientCode = appointment?.patient?.patientCode || appointment?.patientId?.slice(-6).toUpperCase() || "—";
  const patientPhone = appointment?.patient?.phone || "—";
  const patientGender = appointment?.patient?.gender || "—";
  const patientAge = appointment?.patient?.dob 
    ? `${dayjs().diff(appointment.patient.dob, "year")} Years` 
    : "—";
  const patientBloodGroup = appointment?.patient?.bloodGroup || "—";
  
  const patientAddress = [appointment?.patient?.address1, appointment?.patient?.address2]
    .filter(p => p && p.trim() !== "")
    .join(", ") || "—";
  const patientReferredBy = appointment?.patient?.referredBy || "Self";
  const patientEmergencyContact = appointment?.patient?.emergencyContact || "—";
  const patientEmail = appointment?.patient?.email || "—";
  const patientOccupation = appointment?.patient?.occupation || "—";
  const patientMaritalStatus = appointment?.patient?.maritalStatus || "—";

  return (
    <>
      <div className="appointment-slip-card border shadow-sm mx-auto mb-4 bg-white">
        {/* Watermark logo in center background */}
        {appointment?.clinic?.landingPage?.logo && (
          <div className="slip-watermark">
            <img 
              src={resolveMediaUrl(appointment.clinic.landingPage.logo)} 
              alt="Watermark" 
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        <div className="appointment-slip-container">
          
          {/* Header Info Section */}
          <div className="slip-header border-bottom-solid mb-2" style={{ paddingBottom: "10px" }}>
            <div className="d-flex flex-column align-items-start text-start w-100">
              <h2 className="clinic-title mb-0" style={{ fontSize: "20px", fontWeight: "900", color: "#000000", lineHeight: "1.1" }}>{clinicName}</h2>
              {clinicTagline && <p className="clinic-tagline text-muted mb-0" style={{ fontSize: "11px", fontStyle: "italic", color: "#64748b", marginTop: "3px", lineHeight: "1.1" }}>{clinicTagline}</p>}
              
              <div className="w-100 mt-2">
                {(hasRealAddress || defaultAddress) && (
                  <div className="d-flex align-items-center gap-1.5 text-dark mb-1" style={{ fontSize: "10px", lineHeight: "1.1" }}>
                    <i className="ti ti-map-pin text-primary" style={{ fontSize: "12px" }} />
                    <span>{hasRealAddress || defaultAddress}</span>
                  </div>
                )}
                <div className="d-flex flex-row flex-wrap align-items-center text-dark" style={{ fontSize: "10px", gap: "16px", lineHeight: "1.1" }}>
                  {(hasRealPhone || hasRealAltPhone || defaultPhone) && (
                    <span className="d-flex align-items-center gap-1.5">
                      <i className="ti ti-phone text-primary" style={{ fontSize: "12px" }} />
                      {hasRealPhone || hasRealAltPhone || defaultPhone}
                    </span>
                  )}
                  {(hasRealEmail || defaultEmail) && (
                    <span className="d-flex align-items-center gap-1.5">
                      <i className="ti ti-mail text-primary" style={{ fontSize: "11px" }} /> {hasRealEmail || defaultEmail}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Appointment Details */}
          <div className="slip-section mb-2">
            <h6 className="section-header-title text-center mb-2">
              <span className="title-text">APPOINTMENT DETAILS</span>
            </h6>
            <div className="row g-0 border rounded-1">
              {/* Left Column */}
              <div className="col-sm-6 border-right-divider">
                <table className="table table-borderless slip-subtable mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-semibold text-dark width-40 bg-light-gray"><i className="ti ti-hash text-primary me-2" />Appointment ID</td>
                      <td className="width-5">:</td>
                      <td className="fw-bold text-dark">{appointment.appointmentCode || "—"}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-calendar text-primary me-2" />Appointment Date</td>
                      <td>:</td>
                      <td className="text-dark">{apptDate}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-clock text-primary me-2" />Appointment Time</td>
                      <td>:</td>
                      <td className="text-dark fw-bold">{apptTime}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-circle-check text-primary me-2" />Status</td>
                      <td>:</td>
                      <td>
                        <span className="badge bg-success text-white px-2 py-0.5 fs-10 text-uppercase fw-bold">
                          {appointment.status || "CONFIRMED"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column */}
              <div className="col-sm-6">
                <table className="table table-borderless slip-subtable mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-semibold text-dark width-40 bg-light-gray"><i className="ti ti-user text-primary me-2" />Doctor Name</td>
                      <td className="width-5">:</td>
                      <td className="text-primary fw-bold text-truncate">
                        {appointment.doctor?.fullName?.startsWith("Dr.") ? appointment.doctor.fullName : `Dr. ${appointment.doctor?.fullName || ""}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-briefcase text-primary me-2" />Department</td>
                      <td>:</td>
                      <td className="text-dark text-truncate">{appointment.doctor?.department?.name || "General"}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-file-text text-primary me-2" />Visit Type</td>
                      <td>:</td>
                      <td className="text-dark text-truncate">
                        {appointment.isFollowUp ? "Follow-up" : "First Consultation"} {appointment.mode && `(${appointment.mode})`}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark bg-light-gray"><i className="ti ti-calendar-event text-primary me-2" />Generated On</td>
                      <td>:</td>
                      <td className="text-muted text-truncate">{slipGenDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section: Session Details */}
          {isSessionAppointment && sessionServices.length > 0 && (
            <div className="slip-section mb-2">
              <h6 className="section-header-title text-center mb-2">
                <span className="title-text">SESSION DETAILS</span>
              </h6>
              <div className="row g-0 border rounded-1">
                <div className="col-12">
                  <table className="table table-borderless slip-subtable mb-0 w-100">
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-dark width-30 bg-light-gray">
                          <i className="ti ti-settings text-primary me-2" />Selected Services
                        </td>
                        <td className="width-5">:</td>
                        <td className="text-dark fw-bold">
                          {sessionServices.map((s: any) => s.serviceName).join(", ")}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-dark width-30 bg-light-gray">
                          <i className="ti ti-calendar text-primary me-2" />Session Date Range
                        </td>
                        <td>:</td>
                        <td className="text-dark fw-bold">
                          {sessionStartDate?.format("DD MMMM YYYY (dddd)")} <span className="mx-1 text-muted">to</span> {sessionEndDate?.format("DD MMMM YYYY (dddd)")} 
                          {totalSessionDays > 0 && ` (${totalSessionDays} Days)`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Patient Details */}
          <div className="slip-section mb-2">
            <h6 className="section-header-title text-center mb-2">
              <span className="title-text">PATIENT DETAILS</span>
            </h6>
            <div className="row g-0 border rounded-1">
              {/* Left Patient Column */}
              <div className="col-sm-6 border-right-divider">
                <table className="table table-borderless slip-subtable mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-semibold text-dark width-40"><i className="ti ti-user text-muted me-2" />Patient Name</td>
                      <td className="width-5">:</td>
                      <td className="fw-bold text-dark text-truncate">{patientName}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-id text-muted me-2" />Patient ID</td>
                      <td>:</td>
                      <td className="text-dark">{patientCode}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-phone text-muted me-2" />Mobile Number</td>
                      <td>:</td>
                      <td className="text-dark">{patientPhone}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-gender-transgender text-muted me-2" />Gender</td>
                      <td>:</td>
                      <td className="text-dark">{patientGender}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-calendar text-muted me-2" />Age</td>
                      <td>:</td>
                      <td className="text-dark">{patientAge}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-droplet text-muted me-2" />Blood Group</td>
                      <td>:</td>
                      <td className="fw-bold text-danger">{patientBloodGroup}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Patient Column */}
              <div className="col-sm-6">
                <table className="table table-borderless slip-subtable mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-semibold text-dark width-40"><i className="ti ti-map-pin text-muted me-2" />Address</td>
                      <td className="width-5">:</td>
                      <td className="text-dark text-truncate">{patientAddress}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-arrow-up-right text-muted me-2" />Referred By</td>
                      <td>:</td>
                      <td className="text-dark">{patientReferredBy}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-phone-call text-muted me-2" />Emergency Contact</td>
                      <td>:</td>
                      <td className="text-dark">{patientEmergencyContact}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-mail text-muted me-2" />Email ID</td>
                      <td>:</td>
                      <td className="text-dark text-truncate">{patientEmail}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-briefcase text-muted me-2" />Occupation</td>
                      <td>:</td>
                      <td className="text-dark">{patientOccupation}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold text-dark"><i className="ti ti-heart text-muted me-2" />Marital Status</td>
                      <td>:</td>
                      <td className="text-dark">{patientMaritalStatus}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section: Visit Information */}
          <div className="slip-section mb-2">
            <h6 className="section-header-title text-center mb-2">
              <span className="title-text">VISIT INFORMATION</span>
            </h6>
            <div className="visit-info-box p-2 border rounded-1">
              <p className="fw-bold text-dark fs-12 mb-1">Chief Complaint / Purpose of Visit</p>
              <div className="ruled-lines mt-1">
                <div className="ruled-line fs-12 px-2 text-dark fw-medium" style={{ minHeight: "20px", height: "auto", borderBottom: "none" }}>
                  {appointment?.reason || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Notes & Signature Footer */}
          <div className="row align-items-end mt-2 pt-1 mb-4">
            {/* Important Notes */}
            <div className="col-sm-7">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="ti ti-clipboard-list text-success fs-18" />
                <h6 className="fw-bold mb-0 text-success fs-12 tracking-wide text-uppercase">Important Notes</h6>
              </div>
              <ul className="important-notes-list fs-11 text-dark ps-3 mb-0">
                <li>Please arrive 15 minutes before your appointment time.</li>
                <li>Carry previous prescriptions, reports and ID proof.</li>
                <li>Follow-up validity: 7 Days (if applicable).</li>
                <li>Appointment timing may vary depending on patient load.</li>
                <li>In case you are unable to attend, please inform us in advance.</li>
              </ul>
            </div>
            
            {/* Signature & Seal */}
            <div className="col-sm-5 mt-3 mt-sm-0 d-flex justify-content-end align-items-end">
              <div className="text-center w-100">
                <p className="fs-11 text-dark mb-0 fw-semibold">For {clinicName.toUpperCase()}</p>
                <div className="signature-area border-bottom-dashed py-2 my-1" style={{ minHeight: "40px" }}>
                  {/* Authorized Signature spacing */}
                </div>
                <p className="fs-12 text-dark fw-bold mb-0">Authorized Signature</p>
              </div>
            </div>
          </div>

        </div>

        {/* Global Dark Blue Footer */}
        <div className="slip-footer mt-auto py-3 text-white">
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col-sm-4 text-center text-sm-start mb-2 mb-sm-0">
                <div>
                  <h6 className="fw-bold mb-0 text-white fs-13">{clinicName}</h6>
                  <p className="mb-0 text-white-50 fs-10">{clinicTagline}</p>
                </div>
              </div>
              <div className="col-sm-4 text-center mb-2 mb-sm-0 border-left-divider-white border-right-divider-white px-2">
                {hasRealAddress && (
                  <p className="mb-0 text-white-50 fs-10 d-flex align-items-center justify-content-center gap-1">
                    <i className="ti ti-map-pin fs-12 text-white" /> {hasRealAddress}
                  </p>
                )}
              </div>
              <div className="col-sm-4 text-center text-sm-end fs-10 text-white-50">
                {(hasRealPhone || hasRealAltPhone) && (
                  <p className="mb-1">
                    <i className="ti ti-phone fs-11 text-white" /> {hasRealPhone ? hasRealPhone : ""}
                    {hasRealPhone && hasRealAltPhone ? " | " : ""}
                    {hasRealAltPhone ? hasRealAltPhone : ""}
                  </p>
                )}
                {hasRealEmail && (
                  <p className="mb-0">
                    <i className="ti ti-mail fs-11 text-white" /> {hasRealEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .appointment-slip-card {
          width: 21cm;
          height: auto;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          position: relative;
          display: flex;
          flex-direction: column;
          background: white !important;
          border: none !important;
          overflow: hidden !important;
        }
        
        .appointment-slip-container {
          padding: 0.5cm 0.6cm 0 0.6cm;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 6px;
          position: relative;
          z-index: 1;
        }

        .slip-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 350px;
          height: 350px;
          opacity: 0.08 !important;
          pointer-events: none;
          z-index: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .slip-watermark img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          opacity: 0.08 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Pure Dark Black Highlight for Print and Screen */
        .appointment-slip-card *, 
        .appointment-slip-card p, 
        .appointment-slip-card span, 
        .appointment-slip-card div, 
        .appointment-slip-card td, 
        .appointment-slip-card h2, 
        .appointment-slip-card h6,
        .appointment-slip-card li,
        .appointment-slip-card i {
          color: #000000 !important;
          font-weight: 650 !important;
        }

        .appointment-slip-card h2.clinic-title {
          font-size: 20px;
          font-weight: 900 !important;
          color: #000000 !important;
        }

        .appointment-slip-card p.clinic-tagline {
          font-size: 11px;
          font-weight: 700 !important;
          color: #000000 !important;
        }

        /* Exception for watermark, must not be forced to solid black */
        .slip-watermark,
        .slip-watermark img {
          color: transparent !important;
        }

        /* Exception for footer text color */
        .slip-footer, 
        .slip-footer *, 
        .slip-footer h6, 
        .slip-footer p, 
        .slip-footer i {
          color: #ffffff !important;
          font-weight: 500 !important;
        }

        .slip-footer h6 {
          font-weight: 750 !important;
        }

        /* Exception for status badge text color */
        .badge {
          color: #ffffff !important;
          font-weight: 800 !important;
        }

        .border-bottom-solid {
          border-bottom: 2px solid #000000 !important;
        }

        .border-right-divider {
          border-right: 1.5px solid #000000 !important;
        }

        .border-right-divider-white {
          border-right: 1px solid rgba(255,255,255,0.2) !important;
        }

        .border-left-divider-white {
          border-left: 1px solid rgba(255,255,255,0.2) !important;
        }

        .section-header-title {
          font-size: 9.5px;
          font-weight: 900 !important;
          letter-spacing: 1.5px;
          color: #000000 !important;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px !important;
        }

        .section-header-title::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 1.5px;
          background: #000000 !important;
          z-index: 1;
        }

        .section-header-title .title-text {
          background: #fff;
          padding: 0 15px;
          position: relative;
          z-index: 2;
        }

        .slip-table {
          border: 1.5px solid #000000 !important;
          border-color: #000000 !important;
        }

        .slip-table td {
          padding: 3px 6px !important;
          vertical-align: middle;
          font-size: 10.5px;
          border: 1px solid #000000 !important;
        }

        .bg-light-gray {
          background-color: #f1f5f9 !important;
          font-weight: 850 !important;
        }

        .width-30 { width: 30%; }
        .width-40 { width: 40%; }
        .width-5 { width: 5%; }

        .slip-subtable td {
          padding: 1.5px 6px !important;
          font-size: 9.5px !important;
          line-height: 1.15 !important;
        }

        .slip-subtable td i {
          font-size: 10px !important;
          vertical-align: middle !important;
          width: 14px;
          display: inline-block;
          text-align: center;
          margin-right: 6px;
        }

        .visit-info-box {
          border: 1.5px solid #000000 !important;
          background-color: transparent !important;
          padding: 6px 10px !important;
        }

        .ruled-line {
          height: 16px !important;
          border-bottom: 1px solid #000000 !important;
        }

        .important-notes-list {
          line-height: 1.2;
        }

        .important-notes-list li {
          margin-bottom: 0px;
          font-size: 10px;
        }

        .border-bottom-dashed {
          border-bottom: 1px dashed #000000 !important;
        }

        .seal-circle {
          width: 40px !important;
          height: 40px !important;
          border: 1px dashed #000000 !important;
          border-radius: 50%;
        }

        .slip-footer {
          background-color: #0f243e !important;
          margin-top: 25px !important;
        }

        /* Print Override Layout styles */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body * {
            visibility: hidden !important;
          }
          
          .appointment-slip-card, .appointment-slip-card * {
            visibility: visible !important;
          }

          .appointment-slip-card {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: hidden !important;
          }

          .slip-footer {
            width: 100% !important;
            margin-top: 25px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .bg-light-gray {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .badge {
            border: 1px solid #27ae60 !important;
            background-color: #27ae60 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
};

export default AppointmentPrintSlip;
