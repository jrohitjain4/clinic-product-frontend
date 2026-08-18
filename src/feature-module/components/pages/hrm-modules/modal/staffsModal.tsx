import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  Blood_Group,
  City,
  Country,
  State,
} from "../../../../../core/common/selectOption";
import {
  IconFormControl,
  IconSelect,
  GenderOptionGroup,
} from "../../../../../core/common/form-fields";
import StaffProfileUpload from "../../../../../core/common/staff-profile-upload/StaffProfileUpload";
import { apiUrl } from "../../../../../core/config/api";
import type { ClinicStaff } from "../../../../../core/types/clinicStaff";
import { toast } from "react-toastify";
import {
  STAFF_STATUS_OPTIONS,
  emptyStaffForm,
  formatStaffDate,
  closeBootstrapModal,
  statusToLabel,
} from "../../../../../core/utils/staffForm";
import { findSelectOption } from "../../../../../core/utils/doctorSchedule";
import { getPhoneValidationError } from "../../../../../core/utils/phoneValidation";

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
  const navigate = useNavigate();
  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  const [designations, setDesignations] = useState<DesigOption[]>([]);
  const [clinicRoles, setClinicRoles] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState(emptyStaffForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [setupAlert, setSetupAlert] = useState<{ type: string, message: string, route: string } | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [addingRole, setAddingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [showDesigForm, setShowDesigForm] = useState(false);
  const [newDesigName, setNewDesigName] = useState("");
  const [newDesigDeptId, setNewDesigDeptId] = useState("");
  const [addingDesig, setAddingDesig] = useState(false);
  const [desigError, setDesigError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const handleInlineAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setAddingRole(true);
    setRoleError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/clinic-roles"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newRoleName.trim(), status: "Active" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create role");
      }
      const newRole = await res.json();
      toast.success("Role created successfully");
      setClinicRoles(prev => [...prev, newRole]);
      setNewRoleName("");
      setShowRoleForm(false);
    } catch (err: any) {
      setRoleError(err.message || "Failed to create role");
      toast.error(err.message || "Failed to create role");
    } finally {
      setAddingRole(false);
    }
  };

  const handleInlineAddDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigName.trim()) return;
    setAddingDesig(true);
    setDesigError(null);
    try {
      const token = localStorage.getItem("token");
      let deptId = newDesigDeptId;
      
      // If no department is selected/exists, create a default "General" department first
      if (!deptId) {
        if (departments.length > 0) {
          deptId = departments[0].id;
        } else {
          const deptRes = await fetch(apiUrl("/api/departments"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: "General", status: "Active" }),
          });
          if (!deptRes.ok) {
            const err = await deptRes.json().catch(() => ({}));
            throw new Error(err.message || "Failed to create default department");
          }
          const newDept = await deptRes.json();
          deptId = newDept.id;
          setDepartments([newDept]);
        }
      }

      const res = await fetch(apiUrl("/api/designations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDesigName.trim(),
          type: "Staff",
          description: "",
          departmentId: deptId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create designation");
      }
      const newDesig = await res.json();
      toast.success("Designation created successfully");
      setDesignations(prev => [...prev, newDesig]);
      setNewDesigName("");
      setShowDesigForm(false);
    } catch (err: any) {
      setDesigError(err.message || "Failed to create designation");
      toast.error(err.message || "Failed to create designation");
    } finally {
      setAddingDesig(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    setLoadingSetup(true);
    Promise.all([
      fetch(apiUrl("/api/designations?type=Staff"), { headers }).then(r => r.json()).catch(() => []),
      fetch(apiUrl("/api/clinic-roles"), { headers }).then(r => r.json()).catch(() => []),
      fetch(apiUrl("/api/departments"), { headers }).then(r => r.json()).catch(() => [])
    ]).then(([desigsData, rolesData, deptsData]) => {
      setDesignations(Array.isArray(desigsData) ? desigsData : []);
      setClinicRoles(Array.isArray(rolesData) ? rolesData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData.filter((d: any) => d.status === "Active") : []);
    }).finally(() => {
      setLoadingSetup(false);
    });
  }, []);

  const desigOptions = designations.map((d) => ({ value: d.id, label: d.name }));
  const dynamicRoleOptions = clinicRoles.map(r => ({ value: r.name, label: r.name }));

  const resetAddForm = () => {
    setForm(emptyStaffForm());
    setFormError(null);
    setShowRoleForm(false);
    setShowDesigForm(false);
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

    const phoneErr = getPhoneValidationError(form.phone, "Staff phone number", false);
    if (phoneErr) {
      setFormError(phoneErr);
      toast.error(phoneErr);
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
      toast.success("Staff member added successfully");
      closeBootstrapModal("add_staff");
      resetAddForm();
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add staff";
      setFormError(msg);
      toast.error(msg);
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

    const phoneErr = getPhoneValidationError(form.phone, "Staff phone number", false);
    if (phoneErr) {
      setFormError(phoneErr);
      toast.error(phoneErr);
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
      toast.success("Staff member updated successfully");
      closeBootstrapModal("edit_staff");
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update staff";
      setFormError(msg);
      toast.error(msg);
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
      toast.success(`${selected.fullName} deleted successfully`);
      closeBootstrapModal("delete_staff");
      onSelect(null);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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
        <IconFormControl
          fieldLabel="Name"
          type="text"
          placeholder="Enter full name"
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
            {clinicRoles.length > 0 ? (
              <IconSelect
                fieldLabel="Role"
                options={dynamicRoleOptions}
                className="select"
                value={findSelectOption(dynamicRoleOptions, form.role)}
                placeholder="Select role"
                onChange={(opt) => setForm((f) => ({ ...f, role: opt?.value || "" }))}
              />
            ) : (
              <div className="form-control bg-light text-muted py-2 fs-13">
                No Role
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label">
              Designation<span className="text-danger ms-1">*</span>
            </label>
            {desigOptions.length > 0 ? (
              <IconSelect
                fieldLabel="Designation"
                options={desigOptions}
                className="select"
                value={findSelectOption(desigOptions, form.designationId)}
                placeholder="Select designation"
                onChange={(opt) =>
                  setForm((f) => ({ ...f, designationId: opt?.value || "" }))
                }
              />
            ) : (
              <div className="form-control bg-light text-muted py-2 fs-13">
                No Designation
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
          <IconSelect
            fieldLabel="Status"
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
          <IconFormControl
            fieldLabel="Phone Number"
            type="text"
            placeholder="Enter phone number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Email<span className="text-danger ms-1">*</span>
          </label>
          <IconFormControl
            fieldLabel="Email"
            type="email"
            placeholder="Enter email address"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          {!selected && (
            <small className="text-success d-block mt-1" style={{ fontSize: "11px" }}>
              <i className="ti ti-mail me-1" />
              If email is provided, login credentials will be auto-emailed to the staff member.
            </small>
          )}
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
          <GenderOptionGroup
            value={form.gender}
            onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label">
            Blood Group<span className="text-danger ms-1">*</span>
          </label>
          <IconSelect
            fieldLabel="Blood Group"
            options={Blood_Group}
            className="select"
            value={findSelectOption(Blood_Group, form.bloodGroup) || Blood_Group[0]}
            onChange={(opt) => setForm((f) => ({ ...f, bloodGroup: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Address 1</label>
          <IconFormControl
            fieldLabel="Address 1"
            type="text"
            placeholder="Enter address line 1"
            value={form.address1}
            onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Address 2</label>
          <IconFormControl
            fieldLabel="Address 2"
            type="text"
            placeholder="Enter address line 2"
            value={form.address2}
            onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Country</label>
          <IconSelect
            fieldLabel="Country"
            options={Country}
            className="select"
            value={findSelectOption(Country, form.country) || Country[0]}
            onChange={(opt) => setForm((f) => ({ ...f, country: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State</label>
          <IconSelect
            fieldLabel="State"
            options={State}
            className="select"
            value={findSelectOption(State, form.state) || State[0]}
            onChange={(opt) => setForm((f) => ({ ...f, state: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">City</label>
          <IconSelect
            fieldLabel="City"
            options={City}
            className="select"
            value={findSelectOption(City, form.city) || City[0]}
            onChange={(opt) => setForm((f) => ({ ...f, city: opt?.value || "" }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Pincode</label>
          <IconFormControl
            fieldLabel="Pincode"
            type="text"
            placeholder="Enter pincode"
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
          />
        </div>
      </div>
    </>
  );

  const renderModalContent = (isEdit: boolean, formSubmit: (e: React.FormEvent) => void) => {
    if (loadingSetup) {
      return (
        <div className="modal-body p-5 text-center">
          <span className="spinner-border text-primary" />
          <p className="mt-2 text-muted">Checking prerequisites...</p>
        </div>
      );
    }
    
    if (clinicRoles.length === 0) {
      if (!showRoleForm) {
        return (
          <div className="modal-body p-4 text-center">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle">
                <i className="ti ti-alert-triangle fs-36" />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Setup Required</h5>
            <p className="text-muted mb-4">
              There is no role. Please add a role first.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-light px-4" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
              <button type="button" className="btn btn-primary px-4" onClick={() => setShowRoleForm(true)} style={{ borderRadius: '6px' }}>
                Add a Role
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <form onSubmit={handleInlineAddRole}>
            <div className="modal-body">
              {roleError && (
                <div className="alert alert-danger py-2 fs-13 mb-3">{roleError}</div>
              )}
              <div className="mb-3">
                <label className="form-label mb-1 text-dark fs-14 fw-medium">Role Name <span className="text-danger">*</span></label>
                <IconFormControl
                  fieldLabel="Role"
                  type="text"
                  placeholder="Enter role name (e.g. Accountant)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                <IconSelect
                  fieldLabel="Status"
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" }
                  ]}
                  className="select"
                  value={{ value: "Active", label: "Active" }}
                  onChange={() => {}}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-4 shadow-sm" onClick={() => setShowRoleForm(false)} style={{ borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={addingRole} style={{ borderRadius: '6px' }}>
                  {addingRole && <i className="fa fa-spinner fa-spin me-2" />}
                  {addingRole ? "Saving..." : "Save Role"}
                </button>
              </div>
            </div>
          </form>
        );
      }
    }

    if (designations.length === 0) {
      if (!showDesigForm) {
        return (
          <div className="modal-body p-4 text-center">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle">
                <i className="ti ti-alert-triangle fs-36" />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Setup Required</h5>
            <p className="text-muted mb-4">
              There is no designation. Please add a designation first.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-light px-4" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
              <button type="button" className="btn btn-primary px-4" onClick={() => setShowDesigForm(true)} style={{ borderRadius: '6px' }}>
                Add Designation
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <form onSubmit={handleInlineAddDesig}>
            <div className="modal-body">
              {desigError && (
                <div className="alert alert-danger py-2 fs-13 mb-3">{desigError}</div>
              )}
              {departments.length > 0 ? (
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Department <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={newDesigDeptId}
                    onChange={(e) => setNewDesigDeptId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="alert alert-info py-2 px-3 fs-13 mb-3">
                  <i className="ti ti-info-circle me-1 text-info" />
                  No departments found. A default department <strong>"General"</strong> will be automatically created.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label mb-1 text-dark fs-14 fw-medium">Designation Name <span className="text-danger">*</span></label>
                <IconFormControl
                  fieldLabel="Designation"
                  type="text"
                  placeholder="e.g. Senior Nurse, Accountant"
                  value={newDesigName}
                  onChange={(e) => setNewDesigName(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-4 shadow-sm" onClick={() => setShowDesigForm(false)} style={{ borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={addingDesig} style={{ borderRadius: '6px' }}>
                  {addingDesig && <i className="fa fa-spinner fa-spin me-2" />}
                  {addingDesig ? "Saving..." : "Save Designation"}
                </button>
              </div>
            </div>
          </form>
        );
      }
    }

    return (
      <form
        onSubmit={formSubmit}
        onFocus={() => {
          if (!isEdit && !form.fullName && !form.role) resetAddForm();
        }}
      >
        <div className="modal-body">
          {renderFormFields({ showStatus: isEdit })}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-light px-4 shadow-sm"
              data-bs-dismiss="modal"
              style={{ borderRadius: '6px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center"
              disabled={submitting}
              onClick={(e) => e.stopPropagation()}
              style={{ borderRadius: '6px' }}
            >
              {submitting && <i className="fa fa-spinner fa-spin me-2" />}
              {submitting ? "Saving…" : (isEdit ? "Save Changes" : "Add Staff")}
            </button>
          </div>
        </div>
      </form>
    );
  };

  const isAlert = !loadingSetup && (clinicRoles.length === 0 || designations.length === 0);

  return (
    <>


      {/* Add */}
      <div id="add_staff" className="modal fade" role="dialog">
        <div className={`modal-dialog modal-dialog-centered ${isAlert ? "" : "modal-lg"}`}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{showRoleForm ? "Add New Role" : showDesigForm ? "Add New Designation" : "New Staff"}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            {renderModalContent(false, handleAdd)}
          </div>
        </div>
      </div>

      {/* Edit */}
      <div id="edit_staff" className="modal fade" role="dialog">
        <div className={`modal-dialog modal-dialog-centered ${isAlert ? "" : "modal-lg"}`}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Edit Staff</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            {renderModalContent(true, handleEdit)}
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
