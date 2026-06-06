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
          <div className="dy-hero-left">
            <div className="dy-hero-tag">SMART CLINIC MANAGEMENT SOFTWARE</div>
            <h1>
              Manage Your Entire Clinic<br />
              From One <span className="dy-highlight">Powerful Platform</span>
            </h1>
            <p>DocYori helps healthcare providers manage patients, appointments, doctors, staff, payroll, and finances while delivering a seamless patient experience.</p>
            <div className="dy-hero-btns">
              <Link to={all_routes.registerbasic} className="hero-btn-solid">Start Free Trial →</Link>
              <Link to="#demo" className="hero-btn-outline"><i className="ti ti-player-play" />Book Live Demo</Link>
            </div>
            <div className="dy-trust">
              <span><i className="ti ti-circle-check-filled" />Easy Setup</span>
              <span><i className="ti ti-lock-filled" />Secure Data</span>
              <span><i className="ti ti-users" />Multi-Doctor Support</span>
              <span><i className="ti ti-cloud" />Cloud Based</span>
            </div>
          </div>

          {/* RIGHT — Dashboard Mockup */}
          <div className="dy-hero-right">
            <img src="/hero-image.png" alt="DocYori Dashboard Mockup" style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', display: 'block', marginBottom: '30px' }} />
            {/* 3 bottom stat cards */}
            <div className="dy-hero-bottom-cards">
              <div className="dy-hbc blue"><div className="dy-hbc-icon"><i className="ti ti-calendar-plus" /></div><div><div className="dy-hbc-val">+24</div><div className="dy-hbc-lbl">New Appointment Today</div></div></div>
              <div className="dy-hbc teal"><div className="dy-hbc-icon teal"><i className="ti ti-users" /></div><div><div className="dy-hbc-val teal">+18</div><div className="dy-hbc-lbl">Patient Registered Today</div></div></div>
              <div className="dy-hbc orange"><div className="dy-hbc-icon orange"><i className="ti ti-wallet" /></div><div><div className="dy-hbc-val orange">₹ 45,600</div><div className="dy-hbc-lbl">Payment Received Today</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────── */}
      <section className="dy-about" id="features">
        <div className="dy-container dy-about-grid">
          <div className="dy-about-img">
            <img src="https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=800" alt="DocYori Clinic" />
          </div>
          <div className="dy-about-content">
            <div className="dy-tag-sm">ABOUT DOCYORI</div>
            <h2>Everything Your Clinic<br />Needs in One Platform</h2>
            <p>DocYori is a complete clinic management solution designed for modern healthcare providers. Whether you operate a single clinic or manage multiple locations, DocYori helps simplify daily operations and improve patient care.</p>
            <div className="dy-about-icons">
              {[
                { icon: "ti ti-clipboard-list", label: "Patient Records" },
                { icon: "ti ti-calendar-event", label: "Appointment Scheduling" },
                { icon: "ti ti-stethoscope", label: "Doctor Management" },
                { icon: "ti ti-id-badge", label: "HR & Payroll" },
                { icon: "ti ti-report-money", label: "Accounts & Finance" },
                { icon: "ti ti-package", label: "Asset Tracking" },
              ].map((item, i) => (
                <div key={i} className="dy-about-icon">
                  <div className="dy-ai-box"><i className={item.icon} /></div>
                  <span>{item.label}</span>
                </div>
              ))}
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
