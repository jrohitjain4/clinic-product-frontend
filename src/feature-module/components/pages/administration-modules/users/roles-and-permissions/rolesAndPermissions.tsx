import { useState, useMemo } from "react";
import EmptyState from "../../../../../../core/common/emptyState";
import { Link } from "react-router";
import Datatable from "../../../../../../core/common/dataTable";
import { all_routes } from "../../../../../routes/all_routes";
import { useClinicRoles } from "../../../../../../core/hooks/useClinicRoles";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import dayjs from "dayjs";

const RolesAndPermissions = () => {
  const { roles, createRole, updateRole, deleteRole, loading, error } =
    useClinicRoles();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewRole, setViewRole] = useState<any>(null);

  // Modal Form States
  const [name, setName] = useState("");
  const [status, setStatus] = useState<any>({ value: "Active", label: "Active" });
  const [submitting, setSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    return roles.filter((role: any) => {
      const matchStatus =
        filterStatus === "All" || role.status === filterStatus;
      return matchStatus;
    });
  }, [roles, filterStatus]);

  const data = filteredData.map((role: any, index: number) => ({
    key: role.id,
    id: role.id,
    S_No: index + 1,
    Role: role.name,
    CreatedOn: dayjs(role.createdAt).format("DD MMM YYYY"),
    Status: role.status || "Active",
    raw: role,
  }));

  const handleCreateSubmit = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createRole({ name, status: status?.value || "Active" });
      document.querySelector<HTMLElement>("#add_role .btn-close")?.click();
      setName("");
      setStatus({ value: "Active", label: "Active" });
    } catch (err: any) {
      alert(err.message || "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedRole || !name.trim()) return;
    setSubmitting(true);
    try {
      await updateRole(selectedRole.id, { name, status: status?.value || "Active" });
      document.querySelector<HTMLElement>("#edit_role .btn-close")?.click();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Role",
      dataIndex: "Role",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.Role.localeCompare(b.Role),
    },
    {
      title: "Created On",
      dataIndex: "CreatedOn",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.createdAt).getTime() -
        new Date(b.raw.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "Status",
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
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Permissions",
      align: "center" as const,
      render: (role: any) => (
        <Link
          to={`${all_routes.permissions}?id=${role.id}`}
          className="btn btn-sm btn-light border text-dark"
          style={{ minHeight: "32px" }}
        >
          <i className="ti ti-shield me-1" />
          Manage
        </Link>
      ),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (role: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            onClick={() => setViewRole(role)}
            data-bs-toggle="modal"
            data-bs-target="#view_role"
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_role"
            onClick={() => {
              setSelectedRole(role.raw);
              setName(role.Role || "");
              setStatus({ value: role.Status || "Active", label: role.Status || "Active" });
            }}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this role?")) {
                deleteRole(role.id);
              }
            }}
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
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
                Roles & Permissions
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
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

              {/* New Role Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_role"
                onClick={() => {
                  setSelectedRole(null);
                  setName("");
                  setStatus({ value: "Active", label: "Active" });
                }}
              >
                New Role <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger">
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading roles</p>
            </div>
          ) : roles.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No roles yet"
                message="Define clear access levels by creating roles like Receptionist, Doctor, or Manager."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_role"
                    onClick={() => {
                      setSelectedRole(null);
                      setName("");
                      setStatus({ value: "Active", label: "Active" });
                    }}
                  >
                    New Role <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
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
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete selected roles?"
                    )
                  ) {
                    selectedIds.forEach((id) => {
                      deleteRole(id);
                    });
                    setSelectedIds([]);
                  }
                }}
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

      {/* ===== VIEW ROLE MODAL ===== */}
      <div id="view_role" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">Role Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewRole(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewRole && (
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Role Name
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRole.Role || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRole.Status || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Created On
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRole.CreatedOn || ""}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewRole(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <div id="add_role" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Add New Role</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Role Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter role name (e.g. Accountant)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                  <CommonSelect
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" }
                    ]}
                    className="select"
                    value={status}
                    onChange={(val: any) => setStatus(val)}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={submitting} style={{ borderRadius: '6px' }}>
                    {submitting && <i className="fa fa-spinner fa-spin me-2" />}
                    {submitting ? "Saving..." : "Save Role"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      <div id="edit_role" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Role</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Role Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter role name (e.g. Accountant)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                  <CommonSelect
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" }
                    ]}
                    className="select"
                    value={status}
                    onChange={(val: any) => setStatus(val)}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={submitting} style={{ borderRadius: '6px' }}>
                    {submitting && <i className="fa fa-spinner fa-spin me-2" />}
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RolesAndPermissions;