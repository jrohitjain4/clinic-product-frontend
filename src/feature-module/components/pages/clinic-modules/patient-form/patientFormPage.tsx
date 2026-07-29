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
  State,
} from "../../../../../core/common/selectOption";
import PatientProfileUpload from "../../../../../core/common/patient-profile-upload/PatientProfileUpload";
import {
  IconFormControl,
  IconSelect,
  GenderOptionGroup,
  StatusOptionGroup,
} from "../../../../../core/common/form-fields";
import type { GenderValue, PatientStatusValue } from "../../../../../core/common/form-fields";
import { apiUrl } from "../../../../../core/config/api";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import {
  emptyPatientForm,
} from "../../../../../core/utils/patientForm";
import { findSelectOption } from "../../../../../core/utils/doctorSchedule";
import "../../../../../core/common/form-fields/IconField.scss";

type DoctorOption = { id: string; fullName: string };

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
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/doctors"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: DoctorOption[]) =>
        setDoctors(Array.isArray(data) ? data.filter((d) => d.id) : [])
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (mode === "edit" && patient) {
      setForm({
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        status: patient.status === "Inactive" ? "Inactive" : "Active",
        profileImage: patient.profileImage || null,
        phone: patient.phone || "",
        email: patient.email || "",
        doctorIds: patient.doctors ? patient.doctors.map((d: any) => d.id) : [],
        dob: patient.dob ? dayjs(patient.dob) : null,
        gender: patient.gender || "",
        bloodGroup: patient.bloodGroup || "",
        address1: patient.address1 || "",
        address2: patient.address2 || "",
        country: patient.country || "",
        state: patient.state || "",
        city: patient.city || "",
        pincode: patient.pincode || "",
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

  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label: d.fullName,
  }));

  const buildPayload = () => ({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    profileImage: form.profileImage,
    phone: form.phone || null,
    email: form.email || null,
    doctorIds: form.doctorIds,
    dob: form.dob ? form.dob.toISOString() : null,
    gender: form.gender || null,
    bloodGroup: form.bloodGroup || null,
    status: form.status || "Active",
    address1: form.address1 || null,
    address2: form.address2 || null,
    country: form.country || null,
    state: form.state || null,
    city: form.city || null,
    pincode: form.pincode || null,
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
    if (!form.doctorIds || form.doctorIds.length === 0) {
      setFormError("At least one doctor is required.");
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
      navigate(all_routes.patients, { replace: true });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save patient");
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
        .page-wrapper .card.patient-form-main-card {
          border: none !important;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .page-wrapper .card.patient-form-main-card > .patient-form-card-header {
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }
      `}</style>
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="mb-4">
              <h6 className="fw-bold mb-0 d-flex align-items-center">
                <Link to={all_routes.patients} className="text-dark">
                  <i className="ti ti-chevron-left me-1" />
                  Patients
                </Link>
              </h6>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card overflow-hidden border-0 patient-form-main-card">
                <div
                  className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom patient-form-card-header"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        background: "#f3e8ff",
                        color: "#6d28d9",
                      }}
                    >
                      <i
                        className={`ti ${mode === "create" ? "ti-user-plus" : "ti-user-edit"} fs-20`}
                      />
                    </div>
                    <div>
                      <h5
                        className="mb-0 fw-bold"
                        style={{ color: "#1e1b4b", fontSize: 18 }}
                      >
                        {mode === "create" ? "Add New Patient" : "Edit Patient"}
                      </h5>
                      <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                        {mode === "create"
                          ? "Enter patient details to register in the system"
                          : "Update patient details in the system"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={all_routes.patients}
                    className="d-inline-flex align-items-center justify-content-center text-muted bg-white"
                    aria-label="Close"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <i className="ti ti-x fs-18" />
                  </Link>
                </div>
                <div className="card-body pb-0">
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      {formError}
                    </div>
                  )}
                  <h6 className="fw-bold mb-3">Patient Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3 d-flex align-items-center gap-2">
                        <label className="form-label mb-0">Profile Image</label>
                        <PatientProfileUpload
                          value={form.profileImage}
                          onChange={(url) =>
                            setForm((f) => ({ ...f, profileImage: url }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Status<span className="text-danger ms-1">*</span>
                        </label>
                        <StatusOptionGroup
                          value={form.status}
                          onChange={(val: PatientStatusValue) =>
                            setForm((f) => ({
                              ...f,
                              status: val || "Active",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          First Name<span className="text-danger ms-1">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="First Name"
                          type="text"
                          placeholder="Enter first name"
                          value={form.firstName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, firstName: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Last Name<span className="text-danger ms-1">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="Last Name"
                          type="text"
                          placeholder="Enter last name"
                          value={form.lastName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, lastName: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Phone Number<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="icon-field-shell">
                          <span className="icon-field-box" aria-hidden>
                            <i className="ti ti-phone" />
                          </span>
                          <PhoneInput
                            defaultCountry="IN"
                            value={form.phone}
                            onChange={(v) =>
                              setForm((f) => ({ ...f, phone: v || "" }))
                            }
                            className="icon-field-phone"
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
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Email Address<span className="text-danger ms-1">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="Email Address"
                          type="email"
                          placeholder="Enter email address"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Associate Doctors<span className="text-danger ms-1">*</span>
                        </label>
                        {doctorOptions.length > 0 ? (
                          <IconSelect
                            fieldLabel="Associate Doctors"
                            options={doctorOptions}
                            className="select"
                            isMulti={true}
                            value={doctorOptions.filter((opt) =>
                              form.doctorIds.includes(opt.value)
                            )}
                            placeholder="Select doctors"
                            onChange={(opts) => {
                              const selectedIds = Array.isArray(opts)
                                ? opts.map((opt: any) => opt.value)
                                : opts
                                ? [opts.value]
                                : [];
                              setForm((f) => ({
                                ...f,
                                doctorIds: selectedIds,
                              }));
                            }}
                          />
                        ) : (
                          <div className="form-control text-muted py-2 fs-13">
                            No doctors - add a doctor first
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          DOB<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="icon-field-shell">
                          <span className="icon-field-box" aria-hidden>
                            <i className="ti ti-calendar" />
                          </span>
                          <DatePicker
                            className="form-control datetimepicker w-100 icon-field-input"
                            format={{ format: "DD-MM-YYYY", type: "mask" }}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            suffixIcon={<i className="ti ti-calendar text-muted" />}
                            value={form.dob}
                            onChange={(d: Dayjs | null) =>
                              setForm((f) => ({ ...f, dob: d }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Gender<span className="text-danger ms-1">*</span>
                        </label>
                        <GenderOptionGroup
                          value={form.gender}
                          onChange={(val: GenderValue) =>
                            setForm((f) => ({ ...f, gender: val }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Blood Group<span className="text-danger ms-1">*</span>
                        </label>
                        <IconSelect
                          fieldLabel="Blood Group"
                          options={Blood_Group}
                          className="select"
                          value={
                            findSelectOption(Blood_Group, form.bloodGroup) ||
                            Blood_Group[0]
                          }
                          placeholder="Select blood group"
                          onChange={(opt) =>
                            setForm((f) => ({
                              ...f,
                              bloodGroup: opt?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3 border-top pt-3">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded"
                      style={{
                        width: 28,
                        height: 28,
                        background: "#f3e8ff",
                        color: "#7c3aed",
                      }}
                    >
                      <i className="ti ti-map-pin fs-14" />
                    </span>
                    <h6
                      className="fw-bold mb-0 pb-1"
                      style={{
                        borderBottom: "2px solid #7c3aed",
                        display: "inline-block",
                      }}
                    >
                      Address Information
                    </h6>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Address 1<span className="text-danger ms-1">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="Address 1"
                          type="text"
                          placeholder="Enter address line 1"
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
                          Address 2
                        </label>
                        <IconFormControl
                          fieldLabel="Address 2"
                          type="text"
                          placeholder="Enter address line 2 (optional)"
                          value={form.address2}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, address2: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          Country<span className="text-danger ms-1">*</span>
                        </label>
                        <IconSelect
                          fieldLabel="Country"
                          options={Country}
                          className="select"
                          value={
                            findSelectOption(Country, form.country) || Country[0]
                          }
                          placeholder="Select country"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, country: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          State<span className="text-danger ms-1">*</span>
                        </label>
                        <IconSelect
                          fieldLabel="State"
                          options={State}
                          className="select"
                          value={findSelectOption(State, form.state) || State[0]}
                          placeholder="Select state"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, state: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          City<span className="text-danger ms-1">*</span>
                        </label>
                        <IconSelect
                          fieldLabel="City"
                          options={City}
                          className="select"
                          value={findSelectOption(City, form.city) || City[0]}
                          placeholder="Select city"
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, city: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label mb-1">
                          Pincode<span className="text-danger ms-1">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="Pincode"
                          type="text"
                          placeholder="Enter pincode"
                          value={form.pincode}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, pincode: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-end mt-3">
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
