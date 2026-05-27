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
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addName.trim()) { setAddError("Designation name is required"); return; }
    if (!addDeptId) { setAddError("Please select a department"); return; }
    setAddLoading(true);
    try {
      const res = await fetch(apiUrl("/api/designations"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: addName, type: addType, description: addDesc, departmentId: addDeptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAddName(""); setAddType("Staff"); setAddDeptId(""); setAddDesc("");
      fetchDesignations();
      document.getElementById("btn-close-add-desig")?.click();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (d: Designation) => {
    setEditId(d.id); setEditName(d.name); setEditType(d.type);
    setEditDeptId(d.departmentId || ""); setEditDesc(d.description || "");
    setEditStatus(d.status); setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editName.trim()) { setEditError("Designation name is required"); return; }
    if (!editDeptId) { setEditError("Please select a department"); return; }
    setEditLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/designations/${editId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, type: editType, description: editDesc, departmentId: editDeptId, status: editStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchDesignations();
      document.getElementById("btn-close-edit-desig")?.click();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (d: Designation) => { setDeleteId(d.id); setDeleteName(d.name); };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/designations/${deleteId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchDesignations();
      document.getElementById("btn-close-delete-desig")?.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getModalContainer = () => document.getElementById("modal-datepicker") || document.body;

  const columns = [
    {
      title: "Designation",
      dataIndex: "name",
      sorter: (a: Designation, b: Designation) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (text: string) => (
        <span className={`badge border ${text === "Doctor" ? "badge-soft-primary border-primary" : "badge-soft-secondary border-secondary"} px-2 py-1 fs-13 fw-medium`}>
          {text}
        </span>
      ),
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      render: (text: string) => text || <span className="text-muted">—</span>,
    },
    {
      title: "CreatedDate",
      dataIndex: "createdAt",
      render: (val: string) => new Date(val).toLocaleDateString("en-GB"),
      sorter: (a: Designation, b: Designation) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
      render: (_: any, record: Designation) => (
        <div className="action-item">
          <Link to="#" data-bs-toggle="dropdown"><i className="ti ti-dots-vertical" /></Link>
          <ul className="dropdown-menu">
            <li>
              <Link to="#" className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal" data-bs-target="#edit_designation"
                onClick={() => openEdit(record)}>
                <i className="ti ti-edit me-2" /> Edit
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item d-flex align-items-center text-danger"
                data-bs-toggle="modal" data-bs-target="#delete_designation"
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
                Designation
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {designations.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <Link to="#" className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal" data-bs-target="#add_designation">
                <i className="ti ti-plus me-1" /> Add New Designation
              </Link>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 fs-13">{error}</div>}

          {/* Filters */}
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
              <Datatable columns={columns} dataSource={designations} Selection={false} searchText={searchText} />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 © <Link to="#" className="link-primary">Preclinic</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ===== ADD MODAL ===== */}
      <div id="add_designation" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Add New Designation</h4>
              <button id="btn-close-add-desig" type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {addError && <div className="alert alert-danger py-2 fs-13">{addError}</div>}

                {/* Type radio */}
                <div className="mb-3">
                  <label className="form-label">Type <span className="text-danger ms-1">*</span></label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check d-flex align-items-center">
                      <input className="form-check-input me-2" type="radio" name="addType" id="add-type-staff"
                        checked={addType === "Staff"} onChange={() => setAddType("Staff")} />
                      <label className="form-check-label fs-13" htmlFor="add-type-staff">Staff</label>
                    </div>
                    <div className="form-check d-flex align-items-center">
                      <input className="form-check-input me-2" type="radio" name="addType" id="add-type-doctor"
                        checked={addType === "Doctor"} onChange={() => setAddType("Doctor")} />
                      <label className="form-check-label fs-13" htmlFor="add-type-doctor">Doctor</label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Designation Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={addName}
                    onChange={e => setAddName(e.target.value)} placeholder="e.g. Senior Nurse" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Department <span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={addDeptId} onChange={e => setAddDeptId(e.target.value)}>
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {departments.length === 0 && (
                    <small className="text-warning">No active departments found. <Link to="/hrm-departments">Add a department first.</Link></small>
                  )}
                </div>

                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={addDesc}
                    onChange={e => setAddDesc(e.target.value)} placeholder="Optional description" />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Add Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <div id="edit_designation" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Edit Designation</h4>
              <button id="btn-close-edit-desig" type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editError && <div className="alert alert-danger py-2 fs-13">{editError}</div>}

                <div className="mb-3">
                  <label className="form-label">Type <span className="text-danger ms-1">*</span></label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check d-flex align-items-center">
                      <input className="form-check-input me-2" type="radio" name="editType" id="edit-type-staff"
                        checked={editType === "Staff"} onChange={() => setEditType("Staff")} />
                      <label className="form-check-label fs-13" htmlFor="edit-type-staff">Staff</label>
                    </div>
                    <div className="form-check d-flex align-items-center">
                      <input className="form-check-input me-2" type="radio" name="editType" id="edit-type-doctor"
                        checked={editType === "Doctor"} onChange={() => setEditType("Doctor")} />
                      <label className="form-check-label fs-13" htmlFor="edit-type-doctor">Doctor</label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Designation Name <span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Department <span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={editDeptId} onChange={e => setEditDeptId(e.target.value)}>
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
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
      <div className="modal fade" id="delete_designation">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24" /></span>
              </div>
              <h5 className="fw-bold mb-1">Delete Designation</h5>
              <p className="mb-3">Are you sure you want to delete <strong>{deleteName}</strong>?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-delete-desig" type="button" className="btn btn-light position-relative z-1" data-bs-dismiss="modal">Cancel</button>
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

export default DesignationList;
