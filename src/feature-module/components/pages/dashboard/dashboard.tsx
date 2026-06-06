import { Link, Navigate } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";
import { useState } from "react";
import Chart from "react-apexcharts";
import SCol2Chart from "./chats/scol2";
import SCol3Chart from "./chats/scol3";
import SCol4Chart from "./chats/scol4";
import SCol19Chart from "./chats/scol19";
import CircleChart from "./chats/circleChart";
import { Calendar, type CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import { useDashboardStats } from "../../../../core/hooks/useDashboardStats";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { stats } = useDashboardStats();
  const { staffs } = useClinicStaff();
  const [sColChart] = useState<any>({
    chart: {
      width: 80,
      height: 54,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 3,
        endingShape: "rounded",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: { enabled: false },
    colors: [
      "#2E37A4", // default color
      "#2E37A4",
      "#2E37A4",
      "#2E37A4",
      "#FF955A", // highlighted bar
      "#2E37A4",
      "#2E37A4",
    ],
    fill: {
      type: "solid",
    },
  });

  const series = [
    {
      name: "Data",
      data: [40, 15, 60, 15, 90, 20, 70], // y-values
    },
  ];


  if (user?.role === 'PATIENT') {
    return <Navigate to="/patient/patient-dashboard" replace />;
  }
  if (user?.role === 'DOCTOR') {
    return <Navigate to="/doctor/doctor-dashboard" replace />;
  }

  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    console.log(value.format("YYYY-MM-DD"), mode);
  };
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper dashboard-page-wrapper">
        <style>{`
          .dashboard-page-wrapper {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%) !important;
            min-height: 100vh;
          }
          .dashboard-page-wrapper .content {
            background: transparent !important;
          }
          .dashboard-page-wrapper .card {
            border: 1px solid #94a3b8 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
            background-color: #ffffff;
          }
        `}</style>
        {/* Start Content */}
        <div className="content pb-0">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-1">Admin Dashboard </h4>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link
                to={all_routes.newAppointment}
                className="btn btn-primary d-inline-flex align-items-center"
              >
                New Appointment <i className="ti ti-plus ms-2" /></Link>
            </div>
          </div>
          {/* End Page Header */}

          {/* Profile Completion Warning - Only for Admin, not Super Admin */}
          {user?.role === 'ADMIN' && stats.profileCompletion < 65 && (
            <div className="alert alert-warning alert-dismissible bg-light-warning border-warning shadow-sm fade show mb-4 d-flex align-items-center justify-content-between p-3" role="alert">
              <div className="flex-fill me-3">
                <h6 className="fw-bold mb-1 text-warning d-flex align-items-center">
                  <i className="ti ti-alert-triangle me-2 fs-5"></i>
                  Please Complete Your Profile!
                </h6>
                <p className="fs-13 mb-2 text-dark">
                  Your clinic profile is only <strong>{stats.profileCompletion}%</strong> complete. Complete it to at least 65% for better visibility and landing page functionality.
                </p>
                <div className="progress progress-sm">
                  <div
                    className={`progress-bar ${stats.profileCompletion < 40 ? 'bg-danger' : stats.profileCompletion < 65 ? 'bg-warning' : 'bg-success'}`}
                    role="progressbar"
                    style={{ width: `${stats.profileCompletion}%` }}
                    aria-valuenow={stats.profileCompletion}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              <Link to={all_routes.profilesettings || "#"} className="btn btn-warning flex-shrink-0 text-white rounded-pill px-3 shadow-sm py-1">
                Complete Now
              </Link>
            </div>
          )}

          {/* start row */}
          <div className="row g-2">
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-01.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-primary rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className="badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 bg-success">
                        +95%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Doctors</p>
                      <h3 className="fw-bold mb-0">{stats.doctorsCount}</h3>
                    </div>
                    <div>
                      <div id="s-col" className="chart-set">
                        <Chart
                          options={sColChart}
                          series={series}
                          type="bar"
                          width={80}
                          height={54}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-02.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-danger rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className="badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 bg-success">
                        +25%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Patients</p>
                      <h3 className="fw-bold mb-0">{stats.patientsCount}</h3>
                    </div>
                    <div>
                      <div id="s-col-2" className="chart-set">
                        <SCol2Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-03.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-info rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className="badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 bg-danger">
                        -15%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Appointment</p>
                      <h3 className="fw-bold mb-0">{stats.appointmentsCount}</h3>
                    </div>
                    <div>
                      <div id="s-col-3" className="chart-set">
                        <SCol3Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="position-relative border card rounded-2 shadow-sm">
                <ImageWithBasePath
                  src="./assets/img/bg/bg-04.svg"
                  alt="img"
                  className="position-absolute start-0 top-0"
                />
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2 justify-content-between">
                    <span className="avatar bg-success rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                    <div className="text-end">
                      <span className="badge px-2 py-1 fs-12 fw-medium d-inline-flex mb-1 bg-success">
                        +25%
                      </span>
                      <p className="fs-13 mb-0">in last 7 Days </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between overflow-hidden">
                    <div>
                      <p className="mb-1">Revenue</p>
                      <h3 className="fw-bold mb-0 text-truncate">${stats.revenue.toLocaleString()}</h3>
                    </div>
                    <div>
                      <div id="s-col-4" className="chart-set">
                        <SCol4Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row g-2">
            {/* col start */}
            <div className="col-xl-8">
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Appointment Statistics</h5>
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
                  <div className="row g-2 row-gap-3 mb-2">
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate">
                          <i className="ti ti-point-filled me-1 text-primary" />
                          All Appointments
                        </p>
                        <h5 className="fw-bold mb-0">{stats.appointmentStats.total}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-danger" />
                          Cancelled
                        </p>
                        <h5 className="fw-bold mb-0">{stats.appointmentStats.cancelled}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-warning" />
                          Reschedule
                        </p>
                        <h5 className="fw-bold mb-0">{stats.appointmentStats.rescheduled}</h5>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1">
                          <i className="ti ti-point-filled me-1 text-success" />
                          Completed
                        </p>
                        <h5 className="fw-bold mb-0">{stats.appointmentStats.completed}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="chart-set" id="s-col-19">
                    <SCol19Chart data={stats.monthlyData} />
                  </div>
                </div>
              </div>
              {/* card end */}
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Popular Doctors</h5>
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
                  <div className="row g-2 row-gap-3">
                    <div className="col-md-4">
                      <div className="border shadow-sm p-3 rounded-2">
                        <div className="d-flex align-items-center mb-3">
                          <Link
                            to={all_routes.doctordetails}
                            className="avatar me-2 flex-shrink-0 position-relative"
                          >
                            <span className="online text-success position-absolute end-0 bottom-0 pe-1">
                              <i className="ti ti-circle-filled d-flex bg-white fs-6 rounded-circle border border-1 border-white" />
                            </span>
                            <ImageWithBasePath
                              src="assets/img/doctors/doctor-01.jpg"
                              alt="img"
                              className="rounded-circle"
                            />
                          </Link>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link
                                to={all_routes.doctordetails}
                                className="fw-semibold"
                              >
                                Dr. Alex Morgan
                              </Link>
                            </h6>
                            <p className="mb-0 fs-13">Cardiologist</p>
                          </div>
                        </div>
                        <p className="mb-0">
                          <span className="text-dark fw-semibold">258</span>
                          Bookings
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border shadow-sm p-3 rounded-2">
                        <div className="d-flex align-items-center mb-3">
                          <Link
                            to={all_routes.doctordetails}
                            className="avatar me-2 flex-shrink-0 position-relative"
                          >
                            <span className="online text-success position-absolute end-0 bottom-0 pe-1">
                              <i className="ti ti-circle-filled d-flex bg-white fs-6 rounded-circle border border-1 border-white" />
                            </span>
                            <ImageWithBasePath
                              src="assets/img/doctors/doctor-03.jpg"
                              alt="img"
                              className="rounded-circle"
                            />
                          </Link>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link
                                to={all_routes.doctordetails}
                                className="fw-semibold"
                              >
                                Dr. Emily Carter
                              </Link>
                            </h6>
                            <p className="mb-0 fs-13">Pediatrician</p>
                          </div>
                        </div>
                        <p className="mb-0">
                          <span className="text-dark fw-semibold">125</span>
                          Bookings
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border shadow-sm p-3 rounded-2">
                        <div className="d-flex align-items-center mb-3">
                          <Link
                            to={all_routes.doctordetails}
                            className="avatar me-2 flex-shrink-0 position-relative"
                          >
                            <ImageWithBasePath
                              src="assets/img/doctors/doctor-04.jpg"
                              alt="img"
                              className="rounded-circle"
                            />
                          </Link>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link
                                to={all_routes.doctordetails}
                                className="fw-semibold"
                              >
                                Dr. David Lee
                              </Link>
                            </h6>
                            <p className="mb-0 fs-13">Gynecologist</p>
                          </div>
                        </div>
                        <p className="mb-0">
                          <span className="text-dark fw-semibold">115</span>
                          Bookings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* card end */}
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4">
              <div className="card shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0 text-truncate">Appointments</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      All Type <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          In Person
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          Online
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="datepic appointment-calender mb-1">
                    <Calendar
                      fullscreen={false}
                      onPanelChange={onPanelChange}
                    />
                  </div>
                  <div className="mb-3 bg-light p-3 rounded-2 d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fs-14 fw-semibold mb-1">General Visit</h6>
                      <p className="mb-0 text-truncate">
                        <i className="ti ti-calendar-time me-1 text-dark" />
                        Wed, 05 Apr 2025, 06:30 PM
                      </p>
                    </div>
                    <div className="avatar-list-stacked avatar-group-sm event flex-shrink-0">
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-26.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-05.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 bg-soft-danger p-3 rounded-2 d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fs-14 fw-semibold mb-1">General Visit</h6>
                      <p className="mb-0 text-truncate">
                        <i className="ti ti-calendar-time me-1 text-dark" />
                        Wed, 05 Apr 2025, 04:10 PM
                      </p>
                    </div>
                    <div className="avatar-list-stacked avatar-group-sm event flex-shrink-0">
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-17.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-10.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 bg-soft-info p-3 rounded-2 d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fs-14 fw-semibold mb-1">General Visit</h6>
                      <p className="mb-0 text-truncate">
                        <i className="ti ti-calendar-time me-1 text-dark" />
                        Wed, 05 Apr 2025, 10:00 AM
                      </p>
                    </div>
                    <div className="avatar-list-stacked avatar-group-sm event flex-shrink-0">
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-16.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                      <span className="avatar avatar-lg rounded-circle border-0">
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-09.jpg"
                          className="img-fluid rounded-circle border border-white"
                          alt="Img"
                        />
                      </span>
                    </div>
                  </div>
                  <Link
                    to={all_routes.appointments}
                    className="btn btn-light w-100"
                  >
                    View All Appointments
                  </Link>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row g-2">
            <div className="col-12 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">All Appointments</h5>
                  <Link
                    to={all_routes.appointments}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {/* Table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table border">
                      <thead className="thead-light">
                        <tr>
                          <th>Doctor</th>
                          <th>Patient</th>
                          <th>Date &amp; Time</th>
                          <th>Mode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!stats?.recentAppointments || stats.recentAppointments.length === 0 ? (
                          <tr><td colSpan={5} className="text-center">No recent appointments</td></tr>
                        ) : (
                          stats.recentAppointments.map((app) => (
                            <tr key={app.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link to={all_routes.doctordetails} className="avatar me-2">
                                    {app.doctor.profileImage ? (
                                      <ImageWithBasePath src={`assets/img/doctors/${app.doctor.profileImage}`} className="rounded-circle" alt="img" />
                                    ) : (
                                      <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                        {app.doctor.fullName.charAt(0)}
                                      </span>
                                    )}
                                  </Link>
                                  <div>
                                    <h6 className="fs-14 mb-1">
                                      <Link to={all_routes.doctordetails} className="fw-semibold">
                                        Dr. {app.doctor.fullName}
                                      </Link>
                                    </h6>
                                    <p className="mb-0 fs-13 text-muted">{app.department?.name || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div>
                                    <h6 className="fs-14 mb-1">
                                      <Link to={all_routes.patientDetails} className="fw-medium">
                                        {app.patient.firstName} {app.patient.lastName}
                                      </Link>
                                    </h6>
                                    <p className="mb-0 fs-13 text-muted">{app.patient.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td>{new Date(app.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                              <td>{app.mode}</td>
                              <td>
                                <span className={`badge fs-13 py-1 border rounded fw-medium ${app.status === 'Completed' ? 'badge-soft-success border-success text-success' :
                                  app.status === 'Cancelled' ? 'badge-soft-danger border-danger text-danger' :
                                    'badge-soft-info border-info text-info'
                                  }`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Table end */}
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* row start */}
          <div className="row g-2">
            {/* col start */}
            <div className="col-xl-4 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Top 5 Patients</h5>
                  <Link
                    to={all_routes.patients}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {!stats?.topPatients || stats.topPatients.length === 0 ? (
                    <p className="text-center text-muted mt-3">No patient data found</p>
                  ) : (
                    stats.topPatients.map((p, index) => (
                      <div key={p.id} className={`d-flex justify-content-between align-items-center ${index === stats.topPatients.length - 1 ? 'mb-0' : 'mb-3'}`}>
                        <div className="d-flex align-items-center">
                          <Link
                            to={all_routes.patientDetails}
                            className="avatar me-2 flex-shrink-0"
                          >
                            {p.profileImage ? (
                              <ImageWithBasePath
                                src={`assets/img/profiles/${p.profileImage}`}
                                alt="img"
                                className="rounded-circle"
                              />
                            ) : (
                              <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                {p.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            )}
                          </Link>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link
                                to={all_routes.patientDetails}
                                className="fw-medium"
                              >
                                {p.fullName}
                              </Link>
                            </h6>
                            <p className="mb-0 fs-13 text-truncate">
                              Total Paid : ${p.totalPaid.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="badge fw-medium badge-soft-primary border border-primary flex-shrink-0">
                          {p.appointmentCount} Appointments
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
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
                  {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
                    <p className="text-center text-muted mt-3">No recent transactions</p>
                  ) : (
                    stats.recentTransactions.map((tx, index) => (
                      <div key={tx.id} className={`d-flex justify-content-between align-items-center ${index === stats.recentTransactions.length - 1 ? 'mb-0' : 'mb-3'}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar me-2 flex-shrink-0">
                            <span className="avatar-title rounded-circle bg-soft-info text-info fs-18">
                              <i className={tx.method?.toLowerCase()?.includes('stripe') ? "ti ti-brand-stripe" : tx.method?.toLowerCase()?.includes('paypal') ? "ti ti-brand-paypal" : "ti ti-receipt"} />
                            </span>
                          </div>
                          <div>
                            <h6 className="fs-14 mb-1 text-truncate">
                              <Link to="#" className="fw-semibold">
                                {tx.patientName}
                              </Link>
                            </h6>
                            <p className="mb-0 fs-12 text-truncate">
                              <span className="text-primary me-2 fw-medium">#{tx.invoiceCode || 'N/A'}</span>
                              <span className="text-muted">{new Date(tx.createdAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`badge fw-semibold flex-shrink-0 ${tx.status === 'Paid' ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning'}`}>
                          {tx.status === 'Paid' ? '+' : ''} ${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* col end */}
            {/* col start */}
            <div className="col-xl-4 col-lg-6 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Leave Requests</h5>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Today <i className="ti ti-chevron-down ms-1" />
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="#">
                          Today
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="#">
                          This Month
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.doctordetails}
                        className="avatar flex-shrink-0"
                      >
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-16.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold text-truncate mb-1 fs-14">
                            <Link to={all_routes.doctordetails}>
                              James Allaire
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0 text-truncate">
                            4 Days - Personal Reason
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                      >
                        <i className="ti ti-x fw-bold" />
                      </Link>
                      <Link
                        to="#"
                        className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                      >
                        <i className="ti ti-check fw-bold" />
                      </Link>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.doctordetails}
                        className="avatar flex-shrink-0"
                      >
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-21.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold text-truncate mb-1 fs-14">
                            <Link to={all_routes.doctordetails}>
                              Esther Schmidt
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0 text-truncate">
                            2 Days - Going to Hospital
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                      >
                        <i className="ti ti-x fw-bold" />
                      </Link>
                      <Link
                        to="#"
                        className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                      >
                        <i className="ti ti-check fw-bold" />
                      </Link>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.doctordetails}
                        className="avatar flex-shrink-0"
                      >
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-03.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold text-truncate mb-1 fs-14">
                            <Link to={all_routes.doctordetails}>
                              Valerie Padgett
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0 text-truncate">
                            1 Day - Changing Account
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                      >
                        <i className="ti ti-x fw-bold" />
                      </Link>
                      <Link
                        to="#"
                        className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                      >
                        <i className="ti ti-check fw-bold" />
                      </Link>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.doctordetails}
                        className="avatar flex-shrink-0"
                      >
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-02.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold text-truncate mb-1 fs-14">
                            <Link to={all_routes.doctordetails}>
                              Diane Nash
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0 text-truncate">
                            1 Day - Not Well
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                      >
                        <i className="ti ti-x fw-bold" />
                      </Link>
                      <Link
                        to="#"
                        className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                      >
                        <i className="ti ti-check fw-bold" />
                      </Link>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-0">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.doctordetails}
                        className="avatar flex-shrink-0"
                      >
                        <ImageWithBasePath
                          src="assets/img/doctors/doctor-09.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold text-truncate mb-1 fs-14">
                            <Link to={all_routes.doctordetails}>
                              Sally Cavazos
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0 text-truncate">
                            2 Days - Going to Checkup
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="d-inline-flex bg-soft-danger text-danger p-2 rounded-circle"
                      >
                        <i className="ti ti-x fw-bold" />
                      </Link>
                      <Link
                        to="#"
                        className="d-inline-flex ms-2 text-success p-2 bg-soft-success rounded-circle"
                      >
                        <i className="ti ti-check fw-bold" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* row end */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary ms-1">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default Dashboard;
