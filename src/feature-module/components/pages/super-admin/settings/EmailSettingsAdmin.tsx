import React, { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

interface SmtpConfig {
    id: string;
    user: string;
    pass: string;
    host: string;
    port: string;
    fromName: string;
    encryption: string;
    isActive: boolean;
}

const EmailSettingsAdmin = () => {
    const [configs, setConfigs] = useState<SmtpConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form states for new/edit
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchConfigs = async () => {
        try {
            const res = await fetch(apiUrl("/api/settings/SMTP_CONFIG"));
            if (res.ok) {
                const data = await res.json();
                try {
                    const parsed = JSON.parse(data.value);
                    if (Array.isArray(parsed)) {
                        setConfigs(parsed);
                    } else if (parsed.user) {
                        // Migration from old single object format
                        setConfigs([{ ...parsed, id: '1', isActive: true }]);
                    }
                } catch (e) {
                    setConfigs([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch SMTP settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const saveToBackend = async (newConfigs: SmtpConfig[]) => {
        try {
            const res = await fetch(apiUrl("/api/settings"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: "SMTP_CONFIG",
                    value: JSON.stringify(newConfigs),
                }),
            });
            return res.ok;
        } catch (error) {
            return false;
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const newConfig: SmtpConfig = {
            id: editingId || Date.now().toString(),
            user: email,
            pass: password,
            host: "smtp.gmail.com",
            port: "587",
            fromName: "Docyori",
            encryption: "tls",
            isActive: configs.length === 0 || (editingId ? configs.find(c => c.id === editingId)?.isActive : false) || false
        };

        let updatedConfigs;
        if (editingId) {
            updatedConfigs = configs.map(c => c.id === editingId ? newConfig : c);
        } else {
            updatedConfigs = [...configs, newConfig];
        }

        if (await saveToBackend(updatedConfigs)) {
            setConfigs(updatedConfigs);
            toast.success(editingId ? "Email updated" : "Email added successfully");
            resetForm();
        } else {
            toast.error("Failed to save settings");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const updatedConfigs = configs.filter(c => c.id !== id);
        if (await saveToBackend(updatedConfigs)) {
            setConfigs(updatedConfigs);
            toast.success("Email removed");
        }
    };

    const toggleActive = async (id: string) => {
        const updatedConfigs = configs.map(c => ({
            ...c,
            isActive: c.id === id
        }));
        if (await saveToBackend(updatedConfigs)) {
            setConfigs(updatedConfigs);
            toast.success("Default email changed");
        }
    };

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setEditingId(null);
        setShowAddForm(false);
    };

    const startEdit = (config: SmtpConfig) => {
        setEmail(config.user);
        setPassword(config.pass);
        setEditingId(config.id);
        setShowAddForm(true);
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="content">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header justify-content-between d-flex align-items-center">
                    <div>
                        <h4 className="fw-bold fs-3 mb-1">Email Management</h4>
                        <p className="text-muted fs-14">Add and manage Gmail accounts for sending system emails</p>
                    </div>
                    {!showAddForm && (
                        <button
                            className="btn btn-primary d-flex align-items-center gap-2"
                            onClick={() => setShowAddForm(true)}
                        >
                            <i className="ti ti-plus" /> Add New Email
                        </button>
                    )}
                </div>

                {showAddForm ? (
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white border-bottom-0 pt-4 d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">{editingId ? "Edit Email Account" : "Configure New Gmail"}</h5>
                                    <button className="btn-close" onClick={resetForm}></button>
                                </div>
                                <div className="card-body">
                                    <div className="alert alert-warning py-3 fs-13 mb-4">
                                        <h6 className="fw-bold mb-1"><i className="ti ti-alert-triangle me-1"></i> Quick Setup Guide:</h6>
                                        <ul className="mb-0 ps-3">
                                            <li>Use <strong>App Password</strong> from Google Security settings.</li>
                                            <li>SMTP: <strong>smtp.gmail.com</strong> (Pre-configured)</li>
                                            <li>Port: <strong>587</strong> (Pre-configured)</li>
                                        </ul>
                                    </div>
                                    <form onSubmit={handleAddOrUpdate}>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Gmail Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg fs-14"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="example@gmail.com"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-medium">App Password</label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg fs-14"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter 16-character app password"
                                                required
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-light flex-grow-1" onClick={resetForm}>Cancel</button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                                disabled={saving}
                                            >
                                                {saving && <span className="spinner-border spinner-border-sm" />}
                                                {editingId ? "Update Email" : "Save & Add"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Email Account</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">SMTP Server</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted text-center">Status</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-5 text-muted">
                                                    <i className="ti ti-mail-off fs-1 px-2" />
                                                    <p className="mt-2">No email accounts added yet.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            configs.map((config) => (
                                                <tr key={config.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary-subtle rounded-circle p-2 me-3">
                                                                <i className="ti ti-mail text-primary fs-20" />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 fw-bold">{config.user}</h6>
                                                                <small className="text-muted">Sender Name: {config.fromName}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="fs-14">{config.host}:{config.port}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {config.isActive ? (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                                                                Active (Default)
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                                                onClick={() => toggleActive(config.id)}
                                                            >
                                                                Set as Default
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button className="btn btn-sm btn-white border" onClick={() => startEdit(config)}>
                                                                <i className="ti ti-edit" />
                                                            </button>
                                                            <button className="btn btn-sm btn-white border text-danger" onClick={() => handleDelete(config.id)}>
                                                                <i className="ti ti-trash" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSettingsAdmin;
