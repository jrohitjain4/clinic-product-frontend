import { useState, useEffect } from "react";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { toast } from "react-toastify";

interface ExpenseCategoryModalProps {
  selectedCategory?: any;
  refetch: () => void;
}

const STATUSES = ["Active", "Inactive"];

const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({ selectedCategory, refetch }) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCategory) {
      setName(selectedCategory.name || "");
      setStatus(selectedCategory.status || "Active");
      setFormError(null);
    } else {
      resetForm();
    }
  }, [selectedCategory]);

  const resetForm = () => {
    setName("");
    setStatus("Active");
    setFormError(null);
  };

  const closeBootstrapModal = (modalId: string) => {
    const el = document.getElementById(modalId);
    if (!el) return;
    const closeBtn = el.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement | null;
    closeBtn?.click();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiPost("/api/expense-categories", { name: name.trim(), status });
      toast.success("Category added successfully");
      closeBootstrapModal("add_expense_category");
      resetForm();
      refetch();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to add category";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiPut(`/api/expense-categories/${selectedCategory.id}`, { name: name.trim(), status });
      toast.success("Category updated successfully");
      closeBootstrapModal("edit_expense_category");
      refetch();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to update category";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/expense-categories/${selectedCategory.id}`);
      toast.success("Category deleted successfully");
      closeBootstrapModal("delete_expense_category");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = STATUSES.map((s) => ({ value: s, label: s }));
  const selectedStatusOption = status ? { value: status, label: status } : null;

  const renderFormFields = () => (
    <>
      {formError && (
        <div className="alert alert-danger py-2 fs-13 mb-3">{formError}</div>
      )}
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">
            Category Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">Status</label>
          <CommonSelect
            options={statusOptions}
            className="select"
            value={selectedStatusOption}
            placeholder="Select status"
            onChange={(opt) => setStatus(opt?.value || "Active")}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Add Modal */}
      <div className="modal fade" id="add_expense_category" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">New Category</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <form
              onSubmit={handleAdd}
              onFocus={() => {
                if (!name) resetForm();
              }}
            >
              <div className="modal-body">
                {renderFormFields()}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light px-4 shadow-sm"
                    data-bs-dismiss="modal"
                    style={{ borderRadius: "6px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center"
                    disabled={submitting}
                    style={{ borderRadius: "6px" }}
                  >
                    {submitting && <i className="fa fa-spinner fa-spin me-2" />}
                    {submitting ? "Saving…" : "Add Category"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit_expense_category" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Category</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {renderFormFields()}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light px-4 shadow-sm"
                    data-bs-dismiss="modal"
                    style={{ borderRadius: "6px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center"
                    disabled={submitting}
                    style={{ borderRadius: "6px" }}
                  >
                    {submitting && <i className="fa fa-spinner fa-spin me-2" />}
                    {submitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_expense_category" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
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
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">
                Are you sure you want to delete this category?
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseCategoryModal;
