import { useEffect, useState } from "react";
import { Modal, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Blood_Group,
  City,
  Country,
  State,
} from "../../../../../../core/common/selectOption";
import {
  IconFormControl,
  IconSelect,
  GenderOptionGroup,
  StatusOptionGroup,
} from "../../../../../../core/common/form-fields";
import type {
  GenderValue,
  PatientStatusValue,
} from "../../../../../../core/common/form-fields";
import "../../../../../../core/common/form-fields/IconField.scss";
import { apiUrl } from "../../../../../../core/config/api";
import { authHeaders } from "../../../../../../core/utils/apiClient";
import { findSelectOption } from "../../../../../../core/utils/doctorSchedule";
import { emptyPatientForm } from "../../../../../../core/utils/patientForm";
import PatientProfileUpload from "../../../../../../core/common/patient-profile-upload/PatientProfileUpload";

interface AddPatientModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: (newPatient: any) => void;
}

const AddPatientModal = ({ show, onHide, onSuccess }: AddPatientModalProps) => {
  const [form, setForm] = useState(emptyPatientForm);
  const [doctors, setDoctors] = useState<{ id: string; fullName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setForm(emptyPatientForm);
      setError(null);
      fetch(apiUrl("/api/doctors"), {
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((data) => setDoctors(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [show]);

  useEffect(() => {
    if (!form.phone || form.phone.length < 5) {
      setPhoneWarning(null);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/patients?search=${form.phone}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          if (data.some((p: any) => p.phone === form.phone)) {
            setPhoneWarning(
              "Warning: This phone number is already registered for another patient."
            );
          } else {
            setPhoneWarning(null);
          }
        } else {
          setPhoneWarning(null);
        }
      })
      .catch(() => setPhoneWarning(null));
  }, [form.phone]);

  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label: d.fullName,
  }));

  const handleSubmit = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.doctorIds ||
      form.doctorIds.length === 0
    ) {
      setError("First name, Last name and Doctors are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/patients"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
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
          country: form.country || "USA",
          state: form.state || "California",
          city: form.city || "Los Angeles",
          pincode: form.pincode || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create patient");
      }

      const createdPatient = await res.json();
      onSuccess(createdPatient);
      onHide();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      width={900}
      centered
      closable={false}
      className="add-patient-modal-match"
      styles={{
        content: {
          padding: 0,
          borderRadius: 12,
          overflow: "hidden",
          border: "none",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.1)",
        },
        body: { padding: 0 },
      }}
    >
      <style>{`
        .add-patient-modal-match .ant-modal-content {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1) !important;
          padding: 0 !important;
        }
        .add-patient-modal-match .ant-modal-body {
          padding: 0 !important;
        }
      `}</style>

      {/* Header — same as create-patient page */}
      <div
        className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom"
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
            <i className="ti ti-user-plus fs-20" />
          </div>
          <div>
            <h5 className="mb-0 fw-bold" style={{ color: "#1e1b4b", fontSize: 18 }}>
              Add New Patient
            </h5>
            <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
              Enter patient details to register in the system
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onHide}
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
        </button>
      </div>

      <div
        className="px-4 pt-3 pb-2"
        style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
      >
        {error && (
          <div className="alert alert-danger py-2 fs-13 mb-3">{error}</div>
        )}

        <h6 className="fw-bold mb-3">Patient Information</h6>
        <div className="row">
          <div className="col-lg-12">
            <div className="mb-3 d-flex align-items-center">
              <label className="form-label mb-0 me-3">Profile Image</label>
              <PatientProfileUpload
                value={form.profileImage}
                onChange={(url) => setForm((f) => ({ ...f, profileImage: url }))}
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
                  onChange={(v) => setForm((f) => ({ ...f, phone: v || "" }))}
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
                    setForm((f) => ({ ...f, doctorIds: selectedIds }));
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
                  getPopupContainer={() => document.body}
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
                  findSelectOption(Blood_Group, form.bloodGroup) || Blood_Group[0]
                }
                placeholder="Select blood group"
                onChange={(opt) =>
                  setForm((f) => ({ ...f, bloodGroup: opt?.value || "" }))
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
                  setForm((f) => ({ ...f, status: val || "Active" }))
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
              <label className="form-label mb-1 fw-medium">Address 2</label>
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
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label mb-1 fw-medium">
                Country<span className="text-danger ms-1">*</span>
              </label>
              <IconSelect
                fieldLabel="Country"
                options={Country}
                className="select"
                value={findSelectOption(Country, form.country) || Country[0]}
                placeholder="Select country"
                onChange={(opt) =>
                  setForm((f) => ({ ...f, country: opt?.value || "" }))
                }
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label mb-1 fw-medium">
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
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label mb-1 fw-medium">
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
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label mb-1 fw-medium">
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

      <div className="d-flex align-items-center justify-content-end gap-2 px-4 py-3 border-top bg-white">
        <button
          type="button"
          className="btn btn-light"
          onClick={onHide}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Add New Patient"}
        </button>
      </div>
    </Modal>
  );
};

export default AddPatientModal;
