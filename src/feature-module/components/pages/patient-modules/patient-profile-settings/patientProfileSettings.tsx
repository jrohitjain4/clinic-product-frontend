import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import PatientProfileUpload from "../../../../../core/common/patient-profile-upload/PatientProfileUpload";
import Footer from "../../../../../core/common/footer/footer";
import { setLocalStorageUser } from "../../../../../core/utils/apiClient";


const PatientProfileSettings = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    country: "India",
    state: "",
    city: "",
    pincode: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    maritalStatus: "",
    occupation: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const d = data.details || {};
          const user = data || {};
          const nameParts = (user.fullName || "").split(" ");

          setFormData({
            firstName: d.firstName || nameParts[0] || "",
            lastName: d.lastName || nameParts.slice(1).join(" ") || "",
            email: d.email || user.email || "",
            phone: d.phone || "",
            addressLine1: d.address1 || "",
            addressLine2: d.address2 || "",
            country: d.country || "India",
            state: d.state || "",
            city: d.city || "",
            pincode: d.pincode || "",
            gender: d.gender || "",
            dob: d.dob ? new Date(d.dob).toISOString().split("T")[0] : "",
            bloodGroup: d.bloodGroup || "",
            maritalStatus: d.maritalStatus || "",
            occupation: d.occupation || "",
            profileImage: d.profileImage || user.profileImage || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          address1: formData.addressLine1,
          address2: formData.addressLine2,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Update local user data
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.fullName = `${formData.firstName} ${formData.lastName}`.trim();
          user.email = formData.email;
          user.profileImage = formData.profileImage;
          setLocalStorageUser(user);
          window.dispatchEvent(new Event("storage"));
        }
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="content d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-3 border-bottom pb-3">
          <h4 className="fw-bold mb-0">Settings</h4>
        </div>
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden" id="profilePage">
          <div className="card-body p-0">
            <div className="row g-0">
              {/* Sidebar Navigation */}
              <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-12 border-end bg-light-500">
                <div className="p-4 sticky-top" style={{ top: '20px' }}>
                  <Link
                    to={all_routes.patientprofilesettings}
                    className="d-flex align-items-center gap-2 w-100 btn btn-md border-0 rounded-3 fs-14 fw-bold text-primary text-start mb-2 active bg-white shadow-xs"
                  >
                    <i className="ti ti-user-cog fs-18" /> Profile Settings
                  </Link>
                  <Link
                    to={all_routes.patientpasswordsettings}
                    className="d-flex align-items-center gap-2 w-100 btn btn-md border-0 rounded-3 fs-14 fw-bold text-dark text-start mb-2 hover-primary"
                  >
                    <i className="ti ti-lock-star fs-18" /> Change Password
                  </Link>
                </div>
              </div>

              {/* Profile Form */}
              <div className="col-xxl-9 col-xl-9 col-lg-8 col-md-12 bg-white">
                <div className="p-4 p-md-5">
                  <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
                    <h5 className="fw-bold mb-0 text-dark">Patient Profile Settings</h5>
                    {!isEditing ? (
                      <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={() => setIsEditing(true)}>
                        <i className="ti ti-edit fs-16" /> Edit Profile
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        <button className="btn btn-light fw-bold px-3 border" onClick={() => { setIsEditing(false); window.location.reload(); }}>Cancel</button>
                        <button className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handleSaveChanges} disabled={saving}>
                          {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-check fs-16" />}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                    {/* Basic Information */}
                    <div className="mb-5">
                      <h6 className="fw-bold text-primary mb-4 text-uppercase letter-spacing-1 fs-12">Basic Information</h6>
                      <div className="row g-4 overflow-visible">
                        {/* Profile Image */}
                        <div className="col-lg-12">
                          <label className="form-label fw-bold text-muted small text-uppercase mb-2">Profile Photo</label>
                          <div className="d-flex align-items-center gap-3">
                            <PatientProfileUpload
                              value={formData.profileImage}
                              onChange={(url) => setFormData({ ...formData, profileImage: url })}
                              disabled={!isEditing}
                            />
                            {!isEditing && (
                              <div className="text-muted fs-12 fst-italic ms-2">
                                Click "Edit Profile" <br /> to change photo
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">First Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="firstName"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">Last Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="lastName"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">Email Address <span className="text-danger">*</span></label>
                          <input
                            type="email"
                            name="email"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">Phone Number <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="phone"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">Gender</label>
                          <select
                            name="gender"
                            className={`form-select ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.gender}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.dob}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">Blood Group</label>
                          <select
                            name="bloodGroup"
                            className={`form-select ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.bloodGroup}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="mb-0">
                      <h6 className="fw-bold text-primary mb-4 text-uppercase letter-spacing-1 fs-12">Contact & Address</h6>
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">Address Line 1</label>
                          <input
                            type="text"
                            name="addressLine1"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.addressLine1}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label fw-bold text-dark fs-13">Address Line 2</label>
                          <input
                            type="text"
                            name="addressLine2"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.addressLine2}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">City</label>
                          <input
                            type="text"
                            name="city"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.city}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">State</label>
                          <input
                            type="text"
                            name="state"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-4">
                          <label className="form-label fw-bold text-dark fs-13">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            className={`form-control ${!isEditing ? 'bg-light border-transparent shadow-none cursor-default' : 'bg-white'}`}
                            value={formData.pincode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
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
        .letter-spacing-1 { letter-spacing: 1px; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .hover-primary:hover { color: var(--bs-primary) !important; background-color: #f1f5f9; }
        .cursor-default { cursor: default; }
        .border-transparent { border-color: transparent; }
        .avatar-xxl { width: 80px; height: 80px; }
      `}</style>
    </div>
  );
};

export default PatientProfileSettings;
