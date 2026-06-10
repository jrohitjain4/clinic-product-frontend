import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import Datatable from "../../../../../core/common/dataTable";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const InvoicesList = () => {
  const { invoices, loading, error, refetch } = useClinicInvoices();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    Amount: `$${inv.totalAmount.toFixed(2)}`,
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
      render: (text: string, record: any) => (
        <span className={`fw-semibold ${record.Status === 'Paid' ? 'text-success' : 'text-dark'}`}>
          ₹{record.raw.totalAmount.toLocaleString()}
        </span>
      ),
      sorter: (a: any, b: any) =>
        a.raw.totalAmount - b.raw.totalAmount,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = "badge-soft-danger border-danger";
        if (text === "Paid") badgeClass = "badge-soft-success border-success";
        else if (text === "Partially Paid")
          badgeClass = "badge-soft-warning border-warning";

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

              {/* Export Dropdown */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "100px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <i className="ti ti-download me-1" /> Export
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => e.preventDefault()}
                    >
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => e.preventDefault()}
                    >
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>

              {/* New Invoice Button */}
              <Link
                to={all_routes.addInvoices}
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
              >
                New Invoice <i className="fa fa-plus ms-2" />
              </Link>
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
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-file-invoice fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No invoices yet</h6>
              <p className="text-muted mb-3">Create your first invoice.</p>
              <Link
                to={all_routes.addInvoices}
                className="btn btn-primary"
              >
                New Invoice <i className="ti ti-plus ms-2" />
              </Link>
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
                Are you sure you want to delete this invoice?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  <i className="ti ti-trash me-2" />
                  Yes, Delete
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