import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Select, Spin } from "antd";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";

interface ExpenseCategoryModalProps {
  selectedCategory?: any;
  refetch: () => void;
}

const STATUSES = ["Active", "Inactive"];

const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({ selectedCategory, refetch }) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      setName(selectedCategory.name || "");
      setStatus(selectedCategory.status || "Active");
    } else {
      resetForm();
    }
  }, [selectedCategory]);

  const resetForm = () => {
    setName("");
    setStatus("Active");
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await apiPost("/api/expense-categories", { name, status });
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_expense_category .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedCategory || !name) return;
    setLoading(true);
    try {
      await apiPut(`/api/expense-categories/${selectedCategory.id}`, { name, status });
      refetch();
      document.querySelector<HTMLElement>("#edit_expense_category .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setLoading(true);
    try {
      await apiDelete(`/api/expense-categories/${selectedCategory.id}`);
      refetch();
      document.querySelector<HTMLElement>("#delete_expense_category .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const formFields = (
    <div className="row">
      <div className="col-lg-12 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Category Name<span className="text-danger">*</span></label>
        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="col-lg-12 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Status</label>
        <Select
          className="select w-100"
          style={{ width: "100%" }}
          value={status}
          onChange={(v) => setStatus(v)}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          getPopupContainer={(trigger) => (trigger.parentNode as HTMLElement) || document.body}
          popupMatchSelectWidth={false}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Add Modal */}
      <div className="modal fade" id="add_expense_category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">New Category</h5>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">{formFields}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-sm me-2 fs-13 fw-medium" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm fs-13 fw-medium" disabled={loading}>
                  {loading ? <Spin size="small" /> : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit_expense_category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Edit Category</h5>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">{formFields}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-sm me-2 fs-13 fw-medium" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm fs-13 fw-medium" disabled={loading}>
                  {loading ? <Spin size="small" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete_expense_category">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure you want to delete this category?</p>
              <div className="d-flex justify-content-center">
                <Link to="#" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</Link>
                <Link to="#" onClick={handleDelete} className="btn btn-danger position-relative z-1">
                  {loading ? <Spin size="small" /> : "Yes, Delete"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseCategoryModal;
