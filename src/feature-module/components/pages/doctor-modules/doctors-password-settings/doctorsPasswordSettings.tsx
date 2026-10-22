import { useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../core/config/api";
import { IconFormControl } from "../../../../../core/common/form-fields";

const DoctorsPasswordSettings = () => {
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.newPassword || !passwords.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          newPassword: passwords.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully");
        setPasswords({ newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.message || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating password");
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
              <div className="row g-3">
                <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-12">
                  <div className="text-start sticky-top" style={{ top: '20px' }}>
                    <Link
                      to={all_routes.doctorsprofilesettings}
                      className="btn btn-md rounded fs-14 fw-medium text-dark mb-1 w-100 justify-content-start"
                    >
                      <i className="ti ti-user-cog me-2 text-dark"> </i> Profile
                      Settings
                    </Link>
                    <Link
                      to={all_routes.doctorspasswordsettings}
                      className="d-block w-100 btn btn-md border rounded fs-14 fw-medium text-primary text-start mb-1 active"
                    >
                      <i className="ti ti-lock-star me-2 text-primary"> </i>{" "}
                      Change Password
                    </Link>
                  </div>
                </div>
                <div className="col-xxl-9 col-xl-9 col-lg-8 col-md-12">
                  <div className="border-1 border-lg-start ps-lg-4 ps-0 border-0">
                    <h5 className="fw-bold pb-3 mb-4 border-1 border-bottom">
                      Change Password
                    </h5>
                    <form onSubmit={handleSave}>
                      <div className="row g-3 border-bottom pb-4 mb-4">
                        <div className="col-lg-6">
                          <label className="form-label">
                            New Password <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <IconFormControl
                              fieldLabel="New Password"
                              type={showNew ? "text" : "password"}
                              className="pe-5"
                              placeholder="Enter new password"
                              value={passwords.newPassword}
                              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            />
                            <span
                              className="position-absolute top-50 end-0 translate-middle-y me-3"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setShowNew(!showNew)}
                            >
                              <i className={`ti ${showNew ? "ti-eye" : "ti-eye-off"} text-muted fs-16`} />
                            </span>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">
                            Confirm Password <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <IconFormControl
                              fieldLabel="Confirm Password"
                              type={showConfirm ? "text" : "password"}
                              className="pe-5"
                              placeholder="Re-enter new password"
                              value={passwords.confirmPassword}
                              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            />
                            <span
                              className="position-absolute top-50 end-0 translate-middle-y me-3"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setShowConfirm(!showConfirm)}
                            >
                              <i className={`ti ${showConfirm ? "ti-eye" : "ti-eye-off"} text-muted fs-16`} />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-light btn-md"
                          onClick={() => setPasswords({ newPassword: "", confirmPassword: "" })}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-md"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
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

export default DoctorsPasswordSettings;
