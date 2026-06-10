import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
            dob: d.dob
              ? new Date(d.dob).toISOString().split("T")[0]
              : "",
            bloodGroup: d.bloodGroup || "",
            maritalStatus: d.maritalStatus || "",
            occupation: d.occupation || "",
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

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Profile updated successfully");
        // Update local user data
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.fullName = `${formData.firstName} ${formData.lastName}`.trim();
          user.email = formData.email;
          localStorage.setItem("user", JSON.stringify(user));
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
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold mb-0">Settings</h4>
          </div>
          <div className="card" id="profilePage">
            <div className="card-body">
              <form onSubmit={handleSaveChanges}>
                <div className="row g-2">
                  {/* Sidebar Navigation */}
                  <div className="col-lg-3">
                    <div className="text-start">
                      <Link
                        to={all_routes.patientprofilesettings}
                        className="d-block w-100 btn btn-md border rounded fs-14 fw-medium text-primary text-start mb-1 active w-100 justify-content-start"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to={all_routes.patientpasswordsettings}
                        className="btn btn-md rounded fs-14 fw-medium text-dark mb-1 w-100 justify-content-start"
                      >
                        Change Password
                      </Link>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="col-lg-9">
                    <div className="border-1 border-start ps-4">
                      {/* Basic Information */}
                      <h5 className="fw-bold pb-3 mb-4 border-1 border-bottom">
                        Basic Information
                      </h5>
                      <div className="row g-3 border-bottom mb-3 pb-3">
                        {/* Profile Image */}
                        <div className="col-lg-12">
                          <div className="row g-2 align-items-center mb-2">
                            <div className="col-lg-2">
                              <label className="form-label mb-0">
                                Profile Image
                              </label>
                            </div>
                            <div className="col-lg-12">
                              <div className="profile-container">
                                <ImageWithBasePath
                                  src="assets/img/users/user-08.jpg"
                                  alt="Profile"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* First Name */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            First Name{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            className="form-control"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        {/* Last Name */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            Last Name{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            className="form-control"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        {/* Email */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        {/* Phone */}
                        <div className="col-lg-6">
                          <label className="form-label">
                            Phone Number{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        {/* Gender */}
                        <div className="col-lg-4">
                          <label className="form-label">Gender</label>
                          <select
                            name="gender"
                            className="form-select"
                            value={formData.gender}
                            onChange={handleInputChange}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Date of Birth */}
                        <div className="col-lg-4">
                          <label className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            className="form-control"
                            value={formData.dob}
                            onChange={handleInputChange}
                          />
                        </div>

                        {/* Blood Group */}
                        <div className="col-lg-4">
                          <label className="form-label">Blood Group</label>
                          <select
                            name="bloodGroup"
                            className="form-select"
                            value={formData.bloodGroup}
                            onChange={handleInputChange}
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

                        {/* Marital Status */}
                        <div className="col-lg-6">
                          <label className="form-label">Marital Status</label>
                          <select
                            name="maritalStatus"
                            className="form-select"
                            value={formData.maritalStatus}
                            onChange={handleInputChange}
                          >
                            <option value="">Select</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>

                        {/* Occupation */}
                        <div className="col-lg-6">
                          <label className="form-label">Occupation</label>
                          <input
                            type="text"
                            name="occupation"
                            className="form-control"
                            value={formData.occupation}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="row g-3 border-bottom mb-3 pb-3">
                        <div className="mb-1">
                          <h5 className="fw-bold mb-0">
                            Address Information
                          </h5>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Address Line 1</label>
                          <input
                            type="text"
                            name="addressLine1"
                            className="form-control"
                            value={formData.addressLine1}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Address Line 2</label>
                          <input
                            type="text"
                            name="addressLine2"
                            className="form-control"
                            value={formData.addressLine2}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Country</label>
                          <input
                            type="text"
                            name="country"
                            className="form-control"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            name="state"
                            className="form-control"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            name="city"
                            className="form-control"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            className="form-control"
                            value={formData.pincode}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-light btn-md fs-13 fw-medium rounded"
                          onClick={() => window.location.reload()}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-md fs-13 fw-medium rounded d-flex align-items-center gap-2"
                          disabled={saving}
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

export default PatientProfileSettings;
