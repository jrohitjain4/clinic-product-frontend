import React, { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    ownerName: string;
    ownerEmail: string;
    packageName: string;
    status: 'IN_PROGRESS' | 'TRIAL' | 'TRIAL_EXPIRED' | 'TRIAL_COMPLETED_NOT_UPGRADED' | 'UPGRADED' | 'FAILED';
    expiresAt: string | null;
    createdAt: string;
}

const TenantsAdmin = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiUrl("/api/tenants"), {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            setTenants(data);
            setFilteredTenants(data);
        } catch (error) {
            console.error("Error fetching tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        if (activeFilter === 'ALL') {
            setFilteredTenants(tenants);
        } else {
            setFilteredTenants(tenants.filter(t => t.status === activeFilter));
        }
    }, [activeFilter, tenants]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-bill">In Progress</span>;
            case 'TRIAL': return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-bill">Start Free Trial</span>;
            case 'TRIAL_EXPIRED': return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-bill">Trial End</span>;
            case 'TRIAL_COMPLETED_NOT_UPGRADED': return <span className="badge bg-danger text-white border border-danger px-3 py-2 rounded-bill shadow-sm">Trial Complete but not Upgrade</span>;
            case 'UPGRADED': return <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-bill">Successfully Upgrade</span>;
            case 'FAILED': return <span className="badge bg-danger text-white px-3 py-2">Failed</span>;
            default: return <span className="badge bg-secondary text-white px-3 py-2">{status}</span>;
        }
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold fs-3 mb-1">Tenants Lifecycle (Enterprise)</h4>
                        <p className="text-muted fs-14">Monitor registration progress and subscription statuses of all clinics</p>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-4 overflow-auto pb-2 scrollbar-none">
                    {[
                        { label: 'All Tenants', value: 'ALL', count: tenants.length },
                        { label: 'In Progress', value: 'IN_PROGRESS', count: tenants.filter(t => t.status === 'IN_PROGRESS').length },
                        { label: 'Trial Active', value: 'TRIAL', count: tenants.filter(t => t.status === 'TRIAL').length },
                        { label: 'Trial End (No Upgrade)', value: 'TRIAL_COMPLETED_NOT_UPGRADED', count: tenants.filter(t => t.status === 'TRIAL_COMPLETED_NOT_UPGRADED').length },
                        { label: 'Upgraded', value: 'UPGRADED', count: tenants.filter(t => t.status === 'UPGRADED').length },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setActiveFilter(f.value)}
                            className={`btn rounded-pill px-4 py-2 fs-14 transition-all d-flex align-items-center ${activeFilter === f.value ? 'btn-primary text-white shadow' : 'btn-white border text-muted'}`}
                        >
                            {f.label}
                            <span className={`ms-2 badge rounded-pill ${activeFilter === f.value ? 'bg-white text-primary' : 'bg-light text-muted'}`}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Clinic Details</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Owner</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Current Plan</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted text-center">Status</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-12 fw-bold text-muted">Expiry / Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">No tenants found for this filter</td>
                                        </tr>
                                    ) : (
                                        filteredTenants.map((tenant) => (
                                            <tr key={tenant.id}>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-primary-subtle rounded-circle p-2 me-3">
                                                            <i className="ti ti-building-hospital text-primary fs-20" />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold">{tenant.name}</h6>
                                                            <small className="text-primary">@{tenant.subdomain}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <h6 className="mb-0 fs-14">{tenant.ownerName}</h6>
                                                    <small className="text-muted">{tenant.ownerEmail}</small>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <i className="ti ti-package me-2 text-muted" />
                                                        <span className="fw-medium">{tenant.packageName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {getStatusBadge(tenant.status)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="fs-13">
                                                        {tenant.expiresAt ? (
                                                            <span className={new Date(tenant.expiresAt) < new Date() ? 'text-danger fw-bold' : 'text-dark'}>
                                                                Exp: {new Date(tenant.expiresAt).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">Reg: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                                                        )}
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
            </div>
        </div>
    );
};

export default TenantsAdmin;
