import { useState, useMemo, useEffect } from "react";
import EmptyState from "../../../../../../core/common/emptyState";
import { Link, useSearchParams } from "react-router";
import Datatable from "../../../../../../core/common/dataTable";
import { all_routes } from "../../../../../routes/all_routes";
import { useClinicRoles } from "../../../../../../core/hooks/useClinicRoles";
import { IconFormControl, IconSelect } from "../../../../../../core/common/form-fields";
import dayjs from "dayjs";

const SIDEBAR_SECTIONS = [
  {
    section: "OPD",
    items: [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Doctors", label: "Doctors" },
      { key: "Patients", label: "Patients" },
      { key: "Appointments", label: "Appointments" },
      { key: "Consultations", label: "Consultations" }
    ]
  },
  {
    section: "IPD",
    items: [
      { key: "IPD Dashboard", label: "Dashboard" },
      { key: "IPD Patient", label: "Patient" },
      { key: "Admission", label: "Admission" },
      { key: "Inpatient", label: "Inpatient" },
      { key: "Discharge", label: "Discharge" },
      { key: "Ward Management", label: "Ward Management" },
      { key: "IPD Billings & Invoices", label: "Billings & Invoices" },
      { key: "IPD Doctor", label: "Doctor" },
      { key: "Treatment & Packages", label: "Treatment & Packages" }
    ]
  },
  {
    section: "Diagnostic",
    items: [
      { key: "Diagnostic Dashboard", label: "Dashboard" },
      { key: "Category", label: "Category" },
      { key: "Diagnostic Test", label: "Diagnostic Test" },
      { key: "Diagnostic Booking", label: "Diagnostic Booking" },
      { key: "Invoice (Diagnostic)", label: "Invoice" }
    ]
  },
  {
    section: "Pharmacy",
    items: [
      { key: "Pharmacy Dashboard", label: "Dashboard" },
      { key: "Pharmacy Category", label: "Category" },
      { key: "Medicine", label: "Medicine" },
      { key: "Inventory", label: "Inventory" },
      { key: "Pharmacy Billing", label: "Pharmacy Billing" },
      { key: "Sales History", label: "Sales History" }
    ]
  },
  {
    section: "HRM",
    items: [
      { key: "Staffs", label: "Staffs" },
      { key: "Departments", label: "Departments" },
      { key: "Designation", label: "Designation" },
      { key: "Attendance", label: "Attendance" },
      { key: "Leaves", label: "Leaves" },
      { key: "Holidays", label: "Holidays" },
      { key: "Payroll", label: "Payroll" }
    ]
  },
  {
    section: "Finance & Accounts",
    items: [
      { key: "Expenses", label: "Expenses" },
      { key: "Invoices", label: "Invoices" },
      { key: "Transactions", label: "Transactions" }
    ]
  },
  {
    section: "Therapy",
    items: [
      { key: "Therapy Dashboard", label: "Dashboard" },
      { key: "Therapy Patients", label: "Patients" },
      { key: "Therapists", label: "Therapists" },
      { key: "Therapies", label: "Therapies" },
      { key: "Therapy Appointments", label: "Appointments" },
      { key: "Therapy Consultancy", label: "Consultancy" },
      { key: "Therapy Sessions", label: "Sessions" },
      { key: "Therapy Invoices", label: "Invoices" }
    ]
  },
  {
    section: "Application",
    items: [
      { key: "To Do", label: "To Do" },
      { key: "Notes", label: "Notes" }
    ]
  },
  {
    section: "Support",
    items: [
      { key: "Support", label: "Support" }
    ]
  },
  {
    section: "Administration",
    items: [
      { key: "Roles & Permissions", label: "Roles & Permissions" },
      { key: "Refer Sources", label: "Refer Sources" }
    ]
  }
];

const ACTIONS = ["CREATE", "EDIT", "DELETE", "VIEW"];

const SECTION_ICONS: Record<string, string> = {
  OPD: "ti ti-stethoscope",
  IPD: "ti ti-bed",
  Diagnostic: "ti ti-microscope",
  Pharmacy: "ti ti-pill",
  HRM: "ti ti-users-group",
  "Finance & Accounts": "ti ti-report-money",
  Therapy: "ti ti-heart-handshake",
  Application: "ti ti-apps",
  Support: "ti ti-headset",
  Administration: "ti ti-user-cog",
};

const TOTAL_MODULES = SIDEBAR_SECTIONS.reduce((n, s) => n + s.items.length, 0);

const isModuleEnabled = (
  permissions: Record<string, Record<string, boolean>>,
  moduleKey: string
) => ACTIONS.every((a) => permissions[moduleKey]?.[a]);

const RolesAndPermissions = () => {
  const { roles, createRole, updateRole, deleteRole, loading, error } =
    useClinicRoles();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "roles";
  const id = searchParams.get("id");

  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewRole, setViewRole] = useState<any>(null);

  // Modal Form States
  const [name, setName] = useState("");
  const [status, setStatus] = useState<any>({ value: "Active", label: "Active" });
  const [submitting, setSubmitting] = useState(false);

  // Permissions config states
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);

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

  // Memoized current active role based on id or first role
  const role = useMemo(() => {
    if (roles.length === 0) return null;
    return roles.find((r: any) => r.id === id) || roles[0];
  }, [roles, id]);

  // Sync permissions state when active role changes
  useEffect(() => {
    if (role) {
      setPermissions(
        (role.permissions && !Array.isArray(role.permissions)) ? (role.permissions as any) : {}
      );
    }
  }, [role]);

  const enabledModulesCount = useMemo(() => {
    return SIDEBAR_SECTIONS.reduce((count, section) => {
      return (
        count +
        section.items.filter((item) => isModuleEnabled(permissions, item.key)).length
      );
    }, 0);
  }, [permissions]);

  const handleSingleToggle = (moduleKey: string, checked: boolean) => {
    setPermissions(prev => {
      const allActions = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: checked }), {});
      return { ...prev, [moduleKey]: allActions };
    });
  };

  const handleSectionToggle = (moduleKeys: string[], checked: boolean) => {
    setPermissions(prev => {
      const next = { ...prev };
      moduleKeys.forEach(mod => {
        next[mod] = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: checked }), {});
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    try {
      await updateRole(role.id, { permissions });
      alert("Permissions saved successfully!");
    } catch (e: any) {
      alert(e.message || "Failed to save permissions");
    } finally {
      setSaving(false);
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
          to={`?tab=permissions&id=${role.id}`}
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
                {activeTab === "roles" && (
                  <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                    Total : {loading ? "" : filteredData.length}
                  </span>
                )}
              </h4>
            </div>

            {/* Filter and Action Buttons - ONLY show on Roles Tab */}
            {activeTab === "roles" && (
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
            )}

            {/* Selector and Save Button - ONLY show on Permissions Tab */}
            {activeTab === "permissions" && (
              <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium px-3 py-2">
                  {enabledModulesCount} / {TOTAL_MODULES} modules enabled
                </span>
                <button
                  className="btn btn-primary d-flex align-items-center justify-content-center"
                  onClick={handleSave}
                  disabled={saving || !role}
                  style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-device-floppy me-1" />
                      Save Permissions
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Tab Selection Navigation */}
          <ul className="nav nav-tabs nav-bordered mb-4">
            <li className="nav-item">
              <Link
                to="?tab=roles"
                className={`nav-link bg-transparent ${activeTab === "roles" ? "active fw-semibold text-primary" : "text-muted"}`}
              >
                <i className="ti ti-user-cog me-1" />
                Roles
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to={`?tab=permissions${id ? `&id=${id}` : (roles[0]?.id ? `&id=${roles[0].id}` : "")}`}
                className={`nav-link bg-transparent ${activeTab === "permissions" ? "active fw-semibold text-primary" : "text-muted"}`}
              >
                <i className="ti ti-shield-lock me-1" />
                Permissions
              </Link>
            </li>
          </ul>

          {/* Tab Content */}
          {activeTab === "roles" ? (
            /* Roles Tab Content */
            <>
              {error && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
                  <span>{error}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger">
                    Retry
                  </button>
                </div>
              )}

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
            </>
          ) : (
            /* Permissions Tab Content */
            <>
              {loading || !role ? (
                <div className="text-center py-5">
                  <span className="spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0">Loading role permissions...</p>
                </div>
              ) : (
                <div className="perm-manage">
                  <div className="perm-role-bar d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 p-3 p-md-4 bg-white border">
                    <div className="d-flex align-items-center gap-3 min-w-0">
                      <div className="perm-role-icon d-flex align-items-center justify-content-center flex-shrink-0">
                        <i className="ti ti-shield-lock" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted fs-12 mb-1 text-uppercase fw-semibold letter-spacing">
                          Configuring access for
                        </p>
                        <h5 className="fw-bold text-dark mb-0 text-truncate">{role.name}</h5>
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2" style={{ minWidth: "220px" }}>
                      <span className="text-dark fw-medium text-nowrap align-self-center d-none d-sm-inline">Role</span>
                      {roles.length > 0 && (
                        <div className="flex-grow-1" style={{ minWidth: "180px" }}>
                          <IconSelect
                            fieldLabel="role"
                            options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
                            value={role ? { value: role.id, label: role.name } : null}
                            onChange={(val: any) => {
                              if (val) {
                                setSearchParams({ tab: "permissions", id: val.value });
                              }
                            }}
                            className="select"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row g-3">
                    {SIDEBAR_SECTIONS.map((mg) => {
                      const sectionEnabled = mg.items.filter((item) =>
                        isModuleEnabled(permissions, item.key)
                      ).length;
                      const allOn = mg.items.every((item) =>
                        isModuleEnabled(permissions, item.key)
                      );
                      const sectionIcon = SECTION_ICONS[mg.section] || "ti ti-folder";

                      return (
                        <div className="col-12" key={mg.section}>
                          <div className="perm-section bg-white border overflow-hidden">
                            <div className="perm-section-head d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 px-3 px-md-4 py-3">
                              <div className="d-flex align-items-center gap-3 min-w-0">
                                <div className="perm-section-icon d-flex align-items-center justify-content-center flex-shrink-0">
                                  <i className={sectionIcon} />
                                </div>
                                <div className="min-w-0">
                                  <h6 className="fw-bold text-dark mb-0">{mg.section}</h6>
                                  <span className="fs-12 text-muted">
                                    {sectionEnabled} of {mg.items.length} modules
                                  </span>
                                </div>
                              </div>
                              <div className="form-check form-switch form-check-md mb-0 ms-sm-auto">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`select-all-${mg.section}`}
                                  checked={allOn}
                                  onChange={(e) =>
                                    handleSectionToggle(
                                      mg.items.map((i) => i.key),
                                      e.target.checked
                                    )
                                  }
                                  style={{ cursor: "pointer" }}
                                />
                                <label
                                  className="form-check-label fw-medium text-dark ms-2"
                                  htmlFor={`select-all-${mg.section}`}
                                  style={{ cursor: "pointer" }}
                                >
                                  Allow All
                                </label>
                              </div>
                            </div>

                            <div className="perm-module-list">
                              {mg.items.map((item) => {
                                const isChecked = isModuleEnabled(permissions, item.key);
                                return (
                                  <div
                                    key={item.key}
                                    className={`perm-module-row d-flex align-items-center justify-content-between gap-3 px-3 px-md-4 py-3 ${isChecked ? "is-enabled" : ""}`}
                                  >
                                    <div className="d-flex align-items-center gap-2 min-w-0">
                                      <span className={`perm-dot flex-shrink-0 ${isChecked ? "on" : ""}`} />
                                      <span className={`fw-semibold text-truncate ${isChecked ? "text-dark" : "text-muted"}`}>
                                        {item.label}
                                      </span>
                                      {isChecked && (
                                        <span className="badge badge-soft-success border border-success fs-11 fw-medium d-none d-sm-inline-flex">
                                          Enabled
                                        </span>
                                      )}
                                    </div>
                                    <div className="form-check form-switch form-check-md mb-0 flex-shrink-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`perm-${item.key}`}
                                        checked={isChecked}
                                        onChange={(e) =>
                                          handleSingleToggle(item.key, e.target.checked)
                                        }
                                        style={{ cursor: "pointer" }}
                                      />
                                      <label
                                        className="form-check-label visually-hidden"
                                        htmlFor={`perm-${item.key}`}
                                      >
                                        Toggle {item.label}
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <style>{`
                    .perm-manage .letter-spacing { letter-spacing: 0.04em; }
                    .perm-role-bar {
                      border-radius: 12px;
                      background:
                        linear-gradient(135deg, rgba(13, 110, 253, 0.06) 0%, rgba(255,255,255,0) 45%),
                        #fff;
                    }
                    .perm-role-icon {
                      width: 48px;
                      height: 48px;
                      border-radius: 12px;
                      background: rgba(13, 110, 253, 0.12);
                      color: var(--bs-primary, #0d6efd);
                      font-size: 22px;
                    }
                    .perm-section {
                      border-radius: 12px;
                      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
                    }
                    .perm-section-head {
                      border-bottom: 1px solid rgba(0,0,0,0.06);
                      background: #f8fafc;
                    }
                    .perm-section-icon {
                      width: 40px;
                      height: 40px;
                      border-radius: 10px;
                      background: #e8f1ff;
                      color: #0d6efd;
                      font-size: 18px;
                    }
                    .perm-module-row {
                      border-bottom: 1px solid rgba(0,0,0,0.05);
                      transition: background 0.15s ease;
                    }
                    .perm-module-row:last-child { border-bottom: 0; }
                    .perm-module-row.is-enabled {
                      background: rgba(25, 135, 84, 0.04);
                    }
                    .perm-module-row:hover {
                      background: rgba(13, 110, 253, 0.03);
                    }
                    .perm-module-row.is-enabled:hover {
                      background: rgba(25, 135, 84, 0.07);
                    }
                    .perm-dot {
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: #cbd5e1;
                    }
                    .perm-dot.on {
                      background: #198754;
                      box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.18);
                    }
                    .perm-manage .form-check-input {
                      width: 2.2em;
                      height: 1.2em;
                      cursor: pointer;
                    }
                  `}</style>
                </div>
              )}
            </>
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
                    <IconFormControl
                      type="text"
                      fieldLabel="role"
                      className="bg-light"
                      placeholder="Role Name"
                      value={viewRole.Role || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Status
                    </label>
                    <IconFormControl
                      type="text"
                      fieldLabel="status"
                      className="bg-light"
                      placeholder="Status"
                      value={viewRole.Status || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Created On
                    </label>
                    <IconFormControl
                      type="text"
                      fieldLabel="date"
                      className="bg-light"
                      placeholder="Created On"
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
                  <IconFormControl
                    type="text"
                    fieldLabel="role"
                    placeholder="Enter role name (e.g. Accountant)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                  <IconSelect
                    fieldLabel="status"
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
                  <IconFormControl
                    type="text"
                    fieldLabel="role"
                    placeholder="Enter role name (e.g. Accountant)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                  <IconSelect
                    fieldLabel="status"
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