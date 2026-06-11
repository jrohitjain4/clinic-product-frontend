import { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";

interface Tenant {
    id: string;
    name: string;
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
    const [searchText, setSearchText] = useState("");
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

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

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTenants(finalTenants.map(t => t.id));
        } else {
            setSelectedTenants([]);
        }
    };

    const handleSelectTenant = (id: string) => {
        if (selectedTenants.includes(id)) {
            setSelectedTenants(selectedTenants.filter(item => item !== id));
        } else {
            setSelectedTenants([...selectedTenants, id]);
        }
    };

    const handleBulkDelete = () => {
        console.log("Bulk deleting tenants:", selectedTenants);
        setSelectedTenants([]);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">In Progress</span>;
            case 'TRIAL': return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">Start Free Trial</span>;
            case 'TRIAL_EXPIRED': return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill">Trial End</span>;
            case 'TRIAL_COMPLETED_NOT_UPGRADED': return <span className="badge bg-danger text-white border border-danger px-3 py-2 rounded-pill shadow-sm">Trial Complete but not Upgrade</span>;
            case 'UPGRADED': return <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">Successfully Upgrade</span>;
            case 'FAILED': return <span className="badge bg-danger text-white px-3 py-2">Failed</span>;
            default: return <span className="badge bg-secondary text-white px-3 py-2">{status}</span>;
        }
    };

    const finalTenants = filteredTenants.filter(t =>
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchText.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="content content-two">
                {/* Header & Search Area */}
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Tenants Lifecycle (Enterprise)</h4>
                        <p className="text-muted fs-14 mb-0">Monitor registration progress and subscription statuses</p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {selectedTenants.length > 0 && (
                            <button
                                className="btn btn-danger btn-md d-flex align-items-center gap-2 px-3 fw-bold fs-13 me-2"
                                style={{ height: '38px', borderRadius: '6px' }}
                                onClick={handleBulkDelete}
                            >
                                <i className="ti ti-trash fs-16" /> Delete Selected ({selectedTenants.length})
                            </button>
                        )}

                        <div className="position-relative">
                            <i className="ti ti-search position-absolute top-50 translate-middle-y ms-2 text-muted fs-14" />
                            <input
                                type="text"
                                className="form-control text-end"
                                placeholder="Search clinic, owner..."
                                style={{ width: '220px', paddingLeft: '30px', height: '38px', fontSize: '13px' }}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        <button className="btn btn-primary d-flex align-items-center gap-2 px-3" style={{ height: '38px' }}>
                            <i className="ti ti-plus" /> Add Tenant
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="d-flex gap-2 mb-4 overflow-auto pb-2 scrollbar-none">
                    {[
                        { label: 'All Tenants', value: 'ALL', count: tenants.length },
                        { label: 'In Progress', value: 'IN_PROGRESS', count: tenants.filter(t => t.status === 'IN_PROGRESS').length },
                        { label: 'Trial Active', value: 'TRIAL', count: tenants.filter(t => t.status === 'TRIAL').length },
                        { label: 'Trial End', value: 'TRIAL_COMPLETED_NOT_UPGRADED', count: tenants.filter(t => t.status === 'TRIAL_COMPLETED_NOT_UPGRADED').length },
                        { label: 'Upgraded', value: 'UPGRADED', count: tenants.filter(t => t.status === 'UPGRADED').length },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setActiveFilter(f.value)}
                            className={`btn rounded-pill px-4 py-2 fs-13 transition-all d-flex align-items-center ${activeFilter === f.value ? 'btn-primary text-white shadow' : 'btn-white border text-muted'}`}
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
                                        <th className="px-4 py-3 border-0" style={{ width: '40px' }}>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input mt-0"
                                                    type="checkbox"
                                                    checked={selectedTenants.length === finalTenants.length && finalTenants.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 border-0 text-uppercase fs-11 fw-bold text-muted" style={{ width: '80px' }}>Sr No</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Clinic Details</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Owner</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Current Plan</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted text-center">Status</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Expiry / Date</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status" />
                                            </td>
                                        </tr>
                                    ) : finalTenants.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5 text-muted">No tenants found for this filter</td>
                                        </tr>
                                    ) : (
                                        finalTenants.map((tenant, index) => (
                                            <tr key={tenant.id} className={selectedTenants.includes(tenant.id) ? 'bg-primary-subtle' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedTenants.includes(tenant.id)}
                                                            onChange={() => handleSelectTenant(tenant.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="fw-bold text-muted">#{String(index + 1).padStart(2, '0')}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-primary-subtle rounded p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="ti ti-building-hospital text-primary fs-18" />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold fs-14">{tenant.name}</h6>
                                                            <small className="text-muted">ID: {tenant.id.slice(0, 8)}...</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <h6 className="mb-0 fs-13 fw-medium">{tenant.ownerName}</h6>
                                                    <small className="text-muted">{tenant.ownerEmail}</small>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <i className="ti ti-package me-2 text-muted fs-14" />
                                                        <span className="fw-medium fs-13">{tenant.packageName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {getStatusBadge(tenant.status)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="fs-13">
                                                        {tenant.expiresAt ? (
                                                            <span className={new Date(tenant.expiresAt) < new Date() ? 'text-danger fw-bold' : 'text-dark'}>
                                                                <i className="ti ti-calendar-event me-1" />
                                                                {new Date(tenant.expiresAt).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">
                                                                <i className="ti ti-clock-hour-4 me-1" />
                                                                {new Date(tenant.createdAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                                        <button className="btn btn-soft-primary btn-icon btn-sm" title="View Details">
                                                            <i className="ti ti-eye fs-14" />
                                                        </button>
                                                        <button className="btn btn-soft-danger btn-icon btn-sm" title="Delete">
                                                            <i className="ti ti-trash fs-14" />
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
            </div>
        </div>
    );
};

export default TenantsAdmin;
