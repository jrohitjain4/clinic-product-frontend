import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { apiUrl } from "../../../../core/config/api";

const MultiStepRegister: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userId, setUserId] = useState("");
    const [selectedPkgId, setSelectedPkgId] = useState("");

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
            if (form.password.length < 6) {
                setError("Password must be at least 6 characters");
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
                        phone: form.mobileNumber,
                        whatsappNumber: form.sameAsMobile ? form.mobileNumber : form.whatsappNumber,
                        password: form.password,
                        clinicName: form.clinicName,
                        addressLine1: form.addressLine1,
                        addressLine2: form.addressLine2,
                        district: form.district,
                        city: form.city,
                        state: form.state,
                        country: form.country,
                        pincode: form.pincode,
                        doctorCount: form.doctorCount,
                        username: form.username,
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
    const stepIcons = ["👤", "🏥", "💎"];

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                .reg-card { background: white; border-radius: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.2); overflow: hidden; width: 100%; max-width: 580px; }
                .reg-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 36px 40px 28px; color: white; text-align: center; }
                .reg-logo { font-size: 28px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px; }
                .reg-subtitle { color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 24px; }
                .step-pills { display: flex; gap: 8px; justify-content: center; }
                .step-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 500; transition: all 0.3s; }
                .step-pill.active { background: linear-gradient(135deg, #a78bfa, #60a5fa); color: white; }
                .step-pill.done { background: rgba(167,139,250,0.2); color: #a78bfa; }
                .step-pill.pending { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
                .step-pill-num { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
                .step-pill.active .step-pill-num { background: rgba(255,255,255,0.25); }
                .step-pill.done .step-pill-num { background: #a78bfa; color: white; }
                .step-pill.pending .step-pill-num { background: rgba(255,255,255,0.1); }
                .reg-body { padding: 36px 40px; }
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

            <div className="reg-card">
                {/* Header */}
                <div className="reg-header">
                    <div className="reg-logo">🏥 Docyori</div>
                    <div className="reg-subtitle">Smart Clinic Management Platform</div>

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

                {/* Body */}
                <div className="reg-body">
                    {/* Step heading */}
                    <div className="step-heading">{stepIcons[step - 1]} {stepTitles[step - 1]}</div>
                    <div className="step-desc">
                        {step === 1 && "Enter your personal contact information"}
                        {step === 2 && "Tell us about your clinic and set your password"}
                        {step === 3 && "Choose the plan that fits your needs"}
                    </div>

                    {error && (
                        <div className="error-box">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div className="success-box">
                            {success}
                        </div>
                    )}

                    {/* ─── STEP 1: Personal Details ─── */}
                    {step === 1 && (
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                            <div className="mb-3">
                                <label className="field-label">Owner / Your Name <span className="req">*</span></label>
                                <input type="text" className="form-control" placeholder="Dr. Rahul Sharma" value={form.ownerName}
                                    onChange={e => setForm({ ...form, ownerName: e.target.value })} />
                            </div>

                            <div className="mb-3">
                                <label className="field-label">Mobile Number <span className="req">*</span></label>
                                <div style={{ display: "flex" }}>
                                    <div className="input-prefix">🇮🇳 +91</div>
                                    <input type="tel" className="form-control" placeholder="9876543210" maxLength={10}
                                        value={form.mobileNumber}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setForm({ ...form, mobileNumber: val, ...(form.sameAsMobile ? { whatsappNumber: val } : {}) });
                                        }} />
                                </div>
                                <div className="phone-note">Enter 10-digit Indian mobile number (e.g., 9876543210)</div>
                            </div>

                            <div className="mb-3">
                                <label className="field-label">Email Address <span className="req">*</span></label>
                                <input type="email" className="form-control" placeholder="doctor@clinic.com" value={form.emailId}
                                    onChange={e => setForm({ ...form, emailId: e.target.value })} />
                            </div>

                            <div className="mb-3">
                                <label className="field-label">WhatsApp Number</label>
                                <div style={{ display: "flex" }}>
                                    <div className="input-prefix" style={{ opacity: form.sameAsMobile ? 0.5 : 1 }}>💬 +91</div>
                                    <input type="tel" className="form-control" placeholder="9876543210" maxLength={10}
                                        disabled={form.sameAsMobile}
                                        value={form.sameAsMobile ? form.mobileNumber : form.whatsappNumber}
                                        onChange={e => setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                                </div>
                                <div className="check-row">
                                    <input type="checkbox" id="sameAsMobile" checked={form.sameAsMobile}
                                        onChange={e => setForm({ ...form, sameAsMobile: e.target.checked })} />
                                    <label htmlFor="sameAsMobile">Same as mobile number</label>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary-grad">
                                Continue to Clinic Details →
                            </button>
                        </form>
                    )}

                    {/* ─── STEP 2: Clinic Details ─── */}
                    {step === 2 && (
                        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="mb-3">
                                <div>
                                    <label className="field-label">Clinic Name <span className="req">*</span></label>
                                    <input type="text" className="form-control" placeholder="Apollo Clinic"
                                        value={form.clinicName}
                                        onChange={e => setForm({ ...form, clinicName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="field-label">Clinic Username <span className="req">*</span></label>
                                    <div style={{ display: "flex" }}>
                                        <div className="input-prefix">@</div>
                                        <input type="text" className="form-control" placeholder="apollo_clinic"
                                            value={form.username}
                                            onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="field-label">Address Line 1 <span className="req">*</span></label>
                                <input type="text" className="form-control" placeholder="Shop No. 12, MG Road"
                                    value={form.addressLine1}
                                    onChange={e => setForm({ ...form, addressLine1: e.target.value })} />
                            </div>

                            <div className="mb-3">
                                <label className="field-label">Address Line 2 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(Optional)</span></label>
                                <input type="text" className="form-control" placeholder="Near City Hospital"
                                    value={form.addressLine2}
                                    onChange={e => setForm({ ...form, addressLine2: e.target.value })} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }} className="mb-3">
                                <div>
                                    <label className="field-label">District</label>
                                    <input type="text" className="form-control" placeholder="Indore"
                                        value={form.district}
                                        onChange={e => setForm({ ...form, district: e.target.value })} />
                                </div>
                                <div>
                                    <label className="field-label">City</label>
                                    <input type="text" className="form-control" placeholder="Indore"
                                        value={form.city}
                                        onChange={e => setForm({ ...form, city: e.target.value })} />
                                </div>
                                <div>
                                    <label className="field-label">Pincode</label>
                                    <input type="text" className="form-control" placeholder="452001" maxLength={6}
                                        value={form.pincode}
                                        onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="mb-3">
                                <div>
                                    <label className="field-label">State</label>
                                    <input type="text" className="form-control" placeholder="Madhya Pradesh"
                                        value={form.state}
                                        onChange={e => setForm({ ...form, state: e.target.value })} />
                                </div>
                                <div>
                                    <label className="field-label">No. of Doctors</label>
                                    <input type="number" className="form-control" placeholder="5" min={1}
                                        value={form.doctorCount}
                                        onChange={e => setForm({ ...form, doctorCount: e.target.value })} />
                                </div>
                            </div>

                            <hr className="divider" />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="mb-3">
                                <div>
                                    <label className="field-label">Password <span className="req">*</span></label>
                                    <input type="password" className="form-control" placeholder="Min 6 characters"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })} />
                                </div>
                                <div>
                                    <label className="field-label">Confirm Password <span className="req">*</span></label>
                                    <input type="password" className="form-control" placeholder="Re-enter password"
                                        value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="button" className="btn-back" style={{ width: "40%" }} onClick={() => setStep(1)}>
                                    ← Back
                                </button>
                                <button type="submit" className="btn-primary-grad" style={{ width: "60%" }} disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                                    ) : "Continue to Plans →"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ─── STEP 3: Pricing ─── */}
                    {step === 3 && (
                        <div>
                            {!userId && (
                                <div className="error-box">
                                    ⚠️ Session missing. <button className="btn btn-link p-0 ms-1" onClick={() => setStep(2)}>Go back</button>
                                </div>
                            )}
                            {packages.length === 0 && (
                                <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
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
                                            <button
                                                className={`pkg-btn ${p.price === 0 ? "free" : "paid"} mt-2`}
                                                onClick={() => handleComplete(p.id)}
                                                disabled={loading}
                                                style={{ marginTop: "10px" }}
                                            >
                                                {selectedPkgId === p.id && loading ? (
                                                    <><span className="spinner-border spinner-border-sm me-1" />Processing...</>
                                                ) : p.price === 0 ? "🚀 Start Free Trial" : "Buy Now"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="btn-back w-100" style={{ marginTop: "8px" }} onClick={() => { setStep(2); setError(""); }}>
                                ← Back to Clinic Details
                            </button>
                        </div>
                    )}

                    <div className="signin-link">
                        Already have an account? <Link to={all_routes.login}>Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiStepRegister;
