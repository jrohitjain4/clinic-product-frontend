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

  // Filters
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const tableData = useMemo(
    () => appointments.map((a, i) => appointmentToTableRow(a, i)),
    [appointments]
  );

  const filteredData = useMemo(() => {
    return tableData.filter((row) => {
      const matchPatient = filterPatient
        ? row.Patient.toLowerCase().includes(filterPatient.toLowerCase())
        : true;
      const matchDoctor = filterDoctor
        ? row.Doctor.toLowerCase().includes(filterDoctor.toLowerCase())
        : true;
      const matchStatus = filterStatus
        ? row.Status.toLowerCase() === filterStatus.toLowerCase()
        : true;
      const matchDate = filterDate
        ? row.Date_Time.includes(filterDate)
        : true;
      return matchPatient && matchDoctor && matchStatus && matchDate;
    });
  }, [tableData, filterPatient, filterDoctor, filterStatus, filterDate]);

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
            className="avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent"
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
                onClick={() => handlePrintAppointment(record._raw)}
              >
                <i className="ti ti-printer me-2" />
                Print Copy
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                onClick={() => handleDownloadAppointment(record._raw)}
              >
                <i className="ti ti-download me-2" />
                Download Copy
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
                <i className="ti ti-trash me-2" />
                Delete
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const handlePrintAppointment = (a: ClinicAppointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Appointment Copy - ${a.appointmentCode}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .details { margin-bottom: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: bold; color: #666; font-size: 14px; margin-bottom: 5px; }
            .value { font-size: 16px; margin-bottom: 15px; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #999; }
            @media print { .btn-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DocYori Appointment Copy</div>
            <div>Code: <strong>${a.appointmentCode}</strong></div>
          </div>
          <div class="details">
            <div>
              <div class="label">PATIENT DETAILS</div>
              <div class="value">${a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'N/A'}</div>
              <div class="label">DATE & TIME</div>
              <div class="value">${new Date(a.scheduledAt).toLocaleString()}</div>
            </div>
            <div>
              <div class="label">DOCTOR</div>
              <div class="value">Dr. ${a.doctor?.fullName || 'N/A'}</div>
              <div class="label">STATUS</div>
              <div class="value">${a.status}</div>
            </div>
          </div>
          <div class="label">REASON</div>
          <div class="value">${a.reason || 'Regular Checkup'}</div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} by DocYori Clinic Management System
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadAppointment = (a: ClinicAppointment) => {
    const content = `
      Appointment Copy
      ----------------
      Code: ${a.appointmentCode}
      Patient: ${a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'N/A'}
      Doctor: Dr. ${a.doctor?.fullName || 'N/A'}
      Date: ${new Date(a.scheduledAt).toLocaleString()}
      Status: ${a.status}
      Reason: ${a.reason}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment_${a.appointmentCode}.txt`;
    link.click();
  };

  const handleExportCSV = () => {
    const headers = ["Code", "Date", "Patient", "Doctor", "Status"];
    const csvData = filteredData.map(row => [
      row._raw.appointmentCode,
      row.Date_Time,
      row.Patient,
      row.Doctor,
      row.Status
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + csvData.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "appointments_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-semibold mb-0">Appointment</h4>
            </div>
            <div className="text-end d-flex align-items-center">
              <button
                className="btn btn-outline-primary btn-sm me-2 d-none d-md-inline-flex align-items-center"
                onClick={handleExportCSV}
              >
                <i className="ti ti-download me-1" /> Export CSV
              </button>
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
                onClick={() => reload()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters Row */}
          <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">

            <input
              type="text"
              className="form-control"
              style={{ maxWidth: 180 }}
              placeholder="Filter by Patient"
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
            />
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: 180 }}
              placeholder="Filter by Doctor"
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
            />
            <input
              type="date"
              className="form-control"
              style={{ maxWidth: 180 }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              className="form-select"
              style={{ maxWidth: 180 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Schedule">Schedule</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {(filterPatient || filterDoctor || filterStatus || filterDate) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setFilterPatient("");
                  setFilterDoctor("");
                  setFilterStatus("");
                  setFilterDate("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading appointments…</p>
            </div>
          ) : filteredData.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <h6 className="fw-bold">No appointments found</h6>
              <p className="text-muted mb-3">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={filteredData}
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
