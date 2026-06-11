import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";

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
    Amount: `$${(inv.totalAmount ?? 0).toFixed(2)}`,
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
      render: (text: string) => (
        <span className="text-dark fw-medium d-flex align-items-center">
          <i className="ti ti-notes me-2 text-muted fs-14" />
          {text}
        </span>
      ),
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
      render: (record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Link
            to={`${all_routes.patientinvoicedetails}?id=${record.id}`}
            className="btn btn-icon btn-sm btn-soft-primary border"
            title="View Invoice"
          >
            <i className="ti ti-eye fs-16" />
          </Link>

          <button
            className="btn btn-icon btn-sm btn-soft-info border"
            title="Download PDF"
            onClick={() => { /* Placeholder for download function */ }}
          >
            <i className="ti ti-download fs-16" />
          </button>
        </div>
      ),
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
              <div className="position-relative">
                <i className="ti ti-search position-absolute top-50 translate-middle-y ms-2 text-muted fs-14" style={{ zIndex: 10 }} />
                <input
                  type="text"
                  className="form-control text-end"
                  placeholder="Search Invoice ID..."
                  style={{ width: '180px', paddingLeft: '30px', height: '38px', fontSize: '13px' }}
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
                <input
                  type="date"
                  className="form-control fs-13"
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
