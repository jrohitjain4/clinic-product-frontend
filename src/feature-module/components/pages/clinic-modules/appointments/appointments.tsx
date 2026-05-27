import { useMemo, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import type { ClinicAppointment } from "../../../../../core/types/clinicAppointment";
import {
  appointmentToTableRow,
  statusBadgeClass,
} from "../../../../../core/utils/appointmentForm";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import AppointmentsModals from "./appointmentsModals";

const Appointments = () => {
  const { appointments, loading, error, refetch, reload } = useClinicAppointments();
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<ClinicAppointment | null>(null);

  const tableData = useMemo(
    () => appointments.map((a, i) => appointmentToTableRow(a, i)),
    [appointments]
  );

  const patientPath = (id: string) =>
    all_routes.patientDetails.replace(":id", id);
  const doctorPath = (id: string) =>
    all_routes.doctorsDetails.replace(":id", id);
  const editPath = (id: string) =>
    all_routes.editAppointment.replace(":id", id);

  const openView = (a: ClinicAppointment) => {
    setSelected(a);
  };

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link to={patientPath(record._raw.patientId)} className="avatar avatar-md me-2">
            <ImageWithBasePath
              src={record.Patient_Image}
              alt="Patient"
              className="rounded-circle"
            />
          </Link>
          <Link to={patientPath(record._raw.patientId)} className="text-dark fw-semibold">
            {text}
            <span className="text-body fs-13 fw-normal d-block">{record.Phone}</span>
          </Link>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link to={doctorPath(record._raw.doctorId)} className="avatar me-2 flex-shrink-0">
            <ImageWithBasePath
              src={record.Doctor_Image}
              alt="Doctor"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="fs-14 mb-1 text-truncate">
              <Link to={doctorPath(record._raw.doctorId)} className="fw-semibold">
                {text}
              </Link>
            </h6>
            <p className="mb-0 fs-13 text-truncate">{record.role}</p>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Doctor.localeCompare(b.Doctor),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Mode.localeCompare(b.Mode),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`fs-13 badge rounded fw-medium ${statusBadgeClass(text)}`}>
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="action-item">
          <button
            type="button"
            className="btn btn-link p-0 text-dark"
            data-bs-toggle="dropdown"
            aria-label="Actions"
          >
            <i className="ti ti-dots-vertical" />
          </button>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to={editPath(record._raw.id)}
                className="dropdown-item d-flex align-items-center"
              >
                Edit
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="offcanvas"
                data-bs-target="#view_details"
                onClick={() => openView(record._raw)}
              >
                View
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_appointment_modal"
                onClick={() => setSelected(record._raw)}
              >
                Delete
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
              <h4 className="fw-semibold mb-0">Appointment</h4>
            </div>
            <div className="text-end d-flex">
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center me-2">
                <span className="bg-light rounded p-1 d-flex align-items-center justify-content-center">
                  <i className="ti ti-list fs-14 text-dark" />
                </span>
                <Link
                  to={all_routes.appointmentCalendar}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-calendar-event fs-14 text-body" />
                </Link>
              </div>
              <Link
                to={all_routes.newAppointment}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex justify-content-between mb-3">
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
              <p className="text-muted mt-2 mb-0">Loading appointments…</p>
            </div>
          ) : appointments.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <h6 className="fw-bold">No appointments yet</h6>
              <p className="text-muted mb-3">Schedule your first appointment.</p>
              <Link to={all_routes.newAppointment} className="btn btn-primary">
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
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
      </div>

      <AppointmentsModals
        selected={selected}
        onClear={() => setSelected(null)}
        onDeleted={refetch}
      />
    </>
  );
};

export default Appointments;
