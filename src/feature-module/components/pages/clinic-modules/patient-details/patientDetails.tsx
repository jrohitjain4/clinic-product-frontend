import { Link, useParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useMemo, useEffect } from "react";
import PredefinedDatePicker from "../../../../../core/common/datePicker";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Modals from "./modals/modals";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import { useLabBookings } from "../../../../../core/hooks/useLabBookings";
import { apiUrl } from "../../../../../core/config/api";
import IpdViewDetailsModal from "../../ipd-modules/IpdViewDetailsModal";
import dayjs from "dayjs";
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

const paymentStatusBadgeClass = (status: string) => {
  const s = status ? status.toLowerCase() : "";
  if (s.includes("paid") && !s.includes("unpaid") && !s.includes("partial")) {
    return "badge-soft-success border-success text-success";
  } else if (s.includes("unpaid")) {
    return "badge-soft-danger border-danger text-danger";
  } else if (s.includes("partial") || s.includes("part") || s.includes("pending")) {
    return "badge-soft-warning border-warning text-warning";
  }
  return "badge-soft-primary border-primary text-primary";
};

const displayPaymentStatus = (status: string) => {
  const s = status ? status.trim().toUpperCase() : "";
  if (s === "PENDING" || s === "PARTIAL") {
    return "PARTIAL PAYMENT";
  }
  return s;
};

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, loading, error } = useClinicPatient(id);
  const { appointments, loading: apptLoading } = useClinicAppointments(
    id ? { patientId: id } : undefined
  );
  const { bookings, loading: labLoading } = useLabBookings();
  const { invoices, loading: invLoading } = useClinicInvoices();
  
  const [searchText, setSearchText] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("All");

  const [ipdAdmissions, setIpdAdmissions] = useState<any[]>([]);
  const [showIpdModal, setShowIpdModal] = useState(false);
  const [selectedIpdAdmission, setSelectedIpdAdmission] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchIpdData = async () => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const res = await fetch(apiUrl("/api/ipd/admissions"), { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const patientIpd = data.filter(
              (adm: any) => adm.patientId === id || adm.patient?.id === id
            );
            setIpdAdmissions(patientIpd);
          }
        }
      } catch (err) {
        console.error("Error loading IPD data for patient:", err);
      }
    };
    fetchIpdData();
  }, [id]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const normalizedAppointments = useMemo(() => {
    // 1. Normalize OPD and Therapy appointments
    const appts = appointments.map((a) => {
      const isTherapy = a.appointmentType === "therapy";
      return {
        id: a.id,
        scheduledAt: a.scheduledAt,
        doctorName: a.doctorName || a.doctor?.fullName || "—",
        doctorDesignation: a.doctor?.designation?.name || "Doctor",
        doctorImage: a.doctor?.profileImage || "assets/img/doctor-placeholder.png",
        department: isTherapy ? "Therapy" : (a.department?.name || a.doctor?.department?.name || "General"),
        mode: (a.mode === 'Online' || a.mode === 'Clinic Landing' || a.mode === 'Clinic Landing page' || (a as any).appointmentType === 'Online Booking') ? 'Online' : 'Walk In',
        status: a.status,
        type: isTherapy ? "Therapy" : "OPD / Clinic",
        raw: a,
        link: isTherapy ? "/therapy-appointments" : `/appointments/appointment-details/${a.id}`
      };
    });

    // 2. Filter & Normalize Diagnostic Bookings for this patient
    const diagBookings = (bookings || [])
      .filter((b) => b.patientId === id)
      .map((b) => {
        return {
          id: b.id,
          scheduledAt: b.scheduledAt,
          doctorName: b.test?.name || "Diagnostic Test",
          doctorDesignation: b.test?.testCode ? `Test Code: ${b.test.testCode}` : "Diagnostic Test",
          doctorImage: "assets/img/icons/lab-placeholder.png",
          department: "Diagnostic",
          mode: "Walk In",
          status: b.status,
          type: "Diagnostic",
          raw: b,
          link: "/pathlab/bookings"
        };
      });

    // 3. Normalize IPD Admissions for this patient
    const ipdAppts = (ipdAdmissions || []).map((adm) => ({
      id: adm.id,
      scheduledAt: adm.admissionDate,
      doctorName: adm.doctor?.fullName ? `Dr. ${adm.doctor.fullName}` : "Primary Doctor",
      doctorDesignation: adm.ward?.wardName ? `Ward: ${adm.ward.wardName}` : "IPD Inpatient",
      doctorImage: "assets/img/icons/shape-01.svg",
      department: "IPD Admission",
      mode: "Inpatient",
      status: adm.status === "Admitted" ? "Active Inpatient" : "Discharged",
      type: "IPD Admission",
      raw: adm,
      link: "/ipd/admissions"
    }));

    // 4. Combine and sort by date descending
    const combined = [...appts, ...diagBookings, ...ipdAppts];
    combined.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return combined;
  }, [appointments, bookings, ipdAdmissions, id]);

  const filteredAppointments = useMemo(() => {
    return normalizedAppointments.filter((a) => {
      const matchesSearch = !searchText || (() => {
        const q = searchText.toLowerCase();
        return (
          a.doctorName.toLowerCase().includes(q) ||
          a.doctorDesignation.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
        );
      })();

      const matchesType = filterType === "All" || a.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [normalizedAppointments, searchText, filterType]);

  const combinedInvoices = useMemo(() => {
    const regularInvoices = invoices
      .filter((inv) => inv.patientId === id)
      .map((inv) => {
        const isPharmacy = (inv as any).otherInfo === "Pharmacy" || inv.invoiceCode?.startsWith("PH-");
        const isPathlab = inv.invoiceCode?.startsWith("INV-AUTO-LB") || (inv as any).otherInfo === "Pathlab";
        const isTherapy = (inv as any).appointment?.appointmentType === "therapy" || (inv as any).consultationId !== null || (inv as any).otherInfo === "Therapy";
        const txnType = isPharmacy ? "Pharmacy" : isPathlab ? "Pathlab" : isTherapy ? "Therapy" : "OPD / Clinic";

        return {
          id: inv.id,
          invoiceCode: inv.invoiceCode,
          type: txnType,
          description: inv.items?.[0]?.description || "Invoice Details",
          date: inv.invoiceDate,
          paymentMethod: inv.paymentMethod || "—",
          amount: inv.totalAmount,
          paymentStatus: inv.paymentStatus,
          isIpd: false,
          raw: inv,
        };
      });

    const ipdInvoices = (ipdAdmissions || []).map((adm) => {
      const doctorName = adm.doctor?.fullName ? `Dr. ${adm.doctor.fullName}` : "Doctor";
      const wardName = adm.ward?.wardName || "Ward";
      return {
        id: adm.id,
        invoiceCode: adm.admissionCode || "IPD Stay",
        type: "IPD Admission",
        description: `IPD Stay — Ward: ${wardName} (${doctorName})`,
        date: adm.admissionDate,
        paymentMethod: adm.paymentMethod || "Cash",
        amount: adm.totalAmount || adm.totalBilled || 0,
        paymentStatus: adm.paymentStatus || (adm.dueAmount > 0 ? "Partial" : "Paid"),
        isIpd: true,
        raw: adm,
      };
    });

    const combined = [...regularInvoices, ...ipdInvoices];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [invoices, ipdAdmissions, id]);

  const isInvalidImage = (img?: string | null) =>
    !img || img.trim() === "" || img.includes("300x300") || img.includes("placeholder");

  const profileSrc = isInvalidImage(patient?.profileImage)
    ? "assets/img/patient-placeholder.png"
    : patient?.profileImage || "assets/img/patient-placeholder.png";
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
            <div className="row g-2 align-items-end">
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
                    <p className="mb-3">{patient.fullAddress || ""}</p>
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="mb-0 d-inline-flex align-items-center">
                        <i className="ti ti-phone me-1 text-dark" />
                        Phone :
                        <span className="text-dark ms-1">
                          {patient.phone || ""}
                        </span>
                      </p>
                      <span className="mx-2 text-light">|</span>
                      <p className="mb-0 d-inline-flex align-items-center">
                        <i className="ti ti-calendar-time me-1 text-dark" />
                        Last Visited :
                        <span className="text-dark ms-1">
                          {patient.lastVisitLabel || ""}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-4">
                <div className="p-3 text-lg-end">
                  <div className="mb-4 d-flex align-items-center gap-2 justify-content-lg-end">
                    <a
                      href={`tel:${patient.phone || ''}`}
                      className="btn btn-outline-primary shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: '42px', height: '42px' }}
                      title="Call Patient"
                    >
                      <i className="ti ti-phone fs-18" />
                    </a>
                    <a
                      href={`https://wa.me/${(patient.phone || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-success shadow-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: '42px', height: '42px' }}
                      title="WhatsApp Patient"
                    >
                      <i className="ti ti-brand-whatsapp fs-18" />
                    </a>
                  </div>
                  <Link
                    to={`${all_routes.newAppointment}?patientId=${patient.id}`}
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
          <div className="row g-2">
            <div className="col-xl-5 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0">
                    <i className="ti ti-user-star me-1" />
                    About
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="row g-2">
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
                          <p className="mb-0">{patient.bloodGroup || ""}</p>
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
                          <p className="mb-0">{patient.gender || ""}</p>
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
                          <p className="mb-0 text-break">{patient.email || ""}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-7 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header border-bottom">
                  <h5 className="fw-bold mb-0">
                    <i className="ti ti-id me-1" />
                    Additional Information
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Blood Group</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark">{patient.bloodGroup || "—"}</h6>
                      </div>
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Aadhaar Number</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark">{patient.aadhaarNumber || "—"}</h6>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Marital Status</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark">{patient.maritalStatus || "—"}</h6>
                      </div>
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Passport Number</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark">{patient.passportNumber || "—"}</h6>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Occupation</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark text-truncate">{patient.occupation || "—"}</h6>
                      </div>
                      <div className="mb-1">
                        <p className="mb-0 fs-12 text-muted">Referred By</p>
                        <h6 className="fs-14 fw-bold mb-0 text-dark text-truncate">{patient.referredBy || "—"}</h6>
                      </div>
                    </div>

                    <div className="col-12 mt-0">
                      <div className="border-top pt-2 mb-2">
                        <h6 className="fs-13 fw-bold text-primary mb-1">
                          <i className="ti ti-phone-outgoing me-1" />
                          Emergency Contact
                        </h6>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <p className="mb-0 fs-12 text-muted">Name</p>
                            <h6 className="fs-14 fw-bold text-dark">{patient.emergencyContactName || "—"}</h6>
                          </div>
                          <div className="col-md-4">
                            <p className="mb-0 fs-12 text-muted">Relation</p>
                            <h6 className="fs-14 fw-bold text-dark">{patient.emergencyContactRelation || "—"}</h6>
                          </div>
                          <div className="col-md-4">
                            <p className="mb-0 fs-12 text-muted">Phone</p>
                            <h6 className="fs-14 fw-bold text-dark">{patient.emergencyContactPhone || "—"}</h6>
                          </div>
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
                to="#invoices"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link bg-transparent"
              >
                <span>Invoices</span>
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
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <select
                      className="form-select fs-13 py-2 fw-medium border bg-white"
                      style={{ minWidth: "150px", height: "38px", borderRadius: "5px" }}
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="All">All Types</option>
                      <option value="OPD / Clinic">OPD / Clinic</option>
                      <option value="Therapy">Therapy</option>
                      <option value="Diagnostic">Diagnostic</option>
                    </select>
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
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row g-2-gap-3">
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
                  <thead className="thead-light">
                    <tr>
                      <th className="fw-bold text-dark">Sr No</th>
                      <th className="fw-bold text-dark">Date & Time</th>
                      <th className="fw-bold text-dark">Type</th>
                      <th className="fw-bold text-dark">Doctor / Service Name</th>
                      <th className="fw-bold text-dark">Department</th>
                      <th className="fw-bold text-dark text-center">Mode</th>
                      <th className="fw-bold text-dark text-center">Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apptLoading || labLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <span className="spinner-border spinner-border-sm text-primary" role="status" />
                        </td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          No appointments found
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt, idx) => {
                        const doctorImage = appt.doctorImage || "assets/img/doctor-placeholder.png";
                        const doctorName = appt.doctorName;
                        const designation = appt.doctorDesignation;

                        return (
                          <tr key={appt.id}>
                            <td className="fw-bold text-dark py-1">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="text-dark fw-medium py-1 fs-13">{dayjs(appt.scheduledAt).format("DD MMM YYYY - hh:mm A")}</td>
                            <td className="py-1">
                              <span className={`badge border rounded-pill fs-11 ${
                                appt.type === "OPD / Clinic" ? "badge-soft-primary border-primary" :
                                appt.type === "Therapy" ? "badge-soft-warning border-warning" :
                                "badge-soft-success border-success"
                              }`}>
                                {appt.type}
                              </span>
                            </td>
                            <td className="py-1">
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-sm me-2 flex-shrink-0">
                                  <ImageWithBasePath
                                    src={doctorImage}
                                    alt={doctorName}
                                    className="rounded-circle border"
                                  />
                                </span>
                                <div>
                                  <h6 className="fs-13 mb-0 text-truncate text-dark fw-bold">
                                    {doctorName}
                                  </h6>
                                  <p className="mb-0 fs-11 text-muted">{designation}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-dark fw-medium py-1 fs-13">
                              {appt.department}
                            </td>
                            <td className="text-center py-1">
                              <span className={`badge border ${appt.mode === 'Online' ? 'badge-soft-info border-info' : 'badge-soft-secondary border-secondary'} rounded-pill fs-11`}>
                                {appt.mode}
                              </span>
                            </td>
                            <td className="text-center py-1">
                              <span
                                className={`badge fs-11 rounded-pill fw-bold border ${statusBadgeClass(appt.status)}`}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td className="text-end py-1">
                              <div className="d-flex align-items-center justify-content-end gap-2">
                                {appt.type === "Diagnostic" ? (
                                  <Link to="/pathlab/bookings" className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle">
                                    <i className="ti ti-eye fs-13" />
                                  </Link>
                                ) : appt.type === "Therapy" ? (
                                  <Link to="/therapy-appointments" className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle">
                                    <i className="ti ti-eye fs-13" />
                                  </Link>
                                ) : (
                                  <Link to={all_routes.appointmentDetails.replace(":id", appt.id)} className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle">
                                    <i className="ti ti-eye fs-13" />
                                  </Link>
                                )}
                              </div>
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
            <div className="tab-pane" id="invoices">
              {/*  Start Filter */}
              <div className=" d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="search-set mb-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">

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
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row g-2-gap-3">
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
                      <th>Type</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <span className="spinner-border spinner-border-sm text-primary" role="status" />
                        </td>
                      </tr>
                    ) : combinedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">No transactions or invoices found</td>
                      </tr>
                    ) : (
                      combinedInvoices.map((inv) => {
                        const badgeClass = inv.isIpd
                          ? "badge-soft-primary border-primary text-primary"
                          : inv.type === "Pharmacy"
                          ? "badge-soft-warning border-warning text-warning"
                          : inv.type === "Pathlab"
                          ? "badge-soft-info border-info text-info"
                          : inv.type === "Therapy"
                          ? "badge-soft-danger border-danger text-danger"
                          : "badge-soft-primary border-primary text-primary";

                        return (
                          <tr key={inv.id}>
                            <td>
                              {inv.isIpd ? (
                                <button
                                  type="button"
                                  className="btn btn-link p-0 fw-bold text-primary text-decoration-none"
                                  onClick={() => {
                                    setSelectedIpdAdmission(inv.raw);
                                    setShowIpdModal(true);
                                  }}
                                >
                                  {inv.invoiceCode}
                                </button>
                              ) : (
                                <Link to={all_routes.invoicesDetails.replace(":id", inv.id)} className="fw-bold text-dark">{inv.invoiceCode}</Link>
                              )}
                            </td>
                            <td>
                              <span className={`badge border ${badgeClass} fs-11 fw-medium`}>{inv.type}</span>
                            </td>
                            <td className="text-dark">{inv.description}</td>
                            <td className="text-dark">{dayjs(inv.date).format("DD MMM YYYY")}</td>
                            <td className="text-dark">{inv.paymentMethod}</td>
                            <td className="text-dark fw-bold">₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td>
                              <span className={`badge border fs-12 fw-bold ${paymentStatusBadgeClass(inv.paymentStatus)}`}>
                                {displayPaymentStatus(inv.paymentStatus)}
                              </span>
                            </td>
                            <td className="text-end">
                              {inv.isIpd ? (
                                <button
                                  type="button"
                                  className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle"
                                  title="View IPD Stay Details"
                                  onClick={() => {
                                    setSelectedIpdAdmission(inv.raw);
                                    setShowIpdModal(true);
                                  }}
                                >
                                  <i className="ti ti-eye fs-13" />
                                </button>
                              ) : (
                                <Link to={all_routes.invoicesDetails.replace(":id", inv.id)} className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle">
                                  <i className="ti ti-eye fs-13" />
                                </Link>
                              )}
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
              <div className="table-responsive">
                <table className="table table-nowrap datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">Transaction ID</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <span className="spinner-border spinner-border-sm text-primary" role="status" />
                        </td>
                      </tr>
                    ) : invoices.filter(inv => inv.patientId === id && (inv.paymentStatus === "Paid" || inv.paymentStatus === "Completed")).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">No transactions found</td>
                      </tr>
                    ) : invoices
                      .filter(inv => inv.patientId === id && (inv.paymentStatus === "Paid" || inv.paymentStatus === "Completed"))
                      .map((inv) => {
                        const isPharmacy = (inv as any).otherInfo === "Pharmacy" || inv.invoiceCode?.startsWith("PH-");
                        const isPathlab = inv.invoiceCode?.startsWith("INV-AUTO-LB") || (inv as any).otherInfo === "Pathlab";
                        const isTherapy = (inv as any).appointment?.appointmentType === "therapy" || (inv as any).consultationId !== null || (inv as any).otherInfo === "Therapy";
                        const txnType = isPharmacy ? "Pharmacy" : isPathlab ? "Pathlab" : isTherapy ? "Therapy" : "OPD / Clinic";
                        
                        const badgeClass = isPharmacy 
                          ? "badge-soft-warning border-warning text-warning" 
                          : isPathlab 
                            ? "badge-soft-info border-info text-info" 
                            : isTherapy 
                              ? "badge-soft-danger border-danger text-danger" 
                              : "badge-soft-primary border-primary text-primary";

                        return (
                          <tr key={inv.id}>
                            <td>
                              <Link to={all_routes.invoicesDetails.replace(":id", inv.id)} className="fw-bold text-dark">{inv.invoiceCode}</Link>
                            </td>
                            <td>
                              <span className={`badge border ${badgeClass} fs-11 fw-medium`}>{txnType}</span>
                            </td>
                            <td className="text-dark">
                              {inv.items?.[0]?.description || "Payment Transaction"}
                            </td>
                            <td className="text-dark"> {dayjs(inv.invoiceDate).format("DD MMM YYYY")}</td>
                            <td className="text-dark"> {inv.paymentMethod || "—"}</td>
                            <td className="text-dark fw-bold"> ₹{inv.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td>
                              <span className={`badge border fs-12 fw-bold ${paymentStatusBadgeClass(inv.paymentStatus)}`}>
                                {displayPaymentStatus(inv.paymentStatus)}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to={all_routes.invoicesDetails.replace(":id", inv.id)} className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle">
                                <i className="ti ti-eye fs-13" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div >
          {/* tab content end */}
        </div >
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div >
      {/* ========================
			End Page Content
		========================= */}
      <IpdViewDetailsModal
        show={showIpdModal}
        onClose={() => setShowIpdModal(false)}
        admission={selectedIpdAdmission}
      />

      <Modals />
    </>
  );
};

export default PatientDetails;
