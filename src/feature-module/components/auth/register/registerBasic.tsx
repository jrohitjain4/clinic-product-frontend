import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { apiUrl } from "../../../../core/config/api";

type PasswordField = "password" | "confirmPassword";

interface ClinicOption {
  id: string;
  name: string;
  subdomain: string;
}

const RegisterBasic = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("DOCTOR");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Doctor/Patient/Porter: link to existing clinic
  const [clinicId, setClinicId] = useState("");
  const [clinics, setClinics] = useState<ClinicOption[]>([]);

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch clinics list for role mapping
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/clinics");
        if (res.ok) {
          const data = await res.json();
          setClinics(data);
          if (data.length > 0) {
            setClinicId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load clinics", err);
      }
    };
    fetchClinics();
  }, []);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        fullName,
        role,
        clinicId,
      };

      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Account registered successfully! Redirecting to login...");
      
      // Navigate to login basic screen after 2 seconds
      setTimeout(() => {
        navigate(all_routes.login);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Start Content */}
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          {/* start row */}
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap py-3">
            <div className="col-lg-4 mx-auto">
              <form onSubmit={handleRegister} className="d-flex justify-content-center align-items-center">
                <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                  <div className=" mx-auto mb-4 text-center">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                    />
                  </div>
                  <div className="card border-1 p-lg-3 shadow-md rounded-3 mb-4">
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <h5 className="mb-1 fs-20 fw-bold">Register Account</h5>
                        <p className="mb-0">
                          Create your profile in our SaaS platform
                        </p>
                      </div>

                      {/* Role Selector Tabs */}
                      <div className="mb-3">
                        <label className="form-label d-block text-center fw-semibold text-secondary mb-2" style={{ fontSize: "13px" }}>
                          Choose Registration Role
                        </label>
                        <div className="d-flex flex-wrap gap-1 justify-content-center bg-light p-1.5 rounded-3 mb-3">
                          {[
                            { value: "DOCTOR", label: "Doctor" },
                            { value: "PATIENT", label: "Patient" },
                            { value: "PORTER", label: "Porter" },
                          ].map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => {
                                setRole(r.value);
                                setError("");
                              }}
                              className={`btn btn-sm px-2.5 py-1.5 rounded-pill border-0 transition-all ${
                                role === r.value
                                  ? "btn-primary shadow-sm text-white"
                                  : "bg-transparent text-dark hover-bg-light"
                              }`}
                              style={{ fontSize: "11px", fontWeight: "600" }}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Status Alerts */}
                      {error && (
                        <div className="alert alert-danger p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                          <i className="ti ti-alert-triangle me-1"></i> {error}
                        </div>
                      )}
                      {success && (
                        <div className="alert alert-success p-2 mb-3 rounded" role="alert" style={{ fontSize: "13px" }}>
                          <i className="ti ti-circle-check me-1"></i> {success}
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <div className="input-group">
                          <span className="input-group-text border-end-0 bg-white">
                            <i className="ti ti-user fs-14 text-dark" />
                          </span>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter Name"
                          />
                        </div>
                      </div>

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
                        <label className="form-label">Select Associated Clinic</label>
                        <div className="input-group">
                          <span className="input-group-text border-end-0 bg-white">
                            <i className="ti ti-building fs-14 text-dark" />
                          </span>
                          <select
                            required
                            value={clinicId}
                            onChange={(e) => setClinicId(e.target.value)}
                            className="form-select border-start-0 ps-0"
                          >
                            {clinics.length > 0 ? (
                              clinics.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.subdomain})
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>No clinics available. Contact your clinic administrator.</option>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                          <div className="pass-group input-group position-relative border rounded">
                            <span className="input-group-text bg-white border-0">
                              <i className="ti ti-lock text-dark fs-14" />
                            </span>
                            <input
                              type={passwordVisibility.password ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pass-input form-control border-start-0 ps-0"
                              placeholder="****************"
                            />
                            <span
                              className={`ti toggle-password text-dark fs-14 cursor-pointer ${
                                passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => togglePasswordVisibility("password")}
                            ></span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <div className="position-relative">
                          <div className="pass-group input-group position-relative border rounded">
                            <span className="input-group-text bg-white border-0">
                              <i className="ti ti-lock text-dark fs-14" />
                            </span>
                            <input
                              type={passwordVisibility.confirmPassword ? "text" : "password"}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pass-input form-control border-start-0 ps-0"
                              placeholder="****************"
                            />
                            <span
                              className={`ti toggle-password text-dark fs-14 cursor-pointer ${
                                passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => togglePasswordVisibility("confirmPassword")}
                            ></span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <button
                          type="submit"
                          disabled={loading || clinics.length === 0}
                          className="btn bg-primary text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Registering Account...
                            </>
                          ) : (
                            "Register"
                          )}
                        </button>
                      </div>

                      <div className="login-or position-relative mb-3">
                        <span className="span-or">OR</span>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-center flex-wrap">
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/facebook-logo.svg"
                                alt="Facebook"
                              />
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/google-logo.svg"
                                alt="Google"
                              />
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/apple-logo.svg"
                                alt="apple"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal fs-14 text-dark mb-0">
                          Already have an account?
                          <Link to={all_routes.login} className="hover-a text-primary ms-1">
                            Login
                          </Link>
                        </h6>
                      </div>
                    </div>
                    {/* end card body */}
                  </div>
                  {/* end card */}
                </div>
              </form>
              <p className="text-dark text-center">
                Copyright © 2025 - Preclinic.
              </p>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </div>
      {/* End Content */}
    </>
  );
};

export default RegisterBasic;
