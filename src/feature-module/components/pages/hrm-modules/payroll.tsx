import { useMemo, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Datatable from "../../../../core/common/dataTable";
import PayrollListModal from "./modal/payrollListModal";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import { DatePicker, Modal } from "antd";
import dayjs from "dayjs";

const PayrollList = () => {
  const { payrolls, refetch } = usePayroll();
  const { staffs } = useClinicStaff();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewPayroll, setViewPayroll] = useState<any>(null);

  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const filteredData = useMemo(() => {
    return payrolls.filter((pr: any) => {
      const matchRole = filterRole === "All" || pr.staff?.role === filterRole;
      const matchStatus = filterStatus === "All" || (pr.displayStatus || pr.status) === filterStatus;
      const matchDate = !filterDate || dayjs(pr.createdAt).isSame(filterDate, 'day');
      return matchRole && matchStatus && matchDate;
    });
  }, [payrolls, filterRole, filterStatus, filterDate]);

  const data = filteredData.map((pr: any, index: number) => ({
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

  const roles = useMemo(() => {
    const list = Array.from(new Set(payrolls.map((pr: any) => pr.staff?.role).filter(Boolean)));
    return ["All", ...list];
  }, [payrolls]);

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
          <div className="avatar avatar-sm me-2">
            {record.Image ? (
              <ImageWithBasePath
                src={`assets/img/users/${record.Image}`}
                alt="Employee"
                className="rounded-circle"
              />
            ) : (
              <span
                className="avatar avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold fs-12"
              >
                {text?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <h6 className="mb-0 fs-14 fw-semibold text-dark">
              {text}
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Employee.localeCompare(b.Employee),
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: any, b: any) => a.Email.localeCompare(b.Email),
    },
    {
      title: "Joining Date",
      dataIndex: "JoiningDate",
      sorter: (a: any, b: any) => new Date(a.raw.staff.dateOfJoining).getTime() - new Date(b.raw.staff.dateOfJoining).getTime(),
    },
    {
      title: "Role",
      dataIndex: "Role",
      sorter: (a: any, b: any) => a.Role.localeCompare(b.Role),
    },
    {
      title: "Salary",
      dataIndex: "Salary",
      sorter: (a: any, b: any) => parseFloat(a.Salary.replace('$', '')) - parseFloat(b.Salary.replace('$', '')),
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
            {text.replace('_', ' ')}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-start gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_payroll"
            onClick={() => setViewPayroll(record.raw)}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>

          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_payroll"
            onClick={() => setSelectedPayroll(record.raw)}
          >
            <i className="fa fa-edit fs-16" />
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Payroll
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {filteredData.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Role:</span> {filterRole}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {roles.map(r => (
                    <li key={r}><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterRole(r)}>{r}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("All")}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Paid")}>Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={() => setFilterStatus("Due")}>Due</Link></li>
                </ul>
              </div>

              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap"
                style={{ width: '130px', minHeight: '38px', paddingTop: '7px' }}
                format="DD-MM-YYYY"
                allowClear={true}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

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


          <div className="table-responsive border rounded bg-white shadow-sm">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText=""
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

      {/* ===== VIEW PAYROLL MODAL ===== */}
      <div id="view_payroll" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">View Payroll Details</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={() => setViewPayroll(null)}></button>
            </div>
            <div className="modal-body">
              {viewPayroll && (
                <div className="row g-3">
                  <div className="col-md-12 text-center mb-3">
                    <div className="avatar avatar-xxl bg-light p-1 rounded-circle shadow-sm mx-auto">
                      <ImageWithBasePath
                        src={viewPayroll.staff?.profileImage?.startsWith('/') ? viewPayroll.staff.profileImage : `assets/img/users/${viewPayroll.staff?.profileImage || 'avatar-21.jpg'}`}
                        alt={viewPayroll.staff?.fullName}
                        className="rounded-circle"
                      />
                    </div>
                    <h5 className="mt-2 fw-bold">{viewPayroll.staff?.fullName}</h5>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Basic Salary</label>
                    <input type="text" className="form-control bg-light" value={`$${viewPayroll.basicSalary}`} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Net Salary</label>
                    <input type="text" className="form-control bg-light fw-bold text-success" value={`$${viewPayroll.netSalary}`} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Allowances</label>
                    <input type="text" className="form-control bg-light" value={`$${viewPayroll.allowance || 0}`} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Medical</label>
                    <input type="text" className="form-control bg-light" value={`$${viewPayroll.medical || 0}`} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Deductions</label>
                    <input type="text" className="form-control bg-light text-danger" value={`$${viewPayroll.deduction || 0}`} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Payment Method</label>
                    <input type="text" className="form-control bg-light" value={viewPayroll.paymentMethod || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Status</label>
                    <input type="text" className="form-control bg-light" value={viewPayroll.status?.replace('_', ' ') || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Created Date</label>
                    <input type="text" className="form-control bg-light" value={new Date(viewPayroll.createdAt).toLocaleDateString("en-GB")} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Paid Date</label>
                    <input type="text" className="form-control bg-light" value={viewPayroll.paidDate ? new Date(viewPayroll.paidDate).toLocaleDateString("en-GB") : "Pending"} readOnly />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button type="button" className="btn btn-primary px-5" data-bs-dismiss="modal" onClick={() => setViewPayroll(null)} style={{ borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollList;
