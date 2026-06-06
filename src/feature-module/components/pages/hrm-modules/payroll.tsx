import { useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";

import Datatable from "../../../../core/common/dataTable";
import PayrollListModal from "./modal/payrollListModal";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";

const PayrollList = () => {
  const { payrolls, refetch } = usePayroll();
  const { staffs } = useClinicStaff();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

  const data = payrolls.map((pr: any, index: number) => ({
    key: pr.id,
    id: pr.id,
    S_No: index + 1,
    Employee: pr.staff?.fullName || "Unknown",
    Image: pr.staff?.profileImage && !pr.staff.profileImage.startsWith("http") ? pr.staff.profileImage : null,
    Email: pr.staff?.email || "--",
    JoiningDate: pr.staff?.dateOfJoining ? new Date(pr.staff.dateOfJoining).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--",
    Role: pr.staff?.role || "--",
    Salary: "$" + pr.netSalary,
    Status: pr.displayStatus || pr.status,
    raw: pr,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      sorter: (a: any, b: any) => a.S_No - b.S_No,
    },
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
      render: (text: string) => {
        let badgeClass = "badge-soft-secondary border border-secondary";
        if (text === "Salary_Paid" || text === "Paid") badgeClass = "badge-soft-success border border-success";
        else if (text === "Salary_Created" || text === "Created") badgeClass = "badge-soft-warning border border-warning";
        else if (text === "Due") badgeClass = "badge-soft-danger border border-danger";
        else if (text === "Salary_Hold" || text === "Hold") badgeClass = "badge-soft-dark border border-dark";

        return (
          <span className={`badge fw-medium fs-13 ${badgeClass}`}>
            {text}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "Action",
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="avatar avatar-sm border text-primary rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#edit_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            to="#"
            className="avatar avatar-sm border text-danger rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#delete_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="ti ti-trash fs-16" />
          </Link>
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
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-3 border-bottom">
            <h4 className="fw-bold mb-0 d-flex align-items-center">
              Payroll
              <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                Total: {payrolls.length}
              </span>
            </h4>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Date : </span> Select
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Role : </span> All
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Doctor</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Staff</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Status : </span> All
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Due</Link></li>
                </ul>
              </div>

              <Link
                to="#"
                className="btn btn-primary btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_payroll"
              >
                Add Employee Salary <i className="ti ti-plus ms-1" />
              </Link>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
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
