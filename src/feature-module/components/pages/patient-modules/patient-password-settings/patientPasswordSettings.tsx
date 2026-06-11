import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import Footer from "../../../../../core/common/footer/footer";

type PasswordField = "password" | "confirmPassword";

const PatientPasswordSettings = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        toast.success("Password changed successfully");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to change password");
      }
    } catch (err) {
      toast.error("An error occurred while changing password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-3 border-bottom pb-3">
          <h4 className="fw-bold mb-0">Settings</h4>
        </div>
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-body p-0">
            <div className="row g-0">
              {/* Sidebar Navigation */}
              <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-12 border-end bg-light-500">
                <div className="p-4 sticky-top" style={{ top: '20px' }}>
                  <Link
                    to={all_routes.patientprofilesettings}
                    className="d-flex align-items-center gap-2 w-100 btn btn-md border-0 rounded-3 fs-14 fw-bold text-dark text-start mb-2 hover-primary"
                  >
                    <i className="ti ti-user-cog fs-18" /> Profile Settings
                  </Link>
                  <Link
                    to={all_routes.patientpasswordsettings}
                    className="d-flex align-items-center gap-2 w-100 btn btn-md border-0 rounded-3 fs-14 fw-bold text-primary text-start mb-2 active bg-white shadow-xs"
                  >
                    <i className="ti ti-lock-star fs-18" /> Change Password
                  </Link>
                </div>
              </div>

              {/* Form Content */}
              <div className="col-xxl-9 col-xl-9 col-lg-8 col-md-12 bg-white">
                <div className="p-4 p-md-5">
                  <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
                    <h5 className="fw-bold mb-0 text-dark">Change Password</h5>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      {/* New Password */}
                      <div className="col-lg-6">
                        <label className="form-label fw-bold text-dark fs-13">New Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input
                            type={passwordVisibility.password ? "text" : "password"}
                            className="form-control pe-5"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                          <span
                            className="position-absolute top-50 translate-middle-y end-0 me-3 cursor-pointer text-muted"
                            onClick={() => togglePasswordVisibility("password")}
                            style={{ zIndex: 5 }}
                          >
                            <i className={`ti ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"} fs-16`} />
                          </span>
                        </div>
                        <small className="text-muted fs-11 mt-1 d-block">Use 6 or more characters with a mix of letters & numbers</small>
                      </div>

                      {/* Confirm Password */}
                      <div className="col-lg-6">
                        <label className="form-label fw-bold text-dark fs-13">Confirm Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input
                            type={passwordVisibility.confirmPassword ? "text" : "password"}
                            className="form-control pe-5"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                          <span
                            className="position-absolute top-50 translate-middle-y end-0 me-3 cursor-pointer text-muted"
                            onClick={() => togglePasswordVisibility("confirmPassword")}
                            style={{ zIndex: 5 }}
                          >
                            <i className={`ti ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"} fs-16`} />
                          </span>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                          <small className="text-danger fs-11 mt-1 d-block">Passwords do not match</small>
                        )}
                        {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                          <small className="text-success fs-11 mt-1 d-block">
                            <i className="ti ti-check me-1" />Passwords match
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end align-items-center gap-2 mt-5 pt-3 border-top">
                      <button
                        type="button"
                        className="btn btn-light fw-bold px-4 border"
                        onClick={() => {
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                      >
                        Reset fields
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-2"
                        disabled={saving || !newPassword || newPassword !== confirmPassword}
                      >
                        {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-lock-check fs-16" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        .bg-light-500 { background-color: #f8fafc; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .hover-primary:hover { color: var(--bs-primary) !important; background-color: #f1f5f9; }
      `}</style>
    </div>
  );
};

export default PatientPasswordSettings;
