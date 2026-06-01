import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import "./homePage.scss";

const PrivacyPolicyFront = () => {
    const siteSettings = { whatsapp: "+919876543210", phone: "+919876543210" };

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── CONTENT ──────────────────────────────── */}
            <section style={{ padding: '5rem 0 7rem', background: '#fff' }}>
                <div className="dy-container" style={{ maxWidth: '900px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a233a', marginBottom: '1rem' }}>Privacy Policy</h1>
                    <p style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 600, marginBottom: '2rem' }}>Last Updated: 31 May 2026</p>

                    <div style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <p>Welcome to DocYori. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website, software, and services (collectively, the "Services"). By accessing or using DocYori, you agree to the practices described in this policy.</p>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>1. Information We Collect</h3>
                            <p style={{ marginBottom: '0.5rem' }}>We collect information that helps us provide better services to our users. The information we collect includes:</p>
                            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li><strong>Personal Information:</strong> Name, email address, phone number, clinic details, and other information you provide during registration.</li>
                                <li><strong>Usage Data:</strong> Information about how you use our Services, including features accessed, pages visited, and actions performed.</li>
                                <li><strong>Device Information:</strong> IP address, browser type, operating system, device information, and other technical data.</li>
                                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to enhance your experience.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>2. How We Use Your Information</h3>
                            <p style={{ marginBottom: '0.5rem' }}>We use the information we collect for the following purposes:</p>
                            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li>To provide, operate, and maintain our Services.</li>
                                <li>To manage your account and provide customer support.</li>
                                <li>To improve, personalize, and enhance our platform and user experience.</li>
                                <li>To send important updates, notifications, and promotional communications (with your consent).</li>
                                <li>To monitor and analyze usage and trends to improve our Services.</li>
                                <li>To comply with legal obligations and protect our rights.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>3. Information Sharing and Disclosure</h3>
                            <p style={{ marginBottom: '0.5rem' }}>We do not sell, trade, or rent your personal information. We may share your information in the following cases:</p>
                            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li><strong>With Service Providers:</strong> Trusted third-party vendors who help us operate our Services.</li>
                                <li><strong>For Legal Reasons:</strong> When required by law, regulation, legal process, or to protect our rights and safety.</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>4. Data Security</h3>
                            <p>We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no system is completely secure, and we cannot guarantee absolute security.</p>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>5. Your Rights and Choices</h3>
                            <p style={{ marginBottom: '0.5rem' }}>You have the right to:</p>
                            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li>Access, update, or delete your personal information.</li>
                                <li>Opt-out of marketing communications.</li>
                                <li>Disable cookies through your browser settings.</li>
                            </ul>
                            <p style={{ marginTop: '0.5rem' }}>To exercise these rights, please contact us using the details provided below.</p>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>6. Data Retention</h3>
                            <p>We retain your information only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.</p>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>7. Third-Party Links</h3>
                            <p>Our Services may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. Please review their privacy policies separately.</p>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>8. Changes to This Privacy Policy</h3>
                            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website with an updated effective date.</p>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a233a', marginBottom: '0.8rem' }}>9. Contact Us</h3>
                            <p style={{ marginBottom: '0.8rem' }}>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Email:</strong> <a href="mailto:support@docyori.com" style={{ color: '#007bff', textDecoration: 'none' }}>support@docyori.com</a></p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Phone:</strong> <a href={`tel:${siteSettings.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>{siteSettings.phone}</a></p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Address:</strong> DocYori Technologies Pvt. Ltd., 123, Healthcare Street, Sector 62, Noida, Uttar Pradesh - 201301, India</p>
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

export default PrivacyPolicyFront;
