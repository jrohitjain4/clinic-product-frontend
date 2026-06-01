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
            <section className="dy-about" style={{ padding: '4rem 0', background: '#fff' }}>
                <div className="dy-container dy-about-grid">
                    <div className="dy-about-img" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <img
                            src="https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg?auto=compress&cs=tinysrgb&w=800"
                            alt="DocYori Clinic Management"
                            style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {[
                                { val: '500+', label: 'Clinics Onboarded', color: '#007bff' },
                                { val: '50K+', label: 'Patients Managed', color: '#00c3ff' },
                                { val: '1L+', label: 'Appointments Done', color: '#7c3aed' },
                                { val: '99%', label: 'Uptime Guaranteed', color: '#059669' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: '#fcfdfe', border: '1px solid #eaedf1', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginTop: '0.2rem' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="dy-about-content">
                        <div style={{ background: '#f0fdfa', color: '#00c3ff', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '1.2rem' }}>OUR STORY</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a233a', marginBottom: '1rem', textAlign: 'left' }}>Why We Built DocYori</h2>
                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '1rem' }}>Healthcare professionals spend too much time managing paperwork, appointments, staff, and administrative tasks — leaving less time for what truly matters: patient care.</p>
                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '1.5rem' }}>We created DocYori to simplify clinic operations through a single, easy-to-use platform that allows healthcare providers to focus more on patient care and less on clinic management.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                            {[
                                'Built specifically for Indian clinics and healthcare providers',
                                'One platform for all departments — appointments, HR, finance, pharmacy',
                                'Real-time insights and reporting for smarter decisions',
                                'Secure, cloud-based and accessible from any device',
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div style={{ width: 22, height: 22, minWidth: 22, background: '#f0f7ff', color: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                                        <i className="ti ti-check" />
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#007bff', letterSpacing: '-0.01em' }}>Smarter Care, Better Health.</div>
                    </div>
                </div>
            </section>

            {/* ── OUR JOURNEY ─────────────────────────── */}
            <section style={{ padding: '4rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ background: '#f0f7ff', color: '#007bff', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '1rem' }}>OUR JOURNEY</div>
                        <h2 className="dy-sec-h2">How DocYori Was Born</h2>
                        <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: '520px', margin: '0.5rem auto 0', lineHeight: 1.6 }}>From identifying real clinic problems to building a world-class solution — here is our path.</p>
                    </div>
                    <div className="dy-journey-row">
                        {[
                            { icon: 'ti ti-search', title: 'Identify Challenges', desc: 'We spent months studying real clinics and understanding the pain points doctors, admins, and staff face every day.' },
                            { icon: 'ti ti-edit-circle', title: 'Design Solutions', desc: 'Designed smart, intuitive workflows and digital solutions tailored for every clinic department.' },
                            { icon: 'ti ti-code', title: 'Build DocYori', desc: 'Developed a complete, scalable clinic management platform from the ground up with modern technology.' },
                            { icon: 'ti ti-chart-arrows', title: 'Empower Clinics', desc: 'Helping clinics across India grow with better management, digital records, and smarter decisions every day.' },
                        ].map((s, i) => (
                            <div key={i} className="dy-journey-item">
                                <div style={{ width: 70, height: 70, background: '#fff', border: `2px solid ${i === 2 ? '#007bff' : '#e0eaff'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem', color: i === 2 ? '#007bff' : '#94a3b8', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                                    <i className={s.icon} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#007bff', fontWeight: 800, marginBottom: '0.5rem' }}>0{i + 1}</div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#1a233a', marginBottom: '0.6rem' }}>{s.title}</h4>
                                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── OUR MISSION & VISION ───────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div className="dy-tag-sm center">OUR PURPOSE</div>
                        <h2 className="dy-sec-h2">Mission &amp; Vision</h2>
                    </div>
                    <div className="dy-mission-grid">
                        <div style={{ border: '1px solid #e0eaff', background: '#f0f7ff', borderRadius: '20px', padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: '3rem', color: '#007bff' }}><i className="ti ti-target" /></div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', color: '#1a233a', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.8rem' }}>Our Mission</h4>
                                <p style={{ fontSize: '0.95rem', margin: 0, color: '#6b7280', lineHeight: 1.7 }}>To simplify clinic management through technology and automation, allowing healthcare professionals to focus on what matters most — patient care and health outcomes.</p>
                            </div>
                        </div>
                        <div style={{ border: '1px solid #ccfbf1', background: '#f0fdfa', borderRadius: '20px', padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: '2.5rem', color: '#00c3ff', minWidth: 48 }}><i className="ti ti-telescope" /></div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', color: '#1a233a', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.8rem' }}>Our Vision</h4>
                                <p style={{ fontSize: '0.95rem', margin: 0, color: '#6b7280', lineHeight: 1.7 }}>To become a trusted healthcare technology partner for clinics across India and empower every healthcare provider with modern digital tools and smarter workflows.</p>
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
