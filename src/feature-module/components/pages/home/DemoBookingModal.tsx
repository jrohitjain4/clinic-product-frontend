import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { SuccessModal } from "./SuccessModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DemoBookingModal = () => {
    const getNextDayDateTimeString = () => {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(10, 0, 0, 0); // Default to 10:00 AM next day
        
        const year = nextDay.getFullYear();
        const month = String(nextDay.getMonth() + 1).padStart(2, '0');
        const day = String(nextDay.getDate()).padStart(2, '0');
        const hours = String(nextDay.getHours()).padStart(2, '0');
        const minutes = String(nextDay.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        clinicName: "",
        location: "",
        dateTime: getNextDayDateTimeString(),
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
            const response = await fetch(`${API}/api/demo-booking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to book demo");
            }

            setShow(false);
            setShowSuccess(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                clinicName: "",
                location: "",
                dateTime: getNextDayDateTimeString(),
            });
        } catch (error) {
            alert("An error occurred. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal show={show} onHide={() => setShow(false)} centered backdrop="static">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="modal-header bg-primary border-0 p-4">
                        <h5 className="modal-title text-white fw-bold">Book a Live Demo</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShow(false)} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4">
                        <p className="text-muted mb-4">Please fill in your details below to schedule a live demo of DocYori.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Full Name</label>
                                <input type="text" className="form-control" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px' }} />
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark">Email Address <span className="text-danger">*</span></label>
                                    <input type="email" className="form-control" name="email" placeholder="Enter your email address" value={formData.email} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px' }} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark">Phone Number <span className="text-danger">*</span></label>
                                    <input type="tel" className="form-control" name="phone" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px' }} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Clinic Name</label>
                                <input type="text" className="form-control" name="clinicName" placeholder="Enter your clinic name" value={formData.clinicName} onChange={handleChange} style={{ borderRadius: '8px', padding: '10px 14px' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Location (City, Country)</label>
                                <input type="text" className="form-control" name="location" placeholder="e.g. New York, USA" value={formData.location} onChange={handleChange} style={{ borderRadius: '8px', padding: '10px 14px' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Preferred Date & Time</label>
                                <input type="datetime-local" className="form-control" name="dateTime" placeholder="Select preferred date & time" value={formData.dateTime} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px' }} />
                            </div>
                            <div className="text-end mt-4">
                                <button type="button" className="btn btn-light me-2 fw-semibold px-4 py-2" onClick={() => setShow(false)} style={{ borderRadius: '8px' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary fw-semibold px-4 py-2" disabled={loading} style={{ borderRadius: '8px' }}>
                                    {loading ? "Booking..." : "Submit Booking"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <SuccessModal 
                show={showSuccess} 
                onHide={() => setShowSuccess(false)}
                title="demo request submitted"
                message="we will rich you before youre refered time"
            />
        </>
    );
};
