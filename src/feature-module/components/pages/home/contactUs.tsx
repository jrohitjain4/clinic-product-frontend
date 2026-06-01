import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import "./homePage.scss";

const ContactUs = () => {
    const siteSettings = { whatsapp: "+919876543210", phone: "+919876543210" };

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── HERO ───────────────────────────────── */}
            <section className="dy-hero" style={{ background: '#fff' }}>
                <div className="dy-hero-wrap">
                    {/* Hero Text */}
                    <div className="dy-hero-left">
                        <div className="dy-hero-tag">Contact Us</div>
                        <h1>
                            We're Here To Help Your Clinic <span className="dy-highlight">Grow</span>
                        </h1>
                        <p>
                            Have questions or need assistance? Our team is ready to help you simplify your clinic operations with DocYori.
                        </p>
                        <div className="dy-hero-btns">
                            <Link to={all_routes.registerbasic} className="hero-btn-solid">
                                <i className="ti ti-device-laptop" /> Start Free Trial
                            </Link>
                            <Link to="#demo" className="hero-btn-outline">
                                <i className="ti ti-device-desktop-analytics" /> Book Demo
                            </Link>
                        </div>

                        {/* Trust row */}
                        <div className="dy-trust">
                            {['Quick Response', 'Expert Support', '24/7 Assistance', 'Trusted by Clinics'].map((t, idx) => (
                                <span key={idx}>
                                    <i className="ti ti-circle-check-filled" /> {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Hero Visual Area */}
                    <div className="dy-hero-right">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                            <img src="https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Contact Support" className="dy-about-img-main" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONTACT INFO CARDS ─────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fcfdfe' }}>
                <div className="dy-container">
                    <div className="dy-modules-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                        <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f8f9fa' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e6f2ff', color: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem' }}><i className="ti ti-mail" /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a233a', marginBottom: '0.5rem' }}>Email Us</h4>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>Our team will respond within 24 hours.</p>
                            <a href="mailto:support@docyori.com" style={{ color: '#007bff', fontWeight: 700, textDecoration: 'none' }}>support@docyori.com</a>
                        </div>
                        <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f8f9fa' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fff4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem' }}><i className="ti ti-brand-whatsapp" /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a233a', marginBottom: '0.5rem' }}>WhatsApp</h4>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>Quick support on your favorite app.</p>
                            <a href={`https://wa.me/${siteSettings.whatsapp}`} style={{ color: '#22c55e', fontWeight: 700, textDecoration: 'none' }}>Chat with Us</a>
                        </div>
                        <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f8f9fa' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem' }}><i className="ti ti-phone" /></div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a233a', marginBottom: '0.5rem' }}>Call Us</h4>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>Speak directly with our experts.</p>
                            <a href={`tel:${siteSettings.phone}`} style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>+91 98765-43210</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAP & FORM ────────────────────────────── */}
            <section style={{ padding: '2.5rem 0', background: '#fff' }}>
                <div className="dy-container">
                    <div className="dy-form-grid" style={{ alignItems: 'start' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 850, color: '#1a233a', marginBottom: '1.5rem' }}>Send Us A Message</h2>
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                    <input type="text" placeholder="Full Name" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fcfdfe', outline: 'none' }} />
                                    <input type="email" placeholder="Email Address" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fcfdfe', outline: 'none' }} />
                                </div>
                                <input type="text" placeholder="Subject" style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fcfdfe', outline: 'none' }} />
                                <textarea placeholder="Your Message" rows={5} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fcfdfe', outline: 'none', resize: 'none' }}></textarea>
                                <button type="button" style={{ background: '#007bff', color: '#fff', padding: '1rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,123,255,0.1)' }}>Send Message</button>
                            </form>
                        </div>
                        <div style={{ borderRadius: '24px', overflow: 'hidden', height: '100%', minHeight: '400px', border: '1px solid #eaedf1' }}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.8392319277!2d77.0688975472!3d28.5272181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b34766247%3A0xaa13aa5b6023!2sNew%20Delhi%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────── */}
            <footer className="dy-footer">
                <div className="dy-container">
                    <div className="dy-footer-grid">
                        <div className="dy-footer-brand">
                            <img src="/logo-front.png" alt="DocYori" />
                            <p>DocYori is the ultimate solution for clinics and healthcare providers seeking a modern, efficient way to manage their operations.</p>
                            <div className="dy-socials">
                                <Link to="#"><i className="ti ti-brand-facebook" /></Link>
                                <Link to="#"><i className="ti ti-brand-twitter" /></Link>
                                <Link to="#"><i className="ti ti-brand-linkedin" /></Link>
                            </div>
                        </div>
                        <div className="dy-footer-col">
                            <h5>Quick Links</h5>
                            <ul>
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about-us">About Us</Link></li>
                                <li><Link to="/services">Services</Link></li>
                            </ul>
                        </div>
                        <div className="dy-footer-col">
                            <h5>Features</h5>
                            <ul>
                                <li><Link to="#">Appointments</Link></li>
                                <li><Link to="#">Doctors</Link></li>
                                <li><Link to="#">Patients</Link></li>
                            </ul>
                        </div>
                        <div className="dy-footer-col">
                            <h5>Contact</h5>
                            <ul>
                                <li><Link to="#">Support</Link></li>
                                <li><Link to="#">Sales</Link></li>
                                <li><Link to="#">Demo</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="dy-footer-bottom">
                        <p>2025 ©Docyori, All Rights Reserved</p>
                    </div>
                </div>
            </footer>

            <FloatingActions />
        </div>
    );
};

export default ContactUs;
