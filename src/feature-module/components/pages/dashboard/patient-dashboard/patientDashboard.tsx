import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import SCol8Chart from "./chart/scol8Chart";
import SCol9Chart from "./chart/scol9Chart";
import SCol10Chart from "./chart/scol10Chart";
import Modals from "./modals/modals";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import { all_routes, doctorDetailsPath } from "../../../../routes/all_routes";

const PatientDashboard = () => {
  const { appointments } = useClinicAppointments();
  const { doctors } = useClinicDoctors();
  const { prescriptions } = usePrescriptions();
  const { invoices } = useClinicInvoices();

  const totalAppointments = appointments?.length || 0;
  const recentAppointments = appointments?.slice(0, 5) || [];

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        <div className="content pb-0">
          {/* Appointment Confirmation Alert */}
          <div className="alert alert-info border-info border-2 d-flex align-items-center mb-4 shadow-sm" role="alert">
            <i className="ti ti-info-circle fs-20 me-2"></i>
            <div>
              <span className="fw-bold">Notice:</span> Please contact the clinic owner to confirm your appointment and complete the payment process.
            </div>
          </div>
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-0">Patient Dashboard</h4>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link
                to="#"
                className="btn btn-primary d-inline-flex align-items-center"
                data-bs-toggle="offcanvas"
                data-bs-target="#new_appointment"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-4">
                    <span className="avatar bg-primary rounded-circle fs-20 d-inline-flex flex-shrink-0">
                      <i className="ti ti-calendar-heart" />
                    </span>
                    <div className="ms-2">
                      <p className="mb-1 text-truncate">Total Appointments</p>
                      <h3 className="fw-bold mb-0">{totalAppointments}</h3>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge fw-medium bg-success flex-shrink-0 me-2">
                      +95%
                    </span>
                    <p className="fs-13 mb-0">in last 7 Days </p>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-4">
                    <span className="avatar bg-danger rounded-circle fs-20 d-inline-flex flex-shrink-0">
                      <i className="ti ti-users" />
                    </span>
                    <div className="ms-2">
                      <p className="mb-1 text-truncate">Online Consultations</p>
                      <h3 className="fw-bold mb-0">36</h3>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge fw-medium bg-danger flex-shrink-0 me-2">
                      -15%
                    </span>
                    <p className="fs-13 mb-0">in last 7 Days</p>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <p className="mb-1 text-truncate">Blood Pressure</p>
                      <span className="badge fw-medium bg-success flex-shrink-0 me-2">
                        +95%
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <h3 className="fw-bold mb-0 me-1">89</h3>
                      <p className="mb-0">g/dl</p>
                    </div>
                  </div>
                  <div id="s-col-8" className="chart-set">
                    <SCol8Chart />
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill w-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <p className="mb-1 text-truncate">Heart Rate</p>
                      <span className="badge fw-medium bg-success flex-shrink-0 me-2">
                        +95%
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <h3 className="fw-bold mb-0 me-1">87</h3>
                      <p className="mb-0">bpm</p>
                    </div>
                  </div>
                  <div id="s-col-9" className="chart-set">
                    <SCol9Chart />
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row start */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">My Doctors</h5>
                </div>
                <div className="card-body">
                  {doctors.slice(0, 5).map((doctor, index) => (
                    <div className="d-flex align-items-center justify-content-between mb-3" key={doctor.id || index}>
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar me-2 flex-shrink-0">
                          <ImageWithBasePath
                            src={doctor.profileImage && (doctor.profileImage.startsWith('assets') || doctor.profileImage.startsWith('/uploads') || doctor.profileImage.startsWith('http')) ? doctor.profileImage : (doctor.profileImage ? `assets/img/doctors/${doctor.profileImage}` : "assets/img/doctors/doctor-01.jpg")}
                            alt="img"
                            className="rounded-circle"
                          />
                        </Link>
                        <div>
                          <h6 className="fs-14 mb-1 text-truncate">
                            <Link to="#" className="fw-semibold">
                              Dr. {doctor.fullName}
                            </Link>
                          </h6>
                          <p className="mb-0 fs-13 text-truncate">{doctor.designation?.name || doctor.department?.name || "Doctor"}</p>
                        </div>
                      </div>
                      <span className="badge fw-medium badge-soft-danger border border-danger flex-shrink-0">
                        Active
                      </span>
                    </div>
                  ))}
                  {doctors.length === 0 && (
                    <p className="text-center text-muted">No doctors found.</p>
                  )}
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Prescriptions</h5>
                </div>
                <div className="card-body">
                  <div className="overflow-auto">
                    {prescriptions.slice(0, 5).map((pres: any) => (
                      <div className="d-flex align-items-center justify-content-between mb-3" key={pres.id}>
                        <div className="d-flex align-items-center flex-shrink-0">
                          <Link
                            to={pres.doctorId ? doctorDetailsPath(pres.doctorId) : "#"}
                            className="avatar me-2 flex-shrink-0 bg-light rounded-circle text-dark border hover-border-primary"
                          >
                            {pres.doctor?.profileImage ? (
                              <ImageWithBasePath
                                src={pres.doctor.profileImage.startsWith('assets') || pres.doctor.profileImage.startsWith('/uploads') || pres.doctor.profileImage.startsWith('http') ? pres.doctor.profileImage : `assets/img/doctors/${pres.doctor.profileImage}`}
                                className="rounded-circle"
                                alt="img"
                              />
                            ) : (
                              <i className="ti ti-file-description fs-20" />
                            )}
                          </Link>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link to={all_routes.patientprescriptiondetails} className="fw-semibold">
                                {pres.prescriptionCode || pres.title || "Prescription"}
                              </Link>
                            </h6>
                            <p className="mb-1 fs-12 text-muted text-truncate">
                              By: <Link to={pres.doctorId ? doctorDetailsPath(pres.doctorId) : "#"} className="text-primary hover-underline">
                                {pres.doctor?.fullName ? `Dr. ${pres.doctor.fullName}` : "Doctor"}
                              </Link>
                            </p>
                            <p className="mb-0 fs-13 text-truncate">
                              {pres.dateLabel || pres.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <Link
                            to={all_routes.patientprescriptiondetails}
                            className="btn btn-outline-white d-inline-flex align-items-center shadow-sm me-2 p-1"
                          >
                            <i className="ti ti-eye" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-outline-white d-inline-flex align-items-center shadow-sm p-1"
                          >
                            <i className="ti ti-download" />
                          </Link>
                        </div>
                      </div>
                    ))}
                    {prescriptions.length === 0 && (
                      <p className="text-center text-muted">No prescriptions found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Recent Activity</h5>
                </div>
                <div className="card-body">
                  <div className="recent-activity">
                    <div className="d-flex align-items-center mb-3">
                      <span>
                        <i className="ti ti-point-filled fs-24 text-success" />
                      </span>
                      <div className="ms-2">
                        <p className="mb-1 text-truncate">
                          Appointment with
                          <Link to="#" className="fw-semibold">
                            Primary Care Physician
                          </Link>
                        </p>
                        <p className="fs-13 mb-0">24 Mar 2025, 10:55 AM</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span>
                        <i className="ti ti-point-filled fs-24 text-danger" />
                      </span>
                      <div className="ms-2">
                        <p className="mb-1 text-truncate">
                          <Link to="#" className="fw-semibold">
                            Blood Pressure Check
                          </Link>
                          (Home Monitoring)
                        </p>
                        <p className="fs-13 mb-0">24 Apr 2025, 11:00 AM</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span>
                        <i className="ti ti-point-filled fs-24 text-warning" />
                      </span>
                      <div className="ms-2">
                        <p className="mb-1">
                          <Link to="#" className="fw-semibold">
                            Physical Therapy Session
                          </Link>
                          Knee strengthening exercises
                        </p>
                        <p className="fs-13 mb-0">24 Apr 2025, 11:00 AM</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-0">
                      <span>
                        <i className="ti ti-point-filled fs-24 text-info" />
                      </span>
                      <div className="ms-2">
                        <p className="mb-1">
                          <Link to="#" className="fw-semibold">
                            Discuss dietary changes
                          </Link>
                          to manage blood sugar levels and weight
                        </p>
                        <p className="fs-13 mb-0">24 Apr 2025, 11:00 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
          {/* card start */}
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="fw-bold mb-0">Vitals</h5>
            </div>
            <div className="card-body">
              {/* row start */}
              <div className="row row-gap-3 row-cols-1 row-cols-xl-6 row-cols-md-3 row-cols-sm-2">
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/weight.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1">Weight</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">100</span>
                          Kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/rotate-left.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1">Height</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">154</span>
                          Cm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/user-cirlce-add.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1">BMI</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">19.2</span>
                          kg/cm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/driver-2.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1">Pulse</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">97%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/wind.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1">SPO2</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">98%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
                {/* col start */}
                <div className="col d-flex">
                  <div className="p-3 border shadow-sm flex-fill w-100 rounded-2">
                    <div className="d-flex align-items-center">
                      <span className="avatar bg-primary rounded-circle flex-shrink-0">
                        <ImageWithBasePath
                          src="./assets/img/icons/sun.svg"
                          alt="img"
                          className="w-auto h-auto"
                        />
                      </span>
                      <div className="ms-1">
                        <p className="mb-1 text-truncate">Temprature</p>
                        <p className="text-truncate">
                          <span className="fs-18 fw-bold text-dark">101</span> C
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* col end */}
              </div>
              {/* row end */}
            </div>
          </div>
          {/* card end */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Consultation By Department</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Monthly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div id="s-col-10" className="chart-set">
                    <SCol10Chart />
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Recent Transactions</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Weekly <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Monthly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Weekly
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Yearly
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {/* Table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table">
                      <tbody>
                        {invoices.slice(0, 5).map((inv: any) => {
                          const statusLabel = inv.paymentStatus === 'Paid'
                            ? 'Paid'
                            : inv.paymentStatus === 'Partial'
                              ? 'Partially Paid'
                              : 'Unpaid';
                          const statusClass = inv.paymentStatus === 'Paid'
                            ? 'badge-soft-success border-success text-success'
                            : inv.paymentStatus === 'Partial'
                              ? 'badge-soft-warning border-warning text-warning'
                              : 'badge-soft-danger border-danger text-danger';
                          const description = inv.items?.[0]?.description || inv.otherInfo || 'Consultation Fees';
                          return (
                            <tr className="border-white" key={inv.id}>
                              <td className="ps-0">
                                <div className="d-flex align-items-center">
                                  <span className="avatar me-2 bg-light rounded-circle text-dark border d-inline-flex align-items-center justify-content-center">
                                    <i className="ti ti-receipt fs-18" />
                                  </span>
                                  <div>
                                    <h6 className="fs-14 mb-1">
                                      <span className="fw-semibold">{inv.invoiceCode || `#${inv.id?.slice(0, 6).toUpperCase()}`}</span>
                                    </h6>
                                    <p className="mb-0 fs-13">{inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Patient'}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <h6 className="fs-14 fw-semibold">{description}</h6>
                                <p className="fs-13">${(inv.totalAmount ?? 0).toFixed(2)}</p>
                              </td>
                              <td className="pe-0 text-end">
                                <span className={`badge fs-13 py-1 ${statusClass} border rounded fw-medium`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-muted py-3">No transactions found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Table end */}
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
          {/* card start */}
          <div className="card shadow-sm flex-fill w-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0">Recent Appointments</h5>
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Weekly <i className="ti ti-chevron-down ms-1" />
                </Link>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="#">
                      Monthly
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      Weekly
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      Yearly
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="card-body">
              {/* Table start */}
              <div className="table-responsive table-nowrap">
                <table className="table border">
                  <thead className="thead-light">
                    <tr>
                      <th>Name &amp; Designation</th>
                      <th>Date &amp; Time</th>
                      <th>Consultation Fees</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((app: any) => (
                      <tr key={app.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <Link to="#" className="avatar me-2">
                              <ImageWithBasePath
                                src={app.doctor?.profileImage && (app.doctor.profileImage.startsWith('assets') || app.doctor.profileImage.startsWith('/uploads') || app.doctor.profileImage.startsWith('http')) ? app.doctor.profileImage : (app.doctor?.profileImage ? `assets/img/doctors/${app.doctor.profileImage}` : "assets/img/doctors/doctor-01.jpg")}
                                alt="img"
                                className="rounded-circle"
                              />
                            </Link>
                            <div>
                              <h6 className="fs-14 mb-1">
                                <Link to="#" className="fw-semibold">
                                  Dr. {app.doctorName || "Unknown"}
                                </Link>
                              </h6>
                              <p className="mb-0 fs-13">{app.doctorRole || "Doctor"}</p>
                            </div>
                          </div>
                        </td>
                        <td>{app.dateTimeLabel || app.scheduledAt}</td>
                        <td className="fw-semibold text-dark">${app.fees || 0}</td>
                        <td>{app.mode}</td>
                        <td>
                          <span className={`badge ${app.status === "Confirmed" ? "bg-success" :
                            app.status === "Cancelled" ? "bg-danger" :
                              app.status === "Checked In" ? "bg-warning" :
                                "bg-info"
                            } fw-medium`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to="#"
                            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1"
                          >
                            <i className="ti ti-calendar-plus" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="dropdown"
                            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu p-2">
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item d-flex align-items-center"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#edit_appointment"
                              >
                                <i className="ti ti-edit me-2" />
                                Edit
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item d-flex align-items-center"
                                data-bs-toggle="modal"
                                data-bs-target="#delete_modal"
                              >
                                <i className="ti ti-trash me-2" />
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                    {recentAppointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center">No recent appointments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Table end */}
            </div>
          </div>
          {/* card end */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Docyori
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
    </>
  );
};

export default PatientDashboard;
