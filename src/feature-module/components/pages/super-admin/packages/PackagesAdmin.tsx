import React, { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";

interface Package {
    id: string;
    name: string;
    price: number;
    durationInDays: number;
    isActive: boolean;
}

const PackagesAdmin = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        durationInDays: "",
        isActive: true,
    });

    const fetchPackages = async () => {
        try {
            const response = await fetch(apiUrl("/api/packages"));
            const data = await response.json();
            setPackages(data);
        } catch (error) {
            console.error("Error fetching packages:", error);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataToSave = {
            ...formData,
        };

        try {
            const url = editingPackage
                ? apiUrl(`/api/packages/${editingPackage.id}`)
                : apiUrl("/api/packages");

            const method = editingPackage ? "PUT" : "POST";
            const token = localStorage.getItem("token");

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave)
            });

            if (response.ok) {
                fetchPackages();
                setIsModalOpen(false);
                setEditingPackage(null);
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Failed to save package");
            }
        } catch (error) {
            console.error("Error saving package:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this package?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiUrl(`/api/packages/${id}`), {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchPackages();
            }
        } catch (error) {
            console.error("Error deleting package:", error);
        }
    };

    const toggleStatus = async (pkg: Package) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiUrl(`/api/packages/${pkg.id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ ...pkg, isActive: !pkg.isActive })
            });

            if (response.ok) {
                fetchPackages();
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const openAddModal = () => {
        setFormData({ name: "", price: "", durationInDays: "", isActive: true });
        setEditingPackage(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pkg: Package) => {
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            durationInDays: pkg.durationInDays.toString(),
            isActive: pkg.isActive
        });
        setEditingPackage(pkg);
        setIsModalOpen(true);
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold fs-3 mb-1">Subscription Packages</h4>
                        <p className="text-muted fs-14">Manage pricing plans for your SaaS tenants</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center" onClick={openAddModal}>
                        <i className="ti ti-plus me-2" /> Add New Package
                    </button>
                </div>

                <div className="row g-4">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="col-md-6 col-lg-4">
                            <div className={`card shadow-sm border-0 h-100 ${!pkg.isActive && 'opacity-75'}`}>
                                <div className={`card-header text-white p-4 ${pkg.isActive ? 'bg-primary' : 'bg-secondary'}`} style={{ borderRadius: '15px 15px 0 0' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h5 className="mb-0 text-white fw-bold">{pkg.name}</h5>
                                        <button className="btn btn-sm btn-light p-1 rounded-circle" style={{ width: '30px', height: '30px' }} onClick={() => handleDelete(pkg.id)}>
                                            <i className="ti ti-trash text-danger" />
                                        </button>
                                    </div>
                                    <div className="d-flex align-items-baseline">
                                        <h2 className="text-white fw-bold mb-0">${pkg.price}</h2>
                                        <small className="ms-2">/ {pkg.durationInDays} Days</small>
                                    </div>
                                </div>
                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-center mt-auto border-top pt-3">
                                        <div className="form-check form-switch m-0 d-flex align-items-center">
                                            <input className="form-check-input" type="checkbox" checked={pkg.isActive} onChange={() => toggleStatus(pkg)} id={`status-${pkg.id}`} style={{ width: '40px', height: '20px', cursor: 'pointer' }} />
                                            <label className="form-check-label ms-2 fw-medium" htmlFor={`status-${pkg.id}`}>
                                                {pkg.isActive ? 'Active' : 'Disabled'}
                                            </label>
                                        </div>
                                        <button className="btn btn-sm btn-outline-primary px-3 rounded-pill" onClick={() => openEditModal(pkg)}>
                                            <i className="ti ti-edit me-1" /> Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="modal-title fw-bold fs-4">{editingPackage ? "Update Package" : "Create New Package"}</h5>
                                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <form onSubmit={handleSave}>
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Plan Name</label>
                                            <input type="text" className="form-control form-control-lg" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Enterprise Monthly" />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Price ($)</label>
                                            <div className="input-group">
                                                <span className="input-group-text">$</span>
                                                <input type="number" step="0.01" className="form-control form-control-lg" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Duration (Days)</label>
                                            <input type="number" className="form-control form-control-lg" required value={formData.durationInDays} onChange={e => setFormData({ ...formData, durationInDays: e.target.value })} />
                                        </div>

                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-5">
                                        <button type="button" className="btn btn-light px-4 rounded-pill" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                        <button type="submit" disabled={loading} className="btn btn-primary px-5 rounded-pill fw-bold">
                                            {loading ? 'Saving...' : (editingPackage ? "Save Changes" : "Create Plan")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackagesAdmin;
