import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { all_routes } from "../../../../routes/all_routes";
import {
  Blood_Group,
  City,
  Country,
  Gender,
  State,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import PatientProfileUpload from "../../../../../core/common/patient-profile-upload/PatientProfileUpload";
import { apiUrl } from "../../../../../core/config/api";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import {
  PATIENT_STATUS_OPTIONS,
  emptyPatientForm,
} from "../../../../../core/utils/patientForm";
import { findSelectOption } from "../../../../../core/utils/doctorSchedule";
import { toast } from "react-toastify";

interface PatientFormPageProps {
  mode: "create" | "edit";
}

const PatientFormPage = ({ mode }: PatientFormPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { patient, loading: loadingPatient } = useClinicPatient(
    mode === "edit" ? id : undefined
  );

  const [form, setForm] = useState(emptyPatientForm);
  const [doctors, setDoctors] = useState<{ id: string; fullName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  
  // Collapse states for optional details sections
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/doctors"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDoctors(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label: d.fullName,
  }));

  useEffect(() => {
    if (mode === "edit" && patient) {
      setForm({
        firstName: patient.firstName || "",
        middleName: patient.middleName || "",
        lastName: patient.lastName || "",
        status: patient.status === "Inactive" ? "Inactive" : "Active",
        profileImage: patient.profileImage || null,
        phone: patient.phone || "",
        email: patient.email || "",
        dob: patient.dob ? dayjs(patient.dob) : null,
        gender: patient.gender || "",
        bloodGroup: patient.bloodGroup || "",
        address1: patient.address1 || "",
        address2: patient.address2 || "",
        country: patient.country || "",
        state: patient.state || "",
        city: patient.city || "",
        pincode: patient.pincode || "",
        alternateMobile: patient.alternateMobile || "",
        maritalStatus: patient.maritalStatus || "",
        occupation: patient.occupation || "",
        aadhaarNumber: patient.aadhaarNumber || "",
        passportNumber: patient.passportNumber || "",
        referredBy: patient.referredBy || "",
        emergencyContactName: patient.emergencyContactName || "",
        emergencyContactRelation: patient.emergencyContactRelation || "",
        emergencyContactPhone: patient.emergencyContactPhone || "",
      });
    }
  }, [mode, patient?.id]);

  // -- Phone Duplicate Check --------------------------------------
  useEffect(() => {
    if (!form.phone || form.phone.length < 5) {
      setPhoneWarning(null);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/patients?search=${form.phone}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const isDuplicate = mode === "edit"
            ? data.some((p: any) => p.id !== id && p.phone === form.phone)
            : data.some((p: any) => p.phone === form.phone);
          if (isDuplicate) {
            setPhoneWarning("Warning: This phone number is already registered for another patient.");
          } else {
            setPhoneWarning(null);
          }
        } else {
          setPhoneWarning(null);
        }
      })
      .catch(() => setPhoneWarning(null));
  }, [form.phone, mode, id]);

  const buildPayload = () => ({
    firstName: form.firstName.trim(),
    middleName: form.middleName || null,
    lastName: form.lastName.trim(),
    profileImage: form.profileImage,
    phone: form.phone || null,
    email: form.email || null,
    dob: form.dob ? form.dob.toISOString() : null,
    age: form.dob ? dayjs().diff(form.dob, "year") : null,
    gender: form.gender || null,
    bloodGroup: form.bloodGroup || null,
    status: form.status || "Active",
    address1: form.address1 || null,
    address2: form.address2 || null,
    country: form.country || null,
    state: form.state || null,
    city: form.city || null,
    pincode: form.pincode || null,
    alternateMobile: form.alternateMobile || null,
    maritalStatus: form.maritalStatus || null,
    occupation: form.occupation || null,
    aadhaarNumber: form.aadhaarNumber || null,
    passportNumber: form.passportNumber || null,
    referredBy: form.referredBy || null,
    emergencyContactName: form.emergencyContactName || null,
    emergencyContactRelation: form.emergencyContactRelation || null,
    emergencyContactPhone: form.emergencyContactPhone || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!form.lastName.trim()) {
      setFormError("Last name is required.");
      return;
    }
    if (!form.address1.trim()) {
      setFormError("Address Line 1 is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const url =
        mode === "create"
          ? apiUrl("/api/patients")
          : apiUrl(`/api/patients/${id}`);
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save patient");
      }
      const data = await res.json();
      toast.success(mode === "create" ? "Patient created successfully" : "Patient updated successfully");

      // Send WhatsApp notification if a new patient is created
      if (mode === "create" && data && data.phone) {
        const patientName = data.fullName || `${data.firstName} ${data.lastName}`.trim();
        const confirmSend = window.confirm(`Do you want to send a WhatsApp welcome notification to ${patientName}?`);
        if (confirmSend) {
          try {
            const userStr = localStorage.getItem("user");
            const currentUser = userStr ? JSON.parse(userStr) : {};
            const clinicName = currentUser?.clinic?.name || "our clinic";
            const loginLink = `${window.location.origin}/login`;
            const regDate = data.createdAt ? dayjs(data.createdAt).format("DD-MM-YYYY") : dayjs().format("DD-MM-YYYY");

            const msg = `Dear ${patientName},
Your registration has been successfully completed at ${clinicName}.

Registration Details:
🆔 Patient ID (UHID): ${data.patientCode || "—"}
👤 Patient Name: ${patientName}
📱 Registered Mobile: ${data.phone}
📅 Registration Date: ${regDate}

You can access your patient account using your registered mobile number and OTP verification.
🔗 Patient Portal:
 ${loginLink}

Login Instructions:
1. Open the link above.
2. Enter your registered mobile number.
3. Verify with the OTP sent to your mobile.
4. Access your appointments, prescriptions, lab reports, bills, and medical records anytime.

Thank you for choosing ${clinicName}.
Regards,
 ${clinicName}
Powered by DocYori`;

            const cleanPhone = data.phone.replace(/\D/g, "");
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, "_blank");
          } catch (e) {
            console.error("Error generating Patient WhatsApp link", e);
          }
        }
      }

      navigate(all_routes.patients, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save patient";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "edit" && loadingPatient) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <style>{`
        .input-icon-end .ant-picker-dropdown {
          position: absolute !important;
          top: 100% !important;
          bottom: auto !important;
          transform: none !important;
          z-index: 10000 !important;
        }
      `}</style>
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-lg-12">
            <div className="mb-4">
              <h6 className="fw-bold mb-0 d-flex align-items-center">
                <Link to={all_routes.patients} className="text-dark">
                  <i className="ti ti-chevron-left me-1" />
                  Patients
                </Link>
              </h6>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-body pb-0">
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      {formError}
                    </div>
                  )}
                  <h6 className="fw-bold mb-3 text-primary">Patient Information (Primary Details)</h6>
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="mb-3 d-flex align-items-center gap-3">
                        <label className="form-label mb-0 fw-bold">Profile Image</label>
                        <PatientProfileUpload
                          value={form.profileImage}
                          onChange={(url) =>
                            setForm((f) => ({ ...f, profileImage: url }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          First Name<span className="text-danger ms-1">*</span>
                        </label>
                        <input type="text" className="form-control" placeholder="Enter First Name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">Middle Name <span className="text-muted fw-normal fs-12">(Optional)</span></label>
                        <input type="text" className="form-control" placeholder="Enter Middle Name" value={form.middleName} onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Last Name<span className="text-danger ms-1">*</span>
                        </label>
                        <input type="text" className="form-control" placeholder="Enter Last Name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          DOB<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker w-100"
                            format={{ format: "DD-MM-YYYY", type: "mask" }}
                            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                            placeholder="DD-MM-YYYY"
                            suffixIcon={null}
                            value={form.dob}
                            onChange={(d: Dayjs | null) =>
                              setForm((f) => ({ ...f, dob: d }))
                            }
                            placement="bottomLeft"
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Age"
                          value={form.dob ? dayjs().diff(form.dob, "year") : ""}
                          onChange={(e) => {
                            const ageVal = parseInt(e.target.value, 10);
                            if (!isNaN(ageVal) && ageVal >= 0) {
                              setForm((f) => ({
                                ...f,
                                dob: dayjs().subtract(ageVal, "year").startOf("year")
                              }));
                            } else {
                              setForm((f) => ({ ...f, dob: null }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Gender<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={Gender}
                          className="select"
                          value={findSelectOption(Gender, form.gender) || Gender[0]}
                          placeholder="Select Gender"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, gender: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Phone Number<span className="text-danger ms-1">*</span>
                        </label>
                        <PhoneInput 
                          defaultCountry="IN" 
                          placeholder="Enter Phone Number" 
                          value={form.phone} 
                          onChange={(v) => setForm((f) => ({ ...f, phone: v || "" }))} 
                          disabled={mode === "edit"}
                        />
                        {mode === "edit" && (
                          <div className="text-muted fs-11 mt-1">Mobile number is permanent and cannot be changed.</div>
                        )}
                        {phoneWarning && (
                          <div className="text-warning fs-12 mt-1"><i className="ti ti-alert-triangle me-1" />{phoneWarning}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Email Address <span className="text-muted fw-normal fs-12">(Optional)</span>
                        </label>
                        <input type="email" className="form-control" placeholder="Enter Email Address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Status<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={PATIENT_STATUS_OPTIONS}
                          className="select"
                          value={findSelectOption(PATIENT_STATUS_OPTIONS, form.status)}
                          placeholder="Select Status"
                          onChange={(opt) => setForm((f) => ({ ...f, status: opt?.value || "Active" }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Address Information (Permanent) --- */}
                  <h6 className="fw-bold mb-3 border-top pt-3 text-dark">
                    Address Information
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Address 1<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="House No, Building, Street Name"
                          value={form.address1}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, address1: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Address 2 <span className="text-muted fw-normal fs-12">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Area, Landmark, Suite"
                          value={form.address2}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, address2: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          Country<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={Country}
                          className="select"
                          value={
                            findSelectOption(Country, form.country) || Country[0]
                          }
                          placeholder="Select Country"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, country: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          State<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={State}
                          className="select"
                          value={findSelectOption(State, form.state) || State[0]}
                          placeholder="Select State"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, state: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          City<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={City}
                          className="select"
                          value={findSelectOption(City, form.city) || City[0]}
                          placeholder="Select City"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, city: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          Pincode<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Pincode"
                          value={form.pincode}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, pincode: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Optional Information --- */}
                  <div 
                    className="d-flex align-items-center justify-content-between border-top pt-3 mb-3"
                    onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <h6 className="fw-bold mb-0 text-dark">Optional Details</h6>
                    <i className={`ti ${showOptionalDetails ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-secondary`} />
                  </div>
                  {showOptionalDetails && (
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Alternate Mobile</label>
                          <PhoneInput defaultCountry="IN" placeholder="Enter Alternate Mobile" value={form.alternateMobile} onChange={(v) => setForm((f) => ({ ...f, alternateMobile: v || "" }))} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Blood Group <span className="text-muted fw-normal fs-12">(Optional)</span>
                          </label>
                          <CommonSelect
                            options={Blood_Group}
                            className="select"
                            value={
                              findSelectOption(Blood_Group, form.bloodGroup) ||
                              Blood_Group[0]
                            }
                            placeholder="Select Blood Group"
                            onChange={(opt) =>
                              setForm((f) => ({
                                ...f,
                                bloodGroup: opt?.value || "",
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Marital Status</label>
                          <CommonSelect
                            options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Divorced", label: "Divorced" }, { value: "Widowed", label: "Widowed" }]}
                            className="select"
                            value={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Divorced", label: "Divorced" }, { value: "Widowed", label: "Widowed" }].find(o => o.value === form.maritalStatus)}
                            placeholder="Select Marital Status"
                            onChange={(opt) => setForm((f) => ({ ...f, maritalStatus: opt?.value || "" }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Occupation</label>
                          <input type="text" className="form-control" placeholder="Enter Occupation" value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Aadhaar Number</label>
                          <input type="text" className="form-control" placeholder="Enter Aadhaar Number" value={form.aadhaarNumber} onChange={(e) => setForm((f) => ({ ...f, aadhaarNumber: e.target.value }))} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Passport Number</label>
                          <input type="text" className="form-control" placeholder="Enter Passport Number" value={form.passportNumber} onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))} />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Referred By</label>
                          <input type="text" className="form-control" placeholder="e.g. Google, Walk-in, Doctor Name" value={form.referredBy} onChange={(e) => setForm((f) => ({ ...f, referredBy: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- Emergency Contact (Optional) --- */}
                  <div 
                    className="d-flex align-items-center justify-content-between border-top pt-3 mb-3"
                    onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <h6 className="fw-bold mb-0 text-danger">Emergency Contact (Optional)</h6>
                    <i className={`ti ${showEmergencyContact ? "ti-chevron-up" : "ti-chevron-down"} fs-18 text-danger`} />
                  </div>
                  {showEmergencyContact && (
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Name</label>
                          <input type="text" className="form-control" placeholder="Enter Contact Name" value={form.emergencyContactName} onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Relation</label>
                          <input type="text" className="form-control" placeholder="e.g. Brother, Wife" value={form.emergencyContactRelation} onChange={(e) => setForm((f) => ({ ...f, emergencyContactRelation: e.target.value }))} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">Phone Number</label>
                          <PhoneInput defaultCountry="IN" placeholder="Enter Phone Number" value={form.emergencyContactPhone} onChange={(v) => setForm((f) => ({ ...f, emergencyContactPhone: v || "" }))} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex align-items-center justify-content-end mt-4 mb-4">
                    <Link to={all_routes.patients} className="btn btn-light me-2">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving…"
                        : mode === "create"
                          ? "Add New Patient"
                          : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="footer text-center bg-white p-2 border-top">
        <p className="text-dark mb-0">
          2025 © <span className="link-primary">Docyari</span>, All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default PatientFormPage;
