import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { apiUrl } from "../../../../core/config/api";
import { Input } from "../../../../core/common/input/Input";
import { Button } from "../../../../core/common/button/Button";
import { UserPlus, User, Phone, Mail, MessageCircle, MapPin, Hash, Lock, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Home, AtSign, Map, Users } from "react-feather";

const MultiStepRegister: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userId, setUserId] = useState("");
    const [selectedPkgId, setSelectedPkgId] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        ownerName: "",
        mobileNumber: "",
        emailId: "",
        whatsappNumber: "",
        sameAsMobile: false,
        clinicName: "",
        addressLine1: "",
        addressLine2: "",
        district: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        doctorCount: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (step === 3) {
            fetch(apiUrl("/api/auth/packages"))
                .then((res) => res.json())
                .then((data) => setPackages(data))
                .catch(console.error);
        }
    }, [step]);

    // Auto-generate username from clinic name
    useEffect(() => {
        if (form.clinicName && !form.username) {
            const generated = form.clinicName
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .trim()
                .replace(/\s+/g, "_");
            setForm(f => ({ ...f, username: generated }));
        }
    }, [form.clinicName]);

    const handleNext = async () => {
        setError("");
        if (step === 1) {
            if (!form.ownerName || !form.mobileNumber || !form.emailId) {
                setError("Please fill all required fields");
                return;
            }
            if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
                setError("Please enter a valid 10-digit Indian mobile number");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!form.clinicName || !form.addressLine1 || !form.username || !form.password) {
                setError("Please fill all required clinic details");
                return;
            }
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (form.password.length < 8) {
                setError("Password must be at least 8 characters");
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(apiUrl("/api/auth/register-draft"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ownerName: form.ownerName,
                        email: form.emailId,
                        password: form.password,
                        phone: form.mobileNumber,
                        whatsappNumber: form.sameAsMobile ? form.mobileNumber : form.whatsappNumber,
                        clinicName: form.clinicName,
                        username: form.username,
                        addressLine1: form.addressLine1,
                        addressLine2: form.addressLine2,
                        district: form.district,
                        city: form.city,
                        state: form.state,
                        country: form.country,
                        pincode: form.pincode,
                        doctorCount: form.doctorCount ? parseInt(form.doctorCount) : 0,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to create account");
                setUserId(data.userId);
                setStep(3);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleComplete = async (packageId: string) => {
        setSelectedPkgId(packageId);
        setLoading(true);
        setError("");
        try {
            if (!userId) {
                setError("Session expired. Please go back and try again.");
                return;
            }
            const res = await fetch(apiUrl("/api/auth/complete-registration"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, packageId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to complete registration");

            setSuccess("🎉 Account created successfully! Redirecting to login...");
            setTimeout(() => navigate(all_routes.login), 2000);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
            setSelectedPkgId("");
        }
    };

    const stepTitles = ["Personal Details", "Clinic Details", "Choose Plan"];


    return (
        <>
            <style>{`
                .step-pills { display: flex; gap: 8px; justify-content: center; }
                .step-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 500; transition: all 0.3s; }
                .step-pill.active { background: linear-gradient(135deg, #a78bfa, #60a5fa); color: white; }
                .step-pill.done { background: #f3e8ff; color: #a855f7; }
                .step-pill.pending { background: #f1f5f9; color: #64748b; }
                .step-pill-num { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
                .step-pill.active .step-pill-num { background: rgba(255,255,255,0.25); }
                .step-pill.done .step-pill-num { background: #a855f7; color: white; }
                .step-pill.pending .step-pill-num { background: #cbd5e1; color: white; }
                .step-heading { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
                .step-desc { color: #6b7280; font-size: 14px; margin-bottom: 28px; }
                .field-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
                .field-label .req { color: #ef4444; }
                .form-control, .form-select { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; font-size: 14px; color: #1a1a2e; transition: all 0.2s; outline: none; width: 100%; background: #f9fafb; }
                .form-control:focus, .form-select:focus { border-color: #a78bfa; background: white; box-shadow: 0 0 0 3px rgba(167,139,250,0.12); }
                .input-group .form-control { border-left: none; border-radius: 0 10px 10px 0; }
                .input-prefix { background: #f3f4f6; border: 1.5px solid #e5e7eb; border-right: none; border-radius: 10px 0 0 10px; padding: 10px 12px; font-size: 14px; color: #6b7280; font-weight: 600; display: flex; align-items: center; }
                .check-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
                .check-row input[type=checkbox] { width: 16px; height: 16px; accent-color: #7c3aed; cursor: pointer; }
                .check-row label { font-size: 13px; color: #6b7280; cursor: pointer; }
                .btn-primary-grad { background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; border: none; border-radius: 12px; padding: 13px 20px; font-size: 15px; font-weight: 600; width: 100%; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px; }
                .btn-primary-grad:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,58,237,0.35); }
                .btn-primary-grad:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-back { background: #f3f4f6; color: #374151; border: none; border-radius: 12px; padding: 13px 20px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .btn-back:hover { background: #e5e7eb; }
                .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
                .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; border-radius: 10px; padding: 16px; font-size: 14px; margin-bottom: 20px; text-align: center; font-weight: 500; }
                .divider { border: none; border-top: 1px solid #f3f4f6; margin: 20px 0; }
                .pkg-card { border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; background: white; }
                .pkg-card:hover { border-color: #7c3aed; box-shadow: 0 4px 16px rgba(124,58,237,0.1); transform: translateY(-1px); }
                .pkg-card.free { border-color: #10b981; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); }
                .pkg-card.free:hover { box-shadow: 0 4px 16px rgba(16,185,129,0.2); }
                .pkg-badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
                .pkg-badge.free { background: #10b981; color: white; }
                .pkg-badge.paid { background: #7c3aed; color: white; }
                .pkg-price { font-size: 28px; font-weight: 800; }
                .pkg-price.free { color: #10b981; }
                .pkg-price.paid { color: #7c3aed; }
                .pkg-meta { color: #6b7280; font-size: 13px; margin-top: 4px; }
                .pkg-btn { border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
                .pkg-btn.free { background: #10b981; color: white; }
                .pkg-btn.free:hover:not(:disabled) { background: #059669; }
                .pkg-btn.paid { background: #7c3aed; color: white; }
                .pkg-btn.paid:hover:not(:disabled) { background: #6d28d9; }
                .pkg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .signin-link { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
                .signin-link a { color: #7c3aed; font-weight: 600; text-decoration: none; }
                .signin-link a:hover { text-decoration: underline; }
                .tag-recommended { background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 100px; display: inline-block; margin-top: 8px; }
                .phone-note { font-size: 11px; color: #9ca3af; margin-top: 4px; }
            `}</style>

            <div className="container-fuild position-relative z-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 bg-white">
                    <div className="row">
                        {/* Left Cover Panel */}
                        <div className="col-lg-6 p-0 d-none d-lg-block">
                            <div
                                className="d-flex align-items-center justify-content-center p-4 position-relative h-100"
                                style={{
                                    backgroundImage: "url('https://images.openai.com/static-rsc-4/m44RsUMB2u35mpGxV_Vhj4deyk5kpDN_OJlgYvyzCOeR5XI9_VykH8ZIRtl4b387FIu2UGhjmW4hAg_nUf5Ghxzi7cir84rViThx-KEqqinSEFp1MFVAnTdwtejkPVlBeIss0F9lA_iawnFtF9lTqga0-X_RHtUO5zYSIOAYnqNDq80iZu0roji9fCH_0FVI?purpose=fullsize')",
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0) 40%, rgba(99, 102, 241, 0.9) 100%)'
                                }}></div>

                                <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 2 }}>
                                    <img src="/logo.png" className="img-fluid" alt="DocYori Logo" style={{ maxHeight: "100px", width: "auto" }} />
                                </div>

                                <div className="w-100 position-relative z-1 text-center" style={{ marginTop: 'auto', marginBottom: '30px' }}>
                                    <h1 className="text-white fs-32 fw-bold mb-3" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                                        Seamless healthcare access <br /> with smart, modern clinic
                                    </h1>
                                    <p className="text-white fw-medium mx-auto fs-15" style={{ maxWidth: '500px', textShadow: '0 1px 4px rgba(0,0,0,0.3)', lineHeight: '1.6' }}>
                                        Experience efficient, secure, and user-friendly healthcare <br />
                                        management designed for modern clinics and growing practices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Form Panel */}
                        <div className="col-lg-6 col-md-12 col-sm-12">
                            <div className="row justify-content-center align-items-center overflow-auto flex-wrap vh-100">
                                <div className="col-md-10 mx-auto py-4">

                                    {/* Logo for Mobile View */}
                                    <div className="text-center w-100 d-lg-none mb-4 mt-2">
                                        <img src="/logo.png" className="img-fluid" alt="DocYori Logo" style={{ maxHeight: "60px", width: "auto" }} />
                                    </div>

                                    <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                                        <div className="card border-1 p-lg-3 shadow-md rounded-3 m-0">
                                            <div className="card-body">
                                                {/* Header matches Login */}
                                                <div className="text-start mb-4">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="d-flex align-items-center justify-content-center bg-light rounded-circle me-3" style={{ width: '45px', height: '45px', border: '1.5px solid #e2e8f0' }}>
                                                            <UserPlus size={22} color="#6366f1" strokeWidth={2.5} />
                                                        </div>
                                                        <h5 className="mb-0 fs-28 fw-bold text-dark">Register</h5>
                                                    </div>
                                                    <p className="mb-0 text-muted fs-15">
                                                        Create your DocYori account to manage your clinic.<br />
                                                        Fill in the details below to get started.
                                                    </p>
                                                </div>

                                                <div className="text-center mb-4">
                                                    <div className="step-pills">
                                                        {stepTitles.map((title, i) => {
                                                            const s = i + 1;
                                                            const cls = s < step ? "done" : s === step ? "active" : "pending";
                                                            return (
                                                                <div key={i} className={`step-pill ${cls}`}>
                                                                    <span className="step-pill-num">{s < step ? "✓" : s}</span>
                                                                    <span>{title}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {error && (
                                                    <div className="alert alert-danger alert-dismissible fade show p-2 mb-3 rounded text-start" role="alert" style={{ fontSize: "13px" }}>
                                                        <i className="ti ti-alert-triangle me-1"></i> {error}
                                                    </div>
                                                )}
                                                {success && (
                                                    <div className="alert alert-success alert-dismissible fade show p-3 mb-3 rounded text-center fw-medium" role="alert">
                                                        {success}
                                                    </div>
                                                )}

                                                {/* ─── STEP 1: Personal Details ─── */}
                                                {step === 1 && (
                                                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="text-start">
                                                        <div className="mb-3 text-start">
                                                            <Input
                                                                label="Owner / Your Name"
                                                                required
                                                                type="text"
                                                                placeholder="Dr. Rahul Sharma"
                                                                leftAddon={<User size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.ownerName}
                                                                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Mobile Number"
                                                                required
                                                                type="tel"
                                                                placeholder="9876543210"
                                                                maxLength={10}
                                                                leftAddon={<Phone size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.mobileNumber}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                                    setForm({ ...form, mobileNumber: val, ...(form.sameAsMobile ? { whatsappNumber: val } : {}) });
                                                                }}
                                                            />
                                                            <div className="phone-note">Enter 10-digit Indian mobile number</div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Email Address"
                                                                required
                                                                type="email"
                                                                placeholder="doctor@clinic.com"
                                                                leftAddon={<Mail size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.emailId}
                                                                onChange={e => setForm({ ...form, emailId: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="mb-4">
                                                            <Input
                                                                label="WhatsApp Number"
                                                                type="tel"
                                                                placeholder="9876543210"
                                                                maxLength={10}
                                                                disabled={form.sameAsMobile}
                                                                leftAddon={<MessageCircle size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.sameAsMobile ? form.mobileNumber : form.whatsappNumber}
                                                                onChange={e => setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                                            />
                                                            <div className="form-check form-check-md mt-2 mb-0">
                                                                <input className="form-check-input" type="checkbox" id="sameAsMobile" checked={form.sameAsMobile}
                                                                    onChange={e => setForm({ ...form, sameAsMobile: e.target.checked })} />
                                                                <label className="form-check-label mt-0 text-dark" htmlFor="sameAsMobile">Same as mobile number</label>
                                                            </div>
                                                        </div>

                                                        <Button type="submit" variant="primary" size="large" className="w-100 fs-15" style={{ padding: "12px", minHeight: "50px" }} icon={<ArrowRight size={18} />} iconPosition="right">
                                                            Continue to Clinic Details
                                                        </Button>
                                                    </form>
                                                )}

                                                {/* ─── STEP 2: Clinic Details ─── */}
                                                {step === 2 && (
                                                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="text-start">
                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <Input
                                                                    label="Clinic Name"
                                                                    required
                                                                    type="text"
                                                                    placeholder="Apollo Clinic"
                                                                    leftAddon={<Home size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                    value={form.clinicName}
                                                                    onChange={e => setForm({ ...form, clinicName: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Input
                                                                    label="Clinic Username"
                                                                    required
                                                                    type="text"
                                                                    placeholder="apollo_clinic"
                                                                    leftAddon={<AtSign size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                    value={form.username}
                                                                    onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Address Line 1"
                                                                required
                                                                type="text"
                                                                placeholder="Shop No. 12, MG Road"
                                                                leftAddon={<MapPin size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.addressLine1}
                                                                onChange={e => setForm({ ...form, addressLine1: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Address Line 2 (Optional)"
                                                                type="text"
                                                                placeholder="Near City Hospital"
                                                                leftAddon={<MapPin size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.addressLine2}
                                                                onChange={e => setForm({ ...form, addressLine2: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="row mb-3">
                                                            <div className="col-md-4 mb-3 mb-md-0">
                                                                <Input label="District" type="text" placeholder="Indore" leftAddon={<Map size={20} strokeWidth={2.5} color="#0f172a" />} value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                                                            </div>
                                                            <div className="col-md-4 mb-3 mb-md-0">
                                                                <Input label="City" type="text" placeholder="Indore" leftAddon={<MapPin size={20} strokeWidth={2.5} color="#0f172a" />} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                                                            </div>
                                                            <div className="col-md-4">
                                                                <Input label="Pincode" type="text" placeholder="452001" maxLength={6} leftAddon={<Hash size={20} strokeWidth={2.5} color="#0f172a" />} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                                                            </div>
                                                        </div>

                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <Input label="State" type="text" placeholder="Madhya Pradesh" leftAddon={<Map size={20} strokeWidth={2.5} color="#0f172a" />} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Input label="No. of Doctors" type="number" placeholder="5" min={1} leftAddon={<Users size={20} strokeWidth={2.5} color="#0f172a" />} value={form.doctorCount} onChange={e => setForm({ ...form, doctorCount: e.target.value })} />
                                                            </div>
                                                        </div>

                                                        <hr className="divider" />

                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <Input
                                                                    label="Password"
                                                                    required
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="Min 8 characters"
                                                                    leftAddon={<Lock size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                    rightIcon={
                                                                        <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "100%" }}>
                                                                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                        </div>
                                                                    }
                                                                    value={form.password}
                                                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Input
                                                                    label="Confirm Password"
                                                                    required
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    placeholder="Re-enter password"
                                                                    leftAddon={<Lock size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                    rightIcon={
                                                                        <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "100%" }}>
                                                                            {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                        </div>
                                                                    }
                                                                    value={form.confirmPassword}
                                                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="d-flex mt-4" style={{ gap: "12px" }}>
                                                            <Button type="button" variant="secondary" size="large" className="fs-15" style={{ width: "40%", padding: "12px", minHeight: "50px" }} icon={<ArrowLeft size={18} />} onClick={() => setStep(1)}>
                                                                Back
                                                            </Button>
                                                            <Button type="submit" variant="primary" size="large" className="fs-15" style={{ width: "60%", padding: "12px", minHeight: "50px" }} disabled={loading} icon={<ArrowRight size={18} />} iconPosition="right">
                                                                {loading ? "Saving..." : "Continue to Plans"}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}

                                                {/* ─── STEP 3: Pricing ─── */}
                                                {step === 3 && (
                                                    <div>
                                                        {!userId && (
                                                            <div className="alert alert-danger p-2 mb-3 rounded" style={{ fontSize: "13px" }}>
                                                                <i className="ti ti-alert-triangle me-1"></i> Session missing. <button className="btn btn-link p-0 ms-1" onClick={() => setStep(2)}>Go back</button>
                                                            </div>
                                                        )}
                                                        {packages.length === 0 && (
                                                            <div className="text-center p-4 text-muted">
                                                                <span className="spinner-border spinner-border-sm me-2" />Loading plans...
                                                            </div>
                                                        )}
                                                        {packages.map((p) => (
                                                            <div key={p.id} className={`pkg-card ${p.price === 0 ? "free" : ""}`}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                                                            <span className={`pkg-badge ${p.price === 0 ? "free" : "paid"}`}>
                                                                                {p.price === 0 ? "FREE TRIAL" : "PAID"}
                                                                            </span>
                                                                            <span style={{ fontWeight: 700, fontSize: "16px", color: "#1a1a2e" }}>{p.name}</span>
                                                                        </div>
                                                                        <div className="pkg-meta">
                                                                            📅 {p.durationInDays} Days &nbsp;|&nbsp; 👨‍⚕️ Max {p.maxDoctors} Doctors &nbsp;|&nbsp; 👤 Max {p.maxPatients} Patients
                                                                        </div>
                                                                        {p.price === 0 && <div className="tag-recommended">⭐ Recommended for New Users</div>}
                                                                    </div>
                                                                    <div style={{ textAlign: "right", marginLeft: "16px" }}>
                                                                        <div className={`pkg-price ${p.price === 0 ? "free" : "paid"}`}>
                                                                            {p.price === 0 ? "FREE" : `₹${p.price.toLocaleString("en-IN")}`}
                                                                        </div>
                                                                        {p.price > 0 && <div style={{ fontSize: "11px", color: "#9ca3af" }}>per cycle</div>}

                                                                        <Button
                                                                            variant={p.price === 0 ? "success" : "primary"}
                                                                            onClick={() => handleComplete(p.id)}
                                                                            disabled={loading}
                                                                            className="mt-2"
                                                                            icon={p.price === 0 ? undefined : <CheckCircle size={16} />}
                                                                        >
                                                                            {selectedPkgId === p.id && loading ? "Processing..." : p.price === 0 ? "🚀 Start Free Trial" : "Buy Now"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button variant="secondary" className="w-100 mt-2" onClick={() => { setStep(2); setError(""); }} icon={<ArrowLeft size={16} />}>
                                                            Back to Clinic Details
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="text-center mt-4">
                                                    <h6 className="fw-normal fs-14 text-dark mb-0">
                                                        Already have an account?{" "}
                                                        <Link to={all_routes.login} className="hover-a text-primary fw-medium ms-1">
                                                            Sign In
                                                        </Link>
                                                    </h6>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MultiStepRegister;
