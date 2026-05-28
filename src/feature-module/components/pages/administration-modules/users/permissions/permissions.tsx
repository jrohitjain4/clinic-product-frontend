import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { useClinicRoles } from "../../../../../../core/hooks/useClinicRoles";

// Modules definition
const MODULE_GROUPS = [
  {
    group: "Clinic",
    modules: ["Doctors", "Patients", "Appointments", "Locations", "Visits", "Services", "Designations", "Departments", "Activities"]
  },
  {
    group: "Hrm",
    modules: ["Staffs", "Departments", "Designation", "Attendance", "Leaves", "Holidays", "Payroll"]
  },
  {
    group: "Finance & Accounts",
    modules: ["Expenses", "Income", "Invoices", "Payments", "Transactions"]
  }
];

const ACTIONS = ["CREATE", "EDIT", "DELETE", "VIEW"];

const Permissions = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const { roles, updateRole, loading } = useClinicRoles();
  const [role, setRole] = useState<any>(null);

  // permissions[moduleName][actionName] = boolean
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && id) {
      const found = roles.find((r) => r.id === id);
      if (found) {
        setRole(found);
        setPermissions(
          (found.permissions && !Array.isArray(found.permissions)) ? (found.permissions as any) : {}
        );
      }
    }
  }, [roles, id]);

  const handleActionToggle = (module: string, action: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: checked
      }
    }));
  };

  const handleRowToggle = (module: string, checked: boolean) => {
    setPermissions(prev => {
      const allActions = ACTIONS.reduce((acc, a) => ({ ...acc, [a]: checked }), {});
      return { ...prev, [module]: allActions };
    });
  };

  const handleGroupToggle = (groupModules: string[], checked: boolean) => {
    setPermissions(prev => {
      const next = { ...prev };
      groupModules.forEach(mod => {
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
      navigate(all_routes.rolesPermissions);
    } catch (e: any) {
      alert(e.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !role) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <h6 className="fs-14 mb-3">
            <Link to={all_routes.rolesPermissions}>
              <i className="ti ti-chevron-left me-1" />
              Roles
            </Link>
          </h6>
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Permissions for {role.name}</h4>
            </div>
            <div className="text-end d-flex">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>

          {MODULE_GROUPS.map((mg) => (
            <div className="card mb-3" key={mg.group}>
              <div className="card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0">{mg.group}</h6>
                  <div className="form-check form-check-md">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`select-all-${mg.group}`}
                      checked={mg.modules.every(mod => ACTIONS.every(a => permissions[mod]?.[a]))}
                      onChange={(e) => handleGroupToggle(mg.modules, e.target.checked)}
                    />
                    <label htmlFor={`select-all-${mg.group}`}>Allow All</label>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive border">
                  <table className="table table-nowrap">
                    <thead className="thead-light">
                      <tr>
                        <th>Module</th>
                        {ACTIONS.map((a) => (
                          <th key={a}>{a}</th>
                        ))}
                        <th>ALLOW ALL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mg.modules.map((mod) => (
                        <tr key={mod}>
                          <td>
                            <p className="fw-medium text-dark">{mod}</p>
                          </td>
                          {ACTIONS.map((a) => (
                            <td key={a}>
                              <div className="form-check form-check-md">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!permissions[mod]?.[a]}
                                  onChange={(e) => handleActionToggle(mod, a, e.target.checked)}
                                />
                              </div>
                            </td>
                          ))}
                          <td>
                            <div className="form-check form-check-md">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={ACTIONS.every(a => permissions[mod]?.[a])}
                                onChange={(e) => handleRowToggle(mod, e.target.checked)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Permissions;
