import { useState, useMemo } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import ExpenseCategoryModal from "../modal/expenseCategoryModal";
import { useExpenseCategories } from "../../../../../core/hooks/useExpenseCategories";
import { toast } from "react-toastify";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { apiDelete } from "../../../../../core/utils/apiClient";

const ExpenseCategory = () => {
  const { categories, refetch, loading, error } = useExpenseCategories();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [viewCategory, setViewCategory] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        try {
          await apiDelete(`/api/expense-categories/${id}`);
          successCount++;
        } catch (e) {
          console.error(e);
        }
      }
      setSelectedIds([]);
      toast.success(`${successCount} categories deleted successfully`);
      document.getElementById("btn-close-bulk-delete-category")?.click();
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete categories");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return categories.filter((cat: any) => {
      const matchStatus = filterStatus === "All" || cat.status === filterStatus;
      return matchStatus;
    });
  }, [categories, filterStatus]);

  const data = filteredData.map((cat: any, index: number) => ({
    key: cat.id,
    id: cat.id,
    S_No: index + 1,
    Category: cat.name,
    Status: cat.status,
    raw: cat,
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
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.Category.localeCompare(b.Category),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border fw-medium ${text === "Active"
              ? "badge-soft-success border-success"
              : "badge-soft-danger border-danger"
            }`}
        >
          {text}
        </span>
      ),
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
            onClick={() => setViewCategory(record.raw)}
            data-bs-toggle="modal"
            data-bs-target="#view_expense_category"
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_expense_category"
            onClick={() => setSelectedCategory(record.raw)}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_expense_category"
            onClick={() => setSelectedCategory(record.raw)}
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
                Expense Category
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
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
                        setFilterStatus("Active");
                      }}
                    >
                      Active
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Inactive");
                      }}
                    >
                      Inactive
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Add Category Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_expense_category"
                onClick={() => setSelectedCategory(null)}
              >
                Add Category <i className="fa fa-plus ms-2" />
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
              <p className="text-muted mt-2 mb-0">Loading categories</p>
            </div>
          ) : categories.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No categories yet"
                message="Organize your expenses by creating categories such as Equipment, Maintenance, or Utilities."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_expense_category"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Add Category <i className="ti ti-plus ms-2" />
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
                data-bs-target="#bulk_delete_expense_category_modal"
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

      <ExpenseCategoryModal
        selectedCategory={selectedCategory}
        refetch={refetch}
      />

      {/* ===== VIEW CATEGORY MODAL ===== */}
      <div id="view_expense_category" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">Category Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewCategory(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewCategory && (
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Category Name
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewCategory.name || ""}
                      readOnly
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewCategory.status || ""}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewCategory(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BULK DELETE MODAL ===== */}
      <div className="modal fade" id="bulk_delete_expense_category_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-n1"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-n1"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24"></i>
                </span>
              </div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete selected categories?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-bulk-delete-category"
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  onClick={handleBulkDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-trash me-2" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseCategory;