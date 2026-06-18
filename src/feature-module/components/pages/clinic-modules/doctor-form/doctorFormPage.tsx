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
import { toast } from "react-toastify";
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

  // -- Dynamic dropdown data --------------------------------------
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(true);
  const [allDesignations, setAllDesignations] = useState<Desig[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<Desig[]>([]);
  const [specializations, setSpecializations] = useState<{ id: string; name: string }[]>([]);

  // -- Form state -------------------------------------------------
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [yearOfExperience, setYearOfExperience] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [qualification, setQualification] = useState("");
  const [tags, setTags] = useState<string[]>(["English"]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("About Doctor");
  const [featureOnWebsite, setFeatureOnWebsite] = useState(false);

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("India");
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
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpValidityDays, setFollowUpValidityDays] = useState("");
  const [freeFollowUpLimit, setFreeFollowUpLimit] = useState("");
  const [followUpFee, setFollowUpFee] = useState("");

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
  const [schedules, setSchedules] = useState<Record<string, RowType[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [lockedDays, setLockedDays] = useState<Record<string, boolean>>({});
  const [activeScheduleDay, setActiveScheduleDay] = useState<string>("Monday");

  const [educations, setEducations] = useState<EducationEntry[]>([]);
  const [awards, setAwards] = useState<AwardEntry[]>([]);
  const [certifications, setCertifications] = useState<AwardEntry[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [medicalRegCertificate, setMedicalRegCertificate] = useState<string | null>(null);
  const [qualificationCertificate, setQualificationCertificate] = useState<string | null>(null);
  const [aadhaarCard, setAadhaarCard] = useState<string | null>(null);
  const [aadhaarCardBack, setAadhaarCardBack] = useState<string | null>(null);
  const [panCard, setPanCard] = useState<string | null>(null);
  const [status, setStatus] = useState("Active");

  const [formReady, setFormReady] = useState(!isEdit);
  const [loadingDoctor, setLoadingDoctor] = useState(isEdit);
  const [educationKey, setEducationKey] = useState(0);
  const [awardsKey, setAwardsKey] = useState(0);
  const [certsKey, setCertsKey] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [showCertifications, setShowCertifications] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

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


  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quick Add State
  const [showQuickAddDeptModal, setShowQuickAddDeptModal] = useState(false);
  const [quickDeptName, setQuickDeptName] = useState("");
  const [quickDeptDesc, setQuickDeptDesc] = useState("");
  const [isSubmittingQuickDept, setIsSubmittingQuickDept] = useState(false);

  const [showQuickAddDesigModal, setShowQuickAddDesigModal] = useState(false);
  const [quickDesigName, setQuickDesigName] = useState("");
  const [quickDesigDeptId, setQuickDesigDeptId] = useState("");
  const [isSubmittingQuickDesig, setIsSubmittingQuickDesig] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [initialUsername, setInitialUsername] = useState("");
  const [usernameWarning, setUsernameWarning] = useState<string | null>(null);

  // -- Username Availability Check -------------------------------
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    // Validation for spaces and special characters - show error instead of auto-correcting
    const hasSpace = /\s/.test(username);
    const hasInvalid = /[^a-zA-Z0-9_]/.test(username); // Allow A-Z for typing, but we'll likely lowercase on submit or show warning

    if (hasSpace) {
      setUsernameWarning("Spaces are not allowed in username.");
      setUsernameStatus("idle");
      return;
    }

    if (hasInvalid) {
      setUsernameWarning("Special characters are not allowed.");
      setUsernameStatus("idle");
      return;
    }

    setUsernameWarning(null);

    // If editing and username matches original, it's available
    if (isEdit && username === initialUsername) {
      setUsernameStatus("available");
      return;
    }

    const check = async () => {
      setUsernameStatus("checking");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/auth/check-username?username=${username.toLowerCase().trim()}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("taken");
        }
      } catch (err) {
        console.error("Username check failed", err);
        setUsernameStatus("idle");
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [username, isEdit, initialUsername]);

  // -- Load doctor for edit -----------------------------------------
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
        setInitialUsername(d.username || "");
        setPhone(d.phone || undefined);
        setEmail(d.email || "");
        setDob(d.dob ? dayjs(d.dob) : null);
        setYearOfExperience(
          d.yearOfExperience != null ? String(d.yearOfExperience) : ""
        );
        setDepartmentId(d.departmentId || "");
        setDesignationId(d.designationId || "");
        setSelectedSpecializations(
          Array.isArray(d.specializations)
            ? d.specializations.map((s: any) => s.id)
            : []
        );
        setMedicalLicenseNumber(d.medicalLicenseNumber || "");
        setAlternateMobile(d.alternateMobile || "");
        setMaritalStatus(d.maritalStatus || "");
        setQualification(d.qualification || "");
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
        setSignatureImage(d.signatureImage || null);
        setMedicalRegCertificate(d.medicalRegCertificate || null);
        setQualificationCertificate(d.qualificationCertificate || null);
        setAadhaarCard(d.aadhaarCard || null);
        setAadhaarCardBack(d.aadhaarCardBack || null);
        setPanCard(d.panCard || null);
        setStatus(d.status || "Active");
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
        setFollowUpEnabled(!!d.followUpEnabled);
        setFollowUpValidityDays(
          d.followUpValidityDays != null ? String(d.followUpValidityDays) : ""
        );
        setFreeFollowUpLimit(
          d.freeFollowUpLimit != null ? String(d.freeFollowUpLimit) : ""
        );
        setFollowUpFee(
          d.followUpFee != null ? String(d.followUpFee) : ""
        );
        const parsedSchedules = parseSchedulesFromApi(
          d.schedules as Record<string, { session?: string; from: string; to: string }[]>
        );
        setSchedules(parsedSchedules);

        // Auto-lock days that have schedules
        const loadedLockedDays: Record<string, boolean> = {};
        Object.keys(parsedSchedules).forEach(day => {
          if (parsedSchedules[day] && parsedSchedules[day].length > 0) {
            loadedLockedDays[day] = true;
          }
        });
        setLockedDays(loadedLockedDays);
        const edu = toEducationEntries(d.educations);
        const aw = toAwardEntries(d.awards);
        const cert = toAwardEntries(d.certifications);
        if (edu.length) {
          setEducations(edu);
          setShowEducation(true);
        }
        if (aw.length) {
          setAwards(aw);
          setShowAwards(true);
        }
        if (cert.length) {
          setCertifications(cert);
          setShowCertifications(true);
        }
        if (
          d.signatureImage ||
          d.medicalRegCertificate ||
          d.qualificationCertificate ||
          d.aadhaarCard ||
          d.aadhaarCardBack ||
          d.panCard
        ) {
          setShowDocuments(true);
        }
        setEducationKey((k) => k + 1);
        setAwardsKey((k) => k + 1);
        setCertsKey((k) => k + 1);
        setFormReady(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingDoctor(false));
  }, [isEdit, doctorId]);

  // -- Phone Duplicate Check --------------------------------------
  useEffect(() => {
    if (!phone || phone.length < 5) {
      setPhoneWarning(null);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/doctors?search=${phone}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const isDuplicate = isEdit
            ? data.some((d: any) => d.id !== doctorId && d.phone === phone)
            : data.some((d: any) => d.phone === phone);
          if (isDuplicate) {
            setPhoneWarning("Warning: This phone number is already registered for another doctor.");
          } else {
            setPhoneWarning(null);
          }
        } else {
          setPhoneWarning(null);
        }
      })
      .catch(() => setPhoneWarning(null));
  }, [phone, isEdit, doctorId]);

  // -- Fetch departments on mount ---------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/departments"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.filter((d: any) => d.status === "Active");
          setDepartments(active);
        } else {
          console.error("Departments API returned non-array:", data);
          setDepartments([]);
        }
      })
      .catch((err) => {
        console.error("Dept fetch error:", err);
        setDepartments([]);
      })
      .finally(() => setIsLoadingDepartments(false));

    fetch(apiUrl("/api/designations"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllDesignations(data);
        } else {
          setAllDesignations([]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingDesignations(false));

    fetch(apiUrl("/api/specializations"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        setSpecializations(data.filter((d) => d.status === "Active"));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isEdit && !isLoadingDepartments && !isLoadingDesignations) {
      if (departments.length === 0 || allDesignations.length === 0) {
        const msg = departments.length === 0
          ? "To add a doctor, you need to first add at least one Department in the system."
          : "To add a doctor, you need to first add at least one Designation in the system.";
        setError(msg);
        setShowErrorModal(true);
      }
    }
  }, [isEdit, isLoadingDepartments, isLoadingDesignations, departments, allDesignations]);

  // -- Filter designations when department changes ----------------
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
  const specOptions = specializations.map((d: any) => ({ value: d.id, label: d.name }));

  const selectedDeptOption =
    deptOptions.find((o) => o.value === departmentId) ?? null;
  const selectedDesigOption =
    desigOptions.find((o) => o.value === designationId) ?? null;

  const handleDepartmentChange = (opt: { value: string; label: string } | null) => {
    setDepartmentId(opt?.value || "");
    setDesignationId("");
  };

  // -- Submit -----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      toast.error("Doctor name is required.");
      return;
    }

    if (usernameStatus === "taken") {
      toast.error("Username is already taken. Please choose another.");
      return;
    }

    if (usernameStatus === "checking") {
      toast.error("Checking username availability. Please wait...");
      return;
    }

    if (departments.length === 0 || allDesignations.length === 0) {
      const msg = "To add a doctor, you need to first add at least one Department and one Designation in the system.";
      toast.error(msg);
      return;
    }

    if (!departmentId) {
      toast.error("Please select a Department.");
      return;
    }

    if (!designationId) {
      toast.error("Please select a Designation.");
      return;
    }

    if (dob) {
      const age = dayjs().diff(dob, "year");
      if (age < 18) {
        toast.error("Doctor must be at least 18 years old.");
        return;
      }
    }

    if (!address1.trim()) {
      toast.error("Address 1 involves house/street details and is required.");
      return;
    }
    if (!city || city === "Select") {
      toast.error("Please select a city.");
      return;
    }
    if (!stateVal || stateVal === "Select") {
      toast.error("Please select a state.");
      return;
    }
    if (!pincode.trim()) {
      toast.error("Pincode is required.");
      return;
    }

    // Filter schedules: only send locked days
    const activeSchedules: Record<string, RowType[]> = {};
    Object.keys(lockedDays).forEach((day) => {
      if (lockedDays[day]) {
        // If locked but empty, it might be the default row that hasn't been "changed" yet
        // In reality, DuplicateForms should have data if we initialized it correctly
        if (schedules[day]?.length > 0) {
          activeSchedules[day] = schedules[day];
        }
      }
    });

    if (Object.keys(activeSchedules).length === 0) {
      toast.error("Please save and lock at least one day in the schedule.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        fullName,
        username: username.toLowerCase().trim(),
        phone,
        email,
        dob: dob ? dob.toISOString() : null,
        yearOfExperience,
        departmentId,
        designationId,
        specializations: selectedSpecializations,
        medicalLicenseNumber,
        alternateMobile,
        maritalStatus,
        qualification,
        languagesSpoken: tags,
        bloodGroup,
        gender,
        bio,
        profileImage: profileImage || null,
        signatureImage: showDocuments ? (signatureImage || null) : null,
        medicalRegCertificate: showDocuments ? (medicalRegCertificate || null) : null,
        qualificationCertificate: showDocuments ? (qualificationCertificate || null) : null,
        aadhaarCard: showDocuments ? (aadhaarCard || null) : null,
        aadhaarCardBack: showDocuments ? (aadhaarCardBack || null) : null,
        panCard: showDocuments ? (panCard || null) : null,
        status: status,
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
        followUpEnabled: followUpEnabled,
        followUpValidityDays: followUpEnabled ? followUpValidityDays : null,
        freeFollowUpLimit: followUpEnabled ? freeFollowUpLimit : null,
        followUpFee: followUpEnabled ? followUpFee : null,
        schedules: serializeSchedules(activeSchedules),
        educations: showEducation ? serializeEducations(educations) : null,
        awards: showAwards ? serializeAwards(awards) : null,
        certifications: showCertifications ? serializeAwards(certifications) : null,
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

      toast.success(isEdit ? "Doctor updated successfully!" : "Doctor added successfully!");
      setSuccess(true);
      setTimeout(() => navigate(all_routes.doctors), 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 mb-0">Loading doctor...</p>
        </div>
      </div>
    );
  }

  if (isEdit && !formReady && error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Link to={all_routes.doctors} className="btn btn-light mb-2">
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
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-2 pb-3 border-bottom">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.doctors}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Doctor
                    </Link>
                  </h6>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-2">
                    <h5 className="offcanvas-title fs-18 fw-bold">
                      {isEdit ? "Edit Doctor" : "New Doctor"}
                    </h5>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* -- Contact Information ----------------- */}
                    <div className="bg-light px-3 py-2 mb-2">
                      <h6 className="fw-bold mb-0">Contact Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        {/* Profile Image */}
                        <div className="col-lg-12">
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ marginBottom: "5px" }}>
                            <div className="d-flex align-items-center">
                              <label className="form-label me-3 mb-0">Profile Image</label>
                              <DoctorProfileUpload
                                value={profileImage}
                                onChange={setProfileImage}
                              />
                            </div>
                            <div className="d-flex align-items-center border rounded p-2 bg-white shadow-sm">
                              <label className="form-label me-3 mb-0 fw-bold">Availability Status:</label>
                              <div className="form-check form-check-inline mb-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="dr_status"
                                  id="status_active"
                                  checked={status === "Active"}
                                  onChange={() => setStatus("Active")}
                                />
                                <label className="form-check-label text-success fw-medium" htmlFor="status_active">
                                  Available
                                </label>
                              </div>
                              <div className="form-check form-check-inline mb-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="dr_status"
                                  id="status_inactive"
                                  checked={status === "Inactive"}
                                  onChange={() => setStatus("Inactive")}
                                />
                                <label className="form-check-label text-danger fw-medium" htmlFor="status_inactive">
                                  Unable
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Name + Username */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
                                  Username <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="username"
                                />
                                <div className="d-flex flex-column" style={{ minHeight: "0px", marginTop: "2px" }}>
                                  {usernameWarning && (
                                    <span className="text-danger fw-bold d-flex align-items-center" style={{ fontSize: "12px" }}>
                                      <i className="ti ti-alert-triangle me-1" /> {usernameWarning}
                                    </span>
                                  )}
                                  {usernameStatus === "checking" && !usernameWarning && (
                                    <span className="text-muted d-flex align-items-center" style={{ fontSize: "12px" }}>
                                      <span className="spinner-border spinner-border-sm me-1" style={{ width: "12px", height: "12px" }} /> checking...
                                    </span>
                                  )}
                                  {usernameStatus === "available" && !usernameWarning && (
                                    <span className="text-success fw-bold d-flex align-items-center" style={{ fontSize: "12px" }}>
                                      <i className="ti ti-circle-check me-1" /> Username Available
                                    </span>
                                  )}
                                  {usernameStatus === "taken" && !usernameWarning && (
                                    <span className="text-danger fw-bold d-flex align-items-center" style={{ fontSize: "12px" }}>
                                      <i className="ti ti-alert-circle me-1" /> Username Taken
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Phone + Email */}
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
                                  Phone Number <span className="text-danger">*</span>
                                </label>
                                <div>
                                  <PhoneInput
                                    defaultCountry="IN"
                                    value={phone}
                                    onChange={setPhone}
                                  />
                                </div>
                                {phoneWarning && (
                                  <div className="text-warning fs-12 mt-1">
                                    <i className="ti ti-alert-triangle me-1" />
                                    {phoneWarning}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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

                        {/* DOB + Age + Experience */}
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-4">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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
                            <div className="col-lg-4">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
                                  Age
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={dob ? `${dayjs().diff(dob, "year")} Years` : ""}
                                  readOnly
                                  placeholder="Auto-calculated"
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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
                              <div style={{ marginBottom: "5px" }}>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <label className="form-label mb-0">
                                    Department <span className="text-danger">*</span>
                                  </label>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 text-primary fw-bold fs-12 text-decoration-none"
                                    onClick={() => {
                                      setShowErrorModal(false);
                                      setShowQuickAddDeptModal(true);
                                    }}
                                  >
                                    <i className="ti ti-plus me-1" />Quick Add
                                  </button>
                                </div>
                                {isLoadingDepartments ? (
                                  <div className="form-control text-muted d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                    Loading departments...
                                  </div>
                                ) : deptOptions.length > 0 ? (
                                  <CommonSelect
                                    options={deptOptions}
                                    className="select"
                                    value={selectedDeptOption}
                                    placeholder="Select department"
                                    onChange={handleDepartmentChange}
                                  />
                                ) : (
                                  <div className="form-control text-muted">
                                    No departments available
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <label className="form-label mb-0">
                                    Designation <span className="text-danger">*</span>
                                  </label>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 text-primary fw-bold fs-12 text-decoration-none"
                                    onClick={() => {
                                      setShowErrorModal(false);
                                      setQuickDesigDeptId(departmentId || (departments[0]?.id || ""));
                                      setShowQuickAddDesigModal(true);
                                    }}
                                  >
                                    <i className="ti ti-plus me-1" />Quick Add
                                  </button>
                                </div>
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
                                      : "No designations for this department – add one in Designation settings"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* -- Address Information ----------------- */}
                    <div className="bg-light px-3 py-2 mb-2">
                      <h6 className="fw-bold mb-0">Address Information</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Address 1 <span className="text-danger ms-1">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              value={address1}
                              onChange={(e) => setAddress1(e.target.value)}
                              placeholder="House No, Building, Street Name"
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Address 2 (Optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={address2}
                              onChange={(e) => setAddress2(e.target.value)}
                              placeholder="Landmark, Area, Colony"
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Country</label>
                            <CommonSelect
                              options={Country}
                              className="select"
                              value={findSelectOption(Country, country) || { value: "India", label: "India" }}
                              onChange={(opt: any) => setCountry(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">State <span className="text-danger ms-1">*</span></label>
                            <CommonSelect
                              options={State}
                              className="select"
                              value={findSelectOption(State, stateVal) || State[0]}
                              onChange={(opt: any) => setStateVal(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">City <span className="text-danger ms-1">*</span></label>
                            <CommonSelect
                              options={City}
                              className="select"
                              value={findSelectOption(City, city) || City[0]}
                              onChange={(opt: any) => setCity(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Pincode <span className="text-danger ms-1">*</span></label>
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

                    {/* -- Additional Details (Optional, Collapsible) -- */}
                    <div className="border rounded mb-2 mx-0 bg-white">
                      <div
                        className="bg-light px-3 py-2 d-flex align-items-center justify-content-between"
                        onClick={() => setShowOptionalFields(!showOptionalFields)}
                        style={{ cursor: "pointer", userSelect: "none", borderRadius: showOptionalFields ? "0.375rem 0.375rem 0 0" : "0.375rem" }}
                      >
                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <i className="ti ti-list-details text-primary fs-18" />
                          Additional Details
                          <span className="badge bg-soft-secondary text-muted fw-normal fs-11 ms-1">Optional</span>
                        </h6>
                        <i className={`ti ${showOptionalFields ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-dark`} />
                      </div>
                      {showOptionalFields && (
                        <div className="p-3">
                          <div className="row">
                            {/* Specialization + Qualification */}
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Specializations</label>
                                {specOptions.length > 0 ? (
                                  <CommonSelect
                                    options={specOptions}
                                    className="select"
                                    value={specOptions.filter((o: any) => selectedSpecializations.includes(o.value)) as any}
                                    placeholder="Select specializations"
                                    isMulti={true}
                                    onChange={(opt: any) =>
                                      setSelectedSpecializations(
                                        Array.isArray(opt) ? opt.map((o: any) => o.value) : []
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="form-control text-muted py-2">
                                    No specializations available
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Qualification</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={qualification}
                                  onChange={(e) => setQualification(e.target.value)}
                                  placeholder="e.g. MBBS, MD"
                                />
                              </div>
                            </div>

                            {/* Marital Status + License */}
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Marital Status</label>
                                <CommonSelect
                                  options={[
                                    { value: "Single", label: "Single" },
                                    { value: "Married", label: "Married" },
                                    { value: "Divorced", label: "Divorced" },
                                    { value: "Widowed", label: "Widowed" },
                                  ]}
                                  className="select"
                                  value={
                                    maritalStatus
                                      ? { value: maritalStatus, label: maritalStatus }
                                      : null
                                  }
                                  onChange={(opt: any) => setMaritalStatus(opt?.value || "")}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Medical License Number</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={medicalLicenseNumber}
                                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                                  placeholder="ML-123456"
                                />
                              </div>
                            </div>

                            {/* Languages + Alt Contact */}
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Language Spoken</label>
                                <TagInput
                                  key={`tags-${educationKey}`}
                                  initialTags={tags}
                                  onTagsChange={setTags}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Alternative Contact No</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={alternateMobile}
                                  onChange={(e) => setAlternateMobile(e.target.value)}
                                  placeholder="e.g. 9876543210"
                                />
                              </div>
                            </div>

                            {/* Blood Group + Gender */}
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">
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

                            {/* Bio */}
                            <div className="col-lg-12">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Bio</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={bio}
                                  onChange={(e) => setBio(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -- Schedule --------------------------- */}
                    <div className="bg-light px-3 py-2 mb-2">
                      <h6 className="fw-bold mb-0">Schedule</h6>
                    </div>
                    <div className="p-3 bg-white rounded shadow-sm border mx-3 my-3" style={{ overflow: "visible" }}>
                      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center">
                          <i className="ti ti-calendar-event me-2 text-primary fs-18" /> Weekly Schedule Setup
                        </h6>
                        <span className="badge badge-soft-info border border-info px-3 py-2 rounded-pill">
                          {WEEKDAYS.length} Days Available
                        </span>
                      </div>

                      <ul className="nav nav-pills schedule-tab mb-4 gap-2" id="pills-tab" role="tablist">
                        {WEEKDAYS.map((day, i) => (
                          <li key={day} className="nav-item flex-fill" role="presentation">
                            <button
                              className={`nav-link btn w-100 px-3 py-2 border rounded-pill transition-all d-flex align-items-center justify-content-center gap-2 ${activeScheduleDay === day
                                ? "active btn-primary text-white shadow"
                                : "btn-light text-dark hover-bg-light"
                                }`}
                              style={{ fontWeight: "600", fontSize: "14px" }}
                              data-bs-toggle="pill"
                              data-bs-target={`#schedule-${i + 1}`}
                              type="button"
                              role="tab"
                              aria-selected={activeScheduleDay === day}
                              onClick={() => setActiveScheduleDay(day)}
                            >
                              {day}
                              {lockedDays[day] && <i className="ti ti-circle-check-filled fs-14 text-white shadow-sm" />}
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
                            <div className="add-schedule-list border rounded p-4 bg-light border-dashed mb-2 position-relative">
                              <div className="d-flex align-items-center justify-content-between mb-4">
                                <div>
                                  <h6 className="fw-bold mb-1 text-primary">{day} Working Hours</h6>
                                  <p className="text-muted fs-12 mb-0">Define session timings for this specific day</p>
                                </div>
                              </div>

                              <div className={`${lockedDays[day] ? "opacity-75" : ""}`}>
                                <DuplicateForms
                                  key={`${day}-${lockedDays[day]}`}
                                  initialRows={schedules[day]}
                                  onChange={(rows) =>
                                    setSchedules((prev) => ({ ...prev, [day]: rows }))
                                  }
                                  disabled={lockedDays[day]}
                                />
                                <div className="mt-3 d-flex justify-content-end">
                                  <button
                                    type="button"
                                    className={`btn ${lockedDays[day] ? "btn-outline-primary" : "btn-primary"} d-flex align-items-center gap-2 px-4 shadow-sm`}
                                    style={{ minHeight: '40px', fontWeight: 'bold', borderRadius: '8px' }}
                                    onClick={() => setLockedDays(prev => ({ ...prev, [day]: !prev[day] }))}
                                  >
                                    {lockedDays[day] ? (
                                      <>
                                        <i className="ti ti-edit fs-18" /> Edit Schedule
                                      </>
                                    ) : (
                                      <>
                                        <i className="ti ti-circle-check fs-18" /> Save & Lock Day
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                        )}
                      </div>
                      <div className="mt-2 p-3 bg-soft-warning rounded border border-warning border-dashed d-flex align-items-center gap-2">
                        <i className="ti ti-alert-circle text-warning fs-18" />
                        <span className="text-dark fs-12 fw-medium">
                          <strong>Note:</strong> Progress is only saved for days you explicitly click "Save & Lock". Unlocked days will not be submitted.
                        </span>
                      </div>
                    </div>

                    {/* -- Optional Information Toggles ----------------- */}
                    <div className="pb-0">
                      <div className="row">
                        {/* Educational Information */}
                        <div className="col-lg-12 mb-4 px-3">
                          <div className="border rounded bg-white">
                            <div 
                              className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
                              onClick={() => setShowEducation(!showEducation)}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              <h6 className="fw-bold mb-0 text-primary">Educational Information</h6>
                              <i className={`ti ${showEducation ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-primary`} />
                            </div>
                            {showEducation && (
                              <div className="p-4">
                                <EducationForms
                                  key={`edu-${educationKey}`}
                                  initialRows={educations.length ? educations : undefined}
                                  onChange={setEducations}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Awards & Recognition */}
                        <div className="col-lg-12 mb-4 px-3">
                          <div className="border rounded bg-white">
                            <div 
                              className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
                              onClick={() => setShowAwards(!showAwards)}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              <h6 className="fw-bold mb-0 text-success">Awards &amp; Recognition</h6>
                              <i className={`ti ${showAwards ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-success`} />
                            </div>
                            {showAwards && (
                              <div className="p-4">
                                <RewardsForms
                                  key={`aw-${awardsKey}`}
                                  initialRows={awards.length ? awards : undefined}
                                  onChange={setAwards}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Certifications */}
                        <div className="col-lg-12 mb-4 px-3">
                          <div className="border rounded bg-white">
                            <div 
                              className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between"
                              onClick={() => setShowCertifications(!showCertifications)}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              <h6 className="fw-bold mb-0 text-warning">Certifications</h6>
                              <i className={`ti ${showCertifications ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-warning`} />
                            </div>
                            {showCertifications && (
                              <div className="p-4">
                                <RewardsForms
                                  key={`cert-${certsKey}`}
                                  initialRows={certifications.length ? certifications : undefined}
                                  onChange={setCertifications}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* -- Document Information ----------------- */}
                    <div 
                      className="bg-light px-3 py-2 mb-2 d-flex align-items-center justify-content-between"
                      onClick={() => setShowDocuments(!showDocuments)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <h6 className="fw-bold mb-0">Documents Upload</h6>
                      <i className={`ti ${showDocuments ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-dark`} />
                    </div>
                    {showDocuments && (
                      <div className="p-3">
                        <div className="row">
                          {/* Row 1 */}
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">Doctor Signature (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={signatureImage} onChange={setSignatureImage} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">Medical Reg. Certificate (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={medicalRegCertificate} onChange={setMedicalRegCertificate} />
                              </div>
                            </div>
                          </div>

                          {/* Row 2 */}
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">Qualification Certificate (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={qualificationCertificate} onChange={setQualificationCertificate} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">Aadhaar Card Front (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={aadhaarCard} onChange={setAadhaarCard} />
                              </div>
                            </div>
                          </div>

                          {/* Row 3 */}
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">PAN Card (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={panCard} onChange={setPanCard} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-6 mb-2">
                            <div className="d-flex align-items-center justify-content-between border rounded p-3 bg-white shadow-sm">
                              <label className="form-label mb-0 fw-bold text-dark">Aadhaar Card Back (Optional)</label>
                              <div style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                <DoctorProfileUpload value={aadhaarCardBack} onChange={setAadhaarCardBack} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-light px-3 py-2 mb-2 d-flex align-items-center justify-content-between">
                      <h6 className="fw-bold mb-0">Appointment Information</h6>
                      <div className="form-check form-switch mb-0">
                        <label className="form-check-label fs-14 fw-medium me-2" htmlFor="acceptingAppointments">
                          Accept Appointments
                        </label>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="acceptingAppointments"
                          checked={acceptingAppointments}
                          onChange={(e) => setAcceptingAppointments(e.target.checked)}
                        />
                      </div>
                    </div>
                    <div className={`pb-0 ${!acceptingAppointments ? "opacity-50 pointer-events-none" : ""}`}>
                      <div className="row">
                        {/* All 4 fields on one row to reduce empty space */}
                        <div className="col-lg-3">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Appointment Type</label>
                            <CommonSelect
                              options={Appointment_Type}
                              className="select"
                              isDisabled={!acceptingAppointments}
                              value={
                                findSelectOption(Appointment_Type, appointmentType) ||
                                Appointment_Type[0]
                              }
                              onChange={(opt: any) => setAppointmentType(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Accept bookings (in Advance)</label>
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              disabled={!acceptingAppointments}
                              value={acceptBookingsInAdvance}
                              onChange={(e) => setAcceptBookingsInAdvance(e.target.value)}
                              placeholder="Enter days (e.g. 15)"
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Appointment Duration</label>
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              disabled={!acceptingAppointments}
                              value={appointmentDuration}
                              onChange={(e) => setAppointmentDuration(e.target.value)}
                              placeholder="Enter minutes (e.g. 30)"
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div style={{ marginBottom: "5px" }}>
                            <label className="form-label mb-0">Consultation Charge</label>
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              step="0.01"
                              disabled={!acceptingAppointments}
                              value={consultationCharge}
                              onChange={(e) => setConsultationCharge(e.target.value)}
                              placeholder="Enter amount (e.g. 500.00)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* -- Follow-up Information ------------- */}
                    <div className="bg-light px-3 py-2 mb-2">
                      <h6 className="fw-bold mb-0">Follow-up Settings</h6>
                    </div>
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="form-check form-switch mb-2">
                            <label className="form-check-label" htmlFor="followUpEnabled">
                              Follow-up Enabled
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="followUpEnabled"
                              checked={followUpEnabled}
                              onChange={(e) => setFollowUpEnabled(e.target.checked)}
                            />
                          </div>
                        </div>
                        {followUpEnabled && (
                          <>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Follow-up Validity</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={followUpValidityDays}
                                  onChange={(e) => setFollowUpValidityDays(e.target.value)}
                                  placeholder="Enter validity in days (e.g. 15)"
                                  min={0}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label d-flex align-items-center gap-2">
                                  Free Follow-up Limit
                                  <span className="badge bg-soft-info text-info fw-normal fs-12">
                                    <i className="ti ti-info-circle me-1" />0 = Unlimited
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={freeFollowUpLimit}
                                  onChange={(e) => setFreeFollowUpLimit(e.target.value)}
                                  placeholder="Enter visit limit (e.g. 4)"
                                  min={0}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div style={{ marginBottom: "5px" }}>
                                <label className="form-label mb-0">Follow-up Fee (₹)</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={followUpFee}
                                  onChange={(e) => setFollowUpFee(e.target.value)}
                                  placeholder="Enter amount (e.g. 500.00)"
                                  min={0}
                                  step="0.01"
                                />
                                <small className="text-muted">Charged after free follow-up limit is exhausted</small>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* -- Actions ---------------------------- */}
                    <div className="mt-2 pb-2 d-flex justify-content-end gap-3 border-top pt-3">
                      <Link
                        to={all_routes.doctors}
                        className="btn btn-outline-secondary btn-lg px-5 d-flex align-items-center gap-2"
                        style={{ borderRadius: "10px", fontWeight: "600" }}
                      >
                        <i className="ti ti-arrow-left fs-18" /> Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg px-5 shadow-lg d-flex align-items-center gap-3 transition-all"
                        style={{ borderRadius: "10px", minWidth: "220px", fontWeight: "bold" }}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <i className={isEdit ? "ti ti-device-floppy fs-20" : "ti ti-user-plus fs-20"} />
                            <span>{isEdit ? "Update Doctor" : "Create Doctor"}</span>
                          </>
                        )}
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
            2025 –{" "}
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      {/* --- Error Modal for missing Dept/Desig --- */}
      {showErrorModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="ti ti-info-circle fs-22" />
                  Configuration Required
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowErrorModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div style={{ marginBottom: "2px" }}>
                  <span className="avatar avatar-xl bg-primary-light text-primary rounded-circle">
                    <i className="ti ti-briefcase fs-36" />
                  </span>
                </div>
                <h5 className="fw-bold mb-2">Setup Incomplete</h5>
                {departments.length === 0 ? (
                  <p className="text-muted mb-0">
                    To add a doctor, you need to first add at least one <strong>Department</strong> in the system.
                  </p>
                ) : (
                  <p className="text-muted mb-0">
                    To add a doctor, you need to first add at least one <strong>Designation</strong> in the system.
                  </p>
                )}
              </div>
              <div className="modal-footer border-top-0 pt-0 pb-4 justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light px-4 border"
                  onClick={() => {
                    setShowErrorModal(false);
                    navigate(all_routes.doctors);
                  }}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </button>
                {departments.length === 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary px-4 shadow-sm"
                    onClick={() => {
                      setShowErrorModal(false);
                      setShowQuickAddDeptModal(true);
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    Add Department <i className="ti ti-plus ms-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary px-4 shadow-sm"
                    onClick={() => {
                      setShowErrorModal(false);
                      setQuickDesigDeptId(departments[0]?.id || "");
                      setShowQuickAddDesigModal(true);
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    Add Designation <i className="ti ti-plus ms-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- Quick Add Department Modal --- */}
      {showQuickAddDeptModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowQuickAddDeptModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '480px', borderRadius: '12px',
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              background: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header bg-primary" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'none' }}>
              <h4 className="modal-title fw-bold mb-0" style={{ color: '#fff' }}>Add New Department</h4>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowQuickAddDeptModal(false)}
              />
            </div>
            {/* Body */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!quickDeptName.trim()) { toast.error("Department name is required."); return; }
              setIsSubmittingQuickDept(true);
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(apiUrl("/api/departments"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: quickDeptName, description: quickDeptDesc, status: "Active" }),
                });
                if (!res.ok) { const data = await res.json(); throw new Error(data.message || "Failed to create department"); }
                const newDept = await res.json();
                toast.success("Department added successfully!");
                const fetchRes = await fetch(apiUrl("/api/departments"), { headers: { Authorization: `Bearer ${token}` } });
                const depts = await fetchRes.json();
                if (Array.isArray(depts)) { setDepartments(depts.filter((d: any) => d.status === "Active")); }
                setDepartmentId(newDept.id);
                setQuickDeptName("");
                setQuickDeptDesc("");
                setShowQuickAddDeptModal(false);
                setShowErrorModal(false);
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setIsSubmittingQuickDept(false);
              }
            }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label fw-semibold">Department Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={quickDeptName}
                    onChange={(e) => setQuickDeptName(e.target.value)}
                    placeholder="e.g. Cardiology"
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={quickDeptDesc}
                    onChange={(e) => setQuickDeptDesc(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-light border" onClick={() => setShowQuickAddDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingQuickDept}>
                  {isSubmittingQuickDept ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                  ) : (
                    <><i className="ti ti-check me-2" />Add Department</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Quick Add Designation Modal --- */}
      {showQuickAddDesigModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowQuickAddDesigModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '480px', borderRadius: '12px',
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              background: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header bg-primary" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'none' }}>
              <h4 className="modal-title fw-bold mb-0" style={{ color: '#fff' }}>Add New Designation</h4>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowQuickAddDesigModal(false)}
              />
            </div>
            {/* Body */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!quickDesigName.trim()) { toast.error("Designation name is required."); return; }
              if (!quickDesigDeptId) { toast.error("Please select a department."); return; }
              setIsSubmittingQuickDesig(true);
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(apiUrl("/api/designations"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: quickDesigName, departmentId: quickDesigDeptId, type: "Doctor", status: "Active" }),
                });
                if (!res.ok) { const data = await res.json(); throw new Error(data.message || "Failed to create designation"); }
                const newDesig = await res.json();
                toast.success("Designation added successfully!");
                const fetchRes = await fetch(apiUrl("/api/designations"), { headers: { Authorization: `Bearer ${token}` } });
                const desigs = await fetchRes.json();
                if (Array.isArray(desigs)) { setAllDesignations(desigs); }
                setDepartmentId(quickDesigDeptId);
                setDesignationId(newDesig.id);
                setQuickDesigName("");
                setShowQuickAddDesigModal(false);
                setShowErrorModal(false);
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setIsSubmittingQuickDesig(false);
              }
            }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label fw-semibold">Department<span className="text-danger ms-1">*</span></label>
                  <CommonSelect
                    options={deptOptions}
                    className="select"
                    value={deptOptions.find(o => o.value === quickDesigDeptId) || null}
                    onChange={(opt: any) => setQuickDesigDeptId(opt?.value || "")}
                    placeholder="Select Department"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label fw-semibold">Designation Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={quickDesigName}
                    onChange={(e) => setQuickDesigName(e.target.value)}
                    placeholder="e.g. Senior Consultant"
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-light border" onClick={() => setShowQuickAddDesigModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingQuickDesig}>
                  {isSubmittingQuickDesig ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                  ) : (
                    <><i className="ti ti-check me-2" />Add Designation</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorFormPage;
