import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../../core/common/dataTable";
import { all_routes } from "../../../../../routes/all_routes";

import { useClinicRoles } from "../../../../../../core/hooks/useClinicRoles";
import dayjs from "dayjs";
import { RoleModal } from "./RoleModal";

const RolesAndPermissions = () => {
  const { roles, createRole, updateRole, deleteRole } = useClinicRoles();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowModal(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setShowModal(true);
  };
  const columns = [
    {
      title: "Role",
      dataIndex: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      render: (text: string) => dayjs(text).format("DD MMM YYYY"),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Active" ? "badge-soft-success" : "badge-soft-danger"
            }  border ${text === "Active" ? "border-success" : "border-danger"
            } border-success px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: (role: any) => (
        <Link
          to={`${all_routes.permissions}?id=${role.id}`}
          className="btn btn-white border text-dark"
        >
          <i className="ti ti-shield-half me-1" />
          Permissions
        </Link>
      ),
    },
    {
      title: "",
      render: (role: any) => (
        <div className="action-item">
          <Link to="#" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => handleEditRole(role)}
              >
                Edit
              </button>
            </li>
            <li>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => {
                  if (window.confirm("Are you sure?")) {
                    deleteRole(role.id);
                  }
                }}
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Roles</h4>
            </div>
            <div className="text-end d-flex">
              <button
                className="btn btn-primary ms-2 fs-13 btn-md"
                onClick={handleAddRole}
              >
                <i className="ti ti-plus me-1" />
                New Role
              </button>
            </div>
          </div>
          {/* End Page Header */}
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={roles}
              Selection={false}
              searchText={""}
            />
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <RoleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        initialData={selectedRole}
        onSubmit={async (data) => {
          if (selectedRole) {
            await updateRole(selectedRole.id, data);
          } else {
            await createRole(data);
          }
        }}
      />
    </>
  );
};

export default RolesAndPermissions;
