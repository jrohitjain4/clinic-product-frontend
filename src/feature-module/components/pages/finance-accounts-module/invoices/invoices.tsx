import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import EmptyState from "../../../../../core/common/emptyState";
import { Link, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import Datatable from "../../../../../core/common/dataTable";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { resolveMediaUrl, apiUrl } from "../../../../../core/config/api";

const PendingToggle = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-1 py-1 w-100">
      <span className="badge border badge-soft-danger border-danger fw-medium">
        Pending
      </span>
      <div className="form-check form-switch p-0 m-0 d-flex justify-content-center align-items-center">
        <input
          className="form-check-input m-0"
          type="checkbox"
          role="switch"
          checked={false}
          onChange={onToggle}
          style={{
            cursor: "pointer",
            width: "2.2em",
            height: "1.1em",
            float: "none",
          }}
          title="Toggle to mark as Paid"
        />
      </div>
    </div>
  );
};

const InvoicesList = () => {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type") || undefined;
  const { invoices, loading, error, refetch } = useClinicInvoices({ type: typeFilter });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const filteredData = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus =
        filterStatus === "All" || inv.paymentStatus === filterStatus;
      const matchDate =
        !filterDate || dayjs(inv.invoiceDate).isSame(filterDate, "day");

      return matchStatus && matchDate;
    });
  }, [invoices, filterStatus, filterDate]);

  const executeDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const token = localStorage.getItem("token");
    setDeleteLoading(true);
    try {
      let successCount = 0;
      for (const id of ids) {
        const res = await fetch(apiUrl(`/api/invoices/${id}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) successCount++;
      }
      if (successCount === ids.length) {
        toast.success(`${successCount} invoice(s) deleted successfully`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} of ${ids.length} invoices deleted.`);
      } else {
        toast.error("Failed to delete invoices");
      }
      setSelectedIds([]);
      setDeleteInvoiceId(null);
      refetch();
    } catch {
      toast.error("Could not complete deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/invoices/${invoiceId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
        }),
      });
      if (res.ok) {
        toast.success(`Invoice status updated to ${newStatus}`);
        refetch();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating invoice status");
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const firstInv = invoices[0];
    const logoSrc = resolveMediaUrl(firstInv?.clinic?.landingPage?.logo) || '/logo.png';
    const clinicName = firstInv?.clinic?.name || firstInv?.clinicName || "DocYari Clinical Network";
    const clinicAddress = firstInv?.clinic?.landingPage?.address || "Clinic Address Location";

    const reportHtml = `
      <html>
        <head>
          <title>Invoices Master Ledger</title>
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
            
            /* Dark Styled Tables */
            .table-bordered { border: 2px solid #0f172a !important; }
            .table-bordered th { 
              background-color: #0f172a !important; 
              color: #ffffff !important; 
              border: 2px solid #0f172a !important; 
              font-weight: 700; 
              font-size: 12px; 
              letter-spacing: 0.5px; 
              padding: 12px 10px !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .table-bordered td { border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; font-size: 13px; padding: 12px 10px !important; }
            .fw-heavy { font-weight: 800; color: #0f172a; }
            .badge-custom { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; border: 1px solid #cbd5e1; background: #f8fafc; }
            @media print { 
              .no-print { display: none; } 
              body { padding: 0; }
              .header-banner {
                background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .table-bordered th {
                background-color: #0f172a !important;
                color: #ffffff !important;
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
                <img src="${logoSrc}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
              </div>
              <div>
                <h4>${clinicName}</h4>
                <p><i class="ti ti-map-pin"></i> ${clinicAddress}</p>
                <h6>DocYari Health Ledger</h6>
                <p>Practice Wide Financial Statements</p>
              </div>
            </div>
            <div class="text-end text-white">
              <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                INVOICES MASTER LEDGER
              </span>
              <div class="small mt-1 opacity-90">
                <div class="mb-1"><strong>Total Records:</strong> ${filteredData.length}</div>
                <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          <table class="table table-bordered shadow-sm">
            <thead>
              <tr>
                <th class="text-white text-center">SR NO</th>
                <th class="text-white">INVOICE ID</th>
                <th class="text-white">PATIENT NAME</th>
                <th class="text-white">CREATED DATE</th>
                <th class="text-white">DUE DATE</th>
                <th class="text-white text-center">AMOUNT</th>
                <th class="text-white text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => `
                <tr style="background: ${r.S_No % 2 === 0 ? '#fcfcfc' : '#ffffff'};">
                  <td class="text-center fw-heavy">#${r.S_No}</td>
                  <td class="fw-bold text-primary">${r.InvoiceID || '#---'}</td>
                  <td class="fw-heavy text-dark" style="font-size: 13px;">${r.Patient}</td>
                  <td>${r.CreatedDate}</td>
                  <td>${r.DueDate}</td>
                  <td class="text-center fw-bold text-success" style="font-size: 13px;">
                    ${r.Amount}
                    ${r.raw.paymentStatus === 'Partially Paid' ? `<div class="text-danger small fw-bold" style="font-size: 10px;">Due: ₹${Math.max(0, r.raw.totalAmount - (r.raw.amountPaid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>` : ''}
                  </td>
                  <td class="text-center"><span class="badge-custom text-uppercase">${r.Status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="mt-5 pt-4 text-center border-top text-muted small">
            <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #4f46e5;">Docyari</span>, All Rights Reserved</p>
            <p class="mt-1 opacity-50" style="font-size: 10px;">End of Report. Confidential Financial Ledger.</p>
          </div>

          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const data = filteredData.map((inv, index) => ({
    key: inv.id,
    id: inv.id,
    S_No: index + 1,
    InvoiceID: inv.invoiceCode,
    Patient: inv.patient
      ? `${inv.patient.firstName} ${inv.patient.lastName}`
      : "Unknown",
    Image: inv.patient?.profileImage || "avatar-01.jpg",
    CreatedDate: dayjs(inv.invoiceDate).format("DD MMM YYYY"),
    DueDate: dayjs(inv.dueDate).format("DD MMM YYYY"),
    Amount: `₹${inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    Status: inv.paymentStatus,
    raw: inv,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Invoice ID",
      dataIndex: "InvoiceID",
      render: (text: string, record: any) => (
        <Link
          to={all_routes.invoicesDetails.replace(":id", record.id)}
          className="text-dark fw-medium"
        >
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) => a.InvoiceID.localeCompare(b.InvoiceID),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => {
        const hasImage = record.Image && record.Image.trim() !== "" && record.Image !== "avatar-01.jpg" && !record.Image.includes("300x300") && !record.Image.includes("ui-avatars.com");
        const patientImg = hasImage ? record.Image : "assets/img/patient-placeholder.png";

        return (
          <div className="d-flex align-items-center">
            <div className="avatar avatar-sm me-2">
              <img
                src={patientImg.startsWith('assets') || patientImg.startsWith('/uploads') || patientImg.startsWith('http') ? `/${patientImg.replace(/^\//, '')}` : `/${patientImg}`}
                alt={record.Patient}
                className="rounded-circle border"
                style={{ width: 36, height: 36, objectFit: "cover" }}
              />
            </div>
            <span className="text-dark fw-medium">{text}</span>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.invoiceDate).getTime() -
        new Date(b.raw.invoiceDate).getTime(),
    },
    {
      title: "Due Date",
      dataIndex: "DueDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.dueDate).getTime() - new Date(b.raw.dueDate).getTime(),
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      render: (text: string, record: any) => {
        const total = record.raw.totalAmount || 0;
        const paid = record.raw.amountPaid || 0;
        const due = Math.max(0, total - paid);
        return (
          <div className="d-flex flex-column">
            <span className={`fw-semibold ${record.Status === 'Paid' ? 'text-success' : 'text-dark'}`}>
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {record.Status === 'Partially Paid' && due > 0 && (
              <span className="text-danger fw-bold" style={{ fontSize: 10 }}>
                Due: ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) =>
        a.raw.totalAmount - b.raw.totalAmount,
    },
    {
      title: "Status",
      dataIndex: "Status",
      align: "center" as const,
      render: (text: string, record: any) => {
        let badgeClass = "badge-soft-danger border-danger";
        if (text === "Paid") badgeClass = "badge-soft-success border-success";
        else if (text === "Partially Paid")
          badgeClass = "badge-soft-warning border-warning";
        else if (text === "Draft")
          badgeClass = "badge-soft-secondary border-secondary";
        else if (text === "Cancelled")
          badgeClass = "badge-soft-dark border-dark";

        if (text === "Pending") {
          return <PendingToggle onToggle={() => handleUpdateStatus(record.id, "Paid")} />;
        }

        return (
          <span className={`badge border ${badgeClass} fw-medium`}>
            {text}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <Link
            to={all_routes.invoicesDetails.replace(":id", record.id)}
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
          >
            <i className="ti ti-eye fs-18"></i>
          </Link>

          {/* Edit Icon */}
          <Link
            to={all_routes.editInvoices.replace(":id", record.id)}
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
          >
            <i className="ti ti-edit fs-18"></i>
          </Link>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_invoice"
            onClick={() => setDeleteInvoiceId(record.id)}
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Invoices
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Paid");
                      }}
                    >
                      Paid
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Pending");
                      }}
                    >
                      Pending
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Partially Paid");
                      }}
                    >
                      Partially Paid
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Date Filter */}
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap"
                style={{ width: "130px", minHeight: "38px", paddingTop: "7px" }}
                format="DD-MM-YYYY"
                allowClear={true}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

              {/* Download & Print Dropdown */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap px-3"
                  style={{ minWidth: "190px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <i className="ti ti-printer me-1" /> Download & Print
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <button
                      className="dropdown-item rounded-1 d-flex align-items-center"
                      onClick={handleDownloadPDF}
                      style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                    >
                      <i className="ti ti-file-text me-2" /> Download as PDF
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item rounded-1 d-flex align-items-center"
                      onClick={handleDownloadPDF}
                      style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                    >
                      <i className="ti ti-printer me-2" /> Print report
                    </button>
                  </li>
                </ul>
              </div>

              {/* New Invoice Button Removed */}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading invoices</p>
            </div>
          ) : invoices.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No invoices yet"
                message="Invoice your patients for consultations, treatments, or medicines to maintain financial records."
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_invoice"
                onClick={() => setDeleteInvoiceId(null)}
                style={{
                  borderRadius: "8px",
                  minHeight: "42px",
                  fontWeight: "bold",
                }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      {/* Delete Modal */}
      <div id="delete_invoice" className="modal fade">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24"></i>
                </span>
              </div>
              <h5 className="fw-bold mb-2">Delete Invoice</h5>
              <p className="text-muted mb-4">
                {deleteInvoiceId
                  ? "Are you sure you want to delete this invoice?"
                  : `Delete ${selectedIds.length} selected invoice${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`}
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                  onClick={() => setDeleteInvoiceId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                  disabled={deleteLoading}
                  onClick={() => {
                    const ids = deleteInvoiceId ? [deleteInvoiceId] : selectedIds;
                    executeDelete(ids);
                  }}
                >
                  <i className="ti ti-trash me-2" />
                  {deleteLoading ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicesList;