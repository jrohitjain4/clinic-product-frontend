import { useMemo, useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import { patientToTableRow } from "../../../../../core/utils/patientForm";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import PatientsDeleteModal from "./patientsDeleteModal";
import { HasPermission } from "../../../../../core/utils/staffPermissions";

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
            <ImageWithBasePath
              src={record.Patient_img}
              alt="Patient"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="mb-1 fs-14 fw-semibold">
              <Link
                to={patientDetailsPath(record._raw.id)}
                className="text-dark"
              >
                {text}
              </Link>
            </h6>
            <span className="text-body fs-13 fw-normal d-block">
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
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link
            to={
              record._raw.primaryDoctor?.id
                ? all_routes.doctorsDetails.replace(
                  ":id",
                  record._raw.primaryDoctor.id
                )
                : "#"
            }
            className="avatar me-2 flex-shrink-0"
            onClick={(e) => {
              if (!record._raw.primaryDoctor?.id) e.preventDefault();
            }}
          >
            <ImageWithBasePath
              src={record.Doctor_img}
              alt="Doctor"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="fs-14 mb-1">
              <span className="fw-semibold">{text}</span>
            </h6>
            <p className="mb-0 fs-13">{record.Role}</p>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Doctor.localeCompare(b.Doctor),
    },
    {
      title: "Address",
      dataIndex: "Address",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Address.localeCompare(b.Address),
    },
    {
      title: "Last Visit",
      dataIndex: "Last_Visit",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Last_Visit.localeCompare(b.Last_Visit),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge rounded fs-13 fw-medium border ${text === "Available"
              ? "badge-soft-success text-success border-success"
              : "badge-soft-danger text-danger border-danger"
            }`}
        >
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center gap-1">
          <Link
            to={all_routes.appointments}
            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
          >
            <i className="ti ti-calendar-cog" />
          </Link>
          <div className="action-item">
            <button
              type="button"
              className="btn btn-link p-0 shadow-sm fs-14 border rounded-2"
              data-bs-toggle="dropdown"
              aria-label="Actions"
            >
              <i className="ti ti-dots-vertical" />
            </button>
            <ul className="dropdown-menu p-2">
              <HasPermission module="Patients" action="EDIT">
                <li>
                  <Link
                    to={editPatientPath(record._raw.id)}
                    className="dropdown-item d-flex align-items-center"
                  >
                    Edit
                  </Link>
                </li>
              </HasPermission>
              <li>
                <Link
                  to={patientDetailsPath(record._raw.id)}
                  className="dropdown-item d-flex align-items-center"
                >
                  View
                </Link>
              </li>
              <HasPermission module="Patients" action="DELETE">
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center"
                    data-bs-toggle="modal"
                    data-bs-target="#delete_patient_modal"
                    onClick={() => setSelected(record._raw)}
                  >
                    Delete
                  </button>
                </li>
              </HasPermission>
            </ul>
          </div>
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
              <h4 className="fw-bold mb-0">
                Patients List
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {loading ? "…" : patients.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center me-2">
                <span className="bg-light rounded p-1 d-flex align-items-center justify-content-center">
                  <i className="ti ti-list fs-14 text-dark" />
                </span>
                <Link
                  to={all_routes.patientsGrid}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div>
              <HasPermission module="Patients" action="CREATE">
                <Link
                  to={all_routes.createPatient}
                  className="btn btn-primary ms-2 fs-13 btn-md"
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
                onClick={reload}
              >
                Retry
              </button>
            </div>
          )}

          <div className="search-set mb-3">
            <div className="table-search d-flex align-items-center mb-0">
              <div className="search-input">
                <SearchInput value={searchText} onChange={setSearchText} />
              </div>
            </div>
          </div>

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
          <p className="text-dark mb-0">2025 © Preclinic, All Rights Reserved</p>
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
