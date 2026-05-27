import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../core/common/dataTable";
import { DatePicker, Select } from "antd";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../core/config/api";

interface Department {
  id: string;
  name: string;
  description?: string;
  status: string;
  noOfDesignations: number;
  createdAt: string;
}

const HrmDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

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
      setAddName(""); setAddDesc("");
      fetchDepartments();
      document.getElementById("btn-close-add-dept")?.click();
    } catch (err: any) {
      setAddError(err.message);
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
      fetchDepartments();
      document.getElementById("btn-close-edit-dept")?.click();
    } catch (err: any) {
      setEditError(err.message);
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
      fetchDepartments();
      document.getElementById("btn-close-delete-dept")?.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getModalContainer = () => document.getElementById("modal-datepicker") || document.body;

  const columns = [
    {
      title: "Department",
      dataIndex: "name",
      sorter: (a: Department, b: Department) => a.name.localeCompare(b.name),
    },
    {
      title: "CreatedDate",
      dataIndex: "createdAt",
      render: (val: string) => new Date(val).toLocaleDateString("en-GB"),
      sorter: (a: Department, b: Department) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "No of Designations",
      dataIndex: "noOfDesignations",
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
      title: "",
      render: (_: any, record: Department) => (
        <div className="action-item">
          <Link to="#" data-bs-toggle="dropdown"><i className="ti ti-dots-vertical" /></Link>
          <ul className="dropdown-menu">
            <li>
              <Link to="#" className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal" data-bs-target="#edit_department"
                onClick={() => openEdit(record)}>
                <i className="ti ti-edit me-2" /> Edit
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item d-flex align-items-center text-danger"
                data-bs-toggle="modal" data-bs-target="#delete_department"
                onClick={() => openDelete(record)}>
                <i className="ti ti-trash me-2" /> Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Department
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {departments.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <Link to="#" className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal" data-bs-target="#add_department">
                <i className="ti ti-plus me-1" /> Add New Department
              </Link>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 fs-13">{error}</div>}

          {/* Filter row */}
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <div className="search-set">
              <div className="search-input">
                <SearchInput value={searchText} onChange={setSearchText} />
              </div>
            </div>
            <div className="d-flex table-dropdown right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link to="#" className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"
                  data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i className="ti ti-filter text-gray-5 me-1" /> Filters
                </Link>
                <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                    <h5 className="mb-0 fw-bold">Filter</h5>
                  </div>
                  <form action="#">
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">Date</label>
                        <div className="input-icon-end position-relative">
                          <DatePicker className="form-control datetimepicker"
                            format={{ format: "DD-MM-YYYY", type: "mask" }}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY" suffixIcon={null} />
                          <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <Select mode="multiple" allowClear style={{ width: "100%" }} placeholder="Select status"
                          defaultValue={[]}
                          options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }]} />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <button type="button" className="btn btn-light btn-md me-2">Close</button>
                      <button type="submit" className="btn btn-primary btn-md">Filter</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : (
              <Datatable columns={columns} dataSource={departments} Selection={false} searchText={searchText} />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 © <Link to="#" className="link-primary">Preclinic</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      <div id="add_department" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Add New Department</h4>
              <button id="btn-close-add-dept" type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {addError && <div className="alert alert-danger py-2 fs-13">{addError}</div>}
                <div className="mb-3">
                  <label className="form-label">Department Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Cardiology" />
                </div>
                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Optional description" />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Add Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <div id="edit_department" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Edit Department</h4>
              <button id="btn-close-edit-dept" type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editError && <div className="alert alert-danger py-2 fs-13">{editError}</div>}
                <div className="mb-3">
                  <label className="form-label">Department Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
                <div className="mb-0">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== DELETE MODAL ===== */}
      <div className="modal fade" id="delete_department">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24" /></span>
              </div>
              <h5 className="fw-bold mb-1">Delete Department</h5>
              <p className="mb-3">Are you sure you want to delete <strong>{deleteName}</strong>?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-delete-dept" type="button" className="btn btn-light position-relative z-1" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Yes, Delete"}
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
