import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Bill {
  id: string;
  patientName: string;
  type: string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Overdue";
}

interface Payment {
  id: string;
  billId: string;
  patientName: string;
  date: string;
  amount: number;
  method: "Card" | "Cash" | "Bank Transfer" | "Insurance";
}

const mockBills: Bill[] = [
  { id: "INV-2041", patientName: "Alice Miller", type: "Cognitive Behavioral Therapy (CBT)", date: "2026-07-14", amount: 150.0, status: "Paid" },
  { id: "INV-2042", patientName: "Mark Davis", type: "Physical Therapy Session", date: "2026-07-14", amount: 120.0, status: "Unpaid" },
  { id: "INV-2043", patientName: "Emma Wilson", type: "Speech Therapy Session", date: "2026-07-14", amount: 130.0, status: "Paid" },
  { id: "INV-2044", patientName: "James Thompson", type: "CBT Follow-up Session", date: "2026-07-13", amount: 150.0, status: "Overdue" },
  { id: "INV-2045", patientName: "Sophia Martinez", type: "Occupational Therapy Session", date: "2026-07-12", amount: 140.0, status: "Paid" },
];

const mockPayments: Payment[] = [
  { id: "PAY-901", billId: "INV-2041", patientName: "Alice Miller", date: "2026-07-14", amount: 150.0, method: "Card" },
  { id: "PAY-902", billId: "INV-2043", patientName: "Emma Wilson", date: "2026-07-14", amount: 130.0, method: "Insurance" },
  { id: "PAY-903", billId: "INV-2045", patientName: "Sophia Martinez", date: "2026-07-12", amount: 140.0, method: "Bank Transfer" },
];

const BillingList = () => {
  const location = useLocation();
  const path = location.pathname;

  const defaultTab = path.includes("therapy-payments") ? "payments" : "bills";
  const [activeTab, setActiveTab] = useState<"bills" | "payments">(defaultTab);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Therapy Billing</h4>
            <p className="text-muted mb-0 fs-13">Manage therapy invoices, client bills, and payment records.</p>
          </div>
          <div>
            <Link to="/add-invoices" className="btn btn-primary btn-md">
              <i className="ti ti-plus me-1" /> Create Invoice
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <ul className="nav nav-tabs nav-tabs-solid mb-4">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold fs-14 ${activeTab === "bills" ? "active" : ""}`}
              onClick={() => setActiveTab("bills")}
            >
              Bills & Invoices
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold fs-14 ${activeTab === "payments" ? "active" : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              Payments Received
            </button>
          </li>
        </ul>

        {activeTab === "bills" ? (
          <div className="card border shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient</th>
                      <th>Therapy Type</th>
                      <th>Billing Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBills.map((bill) => (
                      <tr key={bill.id}>
                        <td>
                          <span className="fw-semibold text-primary">{bill.id}</span>
                        </td>
                        <td>{bill.patientName}</td>
                        <td>{bill.type}</td>
                        <td>{bill.date}</td>
                        <td>${bill.amount.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge badge-pill badge-md ${
                              bill.status === "Paid"
                                ? "bg-soft-success text-success"
                                : bill.status === "Unpaid"
                                ? "bg-soft-warning text-warning"
                                : "bg-soft-danger text-danger"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <Link to="#" className="btn btn-sm btn-outline-primary me-2">
                            View
                          </Link>
                          <Link to="#" className="btn btn-sm btn-outline-secondary">
                            Print
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Receipt ID</th>
                      <th>Invoice ID</th>
                      <th>Patient</th>
                      <th>Payment Date</th>
                      <th>Amount Paid</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <span className="fw-semibold text-success">{payment.id}</span>
                        </td>
                        <td>
                          <span className="fw-semibold text-primary">{payment.billId}</span>
                        </td>
                        <td>{payment.patientName}</td>
                        <td>{payment.date}</td>
                        <td>${payment.amount.toFixed(2)}</td>
                        <td>
                          <span className="badge bg-light text-dark fs-12 fw-normal border">
                            {payment.method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingList;
