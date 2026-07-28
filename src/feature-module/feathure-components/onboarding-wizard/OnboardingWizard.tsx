import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { TimePicker, Button } from "antd";
import dayjs from "dayjs";
import { City, Country, State } from "../../../core/common/selectOption";
import DoctorProfileUpload from "../../../core/common/doctor-profile-upload/DoctorProfileUpload";
import { apiUrl, resolveMediaUrl } from "../../../core/config/api";
import { setLocalStorageUser } from "../../../core/utils/apiClient";
import ImageCropperModal from "../../../core/common/crop/ImageCropperModal";
import { IconFormControl, IconSelect } from "../../../core/common/form-fields";


interface OnboardingWizardProps {
  onComplete: () => void;
}

interface DaySchedule {
  day: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  let userObj: any = {};
  try {
    userObj = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) { }

  const [step, setStep] = useState<number>(userObj.clinic?.onboardingStep || 0);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    userObj.clinic?.landingPage?.logo && userObj.clinic?.landingPage?.logo !== "/logo.png"
      ? userObj.clinic.landingPage.logo
      : null
  );
  const [profileImage, setProfileImage] = useState<string | null>(userObj.profileImage || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Logo Cropper States
  const [isLogoCropOpen, setIsLogoCropOpen] = useState(false);
  const [logoCropImageSrc, setLogoCropImageSrc] = useState<string | null>(null);
  const [logoCropFileName, setLogoCropFileName] = useState("logo.jpg");

  const nameParts = (userObj.fullName || "").split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  // Step 1: Profile Form Data
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: userObj.email || "",
    phone: userObj.clinic?.phone || "",
    addressLine1: userObj.clinic?.addressLine1 || "",
    addressLine2: userObj.clinic?.addressLine2 || "",
    country: userObj.clinic?.country || "",
    state: userObj.clinic?.state || "",
    city: userObj.clinic?.city || "",
    pincode: userObj.clinic?.pincode || "",
    clinicName: userObj.clinic?.name || "",
    gstNo: userObj.clinic?.gstNumber || ""
  });

  const [saving, setSaving] = useState(false);

  // Step 2: Clinic Timing Data
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const daysName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch timings config when step 2 is active
  useEffect(() => {
    if (step === 1) {
      fetchTimings();
    }
  }, [step]);

  const fetchTimings = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings/working-days/config"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedules) {
          setSchedules(data.schedules);
        }
      }
    } catch (err) {
      console.error("Fetch timings error:", err);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("profileImage", file);

      const res = await fetch(apiUrl("/api/uploads/doctor-profile"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      setLogoPreview(data.url);
      toast.success("Clinic logo uploaded successfully");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(`Error: ${msg}`);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First Name and Surname are required", { position: "top-center" });
      return;
    }
    if (!formData.email.trim() || !formData.phone.trim()) {
      toast.error("Email and Phone Number are required", { position: "top-center" });
      return;
    }
    if (!formData.clinicName.trim()) {
      toast.error("Clinic Name is required", { position: "top-center" });
      return;
    }

    setSaving(true);
    try {
      // 1. Save profile and clinic data
      const profileRes = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...formData,
          profileImage: profileImage !== userObj.profileImage ? profileImage : undefined,
          clinicLogo: logoPreview || undefined
        })
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.message || "Failed to update profile settings.");
      }

      // 2. Advance onboarding step to 1 in DB
      const onboardingRes = await fetch(apiUrl("/api/auth/onboarding-step"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ onboardingStep: 1 })
      });

      const onboardingData = await onboardingRes.json();
      if (!onboardingRes.ok) {
        throw new Error(onboardingData.message || "Failed to save progress.");
      }

      // Update local storage
      // Trim heavy fields to avoid exceeding storage quota
      const { profileImage: _, ...userWithoutProfileImage } = profileData.user;
      const trimmedUser = {
        ...userWithoutProfileImage,
        clinic: {
          ...userWithoutProfileImage.clinic,
          onboardingStep: 1,
          // Exclude large logo if present
          ...(userWithoutProfileImage.clinic?.logo ? { logo: undefined } : {})
        }
      };
      setLocalStorageUser(trimmedUser);

      toast.success("Step 1 completed successfully!", { position: "top-center" });
      setStep(1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving Step 1", { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSchedules(prev =>
      prev.map(s => s.day === day ? { ...s, isActive: !s.isActive } : s)
    );
  };

  const updateTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedules(prev =>
      prev.map(s => s.day === day ? { ...s, [field]: value } : s)
    );
  };

  const handleFinishStep2 = async () => {
    setSaving(true);
    const offDays = schedules.filter(s => !s.isActive).map(s => s.day);

    try {
      // 1. Save clinic schedules
      const timingRes = await fetch(apiUrl("/api/settings/working-days/config"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ schedules, offDays })
      });

      if (!timingRes.ok) {
        const timingData = await timingRes.json().catch(() => ({}));
        throw new Error(timingData.message || "Failed to update clinic timing.");
      }

      // 2. Advance onboarding step to 2 in DB (completed)
      const onboardingRes = await fetch(apiUrl("/api/auth/onboarding-step"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ onboardingStep: 2 })
      });

      const onboardingData = await onboardingRes.json();
      if (!onboardingRes.ok) {
        throw new Error(onboardingData.message || "Failed to save final progress.");
      }

      // Update local storage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const localUser = JSON.parse(userStr);
        localUser.clinic = {
          ...localUser.clinic,
          onboardingStep: 2
        };
        setLocalStorageUser(localUser);
      }

      toast.success("Clinic onboarding completed successfully!", { position: "top-center" });
      onComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while finishing setup", { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ zIndex: 9999, backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)", overflowY: "auto", padding: "20px 0" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: "780px" }}>
        <div className="modal-content border-0" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
          {/* Header - Blue */}
          <div
            className="modal-header d-flex align-items-center justify-content-between py-3 px-4 animate-header"
            style={{ background: "linear-gradient(135deg, #2e37a4, #1e2896)", borderBottom: "none", flexShrink: 0 }}
          >
            <div className="d-flex align-items-center gap-3">
              {/* App Logo */}
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-white"
                style={{ width: "40px", height: "40px", flexShrink: 0 }}
              >
                <img
                  src="/logo-small.png"
                  alt="DocYori"
                  style={{ width: "24px", height: "24px", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<i class="ti ti-building-hospital" style="font-size:20px;color:#2e37a4;"></i>';
                    }
                  }}
                />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: "17px" }}>
                  Complete Your Setup
                </h5>
                <p className="mb-0 fs-12" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {step === 0 ? "Step 1 of 2 — Profile & Clinic Info" : "Step 2 of 2 — Clinic Timings"}
                </p>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="bg-white px-4 py-3 border-bottom" style={{ flexShrink: 0 }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span
                  className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white`}
                  style={{
                    width: "28px", height: "28px", fontSize: "12px",
                    background: "#2e37a4"
                  }}
                >
                  {step === 0 ? "1" : <i className="ti ti-check" style={{ fontSize: "14px" }} />}
                </span>
                <span className="fw-semibold fs-13 text-primary">
                  Profile & Clinic
                </span>
              </div>

              <div className="flex-fill" style={{ height: "2px", backgroundColor: "#e2e8f0", borderRadius: "2px" }}>
                <div
                  style={{
                    width: step >= 1 ? "100%" : "0%",
                    height: "100%",
                    backgroundColor: "#2e37a4",
                    borderRadius: "2px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
                  style={{
                    width: "28px", height: "28px", fontSize: "12px",
                    background: step === 1 ? "#2e37a4" : "#94a3b8"
                  }}
                >
                  2
                </span>
                <span className={`fw-semibold fs-13 ${step === 1 ? "text-primary" : "text-muted"}`}>
                  Timing & Hours
                </span>
              </div>
            </div>
          </div>

          {/* Modal Form/Content (Flexible and scrollable) */}
          {step === 0 ? (
            /* ================= STEP 1 FORM ================= */
            <form onSubmit={handleNextStep1} style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", overflow: "hidden" }}>
              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                {/* ── Admin Profile Section ── */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i className="ti ti-user-circle text-primary" style={{ fontSize: "18px" }} />
                    Admin Profile
                  </h6>
                  <div className="row g-3 align-items-start">
                    {/* Profile Image Upload */}
                    <div className="col-md-3 d-flex flex-column align-items-center">
                      <DoctorProfileUpload
                        value={profileImage}
                        onChange={(url) => setProfileImage(url)}
                      />
                      <span className="text-muted fs-11 mt-1">Profile Photo</span>
                    </div>
                    {/* Profile Fields */}
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="first name"
                            placeholder="First Name *"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="last name"
                            placeholder="Surname (Last Name) *"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="email"
                            fieldLabel="email"
                            placeholder="Email Address *"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="phone"
                            placeholder="Phone Number *"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3" style={{ borderColor: "#e5e7eb" }} />

                {/* ── Clinic Details Section ── */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i className="ti ti-building-hospital text-primary" style={{ fontSize: "18px" }} />
                    Clinic Details
                  </h6>
                  <div className="row g-3 align-items-start">
                    {/* Clinic Logo Upload */}
                    <div className="col-md-3 d-flex flex-column align-items-center">
                      <div
                        className="position-relative d-inline-block"
                        onClick={() => !logoUploading && logoInputRef.current?.click()}
                        style={{ cursor: logoUploading ? "default" : "pointer" }}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle bg-light position-relative overflow-hidden"
                          style={{
                            width: "90px",
                            height: "90px",
                            border: "3px solid #fff",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
                          }}
                        >
                          {logoPreview ? (
                            <>
                              <img
                                src={resolveMediaUrl(logoPreview)}
                                alt="Clinic Logo"
                                className="w-100 h-100"
                                style={{ objectFit: "contain", padding: "8px" }}
                              />
                              <div
                                className="upload-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 opacity-0"
                                style={{ transition: "opacity 0.2s ease" }}
                              >
                                <i className="ti ti-camera fs-24 text-white" />
                              </div>
                            </>
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center w-100 h-100"
                              style={{ backgroundColor: "#f3f4f6" }}
                            >
                              <i className="ti ti-camera-plus" style={{ fontSize: "32px", color: "#6366f1" }} />
                            </div>
                          )}

                          {logoUploading && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                              <span className="spinner-border spinner-border-sm text-white" />
                            </div>
                          )}
                        </div>
                        <input
                          ref={logoInputRef}
                          type="file"
                          style={{ display: "none" }}
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={logoUploading}
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
                      </div>
                      <span className="text-muted fs-11 mt-2">Clinic Logo</span>
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
                            handleLogoUpload(croppedFile);
                          }}
                          title="Crop Clinic Logo"
                          fileName={logoCropFileName}
                        />
                      )}
                    </div>

                    {/* Clinic Fields */}
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="company"
                            placeholder="Clinic Name *"
                            value={formData.clinicName}
                            onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            placeholder="GST Number"
                            value={formData.gstNo}
                            onChange={e => setFormData({ ...formData, gstNo: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="address 1"
                            placeholder="Address Line 1"
                            value={formData.addressLine1}
                            onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <IconFormControl
                            type="text"
                            fieldLabel="address 2"
                            placeholder="Address Line 2"
                            value={formData.addressLine2}
                            onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Location Row ── */}
                <div className="row g-3 mt-1">
                  <div className="col-md-3">
                    <IconSelect
                      fieldLabel="country"
                      options={Country}
                      className="select"
                      placeholder="Select Country"
                      value={formData.country ? Country.find(c => c.value === formData.country) || null : null}
                      onChange={(opt) => setFormData({ ...formData, country: opt?.value || "" })}
                    />
                  </div>
                  <div className="col-md-3">
                    <IconSelect
                      fieldLabel="state"
                      options={State}
                      className="select"
                      placeholder="Select State"
                      value={formData.state ? State.find(s => s.value === formData.state) || null : null}
                      onChange={(opt) => setFormData({ ...formData, state: opt?.value || "" })}
                    />
                  </div>
                  <div className="col-md-3">
                    <IconSelect
                      fieldLabel="city"
                      options={City}
                      className="select"
                      placeholder="Select City"
                      value={formData.city ? City.find(c => c.value === formData.city) || null : null}
                      onChange={(opt) => setFormData({ ...formData, city: opt?.value || "" })}
                    />
                  </div>
                  <div className="col-md-3">
                    <IconFormControl
                      type="text"
                      fieldLabel="pincode"
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-3 border-top bg-light d-flex justify-content-end gap-2" style={{ flexShrink: 0 }}>
                <button type="submit" className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next Step <i className="ti ti-arrow-right" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= STEP 2 FORM ================= */
            <div style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", overflow: "hidden" }}>
              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                <div className="alert border-0 d-flex align-items-center gap-2 mb-4" style={{ backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "10px" }}>
                  <i className="ti ti-info-circle fs-18" />
                  <span className="fs-13">Configure the days and timing slots during which your clinic is open. Patients can book slots during these timings.</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-nowrap align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-3 py-3 fw-semibold fs-13">Day</th>
                        <th className="py-3 fw-semibold fs-13">Status</th>
                        <th className="py-3 fw-semibold fs-13">Opening Time</th>
                        <th className="py-3 fw-semibold fs-13">Closing Time</th>
                        <th className="pe-3 text-end py-3 fw-semibold fs-13">Toggle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s.day} style={{ backgroundColor: !s.isActive ? "#f8fafc" : "transparent" }}>
                          <td className="ps-3">
                            <span className="fw-semibold text-dark fs-13">{daysName[s.day]}</span>
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-3 py-2 ${s.isActive ? "bg-primary-light text-primary" : "bg-danger-light text-danger"}`}>
                              {s.isActive ? "WORKING" : "CLOSED"}
                            </span>
                          </td>
                          <td>
                            {s.isActive ? (
                              <TimePicker
                                format="HH:mm"
                                className="w-100"
                                size="small"
                                value={dayjs(s.startTime, "HH:mm")}
                                onChange={(t) => updateTime(s.day, "startTime", t?.format("HH:mm") || "09:00")}
                                allowClear={false}
                              />
                            ) : (
                              <span className="text-muted">--:--</span>
                            )}
                          </td>
                          <td>
                            {s.isActive ? (
                              <TimePicker
                                format="HH:mm"
                                className="w-100"
                                size="small"
                                value={dayjs(s.endTime, "HH:mm")}
                                onChange={(t) => updateTime(s.day, "endTime", t?.format("HH:mm") || "18:00")}
                                allowClear={false}
                              />
                            ) : (
                              <span className="text-muted">--:--</span>
                            )}
                          </td>
                          <td className="pe-3 text-end">
                            <div className="form-check form-switch d-inline-block m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={s.isActive}
                                onChange={() => toggleDay(s.day)}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-3 border-top bg-light d-flex justify-content-between gap-2" style={{ flexShrink: 0 }}>
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(0)}>
                  <i className="ti ti-arrow-left me-2" /> Back
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4 text-white d-flex align-items-center gap-2"
                    onClick={handleFinishStep2}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup <span>🎉</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .bg-success-light { background-color: rgba(16,185,129,0.12); }
        .bg-primary-light { background-color: rgba(46,55,164,0.12); }
        .bg-danger-light { background-color: rgba(239,68,68,0.12); }
        .upload-overlay { transition: opacity 0.2s ease; }
        .position-relative:hover .upload-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;
