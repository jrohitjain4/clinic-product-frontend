import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import "./homePage.scss";

const MODULES = [
  { icon: "ti ti-users", name: "Patient\nManagement", desc: "Manage records, history, documents and patient profiles." },
  { icon: "ti ti-calendar-event", name: "Appointment\nManagement", desc: "Schedule appointments, manage queues, and reduce no-shows." },
  { icon: "ti ti-stethoscope", name: "Doctor\nManagement", desc: "Manage doctor profiles, schedules, and consultation fees." },
  { icon: "ti ti-report-money", name: "Accounts &\nFinance", desc: "Track income, expenses, invoices and payment transactions." },
  { icon: "ti ti-id-badge", name: "HRM", desc: "Manage attendance, leaves, payroll and employee performance." },
  { icon: "ti ti-user-check", name: "Staff\nManagement", desc: "Organise staff information, roles and responsibilities." },
];

const STEPS = [
  { no: "01", icon: "ti ti-building-hospital", title: "Create Your Clinic", desc: "Set up clinic details and departments." },
  { no: "02", icon: "ti ti-user-plus", title: "Add Doctors & Staff", desc: "Manage doctors, schedules, and employees." },
  { no: "03", icon: "ti ti-calendar-plus", title: "Manage Appointments", desc: "Start accepting and organising appointments." },
  { no: "04", icon: "ti ti-chart-arrows", title: "Grow Your Practice", desc: "Track performance and improve operations." },
];

const WHY = [
  { icon: "ti ti-layout-dashboard", title: "Centralized Management", desc: "Manage everything from a single dashboard." },
  { icon: "ti ti-clock", title: "Save Time", desc: "Automate tasks and reduce manual paperwork." },
  { icon: "ti ti-heart-handshake", title: "Improve Patient Experience", desc: "Deliver faster and more organised services." },
  { icon: "ti ti-shield-lock", title: "Secure & Reliable", desc: "Advanced data protection and role-based access." },
  { icon: "ti ti-chart-arrows", title: "Scalable Platform", desc: "Suitable for both small clinics and large healthcare centres." },
  { icon: "ti ti-device-mobile", title: "Easy To Use", desc: "Simple interface for doctors, receptionists, and admins." },
];

const FAQS = [
  { q: "Is DocYori suitable for small clinics?" },
  { q: "Can I manage multiple doctors?" },
  { q: "Does DocYori include payroll management?" },
  { q: "Can patients book appointments online?" },
  { q: "Is training provided?" },
  { q: "Is my clinic data secure?" },
];

const TESTIMONIALS = [
  { quote: "DocYori has transformed the way we manage appointments. It is very efficient, and significantly reduced our administration workload.", name: "Dr. Anita Verma", role: "Clinic Owner", img: "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=80" },
  { quote: "Managing doctors, staff, and finances is so effortless. The software is simple, professional and perfectly suited for modern clinics.", name: "Dr. Priya Sharma", role: "Medical Director", img: "https://images.pexels.com/photos/5214949/pexels-photo-5214949.jpeg?auto=compress&cs=tinysrgb&w=80" },
  { quote: "Excellent software that has helped us scale from 1 to 4 branches without any chaos. Customer support is outstanding.", name: "Dr. Rahul Mehta", role: "Senior Doctor", img: "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=80" },
];

const HRM_FEATURES = ["Staffs", "Departments", "Designations", "Attendance", "Leaves", "Holidays", "Payroll", "Appraisals", "To Do", "Notes"];
const CLINIC_FEATURES = ["Clinic", "Services & Products", "Doctors", "Specializations", "Patients", "Assets", "Appointments"];

const APPTS = [
  { time: "09:30 AM", name: "John Doe", type: "General Consultation" },
  { time: "10:00 AM", name: "Priya Sharma", type: "Dental Checkup" },
  { time: "10:30 AM", name: "Rahul Verma", type: "Follow Up" },
  { time: "11:00 AM", name: "Ananya Singh", type: "General Consultation" },
];

import { DemoBookingModal } from "./DemoBookingModal";

const HomePage = () => {

  return (
    <div className="dy-landing">
      <DemoBookingModal />
      <NavbarFront />

      {/* ── HERO ───────────────────────────────── */}
      <section className="dy-hero">
        <div className="dy-hero-wrap">
          {/* LEFT */}
          {/* LEFT */}
          <div className="dy-hero-left" style={{ paddingRight: '2rem' }}>
            <div className="dy-hero-tag" style={{ background: '#eef2ff', color: '#4338ca', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '20px', letterSpacing: '1px' }}>ABOUT DOCYORI</div>
            <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '3.5rem', lineHeight: 1.2, marginBottom: '20px' }}>
              About Us<br />
              <span style={{ color: '#0f172a' }}>Empowering Clinics</span><br />
              <span style={{ color: '#0f172a' }}>For A </span><span style={{ background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Better Tomorrow</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '30px', maxWidth: '500px' }}>
              DocYori is a modern clinic management software built to simplify healthcare operations and help clinics deliver smarter care and better health.
            </p>
            <div className="dy-hero-btns" style={{ display: 'flex', gap: '15px' }}>
              <Link to={all_routes.registerbasic} className="hero-btn-solid" style={{ background: '#2563eb', color: '#fff', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', border: 'none' }}>
                Start Free Trial <i className="ti ti-arrow-right" />
              </Link>
              <Link to="#demo" className="hero-btn-outline" style={{ background: '#fff', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                Book Demo <i className="ti ti-player-play" style={{ color: '#0ea5e9' }} />
              </Link>
            </div>
          </div>

          {/* RIGHT — Dashboard Mockup */}
          <div className="dy-hero-right" style={{ position: 'relative' }}>
            <img src="/hero-image.png" alt="DocYori Dashboard Mockup" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} />
            
            {/* Vertical Floating Cards */}
            <div style={{ position: 'absolute', top: '10%', right: '-30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ background: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', minWidth: '220px' }}>
                <div style={{ color: '#3b82f6' }}><i className="ti ti-building-hospital fs-24" /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Clinics Onboarded</div>
                  <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>500+</div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', minWidth: '220px' }}>
                <div style={{ color: '#3b82f6' }}><i className="ti ti-users fs-24" /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Patients Managed</div>
                  <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>50,000+</div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', minWidth: '220px' }}>
                <div style={{ color: '#3b82f6' }}><i className="ti ti-calendar-event fs-24" /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Appointments</div>
                  <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>1,00,000+</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT / OUR STORY ──────────────────────────────── */}
      <section id="features" style={{ padding: '5rem 0', background: '#fff' }}>
        <div className="dy-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '4rem' }}>
          {/* LEFT Image */}
          <div>
            <img src="/Doc_new.png" alt="DocYori Clinic" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
          {/* RIGHT Content */}
          <div>
            <div style={{ color: '#2563eb', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>OUR STORY</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Why We Built DocYori</h2>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Healthcare professionals spend too much time managing paperwork, appointments, staff, and administrative tasks.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              We created DocYori to simplify clinic operations through a single, easy-to-use platform that allows healthcare providers to focus more on patient care and less on manual management.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
              Our goal is to help clinics become more organized, productive, and digitally empowered.
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, #2563eb, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Smarter Care, Better Health.
            </div>
          </div>
        </div>

        {/* ── OUR JOURNEY ─────────────────────────── */}
        <div className="dy-container" style={{ marginBottom: '2rem' }}>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '3rem 2rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ textAlign: 'center', color: '#2563eb', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3rem' }}>OUR JOURNEY</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {/* Horizontal Line */}
              <div style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', background: '#2563eb', zIndex: -1 }} />

              {[
                { icon: 'ti ti-device-analytics', title: 'Identify Challenges', desc: 'Understanding the real problems faced by clinics every day.', color: '#2563eb' },
                { icon: 'ti ti-edit', title: 'Design Solutions', desc: 'Designing smart workflows and digital solutions for every department.', color: '#2563eb' },
                { icon: 'ti ti-code', title: 'Build DocYori', desc: 'Developing a complete clinic management platform.', color: '#2563eb' },
                { icon: 'ti ti-chart-arrows', title: 'Empower Clinics', desc: 'Helping clinics grow with better management and smarter decisions.', color: '#0ea5e9' },
              ].map((s, i) => (
                <div key={i} style={{ width: '22%', textAlign: 'center', background: '#fff' }}>
                  <div style={{ width: 80, height: 80, background: '#fff', border: `3px solid ${s.color}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem', color: s.color }}>
                    <i className={s.icon} />
                  </div>
                  <div style={{ fontSize: '0.9rem', color: s.color, fontWeight: 800, marginBottom: '0.5rem' }}>0{i + 1}</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{s.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── OUR MISSION & VISION ───────────────────── */}
        <div className="dy-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* MISSION */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '3.5rem', color: '#2563eb', lineHeight: 1 }}><i className="ti ti-target" /></div>
              <div>
                <div style={{ color: '#2563eb', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.8rem' }}>OUR MISSION</div>
                <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  To simplify clinic management through technology and automation, allowing healthcare professionals to focus on what matters most — patient care.
                </p>
              </div>
            </div>

            {/* VISION */}
            <div style={{ background: '#fff', border: '1px solid #e0f2fe', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '3.5rem', color: '#0ea5e9', lineHeight: 1 }}><i className="ti ti-eye" /></div>
              <div>
                <div style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.8rem' }}>OUR VISION</div>
                <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  To become a trusted healthcare technology partner for clinics across India and empower every healthcare provider with modern digital tools.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────── */}
      <section className="dy-steps">
        <div className="dy-container">
          <div className="dy-tag-sm center">TAKE YOUR CLINIC ONLINE</div>
          <h2 className="dy-sec-h2">In 4 Simple Steps</h2>
          <div className="dy-steps-row">
            {STEPS.map((s, i) => (
              <div key={i} className="dy-step">
                <div className={`dy-step-circle${i === 2 ? " active" : ""}`}><i className={s.icon} /></div>
                {i < 3 && <div className="dy-step-line" />}
                <div className="dy-step-tag">STEP {s.no}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ────────────────────────────── */}
      <section className="dy-modules" id="modules">
        <div className="dy-container">
          <div className="dy-tag-sm center">OUR CORE MODULES</div>
          <h2 className="dy-sec-h2">Powerful Modules Built For Modern Clinics</h2>
          <div className="dy-modules-row">
            {MODULES.map((m, i) => (
              <div key={i} className="dy-mod-card">
                <div className="dy-mod-icon"><i className={m.icon} /></div>
                <h4>{m.name}</h4>
                <p>{m.desc}</p>
                <span className="dy-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES ───────────────────────── */}
      <section className="dy-allfeats">
        <div className="dy-container">
          <div className="dy-tag-sm center">EVERYTHING INCLUDES</div>
          <h2 className="dy-sec-h2">All The Features You Need</h2>
          <div className="dy-feats-grid">
            <div className="dy-feat-col">
              <div className="dy-feat-header">
                <div className="dy-feat-icon-wrap"><i className="ti ti-users" /></div>
                <h4>Human Resource Management</h4>
              </div>
              <ul className="dy-feat-list">
                {HRM_FEATURES.map((f, i) => <li key={i}><i className="ti ti-circle-check" />{f}</li>)}
              </ul>
            </div>
            <div className="dy-feat-center-img">
              <img src="https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Features" />
            </div>
            <div className="dy-feat-col">
              <div className="dy-feat-header">
                <div className="dy-feat-icon-wrap green"><i className="ti ti-building-hospital" /></div>
                <h4>Clinic Operations</h4>
              </div>
              <ul className="dy-feat-list">
                {CLINIC_FEATURES.map((f, i) => <li key={i}><i className="ti ti-circle-check" />{f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY DOCYORI ────────────────────────── */}
      <section className="dy-why">
        <div className="dy-container">
          <div className="dy-tag-sm center">WHY CHOOSE DOCYORI</div>
          <h2 className="dy-sec-h2">Why Clinics Choose DocYori</h2>
          <div className="dy-why-grid">
            {WHY.map((w, i) => (
              <div key={i} className="dy-why-card">
                <div className="dy-why-icon"><i className={w.icon} /></div>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS + FAQ ─────────────────── */}
      <section className="dy-tf">
        <div className="dy-container dy-tf-grid">
          {/* Testimonials */}
          <div>
            <div className="dy-tag-sm">TESTIMONIALS</div>
            <h2 className="dy-tf-h2">Trusted By Healthcare Professionals</h2>
            <div className="dy-test-list">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="dy-test-card">
                  <div className="dy-quote-icon">"</div>
                  <p>{t.quote}</p>
                  <div className="dy-test-author">
                    <img src={t.img} alt={t.name} />
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div id="faq">
            <div className="dy-tag-sm">FREQUENTLY ASKED QUESTIONS</div>
            <h2 className="dy-tf-h2">We've Got Answers</h2>
            <div className="dy-faq-list">
              {FAQS.map((f, i) => (
                <details key={i} className="dy-faq-item">
                  <summary>{f.q}<i className="ti ti-chevron-down" /></summary>
                  <p>Yes, DocYori is designed to handle this efficiently and seamlessly for all clinic types and sizes.</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────── */}
      <section className="dy-cta">
        <div className="dy-container dy-cta-grid">
          <div className="dy-cta-img">
            <img src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Ready" />
          </div>
          <div className="dy-cta-text">
            <h2>Ready To Digitize Your Clinic?</h2>
            <p>Join modern healthcare providers who trust DocYori to simplify operations and improve patient care.</p>
            <div className="dy-cta-btns">
              <Link to={all_routes.registerbasic} className="cta-btn-solid">Start Free Trial</Link>
              <Link to="#demo" className="cta-btn-outline">Book Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <FooterFront />

      <FloatingActions />
    </div>
  );
};

export default HomePage;
