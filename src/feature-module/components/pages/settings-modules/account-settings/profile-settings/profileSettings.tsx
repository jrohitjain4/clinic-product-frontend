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

  const fullNameStr = userObj.fullName || "Administrator";
  const firstName = fullNameStr.split(" ")[0];
  const lastName = fullNameStr.split(" ").slice(1).join(" ") || "";
  const email = userObj.email || "admin@example.com";
  const phone = userObj.clinic?.phone || "+919876543210";
  const addressLine1 = userObj.clinic?.address || "123 Healthcare Street";
  const addressLine2 = "Sector 62"; // Placeholder if DB doesn't have it explicitly
  const pincode = "201301";

  const clinicName = userObj.clinic?.name || "";
  const gstNo = userObj.clinic?.gstNo || "";

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
                              <input type="text" className="form-control" defaultValue={firstName} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={lastName} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={email} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={phone} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={addressLine1} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={addressLine2} disabled={!isEditing} />
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
                              <input type="text" className="form-control" defaultValue={pincode} disabled={!isEditing} />
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
                        <div className="col-lg-6">
                          {/* start row */}
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">
                                Clinic Name
                              </label>
                            </div>
                            <div className="col-lg-8">
                              <input type="text" className="form-control" defaultValue={clinicName} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">GST Number</label>
                            </div>
                            <div className="col-lg-8">
                              <input type="text" className="form-control" defaultValue={gstNo} disabled={!isEditing} />
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
                            <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setIsEditing(false); }}>
                              Save Changes
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
