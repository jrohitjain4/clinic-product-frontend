import { useState, useEffect } from "react";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import "./homePage.scss";

const TermsConditionFront = () => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/settings/terms_condition`);
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.value);
                }
            } catch (err) {
                console.error("Failed to load terms & conditions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── CONTENT ──────────────────────────────── */}
            <section style={{ padding: '5rem 0 7rem', background: '#fff' }}>
                <div className="dy-container" style={{ maxWidth: '900px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a233a', marginBottom: '1rem' }}>Terms & Conditions</h1>
                    <p style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 600, marginBottom: '2rem' }}>Last Updated: 31 May 2026</p>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading terms & conditions...</div>
                    ) : content ? (
                        <div
                            className="dynamic-content-wrapper"
                            style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.7' }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            No terms and conditions found. Please check back later.
                        </div>
                    )}
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────── */}
            <FooterFront />
            <FloatingActions />
        </div>
    );
};

export default TermsConditionFront;
