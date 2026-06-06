import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import "./homePage.scss";

const AboutUs = () => {

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── HERO ───────────────────────────────── */}
            <section className="dy-hero" style={{ background: 'linear-gradient(180deg, #fff 0%, #f0f7ff 100%)' }}>
                <div className="dy-hero-wrap">
                    {/* LEFT */}
                    <div className="dy-hero-left">
                        <div className="dy-hero-tag">ABOUT DOCYORI</div>
                        <h1>
                            About Us Empowering Clinics For A <span className="dy-highlight">Better Tomorrow</span>
                        </h1>
                        <p>
                            DocYori is a modern clinic management software built to simplify healthcare operations and help clinics deliver smarter care and better health.
                        </p>
                        <div className="dy-hero-btns">
                            <Link to={all_routes.registerbasic} className="hero-btn-solid">Start Free Trial <i className="ti ti-arrow-right" /></Link>
                            <Link to="#demo" className="hero-btn-outline">Book Demo <i className="ti ti-player-play" /></Link>
                        </div>
                    </div>

                    {/* RIGHT — Doctor with stats */}
                    <div className="dy-hero-right">
                        <img
                            src="https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=800"
                            alt="Doctor using laptop"
                            className="dy-about-img-main"
                        />
                        {/* Stat Cards over image */}
                        <div className="dy-hero-stats">
                            <div>
                                <div className="dy-stats-icon"><i className="ti ti-building-hospital" /></div>
                                <div><div className="dy-stats-label">Clinics Onboarded</div><div className="dy-stats-value">500+</div></div>
                            </div>
                            <div>
                                <div className="dy-stats-icon"><i className="ti ti-users" /></div>
                                <div><div className="dy-stats-label">Patients Managed</div><div className="dy-stats-value">50,000+</div></div>
                            </div>
                            <div>
                                <div className="dy-stats-icon"><i className="ti ti-calendar-event" /></div>
                                <div><div className="dy-stats-label">Appointments</div><div className="dy-stats-value">1,00,000+</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── OUR STORY ─────────────────────────────── */}
            <section style={{ padding: '5rem 0', background: '#fff' }}>
                <div className="dy-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '4rem' }}>
                    {/* LEFT Image */}
                    <div>
                        <img
                            src="/Doc_new.png"
                            alt="DocYori Clinic"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
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

            {/* ── WHAT WE OFFER ──────────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div className="dy-tag-sm center">WHAT WE OFFER</div>
                    <h2 className="dy-sec-h2" style={{ marginBottom: '0.8rem' }}>Complete Healthcare Management Solution</h2>
                    <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>Everything your clinic needs in one powerful, easy-to-use platform.</p>
                    <div className="dy-why-grid">
                        {[
                            { icon: 'ti ti-users', title: 'Patient Management', desc: 'Maintain complete patient records, history, and documents.' },
                            { icon: 'ti ti-calendar', title: 'Appointment Management', desc: 'Schedule, organize and manage appointments easily.' },
                            { icon: 'ti ti-user-circle', title: 'Doctor Management', desc: 'Manage doctor profiles, schedules, availability and consultation fees.' },
                            { icon: 'ti ti-file-text', title: 'HR & Payroll Management', desc: 'Handle attendance, payroll, leaves and employee records.' },
                            { icon: 'ti ti-receipt', title: 'Accounts & Finance', desc: 'Track incomes, expenses, invoices and payment transactions.' },
                            { icon: 'ti ti-package', title: 'Asset Management', desc: 'Monitor clinic resources, equipment and assets effectively.' },
                        ].map((f, i) => (
                            <div key={i} style={{ padding: '1.5rem', background: '#fff', border: '1px solid #eaedf1', borderRadius: '16px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                                <div style={{ width: 52, height: 52, background: '#f0f7ff', color: '#007bff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.2rem' }}><i className={f.icon} /></div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#1a233a', marginBottom: '0.6rem' }}>{f.title}</h4>
                                <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY CHOOSE DOCYORI ────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container">
                    <div className="dy-tag-sm center">WHY CHOOSE DOCYORI</div>
                    <h2 className="dy-sec-h2">Why Clinics Choose DocYori</h2>
                    <div className="dy-why-grid">
                        {[
                            { icon: 'ti ti-hand-click', title: 'Easy To Use', desc: 'Simple interface for everyone' },
                            { icon: 'ti ti-shield-check', title: 'Secure & Reliable', desc: 'Advanced security to protect your data' },
                            { icon: 'ti ti-cloud', title: 'Cloud Based', desc: 'Access your clinic anytime, anywhere' },
                            { icon: 'ti ti-settings-automation', title: 'Centralized Management', desc: 'Everything managed from one dashboard' },
                            { icon: 'ti ti-chart-arrows', title: 'Scalable Solution', desc: 'Perfect for small clinics to large healthcare centers' },
                            { icon: 'ti ti-headset', title: 'Dedicated Support', desc: 'We are here to support you at every step' },
                        ].map((w, i) => (
                            <div key={i} className="dy-why-card">
                                <div className="dy-why-icon"><i className={w.icon} /></div>
                                <h4>{w.title}</h4>
                                <p>{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────── */}
            <section className="dy-cta">
                <div className="dy-container dy-cta-grid">
                    <div className="dy-cta-img">
                        <img src="https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Ready" style={{ borderRadius: '16px', width: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="dy-cta-text">
                        <h2>Ready To Transform Your Clinic?</h2>
                        <p>Join healthcare professionals who trust DocYori to simplify operations and improve patient care.</p>
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

export default AboutUs;
