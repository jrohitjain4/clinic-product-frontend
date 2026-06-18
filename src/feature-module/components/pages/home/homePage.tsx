import { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import { DemoBookingModal } from "./DemoBookingModal";
import CtaBanner from "./CtaBanner";
import "./homePage.scss";

const ABOUT_ICONS = [
  { icon: "ti ti-file-text", name: "Patient Records" },
  { icon: "ti ti-calendar", name: "Appointment Scheduling" },
  { icon: "ti ti-users", name: "Doctor Management" },
  { icon: "ti ti-briefcase", name: "HR & Payroll" },
  { icon: "ti ti-wallet", name: "Accounts & Finance" },
  { icon: "ti ti-box", name: "Asset Tracking" },
];

const MODULES = [
  { icon: "ti ti-users", name: "Patient Management", desc: "Manage records, history, documents and patient profiles." },
  { icon: "ti ti-calendar-event", name: "Appointment Management", desc: "Schedule appointments, manage queues, and reduce no-shows." },
  { icon: "ti ti-user", name: "Doctor Management", desc: "Manage doctor profiles, schedules, and consultation fees." },
  { icon: "ti ti-currency-rupee", name: "Accounts & Finance", desc: "Track income, expenses, invoices and payment transactions." },
  { icon: "ti ti-users", name: "HRM", desc: "Manage attendance, leaves, payroll and employee performance." },
  { icon: "ti ti-users-group", name: "Staff Management", desc: "Organise staff information, roles and responsibilities." },
];

const STEPS = [
  { no: "01", icon: "ti ti-building-hospital", title: "Create Your Clinic", desc: "Set up clinic details and departments." },
  { no: "02", icon: "ti ti-user-plus", title: "Add Doctors & Staff", desc: "Manage doctors, schedules, and employees." },
  { no: "03", icon: "ti ti-calendar-plus", title: "Manage Appointments", desc: "Start accepting and organizing appointments." },
  { no: "04", icon: "ti ti-chart-arrows", title: "Grow Your Practice", desc: "Track performance and improve operations." },
];

const WHY = [
  { icon: "ti ti-layout-dashboard", title: "Centralized Management", desc: "Manage everything from a single dashboard." },
  { icon: "ti ti-clock", title: "Save Time", desc: "Automate tasks and reduce manual paperwork." },
  { icon: "ti ti-heart-handshake", title: "Improve Patient Experience", desc: "Deliver faster and more organized services." },
  { icon: "ti ti-shield-lock", title: "Secure & Reliable", desc: "Advanced data protection and role-based access." },
  { icon: "ti ti-chart-arrows", title: "Scalable Platform", desc: "Suitable for both small clinics and large healthcare centers." },
  { icon: "ti ti-device-mobile", title: "Easy To Use", desc: "Simple interface for doctors, receptionists, and admins." },
];

const FAQS = [
  { q: "Is DocYori suitable for small clinics?", a: "Absolutely! DocYori is designed for clinics of all sizes, from solo practitioners to large healthcare centers." },
  { q: "Can I manage multiple doctors?", a: "Yes, you can easily add, manage, and schedule multiple doctors and staff members from the single dashboard." },
  { q: "Does DocYori include payroll management?", a: "Yes, our HR & Payroll module helps you manage employee attendance, leaves, and salary processing seamlessly." },
  { q: "Can patients book appointments online?", a: "Yes, patients can book appointments directly through your clinic's landing page provided by DocYori." },
  { q: "Is training provided?", a: "We provide comprehensive video tutorials, documentation, and dedicated onboarding support to help you get started." },
  { q: "Is my clinic data secure?", a: "Security is our top priority. DocYori uses enterprise-grade encryption to protect your sensitive patient data." },
];

const TESTIMONIALS = [
  { quote: "DocYori has transformed the way we manage appointments and patient records. It is very efficient.", name: "Dr. Anita Verma", role: "Clinic Owner", img: "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=80" },
  { quote: "Managing doctors, staff, and finances is now effortless. Everything is available in one place.", name: "Dr. Priya Sharma", role: "Dental Specialist", img: "https://images.pexels.com/photos/5214949/pexels-photo-5214949.jpeg?auto=compress&cs=tinysrgb&w=80" },
  { quote: "The software is simple, professional, and perfectly suited for modern clinics.", name: "Dr. Rahul Mehta", role: "Physiotherapist", img: "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=80" },
];

const HomePage = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="dy-landing" style={{ overflowX: 'hidden' }}>
      <DemoBookingModal />
      <NavbarFront />

      {/* ── HERO ───────────────────────────────── */}
      <section className="dy-hero position-relative" style={{ padding: '2.5rem 0 10rem 0', background: 'radial-gradient(circle at 0% 100%, #e0f2fe 0%, #f8fafc 60%, #ffffff 100%)', overflow: 'hidden' }}>
        
        {/* Bottom Curve SVG */}
        <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '100%', overflow: 'hidden', lineHeight: 0, zIndex: 0 }}>
          <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto', minHeight: '150px' }}>
            <defs>
              <pattern id="dyDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#94a3b8" opacity="0.4"/>
              </pattern>
            </defs>
            <rect x="0" y="100" width="250" height="200" fill="url(#dyDots)" />
            <path fill="#e0f2fe" fillOpacity="0.8" d="M0,160L80,176C160,192,320,224,480,213.3C640,203,800,149,960,138.7C1120,128,1280,160,1360,176L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
            <path fill="#ffffff" fillOpacity="1" d="M0,224L80,234.7C160,245,320,267,480,250.7C640,235,800,181,960,149.3C1120,117,1280,107,1360,101.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1320px' }}>
          <div className="row align-items-center">
            {/* LEFT */}
            <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
              <div className="dy-hero-tag" style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                SMART CLINIC MANAGEMENT SOFTWARE
              </div>
              
              <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1.25, marginBottom: '20px', letterSpacing: '-1px' }}>
                Manage Your Entire Clinic<br />
                From One <span style={{ color: '#0ea5e9' }}>Powerful Platform</span>
              </h1>
              
              <p className="fs-15 lh-lg" style={{ color: '#334155', marginBottom: '25px', maxWidth: '540px' }}>
                DocYori helps healthcare providers manage patients, appointments, doctors, staff, payroll, and finances while delivering a seamless patient experience.
              </p>
              
              <div className="d-flex flex-nowrap gap-2 mb-4 w-100">
                <Link to={all_routes.registerbasic} className="btn btn-primary d-inline-flex flex-fill align-items-center justify-content-center" style={{ padding: '12px 10px', fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 600, borderRadius: '8px', whiteSpace: 'nowrap' }}>
                  Start Free Trial <i className="ti ti-arrow-right ms-1 ms-sm-2" />
                </Link>
                <Link to="#demo" className="btn btn-outline-info d-inline-flex flex-fill align-items-center justify-content-center bg-white" style={{ padding: '12px 10px', fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 600, borderRadius: '8px', border: '1px solid #0ea5e9', color: '#0ea5e9', whiteSpace: 'nowrap' }}>
                  Book Live Demo <i className="ti ti-player-play ms-1 ms-sm-2" />
                </Link>
              </div>

              {/* Features line */}
              <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap mt-2">
                <div className="d-flex align-items-center gap-1 fs-12 fs-sm-13 fw-bold text-secondary">
                  <i className="ti ti-circle-check fs-16 fs-sm-18 text-info" /> Easy Setup
                </div>
                <div className="d-flex align-items-center gap-1 fs-12 fs-sm-13 fw-bold text-secondary">
                  <i className="ti ti-shield-check fs-16 fs-sm-18 text-success" /> Secure Data
                </div>
                <div className="d-flex align-items-center gap-1 fs-12 fs-sm-13 fw-bold text-secondary">
                  <i className="ti ti-users fs-16 fs-sm-18 text-primary" /> Multi-Doctor Support
                </div>
                <div className="d-flex align-items-center gap-1 fs-12 fs-sm-13 fw-bold text-secondary">
                  <i className="ti ti-cloud fs-16 fs-sm-18 text-info" /> Cloud Based
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-6 position-relative">
              <img src="/hero-image.png" alt="Dashboard Mockup" className="w-100 h-auto rounded-4 d-block bg-white" style={{ border: '4px solid #0ea5e9', boxShadow: '0 20px 45px rgba(14, 165, 233, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.15)' }} />
              
              {/* Horizontal Floating Cards */}
              <div className="d-none d-lg-flex flex-wrap flex-md-nowrap justify-content-center" style={{ position: 'absolute', bottom: '-45px', left: '50%', transform: 'translateX(-50%)', gap: '10px', zIndex: 2, width: '105%' }}>
                
                <div className="bg-white shadow-sm" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '130px' }}>
                  <div style={{ background: '#eef2ff', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                    <i className="ti ti-calendar-event fs-20 m-auto" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>New Appointment</div>
                    <div className="d-flex align-items-baseline gap-1">
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>+24</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Today</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-sm" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '130px' }}>
                  <div style={{ background: '#e0f2fe', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                    <i className="ti ti-user fs-20 m-auto" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Patient Registered</div>
                    <div className="d-flex align-items-baseline gap-1">
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>+18</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Today</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-sm" style={{ padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '130px' }}>
                  <div style={{ background: '#ccfbf1', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                    <i className="ti ti-wallet fs-20 m-auto" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Received</div>
                    <div className="d-flex align-items-baseline gap-1">
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>₹45,600</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Today</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ──────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-5 text-center">
              <img src="/Doc_new.png" alt="Clinic Setup" className="img-fluid" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
            <div className="col-lg-7">
              <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1" style={{ color: '#2563eb' }}>ABOUT DOCYORI</div>
              <h2 className="fw-bold mb-3 text-dark" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, color: '#0f172a', lineHeight: '1.25' }}>Everything Your Clinic<br/>Needs in <span style={{ color: '#0ea5e9' }}>One Platform</span></h2>
              <p className="fs-15 lh-base mb-4" style={{ color: '#334155' }}>
                DocYori is a complete clinic management solution designed for modern healthcare providers. Whether you operate a single clinic or manage multiple locations, DocYori helps simplify daily operations and improve patient care.
              </p>
              
              <div className="d-flex flex-wrap flex-lg-nowrap gap-2 justify-content-between">
                {ABOUT_ICONS.map((i, idx) => (
                  <div key={idx} className="flex-fill text-center p-3 bg-white border rounded-3 d-flex flex-column align-items-center justify-content-center shadow-sm" style={{ minWidth: '100px', borderColor: '#e2e8f0', borderRadius: '12px' }}>
                    <i className={`${i.icon} text-primary fs-24 mb-2`} />
                    <div className="fw-semibold text-dark" style={{ fontSize: '11px', lineHeight: '1.3' }}>{i.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────── */}
      <section className="py-4" style={{ background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>TAKE YOUR CLINIC ONLINE</div>
          <h2 className="fw-bold text-center text-dark mb-5" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.2rem)', fontWeight: 800, color: '#0f172a' }}>In 4 <span style={{ color: '#0ea5e9' }}>Simple Steps</span></h2>
          
          <div className="row position-relative g-4">
            {/* Desktop Connecting Line */}
            <div className="d-none d-lg-block position-absolute" style={{ top: '40px', left: '12%', right: '12%', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
            
            {STEPS.map((s, i) => (
              <div key={i} className="col-lg-3 col-md-6 text-center position-relative" style={{ zIndex: 1 }}>
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center border border-2 border-primary mb-3" style={{ width: 80, height: 80, color: '#2563eb' }}>
                  <i className={`${s.icon} fs-32`} />
                </div>
                <div className="fw-bold fs-12 mb-2 text-uppercase" style={{ color: '#2563eb' }}>STEP {s.no}</div>
                <h5 className="fw-bold mb-2 text-dark">{s.title}</h5>
                <p className="fs-14 mb-0" style={{ color: '#475569' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>OUR CORE MODULES</div>
          <h2 className="fw-bold text-center text-dark mb-4" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, color: '#0f172a' }}>Powerful Modules Built For <span style={{ color: '#0ea5e9' }}>Modern Clinics</span></h2>
          
          <div className="d-flex flex-wrap flex-lg-nowrap gap-3">
            {MODULES.map((m, i) => (
              <div key={i} className="flex-fill bg-white border p-4 rounded-4 d-flex flex-column text-start shadow-sm" style={{ minWidth: '180px', borderColor: '#e2e8f0', flex: '1 1 0px' }}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-4" style={{ width: 48, height: 48, background: i % 2 === 0 ? '#2563eb' : '#0d9488', color: '#fff', flexShrink: 0 }}>
                  <i className={`${m.icon} fs-24`} />
                </div>
                <h5 className="fw-bold mb-2 text-dark" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{m.name}</h5>
                <p className="text-muted fs-13 mb-4 flex-grow-1" style={{ color: '#475569', lineHeight: '1.5' }}>{m.desc}</p>
                <div style={{ color: i % 2 === 0 ? '#2563eb' : '#0d9488' }}><i className="ti ti-arrow-right fs-20" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES ───────────────────────── */}
      <section className="py-4" style={{ background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>EVERYTHING INCLUDED</div>
          <h2 className="fw-bold text-center text-dark mb-4" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, color: '#0f172a' }}>All The Features <span style={{ color: '#0ea5e9' }}>You Need</span></h2>
          
          <div className="row g-4">
            {/* HR Card */}
            <div className="col-lg-6">
              <div className="card h-100 border shadow-sm rounded-4 overflow-hidden bg-white" style={{ borderColor: '#e2e8f0' }}>
                <div className="card-body p-0 d-flex flex-column flex-sm-row">
                  <div className="p-4 d-flex align-items-center justify-content-center" style={{ minWidth: '180px', background: '#eff6ff' }}>
                     <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 80, height: 80, color: '#2563eb' }}>
                       <i className="ti ti-users fs-32" />
                     </div>
                  </div>
                  <div className="p-4 flex-grow-1">
                    <h5 className="fw-bold mb-4 text-dark" style={{ color: '#0f172a', fontSize: '18px' }}>Human Resource Management</h5>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Staffs</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Departments</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Designations</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Attendance</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Leaves</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Holidays</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Payroll</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Applications</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> To Do</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Notes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinic Card */}
            <div className="col-lg-6">
              <div className="card h-100 border shadow-sm rounded-4 overflow-hidden bg-white" style={{ borderColor: '#e2e8f0' }}>
                <div className="card-body p-0 d-flex flex-column flex-sm-row">
                  <div className="p-4 d-flex align-items-center justify-content-center" style={{ minWidth: '180px', background: '#eff6ff' }}>
                     <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 80, height: 80, color: '#2563eb' }}>
                       <i className="ti ti-building-hospital fs-32" />
                     </div>
                  </div>
                  <div className="p-4 flex-grow-1">
                    <h5 className="fw-bold mb-4 text-dark" style={{ color: '#0f172a', fontSize: '18px' }}>Clinic Operations</h5>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Clinic</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Doctors</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Patients</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Appointments</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex flex-column gap-3">
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Services & Medicines</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Specializations</div>
                           <div className="d-flex align-items-center gap-2 fs-14" style={{ color: '#475569' }}><i className="ti ti-circle-check fs-18" style={{ color: '#2563eb' }} /> Assets</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE DOCYORI ────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>WHY CHOOSE DOCYORI</div>
          <h2 className="fw-bold text-center text-dark mb-4" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, color: '#0f172a' }}>Why Clinics Choose <span style={{ color: '#0ea5e9' }}>DocYori</span></h2>
          
          <div className="d-flex flex-wrap flex-lg-nowrap gap-3">
            {WHY.map((w, i) => (
              <div key={i} className="flex-fill bg-white border p-3 rounded-4 text-center shadow-sm d-flex flex-column align-items-center" style={{ minWidth: '140px', borderColor: '#e2e8f0', flex: '1 1 0px' }}>
                <i className={`${w.icon} mb-3`} style={{ fontSize: '40px', color: i % 2 === 0 ? '#2563eb' : '#0d9488' }} />
                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '15px', color: '#0f172a' }}>{w.title}</h6>
                <p className="fs-12 mb-0 px-1" style={{ color: '#475569', lineHeight: '1.4' }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS + FAQ ─────────────────── */}
      <section className="py-4 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="row g-4">
            {/* Testimonials */}
            <div className="col-lg-7">
              <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1" style={{ color: '#2563eb' }}>TESTIMONIALS</div>
              <h2 className="fw-bold mb-4 text-dark" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.2rem)', fontWeight: 800, color: '#0f172a' }}>Trusted By <span style={{ color: '#0ea5e9' }}>Healthcare Professionals</span></h2>
              <div className="row g-3">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="col-md-4">
                    <div className="card h-100 border shadow-sm rounded-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
                      <div className="card-body p-3 d-flex flex-column">
                        <div className="fs-24 mb-3" style={{ color: '#2563eb' }}><i className="ti ti-quote" /></div>
                        <p className="fs-12 flex-grow-1 mb-4" style={{ color: '#475569', lineHeight: '1.6' }}>{t.quote}</p>
                        <div className="d-flex align-items-center gap-2 mt-auto">
                          <img src={t.img} alt={t.name} className="rounded-circle shadow-sm" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '12px', color: '#0f172a' }}>{t.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{t.role}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="col-lg-5">
              <div className="fw-bold fs-12 mb-3 text-uppercase letter-spacing-1" style={{ color: '#2563eb' }}>FREQUENTLY ASKED QUESTIONS</div>
              <div className="border rounded-4 bg-white shadow-sm" style={{ borderColor: '#e2e8f0', marginTop: '38px' }}>
                {FAQS.map((f, i) => (
                  <div key={i} className="border-bottom" style={{ borderColor: '#e2e8f0' }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-100 px-4 py-3 d-flex justify-content-between align-items-center bg-white border-0 text-start"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="fw-bold text-dark" style={{ fontSize: '14px', color: '#0f172a' }}>{f.q}</span>
                      <i className="ti ti-plus" style={{ color: '#0f172a', fontWeight: 'bold', transform: expandedFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-3">
                        <p className="fs-14 text-muted m-0 lh-lg">{f.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────── */}
      <CtaBanner />

      {/* ── FOOTER ─────────────────────────────── */}
      <FooterFront />

      <FloatingActions />
    </div>
  );
};

export default HomePage;
