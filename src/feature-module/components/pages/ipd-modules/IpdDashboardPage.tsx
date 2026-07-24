import React from "react";
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import Footer from "../../../../core/common/footer/footer";

const IpdDashboardPage: React.FC = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-0">IPD Dashboard</h3>
            <p className="text-muted fs-13 mb-0">In-Patient Department Overview & Real-time Bed Status</p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <Link to={all_routes.ipdAdmissions} className="btn btn-primary btn-sm">
              <i className="ti ti-plus me-1" /> New Admission
            </Link>
            <Link to={all_routes.ipdWardManagement} className="btn btn-outline-secondary btn-sm">
              <i className="ti ti-building-hospital me-1" /> Manage Wards
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block">Active Inpatients</span>
                    <h3 className="mb-0 mt-1 fw-bold text-dark">18</h3>
                    <span className="badge bg-soft-success text-success mt-2 fs-11">
                      <i className="ti ti-arrow-up-right me-1" /> +12% this week
                    </span>
                  </div>
                  <div className="avatar avatar-lg rounded bg-soft-primary text-primary d-flex align-items-center justify-content-center">
                    <i className="ti ti-bed fs-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block">Bed Occupancy Rate</span>
                    <h3 className="mb-0 mt-1 fw-bold text-dark">72%</h3>
                    <span className="text-muted fs-11 mt-2 d-block">18 / 25 Beds Occupied</span>
                  </div>
                  <div className="avatar avatar-lg rounded bg-soft-warning text-warning d-flex align-items-center justify-content-center">
                    <i className="ti ti-building-community fs-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block">Discharges Today</span>
                    <h3 className="mb-0 mt-1 fw-bold text-dark">4</h3>
                    <span className="badge bg-soft-info text-info mt-2 fs-11">
                      <i className="ti ti-check me-1" /> 2 Pending Settlement
                    </span>
                  </div>
                  <div className="avatar avatar-lg rounded bg-soft-info text-info d-flex align-items-center justify-content-center">
                    <i className="ti ti-door-exit fs-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 d-flex">
            <div className="card flex-fill bg-white border-0 shadow-sm rounded-3">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium d-block">Total IPD Revenue</span>
                    <h3 className="mb-0 mt-1 fw-bold text-dark">₹1,45,200</h3>
                    <span className="text-success fs-11 mt-2 d-block">
                      <i className="ti ti-trending-up me-1" /> ₹35,000 Advance Collected
                    </span>
                  </div>
                  <div className="avatar avatar-lg rounded bg-soft-success text-success d-flex align-items-center justify-content-center">
                    <i className="ti ti-coin fs-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links & Status */}
        <div className="row mt-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0 fw-bold">Recent Admissions</h5>
                <Link to={all_routes.ipdAdmissions} className="btn btn-link btn-sm text-primary p-0">View All</Link>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Admission ID</th>
                        <th>Patient Name</th>
                        <th>Ward / Bed</th>
                        <th>Consultant Doctor</th>
                        <th>Admitted Date</th>
                        <th>Advance Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="fw-semibold text-primary">IPD-2026-001</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs rounded-circle bg-soft-primary me-2 text-primary fw-bold">RP</span>
                            <div>
                              <span className="fw-semibold d-block">Ramesh Patel</span>
                              <span className="text-muted fs-11">Male, 45 yrs</span>
                            </div>
                          </div>
                        </td>
                        <td>ICU / Bed-02</td>
                        <td>Dr. Ananya Sharma</td>
                        <td>22 Jul 2026</td>
                        <td>₹10,000</td>
                        <td><span className="badge bg-success">Admitted</span></td>
                      </tr>
                      <tr>
                        <td><span className="fw-semibold text-primary">IPD-2026-002</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs rounded-circle bg-soft-info me-2 text-info fw-bold">SG</span>
                            <div>
                              <span className="fw-semibold d-block">Sunita Gupta</span>
                              <span className="text-muted fs-11">Female, 52 yrs</span>
                            </div>
                          </div>
                        </td>
                        <td>Deluxe Ward / Bed-101</td>
                        <td>Dr. Vikram Malhotra</td>
                        <td>21 Jul 2026</td>
                        <td>₹15,000</td>
                        <td><span className="badge bg-success">Admitted</span></td>
                      </tr>
                      <tr>
                        <td><span className="fw-semibold text-primary">IPD-2026-003</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs rounded-circle bg-soft-warning me-2 text-warning fw-bold">AK</span>
                            <div>
                              <span className="fw-semibold d-block">Amit Kumar</span>
                              <span className="text-muted fs-11">Male, 34 yrs</span>
                            </div>
                          </div>
                        </td>
                        <td>General Male / Bed-05</td>
                        <td>Dr. Suresh Mehta</td>
                        <td>20 Jul 2026</td>
                        <td>₹5,000</td>
                        <td><span className="badge bg-info">Discharge Pending</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom">
                <h5 className="card-title mb-0 fw-bold">Bed Availability Summary</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-13 fw-semibold">General Ward (10 Beds)</span>
                    <span className="fs-13 text-muted">8 Occupied</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: "80%" }} />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-13 fw-semibold">ICU / CCU (5 Beds)</span>
                    <span className="fs-13 text-muted">4 Occupied</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-danger" role="progressbar" style={{ width: "80%" }} />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-13 fw-semibold">Semi-Private Ward (6 Beds)</span>
                    <span className="fs-13 text-muted">4 Occupied</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: "66%" }} />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-13 fw-semibold">Deluxe Private (4 Beds)</span>
                    <span className="fs-13 text-muted">2 Occupied</span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: "50%" }} />
                  </div>
                </div>

                <div className="mt-4 pt-2 border-top d-grid">
                  <Link to={all_routes.ipdWardManagement} className="btn btn-outline-primary btn-sm">
                    View Full Bed Map
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default IpdDashboardPage;
