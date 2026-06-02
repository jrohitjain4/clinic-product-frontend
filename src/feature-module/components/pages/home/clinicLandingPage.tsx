import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import FooterFront from "./FooterFront";

interface Doctor {
    id: string;
    name: string;
    qualification: string;
    specialization: string;
    experience: number;
    fee: number;
    days: string;
    timing: string;
    photo: string;
    bio: string;
}
interface Review { name: string; rating: number; feedback: string; }
interface Service { icon: string; label: string; }
interface ClinicData {
    id: string;
    name: string; tagline: string; phone: string; whatsapp: string; email: string;
    address: string; city: string; mapUrl: string; directionsUrl: string;
    about: string; established: number; patientsServed: string; experience: number;
    logo: string; facebook: string; instagram: string;
    doctors: Doctor[]; services: Service[]; reviews: Review[];
    gallery: { url: string; category: string }[];
}

const Stars = ({ n, color, size }: { n: number; color?: string; size?: number }) => (
    <span className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`ti ti-star${s <= n ? "-filled" : ""}`} style={{ color: s <= n ? (color || "#f59e0b") : "#d1d5db", fontSize: size || 14 }} />
        ))}
    </span>
);



export default function ClinicLandingPage() {
    const { clinicId: _clinicId } = useParams();
    const [clinic, setClinic] = useState<ClinicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Booking Modal State ──
    const [showModal, setShowModal] = useState(false);
    const [preselectedDoctor, setPreselectedDoctor] = useState("");
    const [bookForm, setBookForm] = useState({ name: "", phone: "", doctorId: "", date: "", time: "", reason: "" });
    const [bookLoading, setBookLoading] = useState(false);
    const [bookSuccess, setBookSuccess] = useState<string | null>(null);
    const [bookError, setBookError] = useState<string | null>(null);

    // ── Doctor Profile Modal State ──
    const [selectedDocDetails, setSelectedDocDetails] = useState<Doctor | null>(null);
    const [activeTab, setActiveTab] = useState("Monday");

    const openBooking = (doctorId = "") => {
        setPreselectedDoctor(doctorId);
        setBookForm({ name: "", phone: "", doctorId, date: "", time: "", reason: "" });
        setBookSuccess(null);
        setBookError(null);
        setShowModal(true);
        setSelectedDocDetails(null); // Close doctor details modal if it was open
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!_clinicId) return;
        setBookLoading(true);
        setBookError(null);
        setBookSuccess(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/${_clinicId}/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Booking failed");
            setBookSuccess(data.message);
        } catch (err: any) {
            setBookError(err.message);
        } finally {
            setBookLoading(false);
        }
    };

    useEffect(() => {
        if (!_clinicId) return;
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/${_clinicId}`)
            .then(r => {
                if (!r.ok) throw new Error("Clinic not found");
                return r.json();
            })
            .then((data: ClinicData) => {
                setClinic(data);
                document.title = `${data.name} | Docyori`;
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [_clinicId]);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16, background: "#f8fafc" }}>
            <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}></div>
            <p style={{ color: "#64748b", fontFamily: "Inter,sans-serif" }}>Loading clinic...</p>
        </div>
    );

    if (error || !clinic) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
            <i className="ti ti-building-hospital" style={{ fontSize: 56, color: "#e2e8f0" }} />
            <h2 style={{ color: "#1e293b", fontFamily: "Inter,sans-serif" }}>Clinic Not Found</h2>
            <p style={{ color: "#64748b", fontFamily: "Inter,sans-serif" }}>{error || "This clinic page does not exist."}</p>
        </div>
    );

    const avgRating = clinic.reviews.length
        ? Math.round(clinic.reviews.reduce((s, r) => s + r.rating, 0) / clinic.reviews.length)
        : 5;

    const totalReviews = clinic.reviews.length > 0 ? clinic.reviews.length : "350+";

    // Show only real doctors
    const displayDoctors = clinic.doctors;

    // All real clinic doctors for dropdown
    const realDoctors = clinic.doctors;

    return (
        <div className="dy-landing" style={{ minHeight: "100vh" }}>

            {/* ══════ NAVBAR (Docyori Style) ══════ */}
            <nav className="dy-nav bg-white shadow-sm position-sticky top-0" style={{ zIndex: 1000, overflow: 'visible' }}>
                <div className="dy-nav-inner container px-3" style={{ overflow: 'visible' }}>
                    <Link to="/" className="dy-brand d-flex align-items-center text-decoration-none" style={{ height: '70px', overflow: 'visible' }} onClick={() => setSelectedDocDetails(null)}>
                        <img src="/docyari-logo.svg" alt="DocYori" style={{ width: "450px", height: "450px", marginTop: "-175px", marginBottom: "-175px", marginLeft: "-60px", maxWidth: "none" }} />
                    </Link>

                    <ul className="dy-nav-links d-none d-lg-flex mb-0">
                        <li><a href="#hero" className="active" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }}>Home</a></li>
                        <li><a href="#hero" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a></li>
                        <li><a href="#about" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>About Us</a></li>
                        <li><a href="#services" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}>Services</a></li>
                        <li><a href="#contact" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact</a></li>
                    </ul>

                    <div className="dy-nav-actions">
                        <button
                            onClick={() => openBooking()}
                            className="nav-trial px-4 py-2"
                            style={{ background: "#007bff", fontSize: "15px", border: "none", cursor: "pointer" }}
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>
            </nav>

            {/* ══════ DOCTOR DETAILS PROFILE PAGE MODE (CLONE OF ADMIN PANEL) ══════ */}
            {selectedDocDetails ? (
                <div className="page-wrapper" style={{ background: "#f1f5f9", minHeight: "calc(100vh - 80px)", margin: 0 }}>
                    <div className="container-fluid p-0">
                        {/* ═══ Main Layout Row with Left Sidebar Ads ═══ */}
                        <div className="row g-0">
                            {/* Left Sidebar Ads (The Functional Sidebar) */}
                            <div className="col-lg-3 d-none d-lg-block bg-white border-end shadow-sm" style={{ maxWidth: "300px", minHeight: "calc(100vh - 80px)" }}>
                                <div className="sticky-top p-3" style={{ top: "80px", zIndex: 10 }}>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-1.png" className="img-fluid w-100" alt="Ad 1" />
                                    </div>
                                    <div className="card bg-primary text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <h6 className="fw-bold mb-2 text-white">Health Tip</h6>
                                        <p className="fs-12 mb-0 opacity-75">Stay hydrated and exercise daily for a better heart health. Book a consultation now!</p>
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-tall.png" className="img-fluid w-100" alt="Tall Ad" />
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-2.png" className="img-fluid w-100" alt="Ad 2" />
                                    </div>
                                    <div className="card bg-success text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <h6 className="fw-bold mb-2 text-white">Latest News</h6>
                                        <p className="fs-12 mb-0 opacity-75">New cardiology department opening next week. Modern equipment and top specialists.</p>
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-3.png" className="img-fluid w-100" alt="Ad 3" />
                                    </div>

                                    {/* ═══ Left Sidebar Extra Content ═══ */}
                                    <div className="card bg-danger text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-white text-danger rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: 45, height: 45 }}>
                                                <i className="ti ti-phone-filled fs-4" />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0 text-white">Emergency Call</h6>
                                                <p className="fs-14 fw-bold mb-0">+91 12345 67890</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Doctor Content Area */}
                            <div className="col-lg-9 flex-fill p-4">
                                {/* Top Navigation */}
                                <div className="mb-4">
                                    <h6 className="fw-semibold fs-14 mb-0">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); }} className="text-secondary text-decoration-none hover-primary">
                                            <i className="ti ti-arrow-left me-1" />
                                            Back to Search Results
                                        </a>
                                    </h6>
                                </div>

                                {/* Top Hero Card */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                                        <div className="d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3">
                                            <div className="me-3 doctor-profile-img">
                                                <img
                                                    src={selectedDocDetails.photo ? (
                                                        selectedDocDetails.photo.startsWith('http') || selectedDocDetails.photo.startsWith('data:')
                                                            ? selectedDocDetails.photo
                                                            : selectedDocDetails.photo.includes('uploads')
                                                                ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedDocDetails.photo.startsWith('/') ? '' : '/'}${selectedDocDetails.photo}`
                                                                : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/doctors/${selectedDocDetails.photo}`
                                                    ) : `https://placehold.co/120x120/1d4ed8/FFF?text=${selectedDocDetails.name.slice(0, 2).toUpperCase()}`}
                                                    alt={selectedDocDetails.name}
                                                    className="rounded"
                                                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://placehold.co/120x120/1d4ed8/FFF?text=${selectedDocDetails.name.slice(0, 2).toUpperCase()}` }}
                                                />
                                            </div>
                                            <div className="flex-fill">
                                                <div className="d-flex align-items-center mb-1 flex-wrap gap-2">
                                                    <h6 className="mb-0 fw-semibold">{selectedDocDetails.name}</h6>
                                                    {selectedDocDetails.specialization && (
                                                        <span className="badge border bg-white text-dark fw-medium">
                                                            <i className="ti ti-point-filled me-1 text-info" />
                                                            {selectedDocDetails.specialization}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="d-block mb-3 fs-13">
                                                    {selectedDocDetails.qualification} {(selectedDocDetails as any).medicalLicenseNumber ? ` · License: ${(selectedDocDetails as any).medicalLicenseNumber}` : ""}
                                                </span>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    <p className="mb-0 fs-13">
                                                        <i className="ti ti-building-hospital me-1" />
                                                        Clinic : {(selectedDocDetails as any).clinicName || clinic.name}
                                                    </p>
                                                    <span className="badge fw-medium badge-soft-success">
                                                        <i className="ti ti-point-filled me-1 text-success" />
                                                        Available
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="mb-2">Consultation Charge</p>
                                            <h6 className="fs-18 fw-bold mb-3 text-dark">
                                                ₹{selectedDocDetails.fee}
                                                <span className="fw-normal text-secondary fs-14">
                                                    {" "}
                                                    / 30 Min
                                                </span>
                                            </h6>
                                            <button
                                                onClick={() => openBooking(selectedDocDetails.id)}
                                                className="btn btn-primary"
                                            >
                                                <i className="ti ti-calendar-event me-1" />
                                                Book Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-lg-8">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Availability</h5>
                                                <ul className="nav nav-tabs nav-bordered nav-border-bottom mb-3">
                                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                                        <li key={day} className="nav-item flex-fill">
                                                            <button
                                                                type="button"
                                                                className={`nav-link text-center w-100 fw-semibold bg-transparent ${activeTab === day ? "active" : ""}`}
                                                                onClick={() => setActiveTab(day)}
                                                            >
                                                                {day}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    {(() => {
                                                        let scheds = (selectedDocDetails as any).schedules;
                                                        if (typeof scheds === 'string') {
                                                            try { scheds = JSON.parse(scheds); } catch (e) { scheds = {}; }
                                                        }
                                                        if (!scheds || typeof scheds !== 'object') scheds = {};

                                                        const slots = (scheds as any)[activeTab] || [];
                                                        if (!Array.isArray(slots) || slots.length === 0) {
                                                            return <span className="text-muted">Not Available</span>;
                                                        }

                                                        return slots.map((slot: any, idx: number) => (
                                                            <span key={idx} className="d-inline-flex align-items-center bg-light rounded flex-fill text-center justify-content-center p-2 text-dark" style={{ minWidth: "140px" }}>
                                                                {slot.session ? `${slot.session}: ` : ""}{slot.from || slot.startTime} - {slot.to || slot.endTime}
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Short Bio</h5>
                                                <p className="mb-0 text-muted">{selectedDocDetails.bio || "No bio provided."}</p>
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Education Information</h5>
                                                {((selectedDocDetails as any).educations || []).length > 0 ? (
                                                    <ul className="activity-feed rounded mb-0">
                                                        {((selectedDocDetails as any).educations || []).map((edu: any, idx: number) => (
                                                            <li key={`edu-${idx}`} className="feed-item timeline-item" style={{ listStyle: "none", position: "relative", paddingLeft: "30px", marginBottom: "20px", borderLeft: "2px solid #e2e8f0" }}>
                                                                <h6 className="fw-bold mb-1 fs-14">{edu.university ? `${edu.university} - ` : ""}{edu.degree}</h6>
                                                                <p className="mb-0 text-muted fs-13">
                                                                    {edu.from ? new Date(edu.from).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : ""} - {edu.to ? new Date(edu.to).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Present"}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-muted mb-0">No education information added.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Awards &amp; Recognition</h5>
                                                {((selectedDocDetails as any).awards || []).length > 0 ? (
                                                    ((selectedDocDetails as any).awards || []).map((award: any, idx: number) => (
                                                        <div key={`award-${idx}`} className={idx < (selectedDocDetails as any).awards.length - 1 ? "mb-3" : ""}>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="me-2">
                                                                    <i className="ti ti-award" />
                                                                </span>
                                                                <h6 className="mb-0 fw-bold">{award.name || award.award} {award.year ? `(${award.year})` : ""}</h6>
                                                            </div>
                                                            <p className="mb-0 text-muted fs-13">{award.description || "—"}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted mb-0">No awards added.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Certifications</h5>
                                                {((selectedDocDetails as any).certifications || []).length > 0 ? (
                                                    ((selectedDocDetails as any).certifications || []).map((cert: any, idx: number) => (
                                                        <div key={`cert-${idx}`} className={idx < (selectedDocDetails as any).certifications.length - 1 ? "mb-3" : ""}>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="me-2">
                                                                    <i className="ti ti-award" />
                                                                </span>
                                                                <h6 className="mb-0 fw-bold">{cert.name || cert.certification} {cert.year ? `(${cert.year})` : ""}</h6>
                                                            </div>
                                                            <p className="mb-0 text-muted fs-13">{cert.description || "—"}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted mb-0">No certifications added.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-4 fs-16">About</h6>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-file" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Medical License Number</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).medicalLicenseNumber || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-phone" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Phone Number</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).phone || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-mail" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Email Address</h6>
                                                            <p className="mb-0 text-secondary text-break" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).email || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-map-marker-pin" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Location</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{clinic.address}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-calendar-event" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">DOB</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).dob ? new Date((selectedDocDetails as any).dob).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-droplet-filled" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Blood Group</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).bloodGroup || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-user-check" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Year of Experience</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{selectedDocDetails.experience ? `${selectedDocDetails.experience}+ Years` : "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-gender-male" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Gender</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).gender || "—"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ═══ Right Sidebar Fill Widgets ═══ */}
                                        <div className="card border-0 shadow-sm mb-4">
                                            <div className="card-body p-2 px-3">
                                                <h6 className="fw-bold mb-2 fs-14 d-flex align-items-center">
                                                    <i className="ti ti-clock-hour-4 me-2 text-primary" />
                                                    Clinic Hours
                                                </h6>
                                                <table className="table table-borderless table-sm mb-0">
                                                    <tbody className="fs-13">
                                                        <tr><td>Mon - Wed</td><td className="text-end text-primary fw-medium">09:00 - 18:00</td></tr>
                                                        <tr><td>Thu - Fri</td><td className="text-end text-primary fw-medium">09:00 - 18:00</td></tr>
                                                        <tr className="text-danger"><td>Saturday</td><td className="text-end fw-medium">10:00 - 14:00</td></tr>
                                                        <tr className="opacity-50"><td>Sunday</td><td className="text-end">Closed</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Proper Section: Patient Reviews & Trust elements */}
                                <div className="mt-4">
                                    <div className="card shadow-sm border-0">
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                                                <h5 className="fw-bold mb-0">Patient Reviews & Feedback</h5>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold">4.8 / 5.0 Rating</span>
                                                </div>
                                            </div>

                                            {/* Stylized Review Cards */}
                                            <div className="row g-3">
                                                {[
                                                    { name: "Rahul Sharma", date: "12 May 2026", rating: 5, initial: "R", color: "primary", comment: "Excellent experience. The doctor was very professional and explained the diagnosis clearly." },
                                                    { name: "Sanya Gupta", date: "05 May 2026", rating: 5, initial: "S", color: "success", comment: "The staff was helpful and the treatment was very effective. Minimal wait time." },
                                                    { name: "Ankit Verma", date: "28 April 2026", rating: 4, initial: "A", color: "info", comment: "Highly recommended for orthopedic consultation. Modern clinic and great facilities." }
                                                ].map((rev, i) => (
                                                    <div key={i} className="col-lg-4">
                                                        <div className="p-3 rounded-3 border bg-white h-100 shadow-none hover-shadow-sm transition-all">
                                                            <div className="d-flex align-items-center mb-3">
                                                                <div className={`avatar avatar-sm rounded-circle bg-soft-${rev.color} text-${rev.color} fw-bold me-2 d-flex align-items-center justify-content-center`} style={{ width: 35, height: 35 }}>{rev.initial}</div>
                                                                <div className="flex-fill">
                                                                    <div className="text-warning small mb-0">
                                                                        {Array.from({ length: rev.rating }).map((_, idx) => <i key={idx} className="ti ti-star-filled" />)}
                                                                    </div>
                                                                    <small className="text-muted fs-11">{rev.date}</small>
                                                                </div>
                                                            </div>
                                                            <h6 className="fw-bold fs-13 mb-1">{rev.name}</h6>
                                                            <p className="text-secondary fs-12 mb-0 line-clamp-3">"{rev.comment}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-center mt-4">
                                                <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm">
                                                    View All 120+ Reviews
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Action Bar */}
                                    <div className="card shadow-sm border-0 mt-4 overflow-hidden" style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)" }}>
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 text-white">
                                                <div>
                                                    <h5 className="fw-bold text-white mb-1">Still Have Questions?</h5>
                                                    <p className="mb-0 opacity-75 fs-14">Get a free pre-consultation chat with our support team to clear your doubts.</p>
                                                </div>
                                                <div className="d-flex gap-3">
                                                    <button className="btn btn-light fw-bold px-4">Contact Support</button>
                                                    <button onClick={() => openBooking(selectedDocDetails.id)} className="btn btn-warning fw-bold px-4">Book Now</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ══════ HERO ══════ */}
                    <section id="hero" className="position-relative overflow-hidden" style={{ padding: "40px 0 110px", background: "transparent" }}>
                        <div className="container position-relative z-1">
                            <div className="row align-items-center g-5">
                                <div className="col-lg-6">
                                    <h2 className="display-6 fw-bold mb-2" style={{ color: "#1d4ed8", letterSpacing: "-1px" }}>
                                        {clinic.name}
                                    </h2>
                                    <p className="fs-5 text-dark mb-4">{clinic.tagline}</p>

                                    <div className="d-flex flex-wrap gap-4 mb-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-star-filled text-warning fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{avgRating}.0 Rating</h6>
                                                <small className="text-secondary fw-medium">{totalReviews} Reviews</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-user-scan text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.doctors.length}+ Doctors</h6>
                                                <small className="text-secondary fw-medium">Experienced</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-shield-check text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.patientsServed}</h6>
                                                <small className="text-secondary fw-medium">Patients Treated</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: "15px" }}>
                                            <div className="bg-white rounded-circle p-2 shadow-sm"><i className="ti ti-map-pin text-primary" /></div>
                                            {clinic.address}, {clinic.city}
                                        </div>
                                        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: "15px" }}>
                                            <div className="bg-white rounded-circle p-2 shadow-sm"><i className="ti ti-phone text-primary" /></div>
                                            {clinic.phone}
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-3">
                                        <button
                                            onClick={() => openBooking()}
                                            className="btn px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3 text-white shadow"
                                            style={{ background: "#1d4ed8", fontSize: "15px", border: "none", cursor: "pointer" }}
                                        >
                                            <i className="ti ti-calendar-event" /> Book Appointment
                                        </button>
                                        <a
                                            href={`tel:${clinic.phone}`}
                                            className="btn bg-white px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3 shadow-sm"
                                            style={{ color: "#1d4ed8", border: "2px solid #1d4ed8", fontSize: "15px" }}
                                        >
                                            <i className="ti ti-phone" /> Call Now
                                        </a>
                                    </div>
                                </div>

                                {/* Image Column */}
                                <div className="col-lg-6 d-none d-lg-block position-relative">
                                    <img
                                        src={clinic.gallery[0]?.url || "/assets/img/hero-clinic-bg.png"}
                                        alt={clinic.name}
                                        className="img-fluid rounded-4 shadow-lg w-100"
                                        style={{ maxHeight: "400px", objectFit: "cover", objectPosition: "center" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════ FEATURE BAR ══════ */}
                    <div className="position-relative z-2" style={{ marginTop: "-55px" }}>
                        <div className="container">
                            <div className="col-lg-11 mx-auto">
                                <div className="bg-white rounded-4 shadow-lg py-3 px-2" style={{ border: "1px solid #f1f5f9" }}>
                                    <div className="row text-center g-2 row-cols-2 row-cols-md-3 row-cols-lg-6 justify-content-center">
                                        {[
                                            { icon: "ti-user-circle", text: "Experienced Doctors" },
                                            { icon: "ti-device-heart-monitor", text: "Modern Equipment" },
                                            { icon: "ti-calendar-time", text: "Online Booking" },
                                            { icon: "ti-pill", text: "Digital Prescriptions" },
                                            { icon: "ti-wallet", text: "Affordable Fees" },
                                            { icon: "ti-headset", text: "24/7 Support Emergency" },
                                        ].map((f, i) => (
                                            <div key={i} className="col">
                                                <div className="d-flex flex-column align-items-center gap-2">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                                                        <i className={`ti ${f.icon} fs-4`} style={{ color: "#1d4ed8" }} />
                                                    </div>
                                                    <span className="fw-bold text-dark mt-1" style={{ fontSize: "12.5px", letterSpacing: "-0.2px" }}>{f.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══════ ABOUT US ══════ */}
                    <section id="about" className="bg-white">
                        <div className="container py-5 border-top">
                            <div className="row g-5 align-items-center">
                                {/* Text Content */}
                                <div className="col-lg-6">
                                    <h5 className="fw-bold text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>ABOUT {clinic.name.toUpperCase()}</h5>
                                    <p className="fs-5 text-dark mb-4" style={{ lineHeight: 1.6 }}>
                                        {clinic.name} is a multi-speciality healthcare center committed to providing high-quality medical services with compassion and care. We have a team of experienced doctors and modern facilities to ensure the best treatment for you and your family.
                                    </p>

                                    <div className="row g-3 mt-4 text-center">
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1 text-dark" style={{ color: "#1d4ed8" }}>2012</h4>
                                                <small className="text-secondary fw-semibold">Established</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1 text-dark" style={{ color: "#1d4ed8" }}>{clinic.patientsServed}+</h4>
                                                <small className="text-secondary fw-semibold">Patients Served</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1 text-dark" style={{ color: "#1d4ed8" }}>10+</h4>
                                                <small className="text-secondary fw-semibold">Years Experience</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Content */}
                                <div className="col-lg-6">
                                    <img src={clinic.gallery[1]?.url || "/assets/img/clinic-reception.png"} alt="Reception" className="img-fluid rounded-4 shadow" style={{ border: "4px solid #f1f5f9", width: "100%", height: "400px", objectFit: "cover" }} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════ DOCTORS ══════ */}
                    <section id="doctors" className="bg-white">
                        <div className="container pb-5">
                            <div className="text-center mb-5">
                                <h3 className="fw-bold text-uppercase" style={{ letterSpacing: "1px", color: "#1d4ed8" }}>OUR DOCTORS</h3>
                            </div>

                            <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 justify-content-center">
                                {displayDoctors.map((doc, idx) => (
                                    <div key={idx} className="col">
                                        <div
                                            className="card h-100 border bg-white shadow-sm rounded-4 text-center overflow-hidden d-flex flex-column"
                                            style={{ cursor: "pointer", transition: "all 0.2s ease-in-out" }}
                                            onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"}
                                            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            <div onClick={() => setSelectedDocDetails(doc)}>
                                                {/* Photo at the very top */}
                                                <div className="pt-4 bg-white d-flex justify-content-center">
                                                    <img
                                                        src={doc.photo ? (
                                                            doc.photo.startsWith('http') || doc.photo.startsWith('data:')
                                                                ? doc.photo
                                                                : doc.photo.includes('uploads')
                                                                    ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${doc.photo.startsWith('/') ? '' : '/'}${doc.photo}`
                                                                    : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/doctors/${doc.photo}`
                                                        ) : "/assets/img/doctor-placeholder.png"}
                                                        alt={doc.name}
                                                        className="rounded-circle object-fit-cover shadow-sm bg-light"
                                                        style={{ width: "110px", height: "110px", border: "4px solid #f8f9fa" }}
                                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/img/doctor-placeholder.png" }}
                                                    />
                                                </div>
                                                <div className="card-body px-3 pt-3 pb-2 d-flex flex-column" style={{ minHeight: "0" }}>
                                                    <h5 className="fw-bold mb-1 text-dark fs-6">{doc.name}</h5>
                                                    <p className="text-dark fw-semibold small mb-1">{doc.qualification}</p>
                                                    <p className="text-secondary small mb-1">{doc.experience} Years Exp.</p>
                                                    <p className="text-secondary small mb-3">{doc.specialization}</p>

                                                    <h4 className="text-success fw-bold mb-1 fs-5 mt-2">₹{doc.fee}</h4>
                                                    <small className="d-block text-secondary fw-medium mb-3">{doc.days} | {doc.timing}</small>
                                                </div>
                                            </div>
                                            <div className="px-3 pb-4 mt-auto">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openBooking((doc as any).id || ""); }}
                                                    className="btn w-100 fw-bold rounded-3 text-white"
                                                    style={{ background: "#1d4ed8", padding: "10px 0", border: "none", cursor: "pointer" }}
                                                >
                                                    Book Appointment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ══════ INFO WIDGET GRID ══════ */}
                    <section id="services" className="py-5" style={{ background: "#f8f9fa" }}>
                        <div className="container">
                            <div className="row g-4">
                                {/* Services Card */}
                                <div className="col-lg-4">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white text-center d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>SERVICES WE OFFER</h6>
                                        <div className="row row-cols-2 g-3 flex-grow-1">
                                            {[
                                                { i: "ti-stethoscope", t: "General Physician" },
                                                { i: "ti-tooth", t: "Dental Care" },
                                                { i: "ti-baby-bottle", t: "Child Care" },
                                                { i: "ti-woman", t: "Gynecology" },
                                                { i: "ti-flask", t: "Pathology Lab" },
                                                { i: "ti-vaccine", t: "Vaccination" },
                                                { i: "ti-walk", t: "Physiotherapy" },
                                                { i: "ti-heart-rate-monitor", t: "Cardiology" }
                                            ].map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="col d-flex flex-column align-items-center justify-content-center py-2 service-hover-item"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}
                                                >
                                                    <i className={`ti ${s.i} mb-2`} style={{ color: "#1d4ed8", fontSize: "40px" }} />
                                                    <span className="fw-bold text-dark" style={{ fontSize: "13px", lineHeight: "1.3" }}>{s.t}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            className="btn w-100 mt-3 fw-bold py-2"
                                            style={{ border: "2px solid #1d4ed8", color: "#1d4ed8", fontSize: "14px" }}
                                            onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}
                                        >
                                            View All Services
                                        </button>
                                    </div>
                                </div>

                                {/* Booking Card */}
                                <div className="col-lg-4">
                                    <div id="booking-widget" className="card h-100 p-4 border-0 rounded-4 shadow-sm" style={{ background: "#1d4ed8" }}>
                                        <h6 className="fw-bold mb-4 text-white" style={{ letterSpacing: "0.5px" }}>BOOK APPOINTMENT ONLINE</h6>
                                        <form onSubmit={handleBookSubmit}>
                                            <div className="d-flex flex-column gap-3 mb-4">
                                                <input
                                                    type="text"
                                                    className="form-control py-2 border-0 rounded-3 shadow-none"
                                                    placeholder="Your Name"
                                                    style={{ fontSize: "14px" }}
                                                    value={bookForm.name}
                                                    onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    className="form-control py-2 border-0 rounded-3 shadow-none"
                                                    placeholder="Phone Number"
                                                    style={{ fontSize: "14px" }}
                                                    value={bookForm.phone}
                                                    onChange={(e) => setBookForm({ ...bookForm, phone: e.target.value })}
                                                    required
                                                />
                                                <select
                                                    className="form-select py-2 border-0 rounded-3 shadow-none text-secondary"
                                                    style={{ fontSize: "14px" }}
                                                    value={bookForm.doctorId}
                                                    onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Doctor</option>
                                                    {clinic.doctors.map(doc => (
                                                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="date"
                                                    className="form-control py-2 border-0 rounded-3 shadow-none text-secondary"
                                                    style={{ fontSize: "14px" }}
                                                    value={bookForm.date}
                                                    onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                                                    required
                                                />
                                                <select
                                                    className="form-select py-2 border-0 rounded-3 shadow-none text-secondary"
                                                    style={{ fontSize: "14px" }}
                                                    value={bookForm.time}
                                                    onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Time Slot</option>
                                                    {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {bookError && <div className="alert alert-danger py-2 fs-12 mb-3">{bookError}</div>}
                                            {bookSuccess && <div className="alert alert-success py-2 fs-12 mb-3">{bookSuccess}</div>}

                                            <button
                                                type="submit"
                                                disabled={bookLoading}
                                                className="btn w-100 mt-auto fw-bold text-white shadow-sm py-2 d-flex align-items-center justify-content-center gap-2"
                                                style={{ background: "#10b981", fontSize: "14px", border: "none" }}
                                            >
                                                {bookLoading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    <><i className="ti ti-lock" /> Confirm Appointment</>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Timings Card */}
                                <div className="col-lg-4">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>CLINIC TIMINGS</h6>
                                        <div className="d-flex flex-column gap-3 flex-grow-1">
                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                                                <div key={day} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>{day}</span>
                                                    <span className="text-secondary fw-semibold" style={{ fontSize: "13px" }}>09:00 AM - 08:00 PM</span>
                                                </div>
                                            ))}
                                            <div className="d-flex justify-content-between align-items-center pb-2">
                                                <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>Sunday</span>
                                                <span className="text-danger fw-bold" style={{ fontSize: "14px" }}>Closed</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 py-3 px-3 rounded-4 text-center" style={{ background: "#fef2f2" }}>
                                            <div className="fw-bold mb-1" style={{ fontSize: "12px", color: "#ef4444" }}>EMERGENCY? CALL NOW</div>
                                            <div className="fw-bold fs-5" style={{ color: "#ef4444" }}><i className="ti ti-phone me-1" /> +91 98765 43210</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════ REVIEWS ══════ */}
                    <section id="reviews" className="bg-white border-top border-bottom">
                        <div className="container py-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <h6 className="fw-bold text-uppercase mb-0" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>PATIENT REVIEWS</h6>
                                    <div className="d-flex align-items-center gap-2">
                                        <Stars n={avgRating} size={15} />
                                        <span className="text-secondary fw-semibold" style={{ fontSize: "13px" }}>({totalReviews} Reviews)</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm bg-white fw-bold px-3 rounded-pill" style={{ color: "#1d4ed8", border: "1px solid #e2e8f0", fontSize: "13px" }}>View All Reviews</button>
                            </div>

                            <div className="row g-3">
                                {clinic.reviews.slice(0, 4).length > 0 ? clinic.reviews.slice(0, 4).map((r, i) => (
                                    <div key={i} className="col-12 col-sm-6 col-lg-3">
                                        <div className="card h-100 border p-3 rounded-3 shadow-none bg-white">
                                            <div className="mb-2">
                                                <Stars n={r.rating} size={14} />
                                            </div>
                                            <p className="text-dark mb-0 fw-medium" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                                                {r.feedback.length > 80 ? r.feedback.substring(0, 80) + '...' : r.feedback}
                                            </p>
                                            <div className="mt-4 pt-3">
                                                <span className="text-secondary fw-semibold mb-0 d-block" style={{ fontSize: "11.5px" }}>— {r.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    /* Fallback Mock Reviews if none exist */
                                    [
                                        { f: "Excellent experience with City Care Clinic. Doctors are very cooperative and staff is also very helpful.", n: "Rahul Verma" },
                                        { f: "Very clean clinic and good treatment. I got my dental treatment here. Highly recommended!", n: "Priya Sinha" },
                                        { f: "Best child specialist doctor. My child is much better now. Thank you so much!", n: "Anjali Kumari" },
                                        { f: "Quick appointment and proper guidance. Very satisfied with the service.", n: "Sandeep Kumar" }
                                    ].map((r, i) => (
                                        <div key={i} className="col-12 col-sm-6 col-lg-3">
                                            <div className="card h-100 border p-3 rounded-3 shadow-none bg-white">
                                                <div className="mb-2">
                                                    <Stars n={5} size={14} />
                                                </div>
                                                <p className="text-dark mb-0 fw-medium" style={{ fontSize: "13px", lineHeight: 1.5 }}>{r.f}</p>
                                                <div className="mt-4 pt-3">
                                                    <span className="text-secondary fw-semibold mb-0 d-block" style={{ fontSize: "11.5px" }}>— {r.n}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ══════ GALLERY ══════ */}
                    {
                        clinic.gallery.length > 0 && (
                            <section id="gallery" className="py-5 bg-white">
                                <div className="container py-4 text-center">
                                    <h5 className="fw-bold text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>CLINIC GALLERY</h5>

                                    <div className="d-flex gap-4 overflow-auto pb-4 px-2 custom-scrollbar justify-content-lg-center">
                                        {clinic.gallery.map((img, i) => (
                                            <div key={i} style={{ minWidth: "280px", maxWidth: "280px" }}>
                                                <div className="card border-0 bg-transparent text-center">
                                                    <img src={img.url} alt={img.category} className="img-fluid rounded-4 shadow-sm mb-3" style={{ height: "160px", objectFit: "cover", width: "100%", border: "2px solid #f1f5f9" }} />
                                                    <span className="fs-14 text-dark fw-bold">{img.category || "Gallery Image"}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )
                    }

                    {/* ══════ PACKAGES & FAQ ══════ */}
                    <section className="py-5" style={{ background: "#f8f9fa" }}>
                        <div className="container py-4">

                            <h5 className="fw-bold text-center text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>HEALTH PACKAGES / OFFERS</h5>

                            <div className="row g-2 row-cols-1 row-cols-md-2 row-cols-lg-5 justify-content-center mb-5">
                                {/* Package 1 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Full Body Checkup</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Complete Health Analysis</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹1499</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹2000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 2 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Diabetes Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Sugar & Related Tests</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹799</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1200</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 3 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Dental Care Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Dental Checkup + Cleaning</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹999</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1500</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 4 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Women Health Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Complete Women Care</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹1299</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1800</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance Info */}
                                <div className="col">
                                    <div className="card border p-2 rounded-3 shadow-none bg-white text-center">
                                        <h6 className="fw-bold mb-1" style={{ color: "#1d4ed8", fontSize: "11px" }}>Insurance & Cashless Facility</h6>
                                        <p className="text-secondary fw-semibold mb-2 px-1" style={{ fontSize: "9.5px", lineHeight: 1.3 }}>
                                            We accept all major insurance providers for cashless treatment.
                                        </p>
                                        <div className="d-flex justify-content-center align-items-center flex-wrap gap-1">
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}><i className="ti ti-star-filled text-primary" /> STAR</span>
                                            <span className="fw-bold text-white bg-danger px-1" style={{ fontSize: "8px" }}>HDFC ERGO</span>
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}><i className="ti ti-bolt text-danger" /> ICICI Lombard</span>
                                            <div className="w-100 m-0" />
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}>BAJAJ Allianz</span>
                                            <span className="text-secondary fw-semibold" style={{ fontSize: "9px" }}>& More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold text-center text-uppercase mb-4 mt-4" style={{ color: "#1d4ed8", fontSize: "14px", letterSpacing: "0.5px" }}>FREQUENTLY ASKED QUESTIONS</h6>
                            <div className="row justify-content-center mb-3">
                                <div className="col-lg-10">
                                    <div className="row g-2">
                                        {['How can I book an appointment?', 'What are the consultation charges?', 'Do you provide online consultation?', 'Is walk-in consultation available?', 'When will I get my test reports?', 'Do you provide home sample collection?'].map((q, i) => (
                                            <div key={i} className="col-md-6">
                                                <div className="card shadow-none rounded-2 border" style={{ borderColor: "#f1f5f9" }}>
                                                    <div className="d-flex justify-content-between align-items-center py-2 px-3 text-dark fw-medium" style={{ fontSize: "12px" }}>
                                                        <span>{q}</span>
                                                        <i className="ti ti-plus text-secondary" style={{ fontSize: "12px" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )
            }

            {/* ══════ FOOTER ══════ */}
            <footer id="contact" className="bg-white py-4 mt-2 border-top">
                <div className="container">
                    <div className="row g-4 align-items-center justify-content-between">

                        {/* Map Image */}
                        <div className="col-lg-4">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>OUR LOCATION</h6>
                            <div className="position-relative rounded-3 overflow-hidden border bg-light" style={{ height: "140px" }}>
                                <img src="https://placehold.co/600x200/e2e8f0/94a3b8?text=Map+Location" alt="Map Location" className="w-100 h-100 object-fit-cover opacity-50 pe-none" />
                                <div className="position-absolute bg-white rounded shadow-sm p-2" style={{ top: "10px", left: "10px", width: "160px" }}>
                                    <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "11px" }}>{clinic.name}</h6>
                                    <small className="text-secondary d-block lh-sm mb-1" style={{ fontSize: "9px" }}>{clinic.address}, {clinic.city}</small>
                                    <a href={clinic.directionsUrl} className="text-primary text-decoration-none fw-bold mt-1 d-block" style={{ fontSize: "9px" }}>View larger map</a>
                                </div>
                                <div className="position-absolute" style={{ top: "60%", left: "55%", transform: "translate(-50%, -50%)" }}>
                                    <div className="d-flex align-items-center gap-1">
                                        <i className="ti ti-map-pin-filled text-danger drop-shadow" style={{ fontSize: "28px" }} />
                                        <span className="text-danger fw-bold shadow-sm px-1 rounded bg-white" style={{ fontSize: "10px" }}>{clinic.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Get Directions */}
                        <div className="col-lg-2 text-center">
                            <h6 className="fw-bold text-uppercase mb-2" style={{ color: "#1d4ed8", fontSize: "12px" }}>GET DIRECTIONS</h6>
                            <p className="text-secondary fw-bold mx-auto mb-3" style={{ fontSize: "10px", lineHeight: 1.4, maxWidth: "150px" }}>{clinic.address}, {clinic.city}</p>
                            <a href={clinic.directionsUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-2 fw-bold px-3 py-1" style={{ fontSize: "11px", color: "#1d4ed8", borderColor: "#e2e8f0" }}>
                                Get Directions <i className="ti ti-external-link ms-1" />
                            </a>
                        </div>

                        {/* Contact Us */}
                        <div className="col-lg-3 border-start ps-4">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>CONTACT US</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2 mb-0 fw-bold text-secondary" style={{ fontSize: "10.5px" }}>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-phone-call text-primary fs-6" style={{ color: "#1d4ed8" }} /> {clinic.phone}</li>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-brand-whatsapp text-success fs-6" /> {clinic.whatsapp}</li>
                                <li className="d-flex align-items-center gap-2 text-break"><i className="ti ti-mail text-primary fs-6" style={{ color: "#1d4ed8" }} /> {clinic.email || 'info@clinic.com'}</li>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-world text-primary fs-6" style={{ color: "#1d4ed8" }} /> www.clinic.com</li>
                                <li className="d-flex align-items-start gap-2 pt-1"><i className="ti ti-map-pin text-primary fs-6" style={{ color: "#1d4ed8" }} /> <span>{clinic.address}, {clinic.city}</span></li>
                            </ul>
                        </div>

                        {/* Follow Us */}
                        <div className="col-lg-2 text-center">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>FOLLOW US</h6>
                            <div className="d-flex gap-2 justify-content-center">
                                <a href={clinic.facebook} className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#1877f2" }}><i className="ti ti-brand-facebook fs-6" /></a>
                                <a href={clinic.instagram} className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#e1306c" }}><i className="ti ti-brand-instagram fs-6" /></a>
                                <a href="#" className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#ff0000" }}><i className="ti ti-brand-youtube fs-6" /></a>
                                <a href="#" className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#0077b5" }}><i className="ti ti-brand-linkedin fs-6" /></a>
                            </div>
                        </div>

                    </div>
                </div>
            </footer>
            {/* ══════ DARK BOTTOM FOOTER ══════ */}
            <FooterFront />

            {/* WA FAB */}
            <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="position-fixed shadow-lg rounded-circle d-flex align-items-center justify-content-center"
                style={{ bottom: "30px", right: "30px", width: "60px", height: "60px", background: "#25D366", color: "white", zIndex: 9999, transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <i className="ti ti-brand-whatsapp" style={{ fontSize: "36px" }} />
            </a>

            {/* ══════ BOOKING MODAL ══════ */}
            {
                showModal && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ zIndex: 99999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}
                    >
                        <div className="bg-white rounded-4 shadow-lg" style={{ width: "100%", maxWidth: "520px", margin: "20px", maxHeight: "90vh", overflowY: "auto" }}>
                            {/* Modal Header */}
                            <div className="d-flex align-items-center justify-content-between p-4 pb-3 border-bottom" style={{ background: "#1d4ed8", borderRadius: "16px 16px 0 0" }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                                        <i className="ti ti-calendar-event text-white fs-4" />
                                    </div>
                                    <div>
                                        <h5 className="fw-bold text-white mb-0" style={{ fontSize: "16px" }}>Book Appointment</h5>
                                        <small className="text-white opacity-75">{clinic.name}</small>
                                    </div>
                                </div>
                                <button
                                    className="btn p-0 d-flex align-items-center justify-content-center text-white opacity-75"
                                    style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }}
                                    onClick={() => setShowModal(false)}
                                >
                                    <i className="ti ti-x fs-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                {bookSuccess ? (
                                    /* Success State */
                                    <div className="text-center py-4">
                                        <div className="d-flex align-items-center justify-content-center mb-4">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, background: "#dcfce7" }}>
                                                <i className="ti ti-circle-check-filled" style={{ fontSize: 48, color: "#16a34a" }} />
                                            </div>
                                        </div>
                                        <h5 className="fw-bold text-dark mb-2">Appointment Confirmed!</h5>
                                        <p className="text-secondary fw-medium mb-4" style={{ fontSize: "14px" }}>{bookSuccess}</p>
                                        <p className="text-secondary" style={{ fontSize: "13px" }}>Our team will call you shortly to confirm your appointment. Please keep your phone reachable.</p>
                                        <button
                                            className="btn mt-3 fw-bold px-5 py-2 rounded-3 text-white"
                                            style={{ background: "#1d4ed8", fontSize: "14px" }}
                                            onClick={() => setShowModal(false)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                ) : (
                                    /* Form State */
                                    <form onSubmit={handleBookSubmit}>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Full Name <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3"
                                                    placeholder="Enter your full name"
                                                    value={bookForm.name}
                                                    onChange={e => setBookForm(f => ({ ...f, name: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Phone Number <span className="text-danger">*</span></label>
                                                <input
                                                    type="tel"
                                                    className="form-control rounded-3"
                                                    placeholder="+91 XXXXX XXXXX"
                                                    value={bookForm.phone}
                                                    onChange={e => setBookForm(f => ({ ...f, phone: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Select Doctor</label>
                                                <select
                                                    className="form-select rounded-3 text-secondary"
                                                    value={bookForm.doctorId || preselectedDoctor}
                                                    onChange={e => setBookForm(f => ({ ...f, doctorId: e.target.value }))}
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    <option value="">Any available doctor</option>
                                                    {realDoctors.map((d: any) => (
                                                        <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Date <span className="text-danger">*</span></label>
                                                <input
                                                    type="date"
                                                    className="form-control rounded-3"
                                                    value={bookForm.date}
                                                    min={new Date().toISOString().split("T")[0]}
                                                    onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Time Slot <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select rounded-3 text-secondary"
                                                    value={bookForm.time}
                                                    onChange={e => setBookForm(f => ({ ...f, time: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    <option value="">Select time</option>
                                                    {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark" style={{ fontSize: "13px" }}>Reason / Symptoms</label>
                                                <textarea
                                                    className="form-control rounded-3"
                                                    rows={2}
                                                    placeholder="Brief description of your symptoms or reason for visit..."
                                                    value={bookForm.reason}
                                                    onChange={e => setBookForm(f => ({ ...f, reason: e.target.value }))}
                                                    style={{ fontSize: "14px", resize: "none" }}
                                                />
                                            </div>

                                            {bookError && (
                                                <div className="col-12">
                                                    <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-0" style={{ fontSize: "13px" }}>
                                                        <i className="ti ti-alert-circle text-danger fs-5" />
                                                        {bookError}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-12 mt-1">
                                                <button
                                                    type="submit"
                                                    className="btn w-100 fw-bold py-2 rounded-3 text-white d-flex align-items-center justify-content-center gap-2"
                                                    style={{ background: "#10b981", fontSize: "15px", letterSpacing: "-0.2px" }}
                                                    disabled={bookLoading}
                                                >
                                                    {bookLoading ? (
                                                        <><span className="spinner-border spinner-border-sm" /> Booking...</>
                                                    ) : (
                                                        <><i className="ti ti-lock" /> Confirm Appointment</>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="col-12 text-center">
                                                <small className="text-secondary" style={{ fontSize: "11px" }}>
                                                    <i className="ti ti-shield-check text-success me-1" />
                                                    Your data is secure. We'll call to confirm your appointment.
                                                </small>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
