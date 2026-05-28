import { Link } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { DatePicker } from "antd";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import Modals from "../../clinic-modules/services/modals/modals";

interface InvoiceItem {
  id: number;
  serviceId: any;
  description: string;
  quantity: number;
  price: number;
  amount: number;
}

const EditInvoices = () => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const { services, refetch: refetchServices } = useClinicServices();
  const { patients } = useClinicPatients();

  const serviceOptions = services.map(s => ({ value: s.id, label: s.serviceName, price: s.price, description: s.serviceName }));
  const patientOptions = patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}`, email: p.email || "" }));

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTax, setSelectedTax] = useState<any>(null);

  const taxOptions = [
    { value: "0", label: "0% - No Tax" },
    { value: "5", label: "5% - GST" },
    { value: "10", label: "10% - VAT" },
    { value: "18", label: "18% - Professional" },
  ];

  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    { id: Date.now(), serviceId: null, description: "", quantity: 1, price: 0, amount: 0 },
  ]);
  const [invoiceDate, setInvoiceDate] = useState<any>(null);
  const [dueDate, setDueDate] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [otherInfo, setOtherInfo] = useState<string>("");

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleAddInvoice = (e: any) => {
    e.preventDefault();
    setInvoices([
      ...invoices,
      {
        id: Date.now(),
        serviceId: null,
        description: "",
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ]);
  };
  const handleRemoveInvoice = (id: number) => {
    if (invoices.length === 1) return;
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  const handleItemUpdate = (id: number, field: string, value: any) => {
    setInvoices(invoices.map(inv => {
      if (inv.id !== id) return inv;
      let updated = { ...inv, [field]: value };

      if (field === "serviceId" && value) {
        updated.price = value.price || 0;
        updated.description = value.description || "";
      }

      if (['quantity', 'price', 'serviceId'].includes(field)) {
        updated.amount = (Number(updated.quantity) || 0) * (Number(updated.price) || 0);
      }
      return updated;
    }));
  };

  const totals = useMemo(() => {
    const amount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const taxPerc = selectedTax?.value || 0;
    const taxValue = (amount * taxPerc) / 100;
    return { amount, taxValue, total: amount + taxValue };
  }, [invoices, selectedTax]);

  const handleSave = async () => {
    if (!selectedPatient) {
      alert("Please select a patient");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          patientId: selectedPatient.value,
          invoiceDate: invoiceDate ? invoiceDate.$d : new Date(),
          dueDate: dueDate ? dueDate.$d : new Date(),
          tax: selectedTax?.value || 0,
          discount: 0,
          subTotal: totals.amount,
          totalAmount: totals.total,
          paymentMethod: paymentMethod?.value || 'Cash',
          otherInfo: otherInfo,
          items: invoices.filter(inv => inv.serviceId).map(inv => ({
            serviceId: inv.serviceId?.value,
            description: inv.description,
            quantity: inv.quantity,
            price: inv.price,
            amount: inv.amount
          }))
        })
      });
      if (res.ok) {
        navigate(all_routes.invoices);
      } else {
        alert("Failed to save invoice");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-0 d-flex align-items-center">
                <Link to={all_routes.invoices} className="">
                  <i className="ti ti-chevron-left me-1 fs-14" />
                  Invoices
                </Link>
              </h6>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h5 className="fw-bold m-0"> Edit Invoice </h5>
            </div>
            <div className="card-body">
              <form>
                <div className="row">
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Patient Name <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        options={patientOptions}
                        value={selectedPatient}
                        onChange={setSelectedPatient}
                        className="select"
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={selectedPatient ? selectedPatient.email : ""}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Tax <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        options={taxOptions}
                        value={selectedTax}
                        onChange={setSelectedTax}
                        className="select"
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Payment Method <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        options={[
                          { value: 'Cash', label: 'Cash' },
                          { value: 'Card', label: 'Credit/Debit Card' },
                          { value: 'UPI', label: 'UPI' }
                        ]}
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        className="select"
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Invoice Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={invoiceDate}
                          onChange={setInvoiceDate}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Due Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                          value={dueDate}
                          onChange={setDueDate}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <table className="table invoice-table border">
                        <thead>
                          <tr>
                            <th style={{ minWidth: '300px' }}>Item (Service)</th>
                            <th style={{ minWidth: '200px' }}>Description</th>
                            <th style={{ width: '150px' }}>Unit Cost</th>
                            <th style={{ width: '120px' }}>Qty</th>
                            <th style={{ width: '150px' }}>Amount</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody className="invoices-list">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="invoices-list-item">
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{ flex: 1, minWidth: '200px' }}>
                                    <CommonSelect
                                      options={serviceOptions}
                                      value={invoice.serviceId}
                                      onChange={(val) => handleItemUpdate(invoice.id, 'serviceId', val)}
                                      className="select"
                                    />
                                  </div>
                                  <Link
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_service"
                                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                                  >
                                    <i className="ti ti-plus" />
                                  </Link>
                                </div>
                              </td>
                              <td>
                                <input type="text" className="form-control" value={invoice.description} onChange={(e) => handleItemUpdate(invoice.id, 'description', e.target.value)} />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={invoice.price} onChange={(e) => handleItemUpdate(invoice.id, 'price', e.target.value)} />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={invoice.quantity} onChange={(e) => handleItemUpdate(invoice.id, 'quantity', e.target.value)} />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  readOnly
                                  value={`$${invoice.amount.toFixed(2)}`}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn remove-invoices btn-sm border shadow-sm p-2 d-flex align-items-center justify-content-center rounded fs-14"
                                  onClick={() =>
                                    handleRemoveInvoice(invoice.id)
                                  }
                                >
                                  <i className="ti ti-trash" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td>
                              <button
                                onClick={handleAddInvoice}
                                className="btn add-invoices border-0 text-dark d-flex align-items-center fs-14 bg-transparent shadow-none"
                              >
                                <i className="ti ti-circle-plus text-primary me-1" />
                                Add Item
                              </button>
                            </td>
                            <td colSpan={5} />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-lg-8 col-md-8" />
                  <div className="col-lg-4">
                    <div className="">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fs-14 fw-normal text-dark">Sub Total</h6>
                        <h6 className="fs-14 fw-semibold text-dark">${totals.amount.toFixed(2)}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fs-14 fw-normal text-dark">Tax ({selectedTax ? selectedTax.value : 0}%)</h6>
                        <h6 className="fs-14 fw-semibold text-dark">${totals.taxValue.toFixed(2)}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fs-18 fw-bold">Total (USD)</h6>
                        <h6 className="fs-18 fw-bold">${totals.total.toFixed(2)}</h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Other Information <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <textarea
                          rows={3}
                          className="form-control "
                          value={otherInfo}
                          onChange={e => setOtherInfo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer">
              <div className="d-flex gap-2 align-items-center justify-content-end mb-0">
                <Link
                  to={all_routes.invoices}
                  className="btn btn-md bg-light text-dark fs-13 fw-medium rounded"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-md btn-primary fs-13 fw-medium rounded"
                >
                  {saving ? "Saving..." : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modals refetch={refetchServices} />
    </>
  );
};

export default EditInvoices;
