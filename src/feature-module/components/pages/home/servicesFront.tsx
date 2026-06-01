import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import "./homePage.scss";

const ServicesFront = () => {

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── HERO ───────────────────────────────── */}
            <section className="dy-hero" style={{ background: '#fff' }}>
                <div className="dy-hero-wrap">
                    <div className="dy-hero-left">
                        <div className="dy-hero-tag">Our Services</div>
                        <h1>
                            Comprehensive Services For <span className="dy-highlight">Modern Clinics</span>
                        </h1>
                        <p>
                            DocYori provides a complete suite of services designed to simplify clinic operations, improve patient care, and help healthcare professionals grow their practice.
                        </p>
                        <div className="dy-hero-btns">
                            <Link to={all_routes.registerbasic} className="hero-btn-solid">Start Free Trial</Link>
                            <Link to="#demo" className="hero-btn-outline">Book Demo</Link>
                        </div>
                        <div className="dy-trust">
                            {['Quick Install', 'Secure & Reliable', 'Easy to Use', '24/7 Support'].map((t, i) => (
                                <span key={i}>
                                    <i className="ti ti-circle-check-filled" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="dy-hero-right">
                        <img src="/dash-preview.png" alt="Dashboard Preview" className="dy-about-img-main" />
                    </div>
                </div>
            </section>

            {/* ── CORE SERVICES ──────────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span style={{ color: '#007bff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>What We Offer</span>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#1a233a', margin: '0.5rem 0' }}>Our Core Services</h2>
                        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Everything you need to manage your clinic efficiently from one powerful platform.</p>
                    </div>
                    <div className="dy-modules-row">
                        {[
                            { icon: "ti-users", name: "Patient Management", desc: "Manage patient records, medical history, documents, and communication efficiently." },
                            { icon: "ti-calendar-event", name: "Appointment Management", desc: "Schedule appointments, manage queues, send reminders, and reduce no-shows." },
                            { icon: "ti-stethoscope", name: "Doctor Management", desc: "Manage doctor profiles, schedules, availability, and specializations." },
                            { icon: "ti-report-money", name: "Accounts & Finance", desc: "Track income, expenses, invoices, payments, and financial reports with ease." },
                            { icon: "ti-id-badge", name: "HR & Payroll Management", desc: "Manage attendance, leaves, payroll, staff records, and HR operations." },
                            { icon: "ti-package", name: "Asset Management", desc: "Track clinic assets, equipment, and inventory to ensure smooth operations." },
                        ].map((m, i) => (
                            <div key={i} style={{ background: '#fff', padding: '2rem 1.5rem', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', border: '1px solid #f8f9fa', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ width: 60, height: 60, borderRadius: '15px', background: '#004ee6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}><i className={`ti ${m.icon}`} /></div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#1a233a', margin: 0 }}>{m.name}</h4>
                                <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: '0.95rem' }}>{m.desc}</p>
                                <div style={{ color: '#004ee6', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Learn More <i className="ti ti-arrow-right" /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ADDITIONAL SERVICES (GRID) ──────────── */}
            <section style={{ padding: '2.5rem 0', background: '#ecf4ff' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span style={{ color: '#007bff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>Additional Services</span>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#1a233a', margin: '0.5rem 0' }}>Everything You Need To Run A Clinic</h2>
                    </div>
                    <div className="dy-why-grid">
                        {[
                            { i: 'ti-users', l: 'Staff Management' },
                            { i: 'ti-briefcase', l: 'Dept. Management' },
                            { i: 'ti-clock', l: 'Attendance Tracking' },
                            { i: 'ti-calendar-off', l: 'Leave Management' },
                            { i: 'ti-beach', l: 'Holiday Management' },
                            { i: 'ti-receipt', l: 'Payroll Processing' },
                            { i: 'ti-file-text', l: 'App Tracking' },
                            { i: 'ti-list-check', l: 'To-Do Management' },
                            { i: 'ti-message', l: 'Communication' },
                            { i: 'ti-stethoscope', l: 'Services & Products' },
                            { i: 'ti-star', l: 'Specializations' },
                            { i: 'ti-chart-pie', l: 'Reports & Analytics' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: '2rem 1rem', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '1.6rem', color: '#007bff' }}><i className={`ti ${item.i}`} /></div>
                                <h6 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a233a', margin: 0 }}>{item.l}</h6>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SMART SERVICES (BENEFITS & CIRCLE) ────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: '#007bff', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Why Choose DocYori Services?</span>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 850, color: '#1a233a', margin: '0.5rem 0' }}>Smart Services For Better Healthcare</h2>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Our services are built with the goal of simplifying clinic operations and enhancing patient experiences.</p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {[
                                'Increase operational efficiency',
                                'Improve staff productivity',
                                'Enhance patient satisfaction',
                                'Reduce manual work and paperwork',
                                'Make data-driven decisions'
                            ].map((b, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600, color: '#1a233a' }}>
                                    <i className="ti ti-circle-check-filled" style={{ color: '#007bff', fontSize: '1.3rem' }} /> {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Circle Diagram Mockup */}
                    <div style={{ position: 'relative', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '180px', height: '180px', background: '#fff', borderRadius: '50%', border: '2px solid #eaedf1', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                            <img src="/logo-main.png" alt="DocYori" style={{ width: '100px' }} />
                        </div>
                        {/* Nodes */}
                        {[
                            { l: 'Smart Automation', x: 0, y: -200, icon: 'ti-settings' },
                            { l: 'Better Patient Care', x: 200, y: -100, icon: 'ti-heart' },
                            { l: 'Real-time Reports', x: 200, y: 100, icon: 'ti-chart-bar' },
                            { l: 'Dedicated Support', x: 0, y: 200, icon: 'ti-headset' },
                            { l: 'Cloud-Based Access', x: -200, y: 100, icon: 'ti-cloud' },
                            { l: 'Secure Data', x: -200, y: -100, icon: 'ti-lock' }
                        ].map((node, i) => (
                            <div key={i} style={{ position: 'absolute', transform: `translate(${node.x}px, ${node.y}px)`, display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', padding: '0.8rem 1.2rem', borderRadius: '100px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f8f9fa' }}>
                                <div style={{ width: 35, height: 35, borderRadius: '50%', background: '#f0f7ff', color: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className={`ti ${node.icon}`} /></div>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a233a' }}>{node.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────── */}
            <section style={{ padding: '2.5rem 0' }}>
                <div className="dy-container">
                    <div style={{ background: 'linear-gradient(135deg, #004ee6, #00c6ff)', borderRadius: '30px', padding: '1.5rem 3.5rem', display: 'grid', gridTemplateColumns: '0.6fr 1.4fr', alignItems: 'center', gap: '3rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, background: '#fff', padding: '0.8rem', borderRadius: '20px', boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
                            <img src="https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Demo" style={{ width: '100%', borderRadius: '15px', objectFit: 'cover', height: '220px' }} />
                        </div>
                        <div style={{ position: 'relative', zIndex: 2, color: '#fff' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.8rem', lineHeight: 1.25 }}>Ready To Experience The Best Clinic Management Services?</h2>
                            <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '540px' }}>Join hundreds of healthcare professionals who trust DocYori to simplify operations and improve patient care.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button style={{ background: '#fff', color: '#004ee6', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Start Free Trial</button>
                                <button style={{ background: 'transparent', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 800, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.9rem' }}>Book Demo</button>
                            </div>
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

export default ServicesFront;
