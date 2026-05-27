import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import TagInput from "../../../../../core/common/Taginput";
import { useState, useEffect } from "react";
import DuplicateForms, {
  cloneScheduleRows,
} from "../../../../../core/common/duplicate-forms/duplicateForms";
import EducationForms from "../../../../../core/common/duplicate-forms/educationForm";
import RewardsForms from "../../../../../core/common/duplicate-forms/rewardsForm";
import { all_routes } from "../../../../routes/all_routes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { apiUrl } from "../../../../../core/config/api";
import {
  Blood_Group,
  City,
  Country,
  Appointment_Type,
  Gender,
  State,
} from "../../../../../core/common/selectOption";
import type { Dayjs } from "dayjs";
import type { RowType } from "../../../../../core/common/duplicate-forms/duplicateForms.types";
import type { AwardEntry, EducationEntry } from "../../../../../core/types/doctorProfile";
import {
  serializeAwards,
  serializeEducations,
} from "../../../../../core/utils/doctorProfile";
import DoctorProfileUpload from "../../../../../core/common/doctor-profile-upload/DoctorProfileUpload";
import {
  findSelectOption,
  parseSchedulesFromApi,
  toAwardEntries,
  toEducationEntries,
} from "../../../../../core/utils/doctorSchedule";

interface DoctorFormPageProps {
  mode: "add" | "edit";
  doctorId?: string;
}

interface Dept {
  id: string;
  name: string;
}
interface Desig {
  id: string;
  name: string;
  departmentId: string | null;
  status?: string;
}

const isValidDoctorId = (id?: string) => !!id && id !== ":id" && !id.includes(":");

const DoctorFormPage = ({ mode, doctorId }: DoctorFormPageProps) => {
  const navigate = useNavigate();
  const isEdit = mode === "edit" && isValidDoctorId(doctorId);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  // ── Dynamic dropdown data ──────────────────────────────────────
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [allDesignations, setAllDesignations] = useState<Desig[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<Desig[]>([]);
  const [specializations, setSpecializations] = useState<{ id: string; name: string }[]>([]);

  // ── Form state ─────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [yearOfExperience, setYearOfExperience] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [tags, setTags] = useState<string[]>(["English"]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("About Doctor");
  const [featureOnWebsite, setFeatureOnWebsite] = useState(false);

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");

  // Appointment
  const [acceptingAppointments, setAcceptingAppointments] = useState(true);
  const [appointmentType, setAppointmentType] = useState("");
  const [acceptBookingsInAdvance, setAcceptBookingsInAdvance] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("");
  const [consultationCharge, setConsultationCharge] = useState("");
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState("");
  const [displayOnBookingPage, setDisplayOnBookingPage] = useState(false);

  // Schedule
  const WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ] as const;
  const [schedules, setSchedules] = useState<Record<string, RowType[]>>({});
  const [activeScheduleDay, setActiveScheduleDay] = useState<string>("Monday");
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [scheduleApplyMsg, setScheduleApplyMsg] = useState("");

  const [educations, setEducations] = useState<EducationEntry[]>([]);
  const [awards, setAwards] = useState<AwardEntry[]>([]);
  const [certifications, setCertifications] = useState<AwardEntry[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(!isEdit);
  const [loadingDoctor, setLoadingDoctor] = useState(isEdit);
  const [educationKey, setEducationKey] = useState(0);
  const [awardsKey, setAwardsKey] = useState(0);
  const [certsKey, setCertsKey] = useState(0);

  const serializeSchedules = (raw: Record<string, RowType[]>) => {
    const out: Record<string, { session: string; from: string; to: string }[]> = {};
    for (const [day, rows] of Object.entries(raw)) {
      if (!rows?.length) continue;
      out[day] = rows.map((r) => ({
        session: r.session,
        from: r.from?.format?.("HH:mm:ss") ?? "00:00:00",
        to: r.to?.format?.("HH:mm:ss") ?? "00:00:00",
      }));
    }
    return Object.keys(out).length ? out : null;
  };

  const handleApplyAllSchedule = (e: React.MouseEvent) => {
    e.preventDefault();
    const source = schedules[activeScheduleDay];
    if (!source?.length) {
      setScheduleApplyMsg("Pehle is din ka session set karo, phir Apply All dabao.");
      return;
    }
    const next: Record<string, RowType[]> = {};
    WEEKDAYS.forEach((day) => {
      next[day] = cloneScheduleRows(source);
    });
    setSchedules(next);
    setScheduleVersion((v) => v + 1);
    setScheduleApplyMsg(`"${activeScheduleDay}" ka schedule saat dinon par apply ho gaya.`);
    setTimeout(() => setScheduleApplyMsg(""), 4000);
  };

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Load doctor for edit ─────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !isValidDoctorId(doctorId)) return;

    const token = localStorage.getItem("token");
    setLoadingDoctor(true);
    fetch(apiUrl(`/api/doctors/${doctorId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Doctor not found");
        }
        return res.json();
      })
      .then((d) => {
        setFullName(d.fullName || "");
        setUsername(d.username || "");
        setPhone(d.phone || undefined);
        setEmail(d.email || "");
        setDob(d.dob ? dayjs(d.dob) : null);
        setYearOfExperience(
          d.yearOfExperience != null ? String(d.yearOfExperience) : ""
        );
        setDepartmentId(d.departmentId || "");
        setDesignationId(d.designationId || "");
        setSpecializationId(d.specializationId || "");
        setMedicalLicenseNumber(d.medicalLicenseNumber || "");
        setTags(
          Array.isArray(d.languagesSpoken) && d.languagesSpoken.length
            ? d.languagesSpoken
            : ["English"]
        );
        setBloodGroup(d.bloodGroup || "");
        setGender(d.gender || "");
        setBio(d.bio || "");
        setFeatureOnWebsite(!!d.featureOnWebsite);
        setProfileImage(d.profileImage || null);
        setAddress1(d.address1 || "");
        setAddress2(d.address2 || "");
        setCountry(d.country || "");
        setCity(d.city || "");
        setStateVal(d.state || "");
        setPincode(d.pincode || "");
        setAcceptingAppointments(!!d.appointmentType || !!d.consultationCharge);
        setAppointmentType(d.appointmentType || "");
        setAcceptBookingsInAdvance(
          d.acceptBookingsInAdvance != null
            ? String(d.acceptBookingsInAdvance)
            : ""
        );
        setAppointmentDuration(
          d.appointmentDuration != null ? String(d.appointmentDuration) : ""
        );
        setConsultationCharge(
          d.consultationCharge != null ? String(d.consultationCharge) : ""
        );
        setMaxBookingsPerSlot(
          d.maxBookingsPerSlot != null ? String(d.maxBookingsPerSlot) : ""
        );
        setDisplayOnBookingPage(!!d.displayOnBookingPage);
        setSchedules(
          parseSchedulesFromApi(
            d.schedules as Record<string, { session?: string; from: string; to: string }[]>
          )
        );
        setScheduleVersion((v) => v + 1);
        const edu = toEducationEntries(d.educations);
        const aw = toAwardEntries(d.awards);
        const cert = toAwardEntries(d.certifications);
        if (edu.length) setEducations(edu);
        if (aw.length) setAwards(aw);
        if (cert.length) setCertifications(cert);
        setEducationKey((k) => k + 1);
        setAwardsKey((k) => k + 1);
        setCertsKey((k) => k + 1);
        setFormReady(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingDoctor(false));
  }, [isEdit, doctorId]);

  // ── Fetch departments on mount ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/departments"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Dept[]) => {
        const active = data.filter ? data.filter((d: any) => d.status === "Active") : data;
        setDepartments(active);
      })
      .catch(console.error);

    fetch(apiUrl("/api/designations"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Desig[]) => {
        setAllDesignations(data);
      })
      .catch(console.error);

    fetch(apiUrl("/api/specializations"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        setSpecializations(data.filter((d) => d.status === "Active"));
      })
      .catch(console.error);
  }, []);

  // ── Filter designations when department changes ────────────────
  useEffect(() => {
    if (!departmentId) {
      setFilteredDesignations([]);
      return;
    }

    setFilteredDesignations(
      allDesignations.filter(
        (d) =>
          d.departmentId === departmentId &&
          (d.status === "Active" || d.status === undefined)
      )
    );
  }, [departmentId, allDesignations]);

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const desigOptions = filteredDesignations.map((d) => ({ value: d.id, label: d.name }));
  const specOptions = specializations.map((d) => ({ value: d.id, label: d.name }));

  const selectedDeptOption =
    deptOptions.find((o) => o.value === departmentId) ?? null;
  const selectedDesigOption =
    desigOptions.find((o) => o.value === designationId) ?? null;
  const selectedSpecOption =
    specOptions.find((o) => o.value === specializationId) ?? null;

  const handleDepartmentChange = (opt: { value: string; label: string } | null) => {
    setDepartmentId(opt?.value || "");
    setDesignationId("");
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Doctor name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        fullName,
        username,
        phone,
        email,
        dob: dob ? dob.toISOString() : null,
        yearOfExperience,
        departmentId,
        designationId,
        specializationId,
        medicalLicenseNumber,
        languagesSpoken: tags,
        bloodGroup,
        gender,
        bio,
        featureOnWebsite,
        profileImage: profileImage || null,
        address1,
        address2,
        country,
        city,
        state: stateVal,
        pincode,
        appointmentType: acceptingAppointments ? appointmentType : null,
        acceptBookingsInAdvance: acceptingAppointments ? acceptBookingsInAdvance : null,
        appointmentDuration: acceptingAppointments ? appointmentDuration : null,
        consultationCharge: acceptingAppointments ? consultationCharge : null,
        maxBookingsPerSlot: acceptingAppointments ? maxBookingsPerSlot : null,
        displayOnBookingPage: acceptingAppointments ? displayOnBookingPage : false,
        schedules: serializeSchedules(schedules),
        educations: serializeEducations(educations),
        awards: serializeAwards(awards),
        certifications: serializeAwards(certifications),
      };

      const res = await fetch(
        apiUrl(isEdit ? `/api/doctors/${doctorId}` : "/api/doctors"),
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.message || (isEdit ? "Failed to update doctor" : "Failed to add doctor")
        );
      }

      setSuccess(true);
      setTimeout(() => navigate(all_routes.doctors), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 mb-0">Loading doctor…</p>
        </div>
      </div>
    );
  }

  if (isEdit && !formReady && error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Link to={all_routes.doctors} className="btn btn-light mb-3">
            Back to Doctors
          </Link>
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              {/* Page Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.doctors}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Doctor
                    </Link>
                  </h6>
                </div>
              </div>

              {/* Error / Success alerts */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                  <i className="ti ti-alert-circle" />
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <i className="ti ti-circle-check" />
                  {isEdit
                    ? "Doctor updated successfully! Redirecting…"
                    : "Doctor added successfully! Redirecting…"}
                </div>
              )}

              <div className="card">
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold">
                      {isEdit ? "Edit Doctor" : "New Doctor"}
                    </h5>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* ── Contact Information ───────────────── */}
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Contact Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        {/* Profile Image */}
                        <div className="col-lg-12">
                          <div className="mb-3 d-flex align-items-center">
                            <label className="form-label">Profile Image</label>
                            <DoctorProfileUpload
                              value={profileImage}
                              onChange={setProfileImage}
                            />
                          </div>
                        </div>

                        {/* Name + Username */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Name <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  placeholder="Dr. Full Name"
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Username <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="username"
                                />
                              </div>
                            </div>

                            {/* Phone + Email */}
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Phone Number <span className="text-danger">*</span>
                                </label>
                                <PhoneInput
                                  defaultCountry="US"
                                  value={phone}
                                  onChange={setPhone}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Email Address <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="doctor@clinic.com"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* DOB + Experience */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  DOB <span className="text-danger">*</span>
                                </label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format={{ format: "DD-MM-YYYY", type: "mask" }}
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    suffixIcon={null}
                                    value={dob}
                                    onChange={(d) => setDob(d)}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Year Of Experience <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={yearOfExperience}
                                  onChange={(e) => setYearOfExperience(e.target.value)}
                                  placeholder="e.g. 5"
                                  min={0}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Department + Designation (from DB) */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Department <span className="text-danger ms-1">*</span>
                                </label>
                                {deptOptions.length > 0 ? (
                                  <CommonSelect
                                    options={deptOptions}
                                    className="select"
                                    value={selectedDeptOption}
                                    placeholder="Select department"
                                    onChange={handleDepartmentChange}
                                  />
                                ) : (
                                  <div className="form-control text-muted d-flex align-items-center gap-2">
                                    <span
                                      className="spinner-border spinner-border-sm"
                                      role="status"
                                    />
                                    Loading departments…
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Designation <span className="text-danger ms-1">*</span>
                                </label>
                                {departmentId && desigOptions.length > 0 ? (
                                  <CommonSelect
                                    key={departmentId}
                                    options={desigOptions}
                                    className="select"
                                    value={selectedDesigOption}
                                    placeholder="Select designation"
                                    onChange={(opt: any) => setDesignationId(opt?.value || "")}
                                  />
                                ) : (
                                  <div className="form-control text-muted py-2">
                                    {!departmentId
                                      ? "Select a department first"
                                      : "No designations for this department — add one in Designation settings"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Specialization */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Specialization</label>
                                {specOptions.length > 0 ? (
                                  <CommonSelect
                                    options={specOptions}
                                    className="select"
                                    value={selectedSpecOption}
                                    placeholder="Select specialization"
                                    onChange={(opt: any) => setSpecializationId(opt?.value || "")}
                                  />
                                ) : (
                                  <div className="form-control text-muted py-2">
                                    No specializations available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* License + Languages */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Medical License Number <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={medicalLicenseNumber}
                                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                                  placeholder="ML-123456"
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Language Spoken</label>
                                <TagInput
                                  key={`tags-${educationKey}`}
                                  initialTags={tags}
                                  onTagsChange={setTags}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Blood Group + Gender */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Blood Group <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Blood_Group}
                                  className="select"
                                  value={
                                    findSelectOption(Blood_Group, bloodGroup) ||
                                    Blood_Group[0]
                                  }
                                  onChange={(opt: any) => setBloodGroup(opt?.value || "")}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Gender <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  options={Gender}
                                  className="select"
                                  value={findSelectOption(Gender, gender) || Gender[0]}
                                  onChange={(opt: any) => setGender(opt?.value || "")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bio + Feature on website toggle */}
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Bio</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                            />
                          </div>
                          <div className="form-check form-switch mb-3">
                            <label className="form-check-label" htmlFor="featureOnWebsite">
                              Feature On Website
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="featureOnWebsite"
                              checked={featureOnWebsite}
                              onChange={(e) => setFeatureOnWebsite(e.target.checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Address Information ───────────────── */}
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Address Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Address 1</label>
                            <input
                              type="text"
                              className="form-control"
                              value={address1}
                              onChange={(e) => setAddress1(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Address 2</label>
                            <input
                              type="text"
                              className="form-control"
                              value={address2}
                              onChange={(e) => setAddress2(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Country</label>
                            <CommonSelect
                              options={Country}
                              className="select"
                              value={findSelectOption(Country, country) || Country[0]}
                              onChange={(opt: any) => setCountry(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">City</label>
                            <CommonSelect
                              options={City}
                              className="select"
                              value={findSelectOption(City, city) || City[0]}
                              onChange={(opt: any) => setCity(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">State</label>
                            <CommonSelect
                              options={State}
                              className="select"
                              value={findSelectOption(State, stateVal) || State[0]}
                              onChange={(opt: any) => setStateVal(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">Pincode</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Schedule ─────────────────────────── */}
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Schedule</h6>
                    </div>
                    <div className="p-3">
                      <ul className="nav nav-pills schedule-tab mb-3" id="pills-tab" role="tablist">
                        {WEEKDAYS.map((day, i) => (
                          <li key={day} className="nav-item me-1" role="presentation">
                            <button
                              className={`nav-link btn btn-sm btn-icon p-2 d-flex align-items-center justify-content-center w-auto${activeScheduleDay === day ? " active" : ""
                                }`}
                              data-bs-toggle="pill"
                              data-bs-target={`#schedule-${i + 1}`}
                              type="button"
                              role="tab"
                              aria-selected={activeScheduleDay === day}
                              onClick={() => setActiveScheduleDay(day)}
                            >
                              {day}
                            </button>
                          </li>
                        )
                        )}
                      </ul>
                      <div className="tab-content" id="pills-tabContent">
                        {WEEKDAYS.map((day, i) => (
                          <div
                            key={day}
                            className={`tab-pane fade${activeScheduleDay === day ? " active show" : ""
                              }`}
                            id={`schedule-${i + 1}`}
                            role="tabpanel"
                          >
                            <div className="add-schedule-list">
                              <DuplicateForms
                                key={`${day}-${scheduleVersion}`}
                                initialRows={schedules[day]}
                                onChange={(rows) =>
                                  setSchedules((prev) => ({ ...prev, [day]: rows }))
                                }
                              />
                            </div>
                          </div>
                        )
                        )}
                      </div>
                      <div className="mb-3 d-flex align-items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-dark"
                          onClick={handleApplyAllSchedule}
                        >
                          Apply All
                        </button>
                        {scheduleApplyMsg && (
                          <span className="text-success fs-13">{scheduleApplyMsg}</span>
                        )}
                        <span className="text-muted fs-12">
                          Active day: <strong>{activeScheduleDay}</strong> — isi din ka time sab
                          par copy hoga
                        </span>
                      </div>
                    </div>

                    {/* ── Appointment Information ───────────── */}
                    <div className="bg-light px-3 py-2 mb-3 d-flex align-items-center justify-content-between">
                      <h6 className="fw-bold mb-0">Appointment Information</h6>
                      <div className="form-check form-switch m-0">
                        <label className="form-check-label me-5 mt-1" htmlFor="acceptAppointments">
                          Accept Appointments?
                        </label>
                        <input
                          className="form-check-input mt-2"
                          type="checkbox"
                          role="switch"
                          id="acceptAppointments"
                          checked={acceptingAppointments}
                          onChange={(e) => setAcceptingAppointments(e.target.checked)}
                        />
                      </div>
                    </div>
                    {acceptingAppointments && (
                      <div className="pb-0">
                        <div className="row">
                          {/* Appointment Type */}
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label className="form-label">Appointment Type</label>
                              <CommonSelect
                                options={Appointment_Type}
                                className="select"
                                value={
                                  findSelectOption(Appointment_Type, appointmentType) ||
                                  Appointment_Type[0]
                                }
                                onChange={(opt: any) => setAppointmentType(opt?.value || "")}
                              />
                            </div>
                          </div>
                          <div className="col-lg-6" />

                          {/* Accept bookings in advance */}
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label className="form-label">Accept bookings (in Advance)</label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  min={0}
                                  value={acceptBookingsInAdvance}
                                  onChange={(e) => setAcceptBookingsInAdvance(e.target.value)}
                                  placeholder="0"
                                />
                                <span className="input-group-text bg-transparent text-dark fs-14">Days</span>
                              </div>
                            </div>
                          </div>

                          {/* Appointment Duration */}
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label className="form-label">Appointment Duration</label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  min={0}
                                  value={appointmentDuration}
                                  onChange={(e) => setAppointmentDuration(e.target.value)}
                                  placeholder="30"
                                />
                                <span className="input-group-text bg-transparent text-dark fs-14">Mins</span>
                              </div>
                            </div>
                          </div>

                          {/* Consultation Charge */}
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label className="form-label">Consultation Charge</label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  min={0}
                                  step="0.01"
                                  value={consultationCharge}
                                  onChange={(e) => setConsultationCharge(e.target.value)}
                                  placeholder="0.00"
                                />
                                <span className="input-group-text bg-transparent text-dark fs-14">$</span>
                              </div>
                            </div>
                          </div>

                          {/* Max Bookings Per Slot */}
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label className="form-label">Max Bookings Per Slot</label>
                              <input
                                type="number"
                                className="form-control"
                                min={1}
                                value={maxBookingsPerSlot}
                                onChange={(e) => setMaxBookingsPerSlot(e.target.value)}
                                placeholder="1"
                              />
                            </div>
                          </div>

                          {/* Display on Booking Page toggle */}
                          <div className="col-md-6">
                            <div className="form-check form-switch mb-3">
                              <label className="form-check-label" htmlFor="displayOnBookingPage">
                                Display on Booking Page
                              </label>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="displayOnBookingPage"
                                checked={displayOnBookingPage}
                                onChange={(e) => setDisplayOnBookingPage(e.target.checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Educational Information ───────────── */}
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Educational Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="add-education-list">
                        <EducationForms
                          key={`edu-${educationKey}`}
                          initialRows={educations.length ? educations : undefined}
                          onChange={setEducations}
                        />
                      </div>
                    </div>

                    {/* ── Awards & Recognition ─────────────── */}
                    <div className="bg-light px-3 py-2 mb-3">
                      <h6 className="fw-bold mb-0">Awards &amp; Recognition</h6>
                    </div>
                    <div className="pb-0">
                      <div className="add-award-list">
                        <RewardsForms
                          key={`aw-${awardsKey}`}
                          initialRows={awards.length ? awards : undefined}
                          onChange={setAwards}
                        />
                      </div>
                    </div>

                    {/* ── Certifications ───────────────────── */}
                    <div className="bg-light px-3 py-2">
                      <h6 className="fw-bold mb-0">Certifications</h6>
                    </div>
                    <div className="pb-3 mb-3 border-bottom">
                      <div className="add-certification-list">
                        <RewardsForms
                          key={`cert-${certsKey}`}
                          initialRows={certifications.length ? certifications : undefined}
                          onChange={setCertifications}
                        />
                      </div>
                    </div>

                    {/* ── Actions ──────────────────────────── */}
                    <div className="d-flex justify-content-end gap-2">
                      <Link to={all_routes.doctors} className="btn btn-light btm-md">
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btm-md d-flex align-items-center gap-2"
                        disabled={submitting}
                      >
                        {submitting && (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        )}
                        {submitting
                          ? "Saving…"
                          : isEdit
                            ? "Save Changes"
                            : "Add Doctor"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©{" "}
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default DoctorFormPage;
