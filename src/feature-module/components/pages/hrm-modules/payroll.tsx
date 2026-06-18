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
import { resolveMediaUrl } from "../../../../core/config/api";

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

  const stats = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let due = 0;
    filteredData.forEach((pr: any) => {
      const status = pr.displayStatus || pr.status;
      const salary = pr.netSalary || 0;
      if (status === "Salary_Paid" || status === "Paid") {
        paid += salary;
      } else if (status === "Due") {
        due += salary;
      } else {
        unpaid += salary;
      }
    });
    return { paid, unpaid, due };
  }, [filteredData]);

  const roles = useMemo(() => {
    const list = Array.from(
      new Set(payrolls.map((pr: any) => (pr.staff?.role || (pr.doctor ? "Doctor" : null))).filter(Boolean))
    );
    return ["All", ...list];
  }, [payrolls]);


  const handleDownload = (payroll: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !payroll) return;

    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    const clinicName = user?.clinic?.name || "DocYari Health Hub";
    const clinicAddress = user?.clinic?.landingPage?.address || "Clinic Address";
    const clinicLogo = user?.clinic?.landingPage?.logo ? resolveMediaUrl(user.clinic.landingPage.logo) : '/logo.png';

    const employee = payroll.staff || payroll.doctor;
    const employeeName = employee?.fullName || "Employee";
    const employeeEmail = employee?.email || "--";
    const employeeRole = employee?.role || (payroll.doctorId ? "Doctor" : "--");

    const basic = payroll.basicSalary || 0;
    const da = payroll.da || 0;
    const hra = payroll.hra || 0;
    const conveyance = payroll.conveyance || 0;
    const medical = payroll.medicalAllowance || 0;
    const otherEarnings = payroll.otherEarnings || 0;
    const totalEarnings = basic + da + hra + conveyance + medical + otherEarnings;

    const tds = payroll.tds || 0;
    const esi = payroll.esi || 0;
    const pf = payroll.pf || 0;
    const profTax = payroll.profTax || 0;
    const labourWelfare = payroll.labourWelfare || 0;
    const otherDeductions = payroll.otherDeductions || 0;
    const totalDeductions = tds + esi + pf + profTax + labourWelfare + otherDeductions;

    const netSalary = payroll.netSalary || 0;
    const salaryDateStr = payroll.salaryDate
      ? new Date(payroll.salaryDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      : "N/A";

    const payStatus = payroll.status || "Pending";

    const html = `<html>
        <head>
          <title>Payslip - ${employeeName} - ${salaryDateStr}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
            .header-banner {
              background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
              color: #ffffff !important;
              padding: 24px !important;
              border-radius: 8px !important;
              margin-bottom: 25px !important;
              display: flex;
              justify-content: space-between;
              align-items: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
            .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
            .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
            .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 700; }
            .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
            
            /* Dark Styled Tables */
            .earnings-deductions th { background: #0f172a !important; color: #ffffff !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px !important; border: 2px solid #0f172a !important; }
            .earnings-deductions td { font-size: 12px; padding: 10px 8px; border-bottom: 1px solid #cbd5e1; color: #0f172a !important; font-weight: 600; }
            
            .summary-box { padding: 20px; border: 2px solid #0f172a; background: #f8fafc; border-radius: 8px; }
            @media print { 
              body { padding: 0; } 
              .no-print { display: none; }
              .header-banner {
                background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="d-flex align-items-center gap-3">
              <div class="logo-box">
                <img src="${clinicLogo}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
              </div>
              <div>
                <h4>${clinicName}</h4>
                <p><i class="ti ti-map-pin"></i> ${clinicAddress}</p>
                <h6 class="text-white opacity-90 mt-2" style="font-size: 14px; font-weight: bold;">SALARY SLIP</h6>
              </div>
            </div>
            <div class="text-end text-white">
              <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2 text-uppercase" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${payStatus.replace("_", " ")}
              </span>
              <div class="small mt-1 opacity-90">
                <div class="mb-1"><strong>Pay Period:</strong> ${salaryDateStr}</div>
              </div>
            </div>
          </div>

          <div class="bg-light p-3 rounded mb-4 border row g-3 mx-0">
            <div class="col-6 col-md-3">
               <div class="info-label">Employee Name</div>
               <div class="info-value">${employeeName}</div>
            </div>
            <div class="col-6 col-md-3">
               <div class="info-label">Designation / Role</div>
               <div class="info-value">${employeeRole}</div>
            </div>
            <div class="col-6 col-md-3">
               <div class="info-label">Email</div>
               <div class="info-value">${employeeEmail}</div>
            </div>
            <div class="col-6 col-md-3 text-end">
               <div class="info-label">Slip Generated On</div>
               <div class="info-value">${new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-6">
              <h6 class="section-title">Earnings</h6>
              <table class="table earnings-deductions mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td class="text-end">₹${basic}</td>
                  </tr>
                  <tr>
                    <td>Dearness Allowance (DA 40%)</td>
                    <td class="text-end">₹${da}</td>
                  </tr>
                  <tr>
                    <td>House Rent Allowance (HRA 15%)</td>
                    <td class="text-end">₹${hra}</td>
                  </tr>
                  <tr>
                    <td>Conveyance</td>
                    <td class="text-end">₹${conveyance}</td>
                  </tr>
                  <tr>
                    <td>Medical Allowance</td>
                    <td class="text-end">₹${medical}</td>
                  </tr>
                  <tr>
                    <td>Other Earnings</td>
                    <td class="text-end">₹${otherEarnings}</td>
                  </tr>
                  <tr class="fw-bold border-top border-dark">
                    <td>Total Earnings</td>
                    <td class="text-end text-success">₹${totalEarnings}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="col-6">
              <h6 class="section-title">Deductions</h6>
              <table class="table earnings-deductions mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tax Deducted at Source (TDS)</td>
                    <td class="text-end">₹${tds}</td>
                  </tr>
                  <tr>
                    <td>Employee State Insurance (ESI)</td>
                    <td class="text-end">₹${esi}</td>
                  </tr>
                  <tr>
                    <td>Provident Fund (PF)</td>
                    <td class="text-end">₹${pf}</td>
                  </tr>
                  <tr>
                    <td>Professional Tax</td>
                    <td class="text-end">₹${profTax}</td>
                  </tr>
                  <tr>
                    <td>Labour Welfare Fund</td>
                    <td class="text-end">₹${labourWelfare}</td>
                  </tr>
                  <tr>
                    <td>Other Deductions</td>
                    <td class="text-end">₹${otherDeductions}</td>
                  </tr>
                  <tr class="fw-bold border-top border-dark">
                    <td>Total Deductions</td>
                    <td class="text-end text-danger">₹${totalDeductions}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="row align-items-center mb-5">
            <div class="col-7">
              <div class="summary-box">
                <div class="row">
                  <div class="col-6">
                    <span class="info-label d-block">Gross Earnings</span>
                    <span class="fw-bold text-dark fs-14">₹${totalEarnings}</span>
                  </div>
                  <div class="col-6 border-start">
                    <span class="info-label d-block">Total Deductions</span>
                    <span class="fw-bold text-dark fs-14">₹${totalDeductions}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-5">
              <div class="summary-box border-primary bg-primary-subtle text-primary" style="border-left: 4px solid #4f46e5;">
                <span class="info-label text-primary d-block">Net Salary Pay</span>
                <h3 class="fw-extrabold mb-0" style="color: #4f46e5; font-weight: 800;">₹${netSalary}</h3>
              </div>
            </div>
          </div>

          <div class="mt-auto pt-5 text-center border-top">
             <div class="d-flex justify-content-between align-items-end mb-3">
                <div class="text-start">
                   <h6 class="fw-bold mb-1">CLINICAL STAFF PAYSLIP</h6>
                   <span class="badge bg-primary px-3 py-1 fw-bold fs-10 text-uppercase">${payStatus.replace("_", " ")}</span>
                </div>
                <div class="text-end">
                   <p class="info-label mt-1 mb-1">Authorized Representative</p>
                   <p class="fw-bold small mb-0">${clinicName}</p>
                </div>
             </div>
             <p class="mb-1 fw-bold fs-11 text-muted">2025 &copy; Docyari Clinical Solutions</p>
             <p class="mb-0 italic opacity-50" style="font-size: 9px;">This document is digitally generated and valid without a physical rubber stamp.</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
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

          {/* Download Icon */}
          <button
            className="bg-transparent border-0 text-success p-1"
            title="Download Payslip"
            onClick={() => handleDownload(record.raw)}
          >
            <i className="ti ti-download fs-18"></i>
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

            {/* Compact Stats in Header */}
            {!loading && (
              <div className="d-none d-xl-flex align-items-center justify-content-center gap-4 mx-3">
                <div className="d-flex align-items-center">
                  <span className="badge badge-soft-success border border-success rounded-pill p-1 me-2">
                    <i className="ti ti-arrow-up-right fs-14"></i>
                  </span>
                  <div>
                    <p className="mb-0 fs-11 text-muted lh-1">Paid</p>
                    <h6 className="fw-bold mb-0 text-dark fs-14">₹{stats.paid.toLocaleString()}</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge badge-soft-warning border border-warning rounded-pill p-1 me-2">
                    <i className="ti ti-arrow-down-left fs-14"></i>
                  </span>
                  <div>
                    <p className="mb-0 fs-11 text-muted lh-1">Unpaid</p>
                    <h6 className="fw-bold mb-0 text-dark fs-14">₹{stats.unpaid.toLocaleString()}</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge badge-soft-danger border border-danger rounded-pill p-1 me-2">
                    <i className="ti ti-alert-circle fs-14"></i>
                  </span>
                  <div>
                    <p className="mb-0 fs-11 text-muted lh-1">Due</p>
                    <h6 className="fw-bold mb-0 text-danger fs-14">₹{stats.due.toLocaleString()}</h6>
                  </div>
                </div>
              </div>
            )}

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
                onClick={() => setSelectedPayroll(null)}
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
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        payrolls={payrolls}
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