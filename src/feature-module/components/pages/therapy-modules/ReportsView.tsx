import React from "react";
import { useLocation } from "react-router-dom";

const ReportsView = () => {
  const location = useLocation();
  const path = location.pathname;

  let reportTitle = "Therapy Reports";
  let reportSubtitle = "Detailed insights and metrics for therapy operations.";

  if (path.includes("therapy-appointment-report")) {
    reportTitle = "Appointment Report";
    reportSubtitle = "Performance breakdown of scheduled, attended, and cancelled therapy appointments.";
  } else if (path.includes("therapy-session-report")) {
    reportTitle = "Session Report";
    reportSubtitle = "Analysis of therapeutic sessions, durations, and session types.";
  } else if (path.includes("therapy-therapist-report")) {
    reportTitle = "Therapist Report";
    reportSubtitle = "Insights into therapist workloads, performance, ratings, and case resolutions.";
  } else if (path.includes("therapy-revenue-report")) {
    reportTitle = "Revenue Report";
    reportSubtitle = "Financial analytics covering bills raised, collections, and outstanding dues.";
  } else if (path.includes("patient-progress-report")) {
    reportTitle = "Patient Progress Report";
    reportSubtitle = "Clinical outcomes and progression tracking for active therapy patients.";
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="mb-4 pb-3 border-bottom">
          <h4 className="fw-bold mb-0">{reportTitle}</h4>
          <p className="text-muted mb-0 fs-13">{reportSubtitle}</p>
        </div>

        {/* Dynamic Metric Cards */}
        {path.includes("therapy-revenue-report") ? (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Total Invoiced</span>
                  <h3 className="fw-bold text-dark mb-0">$6,840.00</h3>
                  <span className="text-success fs-12 fw-medium"><i className="ti ti-trending-up me-1" /> +12% this month</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Payments Collected</span>
                  <h3 className="fw-bold text-success mb-0">$5,420.00</h3>
                  <span className="text-muted fs-12">79.2% recovery rate</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Outstanding Dues</span>
                  <h3 className="fw-bold text-warning mb-0">$1,270.00</h3>
                  <span className="text-muted fs-12">15 pending invoices</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Bad Debts / Cancelled</span>
                  <h3 className="fw-bold text-danger mb-0">$150.00</h3>
                  <span className="text-muted fs-12">1 write-off</span>
                </div>
              </div>
            </div>
          </div>
        ) : path.includes("patient-progress-report") ? (
          <div className="row mb-4">
            <div className="col-md-4 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Active Patients</span>
                  <h3 className="fw-bold text-dark mb-0">48</h3>
                  <span className="text-success fs-12 fw-medium">92% active attendance</span>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Completed / Discharged</span>
                  <h3 className="fw-bold text-success mb-0">14</h3>
                  <span className="text-muted fs-12">Goal achievement rate: 85%</span>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-12 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Average Improvement Score</span>
                  <h3 className="fw-bold text-primary mb-0">+34%</h3>
                  <span className="text-muted fs-12">Based on clinically standardized metrics</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Total Sessions</span>
                  <h3 className="fw-bold text-dark mb-0">124</h3>
                  <span className="text-success fs-12 fw-medium">+8% from last week</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Completed</span>
                  <h3 className="fw-bold text-success mb-0">112</h3>
                  <span className="text-muted fs-12">90.3% completion rate</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">Cancelled</span>
                  <h3 className="fw-bold text-danger mb-0">8</h3>
                  <span className="text-muted fs-12">6.4% cancellation rate</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border shadow-sm">
                <div className="card-body">
                  <span className="text-muted fs-13 d-block mb-1">No-Shows</span>
                  <h3 className="fw-bold text-warning mb-0">4</h3>
                  <span className="text-muted fs-12">3.2% client absentee rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Report Table / Visual Data */}
        <div className="card border shadow-sm">
          <div className="card-header bg-light py-3">
            <h5 className="mb-0 fw-semibold">Report Breakdown</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              {path.includes("therapy-revenue-report") ? (
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Month</th>
                      <th>CBT Income</th>
                      <th>Physical Therapy</th>
                      <th>Speech Therapy</th>
                      <th>Total Billing</th>
                      <th>Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="fw-semibold">July 2026</span></td>
                      <td>$3,200.00</td>
                      <td>$2,140.00</td>
                      <td>$1,500.00</td>
                      <td><span className="fw-semibold text-primary">$6,840.00</span></td>
                      <td><span className="badge bg-soft-success text-success">79.2%</span></td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold">June 2026</span></td>
                      <td>$3,450.00</td>
                      <td>$2,400.00</td>
                      <td>$1,650.00</td>
                      <td><span className="fw-semibold text-primary">$7,500.00</span></td>
                      <td><span className="badge bg-soft-success text-success">94.5%</span></td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold">May 2026</span></td>
                      <td>$2,900.00</td>
                      <td>$2,050.00</td>
                      <td>$1,300.00</td>
                      <td><span className="fw-semibold text-primary">$6,250.00</span></td>
                      <td><span className="badge bg-soft-success text-success">98.1%</span></td>
                    </tr>
                  </tbody>
                </table>
              ) : path.includes("patient-progress-report") ? (
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>Therapy Specialty</th>
                      <th>Total Sessions</th>
                      <th>Initial Score</th>
                      <th>Current Score</th>
                      <th>Clinical Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="fw-semibold text-dark">Alice Miller</span></td>
                      <td>CBT (Anxiety)</td>
                      <td>12 Sessions</td>
                      <td>21 (Severe)</td>
                      <td>8 (Mild)</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress w-100 me-2" style={{ height: "6px" }}>
                            <div className="progress-bar bg-success" style={{ width: "75%" }} />
                          </div>
                          <span className="fs-12 text-muted fw-semibold">75%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Mark Davis</span></td>
                      <td>Physical Therapy</td>
                      <td>8 Sessions</td>
                      <td>40% Mobility</td>
                      <td>75% Mobility</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress w-100 me-2" style={{ height: "6px" }}>
                            <div className="progress-bar bg-info" style={{ width: "87%" }} />
                          </div>
                          <span className="fs-12 text-muted fw-semibold">87%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Emma Wilson</span></td>
                      <td>Speech Therapy</td>
                      <td>15 Sessions</td>
                      <td>Moderate Dysphagia</td>
                      <td>Mild Dysphagia</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress w-100 me-2" style={{ height: "6px" }}>
                            <div className="progress-bar bg-success" style={{ width: "60%" }} />
                          </div>
                          <span className="fs-12 text-muted fw-semibold">60%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : path.includes("therapy-therapist-report") ? (
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Therapist Name</th>
                      <th>Specialty</th>
                      <th>Monthly Sessions</th>
                      <th>Utilization Rate</th>
                      <th>Client Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="fw-semibold text-dark">Dr. Jane Doe</span></td>
                      <td>CBT Therapy</td>
                      <td>45 Sessions</td>
                      <td>
                        <span className="badge bg-soft-success text-success">88%</span>
                      </td>
                      <td>⭐⭐⭐⭐⭐ (4.9)</td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Dr. John Smith</span></td>
                      <td>Physical Therapy</td>
                      <td>38 Sessions</td>
                      <td>
                        <span className="badge bg-soft-warning text-warning">76%</span>
                      </td>
                      <td>⭐⭐⭐⭐⭐ (4.7)</td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Dr. Sarah Jenkins</span></td>
                      <td>Speech Therapy</td>
                      <td>41 Sessions</td>
                      <td>
                        <span className="badge bg-soft-success text-success">82%</span>
                      </td>
                      <td>⭐⭐⭐⭐⭐ (4.8)</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="table table-nowrap mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Category Type</th>
                      <th>Booked</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Hours Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="fw-semibold text-dark">Cognitive Behavioral Therapy (CBT)</span></td>
                      <td>52</td>
                      <td>48</td>
                      <td>3</td>
                      <td>48 hrs</td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Physical Therapy</span></td>
                      <td>38</td>
                      <td>34</td>
                      <td>2</td>
                      <td>25.5 hrs</td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Speech Therapy</span></td>
                      <td>24</td>
                      <td>21</td>
                      <td>2</td>
                      <td>21 hrs</td>
                    </tr>
                    <tr>
                      <td><span className="fw-semibold text-dark">Occupational Therapy</span></td>
                      <td>10</td>
                      <td>9</td>
                      <td>1</td>
                      <td>9 hrs</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
