import { useEffect, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { IconFormControl } from "../../../../core/common/form-fields";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface DemoBooking {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string | null;
    clinicName: string | null;
    dateTime: string | null;
    status: string;
    createdAt: string;
}

const DemoBookingsAdmin = () => {
    const [bookings, setBookings] = useState<DemoBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [searchText, setSearchText] = useState("");

    // Modal states
    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [activeBooking, setActiveBooking] = useState<DemoBooking | null>(null);
    const [newStatus, setNewStatus] = useState("");

    const openViewModal = (booking: DemoBooking) => { setActiveBooking(booking); setViewModal(true); };
    const openEditModal = (booking: DemoBooking) => { setActiveBooking(booking); setNewStatus(booking.status); setEditModal(true); };
    const openDeleteModal = (booking: DemoBooking) => { setActiveBooking(booking); setDeleteModal(true); };

    const fetchBookings = async () => {
        try {
            const response = await fetch(`${API}/api/demo-booking`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Error fetching demo bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleSaveStatus = async (id: string) => {
        try {
            const response = await fetch(`${API}/api/demo-booking/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setBookings((prev) =>
                    prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
                );
                setEditModal(false);
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSingleDelete = async () => {
        if (!activeBooking) return;
        try {
            const response = await fetch(`${API}/api/demo-booking/${activeBooking.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBookings((prev) => prev.filter((b) => b.id !== activeBooking.id));
                setSelectedBookings((prev) => prev.filter((id) => id !== activeBooking.id));
                setDeleteModal(false);
            }
        } catch (error) {
            console.error("Error deleting demo booking:", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBookings.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete the ${selectedBookings.length} selected demo bookings?`)) return;

        try {
            const response = await fetch(`${API}/api/demo-booking/bulk-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: selectedBookings }),
            });

            if (response.ok) {
                setBookings((prev) => prev.filter((b) => !selectedBookings.includes(b.id)));
                setSelectedBookings([]);
            }
        } catch (error) {
            console.error("Error bulk deleting demo bookings:", error);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedBookings(finalBookings.map((b) => b.id));
        } else {
            setSelectedBookings([]);
        }
    };

    const handleSelectBooking = (id: string) => {
        if (selectedBookings.includes(id)) {
            setSelectedBookings(selectedBookings.filter((item) => item !== id));
        } else {
            setSelectedBookings([...selectedBookings, id]);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">Pending</span>;
            case "Scheduled":
                return <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">Scheduled</span>;
            case "Finish":
                return <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">Completed</span>;
            default:
                return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 rounded-pill">{status}</span>;
        }
    };

    const finalBookings = bookings.filter((b) =>
        (b.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (b.email || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (b.phone || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (b.clinicName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (b.location || "").toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="page-wrapper">
            <div className="content content-two">
                {/* Header & Actions */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 border-bottom pb-4 gap-3">
                    <div>
                        <h4 className="fw-bold mb-1">Demo Bookings</h4>
                        <p className="text-muted fs-14 mb-0">Monitor request submissions and scheduling statuses</p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {selectedBookings.length > 0 && (
                            <button
                                className="btn btn-danger btn-md d-flex align-items-center gap-2 px-3 fw-bold fs-13"
                                style={{ height: '38px', borderRadius: '6px' }}
                                onClick={handleBulkDelete}
                            >
                                <i className="ti ti-trash fs-16" /> Delete Selected ({selectedBookings.length})
                            </button>
                        )}
                        <div className="position-relative">
                            <IconFormControl
                                type="text"
                                fieldLabel="search"
                                className="px-3"
                                style={{ height: '38px', width: '220px', borderRadius: '6px', fontSize: '13px' }}
                                placeholder="Search bookings..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
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
                                                    checked={selectedBookings.length === finalBookings.length && finalBookings.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-3 py-3 border-0 text-uppercase fs-11 fw-bold text-muted" style={{ width: '80px' }}>Sr No</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Submission Date</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Name</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Email</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Phone</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Clinic Name</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted">Location</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted text-center">Status</th>
                                        <th className="px-4 py-3 border-0 text-uppercase fs-11 fw-bold text-muted text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status" />
                                            </td>
                                        </tr>
                                    ) : finalBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-5 text-muted">No demo bookings found</td>
                                        </tr>
                                    ) : (
                                        finalBookings.map((booking, index) => (
                                            <tr key={booking.id} className={selectedBookings.includes(booking.id) ? 'bg-primary-subtle' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedBookings.includes(booking.id)}
                                                            onChange={() => handleSelectBooking(booking.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="fw-bold text-muted">#{String(index + 1).padStart(2, '0')}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="fs-13">
                                                        <i className="ti ti-calendar-event me-1 text-muted" />
                                                        {new Date(booking.createdAt).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <h6 className="mb-0 fw-bold fs-14">{booking.name || "-"}</h6>
                                                </td>
                                                <td className="px-4 py-3 fs-13 text-muted">{booking.email}</td>
                                                <td className="px-4 py-3 fs-13 fw-medium">{booking.phone}</td>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <i className="ti ti-building me-2 text-muted fs-14" />
                                                        <span className="fw-medium fs-13">{booking.clinicName || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 fs-13 text-muted">{booking.location || "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
                                                        <button className="bg-transparent border-0 text-info p-1" title="View Details" onClick={() => openViewModal(booking)}>
                                                            <i className="ti ti-eye fs-18" />
                                                        </button>
                                                        <button className="bg-transparent border-0 text-primary p-1" title="Edit Status" onClick={() => openEditModal(booking)}>
                                                            <i className="ti ti-edit fs-18" />
                                                        </button>
                                                        <button className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={() => openDeleteModal(booking)}>
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
            {viewModal && activeBooking && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0 bg-primary-subtle" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h5 className="modal-title fw-bold d-flex align-items-center">
                                    <i className="ti ti-calendar-event me-2 text-primary fs-20"></i>
                                    Demo Booking Details: {activeBooking.name || "N/A"}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setViewModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    {/* Column 1: Requester Details */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-user-circle me-2 text-primary fs-18"></i>Requester Details</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Name</p>
                                                <h6 className="fw-bold fs-14 text-dark mb-0">{activeBooking.name || "N/A"}</h6>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Email Address</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-mail me-2 text-muted"></i>{activeBooking.email}
                                                </p>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Phone Number</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-phone me-2 text-muted"></i>{activeBooking.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Clinic & Location */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-building me-2 text-primary fs-18"></i>Clinic & Location</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Clinic Name</p>
                                                <h6 className="fw-bold fs-14 text-dark mb-0">{activeBooking.clinicName || "N/A"}</h6>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Location</p>
                                                <p className="fs-13 text-dark mb-0 d-flex align-items-center">
                                                    <i className="ti ti-map-pin me-2 text-muted"></i>{activeBooking.location || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Status Details */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-clock-hour-4 me-2 text-success fs-18"></i>Session Status</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Current Status</p>
                                                <div className="mt-1">{getStatusBadge(activeBooking.status)}</div>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Requested Date & Time</p>
                                                <span className="fs-13 text-dark fw-medium">
                                                    <i className="ti ti-calendar me-1 text-muted"></i>
                                                    {activeBooking.dateTime ? new Date(activeBooking.dateTime).toLocaleString() : "Flexible / Not set"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 4: Metadata */}
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 h-100 border border-light-subtle shadow-sm">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center text-dark"><i className="ti ti-info-square-rounded me-2 text-warning fs-18"></i>Metadata</h6>
                                            <div className="mb-3">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Submission Date</p>
                                                <span className="fs-13 text-dark fw-medium">
                                                    <i className="ti ti-calendar-plus me-1 text-muted"></i>
                                                    {new Date(activeBooking.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="mb-0">
                                                <p className="text-muted fs-11 fw-semibold text-uppercase mb-0">Booking ID</p>
                                                <span className="fs-13 text-dark font-monospace">{activeBooking.id}</span>
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

            {/* Edit Status Modal */}
            {editModal && activeBooking && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px', backgroundColor: '#2E37A4' }}>
                                <h5 className="modal-title fw-bold d-flex align-items-center text-white">
                                    <i className="ti ti-edit me-2 fs-20 text-white"></i>
                                    Update Booking Status
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setEditModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold fs-13 text-muted">Requester Name</label>
                                    <IconFormControl type="text" fieldLabel="name" placeholder="Requester Name" value={activeBooking.name || "N/A"} disabled />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-semibold fs-13 text-muted">Status</label>
                                    <select className="form-select" defaultValue={activeBooking.status} onChange={(e) => setNewStatus(e.target.value)}>
                                        <option value="Pending">Pending</option>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Finish">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button type="button" className="btn btn-light" onClick={() => setEditModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={() => handleSaveStatus(activeBooking.id)}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && activeBooking && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: '15px' }}>
                            <div className="mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-transparent text-danger mb-3" style={{ width: '80px', height: '80px' }}>
                                    <i className="ti ti-trash fs-36"></i>
                                </div>
                                <h4 className="fw-bold text-dark mb-2">Delete Booking?</h4>
                                <p className="text-muted fs-14 mb-0">Are you sure you want to delete demo booking for <strong className="text-dark">{activeBooking.name || "this user"}</strong>? This action cannot be undone.</p>
                            </div>
                            <div className="d-flex gap-2 justify-content-center">
                                <button type="button" className="btn btn-light w-50 fw-semibold" onClick={() => setDeleteModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger w-50 fw-semibold" onClick={handleSingleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoBookingsAdmin;
