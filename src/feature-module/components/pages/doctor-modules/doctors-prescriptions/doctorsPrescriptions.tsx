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
        <div className="action-item">
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Prescriptions</h4>
            </div>
            <div className="text-end d-flex gap-2">
              <button
                className="btn btn-primary btn-md d-flex align-items-center"
                onClick={() => setShowModal(true)}
              >
                <i className="ti ti-plus me-1" /> Add Prescription
              </button>
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li><Link className="dropdown-item" to="#">Download as PDF</Link></li>
                  <li><Link className="dropdown-item" to="#">Download as Excel</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <div className="search-set">
              <div className="search-input">
                <SearchInput value={searchText} onChange={setSearchText} />
              </div>
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
