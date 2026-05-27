import { useEffect, useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { Link } from "react-router";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  Blood_Group,
  City,
  Country,
  Gender,
  State,
} from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import StaffProfileUpload from "../../../../../core/common/staff-profile-upload/StaffProfileUpload";
import { apiUrl } from "../../../../../core/config/api";
import type { ClinicStaff } from "../../../../../core/types/clinicStaff";
import {
  ROLE_OPTIONS,
  STAFF_STATUS_OPTIONS,
  emptyStaffForm,
  formatStaffDate,
  closeBootstrapModal,
  statusToLabel,
} from "../../../../../core/utils/staffForm";
import { findSelectOption } from "../../../../../core/utils/doctorSchedule";

interface DesigOption {
  id: string;
  name: string;
}

interface StaffsModalProps {
  selected: ClinicStaff | null;
  onSelect: (staff: ClinicStaff | null) => void;
  onSaved: () => void;
}

const StaffsModal = ({ selected, onSelect, onSaved }: StaffsModalProps) => {
  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  const [designations, setDesignations] = useState<DesigOption[]>([]);
  const [form, setForm] = useState(emptyStaffForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(apiUrl("/api/designations?type=Staff"), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: DesigOption[]) => setDesignations(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const desigOptions = designations.map((d) => ({ value: d.id, label: d.name }));

  const resetAddForm = () => {
    setForm(emptyStaffForm());
    setFormError(null);
  };

  const loadEditForm = (s: ClinicStaff) => {
    setForm({
      fullName: s.fullName || "",
      role: s.role || "",
      status: s.status === "Inactive" ? "Inactive" : "Active",
      designationId: s.designationId || "",
      profileImage: s.profileImage || null,
      phone: s.phone || "",
      email: s.email || "",
      dob: s.dob ? dayjs(s.dob) : null,
      gender: s.gender || "",
      bloodGroup: s.bloodGroup || "",
      address1: s.address1 || "",
      address2: s.address2 || "",
      country: s.country || "",
      state: s.state || "",
      city: s.city || "",
      pincode: s.pincode || "",
    });
    setFormError(null);
  };

  useEffect(() => {
    if (selected?.id) {
      loadEditForm(selected);
    }
  }, [selected?.id]);

  const buildPayload = () => ({
    fullName: form.fullName.trim(),
    role: form.role,
    designationId: form.designationId || null,
    profileImage: form.profileImage,
    phone: form.phone || null,
    email: form.email || null,
    dob: form.dob ? form.dob.toISOString() : null,
    gender: form.gender || null,
    bloodGroup: form.bloodGroup || null,
    address1: form.address1 || null,
    address2: form.address2 || null,
    country: form.country || null,
    state: form.state || null,
    city: form.city || null,
    pincode: form.pincode || null,
    status: form.status || "Active",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!form.role) {
      setFormError("Role is required.");
      return;
    }
    if (!form.designationId) {
      setFormError("Designation is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/staffs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add staff");
      }
      closeBootstrapModal("add_staff");
      resetAddForm();
      onSaved();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    if (!form.fullName.trim()) {
      setFormError("Name is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/staffs/${selected.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update staff");
      }
      closeBootstrapModal("edit_staff");
      onSaved();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/staffs/${selected.id}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete");
      }
      closeBootstrapModal("delete_staff");
      onSelect(null);
      onSaved();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const profileSrc =
    selected?.profileImage || "assets/img/users/user-08.jpg";
  const statusLabel = selected ? statusToLabel(selected.status) : "";

  const renderFormFields = (opts?: { showStatus?: boolean }) => (
    <>
      {formError && (
        <div className="alert alert-danger py-2 fs-13 mb-3">{formError}</div>
      )}
      <h6 className="fw-bold mb-3">Staff Information</h6>
      <div className="mb-3 d-flex align-items-center">
        <label className="form-label">Profile Image</label>
        <StaffProfileUpload
          value={form.profileImage}
          onChange={(url) => setForm((f) => ({ ...f, profileImage: url }))}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
        />
      </div>
      <div className="row mb-3 border-bottom">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label">
              Role<span className="text-danger ms-1">*</span>
            </label>
            <CommonSelect
              options={ROLE_OPTIONS}
              className="select"
              value={findSelectOption(ROLE_OPTIONS, form.role)}
              placeholder="Select role"
              onChange={(opt) => setForm((f) => ({ ...f, role: opt?.value || "" }))}
            />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label">
              Designation<span className="text-danger ms-1">*</span>
            </label>
            {desigOptions.length > 0 ? (
              <CommonSelect
                options={desigOptions}
                className="select"
                value={findSelectOption(desigOptions, form.designationId)}
                placeholder="Select designation"
                onChange={(opt) =>
                  setForm((f) => ({ ...f, designationId: opt?.value || "" }))
                }
              />
            ) : (
              <div className="form-control text-muted py-2 fs-13">
                No staff designations — add one in Designation (type: Staff)
              </div>
            )}
          </div>
        </div>
      </div>
      {opts?.showStatus && (
        <div className="mb-3">
          <label className="form-label">
            Status<span className="text-danger ms-1">*</span>
          </label>
          <CommonSelect
            options={STAFF_STATUS_OPTIONS}
            className="select"
            value={findSelectOption(STAFF_STATUS_OPTIONS, form.status)}
            placeholder="Select status"
            onChange={(opt) =>
              setForm((f) => ({ ...f, status: opt?.value || "Active" }))
            }
          />
        </div>
      )}
      <h6 className="fw-bold mb-3">Contact Information</h6>
      <div className="row row-gap-2">
        <div className="col-md-6">
          <label className="form-label">
            Phone Number<span className="text-danger ms-1">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Email<span className="text-danger ms-1">*</span>
          </label>
          <input
            type="email"
            className="form-control"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
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
              onChange={(d: Dayjs | null) => setForm((f) => ({ ...f, dob: d }))}
            />
            <span className="input-icon-addon">
              <i className="ti ti-calendar" />
            </span>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Gender<span className="text-danger ms-1">*</span>
          </label>
          <CommonSelect
            options={Gender}
            className="select"
            value={findSelectOption(Gender, form.gender) || Gender[0]}
            onChange={(opt) => setForm((f) => ({ ...f, gender: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label">
            Blood Group<span className="text-danger ms-1">*</span>
          </label>
          <CommonSelect
            options={Blood_Group}
            className="select"
            value={findSelectOption(Blood_Group, form.bloodGroup) || Blood_Group[0]}
            onChange={(opt) => setForm((f) => ({ ...f, bloodGroup: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Address 1</label>
          <input
            type="text"
            className="form-control"
            value={form.address1}
            onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Address 2</label>
          <input
            type="text"
            className="form-control"
            value={form.address2}
            onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Country</label>
          <CommonSelect
            options={Country}
            className="select"
            value={findSelectOption(Country, form.country) || Country[0]}
            onChange={(opt) => setForm((f) => ({ ...f, country: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State</label>
          <CommonSelect
            options={State}
            className="select"
            value={findSelectOption(State, form.state) || State[0]}
            onChange={(opt) => setForm((f) => ({ ...f, state: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">City</label>
          <CommonSelect
            options={City}
            className="select"
            value={findSelectOption(City, form.city) || City[0]}
            onChange={(opt) => setForm((f) => ({ ...f, city: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Pincode</label>
          <input
            type="text"
            className="form-control"
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* View */}
      <div id="view_staff" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="fw-bold modal-title">Staff Details</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {selected ? (
                <>
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          <ImageWithBasePath
                            src={profileSrc}
                            alt="img"
                            className="img-fluid avatar avatar-xxl rounded"
                          />
                        </div>
                        <div>
                          {selected.staffCode && (
                            <span className="text-primary mb-1 d-block">
                              #{selected.staffCode}
                            </span>
                          )}
                          <div className="d-flex align-items-center mb-1">
                            <h5 className="fw-bold mb-0 me-2">{selected.fullName}</h5>
                            <span
                              className={`badge fw-medium fs-13 ${
                                statusLabel === "Available"
                                  ? "badge-soft-success border border-success"
                                  : "badge-soft-danger border border-danger"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mb-0">
                            {selected.designation?.name || "—"} · {selected.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row row-gap-2 mt-3">
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">Gender</p>
                      <p className="fs-13">{selected.gender || "—"}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">Phone</p>
                      <p className="fs-13">{selected.phone || "—"}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">Email</p>
                      <p className="fs-13">{selected.email || "—"}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">DOB</p>
                      <p className="fs-13">{formatStaffDate(selected.dob)}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">Date of Joining</p>
                      <p className="fs-13">{formatStaffDate(selected.dateOfJoining)}</p>
                    </div>
                    <div className="col-md-4">
                      <p className="text-dark fs-13 fw-medium mb-0">Blood Group</p>
                      <p className="fs-13">{selected.bloodGroup || "—"}</p>
                    </div>
                    <div className="col-md-12">
                      <p className="text-dark fs-13 fw-medium mb-0">Address</p>
                      <p className="fs-13">
                        {[selected.address1, selected.address2, selected.city, selected.state, selected.country, selected.pincode]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">Select a staff member from the list.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add */}
      <div id="add_staff" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="fw-bold modal-title">New Staff</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form
              onSubmit={handleAdd}
              onFocus={() => {
                if (!form.fullName && !form.role) resetAddForm();
              }}
            >
              <div className="modal-body">{renderFormFields()}</div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={(e) => e.stopPropagation()}
                >
                  {submitting ? "Saving…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit */}
      <div id="edit_staff" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="fw-bold modal-title">Edit Staff</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">{renderFormFields({ showStatus: true })}</div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={(e) => e.stopPropagation()}
                >
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="modal fade" id="delete_staff">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-n1"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-n1"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">
                Delete <strong>{selected?.fullName}</strong>?
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffsModal;
