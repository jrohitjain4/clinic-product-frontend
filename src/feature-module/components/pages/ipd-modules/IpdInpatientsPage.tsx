import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  patientCode?: string;
  phone?: string;
}

interface Doctor {
  id: string;
  fullName: string;
}

interface Ward {
  id: string;
  wardName: string;
  wardType: string;
}

interface Admission {
  id: string;
  admissionCode: string;
  admissionType: string;
  patient: Patient;
  doctor?: Doctor | null;
  ward?: Ward | null;
  admissionDate: string;
  diagnosis?: string | null;
  status: string; // Admitted
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  paymentStatus: string;
}

const getPatientName = (p?: Patient | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

const IpdInpatientsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch Inpatients
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(apiUrl("/api/ipd/admissions"), { headers });
      if (res.ok) {
        const data = await res.json();
        const admittedList = Array.isArray(data)
          ? data.filter((item: Admission) => item.status === "Admitted")
          : [];
        setAdmissions(admittedList);
      }
    } catch (err: any) {
      toast.error("Failed to load active inpatients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered List
  const filteredInpatients = useMemo(() => {
    return admissions.filter((adm) => {
      const pName = getPatientName(adm.patient);
      const aCode = adm.admissionCode || "";
      const pCode = adm.patient?.patientCode || "";

      return (
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [admissions, searchQuery]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div>
            <h3 className="page-title mb-0">Active Inpatients Directory</h3>
            <p className="text-muted fs-13 mb-0">
              Live Inpatient Bed Roster, Patient Health Status & Direct Discharge Shortcuts
            </p>
          </div>

          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate("/ipd/discharge")}
            >
              <i className="ti ti-user-check me-1" /> Discharge Management
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/ipd/admissions")}
            >
              <i className="ti ti-plus me-1" /> + New Patient Admission
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm border-start border-4 border-primary">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL ACTIVE INPATIENTS</span>
                    <h3 className="fw-bold mb-0 text-primary">{admissions.length} Patients</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle">
                    <i className="ti ti-bed fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm border-start border-4 border-info">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">CURRENT TOTAL RUNNING CHARGES</span>
                    <h3 className="fw-bold mb-0 text-dark">
                      ₹
                      {admissions
                        .reduce((sum, a) => sum + (a.totalAmount || 0), 0)
                        .toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-info text-info rounded-circle">
                    <i className="ti ti-receipt fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm border-start border-4 border-warning">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL OUTSTANDING BALANCE</span>
                    <h3 className="fw-bold mb-0 text-danger">
                      ₹
                      {admissions
                        .reduce((sum, a) => sum + (a.dueAmount || 0), 0)
                        .toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-warning text-warning rounded-circle">
                    <i className="ti ti-wallet fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search active inpatients by name, UHID, or admission code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Inpatients Cards Grid */}
        <div className="row g-3">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2">Loading active inpatients...</p>
            </div>
          ) : filteredInpatients.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="ti ti-bed fs-40 text-muted mb-2 d-block" />
              <h5 className="fw-bold">No Active Inpatients Currently Admitted</h5>
              <p className="text-muted fs-13 mb-3">
                All admitted patients have been discharged or no records match your search.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/ipd/admissions")}
              >
                + Admit New Patient
              </button>
            </div>
          ) : (
            filteredInpatients.map((adm) => {
              const stayDays = Math.max(
                1,
                Math.ceil(
                  (new Date().getTime() - new Date(adm.admissionDate).getTime()) /
                    (1000 * 3600 * 24)
                )
              );

              return (
                <div className="col-xl-4 col-md-6" key={adm.id}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                      <span className="badge bg-primary fs-12 px-2 py-1">
                        Code: {adm.admissionCode}
                      </span>
                      <span className="badge bg-soft-success text-success fw-bold">
                        <i className="ti ti-point me-1" /> Admitted ({stayDays} {stayDays === 1 ? "Day" : "Days"})
                      </span>
                    </div>

                    <div className="card-body">
                      <h5 className="fw-bold text-dark mb-1">{getPatientName(adm.patient)}</h5>
                      <small className="text-muted d-block mb-3">
                        UHID: {adm.patient?.patientCode || "—"} | Phone: {adm.patient?.phone || "—"}
                      </small>

                      <div className="p-3 bg-light rounded mb-3 fs-13">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Assigned Ward:</span>
                          <strong className="text-info">{adm.ward?.wardName || "Ward"}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Primary Doctor:</span>
                          <strong className="text-dark">{adm.doctor?.fullName || "Doctor"}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Admission Date:</span>
                          <span className="text-dark">
                            {new Date(adm.admissionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <div>
                          <small className="text-muted d-block">Outstanding Balance</small>
                          <strong className="text-danger fs-16">
                            ₹{adm.dueAmount.toLocaleString("en-IN")}
                          </strong>
                        </div>

                        <button
                          className="btn btn-sm btn-primary fw-bold"
                          onClick={() => navigate("/ipd/discharge")}
                        >
                          <i className="ti ti-user-check me-1" /> Settle & Discharge
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default IpdInpatientsPage;
