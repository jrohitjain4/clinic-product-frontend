import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../routes/all_routes';
import { resolveMediaUrl } from "../../../../core/config/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface FooterFrontProps {
    clinic?: {
        name: string;
        tagline?: string;
        phone: string;
        whatsapp: string;
        email: string;
        logo?: string;
        facebook?: string;
        instagram?: string;
        address?: string;
        city?: string;
        about?: string;
    } | null;
}

const FooterFront = ({ clinic }: FooterFrontProps) => {
    const [siteSettings, setSiteSettings] = useState({
        whatsapp: "+91 99999 99999",
        phone: "+91 99999 99999",
        email: "hello@docyori.com",
        website: "www.docyori.com"
    });

    useEffect(() => {
        if (clinic) return; // Skip fetching platform settings if rendering for a specific clinic
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API}/api/settings/contact_phone`);
                if (!res.ok) return;

                const keys = ["contact_phone", "contact_email", "contact_website", "contact_whatsapp"];
                const fetched = await Promise.all(
                    keys.map(async (key) => {
                        try {
                            const r = await fetch(`${API}/api/settings/${key}`);
                            if (r.ok) {
                                const data = await r.json();
                                return { [key]: data.value || "" };
                            }
                        } catch { /* ignore */ }
                        return { [key]: "" };
                    })
                );
                const mergedSettings = fetched.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                setSiteSettings(prev => ({
                    phone: mergedSettings.contact_phone || prev.phone,
                    email: mergedSettings.contact_email || prev.email,
                    website: mergedSettings.contact_website || prev.website,
                    whatsapp: mergedSettings.contact_whatsapp || prev.whatsapp,
                }));
            } catch { /* settings API not available, use defaults */ }
        };
        fetchSettings();
    }, [clinic]);

    // If it's a clinic landing page, render clinic-specific footer with original dark design
    if (clinic) {
        const logoUrl = clinic.logo ? resolveMediaUrl(clinic.logo) : "/logo.png";
        return (
            <footer className="dy-footer" id="contact">
                <div className="dy-container dy-footer-grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr" }}>

                    {/* Column 1: Clinic details */}
                    <div className="dy-footer-brand">
                        <div className="footer-logo" style={{ marginBottom: "1rem" }}>
                            <img src={logoUrl} alt={clinic.name} style={{ height: "60px", width: "auto", objectFit: "contain" }} />
                        </div>
                        <p className="tag-line">{clinic.tagline || "Quality Healthcare for Your Family"}</p>
                        <p>
                            {clinic.about ? (clinic.about.length > 150 ? clinic.about.substring(0, 150) + "..." : clinic.about) : `${clinic.name} is committed to providing high-quality medical services with compassion and care.`}
                        </p>
                        <div className="dy-socials">
                            {clinic.facebook && <a href={clinic.facebook} target="_blank" rel="noreferrer"><i className="ti ti-brand-facebook" /></a>}
                            {clinic.instagram && <a href={clinic.instagram} target="_blank" rel="noreferrer"><i className="ti ti-brand-instagram" /></a>}
                            {clinic.whatsapp && <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><i className="ti ti-brand-whatsapp" /></a>}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="dy-footer-col">
                        <h5>QUICK LINKS</h5>
                        <ul>
                            <li><a href="#hero">Home</a></li>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#doctors">Our Doctors</a></li>
                            <li><a href="#services">Services We Offer</a></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div className="dy-footer-col">
                        <h5>LEGAL</h5>
                        <ul>
                            <li><Link to={all_routes.privacyPolicyFront}>Privacy Policy</Link></li>
                            <li><Link to={all_routes.termsConditionFront}>Terms & Conditions</Link></li>
                            <li><Link to={all_routes.refundPolicyFront}>Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Support */}
                    <div className="dy-footer-col">
                        <h5>SUPPORT</h5>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Documentation</a></li>
                            <li><a href="#">Customer Support</a></li>
                        </ul>
                    </div>

                    {/* Column 5: Contact info */}
                    <div className="dy-footer-col">
                        <h5>CONTACT</h5>
                        <ul>
                            <li>
                                <a href={`mailto:${clinic.email}`}>
                                    <i className="ti ti-mail" /> {clinic.email}
                                </a>
                            </li>
                            <li>
                                <a href={`tel:${clinic.phone.replace(/\s+/g, '')}`}>
                                    <i className="ti ti-phone" /> {clinic.phone}
                                </a>
                            </li>
                            {clinic.whatsapp && (
                                <li>
                                    <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                                        <i className="ti ti-brand-whatsapp" /> {clinic.whatsapp}
                                    </a>
                                </li>
                            )}
                            <li className="d-flex align-items-start gap-2 mt-1" style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                                <i className="ti ti-map-pin text-primary" style={{ marginTop: "3px" }} />
                                <span>{clinic.address}, {clinic.city}</span>
                            </li>
                        </ul>
                    </div>

                </div>
                <div className="dy-footer-bottom">
                    <p>© {new Date().getFullYear()} {clinic.name}. All Rights Reserved.</p>
                </div>
            </footer>
        );
    }

    // Default Platform Footer
    return (
        <footer className="dy-footer" id="contact">
            <div className="dy-container dy-footer-grid">
                <div className="dy-footer-brand">
                    <div className="footer-logo" style={{ marginBottom: "1rem" }}>
                        <img src="/logo.png" alt="DocYori" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
                    </div>
                    <p className="tag-line">Smarter Care. Better Health.</p>
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
                        <li><a href="#features">Features</a></li>
                        <li><a href="#modules">Modules</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                    </ul>
                </div>
                <div className="dy-footer-col">
                    <h5>COMPANY</h5>
                    <ul>
                        <li><Link to="/about-us">About Us</Link></li>
                        <li><Link to="/contact-us">Contact Us</Link></li>
                    </ul>
                </div>
                <div className="dy-footer-col">
                    <h5>LEGAL</h5>
                    <ul>
                        <li><Link to={all_routes.privacyPolicyFront}>Privacy Policy</Link></li>
                        <li><Link to={all_routes.termsConditionFront}>Terms & Conditions</Link></li>
                        <li><Link to={all_routes.refundPolicyFront}>Refund Policy</Link></li>
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
                        <li><a href={`mailto:${siteSettings.email}`}><i className="ti ti-mail" />{siteSettings.email}</a></li>
                        <li><a href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}><i className="ti ti-phone" />{siteSettings.phone}</a></li>
                        <li><a href="#"><i className="ti ti-world" />{siteSettings.website}</a></li>
                    </ul>
                </div>
            </div>
            <div className="dy-footer-bottom">
                <p>© {new Date().getFullYear()} DocYori. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default FooterFront;
