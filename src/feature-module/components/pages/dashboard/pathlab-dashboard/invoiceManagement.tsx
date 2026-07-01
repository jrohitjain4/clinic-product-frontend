import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import DeleteModal from "../../../../../core/common/modal/DeleteModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useLabBookings } from "../../../../../core/hooks/useLabBookings";
import EmptyState from "../../../../../core/common/emptyState";
import InvoiceSlip from "../../patient-modules/patient-invoice-details/InvoiceSlip";
import html2pdf from "html2pdf.js";

const InvoiceManagement = () => {
  const { bookings, loading, updateBooking, deleteBooking, bulkDeleteBookings } = useLabBookings();

  // Only bookings that have invoiceNo are treated as invoices
  const invoices = useMemo(() => bookings.filter(b => b.invoiceNo), [bookings]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterPayment, setFilterPayment] = useState<string>("All");
  const [filterPatient, setFilterPatient] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  const patientList = useMemo(() => {
    const names = invoices
      .map(inv => inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : "")
      .filter(n => n);
    return Array.from(new Set(names)).sort();
  }, [invoices]);

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [printInvoice, setPrintInvoice] = useState<any>(null);

  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  const [formPaymentStatus, setFormPaymentStatus] = useState("Unpaid");
  const [formPaymentMethod, setFormPaymentMethod] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenEdit = (inv: any) => {
    setSelectedInvoice(inv);
    setFormPaymentStatus(inv.paymentStatus);
    setFormPaymentMethod(inv.paymentMethod || "");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoice) {
      setSubmitting(true);
      try {
        await updateBooking(selectedInvoice.id, { paymentStatus: formPaymentStatus, paymentMethod: formPaymentMethod || null });
        toast.success("Payment status updated!");
        setShowEditModal(false);
        setSelectedInvoice(null);
      } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
    }
  };

  const handleOpenDelete = (inv: any) => { setSelectedInvoice(inv); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (selectedInvoice) {
      setSubmitting(true);
      try {
        await deleteBooking(selectedInvoice.id);
        setSelectedIds(selectedIds.filter(id => id !== selectedInvoice.id));
        toast.success("Invoice deleted!");
        setShowDeleteModal(false);
        setSelectedInvoice(null);
      } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await bulkDeleteBookings(selectedIds);
      setSelectedIds([]);
      toast.success("Selected invoices deleted!");
    } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
  };

  // Build an invoice-like object for InvoiceSlip from a lab booking
  const buildInvoiceData = (inv: any) => ({
    id: inv.id,
    invoiceCode: inv.invoiceNo || `LINV-${inv.bookingCode}`,
    invoiceDate: inv.createdAt,
    createdAt: inv.createdAt,
    dueDate: inv.createdAt,
    paymentMethod: inv.paymentMethod || "Cash",
    paymentStatus: inv.paymentStatus || "Unpaid",
    subTotal: inv.test?.price || inv.totalAmount || 0,
    discount: inv.discount || 0,
    tax: inv.tax || 0,
    totalAmount: inv.totalAmount || 0,
    patient: inv.patient || {},
    clinic: {},
    items: [
      {
        id: `item-${inv.id}`,
        description: `Lab Test: ${inv.test?.name || "Diagnostic Test"}`,
        serviceName: inv.test?.name || "Diagnostic Test",
        service: { serviceName: inv.test?.name || "Diagnostic Test" },
        quantity: 1,
        unitCost: inv.test?.price || inv.totalAmount || 0,
        amount: inv.test?.price || inv.totalAmount || 0,
      },
    ],
  });

  const handlePrint = (inv: any) => {
    setPrintInvoice(buildInvoiceData(inv));
    setTimeout(() => {
      const el = document.getElementById('print-diagnostic-invoice-slip');
      if (!el) return;
      el.style.display = 'block';
      window.print();
      setTimeout(() => { el.style.display = 'none'; setPrintInvoice(null); }, 1500);
    }, 100);
  };

  const handleDownload = (inv: any) => {
    setPrintInvoice(buildInvoiceData(inv));
    setTimeout(() => {
      const el = document.getElementById('print-diagnostic-invoice-slip');
      if (!el) return;
      el.style.display = 'block';
      const opt = {
        margin: 0,
        filename: `Invoice-${inv.invoiceNo || 'diagnostic'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      html2pdf().from(el).set(opt).save()
        .then(() => { el.style.display = 'none'; setPrintInvoice(null); })
        .catch(() => { el.style.display = 'none'; setPrintInvoice(null); });
    }, 100);
  };

  const filteredData = useMemo(() => {
    return invoices.filter((inv) => {
      const matchPayment = filterPayment === "All" || inv.paymentStatus === filterPayment;
      const patientName = inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : "";
      const matchPatient = filterPatient === "All" || patientName === filterPatient;
      const matchSearch =
        searchText === "" ||
        patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        (inv.invoiceNo || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (inv.bookingCode || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (inv.test?.name || "").toLowerCase().includes(searchText.toLowerCase());
      return matchPayment && matchPatient && matchSearch;
    });
  }, [invoices, filterPayment, filterPatient, searchText]);

  const data = filteredData.map((inv, index) => ({
    key: inv.id,
    id: inv.id,
    S_No: index + 1,
    InvoiceNo: inv.invoiceNo || "—",
    Patient: inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : "—",
    PatientCode: inv.patient?.patientCode || "",
    Test: inv.test?.name || "—",
    Category: inv.test?.category?.name || "—",
    Amount: `₹${inv.totalAmount.toLocaleString("en-IN")}`,
    InvoiceDate: dayjs(inv.createdAt).format("DD MMM YYYY"),
    PaymentStatus: inv.paymentStatus,
    PaymentMethod: inv.paymentMethod || "—",
    raw: inv,
  }));

  const columns = [
    { title: "S.No", dataIndex: "S_No", render: (text: number) => <span className="text-dark fw-semibold">{text}</span>, sorter: (a: any, b: any) => a.S_No - b.S_No, width: 70 },
    { title: "Invoice No", dataIndex: "InvoiceNo", render: (text: string) => <span className="text-primary fw-bold">{text}</span>, sorter: (a: any, b: any) => a.InvoiceNo.localeCompare(b.InvoiceNo) },
    {
      title: "Patient", dataIndex: "Patient",
      render: (text: string, record: any) => (<div className="d-flex flex-column"><span className="text-dark fw-bold">{text}</span><span className="text-muted fs-11">{record.PatientCode}</span></div>),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Test", dataIndex: "Test",
      render: (text: string, record: any) => (<div className="d-flex flex-column"><span className="text-dark fw-medium">{text}</span><span className="text-muted fs-11">{record.Category}</span></div>),
      sorter: (a: any, b: any) => a.Test.localeCompare(b.Test),
    },
    { title: "Amount", dataIndex: "Amount", render: (text: string) => <span className="text-dark fw-bold">{text}</span>, sorter: (a: any, b: any) => a.raw.totalAmount - b.raw.totalAmount },
    { title: "Date", dataIndex: "InvoiceDate", render: (text: string) => <span className="text-dark">{text}</span>, sorter: (a: any, b: any) => new Date(a.raw.createdAt).getTime() - new Date(b.raw.createdAt).getTime() },
    {
      title: "Payment", dataIndex: "PaymentStatus",
      render: (text: string) => (
        <span className={`badge border ${text === "Paid" ? "badge-soft-success border-success" : text === "Unpaid" ? "badge-soft-danger border-danger" : "badge-soft-warning border-warning"} px-2 py-1 fs-12 fw-medium`}>{text}</span>
      ),
      sorter: (a: any, b: any) => a.PaymentStatus.localeCompare(b.PaymentStatus),
    },
    {
      title: "Action", align: "center" as const, width: 180,
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <button className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, borderRadius: '6px' }} title="View" onClick={() => { setViewInvoice(record.raw); triggerModal('view_invoice'); }}><i className="ti ti-eye fs-16 text-info"></i></button>
          <button className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, borderRadius: '6px' }} title="Print" onClick={() => handlePrint(record.raw)}><i className="ti ti-printer fs-16 text-success"></i></button>
          <button className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, borderRadius: '6px' }} title="Download PDF" onClick={() => handleDownload(record.raw)}><i className="ti ti-download fs-16 text-primary"></i></button>
          <button className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, borderRadius: '6px' }} title="Edit Payment" onClick={() => handleOpenEdit(record.raw)}><i className="ti ti-edit fs-16 text-warning"></i></button>
          <button className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, borderRadius: '6px' }} title="Delete" onClick={() => handleOpenDelete(record.raw)}><i className="ti ti-trash fs-16 text-danger"></i></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1"><h4 className="page-title fw-bold mb-0 d-flex align-items-center">Invoice Management <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">Total : {loading ? "" : filteredData.length}</span></h4></div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "200px" }}><input type="text" className="form-control fs-13 py-2" placeholder="Search Invoice..." value={searchText} onChange={(e) => setSearchText(e.target.value)} /></div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "160px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Patient:</span> {filterPatient}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: "220px", overflowY: "auto" }}>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPatient("All"); }}>All</Link></li>
                  {patientList.map(name => (
                    <li key={name}><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPatient(name); }}>{name}</Link></li>
                  ))}
                </ul>
              </div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "160px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Payment:</span> {filterPayment}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("All"); }}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("Paid"); }}>Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("Unpaid"); }}>Unpaid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("Partial"); }}>Partial</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" role="status" /><p className="text-muted mt-2 mb-0">Loading invoices...</p></div>
          ) : invoices.length === 0 ? (
            <div className="border rounded bg-white"><EmptyState title="No invoices yet" message="Invoices are auto-generated when bookings are created." /></div>
          ) : (
            <div className="table-responsive"><Datatable columns={columns} dataSource={data} Selection={true} searchText={searchText} onSelectionChange={(keys) => setSelectedIds(keys as string[])} /></div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow" onClick={handleBulkDelete} disabled={submitting} style={{ borderRadius: "8px", minHeight: "42px", fontWeight: "bold" }}>
                <i className="ti ti-trash fs-18"></i> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top"><p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p></div>
      </div>

      {/* EDIT PAYMENT MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowEditModal(false)} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
              <div className="modal-header bg-primary text-white"><h5 className="modal-title text-white">Update Payment</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button></div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3"><label className="form-label fw-semibold">Invoice No</label><input type="text" className="form-control bg-light" value={selectedInvoice?.invoiceNo || ""} disabled /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Amount</label><input type="text" className="form-control bg-light fw-bold" value={`₹${selectedInvoice?.totalAmount?.toLocaleString("en-IN") || 0}`} disabled /></div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Status <span className="text-danger">*</span></label>
                    <select className="form-select" value={formPaymentStatus} onChange={(e) => setFormPaymentStatus(e.target.value)}>
                      <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Partial">Partial</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Method</label>
                    <select className="form-select" value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)}>
                      <option value="">Not Applicable</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Online">Online</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light"><button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Updating..." : "Update Payment"}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice?"
        message={<>Are you sure you want to delete <strong>{selectedInvoice?.invoiceNo}</strong>?</>}
        submitting={submitting}
      />

      {/* VIEW MODAL */}
      {/* VIEW MODAL - always in DOM, triggered via Bootstrap */}
      <ViewModal id="view_invoice" title="Invoice Details" subtitle="Lab Diagnostic Invoice" headerIcon={<i className="ti ti-file-invoice" />}
        highlightTitle={viewInvoice?.invoiceNo || "Invoice"}
        highlightStatus={
          <span className={`badge border ${viewInvoice?.paymentStatus === "Paid" ? "bg-success-transparent text-success border-success" : viewInvoice?.paymentStatus === "Unpaid" ? "bg-danger-transparent text-danger border-danger" : "bg-warning-transparent text-warning border-warning"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewInvoice?.paymentStatus}
          </span>
        }
        highlightColor="#e0e7ff"
        details={viewInvoice ? [
          { icon: <i className="ti ti-receipt" />, label: "Invoice No", value: viewInvoice.invoiceNo || "—" },
          { icon: <i className="ti ti-hash" />, label: "Booking Code", value: viewInvoice.bookingCode || "—" },
          { icon: <i className="ti ti-user" />, label: "Patient", value: viewInvoice.patient ? `${viewInvoice.patient.firstName} ${viewInvoice.patient.lastName} (${viewInvoice.patient.patientCode})` : "—", fullWidth: true },
          { icon: <i className="ti ti-phone" />, label: "Phone", value: viewInvoice.patient?.phone || "—" },
          { icon: <i className="ti ti-microscope" />, label: "Test", value: viewInvoice.test?.name || "—" },
          { icon: <i className="ti ti-tags" />, label: "Category", value: viewInvoice.test?.category?.name || "—" },
          { icon: <i className="ti ti-calendar" />, label: "Invoice Date", value: dayjs(viewInvoice.createdAt).format("DD MMM YYYY") },
          { icon: <i className="ti ti-credit-card" />, label: "Payment Method", value: viewInvoice.paymentMethod || "—" },
          { icon: <i className="ti ti-currency-rupee" />, label: "Test Price", value: `₹${(viewInvoice.test?.price || 0).toLocaleString("en-IN")}` },
          { icon: <i className="ti ti-discount" />, label: "Discount", value: `₹${(viewInvoice.discount || 0).toLocaleString("en-IN")}` },
          { icon: <i className="ti ti-percentage" />, label: "Tax", value: `₹${(viewInvoice.tax || 0).toLocaleString("en-IN")}` },
          { icon: <i className="ti ti-cash" />, label: "Total Amount", value: `₹${(viewInvoice.totalAmount || 0).toLocaleString("en-IN")}`, fullWidth: true },
        ] : []}
        onEdit={() => { handleOpenEdit(viewInvoice); }} editLabel="Update Payment" editModalTarget=""
      />

      {/* Hidden InvoiceSlip for Print/Download - same component as main invoices */}
      <div id="print-diagnostic-invoice-slip" style={{ display: 'none' }}>
        {printInvoice && <InvoiceSlip invoice={printInvoice} />}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-diagnostic-invoice-slip, #print-diagnostic-invoice-slip * { visibility: visible !important; }
          #print-diagnostic-invoice-slip {
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

export default InvoiceManagement;
