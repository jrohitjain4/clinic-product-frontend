import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FloatingActions = () => {
    const [siteSettings, setSiteSettings] = useState({ whatsapp: "+919876543210", phone: "+919876543210" });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const keys = ["contact_phone", "contact_whatsapp"];
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
                    whatsapp: mergedSettings.contact_whatsapp || prev.whatsapp,
                }));
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="dy-floating-actions">
            <a
                href={`https://wa.me/${siteSettings.whatsapp.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="float-btn whatsapp"
                title="WhatsApp Us"
            >
                <i className="ti ti-brand-whatsapp" />
            </a>
            <a
                href={`tel:${siteSettings.phone}`}
                className="float-btn phone"
                title="Call Us"
            >
                <i className="ti ti-phone" />
            </a>
        </div>
    );
};

export default FloatingActions;
