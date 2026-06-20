import { useState, useEffect, useCallback } from "react";
import EmptyState from "../../../../core/common/emptyState";
import { Link, useLocation } from "react-router";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../core/common/dataTable";
import { DatePicker, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

interface Department {
  id: string;
  name: string;
  description?: string;
  status: string;
  noOfDesignations?: number;
  noOfDoctors?: number;
  createdAt: string;
}

const HrmDepartments = () => {
  const location = useLocation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  // Add modal state
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit modal state
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete modal state
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/departments"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDepartments(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setTimeout(() => {
        const btn = document.querySelector('[data-bs-target="#add_department"]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 300);
    }
  }, [location.state]);

  // Filter departments based on status and date
  useEffect(() => {
    const filtered = departments.filter((dept) => {
      const matchStatus = filterStatus === "All" || dept.status === filterStatus;

      let matchDate = true;
      const itemDate = dayjs(dept.createdAt);

      if (filterDatePreset === "Today") {
        matchDate = itemDate.isSame(dayjs(), "day");
      } else if (filterDatePreset === "Yesterday") {
        matchDate = itemDate.isSame(dayjs().subtract(1, "day"), "day");
      } else if (filterDatePreset === "This Week") {
        matchDate = itemDate.isAfter(dayjs().startOf("week").subtract(1, "day")) && itemDate.isBefore(dayjs().endOf("week").add(1, "day"));
      } else if (filterDatePreset === "This Month") {
        matchDate = itemDate.isSame(dayjs(), "month");
      } else if (filterDatePreset === "Custom") {
        if (customRange[0] && customRange[1]) {
          matchDate = itemDate.isAfter(customRange[0].startOf("day").subtract(1, "second")) && itemDate.isBefore(customRange[1].endOf("day").add(1, "second"));
        }
      }

      return matchStatus && matchDate;
    });
    setFilteredDepartments(filtered);
  }, [departments, filterStatus, filterDatePreset, customRange]);

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterDatePreset("All");
    setCustomRange([null, null]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addName.trim()) {
      setAddError("Department name is required");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(apiUrl("/api/departments"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: addName, description: addDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAddName("");
      setAddDesc("");
      setAddError("");
      fetchDepartments();
      toast.success("Department added successfully");
      document.getElementById("btn-close-add-dept")?.click();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (dept: Department) => {
    setEditId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description || "");
    setEditStatus(dept.status);
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) {
      setEditError("Department name is required");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/departments/${editId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEditError("");
      fetchDepartments();
      toast.success("Department updated successfully");
      document.getElementById("btn-close-edit-dept")?.click();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (dept: Department) => {
    setDeleteId(dept.id);
    setDeleteName(dept.name);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/departments/${deleteId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchDepartments();
      toast.success("Department deleted successfully");
      document.getElementById("btn-close-delete-dept")?.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl("/api/departments/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSelectedIds([]);
      fetchDepartments();
      toast.success("Departments deleted successfully");
      document.getElementById("btn-close-bulk-delete-dept")?.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (_text: any, _record: any, index: number) => (
        <span className="text-dark fw-medium">{index + 1}</span>
      ),
      width: 60,
    },
    {
      title: "Department",
      dataIndex: "name",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: Department, b: Department) => a.name.localeCompare(b.name),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (val: string) => (
        <span className="text-dark">{new Date(val).toLocaleDateString("en-GB")}</span>
      ),
      sorter: (a: Department, b: Department) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "No of Doctor",
      dataIndex: "noOfDoctors",
      render: (val: any) => (
        <span className="text-dark">{val || 0}</span>
      ),
      sorter: (a: Department, b: Department) =>
        (a.noOfDoctors || 0) - (b.noOfDoctors || 0),
    },
    {
      title: "No of Designations",
      dataIndex: "noOfDesignations",
      render: (val: any) => (
        <span className="text-dark">{val || 0}</span>
      ),
      sorter: (a: Department, b: Department) =>
        (a.noOfDesignations || 0) - (b.noOfDesignations || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Active"
            ? "badge-soft-success border-success"
            : "badge-soft-danger border-danger"
            }`}
        >
          {text}
        </span>
      ),
      sorter: (a: Department, b: Department) =>
        a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      align: "center" as const,
      className: "text-nowrap",
      width: 120,
      render: (_: any, record: Department) => (
        <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
          {/* View Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            onClick={() => {
              // Add view functionality if needed
            }}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_department"
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
            data-bs-target="#delete_department"
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
                Department
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Departments : {loading ? "" : filteredDepartments.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Clear Filter Button - Only show when any filter is active */}
              {(filterStatus !== "All" || filterDatePreset !== "All") && (
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
                  {["All", "Today", "Yesterday", "This Week", "This Month", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          if (preset === "Custom") e.stopPropagation();
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
              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap w-100"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {["All", "Active", "Inactive"].map((s) => (
                    <li key={s}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterStatus(s);
                        }}
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add Department Button */}
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_department"
                onClick={() => {
                  setAddName("");
                  setAddDesc("");
                }}
              >
                Add Department <i className="fa fa-plus ms-2" />
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
                onClick={() => fetchDepartments()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading departments</p>
            </div>
          ) : departments.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No departments yet"
                message="Organize your clinic by creating your first department. This helps in grouping staff and medical services."
                action={
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_department"
                  >
                    Add Department <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={filteredDepartments}
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
                data-bs-target="#bulk_delete_department_modal"
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
      <div id="add_department" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Add New Department</h5>
              <button
                id="btn-close-add-dept"
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {addError && (
                  <div className="alert alert-danger py-2 fs-13">{addError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Department Name
                    <span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="mb-0">
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
                      Add Department
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <div id="edit_department" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Department</h5>
              <button
                id="btn-close-edit-dept"
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editError && (
                  <div className="alert alert-danger py-2 fs-13">{editError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-bold">Department Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Cardiology" />
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
      <div className="modal fade" id="delete_department">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
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
              <h5 className="fw-bold mb-2">Delete Department</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete <strong>{deleteName}</strong>?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-delete-dept"
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

      {/* ===== BULK DELETE MODAL ===== */}
      <div className="modal fade" id="bulk_delete_department_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
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
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete selected departments?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-bulk-delete-dept"
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  onClick={handleBulkDelete}
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
    </>
  );
};

export default HrmDepartments;