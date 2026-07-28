import React from "react";
import Footer from "../../../../core/common/footer/footer";
import { IconFormControl } from "../../../../core/common/form-fields";

interface IpdGenericPageProps {
  title: string;
  subtitle: string;
  moduleType: 
    | "patient" 
    | "admission" 
    | "inpatient" 
    | "discharge" 
    | "ward" 
    | "billing" 
    | "doctor" 
    | "nurse" 
    | "treatment" 
    | "price" 
    | "report";
}

const IpdGenericPage: React.FC<IpdGenericPageProps> = ({ title, subtitle, moduleType }) => {
  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-0">{title}</h3>
            <p className="text-muted fs-13 mb-0">{subtitle}</p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            {moduleType === "price" && (
              <button className="btn btn-primary btn-sm">
                <i className="ti ti-device-floppy me-1" /> Save Price Settings
              </button>
            )}
            {moduleType === "admission" && (
              <button className="btn btn-primary btn-sm">
                <i className="ti ti-plus me-1" /> New IPD Admission
              </button>
            )}
            {moduleType === "ward" && (
              <button className="btn btn-primary btn-sm">
                <i className="ti ti-plus me-1" /> Add New Ward / Bed
              </button>
            )}
            {moduleType === "treatment" && (
              <button className="btn btn-primary btn-sm">
                <i className="ti ti-plus me-1" /> Add Treatment / Package
              </button>
            )}
            {moduleType !== "price" && moduleType !== "admission" && moduleType !== "ward" && moduleType !== "treatment" && (
              <button className="btn btn-outline-primary btn-sm">
                <i className="ti ti-refresh me-1" /> Refresh
              </button>
            )}
          </div>
        </div>

        {/* Content based on moduleType */}
        {moduleType === "price" && (
          <div className="row">
            <div className="col-lg-8 col-xl-7">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom">
                  <h5 className="card-title mb-0 fw-bold">Admission & Fee Configuration</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Admission Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number" 
                        defaultValue={1000} 
                        placeholder="Enter base admission fee" 
                      />
                      <small className="text-muted">Charge applied automatically when initiating a new IPD admission.</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Required Advance Amount at Admission (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number" 
                        defaultValue={5000} 
                        placeholder="Enter advance amount required at admission time" 
                      />
                      <small className="text-muted">Admission k time minimum advance amount kitna hoga deposit ke liye.</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Daily Doctor Visit Charge (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number" 
                        defaultValue={500} 
                        placeholder="Daily consultation charge per round" 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Daily Nursing & Care Charge (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number" 
                        defaultValue={300} 
                        placeholder="Daily nursing charge per bed" 
                      />
                    </div>

                    <div className="pt-3 border-top d-flex gap-2">
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                      <button type="reset" className="btn btn-light">Reset</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-xl-5">
              <div className="card border-0 shadow-sm bg-soft-primary border-primary">
                <div className="card-body">
                  <h6 className="fw-bold text-primary mb-2"><i className="ti ti-info-circle me-1" /> About Price Management</h6>
                  <p className="fs-13 text-secondary mb-2">
                    This section allows administrative control over all default charges for In-Patient Department admissions.
                  </p>
                  <ul className="fs-13 text-secondary ps-3 mb-0">
                    <li>Set initial <strong>Admission Fee</strong></li>
                    <li>Specify <strong>Admission Time Advance Deposit</strong></li>
                    <li>Configure per-day Doctor & Nursing fees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {moduleType !== "price" && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-bold">{title} Overview</h5>
              <div className="d-flex align-items-center gap-2">
                <IconFormControl fieldLabel="search" type="text" className="form-control-sm" placeholder="Search..." style={{ width: "200px" }} />
                <span className="badge bg-soft-info text-info">Active Module</span>
              </div>
            </div>
            <div className="card-body p-4 text-center py-5">
              <div className="avatar avatar-xxl bg-soft-primary text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: "70px", height: "70px" }}>
                <i className="ti ti-building-hospital fs-32" />
              </div>
              <h4 className="fw-bold mb-2">{title} Management</h4>
              <p className="text-muted fs-14 max-w-500 mx-auto mb-4">
                {subtitle} — This module is active and ready in the IPD Admin panel.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-primary btn-sm"><i className="ti ti-plus me-1" /> Add Record</button>
                <button className="btn btn-outline-secondary btn-sm"><i className="ti ti-file-export me-1" /> Export Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default IpdGenericPage;
