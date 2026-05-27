import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../core/config/api";

const getDashboardPath = (role: string): string => {
  switch (role) {
    case "DOCTOR":
      return all_routes.doctordashboard;
    case "PATIENT":
      return all_routes.patientdashboard;
    case "SUPER_ADMIN":
    case "ADMIN":
    case "PORTER":
    default:
      return all_routes.dashboard;
  }
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in. Please verify your credentials.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(getDashboardPath(data.user.role), { replace: true });
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
            {/* Left Cover Panel */}
            <div className="col-lg-6 p-0">
              <div className="login-backgrounds login-covers bg-primary d-lg-flex align-items-center justify-content-center d-none flex-wrap p-4 position-relative h-100 z-0">
                <div className="authentication-card w-100">
                  <div className="authen-overlay-item w-100">
                    <div className="authen-head text-center">
                      <h1 className="text-white fs-32 fw-bold mb-2">
                        Seamless healthcare access <br /> with smart, modern clinic
                      </h1>
                      <p className="text-light fw-normal">
                        Experience efficient, secure, and user-friendly healthcare
                        management designed for modern clinics and growing practices.
                      </p>
                    </div>
                    <div className="mt-4 mx-auto authen-overlay-img">
                      <ImageWithBasePath src="assets/img/auth/cover-imgs-1.png" alt="Img" />
                    </div>
                  </div>
                </div>
                <ImageWithBasePath
                  src="assets/img/auth/cover-imgs-2.png"
                  alt="cover-imgs-2"
                  className="img-fluid cover-img"
                />
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="row justify-content-center align-items-center overflow-auto flex-wrap vh-100">
                <div className="col-md-8 mx-auto">
                  <form onSubmit={handleLogin} className="d-flex justify-content-center align-items-center">
                    <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                      <div className="mx-auto mb-4 text-center">
                        <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                      </div>
                      <div className="card border-1 p-lg-3 shadow-md rounded-3 m-0">
                        <div className="card-body">
                          <div className="text-center mb-3">
                            <h5 className="mb-1 fs-20 fw-bold">Sign In</h5>
                            <p className="mb-0">Please enter your email and password to access your portal</p>
                          </div>

                          {error && (
                            <div className="alert alert-danger alert-dismissible fade show p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                              <i className="ti ti-alert-triangle me-1"></i> {error}
                            </div>
                          )}

                          <div className="mb-3">
                            <label className="form-label">Email Address</label>
                            <div className="input-group">
                              <span className="input-group-text border-end-0 bg-white">
                                <i className="ti ti-mail fs-14 text-dark" />
                              </span>
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control border-start-0 ps-0"
                                placeholder="Enter Email Address"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Password</label>
                            <div className="pass-group input-group position-relative border rounded">
                              <span className="input-group-text bg-white border-0">
                                <i className="ti ti-lock text-dark fs-14" />
                              </span>
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pass-input form-control ps-0 border-0"
                                placeholder="****************"
                              />
                              <span
                                className="input-group-text bg-white border-0"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ cursor: "pointer" }}
                              >
                                <i className={`ti ${showPassword ? "ti-eye" : "ti-eye-off"} text-dark fs-14`} />
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between mb-3">
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
                            <button
                              type="submit"
                              disabled={loading}
                              className="btn bg-primary text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Authenticating...
                                </>
                              ) : (
                                "Login"
                              )}
                            </button>
                          </div>

                          <div className="login-or position-relative mb-3">
                            <span className="span-or">OR</span>
                          </div>

                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-center flex-wrap">
                              <div className="text-center me-2 flex-fill">
                                <Link to="#" className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
                                  <ImageWithBasePath className="img-fluid m-1" src="assets/img/icons/facebook-logo.svg" alt="Facebook" />
                                </Link>
                              </div>
                              <div className="text-center me-2 flex-fill">
                                <Link to="#" className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
                                  <ImageWithBasePath className="img-fluid m-1" src="assets/img/icons/google-logo.svg" alt="Google" />
                                </Link>
                              </div>
                              <div className="text-center me-2 flex-fill">
                                <Link to="#" className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
                                  <ImageWithBasePath className="img-fluid m-1" src="assets/img/icons/apple-logo.svg" alt="Apple" />
                                </Link>
                              </div>
                            </div>
                          </div>

                          <div className="text-center">
                            <h6 className="fw-normal fs-14 text-dark mb-0">
                              Don't have an account yet?{" "}
                              <Link to={all_routes.registerbasic} className="hover-a text-primary ms-1">
                                Register
                              </Link>
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                  <p className="fs-14 text-dark text-center mt-4">Copyright © 2025 - Preclinic.</p>
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
