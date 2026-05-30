import { Link, useParams, useNavigate } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { DatePicker } from "antd";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
import { useClinicProducts } from "../../../../../core/hooks/useClinicProducts";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import Modals from "../../clinic-modules/services/modals/modals";
import { apiUrl } from "../../../../../core/config/api";

interface InvoiceItem {
  id: number;
  serviceId: any;
  description: string;
  quantity: number;
  price: number;
  amount: number;
}

const EditInvoices = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const { services, refetch: refetchServices } = useClinicServices();
  const { products, refetch: refetchProducts } = useClinicProducts();
  const { patients } = useClinicPatients();

  const serviceOptions = services.map(s => ({
    type: "service",
    value: s.id,
    label: s.serviceName,
    price: s.price,
    description: s.serviceName,
  }));
  const productOptions = products.map(p => ({
    type: "product",
    value: p.id,
    label: p.name,
    price: p.price,
    description: `${p.name} (Key: ${p.key})`,
  }));
  const allItemOptions = [...serviceOptions, ...productOptions];

  const patientOptions = patients.map(p => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`,
    email: p.email || "",
  }));

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTax, setSelectedTax] = useState<any>(null);

  const taxOptions = [
    { value: "0", label: "0% - No Tax" },
    { value: "5", label: "5% - GST" },
    { value: "10", label: "10% - VAT" },
    { value: "18", label: "18% - Professional" },
  ];

  const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "Pending", label: "Pending" },
    { value: "Paid", label: "Paid" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    { id: Date.now(), serviceId: null, description: "", quantity: 1, price: 0, amount: 0 },
  ]);
  const [invoiceDate, setInvoiceDate] = useState<any>(null);
  const [dueDate, setDueDate] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [otherInfo, setOtherInfo] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Invoice Data
  useEffect(() => {
    if (!id || services.length === 0 || patients.length === 0) return;

    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/invoices/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedPatient(patientOptions.find(p => p.value === data.patientId) || null);
          setInvoiceDate(dayjs(data.invoiceDate));
          setDueDate(dayjs(data.dueDate));
          setSelectedTax(taxOptions.find(t => t.value === String(data.tax)) || null);
          setPaymentMethod({ value: data.paymentMethod, label: data.paymentMethod });
          setStatus({ value: data.paymentStatus || "Pending", label: data.paymentStatus || "Pending" });
          setOtherInfo(data.otherInfo || "");

          if (data.items && data.items.length > 0) {
            setInvoices(data.items.map((item: any) => {
              // Find matching service or product option
              const match = item.serviceId
                ? allItemOptions.find(opt => opt.value === item.serviceId && opt.type === "service")
                : null; // Handling product descriptions or custom logic can go here

              return {
                id: item.id || Date.now() + Math.random(),
                serviceId: match || null,
                description: item.description || "",
                quantity: item.quantity || 1,
                price: item.price || 0,
                amount: item.amount || 0,
              };
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load invoice", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, services, patients, products]);

  const handleAddInvoiceItem = (e: any) => {
    e.preventDefault();
    setInvoices([
      ...invoices,
      { id: Date.now(), serviceId: null, description: "", quantity: 1, price: 0, amount: 0 },
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
      if (["quantity", "price", "serviceId"].includes(field)) {
        updated.amount = (Number(updated.quantity) || 0) * (Number(updated.price) || 0);
      }
      return updated;
    }));
  };

  const totals = useMemo(() => {
    const amount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const taxPerc = selectedTax?.value || 0;
    const taxValue = (amount * Number(taxPerc)) / 100;
    return { amount, taxValue, total: amount + taxValue };
  }, [invoices, selectedTax]);

  const handleSave = async () => {
    if (!selectedPatient) { alert("Please select a patient"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/invoices/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: selectedPatient.value,
          invoiceDate: invoiceDate ? invoiceDate.$d : new Date(),
          dueDate: dueDate ? dueDate.$d : new Date(),
          tax: selectedTax?.value || 0,
          discount: 0,
          subTotal: totals.amount,
          totalAmount: totals.total,
          paymentMethod: paymentMethod?.value || "Cash",
          paymentStatus: status?.value || "Pending",
          otherInfo: otherInfo,
          items: invoices.map(inv => ({
            serviceId: inv.serviceId?.type === "service" ? inv.serviceId?.value : null,
            description: inv.description,
            quantity: inv.quantity,
            price: inv.price,
            amount: inv.amount,
          })),
        }),
      });
      if (res.ok) navigate(all_routes.invoices);
      else alert("Failed to update invoice");
    } catch (e) {
      console.error(e);
      alert("Error updating invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;

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
            <div className="card-header d-flex justify-content-between align-items-center">
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
                      <CommonSelect options={patientOptions} value={selectedPatient} onChange={setSelectedPatient} className="select" />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input type="text" className="form-control" value={selectedPatient ? selectedPatient.email : ""} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Status <span className="text-danger">*</span>
                      </label>
                      <CommonSelect options={statusOptions} value={status} onChange={setStatus} className="select" />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Tax <span className="text-danger">*</span>
                      </label>
                      <CommonSelect options={taxOptions} value={selectedTax} onChange={setSelectedTax} className="select" />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Payment Method <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        options={[
                          { value: "Cash", label: "Cash" },
                          { value: "Card", label: "Credit/Debit Card" },
                          { value: "UPI", label: "UPI" },
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
                        <DatePicker className="form-control datetimepicker" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="DD-MM-YYYY" suffixIcon={null} value={invoiceDate} onChange={setInvoiceDate} />
                        <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Due Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker className="form-control datetimepicker" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="DD-MM-YYYY" suffixIcon={null} value={dueDate} onChange={setDueDate} />
                        <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <table className="table invoice-table border">
                        <thead>
                          <tr>
                            <th style={{ minWidth: "300px" }}>Item (Service / Product)</th>
                            <th style={{ minWidth: "200px" }}>Description</th>
                            <th style={{ width: "150px" }}>Unit Cost</th>
                            <th style={{ width: "120px" }}>Qty</th>
                            <th style={{ width: "150px" }}>Amount</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody className="invoices-list">
                          {invoices.map((invoice, idx) => (
                            <tr key={invoice.id} className="invoices-list-item">
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{ flex: 1, minWidth: "200px" }}>
                                    <CommonSelect
                                      options={allItemOptions}
                                      value={invoice.serviceId}
                                      onChange={(val) => handleItemUpdate(invoice.id, "serviceId", val)}
                                      className="select"
                                    />
                                  </div>
                                  <Link
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_service"
                                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                                    title="Add Service"
                                  >
                                    <i className="ti ti-briefcase" />
                                  </Link>
                                  <Link
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_product"
                                    className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
                                    title="Add Product"
                                  >
                                    <i className="ti ti-box" />
                                  </Link>
                                </div>
                              </td>
                              <td>
                                <input type="text" className="form-control" value={invoice.description} onChange={(e) => handleItemUpdate(invoice.id, "description", e.target.value)} />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={invoice.price} onChange={(e) => handleItemUpdate(invoice.id, "price", e.target.value)} />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={invoice.quantity} onChange={(e) => handleItemUpdate(invoice.id, "quantity", e.target.value)} />
                              </td>
                              <td>
                                <input type="text" className="form-control" readOnly value={`$${invoice.amount.toFixed(2)}`} />
                              </td>
                              <td>
                                <button type="button" className="btn remove-invoices btn-sm border shadow-sm p-2 d-flex align-items-center justify-content-center rounded fs-14" onClick={() => handleRemoveInvoice(invoice.id)}>
                                  <i className="ti ti-trash" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td>
                              <button onClick={handleAddInvoiceItem} className="btn add-invoices border-0 text-dark d-flex align-items-center fs-14 bg-transparent shadow-none">
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
                        <textarea rows={3} className="form-control" value={otherInfo} onChange={e => setOtherInfo(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer">
              <div className="d-flex gap-2 align-items-center justify-content-end mb-0">
                <Link to={all_routes.invoices} className="btn btn-md bg-light text-dark fs-13 fw-medium rounded">Cancel</Link>
                <button type="button" onClick={handleSave} disabled={saving} className="btn btn-md btn-primary fs-13 fw-medium rounded">
                  {saving ? "Saving..." : "Update Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modals refetch={() => { refetchServices(); refetchProducts(); }} />
    </>
  );
};

export default EditInvoices;
