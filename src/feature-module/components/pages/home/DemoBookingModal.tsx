import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { SuccessModal } from "./SuccessModal";
import { IconFormControl } from "../../../../core/common/form-fields";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DemoBookingModal = () => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        clinicName: "",
        location: "",
    });
    const [formErrors, setFormErrors] = useState<{name?: string; email?: string; phone?: string}>({});

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
        setFormErrors({});

        let hasError = false;
        const newErrors: any = {};
        
        if (!formData.name.trim()) {
            newErrors.name = "Please enter your full name.";
            hasError = true;
        }
        if (!formData.email.trim()) {
            newErrors.email = "Please enter your email address.";
            hasError = true;
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Please enter your phone number.";
            hasError = true;
        }

        if (hasError) {
            setFormErrors(newErrors);
            return;
        }

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
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Full Name</label>
                                <IconFormControl type="text" fieldLabel="name" className={formErrors.name ? 'is-invalid' : ''} name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px 10px 36px' }} />
                                {formErrors.name && <div className="invalid-feedback d-block">{formErrors.name}</div>}
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark">Email Address <span className="text-danger">*</span></label>
                                    <IconFormControl type="email" fieldLabel="email" className={formErrors.email ? 'is-invalid' : ''} name="email" placeholder="Enter your email address" value={formData.email} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px 10px 36px' }} />
                                    {formErrors.email && <div className="invalid-feedback d-block">{formErrors.email}</div>}
                                </div>
                                <div className="col-md-6 mt-3 mt-md-0">
                                    <label className="form-label fw-semibold text-dark">Phone Number <span className="text-danger">*</span></label>
                                    <IconFormControl type="tel" fieldLabel="phone" className={formErrors.phone ? 'is-invalid' : ''} name="phone" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} required style={{ borderRadius: '8px', padding: '10px 14px 10px 36px' }} />
                                    {formErrors.phone && <div className="invalid-feedback d-block">{formErrors.phone}</div>}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Clinic Name</label>
                                <IconFormControl type="text" fieldLabel="company" name="clinicName" placeholder="Enter your clinic name" value={formData.clinicName} onChange={handleChange} style={{ borderRadius: '8px', padding: '10px 14px 10px 36px' }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-dark">Location (City, Country)</label>
                                <IconFormControl type="text" fieldLabel="location" name="location" placeholder="e.g. New York, USA" value={formData.location} onChange={handleChange} style={{ borderRadius: '8px', padding: '10px 14px 10px 36px' }} />
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
                title="Demo Request Submitted"
                message="We will reach out to you shortly."
            />
        </>
    );
};
