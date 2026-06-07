import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import Datatable from "../../../../core/common/dataTable";
import { DatePicker, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewDept, setViewDept] = useState<Department | null>(null);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const filteredData = useMemo(() => {
    return departments.filter((item) => {
      const matchStatus = filterStatus === "All" || item.status === filterStatus;
      const matchDate = !filterDate || dayjs(item.createdAt).isSame(filterDate, 'day');
      return matchStatus && matchDate;
    });
  }, [departments, filterStatus, filterDate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addName.trim()) { setAddError("Department name is required"); return; }
    setAddLoading(true);
    try {
      const res = await fetch(apiUrl("/api/departments"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: addName, description: addDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Department added successfully");
      setAddName(""); setAddDesc("");
      fetchDepartments();
      document.getElementById("btn-close-add-dept")?.click();
    } catch (err: any) {
      setAddError(err.message);
      toast.error(err.message || "Failed to add department");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (dept: Department) => {
    setEditId(dept.id); setEditName(dept.name);
    setEditDesc(dept.description || ""); setEditStatus(dept.status);
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) { setEditError("Department name is required"); return; }
    setEditLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/departments/${editId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, description: editDesc, status: editStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Department updated successfully");
      fetchDepartments();
      document.getElementById("btn-close-edit-dept")?.click();
    } catch (err: any) {
      setEditError(err.message);
      toast.error(err.message || "Failed to update department");
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (dept: Department) => {
    setDeleteId(dept.id); setDeleteName(dept.name);
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

      toast.success("Department deleted successfully");
      fetchDepartments();
      document.getElementById("close_delete_modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete department");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
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
      if (res.ok) {
        toast.success(data.message || "Selected departments deleted");
        setDepartments(departments.filter((d) => !selectedIds.includes(d.id)));
        setSelectedIds([]);
        document.getElementById("close_delete_modal")?.click();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Bulk delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getModalContainer = () => document.getElementById("modal-datepicker") || document.body;

  const columns = [
    {
      title: "S.No",
      render: (_text: any, _record: any, index: number) => index + 1,
    },
    {
      title: "Department",
      dataIndex: "name",
      sorter: (a: Department, b: Department) => a.name.localeCompare(b.name),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (val: string) => new Date(val).toLocaleDateString("en-GB"),
      sorter: (a: Department, b: Department) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "No of Doctor",
      dataIndex: "noOfDoctors",
      render: (val: any) => val || 0,
    },
    {
      title: "No of Designations",
      dataIndex: "noOfDesignations",
      render: (val: any) => val || 0,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className={`badge border ${text === "Active" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} px-2 py-1 fs-13 fw-medium`}>
          {text}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_: any, record: Department) => (
        <div className="d-flex align-items-center justify-content-start gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_department"
            onClick={() => setViewDept(record)}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>
          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit Department"
            data-bs-toggle="modal"
            data-bs-target="#edit_department"
            onClick={() => openEdit(record)}
          >
            <i className="fa fa-edit fs-16"></i>
          </button>
          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete Department"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={() => openDelete(record)}
          >
            <i className="fa fa-trash-alt fs-16"></i>
          </button>
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
                Department
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Departments: {filteredData.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap"
                style={{ width: '130px', minHeight: '38px', paddingTop: '7px' }}
                format="DD-MM-YYYY"
                allowClear={true}
                getPopupContainer={getModalContainer}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("All")}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Active")}>Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Inactive")}>Inactive</Link></li>
                </ul>
              </div>

              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                data-bs-toggle="modal"
                data-bs-target="#add_department"
              >
                Add New Department <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 fs-13">{error}</div>}


          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={filteredData}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_modal"
                onClick={() => setDeleteId("")}
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025  <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      <div id="add_department" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add New Department</h5>
              <button id="btn-close-add-dept" type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAdd}>
                {addError && <div className="alert alert-danger py-2 fs-13">{addError}</div>}
                <div className="mb-3">
                  <label className="form-label fw-bold">Department Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Cardiology" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea className="form-control" rows={3} value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Optional description" />
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={addLoading} style={{ borderRadius: '6px' }}>
                    {addLoading && <i className="fa fa-spinner fa-spin me-2" />}
                    {addLoading ? 'Saving...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <div id="edit_department" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h4 className="modal-title fw-bold">Edit Department</h4>
              <button id="btn-close-edit-dept" type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editError && <div className="alert alert-danger py-2 fs-13">{editError}</div>}
                <div className="mb-3">
                  <label className="form-label fw-bold">Department Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea className="form-control" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-bold">Status</label>
                  <select className="form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-2 border-top">
                <button type="button" className="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary px-4" disabled={editLoading}>
                  {editLoading ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== DELETE MODAL ===== */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center py-4">
              <div className="mb-3">
                <span className="avatar bg-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', margin: '0 auto' }}>
                  <i className="ti ti-trash fs-24 text-white" />
                </span>
              </div>
              <h6 className="mb-1">Delete Confirmation</h6>
              <p className="mb-3 text-muted">
                {deleteId ? `Are you sure you want to delete ${deleteName}?` : `Are you sure you want to delete ${selectedIds.length} departments?`}
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light px-3"
                  data-bs-dismiss="modal"
                  id="close_delete_modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-3"
                  disabled={deleteLoading}
                  onClick={() => {
                    if (deleteId) {
                      handleDelete();
                    } else {
                      handleBulkDelete();
                    }
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VIEW MODAL ===== */}
      <div id="view_department" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">View Department</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={() => setViewDept(null)}></button>
            </div>
            <div className="modal-body">
              {viewDept && (
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Department Name</label>
                    <input type="text" className="form-control bg-light" value={viewDept.name || ""} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Description</label>
                    <textarea className="form-control bg-light" rows={3} value={viewDept.description || "No description provided"} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Status</label>
                    <input type="text" className="form-control bg-light" value={viewDept.status || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Created On</label>
                    <input type="text" className="form-control bg-light" value={new Date(viewDept.createdAt).toLocaleDateString("en-GB")} readOnly />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button type="button" className="btn btn-primary px-5" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HrmDepartments;
