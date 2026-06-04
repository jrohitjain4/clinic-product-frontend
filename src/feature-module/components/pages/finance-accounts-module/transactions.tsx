import { useState, useMemo } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import { useClinicInvoices } from "../../../../core/hooks/useClinicInvoices";
import dayjs from "dayjs";

const TransactionsList = () => {
  const { invoices, loading } = useClinicInvoices();
  const [searchText, setSearchText] = useState<string>("");

  // Only show Paid invoices as Transactions
  const transactions = useMemo(() => {
    return invoices.filter(
      (inv) => inv.paymentStatus === "Paid" || inv.paymentStatus === "Completed"
    );
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!searchText) return transactions;
    const q = searchText.toLowerCase();
    return transactions.filter((inv) => {
      const patientName = inv.patient
        ? `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.toLowerCase()
        : "";
      return (
        inv.invoiceCode.toLowerCase().includes(q) ||
        patientName.includes(q) ||
        (inv.paymentMethod || "").toLowerCase().includes(q) ||
        (inv.items?.[0]?.description || "").toLowerCase().includes(q)
      );
    });
  }, [transactions, searchText]);

  const getInitials = (inv: any) => {
    if (!inv.patient) return "?";
    const f = inv.patient.firstName?.[0] || "";
    const l = inv.patient.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase();
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Transactions{" "}
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Transactions : {loading ? "…" : transactions.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="dropdown me-1">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* Search */}
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <div className="search-set">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  
                </div>
              </div>
            </div>
          </div>
          {/* Table */}
          <div className="table-responsive">
            <table className="table table-nowrap datatable">
              <thead className="thead-light">
                <tr>
                  <th>Transaction ID</th>
                  <th>Patient</th>
                  <th>Description</th>
                  <th>Paid Date</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary" role="status" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No transactions found. Mark invoices as <strong>Paid</strong> to see them here.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const patientName = inv.patient
                      ? `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.trim()
                      : "—";
                    const description = inv.items?.[0]?.description || "Invoice";

                    return (
                      <tr key={inv.id}>
                        <td>
                          <Link to="#" className="fw-semibold text-primary">
                            {inv.invoiceCode}
                          </Link>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span
                              className="avatar avatar-md me-2 rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold fs-13 flex-shrink-0"
                              style={{ width: 36, height: 36 }}
                            >
                              {inv.patient?.profileImage ? (
                                <img
                                  src={inv.patient.profileImage}
                                  alt={patientName}
                                  className="rounded-circle"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                getInitials(inv)
                              )}
                            </span>
                            <span className="text-dark fw-semibold">{patientName}</span>
                          </div>
                        </td>
                        <td className="text-dark">{description}</td>
                        <td className="text-dark">
                          {dayjs(inv.invoiceDate).format("DD MMM YYYY")}
                        </td>
                        <td className="text-dark">{inv.paymentMethod || "—"}</td>
                        <td className="text-dark fw-semibold">
                          ${inv.totalAmount.toFixed(2)}
                        </td>
                        <td>
                          <span className="badge border badge-soft-success border-success text-success rounded fw-medium">
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©{" "}
            <Link to="#" className="link-primary">
              Docyori
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default TransactionsList;
