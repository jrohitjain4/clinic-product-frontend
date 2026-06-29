import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../core/config/api";
import { setLocalStorageUser } from "../../../../core/utils/apiClient";

import { Input } from "../../../../core/common/input/Input";
import { Button } from "../../../../core/common/button/Button";
import { UserPlus, User, Phone, Mail, MessageCircle, MapPin, Hash, Lock, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Home, AtSign, Map, Users, Calendar, Star, Zap, ChevronDown } from "react-feather";
import { Country, State, City } from "country-state-city";

const MultiStepRegister: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState<any>({});
    const [success, setSuccess] = useState("");
    const [selectedPkgId, setSelectedPkgId] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [usernameWarning, setUsernameWarning] = useState<string | null>(null);
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

    // Location Data
    const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    useEffect(() => {
        setCountries(Country.getAllCountries());
        setStates(State.getStatesOfCountry("IN"));
    }, []);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isoCode = e.target.value;
        setSelectedCountryCode(isoCode);
        setStates(State.getStatesOfCountry(isoCode));
        setCities([]);
        setSelectedStateCode("");
        const countryName = Country.getCountryByCode(isoCode)?.name || "";
        setForm(f => ({ ...f, country: countryName, state: "", city: "" }));
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isoCode = e.target.value;
        setSelectedStateCode(isoCode);
        setCities(City.getCitiesOfState(selectedCountryCode, isoCode));
        const stateName = State.getStateByCodeAndCountry(isoCode, selectedCountryCode)?.name || "";
        setForm(f => ({ ...f, state: stateName, city: "" }));
    };

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



    // Real-time username availability check
    useEffect(() => {
        if (!form.username || form.username.length < 3) {
            setUsernameStatus("idle");
            return;
        }

        // Validation for spaces and special characters - show error instead of auto-correcting
        const hasSpace = /\s/.test(form.username);
        const hasInvalid = /[^a-zA-Z0-9_]/.test(form.username);

        if (hasSpace) {
            setUsernameWarning("Spaces are not allowed in username.");
            setUsernameStatus("idle");
            return;
        }

        if (hasInvalid) {
            setUsernameWarning("Special characters are not allowed.");
            setUsernameStatus("idle");
            return;
        }

        setUsernameWarning(null);

        const check = async () => {
            setUsernameStatus("checking");
            try {
                const res = await fetch(apiUrl(`/api/auth/check-username?username=${form.username.toLowerCase().trim()}`));
                const data = await res.json();
                if (data.available) {
                    setUsernameStatus("available");
                    setUsernameSuggestions([]);
                } else {
                    setUsernameStatus("taken");
                    const base = form.username;
                    setUsernameSuggestions([
                        `${base}123`,
                        `${base}_clinic`,
                        `${base}${Math.floor(Math.random() * 1000)}`
                    ]);
                }
            } catch (err) {
                console.error("Username check failed", err);
                setUsernameStatus("idle");
            }
        };

        const timeoutId = setTimeout(check, 500);
        return () => clearTimeout(timeoutId);
    }, [form.username]);

    const handleNext = async () => {
        setError("");
        setFormErrors({});

        let hasError = false;
        const newErrors: any = {};

        if (step === 1) {
            if (!form.ownerName) { newErrors.ownerName = "Owner name is required"; hasError = true; }

            if (!form.mobileNumber) { newErrors.mobileNumber = "Mobile number is required"; hasError = true; }
            else if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
                newErrors.mobileNumber = "Enter a valid 10-digit number";
                hasError = true;
            }

            if (!form.emailId) { newErrors.emailId = "Email address is required"; hasError = true; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId)) {
                newErrors.emailId = "Enter a valid email address";
                hasError = true;
            }

            if (hasError) {
                setFormErrors(newErrors);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!form.clinicName) { newErrors.clinicName = "Clinic name is required"; hasError = true; }
            if (!form.username) { newErrors.username = "Clinic username is required"; hasError = true; }
            if (!form.addressLine1) { newErrors.addressLine1 = "Primary address is required"; hasError = true; }

            if (!form.password) { newErrors.password = "Password is required"; hasError = true; }
            else if (form.password.length < 8) {
                newErrors.password = "Min 8 characters required";
                hasError = true;
            }
            if (form.password !== form.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
                hasError = true;
            }

            if (hasError) {
                setFormErrors(newErrors);
                return;
            }

            setLoading(true);
            try {
                // Validate uniqueness of email, phone, and username before proceeding
                const res = await fetch(apiUrl("/api/auth/register-draft"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: form.emailId,
                        phone: form.mobileNumber,
                        username: form.username.toLowerCase().trim(),
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Email, Phone or Username already exists");
                }

                setStep(3);
                window.scrollTo(0, 0);
            } catch (err: any) {
                const errMsg = err.message || "Identity validation failed";
                setError(errMsg);
                toast.error(errMsg);
            } finally {
                setLoading(false);
            }
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleComplete = async (packageId: string) => {
        const selectedPkg = packages.find(p => p.id === packageId);
        if (!selectedPkg) return;

        if (selectedPkg.price === 0) {
            // Free Package - registration proceeds directly
            setSelectedPkgId(packageId);
            setLoading(true);
            setError("");
            try {
                // Perform full registration in one step
                const res = await fetch(apiUrl("/api/auth/register-full"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ownerName: form.ownerName,
                        email: form.emailId,
                        password: form.password,
                        phone: form.mobileNumber,
                        whatsappNumber: form.sameAsMobile ? form.mobileNumber : form.whatsappNumber,
                        clinicName: form.clinicName,
                        username: form.username.toLowerCase().trim(),
                        addressLine1: form.addressLine1,
                        addressLine2: form.addressLine2,
                        district: form.district,
                        city: form.city,
                        state: form.state,
                        country: form.country,
                        pincode: form.pincode,
                        doctorCount: form.doctorCount ? parseInt(form.doctorCount) : 0,
                        packageId: packageId,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to complete registration");

                localStorage.setItem("token", data.token);
                setLocalStorageUser(data.user);

                toast.success("Account created successfully!");
                setSuccess("🎉 Account created successfully! Redirecting...");
                setTimeout(() => navigate(all_routes.dashboard), 2000);
            } catch (err: any) {
                const msg = err.message || "Something went wrong. Please try again.";
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
                setSelectedPkgId("");
            }
        } else {
            // Paid Package - Razorpay flow
            setSelectedPkgId(packageId);
            setLoading(true);
            setError("");
            try {
                const clinicData = {
                    ownerName: form.ownerName,
                    email: form.emailId,
                    password: form.password,
                    phone: form.mobileNumber,
                    whatsappNumber: form.sameAsMobile ? form.mobileNumber : form.whatsappNumber,
                    clinicName: form.clinicName,
                    username: form.username.toLowerCase().trim(),
                    addressLine1: form.addressLine1,
                    addressLine2: form.addressLine2,
                    district: form.district,
                    city: form.city,
                    state: form.state,
                    country: form.country,
                    pincode: form.pincode,
                    doctorCount: form.doctorCount ? parseInt(form.doctorCount) : 0,
                };

                // 1. Create order on the backend
                const orderRes = await fetch(apiUrl("/api/payments/create-order"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ packageId }),
                });

                const orderData = await orderRes.json();
                if (!orderRes.ok) {
                    throw new Error(orderData.message || "Failed to initiate payment. Please contact support.");
                }

                if (orderData.bypass) {
                    const res = await fetch(apiUrl("/api/auth/register-full"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ownerName: form.ownerName,
                            email: form.emailId,
                            password: form.password,
                            phone: form.mobileNumber,
                            whatsappNumber: form.sameAsMobile ? form.mobileNumber : form.whatsappNumber,
                            clinicName: form.clinicName,
                            username: form.username.toLowerCase().trim(),
                            addressLine1: form.addressLine1,
                            addressLine2: form.addressLine2,
                            district: form.district,
                            city: form.city,
                            state: form.state,
                            country: form.country,
                            pincode: form.pincode,
                            doctorCount: form.doctorCount ? parseInt(form.doctorCount) : 0,
                            packageId: packageId,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to complete registration");

                    localStorage.setItem("token", data.token);
                    setLocalStorageUser(data.user);

                    toast.success("Registration successful!");
                    setSuccess("🎉 Account created successfully! Redirecting...");
                    setTimeout(() => navigate(all_routes.dashboard), 2000);
                    return;
                }

                // 2. Load Razorpay script only when actual payment is needed
                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    throw new Error("Razorpay SDK failed to load. Are you connected to the internet?");
                }

                // 3. Open Razorpay checkout modal
                const options = {
                    key: orderData.razorpayKeyId,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Docyori Clinic SaaS",
                    description: `Subscription: ${selectedPkg.name}`,
                    order_id: orderData.orderId,
                    handler: async function (response: any) {
                        setLoading(true);
                        try {
                            // 3. Verify payment signature and complete registration
                            const verifyRes = await fetch(apiUrl("/api/payments/verify"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    packageId,
                                    clinicData
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok) {
                                throw new Error(verifyData.message || "Payment verification failed");
                            }

                            localStorage.setItem("token", verifyData.token);
                            setLocalStorageUser(verifyData.user);

                            toast.success("Payment successful & account created!");
                            setSuccess("🎉 Payment verified & account created! Redirecting...");
                            setTimeout(() => navigate(all_routes.dashboard), 2000);
                        } catch (err: any) {
                            const msg = err.message || "Failed to verify payment. Please contact support.";
                            setError(msg);
                            toast.error(msg);
                        } finally {
                            setLoading(false);
                            setSelectedPkgId("");
                        }
                    },
                    prefill: {
                        name: form.ownerName,
                        email: form.emailId,
                        contact: form.mobileNumber,
                    },
                    theme: {
                        color: "#7c3aed", // Docyori brand violet color
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                            setSelectedPkgId("");
                            toast.info("Payment cancelled.");
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            } catch (err: any) {
                const msg = err.message || "Something went wrong. Please try again.";
                setError(msg);
                toast.error(msg);
                setLoading(false);
                setSelectedPkgId("");
            }
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
                .form-gap-fix .docyori-input-group { margin-bottom: 0 !important; }
                html[data-color="primary"] .docyori-input-wrapper select,
                html[data-color="primary"] select.docyori-input {
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                }
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
                                                                    <span className="d-none d-md-inline">{title}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {error && (
                                                    <div className="alert alert-danger alert-dismissible fade show p-3 mb-4 rounded text-start shadow-sm border-danger" role="alert" style={{ fontSize: "14px", borderLeft: "4px solid #dc2626" }}>
                                                        <div className="d-flex align-items-center">
                                                            <i className="ti ti-alert-circle fs-20 me-2"></i>
                                                            <div>
                                                                <strong className="d-block">Registration Issue</strong>
                                                                {error}
                                                            </div>
                                                        </div>
                                                        <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
                                                    </div>
                                                )}
                                                {success && (
                                                    <div className="alert alert-success alert-dismissible p-3 mb-4 rounded text-center fw-medium border-success shadow-sm" role="alert" style={{ borderLeft: "4px solid #16a34a" }}>
                                                        <i className="ti ti-circle-check fs-20 me-2"></i>
                                                        {success}
                                                    </div>
                                                )}

                                                {/* ─── STEP 1: Personal Details ─── */}
                                                {step === 1 && (
                                                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="text-start form-gap-fix" noValidate>
                                                        <div className="mb-3 text-start">
                                                            <Input
                                                                label="Owner / Your Name"
                                                                required
                                                                type="text"
                                                                placeholder="e.g. Dr. Rahul Sharma"
                                                                leftAddon={<User size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.ownerName}
                                                                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                                                                error={formErrors.ownerName}
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Mobile Number (primary no.)"
                                                                required
                                                                type="tel"
                                                                placeholder="e.g. 9876543210"
                                                                maxLength={10}
                                                                leftAddon={<Phone size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                rightIcon={
                                                                    <div className="d-flex align-items-center h-100 pe-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const nextSame = !form.sameAsMobile;
                                                                                setForm(prev => ({
                                                                                    ...prev,
                                                                                    sameAsMobile: nextSame,
                                                                                    whatsappNumber: nextSame ? prev.mobileNumber : prev.whatsappNumber
                                                                                }));
                                                                            }}
                                                                            className={`btn btn-sm ${form.sameAsMobile ? 'btn-primary' : 'btn-light border text-muted'} rounded-pill`}
                                                                            style={{ fontSize: "11px", padding: "3px 10px", fontWeight: 600, whiteSpace: "nowrap" }}
                                                                        >
                                                                            {form.sameAsMobile ? "✓ Same for WhatsApp" : "Same for WhatsApp"}
                                                                        </button>
                                                                    </div>
                                                                }
                                                                value={form.mobileNumber}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                                    setForm({ ...form, mobileNumber: val, ...(form.sameAsMobile ? { whatsappNumber: val } : {}) });
                                                                }}
                                                                error={formErrors.mobileNumber}
                                                            />
                                                            <div className="phone-note">Enter 10-digit Indian mobile number</div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Email Address"
                                                                required
                                                                type="email"
                                                                placeholder="e.g. doctor@clinic.com"
                                                                leftAddon={<Mail size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.emailId}
                                                                onChange={e => setForm({ ...form, emailId: e.target.value })}
                                                                error={formErrors.emailId}
                                                            />
                                                        </div>

                                                        <div className="mb-4">
                                                            <Input
                                                                label="WhatsApp Number"
                                                                type="tel"
                                                                placeholder="e.g. 9876543210"
                                                                maxLength={10}
                                                                disabled={form.sameAsMobile}
                                                                leftAddon={<MessageCircle size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.sameAsMobile ? form.mobileNumber : form.whatsappNumber}
                                                                onChange={e => setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                                            />
                                                        </div>

                                                        <Button type="submit" variant="primary" size="large" className="w-100 fs-15 btn-primary-grad" style={{ padding: "12px", minHeight: "50px" }} icon={<ArrowRight size={18} />} iconPosition="right">
                                                            Continue to Clinic Details
                                                        </Button>
                                                    </form>
                                                )}

                                                {/* ─── STEP 2: Clinic Details ─── */}
                                                {step === 2 && (
                                                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="text-start form-gap-fix" noValidate>
                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <Input
                                                                    label="Clinic Name"
                                                                    required
                                                                    type="text"
                                                                    placeholder="e.g. Apollo Clinic"
                                                                    leftAddon={<Home size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                    value={form.clinicName}
                                                                    onChange={e => setForm({ ...form, clinicName: e.target.value })}
                                                                    error={formErrors.clinicName}
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="position-relative">
                                                                    <Input
                                                                        label="Clinic Username"
                                                                        required
                                                                        type="text"
                                                                        placeholder="e.g. apollo_clinic"
                                                                        leftAddon={<AtSign size={20} strokeWidth={2.5} color={usernameStatus === 'available' ? '#16a34a' : '#0f172a'} />}
                                                                        rightIcon={
                                                                            <div className="d-flex align-items-center h-100 pe-2">
                                                                                {usernameStatus === "checking" && <span className="spinner-border spinner-border-sm text-primary" />}
                                                                                {usernameStatus === "available" && <CheckCircle size={18} color="#16a34a" />}
                                                                                {usernameStatus === "taken" && <i className="ti ti-alert-circle text-danger fs-5" />}
                                                                            </div>
                                                                        }
                                                                        style={usernameStatus === "available" ? { color: "#16a34a", fontWeight: "600" } : {}}
                                                                        value={form.username}
                                                                        onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                                                        error={formErrors.username}
                                                                    />

                                                                    {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
                                                                        <div className="position-absolute w-100 bg-white border rounded-3 shadow p-2" style={{ top: "100%", left: 0, marginTop: "4px", zIndex: 10 }}>
                                                                            <div className="text-danger fw-bold d-flex align-items-center mb-2 pb-2 border-bottom" style={{ fontSize: "12px" }}>
                                                                                Username Not Available
                                                                            </div>
                                                                            <div className="text-muted fw-semibold mb-2" style={{ fontSize: "11px" }}>Suggested Usernames:</div>
                                                                            <div className="d-flex flex-column gap-1">
                                                                                {usernameSuggestions.map(s => (
                                                                                    <div
                                                                                        key={s}
                                                                                        className="d-flex align-items-center justify-content-between p-2 rounded"
                                                                                        style={{ fontSize: "13px", cursor: "pointer", transition: "background 0.2s" }}
                                                                                        onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                                                                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                                                                        onClick={() => {
                                                                                            setForm({ ...form, username: s });
                                                                                            setUsernameStatus("idle");
                                                                                        }}
                                                                                    >
                                                                                        <span className="fw-medium text-dark">{s}</span>
                                                                                        <span className="badge bg-primary text-white" style={{ fontSize: "10px" }}>Apply</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Address Line 1"
                                                                required
                                                                type="text"
                                                                placeholder="e.g. Shop No. 12, MG Road"
                                                                leftAddon={<MapPin size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.addressLine1}
                                                                onChange={e => setForm({ ...form, addressLine1: e.target.value })}
                                                                error={formErrors.addressLine1}
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <Input
                                                                label="Address Line 2 (Optional)"
                                                                type="text"
                                                                placeholder="e.g. Near City Hospital"
                                                                leftAddon={<MapPin size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                value={form.addressLine2}
                                                                onChange={e => setForm({ ...form, addressLine2: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <div className={`docyori-input-group`}>
                                                                    <label className="docyori-label">Country <span className="docyori-required">*</span></label>
                                                                    <div className={`docyori-input-wrapper ${formErrors.country ? 'has-error' : ''}`}>
                                                                        <div className="docyori-input-addon-left"><Map size={20} strokeWidth={2.5} color="#0f172a" /></div>
                                                                        <select className="docyori-input border-0 shadow-none bg-transparent" style={{ border: "none", width: "100%", outline: "none", color: "#1a1a2e", appearance: "none", WebkitAppearance: "none", cursor: "pointer" }} value={selectedCountryCode} onChange={handleCountryChange}>
                                                                            <option value="">Select Country</option>
                                                                            {countries.map(c => (
                                                                                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="docyori-input-icon-right pe-3"><ChevronDown size={18} color="#64748b" /></div>
                                                                    </div>
                                                                    {formErrors.country && <span className="docyori-error-text">{formErrors.country}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className={`docyori-input-group`}>
                                                                    <label className="docyori-label">State <span className="docyori-required">*</span></label>
                                                                    <div className={`docyori-input-wrapper ${formErrors.state ? 'has-error' : ''}`}>
                                                                        <div className="docyori-input-addon-left"><Map size={20} strokeWidth={2.5} color="#0f172a" /></div>
                                                                        <select className="docyori-input border-0 shadow-none bg-transparent" style={{ border: "none", width: "100%", outline: "none", color: "#1a1a2e", appearance: "none", WebkitAppearance: "none", cursor: "pointer" }} value={selectedStateCode} onChange={handleStateChange}>
                                                                            <option value="">Select State</option>
                                                                            {states.map(s => (
                                                                                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="docyori-input-icon-right pe-3"><ChevronDown size={18} color="#64748b" /></div>
                                                                    </div>
                                                                    {formErrors.state && <span className="docyori-error-text">{formErrors.state}</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row mb-3">
                                                            <div className="col-md-6 mb-3 mb-md-0">
                                                                <div className={`docyori-input-group`}>
                                                                    <label className="docyori-label">City <span className="docyori-required">*</span></label>
                                                                    <div className={`docyori-input-wrapper ${formErrors.city ? 'has-error' : ''}`}>
                                                                        <div className="docyori-input-addon-left"><MapPin size={20} strokeWidth={2.5} color="#0f172a" /></div>
                                                                        <select className="docyori-input border-0 shadow-none bg-transparent" style={{ border: "none", width: "100%", outline: "none", color: "#1a1a2e", appearance: "none", WebkitAppearance: "none", cursor: "pointer" }} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                                                                            <option value="">Select City</option>
                                                                            {cities.map(c => (
                                                                                <option key={c.name} value={c.name}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="docyori-input-icon-right pe-3"><ChevronDown size={18} color="#64748b" /></div>
                                                                    </div>
                                                                    {formErrors.city && <span className="docyori-error-text">{formErrors.city}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <Input label="Pincode" type="text" placeholder="e.g. 452001" maxLength={6} leftAddon={<Hash size={20} strokeWidth={2.5} color="#0f172a" />} value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} error={formErrors.pincode} />
                                                            </div>
                                                        </div>

                                                        <div className="row mb-3">
                                                            <div className="col-md-12">
                                                                <Input label="No. of Doctors (Optional)" type="number" placeholder="e.g. 5" min={1} leftAddon={<Users size={20} strokeWidth={2.5} color="#0f172a" />} value={form.doctorCount} onChange={e => setForm({ ...form, doctorCount: e.target.value })} />
                                                            </div>
                                                        </div>

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
                                                                    error={formErrors.password}
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
                                                                    error={formErrors.confirmPassword}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="d-flex mt-4" style={{ gap: "12px" }}>
                                                            <Button type="button" variant="secondary" size="large" className="fs-15 btn-back" style={{ width: "40%", padding: "12px", minHeight: "50px" }} icon={<ArrowLeft size={18} />} onClick={() => setStep(1)}>
                                                                Back
                                                            </Button>
                                                            <Button type="submit" variant="primary" size="large" className="fs-15 btn-primary-grad" style={{ width: "60%", padding: "12px", minHeight: "50px" }} disabled={loading} icon={<ArrowRight size={18} />} iconPosition="right">
                                                                {loading ? "Saving..." : "Continue to Plans"}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}

                                                {/* ─── STEP 3: Pricing ─── */}
                                                {step === 3 && (
                                                    <div>
                                                        {packages.length === 0 && (
                                                            <div className="text-center p-4 text-muted">
                                                                <span className="spinner-border spinner-border-sm me-2" />Loading plans...
                                                            </div>
                                                        )}
                                                        {packages.map((p) => (
                                                            <div
                                                                key={p.id}
                                                                className={`pkg-card ${p.price === 0 ? "free" : ""} ${selectedPkgId === p.id ? "border-primary" : ""}`}
                                                                style={{ ...(selectedPkgId === p.id ? { borderColor: '#7c3aed', boxShadow: '0 4px 16px rgba(124,58,237,0.1)' } : {}) }}
                                                                onClick={() => setSelectedPkgId(p.id)}
                                                            >
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                                                            <span className={`pkg-badge ${p.price === 0 ? "free" : "paid"}`}>
                                                                                {p.price === 0 ? "FREE TRIAL" : "PAID"}
                                                                            </span>
                                                                            <span style={{ fontWeight: 700, fontSize: "16px", color: "#1a1a2e" }}>{p.name}</span>
                                                                        </div>
                                                                        <div className="pkg-meta d-flex align-items-center flex-wrap gap-2 text-muted" style={{ fontSize: "13px", marginTop: "8px" }}>
                                                                            <span className="d-flex align-items-center gap-1"><Calendar size={14} /> {p.durationInDays} Days</span>
                                                                        </div>
                                                                        {p.price === 0 && <div className="tag-recommended d-inline-flex align-items-center gap-1 mt-2"><Star size={12} /> Recommended for New Users</div>}
                                                                    </div>
                                                                    <div style={{ textAlign: "right", marginLeft: "16px" }}>
                                                                        <div className={`pkg-price ${p.price === 0 ? "free" : "paid"}`}>
                                                                            {p.price === 0 ? "FREE" : `₹${p.price.toLocaleString("en-IN")}`}
                                                                        </div>
                                                                        {p.price > 0 && <div style={{ fontSize: "11px", color: "#9ca3af" }}>per cycle</div>}

                                                                        <Button
                                                                            type="button"
                                                                            variant={selectedPkgId === p.id ? (p.price === 0 ? "success" : "primary") : "secondary"}
                                                                            className="mt-2 px-4"
                                                                            icon={selectedPkgId === p.id ? <CheckCircle size={16} /> : undefined}
                                                                        >
                                                                            {selectedPkgId === p.id ? "Selected" : "Select"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {packages.length > 0 && selectedPkgId && (
                                                            <div className="mt-4">
                                                                {(() => {
                                                                    const selectedPkg = packages.find(p => p.id === selectedPkgId);
                                                                    return selectedPkg ? (
                                                                        <Button
                                                                            variant="primary"
                                                                            size="large"
                                                                            className="w-100 fs-15 btn-primary-grad d-flex align-items-center justify-content-center gap-2"
                                                                            style={{ minHeight: "50px" }}
                                                                            onClick={() => handleComplete(selectedPkgId)}
                                                                            disabled={loading}
                                                                        >
                                                                            {loading ? "Processing..." : selectedPkg.price === 0 ? <><Zap size={18} /> Start Free Trial Now</> : `Pay ₹${selectedPkg.price.toLocaleString("en-IN")} Now`}
                                                                        </Button>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                        )}
                                                        <Button variant="secondary" className="w-100 mt-2 btn-back" style={{ minHeight: "50px" }} onClick={() => { setStep(2); setError(""); }} icon={<ArrowLeft size={16} />}>
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
