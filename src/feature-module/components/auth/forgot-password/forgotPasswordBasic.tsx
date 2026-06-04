import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { apiUrl } from "../../../../core/config/api";
import { Input } from "../../../../core/common/input/Input";
import { Button } from "../../../../core/common/button/Button";
import { User, Lock, Eye, EyeOff, Shield } from "react-feather";

const ForgotPasswordBasic = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier) return setError("Please enter your email or phone number.");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(apiUrl("/api/auth/request-password-reset"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to request OTP.");
            }

            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || !newPassword) return setError("OTP and New Password are required.");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(apiUrl("/api/auth/reset-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, otp, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password.");
            }

            navigate(all_routes.login, { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="container-fuild position-relative z-1">
                <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 bg-white">
                    <div className="row">
                        <div className="col-lg-6 p-0 d-none d-lg-block">
                            <div
                                className="d-flex align-items-center justify-content-center p-4 position-relative h-100"
                                style={{
                                    backgroundImage: "url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop')",
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
                                        Secure Password Recovery
                                    </h1>
                                    <p className="text-white fw-medium mx-auto fs-15" style={{ maxWidth: '500px', textShadow: '0 1px 4px rgba(0,0,0,0.3)', lineHeight: '1.6' }}>
                                        Reset your password quickly and securely utilizing SMS or Email verification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 col-md-12 col-sm-12">
                            <div className="row justify-content-center align-items-center overflow-auto flex-wrap vh-100">
                                <div className="col-md-8 mx-auto">
                                    <div className="text-center w-100 d-lg-none mb-4 mt-4">
                                        <img src="/logo.png" className="img-fluid" alt="DocYori Logo" style={{ maxHeight: "60px", width: "auto" }} />
                                    </div>

                                    <form onSubmit={step === 1 ? handleRequestOtp : handleResetPassword} className="d-flex justify-content-center align-items-center">
                                        <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                                            <div className="card border-1 p-lg-3 shadow-md rounded-3 m-0">
                                                <div className="card-body">
                                                    <div className="text-start mb-4">
                                                        <h5 className="mb-0 fs-28 fw-bold text-dark">Forgot Password</h5>
                                                        <p className="mb-0 text-muted fs-15">
                                                            {step === 1 ? "Enter your email or phone number to receive an OTP." : "Enter the OTP sent to your email/phone and choose a new password."}
                                                        </p>
                                                    </div>

                                                    {error && (
                                                        <div className="alert alert-danger alert-dismissible fade show p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                                                            <i className="ti ti-alert-triangle me-1"></i> {error}
                                                        </div>
                                                    )}

                                                    {step === 1 ? (
                                                        <>
                                                            <Input
                                                                label="Registered Email or Mobile"
                                                                type="text"
                                                                required
                                                                value={identifier}
                                                                onChange={(e) => setIdentifier(e.target.value)}
                                                                placeholder="Enter Username, Mobile or Email"
                                                                leftAddon={<User size={20} strokeWidth={2.5} color="#0f172a" />}
                                                            />
                                                            <div className="mb-3 mt-4">
                                                                <Button type="submit" disabled={loading} variant="primary" size="large" className="w-100 fs-15" style={{ padding: "12px", minHeight: "50px" }}>
                                                                    {loading ? "Sending OTP..." : "Send OTP"}
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Input
                                                                label="OTP (One Time Password)"
                                                                type="text"
                                                                required
                                                                value={otp}
                                                                onChange={(e) => setOtp(e.target.value)}
                                                                placeholder="6-digit OTP"
                                                                leftAddon={<Shield size={20} strokeWidth={2.5} color="#0f172a" />}
                                                            />
                                                            <Input
                                                                label="New Password"
                                                                type={showPassword ? "text" : "password"}
                                                                required
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                placeholder="****************"
                                                                leftAddon={<Lock size={20} strokeWidth={2.5} color="#0f172a" />}
                                                                rightIcon={
                                                                    <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "100%" }}>
                                                                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                    </div>
                                                                }
                                                            />
                                                            <div className="mb-3 mt-4">
                                                                <Button type="submit" disabled={loading} variant="primary" size="large" className="w-100 fs-15" style={{ padding: "12px", minHeight: "50px" }}>
                                                                    {loading ? "Resetting..." : "Reset Password"}
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="text-center mt-4">
                                                        <h6 className="fw-normal fs-14 text-dark mb-0">
                                                            Remembered your password?{" "}
                                                            <Link to={all_routes.login} className="hover-a text-primary fw-medium ms-1">
                                                                Login
                                                            </Link>
                                                        </h6>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                    <p className="fs-14 text-dark text-center mt-4">Copyright © 2026 - DocYori.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordBasic;
