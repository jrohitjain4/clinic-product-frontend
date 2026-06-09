import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../routes/all_routes';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FooterFront = () => {
    const [siteSettings, setSiteSettings] = useState({ 
        whatsapp: "+91 99999 99999", 
        phone: "+91 99999 99999",
        email: "hello@docyori.com",
        website: "www.docyori.com"
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const keys = ["contact_phone", "contact_email", "contact_website", "contact_whatsapp"];
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
