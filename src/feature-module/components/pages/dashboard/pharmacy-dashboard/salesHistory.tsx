import { useState, useMemo } from "react";
import { Link } from "react-router";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";
import { toast } from "react-toastify";
import Datatable from "../../../../../core/common/dataTable";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import InvoiceSlip from "../../patient-modules/patient-invoice-details/InvoiceSlip";
import EmptyState from "../../../../../core/common/emptyState";
import { usePharmacyBilling } from "../../../../../core/hooks/usePharmacyBilling";

const SalesHistory = () => {
  const { invoices, loading, deleteInvoice } = usePharmacyBilling();

  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [filterPayment, setFilterPayment] = useState("All");
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [printInvoiceData, setPrintInvoiceData] = useState<any>(null);

  const buildInvoiceData = (inv: any) => {
    if (!inv) return null;
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const clinic = userObj?.clinic || {};
    return {
      ...inv,
      clinic: {
        name: clinic.name || "Clinic",
        phone: clinic.phone || "",
        email: clinic.email || userObj.email || "",
        addressLine1: clinic.addressLine1 || "",
        addressLine2: clinic.addressLine2 || "",
        city: clinic.city || "",
        state: clinic.state || "",
        landingPage: {
          tagline: clinic.landingPage?.tagline || clinic.tagline || "",
          logo: clinic.landingPage?.logo || clinic.logo || null,
        },
      },
      invoiceCode: inv.invoiceNo,
      items: inv.items?.map((item: any) => {
        const descParts = [];
        if (item.medicine?.brandName) descParts.push(`Brand: ${item.medicine.brandName}`);
        if (item.medicine?.genericName) descParts.push(`Generic: ${item.medicine.genericName}`);
        if (item.medicine?.medicineCode) descParts.push(`SKU: ${item.medicine.medicineCode}`);
        return { ...item, name: item.medicineName, description: descParts.join(" | ") || undefined };
      }) || [],
      isPharmacy: true,
    };
  };

  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  const handlePrint = (inv: any) => {
    setPrintInvoiceData(buildInvoiceData(inv));
    setTimeout(() => {
      const el = document.getElementById("sh-print-slip");
      if (!el) return;
      el.style.display = "block";
      window.print();
      setTimeout(() => { el.style.display = "none"; setPrintInvoiceData(null); }, 1500);
    }, 100);
  };

  const handleDownload = (inv: any) => {
    setPrintInvoiceData(buildInvoiceData(inv));
    setTimeout(() => {
      const el = document.getElementById("sh-print-slip");
      if (!el) return;
      el.style.display = "block";
      html2pdf().from(el).set({
        margin: 0,
        filename: `Invoice-${inv.invoiceNo}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      }).save()
        .then(() => { el.style.display = "none"; setPrintInvoiceData(null); })
        .catch(() => { el.style.display = "none"; setPrintInvoiceData(null); });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this invoice? Medicine stock will be restored.")) return;
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted and stock restored.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete invoice");
    }
  };

  const filteredData = useMemo(() => {
    return invoices.filter((inv) => {
      const patName = inv.patient
        ? `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase()
        : (inv.customerName || "").toLowerCase();
      const medMatch = inv.items?.some((it: any) =>
        it.medicineName?.toLowerCase().includes(searchText.toLowerCase())
      );
      const matchSearch =
        inv.invoiceNo.toLowerCase().includes(searchText.toLowerCase()) ||
        patName.includes(searchText.toLowerCase()) ||
        medMatch;
      const matchPayment = filterPayment === "All" || inv.paymentStatus === filterPayment;
      const matchDate = !filterDate || dayjs(inv.invoiceDate).isSame(filterDate, "day");
      return matchSearch && matchPayment && matchDate;
    });
  }, [invoices, searchText, filterPayment, filterDate]);

  const data = filteredData.map((inv, index) => ({
    key: inv.id,
    id: inv.id,
    S_No: index + 1,
    InvoiceNo: inv.invoiceNo,
    Customer: inv.patient
      ? `${inv.patient.firstName} ${inv.patient.lastName}`
      : inv.customerName || "Walk-in",
    Phone: inv.patient?.phone || inv.customerPhone || "—",
    Medicines: inv.items?.map((it: any) => it.medicineName).join(", ") || "—",
    Date: dayjs(inv.invoiceDate).format("DD MMM YYYY"),
    Total: `₹${Number(inv.totalAmount).toLocaleString("en-IN")}`,
    Method: inv.paymentMethod,
    Status: inv.paymentStatus,
    raw: inv,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => <span className="text-dark fw-semibold">{text}</span>,
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 70,
    },
    {
      title: "Invoice No",
      dataIndex: "InvoiceNo",
      render: (text: string) => <span className="text-primary fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.InvoiceNo.localeCompare(b.InvoiceNo),
    },
    {
      title: "Patient / Customer",
      dataIndex: "Customer",
      render: (text: string, record: any) => (
        <div>
          <span className="text-dark fw-semibold d-block">{text}</span>
          {record.Phone && record.Phone !== "—" && <small className="text-muted">{record.Phone}</small>}
        </div>
      ),
      sorter: (a: any, b: any) => a.Customer.localeCompare(b.Customer),
    },
    {
      title: "Medicines",
      dataIndex: "Medicines",
      render: (text: string) => (
        <span className="text-dark" title={text}>
          {text.length > 40 ? text.slice(0, 40) + "…" : text}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => new Date(a.raw.invoiceDate).getTime() - new Date(b.raw.invoiceDate).getTime(),
    },
    {
      title: "Total",
      dataIndex: "Total",
      render: (text: string) => <span className="text-dark fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.raw.totalAmount - b.raw.totalAmount,
    },
    {
      title: "Payment",
      dataIndex: "Method",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`badge border ${text === "Paid" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} px-2 py-1 fs-12 fw-medium`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center">
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            onClick={() => { setViewInvoiceData(record.raw); triggerModal("sh_view_invoice"); }}
          >
            <i className="ti ti-eye fs-18" />
          </button>
        </div>
      ),
      width: 80,
    },
  ];

  return (
    <>
      {/* Hidden print slip */}
      <div id="sh-print-slip" style={{ display: "none" }}>
        {printInvoiceData && <InvoiceSlip invoice={printInvoiceData} />}
      </div>

      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                <i className="ti ti-chart-line me-2 text-primary fs-20" />
                Sales History
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "…" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filters */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Search */}
              <div className="search-field position-relative" style={{ width: "220px" }}>
                <input
                  type="text"
                  className="form-control fs-13 py-2"
                  placeholder="Invoice / Patient / Medicine..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Date */}
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap fs-13"
                style={{ width: "130px", minHeight: "38px", paddingTop: "7px" }}
                format="DD-MM-YYYY"
                allowClear
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(d) => setFilterDate(d)}
                value={filterDate}
              />

              {/* Status */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13"
                  style={{ minWidth: "150px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span><span className="text-muted">Status:</span> {filterPayment}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {["All", "Paid", "Unpaid"].map((s) => (
                    <li key={s}>
                      <Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment(s); }}>
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading sales history...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="border rounded bg-white">
              <EmptyState title="No sales yet" message="Create pharmacy bills to see them here automatically." />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable columns={columns} dataSource={data} Selection={false} searchText="" />
            </div>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* VIEW MODAL */}
      <ViewModal
        id="sh_view_invoice"
        title="Invoice Details"
        subtitle="Pharmacy billing details"
        headerIcon={<i className="ti ti-file-invoice" />}
        highlightTitle={
          viewInvoiceData?.patient
            ? `${viewInvoiceData.patient.firstName} ${viewInvoiceData.patient.lastName}`
            : viewInvoiceData?.customerName || "Walk-in Patient"
        }
        highlightStatus={
          <span className={`badge border ${viewInvoiceData?.paymentStatus === "Paid" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1" />{viewInvoiceData?.paymentStatus || "Unpaid"}
          </span>
        }
        highlightColor="#e0f2fe"
        details={
          viewInvoiceData ? [
            { icon: <i className="ti ti-receipt" />, label: "Invoice No", value: viewInvoiceData.invoiceNo },
            { icon: <i className="ti ti-calendar" />, label: "Invoice Date", value: dayjs(viewInvoiceData.invoiceDate).format("DD MMM YYYY") },
            { icon: <i className="ti ti-user" />, label: "Patient / Customer", value: viewInvoiceData.patient ? `${viewInvoiceData.patient.firstName} ${viewInvoiceData.patient.lastName}` : viewInvoiceData.customerName || "Walk-in", fullWidth: true },
            { icon: <i className="ti ti-phone" />, label: "Mobile", value: viewInvoiceData.patient?.phone || viewInvoiceData.customerPhone || "—" },
            { icon: <i className="ti ti-credit-card" />, label: "Payment Mode", value: viewInvoiceData.paymentMethod },
            { icon: <i className="ti ti-cash" />, label: "Sub Total", value: `₹${Number(viewInvoiceData.subTotal).toFixed(2)}` },
            { icon: <i className="ti ti-discount" />, label: "Discount", value: `₹${Number(viewInvoiceData.discount).toFixed(2)}` },
            { icon: <i className="ti ti-receipt-tax" />, label: "GST", value: `₹${Number(viewInvoiceData.tax).toFixed(2)}` },
            { icon: <i className="ti ti-currency-rupee" />, label: "Total Amount", value: `₹${Number(viewInvoiceData.totalAmount).toFixed(2)}`, fullWidth: true },
          ] : []
        }
      >
        {viewInvoiceData && (
          <div className="mt-4 border-top pt-3">
            <h6 className="fw-bold text-dark mb-3"><i className="ti ti-pill me-2 text-primary" />Medicines Detail</h6>
            <div className="table-responsive text-start">
              <table className="table table-bordered table-striped align-middle fs-13 mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Medicine</th>
                    <th className="text-center" style={{ width: 80 }}>Qty</th>
                    <th className="text-end" style={{ width: 110 }}>Unit Cost</th>
                    <th className="text-end" style={{ width: 120 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoiceData.items?.map((item: any, i: number) => {
                    const parts = [
                      item.medicine?.brandName ? `Brand: ${item.medicine.brandName}` : null,
                      item.medicine?.genericName ? `Generic: ${item.medicine.genericName}` : null,
                      item.medicine?.medicineCode ? `SKU: ${item.medicine.medicineCode}` : null,
                    ].filter(Boolean).join(" | ");
                    return (
                      <tr key={i}>
                        <td>
                          <div className="fw-semibold text-dark">{item.medicineName}</div>
                          {parts && <small className="text-muted d-block mt-1">{parts}</small>}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">₹{Number(item.unitCost).toFixed(2)}</td>
                        <td className="text-end fw-medium">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ViewModal>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #sh-print-slip, #sh-print-slip * { visibility: visible !important; }
          #sh-print-slip {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 21cm !important; height: 29.7cm !important;
            z-index: 99999 !important; padding: 0 !important; margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default SalesHistory;
