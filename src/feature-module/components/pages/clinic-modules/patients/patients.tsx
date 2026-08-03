import { useMemo, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import { patientToTableRow } from "../../../../../core/utils/patientForm";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import PatientsDeleteModal from "./patientsDeleteModal";
import { HasPermission } from "../../../../../core/utils/staffPermissions";

const getInitial = (value?: string) =>
  (value || "").trim().charAt(0).toUpperCase() || "?";

const Patients = () => {
  const { patients, loading, error, refetch, reload } = useClinicPatients();
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<ClinicPatient | null>(null);

  const tableData = useMemo(
    () => patients.map((p, i) => patientToTableRow(p, i)),
    [patients]
  );

  const patientDetailsPath = (id: string) =>
    all_routes.patientDetails.replace(":id", id);

  const editPatientPath = (id: string) =>
    all_routes.editPatient.replace(":id", id);

  const columns = [
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link
            to={patientDetailsPath(record._raw.id)}
            className="avatar me-2"
          >
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                fontSize: "16px",
              }}
            >
              {getInitial(text)}
            </span>
          </Link>
          <div className="lh-1">
            <h6 className="mb-1 fs-14 fw-semibold">
              <Link
                to={patientDetailsPath(record._raw.id)}
                className="text-dark"
              >
                {text}
              </Link>
            </h6>
            <span className="text-muted fs-12 fw-normal d-block mt-1">
              {record.Gender}
            </span>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Phone.localeCompare(b.Phone),
    },
    {
      title: "Address",
      dataIndex: "Address",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Address.localeCompare(b.Address),
    },
    {
      title: "Registration Date",
      dataIndex: "Registration_Date",
      render: (text: string) => (
        <div className="d-flex align-items-center fw-semibold text-dark fs-13">
          <i className="ti ti-calendar-event me-2 text-primary fs-16" />
          {text || "—"}
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Registration_Date.localeCompare(b.Registration_Date),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        const isAvailable = text === "Available";
        return (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: isAvailable ? "#e6f8ef" : "#fdeded",
              color: isAvailable ? "#198754" : "#dc3545",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className={`${isAvailable ? "ti ti-circle-check" : "ti ti-circle-x"} fs-14`} />
            {text}
          </span>
        );
      },
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <Link
            to={patientDetailsPath(record._raw.id)}
            className="text-primary p-1"
            title="View Details"
          >
            <i className="ti ti-eye fs-18" />
          </Link>
          <HasPermission module="Patients" action="EDIT">
            <Link
              to={editPatientPath(record._raw.id)}
              className="text-info p-1"
              title="Update Patient"
            >
              <i className="ti ti-edit fs-18" />
            </Link>
          </HasPermission>
          <HasPermission module="Patients" action="DELETE">
            <button
              type="button"
              className="bg-transparent border-0 text-danger p-1"
              data-bs-toggle="modal"
              data-bs-target="#delete_patient_modal"
              onClick={() => setSelected(record._raw)}
              title="Delete"
            >
              <i className="ti ti-trash fs-18" />
            </button>
          </HasPermission>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="d-flex align-items-center flex-wrap gap-2 flex-grow-1 min-w-0">
              <h4 className="fw-bold mb-0 text-nowrap">
                Patients List
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {loading ? "…" : patients.length}
                </span>
              </h4>
              <div className="table-search mb-0" style={{ maxWidth: 280, width: "100%" }}>
                <div className="search-input w-100">
                  <SearchInput value={searchText} onChange={setSearchText} />
                </div>
              </div>
            </div>
            <div className="text-end d-flex align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={all_routes.patients}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", borderRadius: "8px" }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={all_routes.patientsGrid}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", borderRadius: "8px" }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
              <HasPermission module="Patients" action="CREATE">
                <Link
                  to={all_routes.createPatient}
                  className="btn btn-primary fs-13 btn-md"
                >
                  <i className="ti ti-plus me-1" />
                  New Patient
                </Link>
              </HasPermission>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => reload()}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading patients…</p>
            </div>
          ) : patients.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-users fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No patients yet</h6>
              <p className="text-muted mb-3">Add your first patient.</p>
              <HasPermission module="Patients" action="CREATE">
                <Link to={all_routes.createPatient} className="btn btn-primary">
                  <i className="ti ti-plus me-1" />
                  New Patient
                </Link>
              </HasPermission>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={false}
                searchText={searchText}
              />
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 © Docyari, All Rights Reserved</p>
        </div>
      </div>

      <PatientsDeleteModal
        patient={selected}
        onClear={() => setSelected(null)}
        onDeleted={refetch}
      />
    </>
  );
};

export default Patients;
