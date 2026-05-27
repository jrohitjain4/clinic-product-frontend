import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import ExpenseCategoryModal from "../modal/expenseCategoryModal";
import { useExpenseCategories } from "../../../../../core/hooks/useExpenseCategories";

const ExpenseCategory = () => {
  const { categories, refetch } = useExpenseCategories();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const data = categories.map((cat: any) => ({
    key: cat.id,
    id: cat.id,
    Category: cat.name,
    Status: cat.status,
    raw: cat,
  }));

  const columns = [
    {
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => <div className="text-dark fw-medium">{text}</div>,
      sorter: (a: any, b: any) => a.Category.length - b.Category.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Active"
              ? "badge-soft-success border-success text-success"
              : "badge-soft-danger border-danger text-danger"
            } rounded fw-medium fs-13`}
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
                data-bs-target="#edit_expense_category"
                onClick={() => setSelectedCategory(record.raw)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_expense_category"
                onClick={() => setSelectedCategory(record.raw)}
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
              <h4 className="fw-bold mb-0"> Expense Category </h4>
            </div>
            <div className="text-end d-flex">
              <Link
                to="#"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_expense_category"
                onClick={() => setSelectedCategory(null)}
              >
                <i className="ti ti-plus me-1" />
                Add Category
              </Link>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
              searchText={""}
            />
          </div>
        </div>
      </div>
      <ExpenseCategoryModal selectedCategory={selectedCategory} refetch={refetch} />
    </>
  );
};

export default ExpenseCategory;
