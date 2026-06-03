import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";

export const DemoBookingModal = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        clinicName: "",
        location: "",
        dateTime: "",
    });

    const location = useLocation();

    useEffect(() => {
        if (location.hash === "#demo") {
            setShow(true);
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }, [location]);

    useEffect(() => {
        // Also add click listeners to all links pointing to #demo in case hash doesn't change
        const checkClicks = (e: any) => {
            const target = e.target.closest('a[href$="#demo"]');
            if (target) {
                e.preventDefault();
                setShow(true);
            }
        };
        document.addEventListener("click", checkClicks);

        return () => {
            document.removeEventListener("click", checkClicks);
        };
    }, []);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/demo-booking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to book demo");
            }

            alert("Demo booked successfully! We will contact you soon.");
            setShow(false);
            setFormData({
                name: "",
                email: "",
                phone: "",
                clinicName: "",
                location: "",
                dateTime: "",
            });
        } catch (error) {
            alert("An error occurred. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={() => setShow(false)} centered backdrop="static">
            <div className="modal-content">
                <div className="modal-header bg-primary">
                    <h5 className="modal-title text-white">Book a Live Demo</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShow(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body p-4">
                    <p className="text-muted mb-4">Please fill in your details below to schedule a live demo of DocYori.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Email Address <span className="text-danger">*</span></label>
                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                                <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Clinic Name</label>
                            <input type="text" className="form-control" name="clinicName" value={formData.clinicName} onChange={handleChange} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Location (City, Country)</label>
                            <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Preferred Date & Time</label>
                            <input type="datetime-local" className="form-control" name="dateTime" value={formData.dateTime} onChange={handleChange} required />
                        </div>
                        <div className="text-end mt-4">
                            <button type="button" className="btn btn-light me-2" onClick={() => setShow(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "Booking..." : "Submit Booking"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};
