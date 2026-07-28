import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import CtaBanner from "./CtaBanner";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";
import "./homePage.scss";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ContactUs = () => {
    const [siteSettings, setSiteSettings] = useState({ 
        whatsapp: "+919876543210", 
        phone: "+91 98765 43210",
        email: "hello@docyori.com",
        address: "DocYori Technologies Pvt. Ltd.\n123, Healthcare Street, Sector 62,\nNoida, Uttar Pradesh - 201301, India",
        website: "www.docyori.com"
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const keys = ["contact_address", "contact_phone", "contact_email", "contact_website", "contact_whatsapp"];
                const fetched = await Promise.all(
                    keys.map(async (key) => {
                        const res = await fetch(`${API}/api/settings/${key}`);
                        if (res.ok) {
                            const data = await res.json();
                            return { [key]: data.value || "" };
                        }
                        return { [key]: "" };
                    })
                );
                const mergedSettings = fetched.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                setSiteSettings(prev => ({
                    address: mergedSettings.contact_address || prev.address,
                    phone: mergedSettings.contact_phone || prev.phone,
                    email: mergedSettings.contact_email || prev.email,
                    website: mergedSettings.contact_website || prev.website,
                    whatsapp: mergedSettings.contact_whatsapp || prev.whatsapp,
                }));
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqs = [
        {
            q: "How can I book a demo of DocYori?",
            a: "You can book a demo by clicking the 'Book Demo' button on our website, or contact our team via email or WhatsApp."
        },
        {
            q: "Can I migrate my existing data to DocYori?",
            a: "Yes, we provide complete data migration support to safely transfer your existing patient records and appointments."
        },
        {
            q: "Is DocYori suitable for small clinics?",
            a: "Absolutely! DocYori is designed for clinics of all sizes, from solo practitioners to large healthcare centers."
        },
        {
            q: "What payment methods do you accept?",
            a: "We accept all major payment methods including credit cards, debit cards, UPI, net banking, and checks."
        },
        {
            q: "Does DocYori provide customer support?",
            a: "Yes, we provide 24/7 customer support through multiple channels - email, phone, and WhatsApp."
        },
        {
            q: "Is my data secure with DocYori?",
            a: "Security is our top priority. DocYori uses enterprise-grade encryption to protect your sensitive patient data."
        }
    ];

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
                                CONTACT US
                            </div>
                            <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '3.2rem', lineHeight: 1.25, marginBottom: '20px', letterSpacing: '-1px' }}>
                                We're Here To Help Your Clinic <span style={{ color: '#0ea5e9' }}>Grow</span>
                            </h1>
                            <p className="fs-15 lh-lg" style={{ color: '#334155', marginBottom: '25px', maxWidth: '540px' }}>
                                Have questions or need assistance? Our team is ready to help you simplify your clinic operations with DocYori.
                            </p>
                            
                            <div className="d-flex flex-wrap gap-3 mb-4">
                                <Link to={all_routes.registerbasic} className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px' }}>
                                    <i className="ti ti-user" /> Start Free Trial
                                </Link>
                                <Link to="#demo" className="btn btn-outline-info d-inline-flex align-items-center justify-content-center gap-2 bg-white" style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', border: '1px solid #0ea5e9', color: '#0ea5e9' }}>
                                    <i className="ti ti-device-laptop" /> Book Demo
                                </Link>
                            </div>

                            {/* Features line */}
                            <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
                                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                                    <i className="ti ti-circle-check fs-18 text-info" /> Quick Response
                                </div>
                                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                                    <i className="ti ti-shield-check fs-18 text-success" /> Expert Support
                                </div>
                                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                                    <i className="ti ti-clock-24 fs-18 text-primary" /> 24/7 Assistance
                                </div>
                                <div className="d-flex align-items-center gap-2 fs-13 fw-bold text-secondary">
                                    <i className="ti ti-thumb-up fs-18 text-info" /> Trusted by Clinics
                                </div>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="col-lg-6 position-relative d-flex align-items-center justify-content-center">
                            {/* Chat bubble graphic on left */}
                            <div className="position-absolute d-none d-lg-flex flex-column gap-3" style={{ left: '-20px', top: '10%' }}>
                                <div className="bg-white rounded-pill px-4 py-3 shadow-sm border text-dark fw-bold fs-14" style={{ borderColor: '#e2e8f0' }}>
                                    How can<br />we help you?
                                </div>
                            </div>

                            {/* Main 3D Support Agent Image */}
                            <img src="/contact.png" alt="Support" style={{ maxWidth: '400px', height: 'auto', zIndex: 2 }} className="img-fluid" />

                            {/* Vertical floating icons */}
                            <div className="position-absolute d-none d-lg-flex flex-column gap-2" style={{ right: '180px', top: '20%', zIndex: 3 }}>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm border text-primary" style={{ width: 40, height: 40, borderColor: '#e2e8f0' }}><i className="ti ti-phone fs-20" /></div>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm border text-info" style={{ width: 40, height: 40, borderColor: '#e2e8f0' }}><i className="ti ti-mail fs-20" /></div>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm border text-success" style={{ width: 40, height: 40, borderColor: '#e2e8f0' }}><i className="ti ti-message-circle fs-20" /></div>
                            </div>

                            {/* Stats Cards on Right */}
                            <div className="position-absolute end-0 d-none d-lg-flex flex-column gap-3" style={{ zIndex: 3 }}>
                                <div className="bg-white shadow-sm border rounded-3 p-3 d-flex align-items-center gap-3" style={{ width: '220px', borderColor: '#e2e8f0' }}>
                                    <div className="rounded-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}><i className="ti ti-building-hospital fs-20" /></div>
                                    <div>
                                        <div className="fw-bold fs-16 text-dark lh-1">500+</div>
                                        <div className="fs-12 text-muted mt-1">Clinics Onboarded</div>
                                    </div>
                                </div>
                                <div className="bg-white shadow-sm border rounded-3 p-3 d-flex align-items-center gap-3" style={{ width: '220px', borderColor: '#e2e8f0' }}>
                                    <div className="rounded-2 bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}><i className="ti ti-shield-check fs-20" /></div>
                                    <div>
                                        <div className="fw-bold fs-16 text-dark lh-1">99.9%</div>
                                        <div className="fs-12 text-muted mt-1">Customer Satisfaction</div>
                                    </div>
                                </div>
                                <div className="bg-white shadow-sm border rounded-3 p-3 d-flex align-items-center gap-3" style={{ width: '220px', borderColor: '#e2e8f0' }}>
                                    <div className="rounded-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}><i className="ti ti-headset fs-20" /></div>
                                    <div>
                                        <div className="fw-bold fs-16 text-dark lh-1">24/7</div>
                                        <div className="fs-12 text-muted mt-1">Support Available</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── GET IN TOUCH / INFO / MAP ─────────────────────────── */}
            <section className="py-4 bg-white">
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="row g-4">
                        {/* Get In Touch Form */}
                        <div className="col-lg-5">
                            <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.8rem' }}>Get In <span style={{ color: '#0ea5e9' }}>Touch</span></h3>
                            <p className="text-muted fs-14 mb-4">Fill out the form and our team will get back to you as soon as possible.</p>
                            
                            <form className="d-flex flex-column gap-3">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <IconFormControl type="text" fieldLabel="name" placeholder="Your Name *" style={{ padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                                    </div>
                                    <div className="col-md-6">
                                        <IconFormControl type="email" fieldLabel="email" placeholder="Email Address *" style={{ padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                                    </div>
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <IconFormControl type="tel" fieldLabel="phone" placeholder="Phone Number *" style={{ padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                                    </div>
                                    <div className="col-md-6">
                                        <IconFormControl type="text" fieldLabel="subject" placeholder="Subject *" style={{ padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                                    </div>
                                </div>
                                <div>
                                    <IconTextarea fieldLabel="message" placeholder="Your Message *" rows={4} style={{ padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none' }} />
                                </div>
                                <button type="button" className="btn btn-primary d-flex align-items-center justify-content-center gap-2 mt-2 w-100" style={{ padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
                                    Send Message <i className="ti ti-send" />
                                </button>
                            </form>
                        </div>

                        {/* Contact Information */}
                        <div className="col-lg-4">
                            <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.8rem' }}>Contact <span style={{ color: '#0ea5e9' }}>Information</span></h3>
                            <p className="text-muted fs-14 mb-4">Reach out to us through any of these channels.</p>

                            <div className="d-flex flex-column gap-4">
                                <div className="d-flex gap-3">
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                                        <i className="ti ti-map-pin fs-20" />
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success" style={{ fontSize: '12px' }}>Our Address</div>
                                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>{siteSettings.address}</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                                        <i className="ti ti-phone fs-20" />
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success" style={{ fontSize: '12px' }}>Phone Number</div>
                                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '14px' }}>{siteSettings.phone}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Mon - Sat | 9:00 AM - 7:00 PM</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                                        <i className="ti ti-mail fs-20" />
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success" style={{ fontSize: '12px' }}>Email Address</div>
                                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '14px' }}>{siteSettings.email}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>We reply within a few hours</div>
                                    </div>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                                        <i className="ti ti-world fs-20" />
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success" style={{ fontSize: '12px' }}>Website</div>
                                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '14px' }}>{siteSettings.website}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Visit our website for more information</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="col-lg-3">
                            <div className="h-100 rounded-4 overflow-hidden border shadow-sm" style={{ borderColor: '#e2e8f0', minHeight: '300px' }}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.8392319277!2d77.0688975472!3d28.5272181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b34766247%3A0xaa13aa5b6023!2sNew%20Delhi%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: 'block', minHeight: '300px' }}
                                    allowFullScreen
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ SECTION ─────────────────────────── */}
            <section className="py-5 bg-white">
                <div className="container" style={{ maxWidth: '1320px' }}>
                    <div className="text-center mb-4">
                        <div className="fw-bold fs-12 mb-2 text-uppercase letter-spacing-1 bg-primary bg-opacity-10 text-primary d-inline-block px-3 py-1 rounded-pill">FAQ</div>
                        <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '2.4rem' }}>Frequently Asked <span style={{ color: '#0ea5e9' }}>Questions</span></h2>
                        <p className="text-muted fs-15">Quick answers to common questions.</p>
                    </div>

                    <div className="row g-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="col-md-6">
                                <div className="bg-white border rounded-3 overflow-hidden shadow-sm h-100" style={{ borderColor: '#e2e8f0', transition: 'all 0.3s' }}>
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                        className="w-100 p-4 d-flex align-items-center justify-content-between bg-white border-0 text-start"
                                    >
                                        <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{faq.q}</span>
                                        <i className="ti ti-plus" style={{ color: '#0f172a', fontWeight: 'bold', transform: expandedFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                    </button>
                                    {expandedFaq === i && (
                                        <div className="px-4 pb-4">
                                            <p className="fs-14 text-muted m-0 lh-lg">{faq.a}</p>
                                        </div>
                                    )}
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

export default ContactUs;