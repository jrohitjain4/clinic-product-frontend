import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

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
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold mb-0">Settings</h4>
          </div>
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-2">
                  {/* Sidebar */}
                  <div className="col-lg-3">
                    <div className="text-start">
                      <Link
                        to={all_routes.patientprofilesettings}
                        className="btn btn-md rounded fs-14 fw-medium text-dark mb-1 w-100 justify-content-start"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to={all_routes.patientpasswordsettings}
                        className="d-block w-100 btn btn-md border rounded fs-14 fw-medium text-primary text-start mb-1 active w-100 justify-content-start"
                      >
                        Change Password
                      </Link>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="col-lg-9">
                    <div className="border-1 border-start ps-4">
                      <h5 className="fw-bold pb-3 mb-4 border-1 border-bottom">
                        Change Password
                      </h5>
                      <div className="row g-3 border-bottom mb-3 pb-3">
                        {/* New Password */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            New Password <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <div className="pass-group input-group position-relative border rounded">
                              <input
                                type={
                                  passwordVisibility.password
                                    ? "text"
                                    : "password"
                                }
                                className="pass-input form-control border-0"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                              />
                              <span
                                className={`ti toggle-password fs-14 ${passwordVisibility.password
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                  }`}
                                onClick={() =>
                                  togglePasswordVisibility("password")
                                }
                                style={{ cursor: "pointer" }}
                              ></span>
                            </div>
                          </div>
                          <small className="text-muted">Minimum 6 characters</small>
                        </div>

                        {/* Confirm Password */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            Confirm Password{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <div className="pass-group input-group position-relative border rounded">
                              <input
                                type={
                                  passwordVisibility.confirmPassword
                                    ? "text"
                                    : "password"
                                }
                                className="pass-input form-control border-0"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                required
                              />
                              <span
                                className={`ti toggle-password fs-14 ${passwordVisibility.confirmPassword
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                  }`}
                                onClick={() =>
                                  togglePasswordVisibility("confirmPassword")
                                }
                                style={{ cursor: "pointer" }}
                              ></span>
                            </div>
                          </div>
                          {confirmPassword && confirmPassword !== newPassword && (
                            <small className="text-danger">Passwords do not match</small>
                          )}
                          {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                            <small className="text-success">
                              <i className="ti ti-check me-1"></i>Passwords match
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-light btn-md fs-13 fw-medium rounded"
                          onClick={() => {
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-md fs-13 fw-medium rounded d-flex align-items-center gap-2"
                          disabled={saving || !newPassword || newPassword !== confirmPassword}
                        >
                          {saving && (
                            <span className="spinner-border spinner-border-sm" />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025{" "}
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default PatientPasswordSettings;
