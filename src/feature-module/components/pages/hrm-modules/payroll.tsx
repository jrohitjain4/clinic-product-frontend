import { useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import { all_routes } from "../../../routes/all_routes";
import Datatable from "../../../../core/common/dataTable";
import PayrollListModal from "./modal/payrollListModal";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";

const PayrollList = () => {
  const { payrolls, refetch } = usePayroll();
  const { staffs } = useClinicStaff();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

  const data = payrolls.map((pr: any) => ({
    key: pr.id,
    id: pr.id,
    Employee: pr.staff?.fullName || "Unknown",
    Image: pr.staff?.profileImage && !pr.staff.profileImage.startsWith("http") ? pr.staff.profileImage : null,
    Email: pr.staff?.email || "--",
    JoiningDate: pr.staff?.dateOfJoining ? new Date(pr.staff.dateOfJoining).toLocaleDateString() : "--",
    Role: pr.staff?.role || "--",
    Salary: "$" + pr.netSalary,
    Status: pr.status,
    raw: pr,
  }));

  const columns = [
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar me-2">
            {record.Image ? (
              <ImageWithBasePath
                src={`assets/img/users/${record.Image}`}
                alt="Employee"
                className="rounded-circle"
              />
            ) : (
              <span
                className="avatar avatar-md rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold"
                style={{ fontSize: 14 }}
              >
                {text?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </Link>
          <div>
            <h6 className="mb-0 fs-14 fw-semibold">
              <Link to="#">{text}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Employee.length - b.Employee.length,
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: any, b: any) => a.Email.length - b.Email.length,
    },
    {
      title: "JoiningDate",
      dataIndex: "JoiningDate",
      sorter: (a: any, b: any) => a.JoiningDate.length - b.JoiningDate.length,
    },
    {
      title: "Role",
      dataIndex: "Role",
      sorter: (a: any, b: any) => a.Role.length - b.Role.length,
    },
    {
      title: "Salary",
      dataIndex: "Salary",
      sorter: (a: any, b: any) => a.Salary.length - b.Salary.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <Link
          to={all_routes.payroll2}
          className="btn btn-white border text-dark"
        >
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: (_: string, record: any) => (
        <div className="action-item p-2">
          <Link
            to="#"
            data-bs-toggle="dropdown"
            className="btn p-1 btn-white border"
          >
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_payroll"
                onClick={() => setSelectedPayroll(record.raw)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_payroll"
                onClick={() => setSelectedPayroll(record.raw)}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="mb-3 pb-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h4 className="fw-bold mb-0 me-2">Payroll</h4>
                <span className="badge badge-soft-primary border border-primary fw-medium">
                  Total Employee Payrolls : {payrolls.length}
                </span>
              </div>
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_payroll"
              >
                <i className="ti ti-plus me-1" />
                Add Employee Salary
              </Link>
            </div>
          </div>
          <div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="table-search d-flex align-items-center mb-0">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              {/* Filter code removed for brevity since it relies on unused select options, keeping placeholder */}
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
              searchText={searchText}
            />
          </div>
        </div>
      </div>
      <PayrollListModal selectedPayroll={selectedPayroll} refetch={refetch} staffs={staffs} />
    </>
  );
};

export default PayrollList;
