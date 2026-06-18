import { Link, useSearchParams } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";

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

    const handlePrint = () => window.print();

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
                                                            <td className="py-3 text-center text-muted">${(item.unitCost || 0).toFixed(2)}</td>
                                                            <td className="py-3 text-center text-muted">{item.quantity || 1}</td>
                                                            <td className="py-3 text-end fw-bold text-dark px-4">${(item.amount || 0).toFixed(2)}</td>
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
                                                    <span className="text-dark fw-bold fs-16">${(invoice.subTotal || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span className="text-muted fw-bold">Tax ({invoice.tax || 0}%)</span>
                                                    <span className="text-dark fw-bold fs-16">${((invoice.subTotal || 0) * (invoice.tax || 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between border-top pt-4 mt-2">
                                                    <h4 className="text-dark fw-bold mb-0">Total (USD)</h4>
                                                    <h3 className="text-primary fw-bold mb-0">${(invoice.totalAmount || 0).toFixed(2)}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="d-flex align-items-center justify-content-center gap-3 d-print-none border-top pt-5">
                                        <button onClick={handlePrint} className="btn btn-dark px-5 py-2 fw-bold d-flex align-items-center">
                                            <i className="ti ti-printer me-2 fs-18" /> Print
                                        </button>
                                        <button onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            if (!printWindow || !invoice) return;

                                            const html = `<html>
                                                <head>
                                                    <title>Invoice - ${invoice.invoiceCode || 'Record'}</title>
                                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
                                                    <style>
                                                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                                        body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                                                        .header-banner {
                                                            background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                            color: #ffffff !important;
                                                            padding: 24px !important;
                                                            border-radius: 8px !important;
                                                            margin-bottom: 25px !important;
                                                            display: flex;
                                                            justify-content: space-between;
                                                            align-items: center;
                                                            -webkit-print-color-adjust: exact;
                                                            print-color-adjust: exact;
                                                        }
                                                        .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                                                        .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                                                        .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                                                        .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                                                        .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
                                                        .info-value { font-size: 14px; font-weight: 700; color: #1e293b; }
                                                        
                                                        /* Dark Styled Tables */
                                                        .table-bordered { border: 2px solid #0f172a !important; }
                                                        .table th { background: #0f172a !important; color: #ffffff !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px; border: 2px solid #0f172a !important; font-weight: 700; }
                                                        .table td { padding: 12px 10px; font-size: 13px; border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; }
                                                        
                                                        .total-box { background: #f8fafc; padding: 25px; border-radius: 12px; border: 2px solid #0f172a; }
                                                        .badge-paid { background: #ecfdf5; color: #059669; padding: 6px 16px; border-radius: 50px; font-weight: 800; font-size: 11px; }
                                                        .badge-unpaid { background: #fff7ed; color: #ea580c; padding: 6px 16px; border-radius: 50px; font-weight: 800; font-size: 11px; }
                                                        @media print { 
                                                            body { padding: 0; } 
                                                            .no-print { display: none; }
                                                            .header-banner {
                                                                background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                                                -webkit-print-color-adjust: exact;
                                                                print-color-adjust: exact;
                                                            }
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div class="header-banner">
                                                        <div class="d-flex align-items-center gap-3">
                                                            <div class="logo-box">
                                                                <img src="${resolveMediaUrl(invoice.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
                                                            </div>
                                                            <div>
                                                                <h4>${invoice.clinic?.name || invoice.clinicName || "Docyari Healthcare"}</h4>
                                                                <p><i class="ti ti-map-pin"></i> ${invoice.clinic?.landingPage?.address || 'Clinic Support Network'}</p>
                                                                <h6 class="text-white opacity-90 mt-2" style="font-size: 14px; font-weight: bold;">OFFICIAL INVOICE</h6>
                                                                <p class="mb-0 opacity-80" style="font-size: 12px;">Ref: ${invoice.invoiceCode || "#INV-0001"}</p>
                                                            </div>
                                                        </div>
                                                        <div class="text-end text-white">
                                                            <span class="${invoice.paymentStatus === 'Paid' ? 'badge bg-success text-white' : 'badge bg-warning text-dark'} fw-bold px-3 py-2 mb-2 text-uppercase" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                                ${invoice.paymentStatus || 'PENDING'}
                                                            </span>
                                                            <div class="small mt-1 opacity-90">
                                                                <div class="mb-1"><strong>Billing Date:</strong> ${dayjs(invoice.invoiceDate).format("DD MMM YYYY")}</div>
                                                                <div><strong>Due Date:</strong> ${dayjs(invoice.dueDate).format("DD MMM YYYY")}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="row g-4 mb-5">
                                                        <div class="col-4">
                                                            <div class="info-label">Recipient / Patient</div>
                                                            <div class="info-value" style="font-size: 16px; color: #4f46e5;">${invoice.patient?.firstName} ${invoice.patient?.lastName}</div>
                                                            <div class="text-muted small">Phone: ${invoice.patient?.phone || 'N/A'}</div>
                                                            <div class="text-muted small">Email: ${invoice.patient?.email || 'N/A'}</div>
                                                        </div>
                                                        <div class="col-4">
                                                            <div class="info-label">Issuance Details</div>
                                                            <div class="mb-2">
                                                                <div class="text-muted small">Billing Date</div>
                                                                <div class="info-value">${dayjs(invoice.invoiceDate).format("DD MMM YYYY")}</div>
                                                            </div>
                                                            <div>
                                                                <div class="text-muted small">Payment Method</div>
                                                                <div class="info-value">${invoice.paymentMethod || "Direct Payment"}</div>
                                                            </div>
                                                        </div>
                                                        <div class="col-4 text-end">
                                                            <div class="info-label">Total Payable</div>
                                                            <div class="info-value text-primary" style="font-size: 24px; letter-spacing: -1px;">$${(invoice.totalAmount || 0).toFixed(2)}</div>
                                                            <div class="text-muted small mt-1">Due Date: ${dayjs(invoice.dueDate).format("DD MMM YYYY")}</div>
                                                        </div>
                                                    </div>

                                                    <div class="table-responsive">
                                                        <table class="table table-bordered mb-5">
                                                            <thead>
                                                                <tr>
                                                                    <th class="text-center" style="width: 60px;">S.NO</th>
                                                                    <th>SERVICE DESCRIPTION</th>
                                                                    <th class="text-center">QTY</th>
                                                                    <th class="text-center">UNIT PRICE</th>
                                                                    <th class="text-end">LINE TOTAL</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                ${(invoice.items || []).map((item: any, i: number) => `
                                                                    <tr>
                                                                        <td class="text-center text-muted fw-bold">${i + 1}</td>
                                                                        <td>
                                                                            <div class="fw-bold text-dark">${item.name || item.item || "Health Consultation"}</div>
                                                                            <div class="text-muted small mt-1">${item.description || "General practitioner consultation fee"}</div>
                                                                        </td>
                                                                        <td class="text-center fw-bold">${item.quantity || 1}</td>
                                                                        <td class="text-center text-muted">$${(item.unitCost || 0).toFixed(2)}</td>
                                                                        <td class="text-end fw-bold text-dark">$${(item.amount || 0).toFixed(2)}</td>
                                                                    </tr>
                                                                `).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div class="row justify-content-end mb-5 pt-3">
                                                        <div class="col-5">
                                                            <div class="total-box shadow-sm">
                                                                <div class="d-flex justify-content-between mb-2">
                                                                    <span class="text-muted fw-bold small">SUBTOTAL</span>
                                                                    <span class="fw-bold">$${(invoice.subTotal || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div class="d-flex justify-content-between mb-3 text-secondary">
                                                                    <span class="fw-bold small">TAXABLE (${invoice.tax || 0}%)</span>
                                                                    <span class="fw-bold">$${((invoice.subTotal || 0) * (invoice.tax || 0) / 100).toFixed(2)}</span>
                                                                </div>
                                                                <div class="d-flex justify-content-between border-top pt-3 mt-1">
                                                                    <h5 class="fw-bold mb-0 text-dark">GRAND TOTAL</h5>
                                                                    <h4 class="fw-bold text-primary mb-0">$${(invoice.totalAmount || 0).toFixed(2)}</h4>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="mt-5 pt-5 text-center">
                                                        <div class="d-flex justify-content-center gap-5 mb-4">
                                                            <div style="border-top: 1px solid #e2e8f0; width: 150px; padding-top: 8px;">
                                                                <p class="info-label mb-0">Patient Sig.</p>
                                                            </div>
                                                            <div style="border-top: 1px solid #e2e8f0; width: 150px; padding-top: 8px;">
                                                                <p class="info-label mb-0">Authorized By</p>
                                                            </div>
                                                        </div>
                                                        <p class="mb-1 text-muted small">Thank you for your visit. For billing inquiries, please contact our clinic support.</p>
                                                        <p class="fw-bold fs-11 text-muted mb-0">2025 &copy; Docyari PHR Billing Gateway</p>
                                                    </div>

                                                    <script>
                                                        window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
                                                    </script>
                                                </body>
                                            </html>`;

                                            printWindow.document.write(html);
                                            printWindow.document.close();
                                        }} className="btn btn-primary px-5 py-2 fw-bold d-flex align-items-center shadow-primary">
                                            <i className="ti ti-download me-2 fs-18" /> Download
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
