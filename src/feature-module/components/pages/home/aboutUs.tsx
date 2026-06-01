import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import "./homePage.scss";

const AboutUs = () => {
    const siteSettings = { whatsapp: "+919876543210", phone: "+919876543210" };

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

            {/* ── OUR STORY ──────────────────────────────── */}
            <section className="dy-about" style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container dy-about-grid">
                    <div className="dy-about-img">
                        <img src="/clinic-illustration.png" alt="Clinic building" style={{ width: '100%', maxWidth: '400px' }} />
                    </div>
                    <div className="dy-about-content">
                        <div style={{ background: '#f0fdfa', color: '#00c3ff', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '1.2rem' }}>OUR STORY</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 850, color: '#1a233a', marginBottom: '1.5rem', textAlign: 'left' }}>Why We Built DocYori</h2>
                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>Healthcare professionals spend too much time managing paperwork, appointments, staff, and administrative tasks.</p>
                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>We created DocYori to simplify clinic operations through a single, easy-to-use platform that allows healthcare providers to focus more on patient care and less on clinic management.</p>
                        <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '2rem' }}>Our goal is to help clinics become more organized, productive, and digitally empowered.</p>
                        <div style={{ fontSize: '1.2rem', fontWeight: 850, color: '#007bff' }}>Smarter Care, Better Health.</div>
                    </div>
                </div>
            </section>

            {/* ── OUR JOURNEY (Timeline style) ───────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ background: '#f0f7ff', color: '#007bff', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '1rem' }}>OUR JOURNEY</div>
                    </div>
                    <div className="dy-journey-row">
                        {[
                            { icon: 'ti ti-search', title: 'Identify Challenges', desc: 'Understanding the real problems faced by clinics every day.' },
                            { icon: 'ti ti-edit-circle', title: 'Design Solutions', desc: 'Designing smart workflows and digital solutions for every department.' },
                            { icon: 'ti ti-code', title: 'Build DocYori', desc: 'Developing a complete clinic management platform.' },
                            { icon: 'ti ti-chart-arrows', title: 'Empower Clinics', desc: 'Helping clinics grow with better management and smarter decisions.' },
                        ].map((s, i) => (
                            <div key={i} className="dy-journey-item">
                                <div style={{ width: 70, height: 70, background: '#fff', border: `2px solid ${i === 2 ? '#007bff' : '#f0f7ff'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem', color: i === 2 ? '#007bff' : '#6b7280', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                                    <i className={s.icon} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#007bff', fontWeight: 800, marginBottom: '0.5rem' }}>0{i + 1}</div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 850, color: '#1a233a', marginBottom: '0.5rem' }}>{s.title}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── OUR MISSION & VISION ───────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container">
                    <div className="dy-mission-grid">
                        <div style={{ border: '1px solid #eaedf1', background: '#fff', borderRadius: '12px', padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '3rem', color: '#007bff' }}><i className="ti ti-target" /></div>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '1px' }}>OUR MISSION</h4>
                                <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 500, color: '#1a233a', lineHeight: 1.5 }}>To simplify clinic management through technology and automation, allowing healthcare professionals to focus on what matters most — patient care.</p>
                            </div>
                        </div>
                        <div style={{ border: '1px solid #eaedf1', background: '#f0fdfa', borderRadius: '12px', padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '3rem', color: '#00c3ff' }}><i className="ti ti-eye" /></div>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#00c3ff', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '1px' }}>OUR VISION</h4>
                                <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: 500, color: '#1a233a', lineHeight: 1.5 }}>To become a trusted healthcare technology partner for clinics across India and empower every healthcare provider with modern digital tools.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHAT WE OFFER ──────────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div className="dy-tag-sm center">WHAT WE OFFER</div>
                    <h2 className="dy-sec-h2" style={{ marginBottom: '2.5rem' }}>Complete Healthcare Management Solution</h2>
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
                                <div style={{ width: 45, height: 45, background: '#f0f7ff', color: '#007bff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', margin: '0 auto 1.2rem' }}><i className={f.icon} /></div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: '#1a233a', marginBottom: '0.5rem' }}>{f.title}</h4>
                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
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
                        <img src="/clinic-illustration.png" alt="Ready" />
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
            <footer className="dy-footer" id="contact">
                <div className="dy-container dy-footer-grid">
                    <div className="dy-footer-brand">
                        <img src="/logo-main.png" alt="DocYori" />
                        <p>All-in-one clinic management software to automate operations, manage staff, and deliver better patient care.</p>
                        <div className="dy-socials">
                            <a href="#"><i className="ti ti-brand-facebook" /></a>
                            <a href="#"><i className="ti ti-brand-twitter" /></a>
                            <a href="#"><i className="ti ti-brand-linkedin" /></a>
                            <a href="#"><i className="ti ti-brand-youtube" /></a>
                        </div>
                    </div>
                    <div className="dy-footer-col">
                        <h5>PRODUCT</h5>
                        <ul>
                            <li><Link to={all_routes.home + "#features"}>Features</Link></li>
                            <li><Link to={all_routes.home + "#modules"}>Modules</Link></li>
                            <li><a href="#pricing">Pricing</a></li>
                        </ul>
                    </div>
                    <div className="dy-footer-col">
                        <h5>COMPANY</h5>
                        <ul>
                            <li><Link to={all_routes.aboutUs}>About Us</Link></li>
                            <li><Link to={all_routes.contactUs}>Contact Us</Link></li>
                        </ul>
                    </div>
                    <div className="dy-footer-col">
                        <h5>LEGAL</h5>
                        <ul>
                            <li><Link to={all_routes.privacyPolicyFront}>Privacy Policy</Link></li>
                            <li><Link to={all_routes.termsCondition || "#"}>Terms & Conditions</Link></li>
                            <li><a href="#">Refund Policy</a></li>
                        </ul>
                    </div>
                    <div className="dy-footer-col">
                        <h5>SUPPORT</h5>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Customer Support</a></li>
                        </ul>
                    </div>
                    <div className="dy-footer-col">
                        <h5>CONTACT</h5>
                        <ul>
                            <li><a href="mailto:hello@docyori.com"><i className="ti ti-mail" />hello@docyori.com</a></li>
                            <li><a href={`tel:${siteSettings.phone}`}><i className="ti ti-phone" />{siteSettings.phone}</a></li>
                            <li><a href="https://www.docyori.com"><i className="ti ti-world" />www.docyori.com</a></li>
                        </ul>
                    </div>
                </div>
                <div className="dy-footer-bottom">
                    <p>© {new Date().getFullYear()} DocYori. All Rights Reserved.</p>
                </div>
            </footer>
            <FloatingActions />
        </div>
    );
};

export default AboutUs;
