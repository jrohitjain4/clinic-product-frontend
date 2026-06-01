import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import "./homePage.scss";

const ContactUs = () => {
    const siteSettings = { whatsapp: "+919876543210", phone: "+91 98765-43210" };

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── HERO ───────────────────────────────── */}
            <section className="dy-hero" style={{ background: 'linear-gradient(180deg, #fff 0%, #f0f7ff 100%)', paddingBottom: '3rem' }}>
                <div className="dy-hero-wrap">
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
                                <i className="ti ti-player-play" /> Book Demo
                            </Link>
                        </div>

                        {/* Contact info chips row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
                            <a href="mailto:support@docyori.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0f7ff', color: '#007bff', padding: '0.5rem 1rem', borderRadius: '30px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                <i className="ti ti-mail" /> support@docyori.com
                            </a>
                            <a href={`https://wa.me/${siteSettings.whatsapp}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fff4', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '30px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                <i className="ti ti-brand-whatsapp" /> WhatsApp Us
                            </a>
                            <a href={`tel:${siteSettings.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff7ed', color: '#f97316', padding: '0.5rem 1rem', borderRadius: '30px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                <i className="ti ti-phone" /> {siteSettings.phone}
                            </a>
                        </div>
                    </div>

                    <div className="dy-hero-right">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                            <img
                                src="https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt="Contact Support"
                                className="dy-about-img-main"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FORM + MAP ─────────────────────────── */}
            <section style={{ padding: '4rem 0', background: '#fff' }}>
                <div className="dy-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div className="dy-tag-sm center">GET IN TOUCH</div>
                        <h2 className="dy-sec-h2">Send Us A Message</h2>
                        <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '480px', margin: '0.5rem auto 0', lineHeight: 1.6 }}>
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>
                    </div>

                    <div className="dy-form-grid" style={{ alignItems: 'stretch', gap: '3rem' }}>
                        {/* Form */}
                        <div style={{ background: '#fcfdfe', border: '1px solid #eaedf1', borderRadius: '24px', padding: '2.5rem' }}>
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Full Name</label>
                                        <input type="text" placeholder="Dr. Anita Sharma" style={{ padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fff', outline: 'none', fontSize: '0.9rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Email Address</label>
                                        <input type="email" placeholder="doctor@clinic.com" style={{ padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fff', outline: 'none', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Phone Number</label>
                                    <input type="text" placeholder="+91 98765 43210" style={{ padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fff', outline: 'none', fontSize: '0.9rem' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Subject</label>
                                    <input type="text" placeholder="How can we help you?" style={{ padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fff', outline: 'none', fontSize: '0.9rem' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Your Message</label>
                                    <textarea placeholder="Tell us about your clinic and what you need..." rows={5} style={{ padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid #eaedf1', background: '#fff', outline: 'none', resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}></textarea>
                                </div>
                                <button type="button" style={{ background: '#007bff', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(0,123,255,0.2)', transition: 'all 0.3s' }}>
                                    Send Message <i className="ti ti-send" />
                                </button>
                            </form>
                        </div>

                        {/* Right: Map + contact info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Quick contact cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[
                                    { icon: 'ti ti-mail', color: '#007bff', bg: '#f0f7ff', label: 'Email', val: 'support@docyori.com', href: 'mailto:support@docyori.com' },
                                    { icon: 'ti ti-brand-whatsapp', color: '#22c55e', bg: '#f0fff4', label: 'WhatsApp', val: 'Chat with Us', href: `https://wa.me/${siteSettings.whatsapp}` },
                                    { icon: 'ti ti-phone', color: '#f97316', bg: '#fff7ed', label: 'Call Us', val: siteSettings.phone, href: `tel:${siteSettings.phone}` },
                                    { icon: 'ti ti-clock', color: '#7c3aed', bg: '#f5f3ff', label: 'Hours', val: 'Mon-Sat, 9am-6pm', href: '#' },
                                ].map((c, i) => (
                                    <a key={i} href={c.href} style={{ background: '#fff', border: '1px solid #eaedf1', borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', transition: 'box-shadow 0.2s' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                            <i className={c.icon} />
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a233a' }}>{c.val}</div>
                                    </a>
                                ))}
                            </div>

                            {/* Map */}
                            <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid #eaedf1', minHeight: '300px' }}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.8392319277!2d77.0688975472!3d28.5272181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b34766247%3A0xaa13aa5b6023!2sNew%20Delhi%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                                    width="100%" height="100%" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────── */}
            <FooterFront />
            <FloatingActions />
        </div>
    );
};

export default ContactUs;
