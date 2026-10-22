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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    .patient-dashboard-wrapper {
      background-color: #F8FAFC !important;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      color: #0f172a;
    }
    .patient-dashboard-wrapper .content {
      background: transparent !important;
      padding: 32px 32px 20px 32px !important;
      max-width: 1600px;
      margin: 0 auto;
    }
    /* Premium Hero Cards */
    .patient-dashboard-wrapper .hero-card {
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      width: 100%;
    }
    .patient-dashboard-wrapper .hero-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
      border-color: rgba(203, 213, 225, 1);
    }
    .patient-dashboard-wrapper .hero-card-bg-glow {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
    }
    .patient-dashboard-wrapper .hero-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      z-index: 1;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.05);
    }
    .patient-dashboard-wrapper .hero-val {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -1px;
      color: #0f172a;
      margin-top: 16px;
      margin-bottom: 4px;
      z-index: 1;
      position: relative;
      line-height: 1.1;
    }
    .patient-dashboard-wrapper .hero-title {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      z-index: 1;
      position: relative;
    }
    .patient-dashboard-wrapper .hero-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 6px;
      z-index: 1;
      position: relative;
    }

    /* Analytics Cards */
    .patient-dashboard-wrapper .analytic-card {
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
      margin-bottom: 24px;
      overflow: hidden;
      transition: all 0.3s ease;
      height: 100%;
      width: 100%;
    }
    .patient-dashboard-wrapper .analytic-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0,0,0,0.04);
      border-color: rgba(203, 213, 225, 1);
    }
    .patient-dashboard-wrapper .analytic-card-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(241, 245, 249, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }
    .patient-dashboard-wrapper .analytic-card-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .patient-dashboard-wrapper .analytic-card-body {
      padding: 24px;
    }

    /* Buttons & Badges */
    .patient-dashboard-wrapper .btn-premium {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
      color: white !important;
      border: none !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
      font-weight: 600 !important;
      padding: 10px 20px !important;
      border-radius: 10px !important;
      transition: all 0.3s ease !important;
    }
    .patient-dashboard-wrapper .btn-premium:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35) !important;
    }
    .patient-dashboard-wrapper .badge-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      z-index: 1;
      position: relative;
    }
    .patient-dashboard-wrapper .badge-trend.up { background: #dcfce7; color: #059669; }
    .patient-dashboard-wrapper .badge-trend.down { background: #fee2e2; color: #e11d48; }
    .patient-dashboard-wrapper .badge-soft {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      z-index: 1;
      position: relative;
    }

    /* Animations */
    .patient-dashboard-wrapper .fade-in-up {
      animation: patientFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    @keyframes patientFadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }
    .patient-dashboard-wrapper .delay-1 { animation-delay: 0.1s; }
    .patient-dashboard-wrapper .delay-2 { animation-delay: 0.2s; }
    .patient-dashboard-wrapper .delay-3 { animation-delay: 0.3s; }
    .patient-dashboard-wrapper .delay-4 { animation-delay: 0.4s; }
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
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4 fade-in-up">
            <div>
              <h4 className="fw-bold mb-1" style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#0f172a' }}>Patient Dashboard</h4>
              <p className="mb-0" style={{ color: '#64748b', fontSize: '15px' }}>Welcome back to your health portal.</p>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <button
                type="button"
                className="btn-premium d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowAddAppointment(true)}
              >
                <i className="ti ti-plus" />
                New Appointment
              </button>
            </div>
          </div>
          {/* End Page Header */}
          {/* row start */}
          <div className="row g-4 mb-4">
            {/* Total Appointments */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#3b82f6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <i className="ti ti-calendar-heart" />
                  </div>
                  <span className="badge-trend up">+95%</span>
                </div>
                <div>
                  <div className="hero-val">{totalAppointments}</div>
                  <div className="hero-title">Total Appointments</div>
                  <div className="hero-sub">in last 7 Days</div>
                </div>
              </div>
            </div>
            {/* Total Clinics */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ef4444' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
                    <i className="ti ti-building-hospital" />
                  </div>
                  <span className="badge-trend down">-15%</span>
                </div>
                <div>
                  <div className="hero-val">{totalClinics}</div>
                  <div className="hero-title">Total Clinics</div>
                  <div className="hero-sub">in last 7 Days</div>
                </div>
              </div>
            </div>
            {/* Blood Pressure */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#f59e0b' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <i className="ti ti-activity" />
                  </div>
                  {profile?.details?.vitals?.bp && (
                    <span className="badge-soft" style={{ color: '#f59e0b', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>Normal</span>
                  )}
                </div>
                <div>
                  <div className="hero-val">{profile?.details?.vitals?.bp || "—"}</div>
                  <div className="hero-title">Blood Pressure</div>
                  <div className="hero-sub">{profile?.details?.vitals?.bp ? "Last recorded vital sign" : "No vital data recorded"}</div>
                </div>
              </div>
            </div>
            {/* Heart Rate */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#10b981' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <i className="ti ti-heartbeat" />
                  </div>
                  {profile?.details?.vitals?.heartRate && (
                    <span className="badge-soft" style={{ color: '#10b981', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>Good</span>
                  )}
                </div>
                <div>
                  <div className="hero-val">
                    {profile?.details?.vitals?.heartRate ? `${profile.details.vitals.heartRate} bpm` : "—"}
                  </div>
                  <div className="hero-title">Heart Rate</div>
                  <div className="hero-sub">{profile?.details?.vitals?.heartRate ? "Last recorded vital sign" : "No vital data recorded"}</div>
                </div>
              </div>
            </div>
            {/* Total Doctors */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-1">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#8b5cf6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <i className="ti ti-stethoscope" />
                  </div>
                  <span className="badge-soft" style={{ color: '#8b5cf6', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>Active</span>
                </div>
                <div>
                  <div className="hero-val">{doctors?.length || 0}</div>
                  <div className="hero-title">Total Doctors</div>
                  <div className="hero-sub">Your consulted doctors</div>
                </div>
              </div>
            </div>
            {/* Prescriptions */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-2">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#14b8a6' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#f0fdfa', color: '#0d9488' }}>
                    <i className="ti ti-prescription" />
                  </div>
                  <span className="badge-soft" style={{ color: '#14b8a6', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1' }}>New</span>
                </div>
                <div>
                  <div className="hero-val">{prescriptions?.length || 0}</div>
                  <div className="hero-title">Prescriptions</div>
                  <div className="hero-sub">Total issued prescriptions</div>
                </div>
              </div>
            </div>
            {/* Total Invoices */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-3">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#ec4899' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                    <i className="ti ti-file-invoice" />
                  </div>
                  <span className="badge-soft" style={{ color: '#ec4899', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}>Paid</span>
                </div>
                <div>
                  <div className="hero-val">{invoices?.length || 0}</div>
                  <div className="hero-title">Total Invoices</div>
                  <div className="hero-sub">All billing records</div>
                </div>
              </div>
            </div>
            {/* Glucose Level */}
            <div className="col-xxl-3 col-xl-6 col-md-6 col-12 d-flex fade-in-up delay-4">
              <div className="hero-card">
                <div className="hero-card-bg-glow" style={{ background: '#0ea5e9' }}></div>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="hero-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <i className="ti ti-droplet" />
                  </div>
                  {profile?.details?.vitals?.glucose && (
                    <span className="badge-soft" style={{ color: '#0ea5e9', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>Normal</span>
                  )}
                </div>
                <div>
                  <div className="hero-val">
                    {profile?.details?.vitals?.glucose ? `${profile.details.vitals.glucose} mg/dl` : "—"}
                  </div>
                  <div className="hero-title">Glucose Level</div>
                  <div className="hero-sub">{profile?.details?.vitals?.glucose ? "Last recorded vital sign" : "No vital data recorded"}</div>
                </div>
              </div>
            </div>
          </div>
          {/* row start */}
          <div className="row g-4 mb-4">
            {/* Block 1: Recent Invoices */}
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex fade-in-up delay-1">
              <div className="analytic-card flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#dbeafe', color: '#2563eb', boxShadow: 'none' }}>
                      <i className="ti ti-file-invoice" />
                    </div>
                    Recent Invoices
                  </h3>
                  <Link to="#" className="text-decoration-none fs-13 fw-medium" style={{ color: '#4f46e5' }}>View All</Link>
                </div>
                <div className="analytic-card-body">
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
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex fade-in-up delay-2">
              <div className="analytic-card flex-fill mb-0">
                <div className="analytic-card-header">
                  <h3 className="analytic-card-title">
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#ecfdf5', color: '#059669', boxShadow: 'none' }}>
                      <i className="ti ti-building-hospital" />
                    </div>
                    Clinic List
                  </h3>
                  <Link to="#" className="text-decoration-none fs-13 fw-medium" style={{ color: '#4f46e5' }}>View All</Link>
                </div>
                <div className="analytic-card-body">
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
            <div className="col-xxl-4 col-xl-4 col-lg-4 d-flex fade-in-up delay-3">
              <div className="analytic-card flex-fill mb-0" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)' }}>
                <div className="analytic-card-header border-bottom-0 pb-0">
                  <h3 className="analytic-card-title" style={{ color: '#4f46e5' }}>
                    <div className="hero-icon-box" style={{ width: '32px', height: '32px', fontSize: '16px', background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                      <i className="ti ti-calendar-plus" />
                    </div>
                    Schedule Appointment
                  </h3>
                </div>
                <div className="analytic-card-body d-flex flex-column align-items-center justify-content-center text-center p-4">
                  <div className="mb-4 bg-primary-transparent rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px', backgroundColor: '#e0e7ff' }}>
                    <i className="ti ti-calendar-plus" style={{ fontSize: '36px', color: '#4f46e5' }}></i>
                  </div>
                  <h5 className="fw-bold mb-2">Book a New Visit</h5>
                  <p className="text-muted fs-13 mb-4 px-3">Quickly schedule an appointment with your preferred doctor or clinic in just a few clicks.</p>
                  
                  <button 
                    type="button" 
                    className="btn-premium btn-lg w-100 rounded-pill d-flex align-items-center justify-content-center gap-2" 
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
