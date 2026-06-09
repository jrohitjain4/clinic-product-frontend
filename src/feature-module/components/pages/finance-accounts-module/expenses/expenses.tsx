import { useState, useMemo } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import ExpensesModal from "../modal/expensesModal";
import { useExpenses } from "../../../../../core/hooks/useExpenses";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const ExpensesList = () => {
  const { expenses, refetch, loading, error } = useExpenses();
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [viewExpense, setViewExpense] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const categories = useMemo(() => {
    const list = Array.from(
      new Set(expenses.map((exp: any) => exp.category).filter(Boolean))
    );
    return ["All", ...list];
  }, [expenses]);

  const statuses = useMemo(() => {
    const list = Array.from(
      new Set(expenses.map((exp: any) => exp.status).filter(Boolean))
    );
    return ["All", ...list];
  }, [expenses]);

  const filteredData = useMemo(() => {
    return expenses.filter((exp: any) => {
      const matchCategory =
        filterCategory === "All" || exp.category === filterCategory;
      const matchStatus = filterStatus === "All" || exp.status === filterStatus;
      const matchDate =
        !filterDate || dayjs(exp.date).isSame(filterDate, "day");

      return matchCategory && matchStatus && matchDate;
    });
  }, [expenses, filterCategory, filterStatus, filterDate]);

  const data = filteredData.map((exp: any, index: number) => ({
    key: exp.id,
    id: exp.id,
    S_No: index + 1,
    Expense: exp.name,
    Category: exp.category,
    Amount: "$" + exp.amount,
    Date: new Date(exp.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    PurchasedBy: exp.purchasedBy,
    PaymentMethod: exp.paymentMethod,
    Status: exp.status,
    raw: exp,
  }));

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
      title: "Expense",
      dataIndex: "Expense",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.Expense.localeCompare(b.Expense),
    },
    {
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Category.localeCompare(b.Category),
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string) => (
        <span className="fw-semibold text-dark">{text}</span>
      ),
      sorter: (a: any, b: any) =>
        parseFloat(a.Amount.replace("$", "")) -
        parseFloat(b.Amount.replace("$", "")),
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.date).getTime() - new Date(b.raw.date).getTime(),
    },
    {
      title: "Purchased By",
      dataIndex: "PurchasedBy",
      render: (text: string, _record: any) => (
        <div className="d-flex align-items-center">
          <span
            className="avatar avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold me-2"
            style={{ fontSize: 13, minWidth: 32, height: 32 }}
          >
            {text?.charAt(0)?.toUpperCase() || "?"}
          </span>
          <span className="text-dark fw-medium">{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.PurchasedBy.localeCompare(b.PurchasedBy),
    },
    {
      title: "Payment Method",
      dataIndex: "PaymentMethod",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        a.PaymentMethod.localeCompare(b.PaymentMethod),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = "badge-soft-danger border-danger";
        if (text === "Approved")
          badgeClass = "badge-soft-success border-success";
        else if (text === "Pending")
          badgeClass = "badge-soft-warning border-warning";
        else if (text === "New") badgeClass = "badge-soft-primary border-primary";

        return (
          <span className={`badge border ${badgeClass} fw-medium`}>
            {text}
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
            onClick={() => setViewExpense(record.raw)}
            data-bs-toggle="modal"
            data-bs-target="#view_expense"
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_new_expense"
            onClick={() => setSelectedExpense(record.raw)}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_expense"
            onClick={() => setSelectedExpense(record.raw)}
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
                Expenses
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Category Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "140px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Category:</span>{" "}
                    {filterCategory}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterCategory(cat);
                        }}
                      >
                        {cat}
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
                  {statuses.map((status) => (
                    <li key={status}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterStatus(status);
                        }}
                      >
                        {status}
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

              {/* New Expense Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_new_expense"
                onClick={() => setSelectedExpense(null)}
              >
                New Expense <i className="fa fa-plus ms-2" />
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
              <p className="text-muted mt-2 mb-0">Loading expenses</p>
            </div>
          ) : expenses.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-receipt fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No expenses yet</h6>
              <p className="text-muted mb-3">Add your first expense.</p>
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_new_expense"
                onClick={() => setSelectedExpense(null)}
              >
                New Expense <i className="ti ti-plus ms-2" />
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
                data-bs-target="#delete_expense"
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

      <ExpensesModal selectedExpense={selectedExpense} refetch={refetch} />

      {/* ===== VIEW EXPENSE MODAL ===== */}
      <div id="view_expense" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">Expense Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewExpense(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewExpense && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Expense Name
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.name || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Category
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.category || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Amount
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold text-success"
                      value={`$${viewExpense.amount}`}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Date
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={new Date(viewExpense.date).toLocaleDateString(
                        "en-GB"
                      )}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Purchased By
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.purchasedBy || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Payment Method
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.paymentMethod || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.status || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Receipt
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewExpense.receipt || "N/A"}
                      readOnly
                    />
                  </div>

                  {viewExpense.description && (
                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-uppercase text-muted">
                        Description
                      </label>
                      <textarea
                        className="form-control bg-light"
                        rows={3}
                        value={viewExpense.description}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewExpense(null)}
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

export default ExpensesList;