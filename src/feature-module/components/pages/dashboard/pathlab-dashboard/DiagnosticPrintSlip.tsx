import React from "react";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";

interface DiagnosticPrintSlipProps {
  booking: any;
}

const DiagnosticPrintSlip: React.FC<DiagnosticPrintSlipProps> = ({ booking }) => {
  if (!booking) return null;

  let loginClinic: any = {};
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    loginClinic = userObj.clinic || {};
  } catch (e) {}

  const clinic = booking.clinic || loginClinic || {};
  const clinicName = clinic.name || booking.clinicName || "Clinic";
  const logoUrl = clinic.landingPage?.logo ? resolveMediaUrl(clinic.landingPage.logo) : '/logo.png';

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
    : (booking.location || "Address");

  return (
    <div className="bg-white p-5 mx-auto" style={{ maxWidth: '800px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: '80px', height: '80px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logoUrl} alt="Clinic Logo" style={{ maxHeight: '60px', maxWidth: '60px', objectFit: 'contain' }} />
          </div>
          <div>
            <h3 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>{clinicName}</h3>
            <p className="text-muted mb-0 small"><i className="ti ti-map-pin me-1" />{clinicAddress}</p>
          </div>
        </div>
        <div className="text-end">
          <h4 className="fw-bold text-primary mb-1">DIAGNOSTIC BOOKING SLIP</h4>
          <span className="badge bg-light text-dark border px-2 py-1 fs-12 fw-bold">#{booking.bookingCode || "Booking"}</span>
          <p className="text-muted small mt-2 mb-0">Generated: {dayjs().format("DD MMM YYYY, hh:mm A")}</p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6">
          <h6 className="fw-bold text-dark text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '1px' }}>Patient Information</h6>
          <div className="bg-light rounded p-3" style={{ border: '1px solid #e9ecef' }}>
            <h5 className="fw-bold text-dark mb-1">{booking.patient?.firstName} {booking.patient?.lastName}</h5>
            <p className="text-muted mb-1 fs-13"><i className="ti ti-id me-1" /> {booking.patient?.patientCode}</p>
            <p className="text-muted mb-1 fs-13"><i className="ti ti-phone me-1" /> {booking.patient?.phone || "N/A"}</p>
            <p className="text-muted mb-0 fs-13"><i className="ti ti-mail me-1" /> {booking.patient?.email || "N/A"}</p>
          </div>
        </div>
        <div className="col-6">
          <h6 className="fw-bold text-dark text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '1px' }}>Booking Information</h6>
          <div className="bg-light rounded p-3" style={{ border: '1px solid #e9ecef' }}>
            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span className="text-muted fs-13">Scheduled Date</span>
              <span className="fw-bold text-dark fs-13">{dayjs(booking.scheduledAt).format("DD MMM YYYY")}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span className="text-muted fs-13">Session / Slot</span>
              <span className="fw-bold text-dark fs-13">{booking.sessionSlot || dayjs(booking.scheduledAt).format("hh:mm A")}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted fs-13">Status</span>
              <span className={`badge ${booking.status === "Cancelled" ? "bg-danger" : booking.status === "Completed" ? "bg-success" : "bg-primary"}`}>{booking.status}</span>
            </div>
          </div>
        </div>
      </div>

      <h6 className="fw-bold text-dark text-uppercase mb-3" style={{ fontSize: '11px', letterSpacing: '1px' }}>Test Details</h6>
      <table className="table table-bordered mb-4">
        <thead className="bg-light">
          <tr>
            <th className="py-2 fs-12 fw-bold text-dark text-uppercase">Diagnostic Test</th>
            <th className="py-2 fs-12 fw-bold text-dark text-uppercase text-center">Category</th>
            <th className="py-2 fs-12 fw-bold text-dark text-uppercase text-end">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 fw-medium text-dark">{booking.test?.name}</td>
            <td className="py-2 text-center text-muted">{booking.test?.category?.name}</td>
            <td className="py-2 text-end fw-bold text-dark">₹{(booking.test?.price || 0).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colSpan={2} className="py-2 text-end text-muted fs-13">Tax (18%)</td>
            <td className="py-2 text-end text-dark fs-13">₹{(booking.tax || 0).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colSpan={2} className="py-2 text-end fw-bold text-dark text-uppercase fs-13">Total Amount</td>
            <td className="py-2 text-end fw-heavy text-primary fs-14">₹{(booking.totalAmount || 0).toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      {booking.remarks && (
        <div className="mb-4">
          <h6 className="fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>Remarks / Instructions</h6>
          <div className="bg-light rounded p-3 border">
            <p className="mb-0 fs-13 text-muted">{booking.remarks}</p>
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 text-center border-top text-muted small">
        <p className="mb-1 fw-bold" style={{ color: '#64748b', letterSpacing: '0.5px' }}>Docyari - Healthcare Management</p>
        <p className="mt-1 opacity-50" style={{ fontSize: '10px' }}>End of Document. Confidential Clinical Document.</p>
      </div>
    </div>
  );
};

export default DiagnosticPrintSlip;
