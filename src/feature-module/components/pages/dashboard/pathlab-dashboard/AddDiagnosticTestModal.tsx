import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { useLabTests } from "../../../../../core/hooks/useLabTests";
import { useLabCategories } from "../../../../../core/hooks/useLabCategories";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicStaff } from "../../../../../core/hooks/useClinicStaff";
import DuplicateForms from "../../../../../core/common/duplicate-forms/duplicateForms";
import type { RowType } from "../../../../../core/common/duplicate-forms/duplicateForms.types";
import { IconFormControl, IconTextarea } from "../../../../../core/common/form-fields";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const emptySchedules = () => ({
  Monday: [] as RowType[],
  Tuesday: [] as RowType[],
  Wednesday: [] as RowType[],
  Thursday: [] as RowType[],
  Friday: [] as RowType[],
  Saturday: [] as RowType[],
  Sunday: [] as RowType[],
});

const AddDiagnosticTestModal = ({ open, onClose, onCreated }: Props) => {
  const { createTest } = useLabTests();
  const { categories: categoryList } = useLabCategories();
  const { doctors } = useClinicDoctors();
  const { staffs: staff } = useClinicStaff();

  const doctorOptions = useMemo(
    () => doctors?.map((d: any) => ({ value: d.id, label: d.fullName })) || [],
    [doctors]
  );
  const staffOptions = useMemo(
    () => staff?.map((s: any) => ({ value: s.id, label: s.fullName })) || [],
    [staff]
  );

  const [formName, setFormName] = useState("");
  const [formShortName, setFormShortName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formHomeCharge, setFormHomeCharge] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPrep, setFormPrep] = useState("");
  const [formAssignment, setFormAssignment] = useState("Staff");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formIsSlotBookingEnabled, setFormIsSlotBookingEnabled] = useState(false);
  const [formSlotDuration, setFormSlotDuration] = useState("");
  const [formMaxBookingsPerSlot, setFormMaxBookingsPerSlot] = useState("");
  const [formAssignedDoctors, setFormAssignedDoctors] = useState<any[]>([]);
  const [formAssignedStaff, setFormAssignedStaff] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, RowType[]>>(emptySchedules);
  const [lockedDays, setLockedDays] = useState<Record<string, boolean>>({});
  const [activeScheduleDay, setActiveScheduleDay] = useState<string>("Monday");

  const resetForm = () => {
    setFormName("");
    setFormShortName("");
    setFormDesc("");
    setFormPrice("");
    setFormHomeCharge("");
    setFormDuration("");
    setFormPrep("");
    setFormAssignment("Staff");
    setFormStatus("Active");
    setFormCategoryId("");
    setFormIsSlotBookingEnabled(false);
    setFormSlotDuration("");
    setFormMaxBookingsPerSlot("");
    setFormAssignedDoctors([]);
    setFormAssignedStaff([]);
    setSchedules(emptySchedules());
    setLockedDays({});
    setActiveScheduleDay("Monday");
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const serializeSchedules = (raw: Record<string, RowType[]>) => {
    const out: Record<string, { session: string; from: string; to: string }[]> = {};
    for (const [day, rows] of Object.entries(raw)) {
      if (!rows?.length || !lockedDays[day]) continue;
      out[day] = rows.map((r) => ({
        session: r.session,
        from: r.from?.format?.("HH:mm:ss") ?? "00:00:00",
        to: r.to?.format?.("HH:mm:ss") ?? "00:00:00",
      }));
    }
    return Object.keys(out).length ? out : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Test Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createTest({
        name: formName.trim(),
        shortName: formShortName.trim(),
        description: formDesc.trim(),
        price: parseFloat(formPrice) || 0,
        homeCollectionCharge: parseFloat(formHomeCharge) || 0,
        duration: formDuration.trim(),
        preparationInfo: formPrep.trim(),
        assignment: formAssignment,
        status: formStatus,
        categoryId: formCategoryId || null,
        isSlotBookingEnabled: formIsSlotBookingEnabled,
        slotDuration: formSlotDuration,
        maxBookingsPerSlot: formMaxBookingsPerSlot,
        assignedDoctors: formAssignedDoctors,
        assignedStaff: formAssignedStaff,
        schedules: serializeSchedules(schedules),
      });
      toast.success("Test added successfully!");
      onClose();
      onCreated?.();
    } catch {
      /* handled in hook */
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title text-white">Add Diagnostic Test</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Test Name <span className="text-danger">*</span>
                  </label>
                  <IconFormControl
                    fieldLabel="name"
                    type="text"
                    placeholder="e.g. Complete Blood Count"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Short Name <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <IconFormControl
                    fieldLabel="name"
                    type="text"
                    placeholder="e.g. CBC"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                  />
                </div>
              </div>
              <div className="row">
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                  >
                    <option value="">No Category</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Test Fee (₹) <span className="text-danger">*</span>
                  </label>
                  <IconFormControl
                    fieldLabel="price"
                    type="number"
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    min="0"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Home Collection Charge (₹) <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <IconFormControl
                    fieldLabel="price"
                    type="number"
                    placeholder="e.g. 500"
                    value={formHomeCharge}
                    onChange={(e) => setFormHomeCharge(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Estimated Duration <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <IconFormControl
                    fieldLabel="time"
                    type="text"
                    placeholder="e.g. 2 Hours, 1 Day"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Assigned Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formAssignment}
                    onChange={(e) => setFormAssignment(e.target.value)}
                    required
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Staff">Staff</option>
                    <option value="Multiple">Multiple (Both)</option>
                  </select>
                </div>
              </div>
              {(formAssignment === "Doctor" || formAssignment === "Multiple") && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Assigned Doctors</label>
                  <Select
                    isMulti
                    options={doctorOptions}
                    value={formAssignedDoctors}
                    onChange={(selected: any) => setFormAssignedDoctors(selected || [])}
                    placeholder="Select Doctors..."
                  />
                </div>
              )}
              {(formAssignment === "Staff" || formAssignment === "Multiple") && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Assigned Staff</label>
                  <Select
                    isMulti
                    options={staffOptions}
                    value={formAssignedStaff}
                    onChange={(selected: any) => setFormAssignedStaff(selected || [])}
                    placeholder="Select Staff Members..."
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Preparation Instructions <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <IconTextarea
                  fieldLabel="notes"
                  rows={2}
                  placeholder="e.g. Fasting for 10-12 hours required."
                  value={formPrep}
                  onChange={(e) => setFormPrep(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Description <span className="text-muted fw-normal">(Optional)</span>
                </label>
                <IconTextarea
                  fieldLabel="description"
                  rows={2}
                  placeholder="Enter a detailed description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Status <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Enable Slot Booking</label>
                <div className="form-check form-switch mt-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formIsSlotBookingEnabled}
                    onChange={(e) => setFormIsSlotBookingEnabled(e.target.checked)}
                    id="dashAddSlotBookingToggle"
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    className="form-check-label ms-2"
                    htmlFor="dashAddSlotBookingToggle"
                    style={{ cursor: "pointer" }}
                  >
                    {formIsSlotBookingEnabled ? "Yes" : "No"}
                  </label>
                </div>
              </div>
              {formIsSlotBookingEnabled && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Slot Duration (Minutes) <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="time"
                        type="number"
                        value={formSlotDuration}
                        onChange={(e) => setFormSlotDuration(e.target.value)}
                        placeholder="e.g. 15"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Max Bookings Per Slot <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="quantity"
                        type="number"
                        value={formMaxBookingsPerSlot}
                        onChange={(e) => setFormMaxBookingsPerSlot(e.target.value)}
                        placeholder="e.g. 5"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-light px-3 py-2 mt-4 rounded-top">
                <h6 className="fw-bold mb-0">Schedule Information</h6>
              </div>
              <div className="p-3 border border-top-0 rounded-bottom">
                <ul className="nav nav-pills schedule-tab mb-3 gap-2" role="tablist">
                  {WEEKDAYS.map((day) => (
                    <li className="nav-item" role="presentation" key={day}>
                      <button
                        className={`btn btn-sm p-2 px-3 d-flex align-items-center justify-content-center w-auto fw-medium ${
                          activeScheduleDay === day
                            ? "btn-primary text-white shadow-sm"
                            : "bg-white text-dark border"
                        } ${
                          lockedDays[day] && activeScheduleDay !== day
                            ? "border-success text-success bg-success-transparent"
                            : ""
                        }`}
                        onClick={() => setActiveScheduleDay(day)}
                        type="button"
                        role="tab"
                        style={{ borderRadius: "8px" }}
                      >
                        {day} {lockedDays[day] && <i className="ti ti-lock ms-2" />}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="tab-content">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className={`tab-pane fade ${activeScheduleDay === day ? "active show" : ""}`}
                      role="tabpanel"
                    >
                      <div className={`${lockedDays[day] ? "opacity-75" : ""}`}>
                        <DuplicateForms
                          key={`${day}-${lockedDays[day]}`}
                          initialRows={schedules[day]}
                          onChange={(rows) => setSchedules((prev) => ({ ...prev, [day]: rows }))}
                          disabled={lockedDays[day]}
                        />
                        <div className="mt-3 d-flex justify-content-end">
                          <button
                            type="button"
                            className={`btn ${lockedDays[day] ? "btn-secondary" : "btn-primary"} px-4`}
                            onClick={() =>
                              setLockedDays((prev) => ({ ...prev, [day]: !prev[day] }))
                            }
                          >
                            <i className={`ti ${lockedDays[day] ? "ti-lock-open" : "ti-lock"} me-2`} />
                            {lockedDays[day] ? "Unlock Day" : "Save & Lock"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                {submitting ? "Saving..." : "Save Test"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDiagnosticTestModal;
