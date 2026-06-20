import { Link } from "react-router";
import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import AppointmentFormPage from "../../clinic-modules/appointment-form/appointmentFormPage";
import SCol8Chart from "./chart/scol8Chart";
import SCol9Chart from "./chart/scol9Chart";
import SCol10Chart from "./chart/scol10Chart";
import Modals from "./modals/modals";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import { useClinics } from "../../../../../core/hooks/useClinics";
import { all_routes, doctorDetailsPath } from "../../../../routes/all_routes";
import { apiUrl } from "../../../../../core/config/api";

const PatientDashboard = () => {
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const { clinics } = useClinics();
  const { appointments } = useClinicAppointments();
  const { doctors } = useClinicDoctors();
  const { prescriptions } = usePrescriptions();
  const { invoices } = useClinicInvoices();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch patient profile", err);
      }
    };
    fetchMe();
  }, []);

  const totalAppointments = appointments?.length || 0;
  const totalClinics = clinics?.length || 0;
  const recentAppointments = appointments?.slice(0, 5) || [];

  const localStyles = `
    .patient-dashboard-wrapper .card {
      margin-bottom: 12px !important;
    }
    .patient-dashboard-wrapper .card-body .mb-3 {
      margin-bottom: 10px !important;
    }
  `;

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <style>{localStyles}</style>
      <div className="page-wrapper patient-dashboard-wrapper">
        <div className="content pb-0">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-0">Patient Dashboard</h4>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center justify-content-center fw-semibold px-3 py-2 text-white shadow-sm"
                onClick={() => setShowAddAppointment(true)}
                style={{ borderRadius: '8px', fontSize: '13px', minHeight: '38px', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                <i className="ti ti-plus ms-2 order-2" />
                New Appointment
              </button>
            </div>
          </div>
          {/* End Page Header */}
          {/* row start */}
          <div className="row g-2">
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#3b82f6' }}>
                        <i className="ti ti-calendar-heart fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Appointments</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{totalAppointments}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>+95%</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>in last 7 Days</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#ef4444' }}>
                        <i className="ti ti-building-hospital fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Clinics</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{totalClinics}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>-15%</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>in last 7 Days</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#f59e0b' }}>
                        <i className="ti ti-activity fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Blood Pressure</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{profile?.details?.vitals?.bp || "—"}</h4>
                      </div>
                    </div>
                    {profile?.details?.vitals?.bp && (
                      <span className="badge fw-semibold" style={{ color: '#f59e0b', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Normal</span>
                    )}
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{profile?.details?.vitals?.bp ? "Last recorded vital sign" : "No vital data recorded"}</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#10b981' }}>
                        <i className="ti ti-heartbeat fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Heart Rate</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>
                          {profile?.details?.vitals?.heartRate ? `${profile.details.vitals.heartRate} bpm` : "—"}
                        </h4>
                      </div>
                    </div>
                    {profile?.details?.vitals?.heartRate && (
                      <span className="badge fw-semibold" style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Good</span>
                    )}
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{profile?.details?.vitals?.heartRate ? "Last recorded vital sign" : "No vital data recorded"}</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#8b5cf6' }}>
                        <i className="ti ti-stethoscope fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Doctors</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{doctors?.length || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#8b5cf6', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Active</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Your consulted doctors</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#14b8a6' }}>
                        <i className="ti ti-prescription fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Prescriptions</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{prescriptions?.length || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#14b8a6', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>New</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Total issued prescriptions</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#ec4899' }}>
                        <i className="ti ti-file-invoice fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Total Invoices</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>{invoices?.length || 0}</h4>
                      </div>
                    </div>
                    <span className="badge fw-semibold" style={{ color: '#ec4899', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Paid</span>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>All billing records</p>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: '44px', height: '44px', backgroundColor: '#0ea5e9' }}>
                        <i className="ti ti-droplet fs-22 text-white" />
                      </div>
                      <div>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>Glucose Level</p>
                        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '22px' }}>
                          {profile?.details?.vitals?.glucose ? `${profile.details.vitals.glucose} mg/dl` : "—"}
                        </h4>
                      </div>
                    </div>
                    {profile?.details?.vitals?.glucose && (
                      <span className="badge fw-semibold" style={{ color: '#0ea5e9', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', padding: '3px 8px', fontSize: '10px' }}>Normal</span>
                    )}
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{profile?.details?.vitals?.glucose ? "Last recorded vital sign" : "No vital data recorded"}</p>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row start */}
          <div className="row g-2">
            {/* Block 1: Recent Invoices */}
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Recent Invoices</h5>
                  <Link to="#" className="text-primary fs-13 fw-medium text-decoration-none">View All</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-borderless align-middle mb-0">
                      <tbody>
                        {invoices.slice(0, 4).map((inv: any) => {
                          const statusLabel = inv.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid';
                          const statusClass = inv.paymentStatus === 'Paid' ? 'text-success bg-success-transparent' : 'text-danger bg-danger-transparent';
                          const description = inv.items?.[0]?.description || 'Consultation';
                          return (
                            <tr key={inv.id} className="border-bottom">
                              <td className="ps-0 py-3">
                                <div className="d-flex align-items-center">
                                  <span className="avatar avatar-md bg-light rounded-3 text-dark d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                    <i className="ti ti-receipt fs-20" />
                                  </span>
                                  <div>
                                    <h6 className="fs-14 fw-semibold mb-1">{inv.invoiceCode || `#${inv.id?.slice(0, 6).toUpperCase()}`}</h6>
                                    <p className="mb-0 fs-13 text-muted">{description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-end pe-0 py-3">
                                <h6 className="fs-14 fw-semibold mb-1">${(inv.totalAmount ?? 0).toFixed(2)}</h6>
                                <span className={`badge fs-11 py-1 px-2 ${statusClass} border rounded fw-medium`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {invoices.length === 0 && (
                          <tr><td colSpan={2} className="text-center text-muted py-3">No invoices found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Clinic List */}
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Clinic List</h5>
                  <Link to="#" className="text-primary fs-13 fw-medium text-decoration-none">View All</Link>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    {(clinics || []).slice(0, 3).map((clinic: any, idx: number) => {
                      const colors = ['primary', 'info', 'success', 'warning', 'danger'];
                      const badgeColor = colors[idx % colors.length];
                      const location = [clinic.addressLine1, clinic.city, clinic.state]
                        .filter(Boolean)
                        .join(", ") || "No address specified";
                      return (
                        <div key={clinic.id} className="d-flex align-items-center p-3 border rounded-3 bg-light-transparent hover-bg-light transition-all">
                          <div className="avatar avatar-lg rounded-3 bg-white border d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                            <i className={`ti ti-building-hospital fs-24 text-${badgeColor}`} />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="fs-14 fw-semibold mb-1 text-dark">{clinic.name}</h6>
                            <p className="fs-12 text-muted mb-1 d-flex align-items-center">
                              <i className="ti ti-map-pin me-1 text-danger"></i>
                              {location}
                            </p>
                          </div>
                          <Link to="#" className="btn btn-sm btn-outline-primary rounded-pill fs-12 px-3 py-1 text-nowrap">View</Link>
                        </div>
                      );
                    })}
                    {(!clinics || clinics.length === 0) && (
                      <div className="text-center text-muted py-3">No clinics found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Schedule Appointment */}
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex">
              <div className="card flex-fill w-100 shadow-sm border-primary" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)' }}>
                <div className="card-header d-flex align-items-center justify-content-between border-bottom-0 pb-0">
                  <h5 className="fw-bold mb-0 text-primary">Schedule Appointment</h5>
                </div>
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center p-4">
                  <div className="mb-4 bg-primary-transparent rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px', backgroundColor: '#e0e7ff' }}>
                    <i className="ti ti-calendar-plus text-primary" style={{ fontSize: '36px' }}></i>
                  </div>
                  <h5 className="fw-bold mb-2">Book a New Visit</h5>
                  <p className="text-muted fs-13 mb-4 px-3">Quickly schedule an appointment with your preferred doctor or clinic in just a few clicks.</p>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm" 
                    onClick={() => setShowAddAppointment(true)}
                  >
                    <i className="ti ti-plus fs-18"></i> Book Appointment Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Docyori
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />

      {/* Success Modal */}
      <div className="modal custom-modal fade" id="appointment_success_modal" role="dialog" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-body text-center p-5">
              <div className="mb-4 d-flex justify-content-center">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: '#ecfdf5' }}>
                  <i className="ti ti-check fs-40 text-success" />
                </div>
              </div>
              <h4 className="fw-bold mb-3 text-dark">Appointment Scheduled!</h4>
              <p className="text-muted fs-15 mb-4">
                Your appointment request has been successfully recorded.
              </p>
              <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px dashed #ced4da' }}>
                <p className="mb-1 text-dark fw-medium">Please call the clinic to confirm your booking:</p>
                <h5 className="mb-0 text-primary fw-bold mt-2 d-flex align-items-center justify-content-center gap-2">
                  <i className="ti ti-phone-call" /> +1 234 567 890
                </h5>
              </div>
              <button type="button" className="btn btn-primary btn-lg w-100 rounded-pill" data-bs-dismiss="modal">
                Understood, Thanks!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      <div className={`modal custom-modal fade ${showAddAppointment ? "show d-block" : "d-none"}`} role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">New Appointment</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddAppointment(false)}></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {showAddAppointment && (
                <AppointmentFormPage
                  mode="create"
                  isModal={true}
                  onSuccess={() => {
                    setShowAddAppointment(false);
                    // trigger the success modal
                    const modalEl = document.getElementById("appointment_success_modal");
                    if (modalEl) {
                      modalEl.classList.add("show", "d-block");
                      modalEl.setAttribute("aria-hidden", "false");
                      modalEl.style.display = "block";

                      // Handle close
                      const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']");
                      if (closeBtn) {
                        closeBtn.addEventListener("click", () => {
                          modalEl.classList.remove("show", "d-block");
                          modalEl.setAttribute("aria-hidden", "true");
                          modalEl.style.display = "none";
                          window.location.reload();
                        });
                      }
                    } else {
                      window.location.reload();
                    }
                  }}
                  onCancel={() => setShowAddAppointment(false)}
                  onClose={() => setShowAddAppointment(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showAddAppointment && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
    </>
  );
};

export default PatientDashboard;
