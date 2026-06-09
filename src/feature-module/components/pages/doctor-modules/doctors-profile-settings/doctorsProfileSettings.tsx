import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { City, Country, State } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { all_routes } from "../../../../routes/all_routes";
import { useEffect, useState, useMemo } from "react";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import DoctorProfileUpload from "../../../../../core/common/doctor-profile-upload/DoctorProfileUpload";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../core/config/api";

const DoctorsProfileSettings = () => {
  const [user, setUser] = useState<any>(null);
  const { doctors, loading: loadingDoctors, refetch } = useClinicDoctors();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const currentDoctor = useMemo(() => {
    if (!user || doctors.length === 0) return null;
    return doctors.find(
      (d: any) => d.email === user.email || d.userId === user.id || d.id === user.id
    );
  }, [doctors, user]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    country: "India",
    state: "Uttar Pradesh",
    city: "Noida",
    pincode: "",
    yearOfExperience: "",
    bio: "",
    appointmentDuration: "30",
    consultationCharge: "0",
    followUpEnabled: false,
    followUpValidityDays: "7",
    followUpFee: "0",
    educations: [] as any[],
    certifications: [] as any[],
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (currentDoctor) {
      const names = (currentDoctor.fullName || "").split(" ");
      setFormData({
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: currentDoctor.email || "",
        phone: currentDoctor.phone || "",
        address1: (currentDoctor as any).address1 || "",
        address2: (currentDoctor as any).address2 || "",
        country: (currentDoctor as any).country || "India",
        state: (currentDoctor as any).state || "Uttar Pradesh",
        city: (currentDoctor as any).city || "Noida",
        pincode: (currentDoctor as any).pincode || "",
        yearOfExperience: String((currentDoctor as any).yearOfExperience || ""),
        bio: (currentDoctor as any).bio || "",
        appointmentDuration: String((currentDoctor as any).appointmentDuration || "30"),
        consultationCharge: String((currentDoctor as any).consultationCharge || "0"),
        followUpEnabled: (currentDoctor as any).followUpEnabled || false,
        followUpValidityDays: String((currentDoctor as any).followUpValidityDays || "7"),
        followUpFee: String((currentDoctor as any).followUpFee || "0"),
        educations: Array.isArray((currentDoctor as any).educations) ? (currentDoctor as any).educations : [],
        certifications: Array.isArray((currentDoctor as any).certifications) ? (currentDoctor as any).certifications : [],
      });
      setProfileImage(currentDoctor.profileImage || null);
    }
  }, [currentDoctor]);

  const addEducation = () => {
    setFormData({
      ...formData,
      educations: [...formData.educations, { degree: "", college: "", year: "" }]
    });
  };

  const removeEducation = (index: number) => {
    const updated = [...formData.educations];
    updated.splice(index, 1);
    setFormData({ ...formData, educations: updated });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: "", year: "" }]
    });
  };

  const removeCertification = (index: number) => {
    const updated = [...formData.certifications];
    updated.splice(index, 1);
    setFormData({ ...formData, certifications: updated });
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!currentDoctor) return;

    setSaving(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const res = await fetch(apiUrl(`/api/doctors/${currentDoctor.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...formData,
          fullName,
          profileImage,
          yearOfExperience: parseInt(formData.yearOfExperience) || 0,
          appointmentDuration: parseInt(formData.appointmentDuration) || 30,
          consultationCharge: parseFloat(formData.consultationCharge) || 0,
          followUpValidityDays: parseInt(formData.followUpValidityDays) || 0,
          followUpFee: parseFloat(formData.followUpFee) || 0,
        })
      });

      if (res.ok) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
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
          <div className="card" id="profilePage">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-3">
                  <div className="text-start sticky-top" style={{ top: '20px' }}>
                    <Link
                      to={all_routes.doctorsprofilesettings}
                      className="d-block w-100 btn btn-md border rounded fs-14 fw-medium text-primary text-start mb-1 active w-100 justify-content-start"
                    >
                      <i className="ti ti-user-cog me-2 text-primary"> </i>{" "}
                      Profile Settings
                    </Link>
                    <Link
                      to={all_routes.doctorspasswordsettings}
                      className="btn btn-md rounded fs-14 fw-medium text-dark mb-1 w-100 justify-content-start"
                    >
                      <i className="ti ti-lock-star me-2 text-dark"> </i> Change
                      Password
                    </Link>
                  </div>
                </div>
                <div className="col-lg-9">
                  <div className="border-1 border-start ps-4">
                    <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-1 border-bottom">
                      <h5 className="fw-bold mb-0">Doctor Profile Settings</h5>
                      {!isEditing ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                          <i className="ti ti-edit me-1" /> Edit Profile
                        </button>
                      ) : (
                        <div className="d-flex gap-2">
                          <button className="btn btn-light btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Basic Info Section */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Basic Information</h6>
                      <div className="row g-3 border-bottom pb-4 mb-4">
                        <div className="col-lg-12">
                          <div className="row g-2 align-items-center">
                            <div className="col-lg-12">
                              <label className="form-label mb-2">Profile Image <span className="text-danger">*</span></label>
                              <DoctorProfileUpload
                                value={profileImage}
                                onChange={setProfileImage}
                                disabled={!isEditing}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-6">
                          <label className="form-label">First Name <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Last Name <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Email <span className="text-danger">*</span></label>
                          <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Years of Experience</label>
                          <input type="number" className="form-control" value={formData.yearOfExperience} onChange={(e) => setFormData({ ...formData, yearOfExperience: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-12">
                          <label className="form-label">Bio (Brief Summary)</label>
                          <textarea className="form-control" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} disabled={!isEditing}></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Address Info Section */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Address Information</h6>
                      <div className="row g-3 border-bottom pb-4 mb-4">
                        <div className="col-lg-6">
                          <label className="form-label">Address Line 1</label>
                          <input type="text" className="form-control" value={formData.address1} onChange={(e) => setFormData({ ...formData, address1: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Address Line 2</label>
                          <input type="text" className="form-control" value={formData.address2} onChange={(e) => setFormData({ ...formData, address2: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Country</label>
                          <CommonSelect
                            options={Country}
                            className="select"
                            value={Country.find(c => c.value === formData.country) || Country[0]}
                            onChange={(val: any) => setFormData({ ...formData, country: val.value })}
                            isDisabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">State</label>
                          <CommonSelect
                            options={State}
                            className="select"
                            value={State.find(s => s.value === formData.state) || State[0]}
                            onChange={(val: any) => setFormData({ ...formData, state: val.value })}
                            isDisabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">City</label>
                          <CommonSelect
                            options={City}
                            className="select"
                            value={City.find(c => c.value === formData.city) || City[0]}
                            onChange={(val: any) => setFormData({ ...formData, city: val.value })}
                            isDisabled={!isEditing}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Pincode</label>
                          <input type="text" className="form-control" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} disabled={!isEditing} />
                        </div>
                      </div>
                    </div>

                    {/* Education Section */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Education</h6>
                        {isEditing && (
                          <button className="btn btn-outline-primary btn-sm" onClick={addEducation}>
                            <i className="ti ti-plus me-1" /> Add Education
                          </button>
                        )}
                      </div>
                      <div className="border-bottom pb-2 mb-4">
                        {formData.educations.map((edu, idx) => (
                          <div key={idx} className="card bg-light-500 shadow-none border mb-2 p-3">
                            <div className="row g-2 align-items-end">
                              <div className="col-lg-4">
                                <label className="form-label fs-12">Degree</label>
                                <input type="text" className="form-control form-control-sm" value={edu.degree} onChange={(e) => {
                                  const updated = [...formData.educations];
                                  updated[idx].degree = e.target.value;
                                  setFormData({ ...formData, educations: updated });
                                }} disabled={!isEditing} />
                              </div>
                              <div className="col-lg-4">
                                <label className="form-label fs-12">College / University</label>
                                <input type="text" className="form-control form-control-sm" value={edu.college} onChange={(e) => {
                                  const updated = [...formData.educations];
                                  updated[idx].college = e.target.value;
                                  setFormData({ ...formData, educations: updated });
                                }} disabled={!isEditing} />
                              </div>
                              <div className="col-lg-3">
                                <label className="form-label fs-12">Year</label>
                                <input type="text" className="form-control form-control-sm" value={edu.year} onChange={(e) => {
                                  const updated = [...formData.educations];
                                  updated[idx].year = e.target.value;
                                  setFormData({ ...formData, educations: updated });
                                }} disabled={!isEditing} />
                              </div>
                              <div className="col-lg-1 text-end">
                                {isEditing && (
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => removeEducation(idx)}>
                                    <i className="ti ti-trash" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {formData.educations.length === 0 && <p className="text-muted fs-13 fst-italic">No education records added.</p>}
                      </div>
                    </div>

                    {/* Certifications Section */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Certifications</h6>
                        {isEditing && (
                          <button className="btn btn-outline-primary btn-sm" onClick={addCertification}>
                            <i className="ti ti-plus me-1" /> Add Certification
                          </button>
                        )}
                      </div>
                      <div className="border-bottom pb-2 mb-4">
                        {formData.certifications.map((cert, idx) => (
                          <div key={idx} className="card bg-light-500 shadow-none border mb-2 p-3">
                            <div className="row g-2 align-items-end">
                              <div className="col-lg-7">
                                <label className="form-label fs-12">Certification Name</label>
                                <input type="text" className="form-control form-control-sm" value={cert.name} onChange={(e) => {
                                  const updated = [...formData.certifications];
                                  updated[idx].name = e.target.value;
                                  setFormData({ ...formData, certifications: updated });
                                }} disabled={!isEditing} />
                              </div>
                              <div className="col-lg-4">
                                <label className="form-label fs-12">Year</label>
                                <input type="text" className="form-control form-control-sm" value={cert.year} onChange={(e) => {
                                  const updated = [...formData.certifications];
                                  updated[idx].year = e.target.value;
                                  setFormData({ ...formData, certifications: updated });
                                }} disabled={!isEditing} />
                              </div>
                              <div className="col-lg-1 text-end">
                                {isEditing && (
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => removeCertification(idx)}>
                                    <i className="ti ti-trash" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {formData.certifications.length === 0 && <p className="text-muted fs-13 fst-italic">No certifications added.</p>}
                      </div>
                    </div>

                    {/* Appointment Settings Section */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Appointment Settings</h6>
                      <div className="row g-3 border-bottom pb-4 mb-4">
                        <div className="col-lg-6">
                          <label className="form-label">Consultation Duration (Mins)</label>
                          <input type="number" className="form-control" value={formData.appointmentDuration} onChange={(e) => setFormData({ ...formData, appointmentDuration: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Consultation Fee (₹)</label>
                          <input type="number" className="form-control" value={formData.consultationCharge} onChange={(e) => setFormData({ ...formData, consultationCharge: e.target.value })} disabled={!isEditing} />
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Settings Section */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Follow-up Settings</h6>
                      <div className="row g-3 pb-2">
                        <div className="col-lg-12">
                          <div className="form-check form-switch p-0 d-flex align-items-center gap-3">
                            <label className="form-check-label fw-medium mb-0" htmlFor="followUpEnabled">Enable Follow-up Booking</label>
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              id="followUpEnabled"
                              checked={formData.followUpEnabled}
                              onChange={(e) => setFormData({ ...formData, followUpEnabled: e.target.checked })}
                              disabled={!isEditing}
                              style={{ width: '40px', height: '20px' }}
                            />
                          </div>
                        </div>
                        {formData.followUpEnabled && (
                          <>
                            <div className="col-lg-6 mt-3">
                              <label className="form-label">Follow-up Validity (Days)</label>
                              <input type="number" className="form-control" value={formData.followUpValidityDays} onChange={(e) => setFormData({ ...formData, followUpValidityDays: e.target.value })} disabled={!isEditing} />
                            </div>
                            <div className="col-lg-6 mt-3">
                              <label className="form-label">Follow-up Fee (₹)</label>
                              <input type="number" className="form-control" value={formData.followUpFee} onChange={(e) => setFormData({ ...formData, followUpFee: e.target.value })} disabled={!isEditing} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

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

export default DoctorsProfileSettings;
