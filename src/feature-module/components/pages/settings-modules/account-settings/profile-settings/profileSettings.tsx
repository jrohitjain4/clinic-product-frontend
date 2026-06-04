import { Link } from "react-router";
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { City, Country, State } from "../../../../../../core/common/selectOption";
import { useState } from "react";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";

const ProfileSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  let userObj: any = {};
  try {
    userObj = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) { }

  const [logoPreview, setLogoPreview] = useState(userObj.clinic?.landingPage?.logo || "/logo.png");

  const initialFirstName = (userObj.fullName || "Administrator").split(" ")[0];
  const initialLastName = (userObj.fullName || "Administrator").split(" ").slice(1).join(" ") || "";

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: userObj.email || "admin@example.com",
    phone: userObj.clinic?.phone || "+919876543210",
    addressLine1: userObj.clinic?.addressLine1 || "123 Healthcare Street",
    addressLine2: userObj.clinic?.addressLine2 || "",
    pincode: userObj.clinic?.pincode || "201301",
    clinicName: userObj.clinic?.name || "",
    gstNo: userObj.clinic?.gstNumber || ""
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...formData,
          clinicLogo: logoPreview !== "/logo.png" ? logoPreview : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsEditing(false);
        window.location.reload(); // Quick refresh to update sidebar & header
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content" id="profilePage">
          {/* Page Header */}
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold mb-0">Settings</h4>
          </div>
          {/* End Page Header */}
          <div className="card">
            <div className="card-body p-0">
              <div className="settings-wrapper d-flex">
                {/* Start Settings Sidebar */}
                <SettingsSidebar />
                {/* End Settings Sidebar */}
                <div className="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                  <div className="card-header border-bottom px-0 mx-3">
                    <h5 className="fw-bold">Basic Information</h5>
                  </div>
                  <div className="card-body px-0 mx-3">
                    <form>
                      {/* start row */}
                      <div className="row border-bottom mb-3">
                        <div className="col-lg-12">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-2">
                              <label className="form-label mb-0">
                                Profile Image
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-10">
                              <div className="profile-container">
                                <ImageWithBasePath
                                  src="assets/img/users/user-08.jpg"
                                  alt="Profile"
                                />
                                <div className="overlay-btn">
                                  <Link
                                    to="#"
                                    className="text-white"
                                    id="uploadTrigger"
                                  >
                                    <i className="ti ti-photo fs-10" />
                                  </Link>
                                </div>
                                <input
                                  type="file"
                                  id="profileUpload"
                                  style={{ display: "none" }}
                                />
                              </div>
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                First Name
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Last Name
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Email<span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Phone Number
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                      </div>
                      {/* end row */}
                      {/* start row */}
                      <div className="row border-bottom mb-3">
                        <div className="mb-3">
                          <h5 className="fw-bold mb-0">Address Information</h5>
                        </div>
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Address Line 1
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Address Line 2
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.addressLine2} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">Country</label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <CommonSelect
                                options={Country}
                                className="select"
                                defaultValue={Country[0]}
                              />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">State</label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <CommonSelect
                                options={State}
                                className="select"
                                defaultValue={State[0]}
                              />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">City</label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <CommonSelect
                                options={City}
                                className="select"
                                defaultValue={City[0]}
                              />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">Pincode</label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} disabled={!isEditing} />
                            </div>
                            {/* end col */}
                          </div>
                          {/* end row */}
                        </div>
                        {/* end col */}
                      </div>
                      {/* end row */}
                      {/* start row */}
                      <div className="row border-bottom mb-3 pb-3">
                        <div className="mb-3">
                          <h5 className="fw-bold mb-0">Clinic Information</h5>
                        </div>
                        <div className="col-lg-12">
                          <div className="row align-items-center mb-4">
                            <div className="col-lg-2">
                              <label className="form-label mb-0">
                                Clinic Logo
                              </label>
                            </div>
                            <div className="col-lg-10">
                              <div className="profile-container d-flex align-items-center justify-content-center bg-light" style={{ width: '100px', height: '100px', border: '1px dashed #ccc', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                  src={logoPreview}
                                  alt="Clinic Logo Preview"
                                  style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                                />
                                <div className="overlay-btn" style={{ position: 'absolute', bottom: '5px', right: '5px', opacity: isEditing ? 1 : 0.5 }}>
                                  <label
                                    htmlFor="logoUpload"
                                    className="btn btn-sm btn-primary rounded-circle p-1 cursor-pointer"
                                    style={{ cursor: isEditing ? 'pointer' : 'default' }}
                                  >
                                    <i className="ti ti-photo fs-14" />
                                  </label>
                                </div>
                                <input
                                  type="file"
                                  id="logoUpload"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  disabled={!isEditing}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result) {
                                          setLogoPreview(event.target.result as string);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </div>
                              <p className="fs-12 text-muted mt-1 mb-0">Recommended size: 1:1 ratio (Square). Click the icon to upload.</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Clinic Name
                              </label>
                            </div>
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.clinicName} onChange={e => setFormData({ ...formData, clinicName: e.target.value })} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">GST Number</label>
                            </div>
                            <div className="col-lg-8">
                              <input type="text" className="form-control" value={formData.gstNo} onChange={e => setFormData({ ...formData, gstNo: e.target.value })} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-end">
                        {!isEditing ? (
                          <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setIsEditing(true); }}>
                            <i className="ti ti-edit me-2" /> Edit Profile
                          </button>
                        ) : (
                          <>
                            <button type="button" className="btn btn-light me-3" onClick={(e) => { e.preventDefault(); setIsEditing(false); }}>
                              Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                              {saving ? "Saving..." : "Save Changes"}
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              DocYori
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default ProfileSettings;
