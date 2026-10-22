import { useState, useEffect } from "react";
import { message } from "antd";
import { IconFormControl, IconTextarea } from "../../../../../core/common/form-fields";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ContactSettingsAdmin = () => {
    const [settings, setSettings] = useState({
        contact_address: "",
        contact_phone: "",
        contact_email: "",
        contact_website: "",
        contact_whatsapp: "",
        contact_facebook: "",
        contact_twitter: "",
        contact_linkedin: "",
        contact_youtube: ""
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const keys = [
                    "contact_address", 
                    "contact_phone", 
                    "contact_email", 
                    "contact_website", 
                    "contact_whatsapp",
                    "contact_facebook",
                    "contact_twitter",
                    "contact_linkedin",
                    "contact_youtube"
                ];
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
                setSettings({
                    contact_address: mergedSettings.contact_address || "",
                    contact_phone: mergedSettings.contact_phone || "",
                    contact_email: mergedSettings.contact_email || "",
                    contact_website: mergedSettings.contact_website || "",
                    contact_whatsapp: mergedSettings.contact_whatsapp || "",
                    contact_facebook: mergedSettings.contact_facebook || "",
                    contact_twitter: mergedSettings.contact_twitter || "",
                    contact_linkedin: mergedSettings.contact_linkedin || "",
                    contact_youtube: mergedSettings.contact_youtube || ""
                });
            } catch (err: any) {
                // message.error("Failed to fetch contact settings.");
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const keys = Object.keys(settings) as Array<keyof typeof settings>;
            await Promise.all(
                keys.map(async (key) => {
                    const res = await fetch(`${API}/api/settings`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ key, value: settings[key] })
                    });
                    if (!res.ok) {
                        throw new Error(`Failed to save ${key}`);
                    }
                })
            );
            message.success("Contact settings saved successfully!");
        } catch (err) {
            message.error("Failed to save contact settings.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="row">
                        <div className="col-sm-12">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="#">Super Admin</a></li>
                                <li className="breadcrumb-item"><i className="feather-chevron-right" /></li>
                                <li className="breadcrumb-item active">Contact Settings</li>
                            </ul>
                            <div className="page-title mt-2">
                                <h3>Manage Contact Settings</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-white border-bottom">
                                <h4 className="card-title mb-0">Landing Page Contact Information</h4>
                            </div>
                            <div className="card-body">
                                {fetching ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSave} className="d-flex flex-column gap-4">
                                        <div className="form-group">
                                            <label className="form-label fw-bold text-dark">Our Address</label>
                                            <IconTextarea
                                                fieldLabel="address"
                                                rows={4}
                                                placeholder="Enter full clinic/office address"
                                                value={settings.contact_address}
                                                onChange={(e) => handleChange("contact_address", e.target.value)}
                                                style={{ borderRadius: "8px", resize: "none" }}
                                                required
                                            />
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-bold text-dark">Phone Number</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="phone"
                                                        placeholder="e.g. +91 98765 43210"
                                                        value={settings.contact_phone}
                                                        onChange={(e) => handleChange("contact_phone", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-bold text-dark">WhatsApp Number</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="phone"
                                                        placeholder="WhatsApp Number"
                                                        value={settings.contact_whatsapp}
                                                        onChange={(e) => handleChange("contact_whatsapp", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-bold text-dark">Email Address</label>
                                                    <IconFormControl
                                                        type="email"
                                                        fieldLabel="email"
                                                        placeholder="e.g. hello@docyori.com"
                                                        value={settings.contact_email}
                                                        onChange={(e) => handleChange("contact_email", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-bold text-dark">Website URL</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="website"
                                                        placeholder="e.g. www.docyori.com"
                                                        value={settings.contact_website}
                                                        onChange={(e) => handleChange("contact_website", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="my-2" />
                                        <h5 className="fw-bold mb-0 text-dark"><i className="ti ti-share me-2 text-primary"></i>Social Media Links</h5>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-semibold text-muted">Facebook URL</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="url"
                                                        placeholder="Facebook URL"
                                                        value={settings.contact_facebook}
                                                        onChange={(e) => handleChange("contact_facebook", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-semibold text-muted">Twitter URL</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="url"
                                                        placeholder="Twitter URL"
                                                        value={settings.contact_twitter}
                                                        onChange={(e) => handleChange("contact_twitter", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-semibold text-muted">LinkedIn URL</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="url"
                                                        placeholder="LinkedIn URL"
                                                        value={settings.contact_linkedin}
                                                        onChange={(e) => handleChange("contact_linkedin", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="form-label fw-semibold text-muted">YouTube URL</label>
                                                    <IconFormControl
                                                        type="text"
                                                        fieldLabel="url"
                                                        placeholder="YouTube URL"
                                                        value={settings.contact_youtube}
                                                        onChange={(e) => handleChange("contact_youtube", e.target.value)}
                                                        style={{ borderRadius: "8px", height: "46px" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 mt-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary px-4"
                                                disabled={loading}
                                                style={{ height: "46px", borderRadius: "8px", fontWeight: 600 }}
                                            >
                                                {loading ? "Saving Settings..." : "Save Settings"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactSettingsAdmin;
