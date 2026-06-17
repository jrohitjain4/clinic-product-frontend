import { useState, useEffect, useCallback, useMemo } from "react";
import EmptyState from "../../../../core/common/emptyState";
import { Link, useLocation } from "react-router";
import Datatable from "../../../../core/common/dataTable";
import { DatePicker, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { ViewModal } from "../../../../core/common/modal/ViewModal";

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Designation {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
}

const DesignationList = () => {
  const location = useLocation();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewDesig, setViewDesig] = useState<Designation | null>(null);

  // Add modal state
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("Staff");
  const [addDeptId, setAddDeptId] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit modal state
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("Staff");
  const [editDeptId, setEditDeptId] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/designations"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDesignations(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/departments"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDepartments(data.filter((d: Department) => d.status === "Active"));
    } catch { }
  }, [token]);

  useEffect(() => {
    fetchDesignations();
    fetchDepartments();
  }, [fetchDesignations, fetchDepartments]);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setTimeout(() => {
        const btn = document.querySelector('[data-bs-target="#add_designation"]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 300);
    }
  }, [location.state]);

  const filteredData = useMemo(() => {
    return designations.filter((item) => {
      const matchDept = filterDept === "All" || item.departmentName === filterDept;
      const matchType = filterType === "All" || item.type === filterType;
      const matchStatus = filterStatus === "All" || item.status === filterStatus;

      let matchDate = true;
      const itemDate = dayjs(item.createdAt);

      if (filterDatePreset === "Today") {
        matchDate = itemDate.isSame(dayjs(), "day");
      } else if (filterDatePreset === "Tomorrow") {
        matchDate = itemDate.isSame(dayjs().add(1, "day"), "day");
      } else if (filterDatePreset === "7 Days") {
        matchDate = itemDate.isAfter(dayjs().subtract(7, "days")) && itemDate.isBefore(dayjs().add(1, "day"), "day");
      } else if (filterDatePreset === "Custom") {
        if (customRange[0] && customRange[1]) {
          matchDate = itemDate.isAfter(customRange[0].startOf("day")) && itemDate.isBefore(customRange[1].endOf("day"));
        }
      }

      return matchDept && matchType && matchStatus && matchDate;
    });
  }, [designations, filterDept, filterType, filterStatus, filterDatePreset, customRange]);

  const clearFilters = () => {
    setFilterDept("All");
    setFilterType("All");
    setFilterStatus("All");
    setFilterDatePreset("All");
    setCustomRange([null, null]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addName.trim()) {
      setAddError("Designation name is required");
      return;
    }
    if (!addDeptId) {
      setAddError("Please select a department");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(apiUrl("/api/designations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: addName,
          type: addType,
          description: addDesc,
          departmentId: addDeptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Designation added successfully");
      setAddName("");
      setAddType("Staff");
      setAddDeptId("");
      setAddDesc("");
      setAddError("");
      fetchDesignations();
      document.getElementById("btn-close-add-desig")?.click();
    } catch (err: any) {
      setAddError(err.message);
      toast.error(err.message || "Failed to add designation");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (d: Designation) => {
    setEditId(d.id);
    setEditName(d.name);
    setEditType(d.type);
    setEditDeptId(d.departmentId || "");
    setEditDesc(d.description || "");
    setEditStatus(d.status);
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) {
      setEditError("Designation name is required");
      return;
    }
    if (!editDeptId) {
      setEditError("Please select a department");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/designations/${editId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          type: editType,
          description: editDesc,
          departmentId: editDeptId,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Designation updated successfully");
      setEditError("");
      fetchDesignations();
      document.getElementById("btn-close-edit-desig")?.click();
    } catch (err: any) {
      setEditError(err.message);
      toast.error(err.message || "Failed to update designation");
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (d: Designation) => {
    setDeleteId(d.id);
    setDeleteName(d.name);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/designations/${deleteId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Designation deleted successfully");
      fetchDesignations();
      document.getElementById("btn-close-delete-desig")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete designation");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl("/api/designations/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Selected designations deleted");
        setDesignations(designations.filter((d) => !selectedIds.includes(d.id)));
        setSelectedIds([]);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Bulk delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  const columns = [
    {
      title: "S.No",
      render: (_text: any, _record: any, index: number) => (
        <span className="text-dark fw-medium">{index + 1}</span>
      ),
      width: 60,
    },
    {
      title: "Designation",
      dataIndex: "name",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: Designation, b: Designation) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Doctor"
            ? "badge-soft-primary border-primary"
            : "badge-soft-secondary border-secondary"
            } px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: Designation, b: Designation) =>
        a.type.localeCompare(b.type),
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      render: (text: string) => (
        <span className="text-dark">
          {text || <span className="text-muted">--</span>}
        </span>
      ),
      sorter: (a: Designation, b: Designation) =>
        (a.departmentName || "").localeCompare(b.departmentName || ""),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (val: string) => (
        <span className="text-dark">
          {new Date(val).toLocaleDateString("en-GB")}
        </span>
      ),
      sorter: (a: Designation, b: Designation) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Active"
            ? "badge-soft-success border-success"
            : "badge-soft-danger border-danger"
            } px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: Designation, b: Designation) =>
        a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      align: "center" as const,
      className: "text-nowrap",
      width: 120,
      render: (_: any, record: Designation) => (
        <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
          {/* View Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_designation"
            onClick={() => setViewDesig(record)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_designation"
            onClick={() => openEdit(record)}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_designation"
            onClick={() => openDelete(record)}
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Designation
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Designations : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Clear Filter Button - Only show when any filter is active */}
              {(filterDept !== "All" || filterType !== "All" || filterStatus !== "All" || filterDatePreset !== "All") && (
                <button
                  type="button"
                  className="btn btn-white d-flex align-items-center gap-1 text-danger border"
                  onClick={clearFilters}
                  style={{
                    minHeight: "38px",
                    fontWeight: "700",
                    fontSize: "13px",
                    borderRadius: "6px"
                  }}
                >
                  <i className="ti ti-rotate"></i> Clear All
                </button>
              )}

              {/* Advanced Date Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {filterDatePreset === "All" ? "Select Date" : filterDatePreset}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                  {["All", "Today", "Tomorrow", "7 Days", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDatePreset(preset);
                        }}
                      >
                        {preset}
                      </Link>
                    </li>
                  ))}
                  {filterDatePreset === "Custom" && (
                    <li className="p-2 border-top mt-2">
                      <DatePicker.RangePicker
                        format="DD-MM-YYYY"
                        className="w-100"
                        value={customRange}
                        onChange={(dates) => setCustomRange(dates ? [dates[0], dates[1]] : [null, null])}
                      />
                    </li>
                  )}
                </ul>
              </div>

              {/* Type Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "120px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Type:</span> {filterType}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("Doctor");
                      }}
                    >
                      Doctor
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("Staff");
                      }}
                    >
                      Staff
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Department Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Department</span> {filterDept === "All" ? "All" : filterDept.slice(0, 2) + "..."}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "180px" }}>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterDept("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  {departments.map((d) => (
                    <li key={d.id}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDept(d.name);
                        }}
                      >
                        {d.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Active");
                      }}
                    >
                      Active
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Inactive");
                      }}
                    >
                      Inactive
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Add Designation Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_designation"
                onClick={() => {
                  setAddName("");
                  setAddType("Staff");
                  setAddDeptId("");
                  setAddDesc("");
                }}
              >
                Add Designation <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => fetchDesignations()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading designations</p>
            </div>
          ) : designations.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No designations yet"
                message="Define roles and positions within your departments by creating your first designation."
                action={
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_designation"
                  >
                    Add Designation <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={filteredData}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_designation"
                onClick={() => setDeleteId("")}
                style={{
                  borderRadius: "8px",
                  minHeight: "42px",
                  fontWeight: "bold",
                }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      <div id="add_designation" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Add New Designation</h5>
              <button
                id="btn-close-add-desig"
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 fs-13">{addError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Department <span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={addDeptId}
                    onChange={(e) => setAddDeptId(e.target.value)}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Designation Name <span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Senior Nurse"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Type <span className="text-danger ms-1">*</span>
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="addType"
                        id="add-type-staff"
                        checked={addType === "Staff"}
                        onChange={() => setAddType("Staff")}
                      />
                      <label className="form-check-label fs-13" htmlFor="add-type-staff">
                        Staff
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="addType"
                        id="add-type-doctor"
                        checked={addType === "Doctor"}
                        onChange={() => setAddType("Doctor")}
                      />
                      <label className="form-check-label fs-13" htmlFor="add-type-doctor">
                        Doctor
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-2 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-light border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-2" />
                      Add Designation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <div id="edit_designation" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Designation</h5>
              <button
                id="btn-close-edit-desig"
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editError && (
                  <div className="alert alert-danger py-2 fs-13">{editError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Department <span className="text-danger ms-1">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Designation Name <span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Senior Nurse"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Type <span className="text-danger ms-1">*</span>
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="editType"
                        id="edit-type-staff"
                        checked={editType === "Staff"}
                        onChange={() => setEditType("Staff")}
                      />
                      <label className="form-check-label fs-13" htmlFor="edit-type-staff">
                        Staff
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="editType"
                        id="edit-type-doctor"
                        checked={editType === "Doctor"}
                        onChange={() => setEditType("Doctor")}
                      />
                      <label className="form-check-label fs-13" htmlFor="edit-type-doctor">
                        Doctor
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea className="form-control" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Optional description" />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-2 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-light border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== DELETE MODAL ===== */}
      <div className="modal fade" id="delete_designation">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
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
                  <i className="ti ti-trash fs-24"></i>
                </span>
              </div>
              <h5 className="fw-bold mb-2">Delete Designation</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete <strong>{deleteName}</strong>?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-delete-desig"
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-trash me-2" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VIEW MODAL ===== */}
      <ViewModal
        id="view_designation"
        title="Designation Details"
        subtitle="View designation information"
        headerIcon={<i className="ti ti-briefcase" />}
        highlightTitle={viewDesig?.name || "Designation"}
        highlightStatus={
          <span className={`badge border ${viewDesig?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewDesig?.status || "Active"}
          </span>
        }
        highlightRightText={viewDesig?.type || "Type"}
        highlightRightSubText="Type"
        highlightColor="#e0f2fe"
        details={[
          { icon: <i className="ti ti-bookmark" />, label: "Designation Name", value: viewDesig?.name || "—" },
          { icon: <i className="ti ti-category" />, label: "Type", value: viewDesig?.type || "—" },
          { icon: <i className="ti ti-building" />, label: "Department", value: viewDesig?.departmentName || "—" },
          { icon: <i className="ti ti-circle-check" />, label: "Status", value: viewDesig?.status || "—" },
          { icon: <i className="ti ti-calendar" />, label: "Created On", value: viewDesig?.createdAt ? new Date(viewDesig.createdAt).toLocaleDateString("en-GB") : "—" },
          { icon: <i className="ti ti-file-description" />, label: "Description", value: viewDesig?.description || "No description provided", fullWidth: true }
        ]}
        onEdit={() => {
          if (viewDesig) openEdit(viewDesig);
        }}
        editLabel="Edit Designation"
        editModalTarget="#edit_designation"
      />
    </>
  );
};

export default DesignationList;