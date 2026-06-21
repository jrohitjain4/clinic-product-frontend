import { Link } from "react-router";
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { Country, State, City } from "country-state-city";
import { useState, useRef, useEffect } from "react";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import DoctorProfileUpload from "../../../../../../core/common/doctor-profile-upload/DoctorProfileUpload";
import { toast } from "react-toastify";
import { resolveMediaUrl, apiUrl } from "../../../../../../core/config/api";
import ImageCropperModal from "../../../../../../core/common/crop/ImageCropperModal";

const ProfileSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  let userObj: any = {};
  try {
    userObj = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) { }

  const [logoPreview, setLogoPreview] = useState<string | null>(
    userObj.clinic?.landingPage?.logo && userObj.clinic?.landingPage?.logo !== "/logo.png"
      ? userObj.clinic.landingPage.logo
      : null
  );
  const [profileImage, setProfileImage] = useState<string | null>(userObj.profileImage || null);

  // Clinic logo cropper states
  const [isLogoCropOpen, setIsLogoCropOpen] = useState(false);
  const [logoCropImageSrc, setLogoCropImageSrc] = useState<string | null>(null);
  const [logoCropFileName, setLogoCropFileName] = useState("logo.jpg");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const nameParts = (userObj.fullName || "Admin User").split(" ");
  const initialFirstName = nameParts[0] || "Admin";
  const initialLastName = nameParts.slice(1).join(" ") || (userObj.fullName && !userObj.fullName.includes(" ") ? "" : "User");

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName || (initialFirstName === "Admin" ? "User" : ""),
    email: userObj.email || "admin@example.com",
    phone: userObj.clinic?.phone || "+919876543210",
    addressLine1: userObj.clinic?.addressLine1 || "123 Healthcare Street",
    addressLine2: userObj.clinic?.addressLine2 || "",
    pincode: userObj.clinic?.pincode || "201301",
    clinicName: userObj.clinic?.name || "",
    gstNo: userObj.clinic?.gstNumber || ""
  });

  // Find initial country, state, city from userObj.clinic
  const initialCountryName = userObj.clinic?.country || "";
  const initialCountryObj = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === initialCountryName.toLowerCase()
  );
  const initialCountryCode = initialCountryObj?.isoCode || "";

  const initialStateName = userObj.clinic?.state || "";
  const initialStateObj = initialCountryCode
    ? State.getStatesOfCountry(initialCountryCode).find(
        (s) => s.name.toLowerCase() === initialStateName.toLowerCase()
      )
    : null;
  const initialStateCode = initialStateObj?.isoCode || "";

  const initialCityName = userObj.clinic?.city || "";

  const [selectedCountry, setSelectedCountry] = useState<any>(
    initialCountryObj ? { value: initialCountryObj.isoCode, label: initialCountryObj.name } : null
  );
  const [selectedState, setSelectedState] = useState<any>(
    initialStateObj ? { value: initialStateObj.isoCode, label: initialStateObj.name } : null
  );
  const [selectedCity, setSelectedCity] = useState<any>(
    initialCityName ? { value: initialCityName, label: initialCityName } : null
  );

  const [countriesList] = useState(() =>
    Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }))
  );

  const [statesList, setStatesList] = useState<any[]>(() => {
    if (initialCountryCode) {
      return State.getStatesOfCountry(initialCountryCode).map((s) => ({ value: s.isoCode, label: s.name }));
    }
    return [];
  });

  const [citiesList, setCitiesList] = useState<any[]>(() => {
    if (initialCountryCode && initialStateCode) {
      return City.getCitiesOfState(initialCountryCode, initialStateCode).map((c) => ({ value: c.name, label: c.name }));
    }
    return [];
  });

  const handleCountryChange = (option: any) => {
    setSelectedCountry(option);
    setSelectedState(null);
    setSelectedCity(null);
    if (option) {
      const states = State.getStatesOfCountry(option.value).map((s) => ({ value: s.isoCode, label: s.name }));
      setStatesList(states);
    } else {
      setStatesList([]);
    }
    setCitiesList([]);
  };

  const handleStateChange = (option: any) => {
    setSelectedState(option);
    setSelectedCity(null);
    if (option && selectedCountry) {
      const cities = City.getCitiesOfState(selectedCountry.value, option.value).map((c) => ({ value: c.name, label: c.name }));
      setCitiesList(cities);
    } else {
      setCitiesList([]);
    }
  };

  const handleCityChange = (option: any) => {
    setSelectedCity(option);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Update localStorage
          localStorage.setItem("user", JSON.stringify(data));
          
          // Now set the form data and selected options!
          const nameParts = (data.fullName || "Admin User").split(" ");
          const fName = nameParts[0] || "Admin";
          const lName = nameParts.slice(1).join(" ") || (data.fullName && !data.fullName.includes(" ") ? "" : "User");

          setFormData({
            firstName: fName,
            lastName: lName,
            email: data.email || "",
            phone: data.clinic?.phone || "",
            addressLine1: data.clinic?.addressLine1 || "",
            addressLine2: data.clinic?.addressLine2 || "",
            pincode: data.clinic?.pincode || "",
            clinicName: data.clinic?.name || "",
            gstNo: data.clinic?.gstNumber || ""
          });

          if (data.clinic?.landingPage?.logo && data.clinic?.landingPage?.logo !== "/logo.png") {
            setLogoPreview(data.clinic.landingPage.logo);
          }
          if (data.profileImage) {
            setProfileImage(data.profileImage);
          }

          // Populate country/state/city dropdowns
          const countryName = data.clinic?.country || "";
          const countryObj = Country.getAllCountries().find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
          );
          if (countryObj) {
            setSelectedCountry({ value: countryObj.isoCode, label: countryObj.name });
            const states = State.getStatesOfCountry(countryObj.isoCode).map((s) => ({ value: s.isoCode, label: s.name }));
            setStatesList(states);

            const stateName = data.clinic?.state || "";
            const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
              (s) => s.name.toLowerCase() === stateName.toLowerCase()
            );
            if (stateObj) {
              setSelectedState({ value: stateObj.isoCode, label: stateObj.name });
              const cities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode).map((c) => ({ value: c.name, label: c.name }));
              setCitiesList(cities);

              const cityName = data.clinic?.city || "";
              if (cityName) {
                setSelectedCity({ value: cityName, label: cityName });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching profile settings", err);
      }
    };
    fetchProfile();
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Please fill the fields proper (First Name and Surname are required)", {
        position: "top-center"
      });
      return;
    }
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
          country: selectedCountry?.label || "",
          state: selectedState?.label || "",
          city: selectedCity?.label || "",
          profileImage: profileImage !== userObj.profileImage ? profileImage : undefined,
          clinicLogo: logoPreview || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully", { position: "top-center" });
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsEditing(false);
        setTimeout(() => window.location.reload(), 1500); // Wait a bit so they can see the success toast
      } else {
        toast.error(data.message || "Failed to update profile", { position: "top-center" });
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
                  <div className="card-header d-flex align-items-center justify-content-between border-bottom px-0 mx-3">
                    <h5 className="fw-bold mb-0">Basic Information</h5>
                    <div className="d-flex align-items-center">
                      {!isEditing ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.preventDefault(); setIsEditing(true); }}>
                          <i className="ti ti-edit me-2" /> Edit Profile
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn btn-light btn-sm me-2" onClick={(e) => { e.preventDefault(); setIsEditing(false); }}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      )}
                    </div>
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
                            <div className="col-lg-12">
                              <div>
                                <DoctorProfileUpload
                                  value={profileImage}
                                  onChange={(url) => setProfileImage(url)}
                                  disabled={!isEditing}
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
                            <div className="col-lg-12">
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
                                Surname
                                <span className="text-danger ms-1">*</span>
                              </label>
                            </div>
                            {/* end col */}
                            <div className="col-lg-12">
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
                            <div className="col-lg-12">
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
                            <div className="col-lg-12">
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
                            <div className="col-lg-12">
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
                            <div className="col-lg-12">
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
                            <div className="col-lg-12">
                              <CommonSelect
                                options={countriesList}
                                className="select"
                                value={selectedCountry}
                                onChange={handleCountryChange}
                                isDisabled={!isEditing}
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
                            <div className="col-lg-12">
                              <CommonSelect
                                options={statesList}
                                className="select"
                                value={selectedState}
                                onChange={handleStateChange}
                                isDisabled={!isEditing || !selectedCountry}
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
                            <div className="col-lg-12">
                              <CommonSelect
                                options={citiesList}
                                className="select"
                                value={selectedCity}
                                onChange={handleCityChange}
                                isDisabled={!isEditing || !selectedState}
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
                            <div className="col-lg-12">
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
                          <div className="row mb-4">
                            <div className="col-lg-12">
                              <label className="form-label mb-2">
                                Clinic Logo
                              </label>
                              <div className="d-flex align-items-center mb-3">
                                <div className="profile-upload me-3">
                                  <div className="profile-container d-flex align-items-center justify-content-center bg-light" style={{ width: '150px', height: '60px', border: '1px dashed #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                                    {logoPreview ? (
                                      <img
                                        src={resolveMediaUrl(logoPreview)}
                                        alt="Clinic Logo Preview"
                                        className="img-fluid object-fit-contain p-1 w-100 h-100"
                                      />
                                    ) : (
                                      <div className="d-flex align-items-center justify-content-center w-100 h-100" style={{ backgroundColor: "#f8fafc" }}>
                                        <i className="ti ti-camera" style={{ fontSize: "20px", color: "#94a3b8" }} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="profile-upload-content">
                                  <div className="profile-upload-btn mb-2">
                                    <label
                                      htmlFor="logoUpload"
                                      className={`btn btn-primary btn-sm ${!isEditing ? 'disabled' : ''}`}
                                      style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default' }}
                                    >
                                      <input
                                        ref={logoInputRef}
                                        type="file"
                                        id="logoUpload"
                                        accept="image/*"
                                        className="upload"
                                        disabled={!isEditing}
                                        style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: isEditing ? 'pointer' : 'default' }}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setLogoCropFileName(file.name);
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                              if (reader.result) {
                                                setLogoCropImageSrc(reader.result as string);
                                                setIsLogoCropOpen(true);
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                      <i className="ti ti-upload me-1" /> Browse
                                    </label>
                                  </div>
                                  <p className="fs-12 text-muted mb-0">Recommended image size is 250px x 100px.</p>
                                </div>
                              </div>
                              {isLogoCropOpen && logoCropImageSrc && (
                                <ImageCropperModal
                                  isOpen={isLogoCropOpen}
                                  imageSrc={logoCropImageSrc}
                                  onClose={() => {
                                    setIsLogoCropOpen(false);
                                    setLogoCropImageSrc(null);
                                    if (logoInputRef.current) logoInputRef.current.value = "";
                                  }}
                                  onCropComplete={(croppedFile) => {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setLogoPreview(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(croppedFile);
                                  }}
                                  title="Crop Clinic Logo"
                                  fileName={logoCropFileName}
                                />
                              )}
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
                            <div className="col-lg-12">
                              <input type="text" className="form-control" value={formData.clinicName} onChange={e => setFormData({ ...formData, clinicName: e.target.value })} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-lg-4">
                              <label className="form-label mb-0">GST Number</label>
                            </div>
                            <div className="col-lg-12">
                              <input type="text" className="form-control" value={formData.gstNo} onChange={e => setFormData({ ...formData, gstNo: e.target.value })} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Actions removed from bottom and moved to header */}
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
