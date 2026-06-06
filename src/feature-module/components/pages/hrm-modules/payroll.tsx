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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        <div className="text-end d-flex align-items-center justify-content-end gap-2">
          <button
            className="bg-transparent border-0 text-primary p-1"
            data-bs-toggle="modal"
            data-bs-target="#edit_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="fa fa-edit fs-16" />
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            data-bs-toggle="modal"
            data-bs-target="#delete_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="fa fa-trash-alt fs-16" />
          </button>
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
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Payroll
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {payrolls.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Date:</span> Select</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Role:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Doctor</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Staff</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Status:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Due</Link></li>
                </ul>
              </div>

              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                data-bs-toggle="modal"
                data-bs-target="#add_payroll"
              >
                Add Employee Salary <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText={searchText}
              onSelectionChange={(keys) => setSelectedIds(keys as string[])}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_payroll"
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>
      <PayrollListModal selectedPayroll={selectedPayroll} refetch={refetch} staffs={staffs} />
    </>
  );
};

export default PayrollList;
