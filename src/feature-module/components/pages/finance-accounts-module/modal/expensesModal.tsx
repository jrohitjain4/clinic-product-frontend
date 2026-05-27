import { useState, useEffect } from "react";
import { Link } from "react-router";
import { DatePicker, Select, Spin } from "antd";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useExpenseCategories } from "../../../../../core/hooks/useExpenseCategories";

interface ExpensesModalProps {
  selectedExpense?: any;
  refetch: () => void;
}

const PAYMENT_METHODS = ["PayPal", "Debit Card", "Cheque", "Credit Card", "Bank Transfer", "Cash"];
const STATUSES = ["New", "Pending", "Approved", "Rejected"];

const ExpensesModal: React.FC<ExpensesModalProps> = ({ selectedExpense, refetch }) => {
  const { categories } = useExpenseCategories();
  const activeCategories = categories.filter((c: any) => c.status === "Active").map((c: any) => c.name);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [purchasedBy, setPurchasedBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("New");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedExpense) {
      setName(selectedExpense.name || "");
      setCategory(selectedExpense.category || null);
      setAmount(String(selectedExpense.amount || ""));
      setDate(selectedExpense.date ? dayjs(selectedExpense.date) : null);
      setPurchasedBy(selectedExpense.purchasedBy || "");
      setPaymentMethod(selectedExpense.paymentMethod || null);
      setStatus(selectedExpense.status || "New");
    } else {
      resetForm();
    }
  }, [selectedExpense]);

  const resetForm = () => {
    setName(""); setCategory(null); setAmount(""); setDate(null);
    setPurchasedBy(""); setPaymentMethod(null); setStatus("New");
  };

  const buildPayload = () => ({
    name, category, amount: parseFloat(amount) || 0,
    date: date?.toISOString(), purchasedBy, paymentMethod, status,
  });

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name || !amount || !date) return;
    setLoading(true);
    try {
      await apiPost("/api/expenses", buildPayload());
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_new_expense .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setLoading(true);
    try {
      await apiPut(`/api/expenses/${selectedExpense.id}`, buildPayload());
      refetch();
      document.querySelector<HTMLElement>("#edit_new_expense .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setLoading(true);
    try {
      await apiDelete(`/api/expenses/${selectedExpense.id}`);
      refetch();
      document.querySelector<HTMLElement>("#delete_expense .btn-close")?.click();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const formFields = (
    <div className="row">
      <div className="col-lg-12 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Expense Name<span className="text-danger">*</span></label>
        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="col-lg-12 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Category<span className="text-danger">*</span></label>
        <Select
          className="select w-100"
          style={{ width: "100%" }}
          value={category}
          onChange={(v) => setCategory(v)}
          options={activeCategories.map((c) => ({ value: c, label: c }))}
          placeholder="Select category"
          getPopupContainer={(trigger) => (trigger.parentNode as HTMLElement) || document.body}
          popupMatchSelectWidth={false}
        />
      </div>
      <div className="col-lg-6 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Amount ($)<span className="text-danger">*</span></label>
        <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required min={0} />
      </div>
      <div className="col-lg-6 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Date<span className="text-danger">*</span></label>
        <div className="input-group position-relative">
          <DatePicker
            className="form-control datetimepicker"
            format={{ format: "DD-MM-YYYY", type: "mask" }}
            placeholder="DD-MM-YYYY"
            suffixIcon={null}
            value={date}
            onChange={(d) => setDate(d)}
          />
          <span className="input-icon-addon"><i className="ti ti-calendar text-body" /></span>
        </div>
      </div>
      <div className="col-lg-12 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Purchased By</label>
        <input type="text" className="form-control" value={purchasedBy} onChange={(e) => setPurchasedBy(e.target.value)} placeholder="Enter name" />
      </div>
      <div className="col-lg-6 mb-3">
        <label className="form-label mb-1 text-dark fs-14 fw-medium">Payment Method</label>
        <Select
          className="select w-100"
          style={{ width: "100%" }}
          value={paymentMethod}
          onChange={(v) => setPaymentMethod(v)}
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
          placeholder="Select method"
          getPopupContainer={(trigger) => (trigger.parentNode as HTMLElement) || document.body}
          popupMatchSelectWidth={false}
        />
      </div>
      <div className="col-lg-6 mb-3">
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
      {/* Add Expense Modal */}
      <div className="modal fade" id="add_new_expense">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">New Expense</h5>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">{formFields}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-sm me-2 fs-13 fw-medium" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm fs-13 fw-medium" disabled={loading}>
                  {loading ? <Spin size="small" /> : "Add New Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <div className="modal fade" id="edit_new_expense">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-dark fw-bold">Edit Expense</h5>
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
      <div className="modal fade" id="delete_expense">
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
              <p className="mb-3">Are you sure you want to delete this expense?</p>
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

export default ExpensesModal;
