import React, { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import { IconFormControl } from "../../../../../core/common/form-fields";

interface RazorpayConfig {
    id: string;
    label: string;
    keyId: string;
    keySecret: string;
    isActive: boolean;
}

const RazorpaySettingsAdmin = () => {
    const [configs, setConfigs] = useState<RazorpayConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [label, setLabel] = useState("");
    const [keyId, setKeyId] = useState("");
    const [keySecret, setKeySecret] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    };

    const fetchConfigs = async () => {
        try {
            const res = await fetch(apiUrl("/api/superadmin/razorpay-config"), {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            } else {
                toast.error("Failed to load payment configurations");
            }
        } catch (error) {
            console.error("Failed to fetch Razorpay settings:", error);
            toast.error("Network error loading configurations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const body = {
            id: editingId || undefined,
            label,
            keyId,
            keySecret
        };

        try {
            const res = await fetch(apiUrl("/api/superadmin/razorpay-config"), {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setConfigs(data.config || []);
                toast.success(editingId ? "Payment settings updated" : "Payment settings added successfully");
                resetForm();
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Network error saving configurations");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this payment credential?")) return;

        try {
            const res = await fetch(apiUrl(`/api/superadmin/razorpay-config/${id}`), {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                setConfigs(data.config || []);
                toast.success("Credential removed");
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to delete credential");
            }
        } catch (error) {
            toast.error("Network error deleting credential");
        }
    };

    const toggleActive = async (id: string) => {
        try {
            const res = await fetch(apiUrl(`/api/superadmin/razorpay-config/${id}/activate`), {
                method: "PUT",
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                setConfigs(data.config || []);
                toast.success("Active payment credential updated");
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to activate credential");
            }
        } catch (error) {
            toast.error("Network error activating credential");
        }
    };

    const resetForm = () => {
        setLabel("");
        setKeyId("");
        setKeySecret("");
        setEditingId(null);
        setShowForm(false);
    };

    const startEdit = (config: RazorpayConfig) => {
        setLabel(config.label);
        setKeyId(config.keyId);
        setKeySecret(config.keySecret); // This is "********" by default
        setEditingId(config.id);
        setShowForm(true);
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="content">
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header justify-content-between d-flex align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold fs-3 mb-1">Razorpay Settings</h4>
                        <p className="text-muted fs-14">Configure and manage Razorpay credential sets for subscription billing</p>
                    </div>
                    {!showForm && (
                        <button
                            className="btn btn-primary d-flex align-items-center gap-2"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="ti ti-plus" /> Add New Account
                        </button>
                    )}
                </div>

                {showForm ? (
                    <div className="row justify-content-center">
                        <div className="col-md-8">
                            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                                <div className="card-header bg-white border-bottom-0 pt-4 d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0 fw-bold">{editingId ? "Edit Razorpay Account" : "Configure New Razorpay Account"}</h5>
                                    <button className="btn-close" onClick={resetForm}></button>
                                </div>
                                <div className="card-body">
                                    <div className="alert alert-info py-3 fs-13 mb-4">
                                        <h6 className="fw-bold mb-1"><i className="ti ti-info-circle me-1"></i> Razorpay Setup Info:</h6>
                                        <p className="mb-0">
                                            Provide the Key ID and Key Secret generated from your Razorpay Dashboard Settings.
                                            You can configure both Test and Live environments. Ensure only the environment you want to receive payments in is set to active.
                                        </p>
                                    </div>
                                    <form onSubmit={handleAddOrUpdate}>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Account Label / Environment</label>
                                            <IconFormControl
                                                type="text"
                                                fieldLabel="title"
                                                className="form-control-lg fs-14"
                                                value={label}
                                                onChange={(e) => setLabel(e.target.value)}
                                                placeholder="e.g. Razorpay Test Sandbox, Live Production"
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium">Razorpay Key ID</label>
                                            <IconFormControl
                                                type="text"
                                                placeholder="Razorpay Key ID"
                                                className="form-control-lg fs-14"
                                                value={keyId}
                                                onChange={(e) => setKeyId(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-medium">Razorpay Key Secret</label>
                                            <IconFormControl
                                                type="password"
                                                fieldLabel="password"
                                                className="form-control-lg fs-14"
                                                value={keySecret}
                                                onChange={(e) => setKeySecret(e.target.value)}
                                                placeholder={editingId ? "Enter new secret, or leave as ******** to keep current secret" : "Enter key secret"}
                                                required
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-light flex-grow-1" onClick={resetForm}>Cancel</button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
                                                disabled={saving}
                                            >
                                                {saving && <span className="spinner-border spinner-border-sm" />}
                                                {editingId ? "Update Account" : "Save & Add"}
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
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Account / Label</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Razorpay Key ID</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted text-center">Status</th>
                                            <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-5 text-muted">
                                                    <i className="ti ti-credit-card-off fs-1 px-2" />
                                                    <p className="mt-2">No Razorpay configurations found. Click "Add New Account" to add one.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            configs.map((config) => (
                                                <tr key={config.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary-subtle rounded-circle p-2 me-3">
                                                                <i className="ti ti-credit-card text-primary fs-20" />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 fw-bold">{config.label}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <code className="fs-13 text-dark">{config.keyId}</code>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {config.isActive ? (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-medium">
                                                                Active (Receiving Payments)
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                                                onClick={() => toggleActive(config.id)}
                                                            >
                                                                Set as Active
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

export default RazorpaySettingsAdmin;
