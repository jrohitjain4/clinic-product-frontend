import { useState, useEffect } from "react";
import FloatingActions from "./FloatingActions";
import NavbarFront from "./NavbarFront";
import FooterFront from "./FooterFront";
import "./homePage.scss";

const RefundPolicyFront = () => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRefund = async () => {
            try {
                // Adjust this API endpoint to match the backend structure if necessary
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/settings/refund_policy`);
                if (res.ok) {
                    const data = await res.json();
                    setContent(data.value);
                }
            } catch (err) {
                console.error("Failed to load refund policy", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRefund();
    }, []);

    return (
        <div className="dy-landing">
            <NavbarFront />

            {/* ── CONTENT ──────────────────────────────── */}
            <section style={{ padding: '5rem 0 7rem', background: '#fff' }}>
                <div className="dy-container" style={{ maxWidth: '900px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a233a', marginBottom: '1rem' }}>Refund Policy</h1>
                    <p style={{ fontSize: '0.85rem', color: '#007bff', fontWeight: 600, marginBottom: '2rem' }}>Last Updated: 31 May 2026</p>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading refund policy...</div>
                    ) : content ? (
                        <div
                            className="dynamic-content-wrapper"
                            style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.7' }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            No refund policy found. Please check back later.
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

export default RefundPolicyFront;
