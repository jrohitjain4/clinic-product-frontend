import { useState, useEffect, useMemo } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useExpenseCategories } from "../../../../../core/hooks/useExpenseCategories";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicStaff } from "../../../../../core/hooks/useClinicStaff";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { toast } from "react-toastify";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";

interface ExpensesModalProps {
  selectedExpense?: any;
  refetch: () => void;
}

const PAYMENT_METHODS = ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking", "Cheque", "Bank Transfer", "PayPal"];
const STATUSES = ["Paid", "Pending"];

const ExpensesModal: React.FC<ExpensesModalProps> = ({ selectedExpense, refetch }) => {
  const { categories } = useExpenseCategories();
  const { doctors } = useClinicDoctors();
  const { staffs } = useClinicStaff();
  const activeCategories = categories.filter((c: any) => c.status === "Active").map((c: any) => c.name);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [purchasedBy, setPurchasedBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Paid");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  useEffect(() => {
    if (selectedExpense) {
      setName(selectedExpense.name || "");
      setCategory(selectedExpense.category || null);
      setAmount(String(selectedExpense.amount || ""));
      setDate(selectedExpense.date ? dayjs(selectedExpense.date) : null);
      setPurchasedBy(selectedExpense.purchasedBy || "");
      setPaymentMethod(selectedExpense.paymentMethod || null);
      setStatus(selectedExpense.status || "Paid");
      setFormError(null);
    } else {
      resetForm();
    }
  }, [selectedExpense]);

  const resetForm = () => {
    setName("");
    setCategory(null);
    setAmount("");
    setDate(null);
    setPurchasedBy("");
    setPaymentMethod(null);
    setStatus("Paid");
    setFormError(null);
  };

  const closeBootstrapModal = (modalId: string) => {
    const el = document.getElementById(modalId);
    if (!el) return;
    const closeBtn = el.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement | null;
    closeBtn?.click();
  };

  const buildPayload = () => ({
    name: name.trim(),
    category: category || "",
    amount: parseFloat(amount) || 0,
    date: date?.toISOString(),
    purchasedBy: purchasedBy.trim(),
    paymentMethod: paymentMethod || "",
    status: status || "Paid",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Expense name is required.");
      return;
    }
    if (!category) {
      setFormError("Category is required.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!date) {
      setFormError("Date is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await apiPost("/api/expenses", buildPayload());
      toast.success("Expense added successfully");
      closeBootstrapModal("add_new_expense");
      resetForm();
      refetch();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to add expense";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    if (!name.trim()) {
      setFormError("Expense name is required.");
      return;
    }
    if (!category) {
      setFormError("Category is required.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!date) {
      setFormError("Date is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await apiPut(`/api/expenses/${selectedExpense.id}`, buildPayload());
      toast.success("Expense updated successfully");
      closeBootstrapModal("edit_new_expense");
      refetch();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to update expense";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/expenses/${selectedExpense.id}`);
      toast.success("Expense deleted successfully");
      closeBootstrapModal("delete_expense");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  const categoryOptions = activeCategories.map((c) => ({ value: c, label: c }));
  const selectedCategoryOption = category ? { value: category, label: category } : null;

  const paymentMethodOptions = PAYMENT_METHODS.map((m) => ({ value: m, label: m }));
  const selectedPaymentMethodOption = paymentMethod ? { value: paymentMethod, label: paymentMethod } : null;

  const staffOptions = useMemo(() => {
    const docOpts = doctors.map(d => ({ value: d.fullName, label: `${d.fullName} (Doctor)` }));
    const staffOpts = staffs.map(s => ({ value: s.fullName, label: `${s.fullName} (Staff)` }));
    return [...docOpts, ...staffOpts];
  }, [doctors, staffs]);
  const selectedPurchaserOption = purchasedBy ? { value: purchasedBy, label: purchasedBy } : null;

  const statusOptions = STATUSES.map((s) => ({ value: s, label: s }));
  const selectedStatusOption = status ? { value: status, label: status } : null;

  const renderFormFields = (opts?: { showStatus?: boolean }) => (
    <>
      {formError && (
        <div className="alert alert-danger py-2 fs-13 mb-3">{formError}</div>
      )}
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">
            Expense Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter expense name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">
            Category <span className="text-danger">*</span>
          </label>
          <CommonSelect
            options={categoryOptions}
            className="select"
            value={selectedCategoryOption}
            placeholder="Select category"
            onChange={(opt) => setCategory(opt?.value || null)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">
            Amount ($) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            className="form-control"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step="any"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">
            Date <span className="text-danger">*</span>
          </label>
          <div className="input-icon-end position-relative">
            <DatePicker
              className="form-control datetimepicker w-100"
              format={{ format: "DD-MM-YYYY", type: "mask" }}
              getPopupContainer={getModalContainer}
              placeholder="DD-MM-YYYY"
              suffixIcon={null}
              value={date}
              onChange={(d) => setDate(d)}
            />
            <span className="input-icon-addon">
              <i className="ti ti-calendar" />
            </span>
          </div>
        </div>

        <div className="col-12">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">Purchased By</label>
          <CommonSelect
            options={staffOptions}
            className="select"
            value={selectedPurchaserOption}
            placeholder="Select purchaser (Doctor/Staff)"
            onChange={(opt) => setPurchasedBy(opt?.value || "")}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">Payment Method</label>
          <CommonSelect
            options={paymentMethodOptions}
            className="select"
            value={selectedPaymentMethodOption}
            placeholder="Select method"
            onChange={(opt) => setPaymentMethod(opt?.value || null)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label mb-1 text-dark fs-14 fw-medium">Status</label>
          <CommonSelect
            options={statusOptions}
            className="select"
            value={selectedStatusOption}
            placeholder="Select status"
            onChange={(opt) => setStatus(opt?.value || "Paid")}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Add Expense Modal */}
      <div className="modal fade" id="add_new_expense" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">New Expense</h5>
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
                if (!name && !category && !amount) resetForm();
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
                    {submitting ? "Saving…" : "Add New Expense"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <div className="modal fade" id="edit_new_expense" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Expense</h5>
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
      <div className="modal fade" id="delete_expense" role="dialog">
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
                Are you sure you want to delete this expense?
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

export default ExpensesModal;
