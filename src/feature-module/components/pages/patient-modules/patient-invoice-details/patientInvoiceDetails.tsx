import { Link, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import InvoiceSlip from "./InvoiceSlip";
import html2pdf from "html2pdf.js";

const PatientInvoiceDetails = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const { getInvoiceById } = useClinicInvoices();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        getInvoiceById(id)
            .then((data) => setInvoice(data))
            .catch(() => setInvoice(null))
            .finally(() => setLoading(false));
    }, [id, getInvoiceById]);

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
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        html2pdf().from(el).set(opt).save()
            .then(() => { el.style.display = 'none'; })
            .catch(() => { el.style.display = 'none'; });
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
                    <div className="spinner-border text-primary" />
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="page-wrapper">
                <div className="content text-center py-5">
                    <i className="ti ti-file-off fs-1 text-muted" />
                    <p className="text-muted mt-2">Invoice not found.</p>
                    <Link to={all_routes.patientinvoices} className="btn btn-primary btn-sm">
                        Back to Invoices
                    </Link>
                </div>
            </div>
        );
    }

    const patient = invoice.patient || {};
    const clinic = invoice.clinic || {};
    const items = invoice.items || [];

    const dueDate = dayjs(invoice.dueDate);
    const diffDays = dueDate.diff(dayjs(), 'day');

    return (
        <>
            <div className="page-wrapper">
                <div className="content">
                    <div className="row">
                        <div className="col-lg-10 mx-auto">
                            <div className="card shadow-none border rounded-3 overflow-hidden">
                                <div className="card-body p-4 p-md-5">
                                    {/* Top Header Section */}
                                    <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                                        <h3 className="text-primary fw-bold mb-0">{invoice.invoiceCode || "#INV-0000"}</h3>
                                        <div className="d-flex gap-2">
                                            <span className={`badge ${invoice.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'} px-3 py-2 fs-12 fw-bold text-uppercase`}>
                                                {invoice.paymentStatus || 'Status'}
                                            </span>
                                            {diffDays > 0 && (
                                                <span className="badge bg-danger px-3 py-2 fs-12 fw-bold text-uppercase">
                                                    Due in {diffDays} days
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Information Grid */}
                                    <div className="row mb-5 gy-4">
                                        <div className="col-lg-4 col-md-6">
                                            <h5 className="text-dark fw-bold mb-3">Invoice Details</h5>
                                            <div className="d-flex flex-column gap-1">
                                                <p className="text-muted mb-0 fs-14">Invoice Number : <span className="text-dark fw-bold">{invoice.invoiceCode}</span></p>
                                                <p className="text-muted mb-0 fs-14">Issued On : <span className="text-dark fw-bold">{dayjs(invoice.invoiceDate).format("DD MMM YYYY")}</span></p>
                                                <p className="text-muted mb-0 fs-14">Due Date : <span className="text-dark fw-bold">{dayjs(invoice.dueDate).format("DD MMM YYYY")}</span></p>
                                                <p className="text-muted mb-0 fs-14">Payment Method : <span className="text-dark fw-bold">{invoice.paymentMethod || "Cash"}</span></p>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-md-6">
                                            <h5 className="text-dark fw-bold mb-3">Clinic</h5>
                                            <div className="d-flex flex-column gap-1">
                                                <p className="text-dark fw-bold mb-0 fs-14">{clinic.name || invoice.clinicName || "Your Clinic"}</p>
                                                <p className="text-muted mb-0 fs-14">{clinic.landingPage?.address || "Billing address on file"}</p>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-md-6 text-lg-end">
                                            <h5 className="text-dark fw-bold mb-3">Invoice To</h5>
                                            <div className="d-flex flex-column gap-1">
                                                <p className="text-dark fw-bold mb-0 fs-14">{patient.firstName} {patient.lastName}</p>
                                                <p className="text-muted mb-0 fs-14">{patient.email || "patient@docyari.com"}</p>
                                                <p className="text-muted mb-0 fs-14">{patient.phone || "9871234560"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="mb-5">
                                        <h5 className="text-dark fw-bold mb-4">Products / Service Items</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered align-middle">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="py-3 text-center fw-bold text-dark" style={{ width: '60px' }}>#</th>
                                                        <th className="py-3 fw-bold text-dark">Product / Item</th>
                                                        <th className="py-3 fw-bold text-dark">Description</th>
                                                        <th className="py-3 text-center fw-bold text-dark">Unit Cost</th>
                                                        <th className="py-3 text-center fw-bold text-dark">Quantity</th>
                                                        <th className="py-3 text-end fw-bold text-dark px-4">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.length > 0 ? items.map((item: any, i: number) => (
                                                        <tr key={i}>
                                                            <td className="py-3 text-center text-muted fw-medium">{i + 1}</td>
                                                            <td className="py-3 text-dark fw-medium">{item.name || item.item || "Standard Consultation"}</td>
                                                            <td className="py-3 text-muted">{item.description || "Consultation Services"}</td>
                                                            <td className="py-3 text-center text-muted">₹{(item.unitCost || 0).toFixed(2)}</td>
                                                            <td className="py-3 text-center text-muted">{item.quantity || 1}</td>
                                                            <td className="py-3 text-end fw-bold text-dark px-4">₹{(item.amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={6} className="text-center py-4 text-muted">No items found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Calculation Section */}
                                    <div className="row justify-content-end pb-5 mt-4">
                                        <div className="col-lg-5 col-md-7">
                                            <div className="d-flex flex-column gap-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span className="text-muted fw-bold">Sub Total</span>
                                                    <span className="text-dark fw-bold fs-16">₹{(invoice.subTotal || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span className="text-muted fw-bold">Tax ({invoice.tax || 0}%)</span>
                                                    <span className="text-dark fw-bold fs-16">₹{((invoice.subTotal || 0) * (invoice.tax || 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between border-top pt-4 mt-2">
                                                    <h4 className="text-dark fw-bold mb-0">Total (INR)</h4>
                                                    <h3 className="text-primary fw-bold mb-0">₹{(invoice.totalAmount || 0).toFixed(2)}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="d-flex align-items-center justify-content-center gap-3 d-print-none border-top pt-5">
                                        <button onClick={handleInvoicePrint} className="btn btn-dark px-5 py-2 fw-bold d-flex align-items-center">
                                            <i className="ti ti-printer me-2 fs-18" /> Print
                                        </button>
                                        <button onClick={handleInvoiceDownload} className="btn btn-primary px-5 py-2 fw-bold d-flex align-items-center shadow-primary">
                                            <i className="ti ti-download me-2 fs-18" /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer text-center bg-white p-3 border-top mt-5">
                    <p className="text-dark mb-0">
                        2025 © <span className="text-primary fw-bold">Docyari</span>, All Rights Reserved
                    </p>
                </div>
            </div>

            {/* Hidden Invoice Slip for Print/Download */}
            <div id="print-invoice-slip" style={{ display: 'none' }}>
                <InvoiceSlip invoice={invoice} />
            </div>

            <style>{`
        .shadow-primary { box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39); }
        .bg-light { background-color: #f8f9fa !important; }
        .text-dark { color: #1f2937 !important; }
        .border-bottom { border-bottom: 1px solid #e5e7eb !important; }
        .table-bordered { border-color: #e5e7eb !important; }
        @media print {
          .page-wrapper { margin: 0; padding: 0; background: white; }
          .card { border: none !important; }
          .d-print-none, .footer { display: none !important; }
        }
      `}</style>
        </>
    );
};

export default PatientInvoiceDetails;
