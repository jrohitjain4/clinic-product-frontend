import { useState } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import ExpensesModal from "../modal/expensesModal";
import { useExpenses } from "../../../../../core/hooks/useExpenses";

const ExpensesList = () => {
  const { expenses, refetch } = useExpenses();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const data = expenses.map((exp: any) => ({
    key: exp.id,
    id: exp.id,
    Expense: exp.name,
    Category: exp.category,
    Amount: "$" + exp.amount,
    Date: new Date(exp.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    PurchasedBy: exp.purchasedBy,
    PaymentMethod: exp.paymentMethod,
    Status: exp.status,
    raw: exp,
  }));

  const columns = [
    {
      title: "Expense",
      dataIndex: "Expense",
      render: (text: string) => <Link to="">{text}</Link>,
      sorter: (a: any, b: any) => a.Expense.length - b.Expense.length,
    },
    {
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => <div className="text-dark">{text}</div>,
      sorter: (a: any, b: any) => a.Category.length - b.Category.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string) => <div className="fw-semibold text-dark">{text}</div>,
      sorter: (a: any, b: any) => a.Amount.length - b.Amount.length,
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <div className="text-dark">{text}</div>,
      sorter: (a: any, b: any) => a.Date.length - b.Date.length,
    },
    {
      title: "Purchased By",
      dataIndex: "PurchasedBy",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <span
            className="avatar avatar-md rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold me-2"
            style={{ fontSize: 13, minWidth: 36, height: 36 }}
          >
            {text?.charAt(0)?.toUpperCase() || "?"}
          </span>
          <Link to="#" className="text-dark fw-semibold">
            {text}
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.PurchasedBy.length - b.PurchasedBy.length,
    },
    {
      title: "Payment Method",
      dataIndex: "PaymentMethod",
      render: (text: string) => <div className="text-dark">{text}</div>,
      sorter: (a: any, b: any) => a.PaymentMethod.length - b.PaymentMethod.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Approved"
              ? "badge-soft-success border-success text-success"
              : text === "Pending"
                ? "badge-soft-warning border-warning text-warning"
                : text === "New"
                  ? "badge-soft-primary border-primary text-primary"
                  : "badge-soft-danger border-danger text-danger"
            } rounded fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: (_: string, record: any) => (
        <div className="action-item p-2">
          <Link to="#" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_new_expense"
                onClick={() => setSelectedExpense(record.raw)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_expense"
                onClick={() => setSelectedExpense(record.raw)}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Expenses{" "}
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Expenses : {expenses.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <Link
                to="#"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_new_expense"
                onClick={() => setSelectedExpense(null)}
              >
                <i className="ti ti-plus me-1" />
                New Expense
              </Link>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <SearchInput value={searchText} onChange={(v) => setSearchText(v)} />
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
      <ExpensesModal selectedExpense={selectedExpense} refetch={refetch} />
    </>
  );
};

export default ExpensesList;
