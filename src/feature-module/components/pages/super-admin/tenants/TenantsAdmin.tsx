import { useState, useEffect } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

interface Tenant {
    id: string;
    name: string;
    username: string;
    ownerName: string;
    ownerEmail: string;
    packageName: string;
    status: 'IN_PROGRESS' | 'TRIAL' | 'TRIAL_EXPIRED' | 'TRIAL_COMPLETED_NOT_UPGRADED' | 'UPGRADED' | 'FAILED';
    expiresAt: string | null;
    createdAt: string;
    phone?: string;
    whatsappNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    doctorCount?: number | null;
    doctorsCount?: number;
    staffsCount?: number;
    patientsCount?: number;
}

interface Package {
    id: string;
    name: string;
    price: number;
    durationInDays: number;
    isActive: boolean;
}

const TenantsAdmin = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchText, setSearchText] = useState("");
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

    // Modal states
    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

    const [editPackageId, setEditPackageId] = useState<string>("");
    const [editStatus, setEditStatus] = useState<string>("");
    const [saving, setSaving] = useState(false);

    const openViewModal = (tenant: Tenant) => { setActiveTenant(tenant); setViewModal(true); };
    const openEditModal = (tenant: Tenant) => { 
        setActiveTenant(tenant); 
        const currentPkg = packages.find(p => p.name === tenant.packageName);
        setEditPackageId(currentPkg?.id || "");
        setEditStatus(tenant.status);
        setEditModal(true); 
    };
    const openDeleteModal = (tenant: Tenant) => { setActiveTenant(tenant); setDeleteModal(true); };

    const handleSaveChanges = async () => {
        if (!activeTenant) return;
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiUrl(`/api/tenants/${activeTenant.id}/status`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: editStatus,
                    packageId: editPackageId
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update tenant");
            }

            toast.success("Tenant subscription details updated successfully");
            setEditModal(false);
            fetchTenants(); // Reload tenants
        } catch (error: any) {
            console.error("Error updating tenant:", error);
            toast.error(error.message || "Error updating tenant");
        } finally {
            setSaving(false);
        }
    };

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
        fetchTenants();
        fetchPackages();
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
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 border-bottom pb-4 gap-3">
                    {/* Left: Title */}
                    <div>
                        <h4 className="fw-bold mb-1">Tenants Lifecycle (Enterprise)</h4>
                        <p className="text-muted fs-14 mb-0">Monitor registration progress and subscription statuses</p>
                    </div>

                    {/* Middle: Filters */}
                    <div className="d-flex gap-2 overflow-auto scrollbar-none flex-grow-1 justify-content-xl-center justify-content-start">
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
                                className={`btn rounded-pill px-4 py-2 fs-13 transition-all d-flex align-items-center flex-shrink-0 ${activeFilter === f.value ? 'btn-primary text-white shadow' : 'btn-white border text-muted'}`}
                            >
                                {f.label}
                                <span className={`ms-2 badge rounded-pill ${activeFilter === f.value ? 'bg-white text-primary' : 'bg-light text-muted'}`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Right: Actions */}
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
                    </div>
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
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted text-center">Action</th>
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
                                                <td className="px-4 py-3 text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
                                                        <button className="bg-transparent border-0 text-info p-1" title="View Details" onClick={() => openViewModal(tenant)}>
                                                            <i className="ti ti-eye fs-18" />
                                                        </button>
                                                        <button className="bg-transparent border-0 text-primary p-1" title="Edit" onClick={() => openEditModal(tenant)}>
                                                            <i className="ti ti-edit fs-18" />
                                                        </button>
                                                        <button className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={() => openDeleteModal(tenant)}>
                                                            <i className="ti ti-trash fs-18" />
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

            {/* View Modal */}
            {viewModal && activeTenant && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0 bg-primary" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h5 className="modal-title fw-bold d-flex align-items-center text-white">
                                    <i className="ti ti-building-hospital me-2 fs-20"></i>
                                    Clinic Profile: {activeTenant.name}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setViewModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    {/* Column 1: Basic Info */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-info-square-rounded me-2 text-primary fs-18"></i>Basic Information</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Clinic Name</p>
                                                <h6 className="fw-bold fs-14 text-dark mb-0">{activeTenant.name}</h6>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Clinic Username / Subdomain</p>
                                                <h6 className="fw-bold fs-14 text-dark mb-0 font-monospace text-primary">{activeTenant.username || "N/A"}</h6>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Clinic ID</p>
                                                <p className="fs-13 text-dark font-monospace mb-0">{activeTenant.id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Owner Details */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-user-circle me-2 text-primary fs-18"></i>Owner Details</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Owner Name</p>
                                                <h6 className="fw-bold fs-14 text-dark mb-0">{activeTenant.ownerName}</h6>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Email Address</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-mail me-2 text-muted"></i>{activeTenant.ownerEmail}
                                                </p>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Phone Number</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-phone me-2 text-muted"></i>{activeTenant.phone || "N/A"}
                                                </p>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">WhatsApp Number</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-brand-whatsapp me-2 text-success"></i>{activeTenant.whatsappNumber || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Location Details */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-map-pin me-2 text-primary fs-18"></i>Location Details</h6>
                                            <div className="mb-2">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Primary Address</p>
                                                <p className="fs-13 text-dark mb-0">{activeTenant.addressLine1 || "N/A"}</p>
                                            </div>
                                            {activeTenant.addressLine2 && activeTenant.addressLine2 !== "N/A" && (
                                                <div className="mb-2">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Secondary Address</p>
                                                    <p className="fs-13 text-dark mb-0">{activeTenant.addressLine2}</p>
                                                </div>
                                            )}
                                            <div className="row g-2">
                                                <div className="col-6 mb-2">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">City</p>
                                                    <p className="fs-13 text-dark mb-0">{activeTenant.city || "N/A"}</p>
                                                </div>
                                                <div className="col-6 mb-2">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">District</p>
                                                    <p className="fs-13 text-dark mb-0">{activeTenant.district || "N/A"}</p>
                                                </div>
                                                <div className="col-6">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">State & Country</p>
                                                    <p className="fs-13 text-dark mb-0">
                                                        {activeTenant.state ? `${activeTenant.state}, ` : ""}
                                                        {activeTenant.country || "N/A"}
                                                    </p>
                                                </div>
                                                <div className="col-6">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Pincode</p>
                                                    <p className="fs-13 text-dark mb-0">{activeTenant.pincode || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 4: Subscription & Status */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-shield-check me-2 text-success fs-18"></i>Subscription & Status</h6>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div>
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Current Plan</p>
                                                    <h6 className="fw-bold fs-14 text-dark mb-0 d-flex align-items-center"><i className="ti ti-package me-1 text-primary"></i>{activeTenant.packageName}</h6>
                                                </div>
                                                <div>
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Status</p>
                                                    <div className="mt-1">{getStatusBadge(activeTenant.status)}</div>
                                                </div>
                                            </div>
                                            <hr className="my-2 border-dashed" />
                                            <div className="d-flex align-items-center justify-content-between pt-2">
                                                <div>
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Joined Date</p>
                                                    <span className="fs-13 text-dark fw-medium"><i className="ti ti-calendar-plus me-1 text-muted"></i>{new Date(activeTenant.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-end">
                                                    <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Expiry Date</p>
                                                    {activeTenant.expiresAt ? (
                                                        <span className={`fs-13 fw-medium ${new Date(activeTenant.expiresAt) < new Date() ? 'text-danger fw-bold' : 'text-dark'}`}>
                                                            <i className="ti ti-calendar-time me-1 text-muted"></i>{new Date(activeTenant.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="fs-13 text-muted">No Expiry</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 justify-content-center">
                                <button type="button" className="btn btn-primary px-5 rounded-pill shadow-sm" onClick={() => setViewModal(false)}>Close View</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && activeTenant && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0 bg-primary" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h5 className="modal-title fw-bold d-flex align-items-center text-white">
                                    <i className="ti ti-edit me-2 fs-20"></i>
                                    Edit Clinic Details
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setEditModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold fs-13 text-muted">Clinic Name</label>
                                    <input type="text" className="form-control" value={activeTenant.name} disabled />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold fs-13 text-muted">Assign Package</label>
                                    <select 
                                        className="form-select" 
                                        value={editPackageId} 
                                        onChange={(e) => setEditPackageId(e.target.value)}
                                    >
                                        <option value="">No Plan</option>
                                        {packages.filter(p => p.isActive).map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-semibold fs-13 text-muted">Status</label>
                                    <select 
                                        className="form-select" 
                                        value={editStatus} 
                                        onChange={(e) => setEditStatus(e.target.value)}
                                    >
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="TRIAL">Trial Active</option>
                                        <option value="TRIAL_EXPIRED">Trial Expired</option>
                                        <option value="TRIAL_COMPLETED_NOT_UPGRADED">Trial Complete (Not Upgraded)</option>
                                        <option value="UPGRADED">Upgraded</option>
                                        <option value="FAILED">Failed</option>
                                    </select>
                                    <div className="form-text mt-2 text-info d-flex align-items-center">
                                        <i className="ti ti-info-circle me-1"></i>
                                        <span style={{ fontSize: '11px' }}>Apply package upgrade and lifecycle status here.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button type="button" className="btn btn-light" onClick={() => setEditModal(false)} disabled={saving}>Cancel</button>
                                <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={handleSaveChanges} disabled={saving}>
                                    {saving && <span className="spinner-border spinner-border-sm" role="status" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && activeTenant && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: '15px' }}>
                            <div className="mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-transparent text-danger mb-3" style={{ width: '80px', height: '80px' }}>
                                    <i className="ti ti-trash fs-36"></i>
                                </div>
                                <h4 className="fw-bold text-dark mb-2">Delete Clinic?</h4>
                                <p className="text-muted fs-14 mb-0">Are you sure you want to delete <strong className="text-dark">{activeTenant.name}</strong>? This action cannot be undone.</p>
                            </div>
                            <div className="d-flex gap-2 justify-content-center">
                                <button type="button" className="btn btn-light w-50 fw-semibold" onClick={() => setDeleteModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger w-50 fw-semibold" onClick={() => setDeleteModal(false)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsAdmin;
