import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../core/config/api";
import { Input } from "../../../../core/common/input/Input";
import { Button } from "../../../../core/common/button/Button";
import { User, Lock, Eye, EyeOff, LogIn, Phone, MessageSquare, ArrowLeft } from "react-feather";
import { setLocalStorageUser } from "../../../../core/utils/apiClient";

const getDashboardPath = (role: string): string => {
  switch (role) {
    case "SUPER_ADMIN":
      return all_routes.superAdminDashboard;
    case "DOCTOR":
      return all_routes.doctordashboard;
    case "PATIENT":
      return all_routes.patientdashboard;
    case "ADMIN":
    case "PORTER":
    case "STAFF":
    default:
      return all_routes.dashboard;
  }
};

const Login = () => {
  const navigate = useNavigate();
  
  // Normal Password Login States
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // OTP Login States
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    let hasError = false;
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = "Please enter your username, mobile, or email.";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Please enter your password.";
      hasError = true;
    }

    if (hasError) {
      setFormErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in. Please verify your credentials.");
      }

      localStorage.setItem("token", data.token);
      setLocalStorageUser(data.user);
      toast.success("Welcome back!");
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    
    if (cleanPhone.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP.");
      }
      setOtpSent(true);
      toast.success("OTP sent to your mobile number successfully");
    } catch (err: any) {
      setOtpError(err.message);
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    
    if (!otp.trim()) {
      setOtpError("OTP is required");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch(apiUrl("/api/auth/verify-otp-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP code");
      }
      localStorage.setItem("token", data.token);
      setLocalStorageUser(data.user);
      toast.success("Welcome back!");
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err: any) {
      setOtpError(err.message);
      toast.error(err.message || "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const switchToPasswordLogin = () => {
    setLoginMode("password");
    setOtpSent(false);
    setPhone("");
    setOtp("");
    setOtpError("");
    setError("");
  };

  const switchToOtpLogin = () => {
    setLoginMode("otp");
    setOtpSent(false);
    setPhone("");
    setOtp("");
    setOtpError("");
    setError("");
  };

  return (
    <>
      <div className="container-fuild position-relative z-1">
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
                <div className="col-md-8 mx-auto">

                  {/* Logo for Mobile View */}
                  <div className="text-center w-100 d-lg-none mb-4 mt-4">
                    <img src="/logo.png" className="img-fluid" alt="DocYori Logo" style={{ maxHeight: "60px", width: "auto" }} />
                  </div>

                  <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                    <div className="card border-1 p-lg-3 shadow-md rounded-3 m-0">
                      <div className="card-body">
                        
                        <div className="text-start mb-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="d-flex align-items-center justify-content-center bg-light rounded-circle me-3" style={{ width: '45px', height: '45px', border: '1.5px solid #e2e8f0' }}>
                              <LogIn size={22} color="#6366f1" strokeWidth={2.5} />
                            </div>
                            <h5 className="mb-0 fs-28 fw-bold text-dark">{loginMode === "password" ? "Login" : "OTP Login"}</h5>
                          </div>
                          <p className="mb-0 text-muted fs-15">
                            This panel is strictly for authorized administrators.<br />
                            Unauthorized access is prohibited.
                          </p>
                        </div>

                        {/* ─── PASSWORD LOGIN MODE ─── */}
                        {loginMode === "password" && (
                          <form onSubmit={handleLogin} noValidate>
                            {error && (
                              <div className="alert alert-danger alert-dismissible fade show p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                                <i className="ti ti-alert-triangle me-1"></i> {error}
                              </div>
                            )}

                            <Input
                              label="Email / Mobile / Username"
                              type="text"
                              required
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              placeholder="Enter Username, Mobile or Email"
                              leftAddon={<User size={20} strokeWidth={2.5} color="#0f172a" />}
                              error={formErrors.identifier}
                            />

                            <Input
                              label="Password"
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="****************"
                              leftAddon={<Lock size={20} strokeWidth={2.5} color="#0f172a" />}
                              error={formErrors.password}
                              rightIcon={
                                <div
                                  onClick={() => setShowPassword(!showPassword)}
                                  style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "100%" }}
                                >
                                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </div>
                              }
                            />

                            <div className="d-flex align-items-center justify-content-between mb-3 mt-2">
                              <div className="form-check form-check-md mb-0">
                                <input className="form-check-input" id="remember_me" type="checkbox" />
                                <label htmlFor="remember_me" className="form-check-label mt-0 text-dark">
                                  Remember Me
                                </label>
                              </div>
                              <Link to={all_routes.forgotpasswordbasic} className="text-danger">
                                Forgot Password?
                              </Link>
                            </div>

                            <div className="mb-3">
                              <Button
                                type="submit"
                                disabled={loading}
                                variant="primary"
                                size="large"
                                className="w-100 fs-15"
                                style={{ padding: "12px", minHeight: "50px" }}
                                icon={<LogIn size={18} strokeWidth={2.5} />}
                                iconPosition="right"
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Authenticating...
                                  </>
                                ) : (
                                  "Login"
                                )}
                              </Button>
                            </div>
                          </form>
                        )}

                        {/* ─── OTP LOGIN MODE ─── */}
                        {loginMode === "otp" && (
                          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} noValidate>
                            {otpError && (
                              <div className="alert alert-danger alert-dismissible fade show p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                                <i className="ti ti-alert-triangle me-1"></i> {otpError}
                              </div>
                            )}

                            <Input
                              label="Mobile Number (registered)"
                              type="tel"
                              required
                              disabled={otpSent}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              placeholder="Enter 10-digit registered number"
                              leftAddon={<Phone size={20} strokeWidth={2.5} color="#0f172a" />}
                            />

                            {otpSent && (
                              <Input
                                label="One Time Passcode (OTP)"
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                leftAddon={<MessageSquare size={20} strokeWidth={2.5} color="#0f172a" />}
                              />
                            )}

                            <div className="mb-3 mt-4">
                              {!otpSent ? (
                                <Button
                                  type="submit"
                                  disabled={sendingOtp}
                                  variant="primary"
                                  size="large"
                                  className="w-100 fs-15"
                                  style={{ padding: "12px", minHeight: "50px" }}
                                >
                                  {sendingOtp ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Sending OTP...
                                    </>
                                  ) : (
                                    "Send OTP"
                                  )}
                                </Button>
                              ) : (
                                <div className="d-flex flex-column gap-2">
                                  <Button
                                    type="submit"
                                    disabled={verifyingOtp}
                                    variant="primary"
                                    size="large"
                                    className="w-100 fs-15"
                                    style={{ padding: "12px", minHeight: "50px" }}
                                  >
                                    {verifyingOtp ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Verifying...
                                      </>
                                    ) : (
                                      "Verify & Login"
                                    )}
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    className="btn btn-link text-primary fs-13 mt-1"
                                    disabled={sendingOtp}
                                  >
                                    {sendingOtp ? "Sending..." : "Resend OTP"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={switchToPasswordLogin}
                              className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                              style={{ padding: "10px", minHeight: "45px", borderRadius: "8px" }}
                            >
                              <ArrowLeft size={16} /> Back to Password Login
                            </button>
                          </form>
                        )}

                        {/* Continue with Mobile No. & OTP Link */}
                        {loginMode === "password" && (
                          <div className="text-center mt-3 mb-2">
                            <button
                              type="button"
                              onClick={switchToOtpLogin}
                              className="btn btn-link text-primary fw-medium fs-14 p-0"
                            >
                              Continue with Mobile No. & OTP
                            </button>
                          </div>
                        )}

                        <div className="text-center mt-4">
                          <h6 className="fw-normal fs-14 text-dark mb-0">
                            Don't have an account yet?{" "}
                            <Link to={all_routes.registerbasic} className="hover-a text-primary fw-medium ms-1">
                              Register
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

export default Login;
