import { useMemo, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Datatable from "../../../../core/common/dataTable";
import PayrollListModal from "./modal/payrollListModal";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import { useClinicDoctors } from "../../../../core/hooks/useClinicDoctors";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const PayrollList = () => {
  const { payrolls, refetch, loading, error } = usePayroll();
  const { staffs } = useClinicStaff();
  const { doctors } = useClinicDoctors();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewPayroll, setViewPayroll] = useState<any>(null);

  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const filteredData = useMemo(() => {
    return payrolls.filter((pr: any) => {
      const employee = pr.staff || pr.doctor;
      const matchRole = filterRole === "All" || (employee?.role || (pr.doctor ? "Doctor" : "")) === filterRole;
      const matchStatus =
        filterStatus === "All" ||
        (pr.displayStatus || pr.status) === filterStatus;
      const matchDate =
        !filterDate || dayjs(pr.salaryDate).isSame(filterDate, "day");
      return matchRole && matchStatus && matchDate;
    });
  }, [payrolls, filterRole, filterStatus, filterDate]);

  const data = filteredData.map((pr: any, index: number) => {
    const employee = pr.staff || pr.doctor;
    return {
      key: pr.id,
      id: pr.id,
      S_No: index + 1,
      Employee: employee?.fullName || "Unknown",
      Image:
        employee?.profileImage && !employee.profileImage.startsWith("http")
          ? employee.profileImage
          : null,
      Email: employee?.email || "--",
      SalaryDate: pr.salaryDate
        ? new Date(pr.salaryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "--",
      Role: employee?.role || (pr.doctor ? "Doctor" : "--"),
      Salary: "₹" + pr.netSalary,
      Status: pr.displayStatus || pr.status,
      raw: pr,
    };
  });

  const roles = useMemo(() => {
    const list = Array.from(
      new Set(payrolls.map((pr: any) => (pr.staff?.role || (pr.doctor ? "Doctor" : null))).filter(Boolean))
    );
    return ["All", ...list];
  }, [payrolls]);


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
      title: "Employee",
      dataIndex: "Employee",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-sm me-2">
            {record.Image ? (
              <ImageWithBasePath
                src={`assets/img/users/${record.Image}`}
                alt="Employee"
                className="rounded-circle"
              />
            ) : (
              <span className="avatar avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold fs-12">
                {text?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <h6 className="mb-0 fs-14 fw-semibold text-dark">{text}</h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Employee.localeCompare(b.Employee),
    },
    {
      title: "Email",
      dataIndex: "Email",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Email.localeCompare(b.Email),
    },
    {
      title: "Salary Date",
      dataIndex: "SalaryDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.salaryDate).getTime() -
        new Date(b.raw.salaryDate).getTime(),
    },
    {
      title: "Role",
      dataIndex: "Role",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Role.localeCompare(b.Role),
    },
    {
      title: "Salary",
      dataIndex: "Salary",
      render: (text: string) => (
        <span className="text-dark fw-semibold">{text}</span>
      ),
      sorter: (a: any, b: any) =>
        parseFloat(a.Salary.replace("₹", "")) -
        parseFloat(b.Salary.replace("₹", "")),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = "badge-soft-secondary border border-secondary";
        if (text === "Salary_Paid" || text === "Paid")
          badgeClass = "badge-soft-success border border-success";
        else if (text === "Salary_Created" || text === "Created" || text === "Pending")
          badgeClass = "badge-soft-warning border border-warning";
        else if (text === "Due")
          badgeClass = "badge-soft-danger border border-danger";
        else if (text === "Salary_Hold" || text === "Hold")
          badgeClass = "badge-soft-dark border border-dark";

        return (
          <span className={`badge fw-medium fs-13 ${badgeClass}`}>
            {text.replace("_", " ")}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_payroll"
            onClick={() => setViewPayroll(record.raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
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
                Payroll
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Role Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Role:</span> {filterRole}
                  </span>
                </Link>
                <ul
                  className="dropdown-menu dropdown-menu-end p-2"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {roles.map((r) => (
                    <li key={r}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterRole(r);
                        }}
                      >
                        {r}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

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
                        setFilterStatus("Paid");
                      }}
                    >
                      Paid
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Due");
                      }}
                    >
                      Due
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Pending");
                      }}
                    >
                      Pending
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Date Filter */}
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap"
                style={{ width: "130px", minHeight: "38px", paddingTop: "7px" }}
                format="DD-MM-YYYY"
                allowClear={true}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

              {/* Add Salary Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_payroll"
                onClick={() => setSelectedPayroll(null)}
              >
                Add Employee Salary <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading payroll</p>
            </div>
          ) : payrolls.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-wallet fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No payroll yet</h6>
              <p className="text-muted mb-3">Add employee salary records.</p>
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_payroll"
                onClick={() => setSelectedPayroll(null)}
              >
                Add Employee Salary <i className="ti ti-plus ms-2" />
              </button>
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
                data-bs-toggle="modal"
                data-bs-target="#delete_payroll"
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

      <PayrollListModal
        selectedPayroll={selectedPayroll}
        refetch={refetch}
        staffs={staffs}
        doctors={doctors}
      />

      {/* ===== VIEW PAYROLL MODAL ===== */}
      <div id="view_payroll" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Payroll Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewPayroll(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewPayroll && (
                <>
                  <div className="row row-gap-2 mb-3">
                    <div className="col-md-6">
                      <div className="mb-0">
                        <label className="form-label">Employee Name</label>
                        <input type="text" className="form-control bg-light" disabled value={viewPayroll.staff?.fullName || viewPayroll.doctor?.fullName || ""} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-0">
                        <label className="form-label">Net Salary</label>
                        <input type="text" className="form-control bg-light text-success fw-bold" disabled value={`₹${viewPayroll.netSalary || 0}`} />
                      </div>
                    </div>
                  </div>
                  {/* Earnings & Deductions Details */}
                  <div className="row row-gap-2">
                    <div className="col-md-6">
                      <h6 className="mb-3">Earnings (₹)</h6>
                      <div className="mb-3">
                        <label className="form-label">Basic Salary</label>
                        <input type="number" className="form-control bg-light" disabled value={viewPayroll.basicSalary || 0} />
                      </div>
                      <div className="mb-3"><label className="form-label">DA (40%)</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.da || 0} /></div>
                      <div className="mb-3"><label className="form-label">HRA (15%)</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.hra || 0} /></div>
                      <div className="mb-3"><label className="form-label">Conveyance</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.conveyance || 0} /></div>
                      <div className="mb-3"><label className="form-label">Medical Allowance</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.medicalAllowance || 0} /></div>
                      <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.otherEarnings || 0} /></div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="mb-3">Deductions (₹)</h6>
                      <div className="mb-3"><label className="form-label">TDS</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.tds || 0} /></div>
                      <div className="mb-3"><label className="form-label">ESI</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.esi || 0} /></div>
                      <div className="mb-3"><label className="form-label">PF</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.pf || 0} /></div>
                      <div className="mb-3"><label className="form-label">Prof Tax</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.profTax || 0} /></div>
                      <div className="mb-3"><label className="form-label">Labour Welfare</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.labourWelfare || 0} /></div>
                      <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control bg-light" disabled value={viewPayroll.otherDeductions || 0} /></div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewPayroll(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollList;