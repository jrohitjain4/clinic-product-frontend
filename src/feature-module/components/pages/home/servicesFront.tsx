import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import CtaBanner from "./CtaBanner";
import "./homePage.scss";

const CORE_SERVICES = [
  { icon: "ti-users", name: "Patient Management", desc: "Manage patient records, medical history, documents, and communications efficiently." },
  { icon: "ti-calendar-event", name: "Appointment Management", desc: "Schedule appointments, manage queues, send reminders, and reduce no-shows." },
  { icon: "ti-user", name: "Doctor Management", desc: "Manage doctor profiles, schedules, availability, consultation fees, and specializations." },
  { icon: "ti-currency-rupee", name: "Accounts & Finance", desc: "Track income, expenses, invoices, payments, and financial reports with ease." },
  { icon: "ti-users-group", name: "HR & Payroll Management", desc: "Manage attendance, leaves, payroll, staff records, and HR operations seamlessly." },
  { icon: "ti-box", name: "Asset Management", desc: "Track clinic assets, equipment, and resources to ensure smooth operations." },
];

const ADDITIONAL_SERVICES = [
  { i: 'ti-users', l: 'Staff Management' },
  { i: 'ti-calendar-event', l: 'Department Management' },
  { i: 'ti-clipboard-list', l: 'Attendance Tracking' },
  { i: 'ti-users', l: 'Leave Management' },
  { i: 'ti-shield-check', l: 'Holiday Management' },
  { i: 'ti-receipt', l: 'Payroll Processing' },
  { i: 'ti-file-text', l: 'Application Tracking' },
  { i: 'ti-list-check', l: 'To-Do Management' },
  { i: 'ti-message', l: 'Notes & Communication' },
  { i: 'ti-stethoscope', l: 'Services & Products' },
  { i: 'ti-star', l: 'Specializations Management' },
  { i: 'ti-chart-pie', l: 'Reports & Analytics' }
];

const SERVICES_FEATURES = [
  'Increase operational efficiency',
  'Improve staff productivity',
  'Enhance patient satisfaction',
  'Reduce manual work and paperwork',
  'Make data-driven decisions'
];

const DIAGRAM_NODES = [
  { l: 'Smart Automation', x: '-180', y: '-100', align: 'end', icon: 'ti-settings' },
  { l: 'Better Patient Care', x: '180', y: '-100', align: 'start', icon: 'ti-heart-handshake' },
  { l: 'Real-time Reports', x: '180', y: '0', align: 'start', icon: 'ti-chart-bar' },
  { l: 'Dedicated Support', x: '180', y: '100', align: 'start', icon: 'ti-headset' },
  { l: 'Cloud-Based Access', x: '-180', y: '100', align: 'end', icon: 'ti-cloud' },
  { l: 'Secure Data', x: '-180', y: '0', align: 'end', icon: 'ti-shield-lock' }
];

const ServicesFront = () => {

  return (
    <div className="dy-landing">
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
                OUR SERVICES
              </div>
              
              <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '3.2rem', lineHeight: 1.25, marginBottom: '20px', letterSpacing: '-1px' }}>
                Comprehensive Services<br />
                For <span style={{ color: '#0ea5e9' }}>Modern Clinics</span>
              </h1>
              
              <p className="fs-15 lh-lg" style={{ color: '#334155', marginBottom: '25px', maxWidth: '540px' }}>
                DocYori provides a complete suite of services designed to simplify clinic operations, improve patient care, and help healthcare professionals grow their practice.
              </p>
              
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to={all_routes.registerbasic} className="btn btn-primary d-inline-flex align-items-center justify-content-center" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px' }}>
                  Start Free Trial <i className="ti ti-arrow-right ms-2" />
                </Link>
                <Link to="#demo" className="btn btn-outline-info d-inline-flex align-items-center justify-content-center bg-white" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', border: '1px solid #0ea5e9', color: '#0ea5e9' }}>
                  Book Live Demo <i className="ti ti-player-play ms-2" />
                </Link>
              </div>

              {/* Features line */}
              <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                  <i className="ti ti-circle-check fs-18 text-info" /> All-In-One Solution
                </div>
                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                  <i className="ti ti-shield-check fs-18 text-success" /> Secure & Reliable
                </div>
                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                  <i className="ti ti-users fs-18 text-primary" /> Easy to Use
                </div>
                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                  <i className="ti ti-headset fs-18 text-info" /> 24/7 Support
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-6 position-relative">
              <img src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Hospital Services" className="w-100 h-auto rounded-4 d-block bg-white" style={{ border: '2px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', objectFit: 'cover', maxHeight: '500px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE SERVICES ────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>WHAT WE OFFER</div>
          <h2 className="fw-bold text-center text-dark mb-3" style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a' }}>Our Core Services</h2>
          <p className="text-center mx-auto mb-4" style={{ color: '#475569', maxWidth: '600px' }}>
            Everything you need to manage your clinic efficiently from one powerful platform.
          </p>

          <div className="d-flex flex-wrap flex-lg-nowrap gap-3">
            {CORE_SERVICES.map((m, i) => (
              <div key={i} className="flex-fill bg-white border p-4 rounded-4 d-flex flex-column text-start shadow-sm" style={{ minWidth: '180px', borderColor: '#e2e8f0', flex: '1 1 0px' }}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-4" style={{ width: 48, height: 48, background: i % 2 === 0 ? '#2563eb' : '#0d9488', color: '#fff', flexShrink: 0 }}>
                  <i className={`ti ${m.icon} fs-24`} />
                </div>
                <h5 className="fw-bold mb-2 text-dark" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{m.name}</h5>
                <p className="text-muted fs-13 mb-4 flex-grow-1" style={{ color: '#475569', lineHeight: '1.5' }}>{m.desc}</p>
                <div className="fw-bold" style={{ color: i % 2 === 0 ? '#2563eb' : '#0d9488', fontSize: '13px', cursor: 'pointer' }}>
                  Learn More <i className="ti ti-arrow-right ms-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADDITIONAL SERVICES (GRID) ──────────── */}
      <section className="py-4" style={{ background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="fw-bold fs-12 mb-2 text-uppercase text-center letter-spacing-1" style={{ color: '#2563eb' }}>ADDITIONAL SERVICES</div>
          <h2 className="fw-bold text-center text-dark mb-5" style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a' }}>Everything You Need To Run A Clinic</h2>
          
          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3">
            {ADDITIONAL_SERVICES.map((item, idx) => (
              <div key={idx} className="col">
                <div className="bg-white border rounded-4 d-flex flex-column align-items-center justify-content-center text-center p-4 h-100 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                  <i className={`ti ${item.i} mb-3`} style={{ fontSize: '32px', color: '#2563eb' }} />
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '13px', color: '#0f172a', lineHeight: '1.4' }}>{item.l}</h6>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART SERVICES (BENEFITS & CIRCLE) ────────── */}
      <section className="py-5 bg-white">
        <div className="container" style={{ maxWidth: '1320px' }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1" style={{ color: '#2563eb' }}>WHY CHOOSE DOCYORI SERVICES?</div>
              <h2 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', lineHeight: '1.25' }}>Smart Services For Better Healthcare</h2>
              <p className="fs-15 lh-lg mb-4" style={{ color: '#334155' }}>
                Our services are built with the goal of simplifying clinic operations and enhancing patient experiences.
              </p>
              <div className="d-flex flex-column gap-3">
                {SERVICES_FEATURES.map((b, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 fs-15 fw-semibold" style={{ color: '#0f172a' }}>
                    <i className="ti ti-circle-check fs-20" style={{ color: '#2563eb' }} /> {b}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Circle Diagram Mockup */}
            <div className="col-lg-7">
              {/* Desktop version (absolute positioning) */}
              <div className="d-none d-lg-flex position-relative align-items-center justify-content-center" style={{ height: '400px' }}>
                {/* Connecting Lines SVG */}
                <svg className="position-absolute" style={{ width: '100%', height: '100%', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
                  {DIAGRAM_NODES.map((node, i) => {
                    const cx = '50%';
                    const cy = '50%';
                    const nx = `calc(50% + ${node.x}px)`;
                    const ny = `calc(50% + ${node.y}px)`;
                    return (
                      <path key={i} d={`M ${cx} ${cy} L ${nx} ${ny}`} stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
                    );
                  })}
                </svg>

                <div className="bg-white rounded-circle border shadow-sm d-flex align-items-center justify-content-center" style={{ width: '150px', height: '150px', borderColor: '#e2e8f0', zIndex: 2, border: '2px solid #2563eb' }}>
                  <img src="/logo.png" alt="DocYori" style={{ width: '70%', height: 'auto', objectFit: 'contain' }} />
                </div>

                {DIAGRAM_NODES.map((node, i) => (
                  <div key={i} className="position-absolute d-flex align-items-center gap-2 bg-white border rounded-pill shadow-sm px-3 py-2" style={{ transform: `translate(${node.x}px, ${node.y}px)`, borderColor: '#e2e8f0', zIndex: 2, flexDirection: node.align === 'end' ? 'row-reverse' : 'row' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, color: '#2563eb', background: '#eff6ff' }}>
                      <i className={`ti ${node.icon} fs-18`} />
                    </div>
                    <span className="fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>{node.l}</span>
                  </div>
                ))}
              </div>

              {/* Mobile version (flex col) */}
              <div className="d-flex d-lg-none flex-column gap-3 mt-5">
                 <div className="bg-white rounded-circle border shadow-sm mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '120px', height: '120px', borderColor: '#e2e8f0', border: '2px solid #2563eb' }}>
                  <img src="/logo.png" alt="DocYori" style={{ width: '70%', height: 'auto', objectFit: 'contain' }} />
                </div>
                {DIAGRAM_NODES.map((node, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-center gap-3 bg-white border rounded-pill shadow-sm px-4 py-3 mx-auto" style={{ borderColor: '#e2e8f0', width: '100%', maxWidth: '300px' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, color: '#2563eb', background: '#eff6ff' }}>
                      <i className={`ti ${node.icon} fs-20`} />
                    </div>
                    <span className="fw-bold flex-grow-1 text-center" style={{ fontSize: '14px', color: '#0f172a' }}>{node.l}</span>
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

export default ServicesFront;
