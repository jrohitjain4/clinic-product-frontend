import { useMemo, useState } from "react";
import EmptyState from "../../../../core/common/emptyState";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Datatable from "../../../../core/common/dataTable";
import PayrollListModal from "./modal/payrollListModal";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import { useClinicDoctors } from "../../../../core/hooks/useClinicDoctors";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { ViewModal } from "../../../../core/common/modal/ViewModal";

const PayrollList = () => {
  const { payrolls, refetch, loading, error } = usePayroll();
  const { staffs } = useClinicStaff();
  const { doctors } = useClinicDoctors();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewPayroll, setViewPayroll] = useState<any>(null);

  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const clearFilters = () => {
    setFilterRole("All");
    setFilterStatus("All");
    setFilterDatePreset("All");
    setCustomRange([null, null]);
  };

  const filteredData = useMemo(() => {
    return payrolls.filter((pr: any) => {
      const employee = pr.staff || pr.doctor;
      const matchRole = filterRole === "All" || (employee?.role || (pr.doctor ? "Doctor" : "")) === filterRole;
      const matchStatus =
        filterStatus === "All" ||
        (pr.displayStatus || pr.status) === filterStatus;

      let matchDate = true;
      if (filterDatePreset !== "All") {
        const prDate = dayjs(pr.salaryDate);
        const today = dayjs();
        if (filterDatePreset === "Today") {
          matchDate = prDate.isSame(today, "day");
        } else if (filterDatePreset === "This Week") {
          matchDate = prDate.isSame(today, "week");
        } else if (filterDatePreset === "This Month") {
          matchDate = prDate.isSame(today, "month");
        } else if (filterDatePreset === "This Year") {
          matchDate = prDate.isSame(today, "year");
        } else if (filterDatePreset === "Custom") {
          if (customRange[0] && customRange[1]) {
            matchDate = prDate.isBetween(customRange[0].startOf("day"), customRange[1].endOf("day"), "day", "[]");
          }
        }
      }

      return matchRole && matchStatus && matchDate;
    });
  }, [payrolls, filterRole, filterStatus, filterDatePreset, customRange]);

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
      className: "text-nowrap",
      width: 120,
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
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
              {/* Clear Filter Button - Only show when any filter is active */}
              {(filterRole !== "All" || filterStatus !== "All" || filterDatePreset !== "All") && (
                <button
                  type="button"
                  className="btn btn-white d-flex align-items-center gap-1 text-danger border"
                  onClick={clearFilters}
                  style={{
                    minHeight: "38px",
                    fontWeight: "700",
                    fontSize: "13px",
                    borderRadius: "6px"
                  }}
                >
                  <i className="ti ti-rotate"></i> Clear All
                </button>
              )}
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

              {/* Advanced Date Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {filterDatePreset === "All" ? "Select Date" : filterDatePreset}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                  {["All", "Today", "This Week", "This Month", "This Year", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDatePreset(preset);
                        }}
                      >
                        {preset}
                      </Link>
                    </li>
                  ))}
                  {filterDatePreset === "Custom" && (
                    <li className="p-2 border-top mt-2">
                      <DatePicker.RangePicker
                        format="DD-MM-YYYY"
                        className="w-100"
                        value={customRange}
                        onChange={(dates) => setCustomRange(dates ? [dates[0], dates[1]] : [null, null])}
                      />
                    </li>
                  )}
                </ul>
              </div>

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
            <div className="border rounded bg-white">
              <EmptyState
                title="No payroll yet"
                message="Configure salary records for your employees to start managing payroll efficiently."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_payroll"
                    onClick={() => setSelectedPayroll(null)}
                  >
                    Add Employee Salary <i className="ti ti-plus ms-2" />
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
      <ViewModal
        id="view_payroll"
        title="Payroll Details"
        subtitle="View salary information"
        headerIcon={<i className="ti ti-cash" />}
        highlightTitle={viewPayroll?.staff?.fullName || viewPayroll?.doctor?.fullName || "Employee"}
        highlightRightText={`₹${viewPayroll?.netSalary || 0}`}
        highlightRightSubText="Net Salary"
        highlightColor="#dcfce7"
        details={[
            { icon: <i className="ti ti-currency-rupee" />, label: "Basic Salary", value: `₹${viewPayroll?.basicSalary || 0}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "DA (40%)", value: `₹${viewPayroll?.da || 0}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "HRA (15%)", value: `₹${viewPayroll?.hra || 0}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "Conveyance", value: `₹${viewPayroll?.conveyance || 0}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "Medical Allowance", value: `₹${viewPayroll?.medicalAllowance || 0}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "Other Earnings", value: `₹${viewPayroll?.otherEarnings || 0}` },
            { icon: <i className="ti ti-minus" />, label: "TDS", value: `₹${viewPayroll?.tds || 0}` },
            { icon: <i className="ti ti-minus" />, label: "ESI", value: `₹${viewPayroll?.esi || 0}` },
            { icon: <i className="ti ti-minus" />, label: "PF", value: `₹${viewPayroll?.pf || 0}` },
            { icon: <i className="ti ti-minus" />, label: "Prof Tax", value: `₹${viewPayroll?.profTax || 0}` },
            { icon: <i className="ti ti-minus" />, label: "Labour Welfare", value: `₹${viewPayroll?.labourWelfare || 0}` },
            { icon: <i className="ti ti-minus" />, label: "Other Deductions", value: `₹${viewPayroll?.otherDeductions || 0}` }
        ]}
        onEdit={() => {
            setSelectedPayroll(viewPayroll);
        }}
        editLabel="Edit Payroll"
        editModalTarget="#edit_payroll"
      />
    </>
  );
};

export default PayrollList;