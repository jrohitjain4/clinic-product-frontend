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
        primaryDoctorId: patient.primaryDoctorId || "",
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

  // ── Phone Duplicate Check ──────────────────────────────────────
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
    primaryDoctorId: form.primaryDoctorId || null,
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
    if (!form.primaryDoctorId) {
      setFormError("Primary doctor is required.");
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
              <div className="card">
                <div className="card-body pb-0">
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      {formError}
                    </div>
                  )}
                  <h6 className="fw-bold mb-3">Patient Information</h6>
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="mb-3 d-flex align-items-center">
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
                          First Name<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
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
                        <input
                          type="text"
                          className="form-control"
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
                        <PhoneInput
                          defaultCountry="US"
                          value={form.phone}
                          onChange={(v) =>
                            setForm((f) => ({ ...f, phone: v || "" }))
                          }
                        />
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
                        <input
                          type="email"
                          className="form-control"
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
                          Primary Doctor<span className="text-danger ms-1">*</span>
                        </label>
                        {doctorOptions.length > 0 ? (
                          <CommonSelect
                            options={doctorOptions}
                            className="select"
                            value={findSelectOption(
                              doctorOptions,
                              form.primaryDoctorId
                            )}
                            placeholder="Select doctor"
                            onChange={(opt) =>
                              setForm((f) => ({
                                ...f,
                                primaryDoctorId: opt?.value || "",
                              }))
                            }
                          />
                        ) : (
                          <div className="form-control text-muted py-2 fs-13">
                            No doctors — add a doctor first
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          DOB<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker w-100"
                            format={{ format: "DD-MM-YYYY", type: "mask" }}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            suffixIcon={null}
                            value={form.dob}
                            onChange={(d: Dayjs | null) =>
                              setForm((f) => ({ ...f, dob: d }))
                            }
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Gender<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={Gender}
                          className="select"
                          value={findSelectOption(Gender, form.gender) || Gender[0]}
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, gender: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Blood Group<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={Blood_Group}
                          className="select"
                          value={
                            findSelectOption(Blood_Group, form.bloodGroup) ||
                            Blood_Group[0]
                          }
                          onChange={(opt) =>
                            setForm((f) => ({
                              ...f,
                              bloodGroup: opt?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Status<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={PATIENT_STATUS_OPTIONS}
                          className="select"
                          value={findSelectOption(
                            PATIENT_STATUS_OPTIONS,
                            form.status
                          )}
                          onChange={(opt) =>
                            setForm((f) => ({
                              ...f,
                              status: opt?.value || "Active",
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <h6 className="fw-bold mb-3 border-top pt-3">
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
                          Address 2<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
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
                        <CommonSelect
                          options={Country}
                          className="select"
                          value={
                            findSelectOption(Country, form.country) || Country[0]
                          }
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
                        <CommonSelect
                          options={State}
                          className="select"
                          value={findSelectOption(State, form.state) || State[0]}
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
                        <CommonSelect
                          options={City}
                          className="select"
                          value={findSelectOption(City, form.city) || City[0]}
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
                        <input
                          type="text"
                          className="form-control"
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
          2025 © <span className="link-primary">Preclinic</span>, All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default PatientFormPage;
