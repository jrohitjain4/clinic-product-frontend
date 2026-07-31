import { useEffect, useState } from "react";
import { Modal, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "react-toastify";
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
import { apiGet, apiPost, authHeaders } from "../../../../../../core/utils/apiClient";
import { findSelectOption } from "../../../../../../core/utils/doctorSchedule";
import { emptyPatientForm } from "../../../../../../core/utils/patientForm";
import PatientProfileUpload from "../../../../../../core/common/patient-profile-upload/PatientProfileUpload";

type ReferOption = { id: string; name: string; description?: string };

interface AddPatientModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: (newPatient: any) => void;
}

const AddPatientModal = ({ show, onHide, onSuccess }: AddPatientModalProps) => {
  const [form, setForm] = useState(emptyPatientForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  const [refers, setRefers] = useState<ReferOption[]>([]);
  const [showAddReferModal, setShowAddReferModal] = useState(false);
  const [newReferName, setNewReferName] = useState("");
  const [newReferDesc, setNewReferDesc] = useState("");
  const [addingRefer, setAddingRefer] = useState(false);
  const [referError, setReferError] = useState<string | null>(null);

  const fetchRefers = async () => {
    try {
      const data = await apiGet<ReferOption[]>("/api/refers");
      setRefers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (show) {
      setForm(emptyPatientForm);
      setError(null);
      setPhoneWarning(null);
      fetchRefers();
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

  const referOptions = refers.map((r) => ({
    value: r.id,
    label: r.description ? `${r.name} — ${r.description}` : r.name,
  }));

  const handleAddNewRefer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferName.trim()) return;
    setAddingRefer(true);
    setReferError(null);
    try {
      const created = await apiPost<ReferOption>("/api/refers", {
        name: newReferName.trim(),
        description: newReferDesc.trim() || null,
      });
      toast.success("Refer source added successfully!");
      await fetchRefers();
      setForm((f) => ({
        ...f,
        referId: created.id,
        referredBy: created.name,
      }));
      setShowAddReferModal(false);
      setNewReferName("");
      setNewReferDesc("");
    } catch (err: unknown) {
      setReferError(err instanceof Error ? err.message : "Error adding refer");
    } finally {
      setAddingRefer(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!form.lastName.trim()) {
      setError("Last name is required.");
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
          doctorIds: form.doctorIds || [],
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
          referredBy: form.referredBy || null,
          referId: form.referId || null,
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
    <>
      <Modal
        open={show}
        onCancel={onHide}
        footer={null}
        width={900}
        centered
        closable={false}
        className="add-patient-modal-match"
        zIndex={1050}
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
            <div className="col-md-6">
              <div className="mb-3 d-flex align-items-center gap-2">
                <label className="form-label mb-0">Profile Image</label>
                <PatientProfileUpload
                  value={form.profileImage}
                  onChange={(url) => setForm((f) => ({ ...f, profileImage: url }))}
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
                  Email Address{" "}
                  <span className="text-muted fw-normal fs-12">(Optional)</span>
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
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label mb-0 fw-medium">Referred By</label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-0 px-2"
                    style={{ fontSize: "12px" }}
                    onClick={() => {
                      setShowAddReferModal(true);
                      setNewReferName("");
                      setNewReferDesc("");
                      setReferError(null);
                    }}
                  >
                    <i className="ti ti-plus me-1" />
                    Add New
                  </button>
                </div>
                <IconSelect
                  fieldLabel="Referred By"
                  options={referOptions}
                  className="select"
                  value={
                    referOptions.find((opt) => opt.value === form.referId) || null
                  }
                  placeholder="Select refer source"
                  isClearable
                  onChange={(opt) => {
                    const selected = refers.find(
                      (r) => r.id === (opt?.value || "")
                    );
                    setForm((f) => ({
                      ...f,
                      referId: opt?.value || "",
                      referredBy: selected ? selected.name : "",
                    }));
                  }}
                />
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
                  Blood Group{" "}
                  <span className="text-muted fw-normal fs-12">(Optional)</span>
                </label>
                <IconSelect
                  fieldLabel="Blood Group"
                  options={Blood_Group}
                  className="select"
                  value={findSelectOption(Blood_Group, form.bloodGroup) || null}
                  placeholder="Select blood group"
                  isClearable
                  onChange={(opt) =>
                    setForm((f) => ({ ...f, bloodGroup: opt?.value || "" }))
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
              Address Information{" "}
              <span className="text-muted fw-normal fs-12">(Optional)</span>
            </h6>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label mb-1 fw-medium">Address 1</label>
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
                <label className="form-label mb-1 fw-medium">Country</label>
                <IconSelect
                  fieldLabel="Country"
                  options={Country}
                  className="select"
                  value={findSelectOption(Country, form.country) || null}
                  placeholder="Select country"
                  isClearable
                  onChange={(opt) =>
                    setForm((f) => ({ ...f, country: opt?.value || "" }))
                  }
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label mb-1 fw-medium">State</label>
                <IconSelect
                  fieldLabel="State"
                  options={State}
                  className="select"
                  value={findSelectOption(State, form.state) || null}
                  placeholder="Select state"
                  isClearable
                  onChange={(opt) =>
                    setForm((f) => ({ ...f, state: opt?.value || "" }))
                  }
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label mb-1 fw-medium">City</label>
                <IconSelect
                  fieldLabel="City"
                  options={City}
                  className="select"
                  value={findSelectOption(City, form.city) || null}
                  placeholder="Select city"
                  isClearable
                  onChange={(opt) =>
                    setForm((f) => ({ ...f, city: opt?.value || "" }))
                  }
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label mb-1 fw-medium">Pincode</label>
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

      {showAddReferModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddReferModal(false);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: "12px", overflow: "hidden" }}
            >
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white">Add New Refer Source</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddReferModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleAddNewRefer}>
                <div className="modal-body p-4">
                  {referError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      {referError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Refer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Google, Walk-in, Doctor Referral"
                      value={newReferName}
                      onChange={(e) => setNewReferName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-medium">
                      Description{" "}
                      <span className="text-muted fw-normal fs-12">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter Description"
                      value={newReferDesc}
                      onChange={(e) => setNewReferDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-light px-4 shadow-sm"
                    onClick={() => setShowAddReferModal(false)}
                    style={{ borderRadius: "6px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 shadow-sm"
                    disabled={addingRefer || !newReferName.trim()}
                    style={{ borderRadius: "6px" }}
                  >
                    {addingRefer ? "Saving..." : "Add Refer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPatientModal;
