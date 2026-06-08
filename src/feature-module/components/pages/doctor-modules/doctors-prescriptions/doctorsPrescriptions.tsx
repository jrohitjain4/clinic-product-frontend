import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useState } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import AddPrescriptionModal from "./AddPrescriptionModal";

const DoctorsPrescriptions = () => {
  const { prescriptions, loading, createPrescription, deletePrescription } = usePrescriptions();
  const [searchText, setSearchText] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;
    setDeleting(id);
    try {
      await deletePrescription(id);
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    {
      title: "Prescription ID",
      dataIndex: "prescriptionCode",
      render: (text: any, record: any) => (
        <Link to={`${all_routes.doctorsprescriptiondetails}?id=${record.id}`} className="fw-semibold text-primary">
          {text || "#---"}
        </Link>
      ),
      sorter: (a: any, b: any) => (a.prescriptionCode || "").localeCompare(b.prescriptionCode || ""),
    },
    {
      title: "Patient",
      dataIndex: "patient",
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md me-2 bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center">
            <span className="fw-bold text-primary fs-13">
              {`${record.patient?.firstName?.[0] || ""}${record.patient?.lastName?.[0] || ""}`}
            </span>
          </div>
          <div>
            <span className="fw-medium text-dark d-block">
              {`${record.patient?.firstName || ""} ${record.patient?.lastName || ""}`}
            </span>
            <span className="text-muted fs-12">{record.patient?.phone || ""}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Doctor",
      dataIndex: "doctor",
      render: (_: any, record: any) => (
        <span>{record.doctor?.fullName || "-"}</span>
      ),
    },
    {
      title: "Medicines",
      dataIndex: "medicines",
      render: (_: any, record: any) => (
        <span className="badge bg-info-subtle text-info-emphasis border border-info">
          {record.medicines?.length || 0} medicines
        </span>
      ),
    },
    {
      title: "Prescribed On",
      dataIndex: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "",
      render: (_: any, record: any) => (
        <div className="avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent">
          <Link to="#" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to={`${all_routes.doctorsprescriptiondetails}?id=${record.id}`}
                className="dropdown-item d-flex align-items-center"
              >
                <i className="ti ti-eye me-2" /> View
              </Link>
            </li>
            <li>
              <button
                className="dropdown-item d-flex align-items-center text-danger"
                onClick={() => handleDelete(record.id)}
                disabled={deleting === record.id}
              >
                <i className="ti ti-trash me-2" />
                {deleting === record.id ? "Deleting..." : "Delete"}
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = `
      <html>
        <head>
          <title>Prescriptions Master Report</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            body { padding: 40px; background: #fff; font-family: 'Inter', sans-serif; color: #334155; }
            .report-header { border-bottom: 3px solid #4f46e5; margin-bottom: 30px; padding-bottom: 20px; }
            th { background-color: #f8fafc !important; color: #475569 !important; text-transform: uppercase; font-size: 10px; font-weight: 700; border-bottom: 2px solid #e2e8f0 !important; }
            td { font-size: 12px; vertical-align: middle; border-bottom: 1px solid #f1f5f9 !important; }
            .clinic-name { color: #4f46e5; font-weight: 800; font-size: 22px; margin-bottom: 5px; }
            .badge-style { padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 10px; font-weight: 600; }
            @media print { body { padding: 20px; } .no-print { display: none; } @page { size: A4 landscape; margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="d-flex justify-content-between align-items-start mb-4 pb-4 border-bottom">
            <div class="d-flex gap-3">
              <div style="width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff;">
                <img src="/logo.png" alt="logo" style="max-height: 60px; max-width: 60px; object-fit: contain;">
              </div>
              <div>
                <h4 class="fw-bold mb-1 mt-1" style="color: #000; font-size: 20px;">DocYari Clinical Network</h4>
                <p class="mb-1 text-muted small"><i class="ti ti-map-pin"></i> 123 healthcare blvd, medical district, India</p>
                <h6 class="fw-bold fs-14 mb-0" style="color: #000;">Prescriptions Master Ledger</h6>
                <p class="text-primary small fw-bold mb-0">Total Records: ${prescriptions.length}</p>
              </div>
            </div>
            <div class="text-end">
              <span class="badge bg-white text-primary border border-primary-subtle fw-bold px-3 py-2 mb-2" style="font-size: 11px; border-radius: 4px;">
                PRESCRIPTION_LEDGER_${new Date().getFullYear()}
              </span>
              <div class="text-muted small mt-1">
                <div class="mb-1 text-dark"><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div class="text-dark"><strong>Scope:</strong> Practice Wide</div>
              </div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Patient Name</th>
                <th>Prescribing Doctor</th>
                <th>Medicines</th>
                <th>Prescribed Date</th>
              </tr>
            </thead>
            <tbody>
              ${prescriptions.map(p => `
                <tr>
                  <td class="fw-bold text-primary">${p.prescriptionCode || '#---'}</td>
                  <td class="fw-bold text-dark">${p.patient?.firstName} ${p.patient?.lastName}</td>
                  <td>${p.doctor?.fullName || '-'}</td>
                  <td><span class="badge-style">${p.medicines?.length || 0} Meds</span></td>
                  <td>${new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="mt-5 pt-4 text-center border-top text-muted small">
            <p>Confidentially Disclaimer: This document contains protected health information. Unauthorized access is prohibited.</p>
            <p>&copy; 2025 DocYari. All Rights Reserved.</p>
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Prescriptions Ledger</h4>
            </div>
            <div className="text-end d-flex gap-2">
              <button
                className="btn btn-primary btn-md d-flex align-items-center"
                onClick={() => setShowModal(true)}
              >
                Add Prescription <i className="ti ti-plus ms-2" /></button>
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2 shadow-sm">
                  <li><button className="dropdown-item d-flex align-items-center" onClick={handleDownloadPDF}><i className="ti ti-file-text me-2" /> Download as PDF</button></li>
                  <li><button className="dropdown-item d-flex align-items-center" onClick={() => { }}><i className="ti ti-table me-2" /> Download as Excel</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <div className="search-set">

            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={prescriptions}
                Selection={false}
                searchText={searchText}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddPrescriptionModal
          onClose={() => setShowModal(false)}
          onSubmit={async (data: Record<string, any>) => {
            await createPrescription(data);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

export default DoctorsPrescriptions;
