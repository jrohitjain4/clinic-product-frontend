import { Link, useParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState } from "react";
import PredefinedDatePicker from "../../../../../core/common/datePicker";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Modals from "./modals/modals";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import {
  formatPatientDateLong,
  statusToLabel,
} from "../../../../../core/utils/patientForm";

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Checked Out": return "badge-soft-info text-info";
    case "Checked In": return "badge-soft-warning text-warning";
    case "Confirmed": return "badge-soft-success text-success";
    case "Cancelled": return "badge-soft-danger text-danger";
    default: return "badge-soft-primary text-primary"; // Schedule
  }
};

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, loading, error } = useClinicPatient(id);
  const { appointments, loading: apptLoading } = useClinicAppointments(
    id ? { patientId: id } : undefined
  );
  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      (a.doctorName || a.doctor?.fullName || "").toLowerCase().includes(q) ||
      (a.doctorRole || a.doctor?.designation?.name || "").toLowerCase().includes(q) ||
      (a.dateTimeLabel || "").toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q) ||
      a.mode.toLowerCase().includes(q)
    );
  });

  const profileSrc =
    patient?.profileImage || "assets/img/users/user-08.jpg";
  const displayName =
    patient?.fullName ||
    (patient ? `${patient.firstName} ${patient.lastName}` : "Patient");
  const statusLabel = patient ? statusToLabel(patient.status) : "";

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">{error || "Patient not found"}</div>
          <Link to={all_routes.patients} className="btn btn-primary">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* page header start */}
          <div className="mb-4">
            <h6 className="fw-bold mb-0 d-flex align-items-center">
              <Link to={all_routes.patients} className="text-dark">
                <i className="ti ti-chevron-left me-1" />
                Patients
              </Link>
            </h6>
          </div>
          {/* page header end */}
          {/* card start */}
          <div className="card">
            <div className="row align-items-end">
              <div className="col-xl-9 col-lg-8">
                <div className="d-sm-flex align-items-center position-relative z-0 overflow-hidden p-3">
                  <ImageWithBasePath
                    src="./assets/img/icons/shape-01.svg"
                    alt="img"
                    className="z-n1 position-absolute end-0 top-0 d-none d-lg-flex"
                  />
                  <Link
                    to={all_routes.editPatient.replace(":id", patient.id)}
                    className="avatar avatar-xxxl patient-avatar me-2 flex-shrink-0"
                  >
                    <ImageWithBasePath
                      src={profileSrc}
                      alt={displayName}
                      className="rounded"
                    />
                  </Link>
                  <div>
                    <p className="text-primary mb-1">
                      {patient.patientCode ? `#${patient.patientCode}` : ""}
                      <span
                        className={`badge ms-2 fs-12 ${statusLabel === "Available"
                          ? "badge-soft-success border border-success"
                          : "badge-soft-danger border border-danger"
                          }`}
                      >
                        {statusLabel}
                      </span>
                    </p>
                    <h5 className="mb-1">
                      <span className="fw-bold">{displayName}</span>
                    </h5>
                    <p className="mb-3">{patient.fullAddress || "—"}</p>
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="mb-0 d-inline-flex align-items-center">
                        <i className="ti ti-phone me-1 text-dark" />
                        Phone :
                        <span className="text-dark ms-1">
                          {patient.phone || "—"}
                        </span>
                      </p>
                      <span className="mx-2 text-light">|</span>
                      <p className="mb-0 d-inline-flex align-items-center">
                        <i className="ti ti-calendar-time me-1 text-dark" />
                        Last Visited :
                        <span className="text-dark ms-1">
                          {patient.lastVisitLabel || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-4">
                <div className="p-3 text-lg-end">
                  <div className="mb-4">
                    <Link
                      to="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"
                    >
                      <i className="ti ti-phone" />
                    </Link>
                    <Link
                      to="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"
                    >
                      <i className="ti ti-message-circle" />
                    </Link>
                    <Link
                      to="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14"
                    >
                      <i className="ti ti-video" />
                    </Link>
                  </div>
                  <Link
                    to={all_routes.newAppointment}
                    className="btn btn-primary"
                  >
                    <i className="ti ti-calendar-event me-1" />
                    Book Apppointment
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* card end */}
          {/* row start */}
          <div className="row">
            <div className="col-xl-5 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0">
                    <i className="ti ti-user-star me-1" />
                    About
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="row">
                    <div className="col-sm-5">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                          <i className="ti ti-calendar-event fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1">DOB</h6>
                          <p className="mb-0">{formatPatientDateLong(patient.dob)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-7">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                          <i className="ti ti-droplet fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1">Blood Group</h6>
                          <p className="mb-0">{patient.bloodGroup || "—"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-5">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                          <i className="ti ti-gender-male fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1">Gender</h6>
                          <p className="mb-0">{patient.gender || "—"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-7">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                          <i className="ti ti-mail fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1">Email</h6>
                          <p className="mb-0 text-break">{patient.email || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-7 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0">
                    <i className="ti ti-book me-1" />
                    Vital Signs
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="row">
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-droplet fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1 text-truncate">
                            Blood Pressure
                          </h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-success fs-18" />
                            100/67 mmHg
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-heart-rate-monitor fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1 text-truncate">
                            Heart Rate
                          </h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-danger fs-18" />
                            89 Bpm
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-hexagons fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1">SPO2</h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-success fs-18" />
                            98 %
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-temperature fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1 text-truncate">
                            Temperature
                          </h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-success fs-18" />
                            101 C
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-activity fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1 text-truncate">
                            Respiratory Rate
                          </h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-danger fs-18" />
                            24 rpm
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-2 bg-light text-dark flex-shrink-0 me-2 border">
                          <i className="ti ti-weight fs-16" />
                        </span>
                        <div>
                          <h6 className="fs-13 fw-bold mb-1 text-truncate">
                            Weight
                          </h6>
                          <p className="mb-0 d-inline-flex align-items-center text-truncate">
                            <i className="ti ti-point-filled me-1 text-success fs-18" />
                            100 kg
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* tab start */}
          <ul className="nav nav-tabs nav-bordered mb-3">
            <li className="nav-item">
              <Link
                to="#appointments"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link active bg-transparent"
              >
                <span>Appointments</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="#transactions"
                data-bs-toggle="tab"
                aria-expanded="true"
                className="nav-link bg-transparent"
              >
                <span>Transactions</span>
              </Link>
            </li>
          </ul>
          {/* tab end */}
          {/* tab content start */}
          <div className="tab-content">
            <div className="tab-pane show active" id="appointments">
              {/*  Start Filter */}
              <div className=" d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="search-set mb-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="table-search d-flex align-items-center mb-0">
                        <div className="search-input">
                          <SearchInput
                            value={searchText}
                            onChange={handleSearch}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex right-content align-items-center flex-wrap mb-3">
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon text-dark">
                        <i className="ti ti-calendar-event" />
                      </span>
                      <PredefinedDatePicker />
                    </div>
                  </div>
                </div>
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter text-gray-5 me-1" />
                      Filters
                    </Link>
                    <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                      <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                        <h4 className="mb-0 fw-bold">Filter</h4>
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="link-danger text-decoration-underline"
                          >
                            Clear All
                          </Link>
                        </div>
                      </div>
                      <form action="#">
                        <div className="filter-body pb-0">
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Doctor</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      <span className="avatar avatar-xs rounded-circle me-2">
                                        <ImageWithBasePath
                                          src="assets/img/doctors/doctor-01.jpg"
                                          className="flex-shrink-0 rounded-circle"
                                          alt="img"
                                        />
                                      </span>
                                      Dr. Mick Thompson
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      <span className="avatar avatar-xs rounded-circle me-2">
                                        <ImageWithBasePath
                                          src="assets/img/doctors/doctor-02.jpg"
                                          className="flex-shrink-0 rounded-circle"
                                          alt="img"
                                        />
                                      </span>
                                      Dr. Sarah Johnson
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      <span className="avatar avatar-xs rounded-circle me-2">
                                        <ImageWithBasePath
                                          src="assets/img/doctors/doctor-03.jpg"
                                          className="flex-shrink-0 rounded-circle"
                                          alt="img"
                                        />
                                      </span>
                                      Dr. Emily Carter
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      <span className="avatar avatar-xs rounded-circle me-2">
                                        <ImageWithBasePath
                                          src="assets/img/doctors/doctor-04.jpg"
                                          className="flex-shrink-0 rounded-circle"
                                          alt="img"
                                        />
                                      </span>
                                      Dr. David Lee
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      <span className="avatar avatar-xs rounded-circle me-2">
                                        <ImageWithBasePath
                                          src="assets/img/doctors/doctor-05.jpg"
                                          className="flex-shrink-0 rounded-circle"
                                          alt="img"
                                        />
                                      </span>
                                      Dr. Anna Kim
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Designation</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cardiologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Orthopedic Surgeon
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pediatrician
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Gynecologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Psychiatrist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Neurosurgeon
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Oncologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pulmonologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Urologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dermatologist
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Mode</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      In Person
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Online
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label mb-1 text-dark fs-14 fw-medium">
                              Date<span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <PredefinedDatePicker />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Status</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Checked Out
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Checked In
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cancelled
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Schedule
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Confirmed
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                          <Link
                            to="#"
                            className="btn btn-light btn-md me-2 fw-medium close-filter"
                          >
                            Close
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary btn-md fw-medium"
                          >
                            Filter
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              {/*  End Filter */}
              {/*  Start Table */}
              <div className="table-responsive">
                <table className="table datatable table-nowrap">
                  <thead className="">
                    <tr>
                      <th className="no-sort">Date &amp; Time</th>
                      <th>Doctor Name</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {apptLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          <span className="spinner-border spinner-border-sm text-primary" role="status" />
                        </td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          No appointments found
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt) => {
                        const doctorImage = appt.doctor?.profileImage || "assets/img/users/user-08.jpg";
                        const doctorName = appt.doctorName || appt.doctor?.fullName || "—";
                        const doctorRole = appt.doctorRole || appt.doctor?.designation?.name || appt.doctor?.department?.name || "—";
                        return (
                          <tr key={appt.id}>
                            <td>{appt.dateTimeLabel || appt.scheduledAt}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="avatar me-2 flex-shrink-0">
                                  <ImageWithBasePath
                                    src={doctorImage}
                                    alt={doctorName}
                                    className="rounded-circle"
                                  />
                                </span>
                                <div>
                                  <h6 className="fs-14 mb-1 text-truncate">
                                    <span className="fw-semibold">{doctorName}</span>
                                  </h6>
                                  <p className="mb-0 fs-13 text-truncate">{doctorRole}</p>
                                </div>
                              </div>
                            </td>
                            <td>{appt.mode}</td>
                            <td>
                              <span
                                className={`badge fs-13 rounded fw-medium ${statusBadgeClass(appt.status)}`}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td className="action-item">
                              <Link to="#" data-bs-toggle="dropdown">
                                <i className="ti ti-dots-vertical" />
                              </Link>
                              <ul className="dropdown-menu p-2">
                                <li>
                                  <Link
                                    to={all_routes.appointments}
                                    className="dropdown-item d-flex align-items-center"
                                  >
                                    View
                                  </Link>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/*  End Table */}
            </div>
            <div className="tab-pane" id="transactions">
              {/*  Start Filter */}
              <div className=" d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="search-set mb-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="table-search d-flex align-items-center mb-0">
                        <div className="search-input">
                          <SearchInput
                            value={searchText}
                            onChange={handleSearch}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex right-content align-items-center flex-wrap mb-3">
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon text-dark">
                        <i className="ti ti-calendar-event" />
                      </span>
                      <PredefinedDatePicker />
                    </div>
                  </div>
                </div>
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter text-gray-5 me-1" />
                      Filters
                    </Link>
                    <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                      <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                        <h4 className="mb-0 fw-bold">Filter</h4>
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="link-danger text-decoration-underline"
                          >
                            Clear All
                          </Link>
                        </div>
                      </div>
                      <form action="#">
                        <div className="filter-body pb-0">
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">
                                Transaction ID
                              </label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0025
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0024
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0023
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0022
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0021
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0020
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0019
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Description</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      General Consultation
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dental Cleaning
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Eye Checkup
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      X-Ray
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Physiotherapy Session
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cardiac Screening
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Skin Allergy Test
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label mb-1 text-dark fs-14 fw-medium">
                              Date<span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <input
                                type="text"
                                className="form-control datetimepicker"
                                placeholder="dd/mm/yyyy"
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">
                                Payment Method
                              </label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      PayPal
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Debit Card
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cheque
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Amount</label>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle form-control"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="filter-range">
                                  <input type="text" id="range_03" />
                                  <p>
                                    Range :
                                    <span className="text-gray-9">
                                      $200 - $5695
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Status</label>
                              <Link to="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                to="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Completed
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pending
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-outline-white w-100 filter-close"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                          <Link
                            to="#"
                            className="btn btn-light btn-md me-2 fw-medium close-filter"
                          >
                            Close
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary btn-md fw-medium"
                          >
                            Filter
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              {/*  End Filter */}
              {/*  Start Table */}
              <div className="table-responsive">
                <table className="table table-nowrap datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">Transaction ID</th>
                      <th>Description</th>
                      <th>Paid Date</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <Link to="#">#TNX0025</Link>
                      </td>
                      <td className="text-dark"> General Consultation </td>
                      <td className="text-dark"> 30 Apr 2025</td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $800</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0024</Link>
                      </td>
                      <td className="text-dark">Dental Cleaning</td>
                      <td className="text-dark"> 15 Apr 2025</td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="text-dark"> $930</td>
                      <td>
                        <span className="badge fs-13 badge-soft-info rounded text-info fw-medium border border-info">
                          Pending
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0023</Link>
                      </td>
                      <td className="text-dark"> Eye Checkup </td>
                      <td className="text-dark"> 02 Apr 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $850</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0022</Link>
                      </td>
                      <td className="text-dark"> X-Ray </td>
                      <td className="text-dark"> 27 Mar 2025 </td>
                      <td className="text-dark"> Debit Card</td>
                      <td className="text-dark"> $80</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0021</Link>
                      </td>
                      <td className="text-dark">Physiotherapy Session</td>
                      <td className="text-dark"> 12 Mar 2025</td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $650</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0020</Link>
                      </td>
                      <td className="text-dark">Cardiac Screening</td>
                      <td className="text-dark"> 05 Mar 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $430 </td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0019</Link>
                      </td>
                      <td className="text-dark">Skin Allergy Test</td>
                      <td className="text-dark"> 24 Feb 2025 </td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="text-dark"> $300</td>
                      <td>
                        <span className="badge fs-13 badge-soft-info rounded text-info fw-medium border border-info">
                          Pending
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0018</Link>
                      </td>
                      <td className="text-dark">Blood Test</td>
                      <td className="text-dark"> 16 Feb 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $450</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0017</Link>
                      </td>
                      <td className="text-dark">ENT Consultation</td>
                      <td className="text-dark"> 01 Feb 2025 </td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="fw-semibold text-dark"> $570</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link to="#">#TNX0017</Link>
                      </td>
                      <td className="text-dark">Nutrition Counseling</td>
                      <td className="text-dark"> 25 Jan 2025 </td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $800</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/*  End Table */}
            </div>
          </div >
          {/* tab content end */}
        </div >
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div >
      {/* ========================
			End Page Content
		========================= */}
      < Modals />
    </>
  );
};

export default PatientDetails;
