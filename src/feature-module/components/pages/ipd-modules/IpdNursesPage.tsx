import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

interface Ward {
  id: string;
  wardName: string;
  wardType: string;
}

interface Nurse {
  id: string;
  nurseCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  qualification?: string | null;
  role: string; // Nurse, Head Nurse, Senior Nurse
  department: string; // IPD
  assignedWardId?: string | null;
  assignedWard?: Ward | null;
  shiftTiming: string;
  status: string; // Active, On Duty, On Leave
  createdAt: string;
}

const IpdNursesPage: React.FC = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("All");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNurseId, setSelectedNurseId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState("B.Sc Nursing");
  const [role, setRole] = useState("Nurse");
  const [department, setDepartment] = useState("IPD (Inpatient Department)");
  const [assignedWardId, setAssignedWardId] = useState("");
  const [shiftTiming, setShiftTiming] = useState("Morning Shift (8 AM - 4 PM)");
  const [status, setStatus] = useState("Active");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [nurseRes, wardRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/nurses"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
      ]);

      if (nurseRes.ok) {
        const data = await nurseRes.json();
        setNurses(Array.isArray(data) ? data : []);
      }
      if (wardRes.ok) {
        const data = await wardRes.json();
        setWards(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast.error("Failed to load IPD nurses list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics
  const metrics = useMemo(() => {
    let totalNurses = nurses.length;
    let activeDuty = 0;
    let headNurses = 0;

    nurses.forEach((n) => {
      if (n.status === "Active" || n.status === "On Duty") activeDuty++;
      if (n.role === "Head Nurse") headNurses++;
    });

    return { totalNurses, activeDuty, headNurses, wardsCount: wards.length };
  }, [nurses, wards]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedNurseId(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setQualification("B.Sc Nursing");
    setRole("Nurse");
    setDepartment("IPD (Inpatient Department)");
    setAssignedWardId(wards.length > 0 ? wards[0].id : "");
    setShiftTiming("Morning Shift (8 AM - 4 PM)");
    setStatus("Active");
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (nurse: Nurse) => {
    setIsEditing(true);
    setSelectedNurseId(nurse.id);
    setFullName(nurse.fullName);
    setPhone(nurse.phone || "");
    setEmail(nurse.email || "");
    setQualification(nurse.qualification || "B.Sc Nursing");
    setRole(nurse.role || "Nurse");
    setDepartment("IPD (Inpatient Department)");
    setAssignedWardId(nurse.assignedWardId || "");
    setShiftTiming(nurse.shiftTiming || "Morning Shift (8 AM - 4 PM)");
    setStatus(nurse.status || "Active");
    setShowAddModal(true);
  };

  // Submit Add/Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter nurse full name.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      qualification,
      role,
      department: "IPD",
      assignedWardId: assignedWardId || undefined,
      shiftTiming,
      status,
    };

    try {
      const url = isEditing
        ? apiUrl(`/api/ipd/nurses/${selectedNurseId}`)
        : apiUrl("/api/ipd/nurses");
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save nurse staff details.");
      }

      toast.success(isEditing ? "Nurse staff updated!" : "New IPD Nurse added to staff roster!");
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving nurse");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Nurse
  const handleDeleteNurse = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this nurse from IPD staff?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(apiUrl(`/api/ipd/nurses/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete nurse record");

      toast.success("Nurse record removed");
      fetchData();
    } catch (err: any) {
      toast.error("Error deleting nurse record");
    }
  };

  // Filtered List
  const filteredNurses = useMemo(() => {
    return nurses.filter((n) => {
      const name = n.fullName || "";
      const code = n.nurseCode || "";
      const ward = n.assignedWard?.wardName || "";

      const matchQuery =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ward.toLowerCase().includes(searchQuery.toLowerCase());

      const matchShift = shiftFilter === "All" || n.shiftTiming.includes(shiftFilter);
      return matchQuery && matchShift;
    });
  }, [nurses, searchQuery, shiftFilter]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-0">IPD Nurse Staff Management</h3>
            <p className="text-muted fs-13 mb-0">
              Manage IPD Nursing Staff Roster, Shift Allocation & Ward Duty Assignments
            </p>
          </div>

          <button className="btn btn-primary mt-3 mt-md-0" onClick={handleOpenAddModal}>
            <i className="ti ti-plus me-1" /> + Add IPD Nurse / Staff
          </button>
        </div>

        {/* Overview Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-primary">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL IPD NURSES</span>
                    <h3 className="fw-bold mb-0 text-primary">{metrics.totalNurses} Staff</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle">
                    <i className="ti ti-users-group fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-success">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">ACTIVE ON DUTY</span>
                    <h3 className="fw-bold mb-0 text-success">{metrics.activeDuty} On Shift</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-success text-success rounded-circle">
                    <i className="ti ti-user-check fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-warning">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">HEAD NURSES</span>
                    <h3 className="fw-bold mb-0 text-warning">{metrics.headNurses} Head Nurses</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-warning text-warning rounded-circle">
                    <i className="ti ti-award fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-info">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">MANAGED WARDS</span>
                    <h3 className="fw-bold mb-0 text-info">{metrics.wardsCount} Wards</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-info text-info rounded-circle">
                    <i className="ti ti-building-community fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-7">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by nurse name, staff code, or assigned ward..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-5">
                <select
                  className="form-select"
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                >
                  <option value="All">All Shift Timings</option>
                  <option value="Morning">Morning Shift (8 AM - 4 PM)</option>
                  <option value="Evening">Evening Shift (4 PM - 12 AM)</option>
                  <option value="Night">Night Shift (12 AM - 8 AM)</option>
                  <option value="General">General Shift</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Nurses Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="text-muted mt-2 mb-0">Loading IPD Nurses List...</p>
              </div>
            ) : filteredNurses.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-users-group fs-40 text-muted mb-2 d-block" />
                <h5 className="fw-bold">No IPD Nurse Staff Found</h5>
                <p className="text-muted fs-13 mb-3">Add your first nurse staff member for IPD Ward duty.</p>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  <i className="ti ti-plus me-1" /> + Add IPD Nurse / Staff
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nurse Code</th>
                      <th>Nurse Name & Qualification</th>
                      <th>Role & Department</th>
                      <th>Assigned Ward</th>
                      <th>Shift Duty Roster</th>
                      <th>Contact Info</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNurses.map((nurse) => (
                      <tr key={nurse.id}>
                        <td>
                          <span className="badge bg-soft-dark text-dark fw-bold">
                            {nurse.nurseCode}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle fw-bold">
                              {nurse.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-dark d-block">{nurse.fullName}</strong>
                              <small className="text-muted">{nurse.qualification || "GNM / B.Sc Nursing"}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold text-primary d-block">{nurse.role}</span>
                          <span className="badge bg-soft-info text-info fs-11">
                            {nurse.department || "IPD"}
                          </span>
                        </td>
                        <td>
                          {nurse.assignedWard ? (
                            <span className="badge bg-soft-primary text-primary fw-semibold fs-12">
                              <i className="ti ti-building-community me-1" />
                              {nurse.assignedWard.wardName}
                            </span>
                          ) : (
                            <span className="text-muted fs-13">General IPD Floor</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-soft-dark text-dark fw-medium fs-12">
                            <i className="ti ti-clock me-1" />
                            {nurse.shiftTiming}
                          </span>
                        </td>
                        <td>
                          <div className="fs-13">
                            <div className="text-dark">📞 {nurse.phone || "—"}</div>
                            <small className="text-muted">✉️ {nurse.email || "—"}</small>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              nurse.status === "Active" || nurse.status === "On Duty"
                                ? "bg-soft-success text-success"
                                : "bg-soft-warning text-warning"
                            }`}
                          >
                            {nurse.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => handleOpenEditModal(nurse)}
                              title="Edit Nurse Details"
                            >
                              <i className="ti ti-edit" />
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteNurse(nurse.id)}
                              title="Remove Nurse"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT IPD NURSE */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-user-plus me-2" />
                  {isEditing ? "Edit IPD Nurse Staff Details" : "Add New IPD Nurse / Staff Member"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Nurse Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sister Sunita Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Qualification */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Qualification / Certification</label>
                      <select
                        className="form-select"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                      >
                        <option value="GNM">GNM (General Nursing & Midwifery)</option>
                        <option value="B.Sc Nursing">B.Sc Nursing</option>
                        <option value="M.Sc Nursing">M.Sc Nursing</option>
                        <option value="ANM">ANM (Auxiliary Nurse Midwife)</option>
                        <option value="OT Nurse Specialist">OT Nurse Specialist</option>
                        <option value="ICU Critical Care Specialist">ICU Critical Care Specialist</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Staff Designation / Role</label>
                      <select
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="Nurse">Staff Nurse</option>
                        <option value="Head Nurse">Head Nurse / Ward In-Charge</option>
                        <option value="Senior Nurse">Senior Staff Nurse</option>
                        <option value="Junior Nurse">Junior Staff Nurse</option>
                        <option value="Nursing Assistant">Nursing Assistant</option>
                      </select>
                    </div>

                    {/* Department (IPD Preselected) */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Department / Module</label>
                      <input
                        type="text"
                        className="form-control bg-light fw-bold text-primary"
                        value={department}
                        readOnly
                      />
                      <small className="text-muted fs-11">Pre-selected for IPD Inpatient Department</small>
                    </div>

                    {/* Assigned Ward */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assigned Duty Ward</label>
                      <select
                        className="form-select"
                        value={assignedWardId}
                        onChange={(e) => setAssignedWardId(e.target.value)}
                      >
                        <option value="">-- General Floor (Unassigned) --</option>
                        {wards.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.wardName} ({w.wardType})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shift Timing */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Shift Duty Roster</label>
                      <select
                        className="form-select"
                        value={shiftTiming}
                        onChange={(e) => setShiftTiming(e.target.value)}
                      >
                        <option value="Morning Shift (8 AM - 4 PM)">Morning Shift (8 AM - 4 PM)</option>
                        <option value="Evening Shift (4 PM - 12 AM)">Evening Shift (4 PM - 12 AM)</option>
                        <option value="Night Shift (12 AM - 8 AM)">Night Shift (12 AM - 8 AM)</option>
                        <option value="General Shift (9 AM - 5 PM)">General Shift (9 AM - 5 PM)</option>
                      </select>
                    </div>

                    {/* Phone & Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. nurse.sunita@docyori.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Duty Status</label>
                      <div className="d-flex gap-4 pt-1">
                        <label className="form-check-label fw-medium cursor-pointer">
                          <input
                            type="radio"
                            className="form-check-input me-1"
                            name="nurseStatus"
                            value="Active"
                            checked={status === "Active" || status === "On Duty"}
                            onChange={() => setStatus("Active")}
                          />
                          Active / On Duty
                        </label>

                        <label className="form-check-label fw-medium cursor-pointer">
                          <input
                            type="radio"
                            className="form-check-input me-1"
                            name="nurseStatus"
                            value="On Leave"
                            checked={status === "On Leave"}
                            onChange={() => setStatus("On Leave")}
                          />
                          On Leave / Off Duty
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update Nurse"
                    ) : (
                      "Save IPD Nurse Staff"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default IpdNursesPage;
