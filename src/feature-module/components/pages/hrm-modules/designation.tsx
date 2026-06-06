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
  const [filterDept, setFilterDept] = useState("");

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

  const filteredDesignations = filterDept
    ? designations.filter(d => d.departmentName === filterDept)
    : designations;

  const columns = [
    {
      title: "S.No",
      render: (_text: any, _record: any, index: number) => index + 1,
    },
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
      render: (text: string) => text || <span className="text-muted"></span>,
    },
    {
      title: "Created Date",
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
      title: "Action",
      render: (_: any, record: Designation) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="btn btn-sm btn-white text-info d-flex align-items-center justify-content-center p-2"
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            title="View"
          >
            <i className="ti ti-eye fs-16" />
          </Link>
          <Link
            to="#"
            className="btn btn-sm btn-white text-primary d-flex align-items-center justify-content-center p-2"
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            data-bs-toggle="modal"
            data-bs-target="#edit_designation"
            onClick={() => openEdit(record)}
            title="Edit"
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            to="#"
            className="btn btn-sm btn-white text-danger d-flex align-items-center justify-content-center p-2"
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            data-bs-toggle="modal"
            data-bs-target="#delete_designation"
            onClick={() => openDelete(record)}
            title="Delete"
          >
            <i className="ti ti-trash fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
            <div className="d-flex align-items-center text-nowrap">
              <h4 className="fw-bold mb-0 d-flex align-items-center">
                Designation
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {filteredDesignations.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Date : </span> Select
                </Link>
                <div className="dropdown-menu dropdown-menu-end p-2">
                  <DatePicker format={{ format: "DD-MM-YYYY", type: "mask" }} getPopupContainer={getModalContainer} placeholder="DD-MM-YYYY" suffixIcon={<i className="ti ti-calendar" />} style={{ width: "100%" }} />
                </div>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Type : </span> All
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Doctor</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Staff</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <span className="me-1"> Department : </span> {filterDept || "All"}
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "180px" }}>
                  <li>
                    <Link to="#" className={`dropdown-item rounded-1 ${filterDept === "" ? "active" : ""}`} onClick={() => setFilterDept("")}>All</Link>
                  </li>
                  {departments.map(d => (
                    <li key={d.id}>
                      <Link to="#" className={`dropdown-item rounded-1 ${filterDept === d.name ? "active" : ""}`} onClick={() => setFilterDept(d.name)}>{d.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Status : </span> All
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Inactive</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">Recent</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Oldest</Link></li>
                </ul>
              </div>

              <Link to="#" className="btn btn-primary fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#add_designation">
                Add New Designation <i className="ti ti-plus ms-2" />
              </Link>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 fs-13">{error}</div>}

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
            ) : (
              <Datatable columns={columns} dataSource={filteredDesignations} Selection={true} searchText={searchText} />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025  <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
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
