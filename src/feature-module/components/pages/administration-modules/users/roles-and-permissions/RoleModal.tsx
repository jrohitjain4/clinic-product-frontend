import React, { useState, useEffect } from "react";

interface RoleModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
}

export const RoleModal = ({ show, onClose, onSubmit, initialData }: RoleModalProps) => {
    const [name, setName] = useState("");
    const [status, setStatus] = useState("Active");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setStatus(initialData.status || "Active");
        } else {
            setName("");
            setStatus("Active");
        }
    }, [initialData, show]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert("Role name is required");
        setSubmitting(true);
        try {
            await onSubmit({ name, status });
            onClose();
        } catch (e: any) {
            alert(e.message || "Failed to save role");
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
            <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{initialData ? "Edit Role" : "Add New Role"}</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Role Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? "Saving..." : "Save Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};
