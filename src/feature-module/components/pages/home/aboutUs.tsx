import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import CtaBanner from "./CtaBanner";
import "./homePage.scss";

const AboutUs = () => {
    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── HERO ───────────────────────────────── */}
            <section className="position-relative" style={{ padding: '4rem 0', background: 'radial-gradient(circle at 0% 100%, #e0f2fe 0%, #f8fafc 60%, #ffffff 100%)' }}>
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="row align-items-center g-5">
                        {/* LEFT */}
                        <div className="col-lg-6">
                            <div className="fw-bold fs-12 mb-3 text-uppercase letter-spacing-1 bg-primary bg-opacity-10 text-primary d-inline-block px-3 py-1 rounded-pill">ABOUT DOCYORI</div>
                            <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.2, letterSpacing: '-1px' }}>
                                About Us Empowering Clinics For A <span style={{ color: '#0ea5e9' }}>Better Tomorrow</span>
                            </h1>
                            <p className="fs-15 lh-lg" style={{ color: '#334155', marginBottom: '2rem', maxWidth: '500px' }}>
                                DocYori is a modern clinic management software built to simplify healthcare operations and help clinics deliver smarter care and better health.
                            </p>
                            <div className="d-flex gap-3 flex-wrap">
                                <Link to={all_routes.registerbasic} className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px' }}>
                                    Start Free Trial <i className="ti ti-arrow-right" />
                                </Link>
                                <Link to="#demo" className="btn btn-outline-info d-inline-flex align-items-center justify-content-center gap-2 bg-white" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', border: '1px solid #0ea5e9', color: '#0ea5e9' }}>
                                    Book Demo <i className="ti ti-player-play" />
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="col-lg-6 position-relative">
                            <img
                                src="https://images.pexels.com/photos/32752500/pexels-photo-32752500.jpeg"
                                alt="Doctor"
                                className="w-100 h-auto rounded-4 shadow-sm border"
                                style={{ borderColor: '#e2e8f0', objectFit: 'cover', maxHeight: '500px' }}
                            />
                            {/* Stats */}
                            <div className="position-absolute end-0 top-50 translate-middle-y d-none d-lg-flex flex-column gap-3 me-n4">
                                {[
                                    { icon: 'ti ti-building-hospital', label: 'Clinics Onboarded', value: '500+' },
                                    { icon: 'ti ti-users', label: 'Patients Managed', value: '50,000+' },
                                    { icon: 'ti ti-calendar-event', label: 'Appointments', value: '1,00,000+' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center gap-3" style={{ borderColor: '#e2e8f0', minWidth: '220px' }}>
                                        <div className="rounded-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                            <i className={`${stat.icon} fs-20`} />
                                        </div>
                                        <div>
                                            <div className="fw-bold fs-16 text-dark lh-1">{stat.value}</div>
                                            <div className="fs-12 text-muted mt-1">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── OUR STORY ─────────────────────────────── */}
            <section className="py-5 bg-white">
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="row align-items-center g-5 mb-5">
                        {/* LEFT Image */}
                        <div className="col-lg-6">
                            <img
                                src="/Doc_new.png"
                                alt="DocYori Clinic"
                                className="w-100 h-auto rounded-4 shadow-sm border"
                                style={{ borderColor: '#e2e8f0' }}
                            />
                        </div>
                        {/* RIGHT Content */}
                        <div className="col-lg-6">
                            <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-primary">OUR STORY</div>
                            <h2 className="fw-bold text-dark mb-4" style={{ fontSize: '2.4rem', fontWeight: 800 }}>Why We Built <span style={{ color: '#0ea5e9' }}>DocYori</span></h2>
                            <p className="fs-15 lh-lg text-muted mb-3">
                                Healthcare professionals spend too much time managing paperwork, appointments, staff, and administrative tasks.
                            </p>
                            <p className="fs-15 lh-lg text-muted mb-3">
                                We created DocYori to simplify clinic operations through a single, easy-to-use platform that allows healthcare providers to focus more on patient care and less on manual management.
                            </p>
                            <p className="fs-15 lh-lg text-muted mb-4">
                                Our goal is to help clinics become more organized, productive, and digitally empowered.
                            </p>
                            <div className="fw-bold fs-4 text-primary">
                                Smarter Care, Better Health.
                            </div>
                        </div>
                    </div>

                    {/* ── OUR JOURNEY ─────────────────────── */}
                    <div className="bg-white border rounded-4 p-4 p-md-5 shadow-sm mb-5" style={{ borderColor: '#e2e8f0' }}>
                        <div className="text-center mb-5">
                            <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-primary">OUR JOURNEY</div>
                        </div>
                        
                        <div className="row g-4 text-center">
                            {[
                                { icon: 'ti ti-help-circle', title: 'Identify Challenges', desc: 'Understanding the real problems faced by clinics every day.' },
                                { icon: 'ti ti-pencil', title: 'Design Solutions', desc: 'Designing smart workflows and digital solutions for every department.' },
                                { icon: 'ti ti-code', title: 'Build DocYori', desc: 'Developing a complete clinic management platform.' },
                                { icon: 'ti ti-trending-up', title: 'Empower Clinics', desc: 'Helping clinics grow with better management and smarter decisions.' },
                            ].map((s, i) => (
                                <div key={i} className="col-md-6 col-lg-3">
                                    <div className="mx-auto rounded-circle bg-white border d-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80, borderColor: i < 3 ? '#2563eb' : '#0ea5e9', borderWidth: '3px !important', color: i < 3 ? '#2563eb' : '#0ea5e9' }}>
                                        <i className={`${s.icon} fs-32`} />
                                    </div>
                                    <div className="fw-bold mb-2" style={{ color: i < 3 ? '#2563eb' : '#0ea5e9', fontSize: '14px' }}>0{i + 1}</div>
                                    <h4 className="fw-bold text-dark fs-16 mb-2">{s.title}</h4>
                                    <p className="text-muted fs-14 m-0 lh-lg">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── OUR MISSION & VISION ───────────────────── */}
                    <div className="row g-4">
                        {/* MISSION */}
                        <div className="col-lg-6">
                            <div className="bg-white border rounded-4 p-4 shadow-sm d-flex gap-4 h-100" style={{ borderColor: '#e2e8f0' }}>
                                <div className="text-primary flex-shrink-0 mt-1"><i className="ti ti-target fs-32" /></div>
                                <div>
                                    <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-primary">OUR MISSION</div>
                                    <p className="text-muted fs-15 m-0 lh-lg">
                                        To simplify clinic management through technology and automation, allowing healthcare professionals to focus on what matters most — patient care.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* VISION */}
                        <div className="col-lg-6">
                            <div className="bg-white border rounded-4 p-4 shadow-sm d-flex gap-4 h-100" style={{ borderColor: '#e2e8f0' }}>
                                <div className="text-info flex-shrink-0 mt-1"><i className="ti ti-eye fs-32" /></div>
                                <div>
                                    <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-info">OUR VISION</div>
                                    <p className="text-muted fs-15 m-0 lh-lg">
                                        To become a trusted healthcare technology partner for clinics across India and empower every healthcare provider with modern digital tools.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHAT WE OFFER ──────────────────────────── */}
            <section className="py-5" style={{ background: '#f8fafc' }}>
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="text-center mb-5">
                        <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-primary">WHAT WE OFFER</div>
                        <h2 className="fw-bold text-dark mb-3" style={{ fontSize: '2.4rem', fontWeight: 800 }}>Complete Healthcare Management <span style={{ color: '#0ea5e9' }}>Solution</span></h2>
                        <p className="text-muted fs-15 mx-auto" style={{ maxWidth: '600px' }}>Everything your clinic needs in one powerful, easy-to-use platform.</p>
                    </div>
                    
                    <div className="row g-4">
                        {[
                            { icon: 'ti ti-users', title: 'Patient Management', desc: 'Maintain complete patient records, history, and documents.' },
                            { icon: 'ti ti-calendar', title: 'Appointment Management', desc: 'Schedule, organize and manage appointments easily.' },
                            { icon: 'ti ti-user-circle', title: 'Doctor Management', desc: 'Manage doctor profiles, schedules, availability and consultation fees.' },
                            { icon: 'ti ti-file-text', title: 'HR & Payroll Management', desc: 'Handle attendance, payroll, leaves and employee records.' },
                            { icon: 'ti ti-receipt', title: 'Accounts & Finance', desc: 'Track incomes, expenses, invoices and payment transactions.' },
                            { icon: 'ti ti-package', title: 'Asset Management', desc: 'Monitor clinic resources, equipment and assets effectively.' },
                        ].map((f, i) => (
                            <div key={i} className="col-md-6 col-lg-4">
                                <div className="bg-white border rounded-4 p-4 text-center shadow-sm h-100" style={{ borderColor: '#e2e8f0' }}>
                                    <div className="mx-auto rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56 }}>
                                        <i className={`${f.icon} fs-24`} />
                                    </div>
                                    <h4 className="fw-bold text-dark fs-16 mb-2">{f.title}</h4>
                                    <p className="text-muted fs-14 m-0 lh-lg">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY CHOOSE DOCYORI ────────────────────── */}
            <section className="py-5 bg-white">
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="text-center mb-5">
                        <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 text-primary">WHY CHOOSE DOCYORI</div>
                        <h2 className="fw-bold text-dark mb-3" style={{ fontSize: '2.4rem', fontWeight: 800 }}>Why Clinics Choose <span style={{ color: '#0ea5e9' }}>DocYori</span></h2>
                    </div>
                    
                    <div className="row g-4">
                        {[
                            { icon: 'ti ti-hand-click', title: 'Easy To Use', desc: 'Simple interface for everyone' },
                            { icon: 'ti ti-shield-check', title: 'Secure & Reliable', desc: 'Advanced security to protect your data' },
                            { icon: 'ti ti-cloud', title: 'Cloud Based', desc: 'Access your clinic anytime, anywhere' },
                            { icon: 'ti ti-settings-automation', title: 'Centralized Management', desc: 'Everything managed from one dashboard' },
                            { icon: 'ti ti-chart-arrows', title: 'Scalable Solution', desc: 'Perfect for small clinics to large healthcare centers' },
                            { icon: 'ti ti-headset', title: 'Dedicated Support', desc: 'We are here to support you at every step' },
                        ].map((w, i) => (
                            <div key={i} className="col-md-6 col-lg-4">
                                <div className="bg-white border rounded-4 p-4 text-center shadow-sm h-100" style={{ borderColor: '#e2e8f0' }}>
                                    <div className="text-primary mb-3"><i className={`${w.icon} fs-32`} /></div>
                                    <h4 className="fw-bold text-dark fs-16 mb-2">{w.title}</h4>
                                    <p className="text-muted fs-14 m-0 lh-lg">{w.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────── */}
            <CtaBanner title="Ready To Transform Your Clinic?" />

            {/* ── FOOTER ───────────────────────────────── */}
            <FooterFront />
            <FloatingActions />
        </div>
    );
};

export default AboutUs;