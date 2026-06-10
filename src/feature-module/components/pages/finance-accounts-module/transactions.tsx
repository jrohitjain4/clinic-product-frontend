import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useClinicInvoices } from "../../../../core/hooks/useClinicInvoices";
import { usePayroll } from "../../../../core/hooks/usePayroll";
import { useExpenses } from "../../../../core/hooks/useExpenses";
import Datatable from "../../../../core/common/dataTable";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const TransactionsList = () => {
  const { invoices, loading: invLoading, error: invError } = useClinicInvoices();
  const { payrolls, loading: payLoading, error: payError } = usePayroll();
  const { expenses, loading: expLoading, error: expError } = useExpenses();

  const loading = invLoading || payLoading || expLoading;
  const error = invError || payError || expError;

  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const transactions = useMemo(() => {
    const invTrans = invoices
      .filter((inv) => inv.paymentStatus === "Paid" || inv.paymentStatus === "Completed")
      .map((inv) => ({
        id: inv.id,
        code: inv.invoiceCode,
        patientName: inv.patient ? `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.trim() : "—",
        image: inv.patient?.profileImage,
        description: inv.items?.[0]?.description || "Invoice Payment",
        date: inv.invoiceDate,
        method: inv.paymentMethod || "—",
        amount: inv.totalAmount,
        status: inv.paymentStatus,
        type: "INVOICE",
        color: "success" // Green
      }));

    const payTrans = payrolls
      .filter((p) => p.status === "Paid" || p.status === "Salary_Paid")
      .map((p: any) => {
        const employee = p.staff || p.doctor;
        return {
          id: p.id,
          code: `PAY-${p.id.slice(0, 8).toUpperCase()}`,
          patientName: employee?.fullName || "Staff",
          image: employee?.profileImage,
          description: `Salary Payment (${dayjs(p.salaryDate).format("MMM YYYY")})`,
          date: p.createdAt,
          method: "Bank Transfer",
          amount: p.netSalary,
          status: p.status,
          type: "PAYROLL",
          color: "danger" // Red
        };
      });

    const expTrans = expenses
      .filter((e) => e.status === "Paid" || e.status === "Approved")
      .map((e) => ({
        id: e.id,
        code: `EXP-${e.id.slice(0, 8).toUpperCase()}`,
        patientName: e.vendor || "Vendor",
        image: null,
        description: e.description || e.category?.name || "Expense",
        date: e.expenseDate || e.createdAt,
        method: e.paymentMethod || "—",
        amount: e.amount,
        status: e.status,
        type: "EXPENSE",
        color: "danger" // Red
      }));

    return [...invTrans, ...payTrans, ...expTrans].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, payrolls, expenses]);

  const paymentMethods = useMemo(() => {
    const list = Array.from(
      new Set(
        transactions
          .map((t) => t.method)
          .filter((method) => method && method !== "" && method !== "—")
      )
    );
    return ["All", ...list];
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      const matchPaymentMethod =
        filterPaymentMethod === "All" ||
        t.method === filterPaymentMethod;
      const matchDate =
        !filterDate || dayjs(t.date).isSame(filterDate, "day");

      return matchPaymentMethod && matchDate;
    });
  }, [transactions, filterPaymentMethod, filterDate]);

  const data = filteredData.map((t, index) => {
    return {
      key: `${t.type}-${t.id}`,
      id: t.id,
      S_No: index + 1,
      TransactionID: t.code,
      Patient: t.patientName,
      Image: t.image || "avatar-01.jpg",
      Description: t.description,
      PaidDate: dayjs(t.date).format("DD MMM YYYY"),
      PaymentMethod: t.method || "—",
      Amount: `₹${t.amount.toLocaleString()}`,
      Status: t.status,
      color: t.color,
      raw: t,
    };
  });

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
      title: "Transaction ID",
      dataIndex: "TransactionID",
      render: (text: string) => (
        <Link to="#" className="text-dark fw-medium">
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) =>
        a.TransactionID.localeCompare(b.TransactionID),
    },
    {
      title: "Name / Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => {
        const hasImage = record.Image && record.Image.trim() !== "" && record.Image !== "avatar-01.jpg" && !record.Image.includes("300x300") && !record.Image.includes("ui-avatars.com");
        const patientImg = hasImage ? record.Image : "assets/img/patient-placeholder.png";

        return (
          <div className="d-flex align-items-center">
            <div className="avatar avatar-sm me-2">
              <img
                src={patientImg.startsWith('assets') || patientImg.startsWith('/uploads') || patientImg.startsWith('http') ? `/${patientImg.replace(/^\//, '')}` : `/${patientImg}`}
                alt={text}
                className="rounded-circle border"
                style={{ width: 36, height: 36, objectFit: "cover" }}
              />
            </div>
            <span className="text-dark fw-medium">{text}</span>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Description",
      dataIndex: "Description",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Description.localeCompare(b.Description),
    },
    {
      title: "Transaction Date",
      dataIndex: "PaidDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.date).getTime() -
        new Date(b.raw.date).getTime(),
    },
    {
      title: "Payment Method",
      dataIndex: "PaymentMethod",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        a.PaymentMethod.localeCompare(b.PaymentMethod),
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string, record: any) => (
        <span className={`fw-semibold text-${record.color}`}>{text}</span>
      ),
      sorter: (a: any, b: any) =>
        parseFloat(a.Amount.replace("₹", "").replace(/,/g, "")) -
        parseFloat(b.Amount.replace("₹", "").replace(/,/g, "")),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => (
        <span className={`badge border badge-soft-${record.color} border-${record.color} fw-medium`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
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
                Transactions
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Payment Method Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Method:</span>{" "}
                    {filterPaymentMethod}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {paymentMethods.map((method) => (
                    <li key={method}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterPaymentMethod(method);
                        }}
                      >
                        {method}
                      </Link>
                    </li>
                  ))}
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

              {/* Export Dropdown */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "100px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <i className="ti  me-1" /> Export
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => e.preventDefault()}
                    >
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => e.preventDefault()}
                    >
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger">
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading transactions</p>
            </div>
          ) : transactions.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-receipt-2 fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No transactions yet</h6>
              <p className="text-muted mb-0">
                Mark invoices as <strong>Paid</strong> to see them here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                searchText=""
              />
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
    </>
  );
};

export default TransactionsList;