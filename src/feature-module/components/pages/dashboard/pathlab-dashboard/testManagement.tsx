import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useLabTests } from "../../../../../core/hooks/useLabTests";
import { useLabCategories } from "../../../../../core/hooks/useLabCategories";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicStaff } from "../../../../../core/hooks/useClinicStaff";
import Select from "react-select";
import EmptyState from "../../../../../core/common/emptyState";
import DuplicateForms from "../../../../../core/common/duplicate-forms/duplicateForms";
import type { RowType } from "../../../../../core/common/duplicate-forms/duplicateForms.types";
import { parseSchedulesFromApi } from "../../../../../core/utils/doctorSchedule";

const TestManagement = () => {
  const { tests, loading, createTest, updateTest, deleteTest, bulkDeleteTests } = useLabTests();
  const { categories: categoryList } = useLabCategories();
  const { doctors } = useClinicDoctors();
  const { staffs: staff } = useClinicStaff();

  const doctorOptions = useMemo(() => doctors?.map((d: any) => ({ value: d.id, label: d.fullName })) || [], [doctors]);
  const staffOptions = useMemo(() => staff?.map((s: any) => ({ value: s.id, label: s.fullName })) || [], [staff]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [viewTest, setViewTest] = useState<any>(null);

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Slot Booking State
  const [formIsSlotBookingEnabled, setFormIsSlotBookingEnabled] = useState(false);
  const [formSlotDuration, setFormSlotDuration] = useState("");
  const [formMaxBookingsPerSlot, setFormMaxBookingsPerSlot] = useState("");
  const [formAssignedDoctors, setFormAssignedDoctors] = useState<any[]>([]);
  const [formAssignedStaff, setFormAssignedStaff] = useState<any[]>([]);

  // Schedule State
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
  const [schedules, setSchedules] = useState<Record<string, RowType[]>>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
  });
  const [lockedDays, setLockedDays] = useState<Record<string, boolean>>({});
  const [activeScheduleDay, setActiveScheduleDay] = useState<string>("Monday");

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

  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  const handleOpenAdd = () => {
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
    setSchedules({ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] });
    setLockedDays({});
    setActiveScheduleDay("Monday");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) { toast.error("Test Name is required"); return; }
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
          schedules: serializeSchedules(schedules)
      });
      toast.success("Test added successfully!");
      setShowAddModal(false);
    } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
  };

  const handleOpenEdit = (t: any) => {
    setSelectedTest(t);
    setFormName(t.name);
    setFormShortName(t.shortName || "");
    setFormDesc(t.description || "");
    setFormPrice(String(t.price || ""));
    setFormHomeCharge(String(t.homeCollectionCharge || ""));
    setFormDuration(t.duration || "");
    setFormPrep(t.preparationInfo || "");
    setFormAssignment(t.assignment || "Staff");
    setFormStatus(t.status);
    setFormCategoryId(t.categoryId || "");
    setFormIsSlotBookingEnabled(t.isSlotBookingEnabled || false);
    setFormSlotDuration(t.slotDuration ? String(t.slotDuration) : "");
    setFormMaxBookingsPerSlot(t.maxBookingsPerSlot ? String(t.maxBookingsPerSlot) : "");
    setFormAssignedDoctors(Array.isArray(t.assignedDoctors) ? t.assignedDoctors : []);
    setFormAssignedStaff(Array.isArray(t.assignedStaff) ? t.assignedStaff : []);
    if (t.schedules && typeof t.schedules === 'object' && Object.keys(t.schedules).length > 0) {
      setSchedules(parseSchedulesFromApi(t.schedules));
      const newLocked: Record<string, boolean> = {};
      Object.keys(t.schedules).forEach(d => { if (t.schedules[d].length > 0) newLocked[d] = true; });
      setLockedDays(newLocked);
    } else {
      setSchedules({ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] });
      setLockedDays({});
    }
    setActiveScheduleDay("Monday");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error("Test name is required"); return; }
    if (selectedTest) {
      setSubmitting(true);
      try {
        await updateTest(selectedTest.id, {
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
            schedules: serializeSchedules(schedules)
        });
        toast.success("Test updated successfully!");
        setShowEditModal(false);
        setSelectedTest(null);
      } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
    }
  };

  const handleOpenDelete = (t: any) => { setSelectedTest(t); triggerModal("delete_test"); };

  const handleDeleteConfirm = async () => {
    if (selectedTest) {
      setSubmitting(true);
      try {
        await deleteTest(selectedTest.id);
        setSelectedIds(selectedIds.filter((id) => id !== selectedTest.id));
        toast.success("Test deleted successfully!");
        document.getElementById("btn-close-delete-test")?.click();
        setSelectedTest(null);
      } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await bulkDeleteTests(selectedIds);
      setSelectedIds([]);
      toast.success("Selected tests deleted successfully!");
      document.getElementById("btn-close-bulk-delete-test")?.click();
    } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
  };

  const filteredData = useMemo(() => {
    return tests.filter((t) => {
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      const matchCategory = filterCategory === "All" || t.category?.name === filterCategory;
      const matchSearch =
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.testCode || "").toLowerCase().includes(searchText.toLowerCase());
      return matchStatus && matchCategory && matchSearch;
    });
  }, [tests, filterStatus, filterCategory, searchText]);

  const data = filteredData.map((t, index) => ({
    key: t.id,
    id: t.id,
    S_No: index + 1,
    TestName: t.name,
    TestCode: t.testCode || "—",
    Category: t.category?.name || "—",
    Price: `₹${t.price.toLocaleString("en-IN")}`,
    Status: t.status,
    CreatedDate: dayjs(t.createdAt).format("DD MMM YYYY"),
    raw: t,
  }));

  const columns = [
    { title: "S.No", dataIndex: "S_No", render: (text: number) => <span className="text-dark fw-semibold">{text}</span>, sorter: (a: any, b: any) => a.S_No - b.S_No, width: 70 },
    { title: "Test Name", dataIndex: "TestName", render: (text: string) => <span className="text-dark fw-bold">{text}</span>, sorter: (a: any, b: any) => a.TestName.localeCompare(b.TestName) },
    { title: "Test Code", dataIndex: "TestCode", render: (text: string) => <span className="text-primary fw-medium">{text}</span>, sorter: (a: any, b: any) => a.TestCode.localeCompare(b.TestCode), width: 110 },
    { title: "Category", dataIndex: "Category", render: (text: string) => <span className="badge badge-soft-info border border-info px-2 py-1 fs-12 fw-medium">{text}</span>, sorter: (a: any, b: any) => a.Category.localeCompare(b.Category) },
    { title: "Price", dataIndex: "Price", render: (text: string) => <span className="text-dark fw-bold">{text}</span>, sorter: (a: any, b: any) => a.raw.price - b.raw.price },
    { title: "Status", dataIndex: "Status", render: (text: string) => <span className={`badge border ${text === "Active" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} px-2 py-1 fs-12 fw-medium`}>{text}</span>, sorter: (a: any, b: any) => a.Status.localeCompare(b.Status) },
    {
      title: "Action", align: "center" as const, width: 120,
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Link to="#" className="bg-transparent border-0 text-info p-1" title="View Details" onClick={(e) => { e.preventDefault(); setViewTest(record.raw); triggerModal("view_test"); }}>
            <i className="ti ti-eye fs-18"></i>
          </Link>
          <Link to="#" className="bg-transparent border-0 text-primary p-1" title="Edit" onClick={(e) => { e.preventDefault(); handleOpenEdit(record.raw); }}>
            <i className="ti ti-edit fs-18"></i>
          </Link>
          <Link to="#" className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={(e) => { e.preventDefault(); handleOpenDelete(record.raw); }}>
            <i className="ti ti-trash fs-18"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Diagnostic Test Management
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">Total : {loading ? "" : filteredData.length}</span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "200px" }}>
                <input type="text" className="form-control fs-13 py-2" placeholder="Search Test..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "150px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Category:</span> {filterCategory}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterCategory("All"); }}>All</Link></li>
                  {categoryList.filter(c => c.status === "Active").map((c) => (
                    <li key={c.id}><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterCategory(c.name); }}>{c.name}</Link></li>
                  ))}
                </ul>
              </div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "130px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Active"); }}>Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Inactive"); }}>Inactive</Link></li>
                </ul>
              </div>
              <button className="btn btn-primary d-flex align-items-center justify-content-center" style={{ minHeight: "38px", whiteSpace: "nowrap" }} onClick={handleOpenAdd}>
                Add Test <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" role="status" /><p className="text-muted mt-2 mb-0">Loading tests...</p></div>
          ) : tests.length === 0 ? (
            <div className="border rounded bg-white"><EmptyState title="No tests yet" message="Create your first diagnostic test to get started." /></div>
          ) : (
            <div className="table-responsive"><Datatable columns={columns} dataSource={data} Selection={true} searchText={searchText} onSelectionChange={(keys) => setSelectedIds(keys as string[])} /></div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow" onClick={() => triggerModal("bulk_delete_test")} style={{ borderRadius: "8px", minHeight: "42px", fontWeight: "bold" }}>
                <i className="ti ti-trash fs-18"></i> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top"><p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p></div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowAddModal(false)} />
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white"><h5 className="modal-title text-white">Add Diagnostic Test</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button></div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Test Name <span className="text-danger">*</span></label><input type="text" className="form-control" placeholder="e.g. Complete Blood Count" value={formName} onChange={(e) => setFormName(e.target.value)} required /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Short Name <span className="text-muted fw-normal">(Optional)</span></label><input type="text" className="form-control" placeholder="e.g. CBC" value={formShortName} onChange={(e) => setFormShortName(e.target.value)} /></div>
                  </div>
                  <div className="row">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <select className="form-select" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                            <option value="">No Category</option>
                            {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Test Fee (₹) <span className="text-danger">*</span></label><input type="number" className="form-control" placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} min="0" required /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Home Collection Charge (₹) <span className="text-muted fw-normal">(Optional)</span></label><input type="number" className="form-control" placeholder="e.g. 500" value={formHomeCharge} onChange={(e) => setFormHomeCharge(e.target.value)} min="0" /></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Estimated Duration <span className="text-muted fw-normal">(Optional)</span></label><input type="text" className="form-control" placeholder="e.g. 2 Hours, 1 Day" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Assigned Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={formAssignment} onChange={(e) => setFormAssignment(e.target.value)} required>
                        <option value="Doctor">Doctor</option>
                        <option value="Staff">Staff</option>
                        <option value="Multiple">Multiple (Both)</option>
                      </select>
                    </div>
                  </div>
                  {(formAssignment === "Doctor" || formAssignment === "Multiple") && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Assigned Doctors</label>
                      <Select isMulti options={doctorOptions} value={formAssignedDoctors} onChange={(selected: any) => setFormAssignedDoctors(selected || [])} placeholder="Select Doctors..." />
                    </div>
                  )}
                  {(formAssignment === "Staff" || formAssignment === "Multiple") && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Assigned Staff</label>
                      <Select isMulti options={staffOptions} value={formAssignedStaff} onChange={(selected: any) => setFormAssignedStaff(selected || [])} placeholder="Select Staff Members..." />
                    </div>
                  )}
                  <div className="mb-3"><label className="form-label fw-semibold">Preparation Instructions <span className="text-muted fw-normal">(Optional)</span></label><textarea className="form-control" rows={2} placeholder="e.g. Fasting for 10-12 hours required." value={formPrep} onChange={(e) => setFormPrep(e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(Optional)</span></label><textarea className="form-control" rows={2} placeholder="Enter a detailed description..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Status <span className="text-danger">*</span></label><select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>

                  {/* Slot Booking Section */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Enable Slot Booking</label>
                    <div className="form-check form-switch mt-1">
                      <input className="form-check-input" type="checkbox" checked={formIsSlotBookingEnabled} onChange={(e) => setFormIsSlotBookingEnabled(e.target.checked)} id="addSlotBookingToggle" style={{ cursor: "pointer" }} />
                      <label className="form-check-label ms-2" htmlFor="addSlotBookingToggle" style={{ cursor: "pointer" }}>{formIsSlotBookingEnabled ? 'Yes' : 'No'}</label>
                    </div>
                  </div>
                  {formIsSlotBookingEnabled && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3"><label className="form-label fw-semibold">Slot Duration (Minutes) <span className="text-danger">*</span></label><input type="number" className="form-control" value={formSlotDuration} onChange={(e) => setFormSlotDuration(e.target.value)} placeholder="e.g. 15" required /></div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3"><label className="form-label fw-semibold">Max Bookings Per Slot <span className="text-danger">*</span></label><input type="number" className="form-control" value={formMaxBookingsPerSlot} onChange={(e) => setFormMaxBookingsPerSlot(e.target.value)} placeholder="e.g. 5" required /></div>
                      </div>
                    </div>
                  )}

                  {/* Test Schedule Section */}
                  <div className="bg-light px-3 py-2 mt-4 rounded-top">
                    <h6 className="fw-bold mb-0">Schedule Information</h6>
                  </div>
                  <div className="p-3 border border-top-0 rounded-bottom">
                    <ul className="nav nav-pills schedule-tab mb-3 gap-2" role="tablist">
                      {WEEKDAYS.map((day) => (
                        <li className="nav-item" role="presentation" key={day}>
                          <button
                            className={`btn btn-sm p-2 px-3 d-flex align-items-center justify-content-center w-auto fw-medium ${activeScheduleDay === day ? "btn-primary text-white shadow-sm" : "bg-white text-dark border"} ${lockedDays[day] && activeScheduleDay !== day ? "border-success text-success bg-success-transparent" : ""}`}
                            onClick={() => setActiveScheduleDay(day)}
                            type="button"
                            role="tab"
                            style={{ borderRadius: '8px' }}
                          >
                            {day} {lockedDays[day] && <i className="ti ti-lock ms-2" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="tab-content">
                      {WEEKDAYS.map((day) => (
                        <div key={day} className={`tab-pane fade ${activeScheduleDay === day ? "active show" : ""}`} role="tabpanel">
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
                                onClick={() => setLockedDays((prev) => ({ ...prev, [day]: !prev[day] }))}
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
                <div className="modal-footer bg-light"><button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Saving..." : "Save Test"}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowEditModal(false)} />
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white"><h5 className="modal-title text-white">Edit Diagnostic Test</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button></div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Test Name <span className="text-danger">*</span></label><input type="text" className="form-control" placeholder="e.g. Complete Blood Count" value={formName} onChange={(e) => setFormName(e.target.value)} required /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Short Name <span className="text-muted fw-normal">(Optional)</span></label><input type="text" className="form-control" placeholder="e.g. CBC" value={formShortName} onChange={(e) => setFormShortName(e.target.value)} /></div>
                  </div>
                  <div className="row">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <select className="form-select" value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                            <option value="">No Category</option>
                            {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Test Fee (₹) <span className="text-danger">*</span></label><input type="number" className="form-control" placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} min="0" required /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Home Collection Charge (₹) <span className="text-muted fw-normal">(Optional)</span></label><input type="number" className="form-control" placeholder="e.g. 500" value={formHomeCharge} onChange={(e) => setFormHomeCharge(e.target.value)} min="0" /></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Estimated Duration <span className="text-muted fw-normal">(Optional)</span></label><input type="text" className="form-control" placeholder="e.g. 2 Hours, 1 Day" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} /></div>
                    <div className="col-md-6 mb-3"><label className="form-label fw-semibold">Assigned Type <span className="text-danger">*</span></label>
                      <select className="form-select" value={formAssignment} onChange={(e) => setFormAssignment(e.target.value)} required>
                        <option value="Doctor">Doctor</option>
                        <option value="Staff">Staff</option>
                        <option value="Multiple">Multiple (Both)</option>
                      </select>
                    </div>
                  </div>
                  {(formAssignment === "Doctor" || formAssignment === "Multiple") && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Assigned Doctors</label>
                      <Select isMulti options={doctorOptions} value={formAssignedDoctors} onChange={(selected: any) => setFormAssignedDoctors(selected || [])} placeholder="Select Doctors..." />
                    </div>
                  )}
                  {(formAssignment === "Staff" || formAssignment === "Multiple") && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Assigned Staff</label>
                      <Select isMulti options={staffOptions} value={formAssignedStaff} onChange={(selected: any) => setFormAssignedStaff(selected || [])} placeholder="Select Staff Members..." />
                    </div>
                  )}
                  <div className="mb-3"><label className="form-label fw-semibold">Preparation Instructions <span className="text-muted fw-normal">(Optional)</span></label><textarea className="form-control" rows={2} placeholder="e.g. Fasting for 10-12 hours required." value={formPrep} onChange={(e) => setFormPrep(e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(Optional)</span></label><textarea className="form-control" rows={2} placeholder="Enter a detailed description..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Status <span className="text-danger">*</span></label><select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>

                  {/* Slot Booking Section */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Enable Slot Booking</label>
                    <div className="form-check form-switch mt-1">
                      <input className="form-check-input" type="checkbox" checked={formIsSlotBookingEnabled} onChange={(e) => setFormIsSlotBookingEnabled(e.target.checked)} id="editSlotBookingToggle" style={{ cursor: "pointer" }} />
                      <label className="form-check-label ms-2" htmlFor="editSlotBookingToggle" style={{ cursor: "pointer" }}>{formIsSlotBookingEnabled ? 'Yes' : 'No'}</label>
                    </div>
                  </div>
                  {formIsSlotBookingEnabled && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3"><label className="form-label fw-semibold">Slot Duration (Minutes) <span className="text-danger">*</span></label><input type="number" className="form-control" value={formSlotDuration} onChange={(e) => setFormSlotDuration(e.target.value)} placeholder="e.g. 15" required /></div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3"><label className="form-label fw-semibold">Max Bookings Per Slot <span className="text-danger">*</span></label><input type="number" className="form-control" value={formMaxBookingsPerSlot} onChange={(e) => setFormMaxBookingsPerSlot(e.target.value)} placeholder="e.g. 5" required /></div>
                      </div>
                    </div>
                  )}

                  {/* Test Schedule Section */}
                  <div className="bg-light px-3 py-2 mt-4 rounded-top">
                    <h6 className="fw-bold mb-0">Schedule Information</h6>
                  </div>
                  <div className="p-3 border border-top-0 rounded-bottom">
                    <ul className="nav nav-pills schedule-tab mb-3 gap-2" role="tablist">
                      {WEEKDAYS.map((day) => (
                        <li className="nav-item" role="presentation" key={day}>
                          <button
                            className={`btn btn-sm p-2 px-3 d-flex align-items-center justify-content-center w-auto fw-medium ${activeScheduleDay === day ? "btn-primary text-white shadow-sm" : "bg-white text-dark border"} ${lockedDays[day] && activeScheduleDay !== day ? "border-success text-success bg-success-transparent" : ""}`}
                            onClick={() => setActiveScheduleDay(day)}
                            type="button"
                            role="tab"
                            style={{ borderRadius: '8px' }}
                          >
                            {day} {lockedDays[day] && <i className="ti ti-lock ms-2" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="tab-content">
                      {WEEKDAYS.map((day) => (
                        <div key={day} className={`tab-pane fade ${activeScheduleDay === day ? "active show" : ""}`} role="tabpanel">
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
                                onClick={() => setLockedDays((prev) => ({ ...prev, [day]: !prev[day] }))}
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
                <div className="modal-footer bg-light"><button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Updating..." : "Update Test"}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL (HRM STYLE) */}
      <div className="modal fade" id="delete_test">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <img src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <img src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete <strong>{selectedTest?.name}</strong>?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-delete-test" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleDeleteConfirm} disabled={submitting}>{submitting ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</> : <><i className="ti ti-trash me-2" />Yes, Delete</>}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BULK DELETE MODAL (HRM STYLE) */}
      <div className="modal fade" id="bulk_delete_test">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <img src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <img src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete selected tests?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-bulk-delete-test" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleBulkDelete} disabled={submitting}>{submitting ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</> : <><i className="ti ti-trash me-2" />Yes, Delete</>}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <ViewModal id="view_test" title="Diagnostic Test Details" subtitle="View test information" headerIcon={<i className="ti ti-microscope" />}
        highlightTitle={viewTest?.name || "Test"}
        highlightStatus={<span className={`badge border ${viewTest?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}><i className="ti ti-point-filled me-1"></i>{viewTest?.status}</span>}
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-hash" />, label: "Test Code", value: viewTest?.testCode || "—" },
          { icon: <i className="ti ti-typography" />, label: "Short Name", value: viewTest?.shortName || "—" },
          { icon: <i className="ti ti-tags" />, label: "Category", value: viewTest?.category?.name || "—" },
          { icon: <i className="ti ti-currency-rupee" />, label: "Test Fee", value: viewTest?.price ? `₹${viewTest.price.toLocaleString("en-IN")}` : "Free" },
          { icon: <i className="ti ti-home" />, label: "Home Collection", value: viewTest?.homeCollectionCharge ? `₹${viewTest.homeCollectionCharge.toLocaleString("en-IN")}` : "Free / N/A" },
          { icon: <i className="ti ti-clock" />, label: "Duration", value: viewTest?.duration || "—" },
          { icon: <i className="ti ti-user-check" />, label: "Assignment", value: viewTest?.assignment || "Staff" },
          { icon: <i className="ti ti-info-circle" />, label: "Preparation", value: viewTest?.preparationInfo || "None", fullWidth: true },
          { icon: <i className="ti ti-calendar" />, label: "Created", value: viewTest?.createdAt ? dayjs(viewTest.createdAt).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-file-description" />, label: "Description", value: viewTest?.description || "No description provided", fullWidth: true },
          ...(viewTest?.isSlotBookingEnabled ? [
            { icon: <i className="ti ti-calendar-event" />, label: "Slot Booking", value: <span className="badge bg-success-transparent text-success">Enabled</span> },
            { icon: <i className="ti ti-clock-hour-4" />, label: "Slot Duration", value: viewTest?.slotDuration ? `${viewTest.slotDuration} Mins` : "—" },
            { icon: <i className="ti ti-users" />, label: "Max Bookings / Slot", value: viewTest?.maxBookingsPerSlot || "—" },
          ] : [
            { icon: <i className="ti ti-calendar-event" />, label: "Slot Booking", value: <span className="badge bg-danger-transparent text-danger">Disabled</span> },
          ])
        ]}
        onEdit={() => { document.getElementById("btn-close-view-test")?.click(); handleOpenEdit(viewTest); }} editLabel="Edit Test" editModalTarget=""
      >
        {viewTest?.schedules && Object.keys(viewTest.schedules).length > 0 && (
          <div className="mt-4 border-top pt-3">
            <h6 className="fw-bold mb-3 text-dark fs-15">
              <i className="ti ti-calendar-time me-2 text-primary fs-18"></i> Test Schedule
            </h6>
            <div className="row">
              {Object.entries(viewTest.schedules).map(([day, sessions]: any) => (
                <div key={day} className="col-md-4 mb-3">
                  <div className="card shadow-none border rounded-3 h-100 mb-0">
                    <div className="card-header bg-light px-3 py-2 border-bottom">
                      <h6 className="fw-bold text-dark mb-0 fs-14">{day}</h6>
                    </div>
                    <div className="card-body p-2">
                      {Array.isArray(sessions) && sessions.map((s: any, idx: number) => (
                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-light">
                          <span className="text-muted fs-13"><i className="ti ti-clock me-1"></i>{s.session || `Session ${idx+1}`}</span>
                          <span className="badge bg-primary-transparent text-primary fw-medium px-2 py-1">
                            {s.from} - {s.to}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ViewModal>
    </>
  );
};

export default TestManagement;
