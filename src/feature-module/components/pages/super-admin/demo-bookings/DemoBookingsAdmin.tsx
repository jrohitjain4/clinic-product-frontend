import { useEffect, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DemoBookingsAdmin = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`${API}/api/demo-booking/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Update local state instead of refetching for better UX
                setBookings((prev: any) =>
                    prev.map((b: any) => (b.id === id ? { ...b, status: newStatus } : b))
                );
                // Simple alert if toast not available or not configured
                // alert(`Status updated to ${newStatus}`);
            } else {
                console.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-soft-warning text-warning border-warning";
            case "Scheduled":
                return "bg-soft-info text-info border-info";
            case "Finish":
                return "bg-soft-success text-success border-success";
            default:
                return "bg-soft-secondary text-secondary border-secondary";
        }
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="row">
                        <div className="col-sm-12">
                            <h3 className="page-title">Demo Bookings</h3>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to={all_routes.dashboard}>Dashboard</Link>
                                </li>
                                <li className="breadcrumb-item active">Demo Bookings</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm-12">
                        <div className="card">
                            <div className="card-body">
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading bookings...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive" style={{ minHeight: '300px', overflow: 'visible' }}>
                                        <table className="table table-center mb-0 custom-table" style={{ overflow: 'visible' }}>
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Clinic Name</th>
                                                    <th>Location</th>
                                                    <th className="text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ overflow: 'visible' }}>
                                                {bookings.length > 0 ? (
                                                    bookings.map((booking: any) => (
                                                        <tr key={booking.id}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {booking.dateTime ? new Date(booking.dateTime).toLocaleString() : "-"}
                                                                </span>
                                                                <br />
                                                                <small className="text-muted">
                                                                    Sub: {new Date(booking.createdAt).toLocaleDateString()}
                                                                </small>
                                                            </td>
                                                            <td>{booking.name || "-"}</td>
                                                            <td>{booking.email}</td>
                                                            <td>{booking.phone}</td>
                                                            <td>{booking.clinicName || "-"}</td>
                                                            <td>{booking.location || "-"}</td>
                                                            <td className="text-center">
                                                                <div className="dropdown">
                                                                    <button
                                                                        className={`btn btn-sm border dropdown-toggle d-inline-flex align-items-center ${getStatusBadge(booking.status)}`}
                                                                        type="button"
                                                                        data-bs-toggle="dropdown"
                                                                        aria-expanded="false"
                                                                        style={{ padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}
                                                                    >
                                                                        {booking.status}
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2">
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item py-2"
                                                                                onClick={() => handleStatusChange(booking.id, "Pending")}
                                                                            >
                                                                                <i className="far fa-clock me-2 text-warning" /> Pending
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item py-2"
                                                                                onClick={() => handleStatusChange(booking.id, "Scheduled")}
                                                                            >
                                                                                <i className="far fa-calendar-check me-2 text-info" /> Scheduled
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item py-2"
                                                                                onClick={() => handleStatusChange(booking.id, "Finish")}
                                                                            >
                                                                                <i className="far fa-check-circle me-2 text-success" /> Finish
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-5">
                                                            <div className="text-muted">No demo bookings found.</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoBookingsAdmin;

