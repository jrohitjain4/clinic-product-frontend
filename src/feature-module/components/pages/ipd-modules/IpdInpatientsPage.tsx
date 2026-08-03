import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import Datatable from "../../../../core/common/dataTable";
import { useNavigate } from "react-router-dom";
import IpdViewDetailsModal from "./IpdViewDetailsModal";
import { IconFormControl } from "../../../../core/common/form-fields";

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewAdmission, setSelectedViewAdmission] = useState<any>(null);
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

  const tableData = useMemo(() => {
    return filteredInpatients.map((adm, idx) => {
      const stayDays = Math.max(
        1,
        Math.ceil(
          (new Date().getTime() - new Date(adm.admissionDate).getTime()) /
            (1000 * 3600 * 24)
        )
      );

      return {
        key: adm.id,
        sr: idx + 1,
        admissionCode: adm.admissionCode,
        patientName: getPatientName(adm.patient),
        patientMeta: `UHID: ${adm.patient?.patientCode || "—"} | ${adm.patient?.phone || "—"}`,
        doctorName: adm.doctor?.fullName || "Unassigned",
        wardName: adm.ward?.wardName || "Not Assigned",
        admissionDate: new Date(adm.admissionDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }),
        stayDuration: `${stayDays} ${stayDays === 1 ? "Day" : "Days"}`,
        dueAmount: adm.dueAmount,
        _raw: adm,
      };
    });
  }, [filteredInpatients]);

  const columns = useMemo(() => [
    {
      title: "Sr.",
      dataIndex: "sr",
      width: 60,
      sorter: (a: any, b: any) => a.sr - b.sr,
    },
    {
      title: "Admission Code",
      dataIndex: "admissionCode",
      render: (text: string) => (
        <span
          className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
          style={{
            backgroundColor: "#e2e8f0",
            color: "#1e293b",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          <i className="ti ti-hash fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.admissionCode.localeCompare(b.admissionCode),
    },
    {
      title: "Patient Details",
      dataIndex: "patientName",
      render: (text: string, record: any) => (
        <div className="lh-1">
          <h6 className="mb-1 fs-14 fw-semibold text-dark">{text}</h6>
          <span className="text-muted fs-12 fw-normal d-block mt-1">
            {record.patientMeta}
          </span>
        </div>
      ),
      sorter: (a: any, b: any) => a.patientName.localeCompare(b.patientName),
    },
    {
      title: "Primary Doctor",
      dataIndex: "doctorName",
      render: (text: string) => (
        <span className="fw-semibold text-primary fs-13">Dr. {text}</span>
      ),
      sorter: (a: any, b: any) => a.doctorName.localeCompare(b.doctorName),
    },
    {
      title: "Assigned Ward",
      dataIndex: "wardName",
      render: (text: string) => (
        <span
          className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
          style={{
            backgroundColor: "#e0f2fe",
            color: "#2563eb",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          <i className="ti ti-bed fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.wardName.localeCompare(b.wardName),
    },
    {
      title: "Admission Date",
      dataIndex: "admissionDate",
      sorter: (a: any, b: any) => a.admissionDate.localeCompare(b.admissionDate),
    },
    {
      title: "Stay Duration",
      dataIndex: "stayDuration",
      render: (text: string) => (
        <span className="badge bg-soft-success text-success fw-bold px-2 py-1 fs-12">
          <i className="ti ti-point me-1" /> {text}
        </span>
      ),
      sorter: (a: any, b: any) => parseFloat(a.stayDuration) - parseFloat(b.stayDuration),
    },
    {
      title: "Outstanding Balance",
      dataIndex: "dueAmount",
      render: (val: number) => (
        <span className={`fw-bold fs-14 ${val > 0 ? "text-danger" : "text-success"}`}>
          {val > 0 ? `₹${val.toLocaleString("en-IN")}` : "₹0"}
        </span>
      ),
      sorter: (a: any, b: any) => a.dueAmount - b.dueAmount,
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 140,
      align: "center" as const,
      render: (_: unknown, record: any) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="View Full IPD Details"
            onClick={() => {
              setSelectedViewAdmission(record._raw);
              setShowViewModal(true);
            }}
          >
            <i className="ti ti-eye fs-18" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-success p-1"
            title="Process Discharge & Settle"
            onClick={() => navigate("/ipd/discharge")}
          >
            <i className="ti ti-user-check fs-18" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View & Add Invoice Charges"
            onClick={() => navigate("/ipd/billings", { state: { admissionId: record.key, autoOpenInvoice: true } })}
          >
            <i className="ti ti-file-invoice fs-18" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="Raise IPD Charge & Add Invoice"
            onClick={() => navigate("/ipd/billings", { state: { admissionId: record.key, autoRaise: true } })}
          >
            <i className="ti ti-plus fs-18" />
          </button>
        </div>
      ),
    },
  ], [navigate]);

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
            <IconFormControl
              fieldLabel="search"
              type="text"
              placeholder="Search active inpatients by name, UHID, or admission code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Inpatients Table */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="text-muted mt-2">Loading active inpatients...</p>
              </div>
            ) : filteredInpatients.length === 0 ? (
              <div className="text-center py-5">
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
              <div className="table-responsive">
                <Datatable
                  columns={columns}
                  dataSource={tableData}
                  Selection={false}
                  searchText=""
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW IPD DETAILS MODAL */}
      <IpdViewDetailsModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        admission={selectedViewAdmission}
      />

      <Footer />
    </div>
  );
};

export default IpdInpatientsPage;
