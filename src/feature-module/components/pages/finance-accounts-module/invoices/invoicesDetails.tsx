import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { apiUrl } from "../../../../../core/config/api";
import dayjs from "dayjs";
import InvoiceSlip from "../../patient-modules/patient-invoice-details/InvoiceSlip";
import html2pdf from "html2pdf.js";

const InvoicesDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleInvoicePrint = () => {
    const el = document.getElementById('print-invoice-slip');
    if (!el) return;
    el.style.display = 'block';
    window.print();
    setTimeout(() => { el.style.display = 'none'; }, 1500);
  };

  const handleInvoiceDownload = () => {
    const el = document.getElementById('print-invoice-slip');
    if (!el || !invoice) return;
    el.style.display = 'block';
    const opt = {
      margin: 0,
      filename: `Invoice-${invoice.invoiceCode || 'record'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(el).set(opt).save()
      .then(() => { el.style.display = 'none'; })
      .catch(() => { el.style.display = 'none'; });
  };

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(apiUrl(`/api/invoices/${id}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const dueInDays = invoice
    ? dayjs(invoice.dueDate).diff(dayjs(), "day")
    : null;

  const statusColor =
    invoice?.paymentStatus === "Paid"
      ? "bg-success"
      : invoice?.paymentStatus === "Partially Paid"
        ? "bg-warning"
        : "bg-danger";

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row m-auto justify-content-center">
            <div className="col-lg-12">
              {/* Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link to={all_routes.invoices} className="">
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Invoices
                    </Link>
                  </h6>
                </div>
              </div>

              {loading && (
                <div className="card">
                  <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Loading invoice...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="card">
                  <div className="card-body text-center py-5 text-danger">
                    <i className="ti ti-alert-circle fs-48 mb-3 d-block" />
                    <p>{error}</p>
                    <Link to={all_routes.invoices} className="btn btn-primary btn-sm">
                      Back to Invoices
                    </Link>
                  </div>
                </div>
              )}

              {!loading && !error && invoice && (
                <div className="card">
                  <div className="card-body">
                    {/* Top bar */}
                    <div className="d-flex align-items-center justify-content-between border-1 border-bottom pb-3 mb-3">
                      <div>
                        <h4 className="fw-bold text-primary mb-0">
                          {invoice.invoiceCode}
                        </h4>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge text-white ${statusColor}`}>
                          {invoice.paymentStatus}
                        </span>
                        {dueInDays !== null && dueInDays >= 0 && (
                          <span className="badge bg-danger text-white">
                            Due in {dueInDays} day{dueInDays !== 1 ? "s" : ""}
                          </span>
                        )}
                        {dueInDays !== null && dueInDays < 0 && (
                          <span className="badge bg-dark text-white">
                            Overdue by {Math.abs(dueInDays)} day{Math.abs(dueInDays) !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Invoice meta row */}
                    <div className="row pb-3 border-1 border-bottom mb-4">
                      <div className="col-lg-4">
                        <h5 className="mb-2 fs-16 fw-bold">Invoice Details</h5>
                        <p className="text-body mb-1">
                          Invoice Number :{" "}
                          <span className="text-dark fw-medium">
                            {invoice.invoiceCode}
                          </span>
                        </p>
                        <p className="text-body mb-1">
                          Issued On :{" "}
                          <span className="text-dark">
                            {dayjs(invoice.invoiceDate).format("DD MMM YYYY")}
                          </span>
                        </p>
                        <p className="text-body mb-1">
                          Due Date :{" "}
                          <span className="text-dark">
                            {dayjs(invoice.dueDate).format("DD MMM YYYY")}
                          </span>
                        </p>
                        <p className={`text-body ${invoice.appointment ? "mb-1" : "mb-0"}`}>
                          Payment Method :{" "}
                          <span className="text-dark">
                            {invoice.paymentMethod || ""}
                          </span>
                        </p>
                        {invoice.appointment && (
                          <p className="text-body mb-0">
                            Appointment :{" "}
                            <span className="text-dark fw-semibold">
                              #{invoice.appointment.appointmentCode || invoice.appointment.id.slice(-6)} (
                              {invoice.appointment.doctor?.fullName ? `Dr. ${invoice.appointment.doctor.fullName}` : "Doctor"} -{" "}
                              {dayjs(invoice.appointment.scheduledAt).format("DD MMM YYYY, hh:mm A")})
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="col-lg-4">
                        <h5 className="mb-2 fs-16 fw-bold">Clinic</h5>
                        <p className="text-dark fw-medium mb-1">
                          Your Clinic
                        </p>
                        <p className="text-body mb-1 pe-5">
                          <span className="text-body">
                            Billing address on file
                          </span>
                        </p>
                      </div>
                      <div className="col-lg-4 text-lg-end">
                        <h5 className="mb-2 fs-16 fw-bold">Invoice To</h5>
                        <p className="text-dark fw-medium mb-1">
                          {invoice.patient
                            ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
                            : "Patient not found (Deleted)"}
                        </p>
                        {invoice.patient?.email && (
                          <p className="text-body mb-1">
                            {invoice.patient.email}
                          </p>
                        )}
                        {invoice.patient?.phone && (
                          <p className="text-body mb-0">
                            {invoice.patient.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="mb-4">
                      <h6 className="mb-3 fs-16 fw-bold">Products / Service Items</h6>
                      <div className="table-responsive border bg-white">
                        <table className="table table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>#</th>
                              <th>Product / Item</th>
                              <th>Description</th>
                              <th>Unit Cost</th>
                              <th>Quantity</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items && invoice.items.length > 0 ? (
                              invoice.items.map((item: any, idx: number) => (
                                <tr key={item.id}>
                                  <td>{idx + 1}</td>
                                  <td className="fw-medium">
                                    {item.service?.serviceName || "Service"}
                                  </td>
                                  <td className="text-muted">
                                    {item.description || ""}
                                  </td>
                                  <td>₹{Number(item.unitCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>{item.quantity}</td>
                                  <td className="fw-semibold">
                                    ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-3">
                                  No items found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Totals + Notes row */}
                    <div className="row pb-3 mb-3 border-1 border-bottom">
                      <div className="col-lg-6">
                        {invoice.otherInfo && (
                          <div>
                            <h6 className="mb-2 fs-14 fw-semibold">Notes</h6>
                            <p className="text-body">{invoice.otherInfo}</p>
                          </div>
                        )}
                      </div>
                      <div className="col-lg-6">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="fs-14 fw-medium text-body">Sub Total</h6>
                          <h6 className="fs-14 fw-semibold text-dark">
                            ₹{Number(invoice.subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h6>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="fs-14 fw-medium text-body">
                            Tax ({invoice.tax}%)
                          </h6>
                          <h6 className="fs-14 fw-semibold text-dark">
                            ₹{(Number(invoice.subTotal) * Number(invoice.tax) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h6>
                        </div>
                        {Number(invoice.discount) > 0 && (
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h6 className="fs-14 fw-medium text-body">Discount</h6>
                            <h6 className="fs-14 fw-semibold text-danger">
                              -₹{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h6>
                          </div>
                        )}
                        <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-2">
                          <h6 className="fs-18 fw-bold">Total (INR)</h6>
                          <h6 className="fs-18 fw-bold text-primary">
                            ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h6>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="text-center d-flex align-items-center justify-content-center gap-2 d-print-none">
                      <button
                        onClick={handleInvoicePrint}
                        className="btn btn-md btn-dark d-flex align-items-center"
                      >
                        <i className="ti ti-printer me-1" /> Print
                      </button>
                      <button
                        onClick={handleInvoiceDownload}
                        className="btn btn-md btn-primary d-flex align-items-center shadow-primary"
                      >
                        <i className="ti ti-download me-1" /> Download PDF
                      </button>
                      <Link
                        to={all_routes.editInvoices.replace(":id", id || "")}
                        className="btn btn-md btn-secondary d-flex align-items-center"
                      >
                        <i className="ti ti-edit me-1" /> Edit Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 {" "}
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      {/* Hidden Invoice Slip for Print/Download */}
      <div id="print-invoice-slip" style={{ display: 'none' }}>
        <InvoiceSlip invoice={invoice} />
      </div>

      <style>{`
        .shadow-primary { box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39); }
        @media print {
          body * { visibility: hidden !important; }
          #print-invoice-slip, #print-invoice-slip * { visibility: visible !important; }
          #print-invoice-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 21cm !important;
            height: 29.7cm !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  );
};

export default InvoicesDetails;
