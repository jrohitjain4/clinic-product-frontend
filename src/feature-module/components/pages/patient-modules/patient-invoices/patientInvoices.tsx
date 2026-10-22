import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import { IconFormControl } from "../../../../../core/common/form-fields";

const PatientInvoices = () => {
  const { invoices, loading } = useClinicInvoices();

  const data = invoices.map((inv) => ({
    id: inv.id,
    Invoice_ID: inv.invoiceCode || `#${inv.id.slice(0, 6).toUpperCase()}`,
    Description: inv.items?.[0]?.description || inv.otherInfo || "Consultation",
    Created_Date: inv.invoiceDate
      ? new Date(inv.invoiceDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—",
    Due_Date: inv.dueDate
      ? new Date(inv.dueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—",
    Amount: `₹${(inv.totalAmount ?? 0).toFixed(2)}`,
    totalAmount: inv.totalAmount ?? 0,
    Status: inv.paymentStatus === "Paid"
      ? "Paid"
      : inv.paymentStatus === "Partial"
        ? "Partially Paid"
        : inv.paymentStatus === "Pending" || inv.paymentStatus === "Unpaid"
          ? "UnPaid"
          : inv.paymentStatus || "UnPaid",
    _rawDate: inv.invoiceDate,
  }));

  const columns = [
    {
      title: "Sr No",
      dataIndex: "id",
      render: (_: any, __: any, index: number) => (
        <span className="fw-bold d-flex align-items-center text-muted">
          <i className="ti ti-hash me-1 fs-10" />
          {String(index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      title: "Invoice ID",
      dataIndex: "Invoice_ID",
      render: (text: string, record: any) => (
        <Link
          to={`${all_routes.patientinvoicedetails}?id=${record.id}`}
          className="text-primary fw-bold d-flex align-items-center"
        >
          <i className="ti ti-file-invoice me-2 fs-14" />
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) => a.Invoice_ID.localeCompare(b.Invoice_ID),
    },
    {
      title: "Description",
      dataIndex: "Description",
      render: (text: string) => {
        const parts = text.split(" - ");
        if (parts.length > 1) {
          const mainDesc = parts[0];
          const doctorName = parts.slice(1).join(" - ");
          return (
            <div className="d-flex flex-column" style={{ lineHeight: '1.3' }}>
              <span className="text-dark fw-bold fs-13 d-flex align-items-center">
                <i className="ti ti-notes me-2 text-muted fs-14" />
                {mainDesc}
              </span>
              <span className="text-muted fw-semibold fs-11 ps-4" style={{ marginTop: '2px' }}>
                {doctorName}
              </span>
            </div>
          );
        }
        return (
          <span className="text-dark fw-medium d-flex align-items-center">
            <i className="ti ti-notes me-2 text-muted fs-14" />
            {text}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Description.localeCompare(b.Description),
    },
    {
      title: "Created Date",
      dataIndex: "Created_Date",
      render: (text: string) => (
        <span className="text-muted fw-medium d-flex align-items-center">
          <i className="ti ti-calendar-plus me-2 fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Created_Date.localeCompare(b.Created_Date),
    },
    {
      title: "Due Date",
      dataIndex: "Due_Date",
      render: (text: string) => (
        <span className="text-danger fw-medium d-flex align-items-center">
          <i className="ti ti-calendar-event me-2 fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Due_Date.localeCompare(b.Due_Date),
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string) => (
        <span className="text-dark fw-bold d-flex align-items-center">
          <i className="ti ti-wallet me-2 text-success fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Amount.localeCompare(b.Amount),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = "badge-soft-danger border-danger";
        if (text === "Paid") badgeClass = "badge-soft-success border-success";
        else if (text === "Partially Paid") badgeClass = "badge-soft-warning border-warning";

        return (
          <span className={`badge border ${badgeClass} d-inline-flex align-items-center fw-bold`}>
            <i className={`ti ti-circle-filled me-1 fs-8`} />
            {text}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: 'center' as const,
      render: (record: any) => {
        const inv = invoices.find((i) => i.id === record.id);
        const handleDownloadInvoice = () => {
          if (!inv) return;
          const printWindow = window.open('', '_blank');
          if (!printWindow) return;
          const html = `<html>
            <head>
              <title>Invoice - ${inv.invoiceCode || 'Record'}</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                .header-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important; color: #fff !important; padding: 24px !important; border-radius: 8px !important; margin-bottom: 25px !important; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .header-banner h4 { color: #fff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; }
                .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
                .info-value { font-size: 14px; font-weight: 700; color: #1e293b; }
                .table-bordered { border: 2px solid #0f172a !important; }
                .table th { background: #0f172a !important; color: #fff !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px; border: 2px solid #0f172a !important; font-weight: 700; }
                .table td { padding: 12px 10px; font-size: 13px; border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; }
                .total-box { background: #f8fafc; padding: 25px; border-radius: 12px; border: 2px solid #0f172a; }
                @media print { body { padding: 0; } .header-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              <div class="header-banner">
                <div class="d-flex align-items-center gap-3">
                  <div class="logo-box"><img src="${inv.clinic?.landingPage?.logo || '/logo.png'}" alt="logo" style="max-height:55px;max-width:55px;object-fit:contain;"></div>
                  <div>
                    <h4>${inv.clinic?.name || inv.clinicName || "Docyari Healthcare"}</h4>
                    <p>${inv.clinic?.landingPage?.address || 'Clinic Support Network'}</p>
                    <h6 style="color:#fff;font-size:14px;font-weight:bold;margin-top:8px;">OFFICIAL INVOICE</h6>
                    <p style="font-size:12px;opacity:0.8;">Ref: ${inv.invoiceCode || "#INV-0001"}</p>
                  </div>
                </div>
                <div class="text-end text-white">
                  <span class="${inv.paymentStatus === 'Paid' ? 'badge bg-success' : 'badge bg-warning text-dark'} fw-bold px-3 py-2 mb-2 text-uppercase" style="font-size:12px;border-radius:4px;">${inv.paymentStatus || 'PENDING'}</span>
                  <div class="small mt-1 opacity-90">
                    <div class="mb-1"><strong>Invoice Date:</strong> ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    <div><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>
                </div>
              </div>
              <div class="row g-4 mb-5">
                <div class="col-4"><div class="info-label">Recipient / Patient</div><div class="info-value" style="font-size:16px;color:#4f46e5;">${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}</div><div class="text-muted small">Phone: ${inv.patient?.phone || 'N/A'}</div><div class="text-muted small">Email: ${inv.patient?.email || 'N/A'}</div></div>
                <div class="col-4"><div class="info-label">Issuance Details</div><div class="text-muted small">Billing Date</div><div class="info-value">${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div><div class="text-muted small mt-2">Payment Method</div><div class="info-value">${inv.paymentMethod || "Direct Payment"}</div></div>
                <div class="col-4 text-end"><div class="info-label">Total Payable</div><div class="info-value text-primary" style="font-size:24px;">&#8377;${(inv.totalAmount || 0).toFixed(2)}</div><div class="text-muted small mt-1">Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div></div>
              </div>
              <div class="table-responsive">
                <table class="table table-bordered mb-5">
                  <thead><tr><th style="width:60px;" class="text-center">S.NO</th><th>SERVICE DESCRIPTION</th><th class="text-center">QTY</th><th class="text-center">UNIT PRICE</th><th class="text-end">LINE TOTAL</th></tr></thead>
                  <tbody>${(inv.items || []).map((item: any, i: number) => `<tr><td class="text-center text-muted fw-bold">${i + 1}</td><td><div class="fw-bold text-dark">${item.name || item.item || 'Health Consultation'}</div><div class="text-muted small mt-1">${item.description || ''}</div></td><td class="text-center fw-bold">${item.quantity || 1}</td><td class="text-center text-muted">&#8377;${(item.unitCost || 0).toFixed(2)}</td><td class="text-end fw-bold text-dark">&#8377;${(item.amount || 0).toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
              </div>
              <div class="row justify-content-end mb-5">
                <div class="col-5"><div class="total-box shadow-sm"><div class="d-flex justify-content-between mb-2"><span class="text-muted fw-bold small">SUBTOTAL</span><span class="fw-bold">&#8377;${(inv.subTotal || 0).toFixed(2)}</span></div><div class="d-flex justify-content-between mb-3"><span class="fw-bold small">TAX (${inv.tax || 0}%)</span><span class="fw-bold">&#8377;${((inv.subTotal || 0) * (inv.tax || 0) / 100).toFixed(2)}</span></div><div class="d-flex justify-content-between border-top pt-3 mt-1"><h5 class="fw-bold mb-0 text-dark">GRAND TOTAL</h5><h4 class="fw-bold text-primary mb-0">&#8377;${(inv.totalAmount || 0).toFixed(2)}</h4></div></div></div>
              </div>
              <div class="mt-5 pt-4 text-center border-top"><p class="mb-1 text-muted small">Thank you for your visit. For billing inquiries, please contact our clinic support.</p><p class="fw-bold fs-11 text-muted mb-0">2025 &copy; Docyari PHR Billing Gateway</p></div>
              <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
            </body></html>`;
          printWindow.document.write(html);
          printWindow.document.close();
        };
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <Link to={`${all_routes.patientinvoicedetails}?id=${record.id}`} className="text-info p-1" title="View Invoice">
              <i className="ti ti-eye fs-18" />
            </Link>
            <button className="bg-transparent border-0 text-primary p-1" title="Download PDF" onClick={handleDownloadInvoice}>
              <i className="ti ti-download fs-18" />
            </button>
          </div>
        );
      },
    },
  ];

  const [searchText, setSearchText] = useState<string>("");
  const [datePreset, setDatePreset] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search logic (ID or Description)
      const matchesSearch = searchText === "" ||
        row.Invoice_ID.toLowerCase().includes(searchText.toLowerCase()) ||
        row.Description.toLowerCase().includes(searchText.toLowerCase());

      // Date logic
      let matchesDate = true;
      const invDate = dayjs(row._rawDate); // Need to add _rawDate to mapping

      if (datePreset === "Today") {
        matchesDate = invDate.isSame(dayjs(), 'day');
      } else if (datePreset === "Yesterday") {
        matchesDate = invDate.isSame(dayjs().subtract(1, 'day'), 'day');
      } else if (datePreset === "Last 7 Days") {
        matchesDate = invDate.isAfter(dayjs().subtract(7, 'day'));
      } else if (datePreset === "Custom" && filterDate) {
        matchesDate = invDate.format("YYYY-MM-DD") === filterDate;
      }

      return matchesSearch && matchesDate;
    });
  }, [data, searchText, datePreset, filterDate]);

  return (
    <>
      <div className="page-wrapper">
        <div className="content content-two">
          {/* Unified Header - Title Left, All Filters & Actions Right */}
          <div className="d-flex align-items-sm-center flex-column flex-sm-row justify-content-between mb-4 border-bottom pb-4 gap-3 flex-wrap">
            <div className="d-flex align-items-center">
              <h4 className="fw-bold mb-0">
                Invoices
                <span className="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium ms-2 fs-13">
                  Total : {filteredData.length}
                </span>
              </h4>
            </div>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {/* Search */}
              <div style={{ width: '180px' }}>
                <IconFormControl
                  fieldLabel="search"
                  type="text"
                  className="text-end fs-13"
                  placeholder="Search Invoice ID..."
                  style={{ height: '38px', fontSize: '13px' }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Date Filter */}
              <select
                className="form-select fw-bold fs-13"
                style={{ width: '135px', height: '38px', borderRadius: '6px' }}
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Custom">Custom Date</option>
              </select>

              {datePreset === "Custom" && (
                <IconFormControl
                  fieldLabel="Date"
                  type="date"
                  className="fs-13"
                  style={{ width: '150px', height: '38px' }}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              )}

              {/* Clear Button */}
              {(searchText || datePreset !== "All" || filterDate) && (
                <button
                  className="btn btn-soft-danger btn-icon border"
                  style={{ height: '38px', width: '38px', borderRadius: '6px' }}
                  title="Clear Filters"
                  onClick={() => {
                    setSearchText("");
                    setDatePreset("All");
                    setFilterDate("");
                  }}
                >
                  <i className="ti ti-refresh fs-16" />
                </button>
              )}

              {/* Export & Sort */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-md fs-13 fw-bold border bg-white rounded text-dark d-inline-flex align-items-center px-3"
                  style={{ height: '38px' }}
                  data-bs-toggle="dropdown"
                >
                  Export <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li><Link className="dropdown-item" to="#">Download as PDF</Link></li>
                  <li><Link className="dropdown-item" to="#">Download as Excel</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-bold rounded border text-dark px-3 fs-13"
                  style={{ height: '38px' }}
                  data-bs-toggle="dropdown"
                >
                  Sort By
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">Recent</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Oldest</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="row">
            <div className="col-sm-12">
              <div>
                <div className="card-body p-0">
                  <div className="table-responsive table-nowrap">
                    {loading ? (
                      <div className="text-center py-5">
                        <span className="spinner-border text-primary" role="status" />
                        <p className="text-muted mt-2 mb-0">Loading invoices…</p>
                      </div>
                    ) : filteredData.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="ti ti-receipt-off fs-40 text-muted" />
                        <p className="text-muted mt-2 mb-0">No invoices found matching your criteria.</p>
                      </div>
                    ) : (
                      <Datatable
                        columns={columns}
                        dataSource={filteredData}
                        Selection={true}
                        searchText={""} // Search handled manually for more control
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 © <Link to="#" className="link-primary">Docyori</Link>, All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default PatientInvoices;
