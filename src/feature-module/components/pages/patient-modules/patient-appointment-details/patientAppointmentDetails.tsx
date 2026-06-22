import { Link, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import {
  statusBadgeClass,
  formatAppointmentDate,
  formatAppointmentTimeRange,
} from "../../../../../core/utils/appointmentForm";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import html2pdf from 'html2pdf.js';
import { useNotes } from "../../../../../core/hooks/useNotes";
import Footer from "../../../../../core/common/footer/footer";
import AppointmentPrintSlip from "../../clinic-modules/appointments/AppointmentPrintSlip";

const PatientAppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { appointment, loading, error } = useClinicAppointment(id!);
  const { prescriptions } = usePrescriptions();
  const { notes } = useNotes({ appointmentId: id });

  const [selectedPres, setSelectedPres] = useState<any>(null);

  // Fetch patient's full history to build follow-up chains
  const { appointments: history } = useClinicAppointments(
    appointment?.patientId ? { patientId: appointment.patientId } : undefined
  );

  const rootId = (appointment as any)?.rootParentId || appointment?.id;
  const chainAppointments = history.filter(a => a.id === rootId || (a as any).rootParentId === rootId);
  const chainIds = chainAppointments.map(a => a.id);

  const sortedChain = [...chainAppointments].sort((a, b) => dayjs(a.scheduledAt).isBefore(dayjs(b.scheduledAt)) ? -1 : 1);

  const linkedPrescriptions = prescriptions.filter(p =>
    chainIds.includes(p.appointmentId) ||
    chainIds.includes(p.appointment?.id || "")
  );

  const handleDownload = () => {
    const element = document.getElementById('print-appointment');
    if (!element || !appointment) return;

    // Temporarily display the element block so html2pdf can capture it
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    const opt = {
      margin: 0,
      filename: `Appointment-Slip-${appointment.appointmentCode || 'Record'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast.info("Generating PDF, please wait...");

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        element.style.display = originalDisplay;
        toast.success("Download started!");
      })
      .catch((err: any) => {
        console.error("PDF generation failed:", err);
        element.style.display = originalDisplay;
      });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading Visit Details...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <div className="alert alert-danger d-inline-block shadow-sm">
            {error || "Appointment not found"}
          </div>
          <div className="mt-3">
            <Link to={all_routes.patientappointments} className="btn btn-primary">
              Back to Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getProfileImage = (img?: string | null, type: 'patient' | 'doctor' = 'patient') => {
    if (!img || img.trim() === "" || img.includes("300x300") || img.includes("placeholder")) {
      return type === 'patient' ? "assets/img/patient-placeholder.png" : "assets/img/doctor-placeholder.png";
    }
    return img;
  };

  const truncateReason = (reason: string | null | undefined) => {
    if (!reason) return "—";
    const words = reason.trim().split(/\s+/);
    if (words.length <= 2) return reason;
    return words.slice(0, 2).join(' ') + '...';
  };

  const columns = [
    {
      title: "Sr No",
      dataIndex: "id",
      render: (_: any, __: any, index: number) => (
        <span className="fw-bold">{String(index + 1).padStart(2, "0")}</span>
      ),
    },
    {
      title: "Prescription ID",
      dataIndex: "prescriptionCode",
      render: (text: any, record: any) => (
        <span className="fw-semibold text-primary cursor-pointer" onClick={() => setSelectedPres(record)} style={{ cursor: "pointer" }}>
          {text || record.id?.substring(0, 8)}
        </span>
      ),
      sorter: (a: any, b: any) => (a.prescriptionCode || "").localeCompare(b.prescriptionCode || ""),
    },
    {
      title: "Linked Visit",
      dataIndex: "appointmentId",
      render: (apptId: string) => {
        const appt = sortedChain.find(a => a.id === apptId);
        if (!appt) return <span className="text-muted">—</span>;
        const idx = sortedChain.findIndex(a => a.id === apptId);
        const isParent = idx === 0;
        const ordinal = idx;
        const suffix = ordinal === 1 ? 'st' : ordinal === 2 ? 'nd' : ordinal === 3 ? 'rd' : 'th';

        return (
          <div className="d-flex flex-column">
            <span className="text-secondary fw-medium fs-12">{appt.appointmentCode || appt.id.substring(0, 8)}</span>
            {isParent ? (
              <span className="text-muted fs-10 fw-bold text-uppercase">Parent Visit</span>
            ) : (
              <span className="text-primary fs-10 fw-bold text-uppercase">{ordinal}{suffix} Follow-up</span>
            )}
          </div>
        );
      }
    },
    {
      title: "Doctor",
      dataIndex: "doctor",
      render: (_: any, record: any) => (
        <span>{record.doctorName || appointment?.doctor?.fullName || "-"}</span>
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
      title: "Action",
      className: "text-center",
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <button className="btn btn-icon btn-sm btn-soft-primary" onClick={() => { setSelectedPres(record); toast.info("Viewing prescription details"); }} title="View Detail">
            <i className="ti ti-eye" />
          </button>
          <button className="btn btn-icon btn-sm btn-soft-info" title="Download" onClick={handleDownload}>
            <i className="ti ti-download" />
          </button>
        </div>
      ),
    },
  ];

  const followUpColumns = [
    {
      title: "Sr No",
      dataIndex: "id",
      render: (_: any, __: any, index: number) => (
        <span className="fw-bold">{String(index + 1).padStart(2, "0")}</span>
      ),
    },
    {
      title: "Appointment ID",
      dataIndex: "appointmentCode",
      render: (text: string, record: any, index: number) => {
        const isRoot = !record.parentAppointmentId && !(record as any).rootParentId;
        const isCurrent = record.id === appointment?.id;
        const ordinal = index;
        const suffix = ordinal === 1 ? 'st' : ordinal === 2 ? 'nd' : ordinal === 3 ? 'rd' : 'th';

        return (
          <div className="d-flex flex-column">
            <span className={`badge ${isCurrent ? 'bg-primary text-white' : 'badge-soft-info'} fs-12 mb-1`} style={{ width: 'fit-content' }}>
              {text || record.id?.substring(0, 8)}
              {isCurrent && <span className="ms-1" style={{ fontSize: '8px' }}>(CURRENT)</span>}
            </span>
            {isRoot ? (
              <span className="text-secondary fs-10 fw-bold text-uppercase tracking-wider">Original Visit</span>
            ) : (
              <span className="text-primary fs-10 fw-bold text-uppercase tracking-wider">{ordinal}{suffix} Follow-up</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Follow-up Date",
      dataIndex: "scheduledAt",
      render: (text: string, record: any) => (
        <span className="fw-bold text-dark">{dayjs(text).format('DD MMM YYYY, hh:mm A')}</span>
      ),
      sorter: (a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className={`badge ${statusBadgeClass(text)}`}>{text}</span>
      ),
    },
    {
      title: "Action",
      className: "text-center",
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <Link to={all_routes.patientappointmentdetails.replace(":id", record.id)} className="btn btn-icon btn-sm btn-soft-primary" title="View Details">
            <i className="ti ti-eye" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper p-0">
      <div className="content">
        <div className="d-md-flex align-items-center justify-content-between mb-4">
          <div>
            <h6 className="fw-bold mb-1 d-flex align-items-center text-muted fs-12 text-uppercase">
              <Link to={all_routes.patientappointments} className="text-muted hover-primary">My Appointments</Link>
              <i className="ti ti-chevron-right mx-2" />
              <span className="text-primary">Appointment Dashboard</span>
            </h6>
            <div className="d-flex align-items-center gap-3">
              <Link to={all_routes.patientappointments} className="btn btn-icon btn-soft-light rounded-circle border shadow-sm flex-shrink-0" title="Back to Appointments">
                <i className="ti ti-arrow-left fs-20" />
              </Link>
              <h3 className="fw-bold mb-0">Visit # {appointment.appointmentCode || id?.slice(-6).toUpperCase()}</h3>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button className="btn btn-outline-light border bg-white text-dark d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => window.print()}>
              <i className="ti ti-printer" /> Print
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={handleDownload}>
              <i className="ti ti-download" /> Download PDF
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {/* Patient Info */}
          <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-12">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-xl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                      <ImageWithBasePath
                        src={getProfileImage(appointment.patient?.profileImage, 'patient')}
                        className="rounded-circle img-fluid"
                        alt="Patient"
                      />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-0.5">Patient</span>
                        <span className="text-secondary fw-bold fs-11">#{appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</span>
                      </div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">{appointment.patient?.firstName} {appointment.patient?.lastName}</h5>
                    </div>
                  </div>
                  <div className="text-end bg-light p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '95px' }}>
                    <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Insurance</p>
                    <span className="badge bg-soft-success text-success fs-10 fw-bold border-0 p-0 text-uppercase">Verified ✓</span>
                  </div>
                </div>

                <hr className="my-3 border-dashed" />

                <div className="row g-2 text-dark fs-12 mb-3">
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-user fs-14 text-primary" />
                      <span className="text-muted fw-normal">Gender:</span>
                      <span className="text-dark">{appointment.patient?.gender || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-calendar fs-14 text-primary" />
                      <span className="text-muted fw-normal">Age:</span>
                      <span className="text-dark">{appointment.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')} Yrs` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-droplet fs-14 text-danger" />
                      <span className="text-muted fw-normal">Blood:</span>
                      <span className="text-dark">{appointment.patient?.bloodGroup || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-heart-handshake fs-14 text-primary" />
                      <span className="text-muted fw-normal">Marital:</span>
                      <span className="text-dark">{appointment.patient?.maritalStatus || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-phone-filled fs-14 text-primary" />
                      <span className="text-muted fw-normal">Phone:</span>
                      <span className="text-dark">{appointment.patient?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-start gap-2">
                      <i className="ti ti-map-pin fs-14 text-primary mt-0.5" />
                      <div className="flex-grow-1 lh-sm">
                        <span className="text-muted fw-normal d-block fs-10 text-uppercase letter-spacing-1 mb-1">Address</span>
                        <div className="text-dark fw-bold mb-1">
                          {[appointment.patient?.address1, appointment.patient?.address2].filter(p => p && p.trim() !== "").join(", ") || "N/A"}
                        </div>
                        <div className="text-dark fw-bold">
                          {[appointment.patient?.city, appointment.patient?.state, appointment.patient?.pincode].filter(p => p && p.trim() !== "").join(", ") || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top border-dashed d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="avatar avatar-xs bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center">
                      <i className="ti ti-building-hospital fs-12" />
                    </div>
                    <div className="lh-sm">
                      <p className="fs-10 fw-bold text-black mb-0 text-uppercase letter-spacing-1">Clinic</p>
                      <p className="fs-11 fw-bold text-dark mb-0">{appointment.clinicName || "Preclinic Central"}</p>
                    </div>
                  </div>
                  <div className="badge bg-soft-secondary text-secondary fs-10 border-0 rounded-pill px-2 py-1 flex-shrink-0">PHR Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-12">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-xl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                      <ImageWithBasePath
                        src={getProfileImage(appointment.doctor?.profileImage, 'doctor')}
                        className="rounded-circle img-fluid"
                        alt="Doctor"
                      />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-soft-info text-info fw-bold text-uppercase fs-10 tracking-wider px-2 py-0.5">Practitioner</span>
                        <div className="d-flex gap-0.5 text-warning fs-9">
                          <i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" />
                        </div>
                      </div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">{appointment.doctor?.fullName}</h5>
                    </div>
                  </div>
                  <div className="text-end bg-info-soft p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '95px' }}>
                    <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Availability</p>
                    <span className="fs-11 fw-bold text-info d-flex align-items-center gap-1 justify-content-end">
                      <span className="pulse-dot-info" /> AVAILABLE
                    </span>
                  </div>
                </div>

                <hr className="my-3 border-dashed" />

                <div className="row g-2 text-dark fs-12 mb-3">
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-briefcase fs-14 text-info" />
                      <span className="text-muted fw-normal">Exp:</span>
                      <span className="text-dark">{appointment.doctor?.yearOfExperience ? `${appointment.doctor.yearOfExperience}+ Yrs` : "8+ Yrs"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-building fs-14 text-info" />
                      <span className="text-muted fw-normal">Specialty:</span>
                      <span className="text-dark text-truncate">{appointment.doctor?.department?.name || "General"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-shield-check-filled fs-14 text-info" />
                      <span className="text-muted fw-normal">Role:</span>
                      <span className="text-dark text-truncate">{appointment.doctor?.designation?.name || "Consultant"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-coin fs-14 text-success" />
                      <span className="text-muted fw-normal">Fee:</span>
                      <span className="text-dark">₹{appointment.doctor?.consultationCharge || "500"}</span>
                    </div>
                  </div>

                  {appointment.doctor?.medicalLicenseNumber && (
                    <div className="col-12">
                      <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                        <i className="ti ti-license fs-14 text-info" />
                        <span className="text-muted fw-normal">License:</span>
                        <span className="text-dark">{appointment.doctor.medicalLicenseNumber}</span>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-phone-filled fs-14 text-info" />
                      <span className="text-muted fw-normal">Phone:</span>
                      <span className="text-dark">{appointment.doctor?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-mail fs-14 text-info" />
                      <span className="text-muted fw-normal">Email:</span>
                      <span className="text-dark text-truncate">{appointment.doctor?.email || "N/A"}</span>
                    </div>
                  </div>
                </div>

                    <div className="mt-4 pt-3 border-top border-dashed d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar avatar-xs bg-soft-info text-info rounded-circle d-flex align-items-center justify-content-center">
                          <i className="ti ti-map-pin fs-12" />
                        </div>
                        <div className="lh-sm">
                          <p className="fs-10 fw-bold text-black mb-0 text-uppercase letter-spacing-1">Facility</p>
                          <p className="fs-11 fw-bold text-dark mb-0">{appointment.location || "City Med Tower, 4F"}</p>
                        </div>
                      </div>
                      <div className="badge bg-soft-info text-info fs-10 border-0 rounded-pill px-2 py-1 flex-shrink-0">Top Rated ★</div>
                    </div>
              </div>
              <div className="card-decoration-circle bg-info-light" />
            </div>
          </div>

          {/* Slot Details */}
          <div className="col-xxl-4 col-xl-12 col-lg-12 col-md-12">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden bg-white border-primary-light hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-xl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0 d-flex align-items-center justify-content-center text-primary">
                      <i className="ti ti-calendar-event fs-24" />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-0.5">Visit Slot</span>
                        {appointment.isFollowUp && (
                          <span className="badge bg-soft-success text-success fw-bold text-uppercase fs-10 tracking-wider px-2 py-0.5 animate__animated animate__pulse animate__infinite">Follow-up ✓</span>
                        )}
                      </div>
                      <h5 className="fw-bold text-dark mb-0 fs-18">{dayjs(appointment.scheduledAt).format('DD MMM, YYYY')}</h5>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`badge ${statusBadgeClass(appointment.status)} rounded-pill px-3 py-1.5 fw-bold border-0 fs-11 shadow-xs`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>

                <hr className="my-3 border-dashed" />

                <div className="row g-2 text-dark fs-12 mb-3">
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-building-hospital fs-14 text-primary" />
                      <span className="text-muted fw-normal">Visit Type:</span>
                      <span className="text-primary badge bg-soft-primary fs-11 px-2 py-1 rounded-pill">{appointment.appointmentType || "Routine"}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-clock-hour-4 fs-14 text-info" />
                      <span className="text-muted fw-normal">Scheduled Slot:</span>
                      <span className="text-dark">{formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt)}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-map-pin fs-14 text-muted" />
                      <span className="text-muted fw-normal">Location:</span>
                      <span className="text-dark text-truncate">{appointment.location || "Room 102, OPD"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-coin fs-14 text-success" />
                      <span className="text-muted fw-normal">Payment:</span>
                      <span className={`${appointment.isFollowUp && appointment.paymentStatus === 'Unpaid' ? 'text-danger' : 'text-success'} text-truncate fw-bold`}>
                        {appointment.isFollowUp ? (appointment.paymentStatus || 'FREE').toUpperCase() : 'PAID'} {appointment.paymentStatus === 'Unpaid' ? '✗' : '✓'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top border-dashed d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="fs-10 fw-bold text-muted text-uppercase">Support:</span>
                    <span className="fs-11 fw-bold text-primary">{appointment.clinic?.landingPage?.phone || "+1 (800) MED-HELP"}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center gap-1">
                      <i className="ti ti-shield-check text-success fs-14" />
                      <span className="fs-10 fw-bold text-muted text-uppercase">Secured Access</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-decoration-circle bg-primary-light-large" />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <ul className="nav nav-pills nav-pills-primary gap-2 mb-3 bg-white p-2 rounded shadow-sm border" role="tablist">
              <li className="nav-item border-0">
                <button className="nav-link active fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#overview" type="button" role="tab">Overview</button>
              </li>
              <li className="nav-item border-0">
                <button className="nav-link fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#prescription" type="button" role="tab">Prescriptions ({linkedPrescriptions.length})</button>
              </li>
              <li className="nav-item border-0">
                <button className="nav-link fw-bold py-2 px-3 fs-13 border-0" data-bs-toggle="pill" data-bs-target="#followup" type="button" role="tab">
                  Follow-ups {sortedChain.length > 1 ? `(${sortedChain.length - 1})` : ""}
                </button>
              </li>
            </ul>

            <div className="tab-content bg-white p-4 rounded shadow-sm border shadow-none">
              {/* Overview */}
              <div className="tab-pane fade show active" id="overview" role="tabpanel">
                <div className="row g-4">
                  <div className="col-lg-7">
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Reason for Appointment</h6>
                      </div>
                      <div className="p-3 bg-light rounded border fs-14 text-dark italic border-start-4 border-start-primary shadow-sm">
                        {appointment.reason || "General Check-up / Consultation"}
                      </div>
                    </div>
                    <div className="mb-0">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Physician Notes ({notes.length})</h6>
                      </div>
                      <div className="p-0 bg-transparent rounded border-0 fs-14 text-dark min-height-200 shadow-none overflow-auto" style={{ maxHeight: '400px' }}>
                        {notes.length > 0 ? (
                          <div className="d-flex flex-column gap-3">
                            {notes.map((note) => (
                              <div key={note.id} className="p-3 bg-white rounded border shadow-sm border-start-4 border-start-info">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="badge bg-soft-info text-info px-2 py-1 fs-11">
                                    <i className="ti ti-calendar-event me-1" />
                                    {dayjs(note.createdAt).format('DD MMM YYYY, hh:mm A')}
                                  </span>
                                  <span className="text-muted fs-11 fw-medium text-uppercase">Assessment</span>
                                </div>
                                <div className="white-space-pre-wrap text-dark fs-13 line-height-base italic mt-2 p-2 bg-light rounded">
                                  "{note.content}"
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-light rounded border border-dashed text-muted text-center py-5">
                            <i className="ti ti-notes fs-30 mb-2 opacity-50 text-muted" /><br />
                            Doctor has not added any clinical notes for this visit yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <h6 className="fw-bold text-primary mb-3 text-uppercase fs-12 letter-spacing-1">Consultation Summary</h6>
                    <div className="table-responsive bg-light p-3 rounded border">
                      <table className="table table-sm border-0 mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0">Consulting Dept</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.department?.name || "General"}</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0 border-top border-dashed">Expected Duration</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end border-top border-dashed">{appointment.doctor?.appointmentDuration || 30} Mins</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0 border-top border-dashed">Meeting Mode</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end border-top border-dashed">{appointment.mode}</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0 border-top border-dashed">Scheduled On</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end border-top border-dashed">{dayjs(appointment.createdAt).format('DD MMM YYYY')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-3 bg-info-subtle rounded border border-dashed border-info shadow-sm position-relative overflow-hidden">
                      <h6 className="fw-bold text-info mb-3 text-uppercase fs-12 letter-spacing-1 d-flex align-items-center gap-2">
                        <i className="ti ti-repeat text-info fs-14" /> Follow-up Rules
                      </h6>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-info-subtle shadow-xs">
                          <span className="text-dark fw-medium fs-12">Discounted Fee</span>
                          <span className="badge bg-success text-white fw-bold fs-12 px-2">₹{appointment.doctor?.followUpFee || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-info-subtle shadow-xs">
                          <span className="text-dark fw-medium fs-12">Valid Within</span>
                          <span className="badge bg-info text-white fw-bold fs-12 px-2">{appointment.doctor?.followUpValidityDays || 0} Days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescriptions */}
              <div className="tab-pane fade" id="prescription" role="tabpanel">
                {!selectedPres ? (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <h5 className="fw-bold mb-0 text-dark"><i className="ti ti-file-description me-2" /> Medical Prescriptions</h5>
                    </div>

                    {linkedPrescriptions.length > 0 ? (
                      <div className="table-responsive">
                        <Datatable
                          columns={columns}
                          dataSource={linkedPrescriptions}
                          searchText=""
                        />
                      </div>
                    ) : (
                      <div className="text-center py-5 border rounded bg-light border-dashed">
                        <i className="ti ti-prescription fs-36 text-muted opacity-50 mb-2" /><br />
                        <span className="text-muted fs-14">No prescriptions linked to this visit yet.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-icon btn-light" onClick={() => setSelectedPres(null)}>
                          <i className="ti ti-arrow-left" />
                        </button>
                        <h5 className="fw-bold mb-0 text-dark">Viewing Prescription</h5>
                      </div>
                    </div>

                    <div className="card shadow-sm border rounded-4 mt-2">
                      <div className="card-body">
                        {/* Clinic + Doctor Info */}
                        <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar avatar-xxl rounded bg-light border p-2">
                              <ImageWithBasePath src={resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || "assets/img/logo.png"} alt="clinic" className="img-fluid" />
                            </div>
                            <div>
                              <h5 className="text-dark fw-bold mb-1">{(appointment as any)?.clinic?.name || appointment?.clinicName || "Preclinic Central"}</h5>
                              <p className="mb-2 text-muted fs-13 d-flex align-items-center gap-1">
                                <i className="ti ti-map-pin" />
                                {appointment?.location || "City Med Tower, 4F"}
                              </p>
                              <p className="mb-1 text-dark fw-semibold">{appointment?.doctor?.fullName || "-"}</p>
                              <p className="mb-0 text-muted fs-13">
                                {appointment?.doctor?.designation?.name || ""}{appointment?.doctor?.department?.name ? ` · ${appointment.doctor.department.name}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-lg-end">
                            <div className="mb-2">
                              <span className="badge bg-info-subtle text-info-emphasis fs-13 fw-medium border border-primary py-1 px-3">
                                {selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                              </span>
                            </div>
                            <p className="text-dark mb-1">
                              Department: <span className="text-body">{appointment?.doctor?.department?.name || "-"}</span>
                            </p>
                            <p className="text-dark mb-1">
                              Prescribed on: <span className="text-body">
                                {new Date(selectedPres.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Patient Details */}
                        <div className="mb-3">
                          <h6 className="mb-2 fs-14 fw-medium">Patient Details</h6>
                          <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <h6 className="m-0 fw-semibold fs-16">
                              {appointment?.patient?.firstName} {appointment?.patient?.lastName}
                            </h6>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              {appointment?.patient?.dob && (
                                <p className="mb-0 text-dark">{dayjs().diff(appointment.patient.dob, 'year')}Y / {appointment?.patient?.gender || "—"}</p>
                              )}
                              {appointment?.patient?.bloodGroup && (
                                <p className="mb-0 text-dark">
                                  <span className="text-body">Blood</span> : {appointment?.patient?.bloodGroup}
                                </p>
                              )}
                              {appointment?.patient?.patientCode && (
                                <p className="mb-0 text-dark">
                                  Patient ID <span className="text-body">{appointment?.patient?.patientCode}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Medicines Table */}
                        <div className="mb-4">
                          <h6 className="mb-3 fs-16 fw-semibold text-center">
                            Prescription Details
                          </h6>
                          <div className="table-responsive border bg-white">
                            <table className="table table-nowrap">
                              <thead className="table-light">
                                <tr>
                                  <th className="text-dark">SNO</th>
                                  <th className="text-dark">Medicine Name</th>
                                  <th className="text-dark">Dosage</th>
                                  <th className="text-dark">Frequency</th>
                                  <th className="text-dark">Duration</th>
                                  <th className="text-dark">Timings</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPres.medicines && selectedPres.medicines.length > 0 ? selectedPres.medicines.map((med: any, i: number) => (
                                  <tr key={med.id || i}>
                                    <td>{String(i + 1).padStart(2, "0")}</td>
                                    <td className="fw-medium">{med.medicineName}</td>
                                    <td>{med.dosage || "—"}</td>
                                    <td className="text-primary fw-medium">{med.frequency || "—"}</td>
                                    <td>{med.duration || "—"}</td>
                                    <td>{med.timings || "—"}</td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={6} className="text-center text-muted py-3">No medicines added</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Advice */}
                        {selectedPres.advice && (
                          <div className="pb-3 mb-3 border-bottom">
                            <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
                            <p className="mb-0">{selectedPres.advice}</p>
                          </div>
                        )}

                        {/* Follow Up */}
                        <div className="pb-3 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            <h6 className="mb-1 fs-14 fw-semibold">Follow Up</h6>
                            <p className="mb-0">
                              {selectedPres.followUpDate
                                ? new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                                : "As per schedule"}
                            </p>
                          </div>
                          <div className="text-end">
                            <ImageWithBasePath src="assets/img/icons/signature-img.svg" alt="signature" className="img-fluid mb-1" />
                            <h6 className="fs-14 fw-semibold mb-0">{appointment?.doctor?.fullName || "—"}</h6>
                            <p className="fs-13 fw-normal text-muted">{appointment?.doctor?.designation?.name || ""}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="text-center d-flex align-items-center justify-content-center gap-2 mt-4">
                          <button onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (!printWindow || !appointment) return;
                            const medicinesHtml = selectedPres.medicines && selectedPres.medicines.length > 0
                              ? selectedPres.medicines.map((med: any, i: number) => `
                                  <tr>
                                      <td class="text-center text-muted">${String(i + 1).padStart(2, "0")}</td>
                                      <td class="text-primary" style="font-weight: 700;">${med.medicineName}</td>
                                      <td>${med.dosage || "—"}</td>
                                      <td class="text-center">${med.frequency || "—"}</td>
                                      <td class="text-center">${med.duration || "—"}</td>
                                      <td class="text-center">${med.timings || "—"}</td>
                                  </tr>
                              `).join('')
                              : `<tr><td colspan="6" class="text-center text-muted">No medicines added</td></tr>`;

                            const logoSrc = resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png';
                            const clinicName = (appointment as any)?.clinic?.name || (appointment as any)?.clinicName || "Preclinic Central";
                            const clinicAddress = (appointment as any)?.clinic
                              ? [(appointment as any).clinic.addressLine1, (appointment as any).clinic.addressLine2, (appointment as any).clinic.city].filter(Boolean).join(", ")
                              : (appointment as any)?.location || "City Med Tower, 4F";

                            const html = `<html>
                                <head>
                                  <title>Prescription Summary - ${selectedPres.prescriptionCode || 'Record'}</title>
                                  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                    body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                                    .header-banner {
                                      background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                      color: #ffffff !important;
                                      padding: 24px !important;
                                      border-radius: 8px !important;
                                      margin-bottom: 25px !important;
                                      display: flex;
                                      justify-content: space-between;
                                      align-items: center;
                                      -webkit-print-color-adjust: exact;
                                      print-color-adjust: exact;
                                    }
                                    .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                                    .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                                    .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                                    .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                                    .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
                                    
                                    /* Dark Styled Tables */
                                    .table-bordered { border: 2px solid #0f172a !important; }
                                    .table-bordered th { 
                                      background-color: #0f172a !important; 
                                      color: #ffffff !important; 
                                      border: 2px solid #0f172a !important; 
                                      font-weight: 700; 
                                      font-size: 12px; 
                                      letter-spacing: 0.5px; 
                                      padding: 12px 10px !important;
                                      -webkit-print-color-adjust: exact;
                                      print-color-adjust: exact;
                                    }
                                    .table-bordered td { border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; font-size: 13px; padding: 12px 10px !important; }
                                    
                                    .text-primary { color: #1e3a8a !important; }
                                    .clinical-findings { border: 2px solid #0f172a !important; padding: 20px; background: #f8fafc; min-height: 120px; line-height: 1.6; font-size: 13px; color: #000000 !important; font-weight: 500; border-radius: 6px; }
                                    @media print { 
                                      .no-print { display: none; } 
                                      body { padding: 0; }
                                      .header-banner {
                                        background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                      }
                                      .table-bordered th {
                                        background-color: #0f172a !important;
                                        color: #ffffff !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                      }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="header-banner">
                                    <div class="d-flex align-items-center gap-3">
                                      <div class="logo-box">
                                        <img src="${logoSrc}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
                                      </div>
                                      <div>
                                        <h4>${clinicName}</h4>
                                        <p><i class="ti ti-map-pin"></i> ${clinicAddress}</p>
                                        <h6>${appointment.doctorName || appointment.doctor?.fullName}</h6>
                                        <p>${appointment.doctor?.designation?.name || "Consultant"} · ${appointment.doctor?.department?.name || "Medicine"}</p>
                                      </div>
                                    </div>
                                    <div class="text-end text-white">
                                      <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        ${selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                                      </span>
                                      <div class="small mt-1 opacity-90">
                                        <div class="mb-1"><strong>Dept:</strong> ${appointment.doctor?.department?.name || "General"}</div>
                                        <div><strong>Date:</strong> ${new Date(selectedPres.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div class="mb-4">
                                    <h6 class="section-title">Patient Clinical Profile</h6>
                                    <table class="table table-bordered mb-0">
                                      <thead>
                                        <tr>
                                          <th class="text-white">PATIENT NAME</th>
                                          <th class="text-center text-white">AGE / GENDER</th>
                                          <th class="text-center text-white">BLOOD GROUP</th>
                                          <th class="text-center text-white">PATIENT ID</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td class="text-primary" style="font-size: 15px; font-weight: 700;">${appointment.patient?.firstName} ${appointment.patient?.lastName}</td>
                                          <td class="text-center">${appointment.patient?.dob ? Math.floor((new Date().getTime() - new Date(appointment.patient.dob).getTime()) / 31557600000) : '--'}Y / ${appointment.patient?.gender || '--'}</td>
                                          <td class="text-center">${appointment.patient?.bloodGroup || 'N/A'}</td>
                                          <td class="text-center">${appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  <div class="text-center mb-4 pt-3">
                                    <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #0f172a; display: inline-block; padding-bottom: 8px;">
                                      Prescription Summary
                                    </h5>
                                  </div>

                                  <div class="mb-4">
                                    <h6 class="section-title">Medicines Details</h6>
                                    <table class="table table-bordered mb-0">
                                      <thead>
                                        <tr>
                                          <th class="text-center text-white">S.NO</th>
                                          <th class="text-white">Medicine Name</th>
                                          <th class="text-white">Dosage</th>
                                          <th class="text-center text-white">Frequency</th>
                                          <th class="text-center text-white">Duration</th>
                                          <th class="text-center text-white">Timings</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${medicinesHtml}
                                      </tbody>
                                    </table>
                                  </div>

                                  ${selectedPres.advice ? `
                                  <div class="mb-4">
                                    <h6 class="section-title">Advice / Instructions</h6>
                                    <div class="clinical-findings">
                                      ${selectedPres.advice}
                                    </div>
                                  </div>
                                  ` : ''}

                                  <div class="pb-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-5">
                                    <div>
                                      <h6 class="mb-1 fs-14 fw-semibold text-uppercase tracking-wider opacity-75 text-secondary">Follow Up</h6>
                                      <p class="mb-0 fw-bold">
                                        ${selectedPres.followUpDate
                                          ? new Date(selectedPres.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                                          : "—"}
                                        ${selectedPres.followUpNotes ? ` · ${selectedPres.followUpNotes}` : ""}
                                      </p>
                                    </div>
                                    <div class="text-end">
                                      <h6 class="fs-14 fw-bold mb-0">${appointment.doctorName || appointment.doctor?.fullName || "—"}</h6>
                                      <p class="fs-13 fw-normal text-muted mb-0">${appointment.doctor?.designation?.name || ""}</p>
                                    </div>
                                  </div>

                                  <div class="mt-auto pt-4 border-top text-center text-muted small">
                                    <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #1e3a8a;">Docyari</span>, All Rights Reserved</p>
                                    <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated prescription summary and does not require a physical signature.</p>
                                  </div>

                                  <script>
                                    window.onload = () => {
                                      setTimeout(() => { window.print(); window.close(); }, 500);
                                    };
                                  </script>
                                </body>
                              </html>`;

                            printWindow.document.write(html);
                            printWindow.document.close();
                          }} className="btn btn-md btn-dark d-flex align-items-center">
                            <i className="ti ti-printer me-1" /> Print
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Follow-ups */}
              <div className="tab-pane fade" id="followup" role="tabpanel">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="fw-bold mb-0 text-dark"><i className="ti ti-refresh text-primary me-2" /> Linked Visit History</h5>
                </div>
                {sortedChain.length > 0 ? (
                  <div className="p-0 border-0 bg-transparent">
                    <Datatable
                      columns={followUpColumns}
                      dataSource={sortedChain}
                      searchText=""
                    />
                  </div>
                ) : (
                  <div className="alert alert-light border border-dashed text-center p-5 text-muted">
                    <i className="ti ti-info-circle fs-24 mb-2" /><br />
                    No related follow-ups found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Printable Appointment Summary */}
      <div id="print-appointment" style={{ display: 'none' }}>
        <AppointmentPrintSlip appointment={appointment} notes={notes} linkedPrescriptions={linkedPrescriptions} />
      </div>

      <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden !important; }
                    #print-appointment, #print-appointment * {
                        visibility: visible !important;
                    }
                    #print-appointment {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        z-index: 99999 !important;
                        padding: 1.5cm !important;
                        margin: 0 !important;
                    }
                    .bg-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
                }

                /* Badge Contrast and Visibility Fixes */
                .badge {
                    color: #fff !important;
                }
                .badge.bg-light, .badge.text-dark, .badge.text-black {
                    color: #000 !important;
                }
                .badge.bg-soft-primary, .badge.badge-soft-primary, .badge.text-primary {
                    color: #4f46e5 !important;
                    background-color: rgba(79, 70, 229, 0.1) !important;
                }
                .badge.bg-soft-success, .badge.badge-soft-success, .badge.text-success {
                    color: #27ae60 !important;
                    background-color: rgba(39, 174, 96, 0.1) !important;
                }
                .badge.bg-soft-info, .badge.badge-soft-info, .badge.text-info {
                    color: #00cfdd !important;
                    background-color: rgba(0, 207, 221, 0.1) !important;
                }
                .badge.bg-soft-warning, .badge.badge-soft-warning, .badge.text-warning {
                    color: #d97706 !important;
                    background-color: rgba(217, 119, 6, 0.1) !important;
                }
                .badge.bg-soft-danger, .badge.badge-soft-danger, .badge.text-danger {
                    color: #dc2626 !important;
                    background-color: rgba(220, 38, 38, 0.1) !important;
                }
                .badge.badge-soft-purple, .badge.text-purple {
                    color: #8b5cf6 !important;
                    background-color: rgba(139, 92, 246, 0.1) !important;
                }
                .badge.badge-soft-dark, .badge.text-dark {
                    color: #374151 !important;
                    background-color: rgba(55, 65, 81, 0.1) !important;
                }

                .bg-primary-dark { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); }
                .min-height-200 { min-height: 200px; }
                .avatar-xxl { width: 64px; height: 64px; }
                .hover-primary:hover { color: var(--bs-primary) !important; }
                .btn-soft-primary { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; border: none; }
                .btn-soft-primary:hover { background-color: #4f46e5; color: white; }
                .btn-soft-info { background-color: rgba(13, 202, 240, 0.1); color: #0dcaf0; border: none; }
                .btn-soft-info:hover { background-color: #0dcaf0; color: white; }
                .nav-pills-primary .nav-link.active { background-color: #4f46e5 !important; color: white !important; }
                .nav-link { color: #64748b; }
                .badge-soft-info { background-color: rgba(0, 207, 221, 0.1); color: #00cfdd; }
                .letter-spacing-1 { letter-spacing: 1px; }
                .white-space-pre-wrap { white-space: pre-wrap; }
                .border-primary-light { border: 1px solid rgba(79, 70, 229, 0.1) !important; }
                .shadow-xs { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .tracking-wider { letter-spacing: 0.05em; }
                .rounded-4 { border-radius: 12px !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-shadow:hover { box-shadow: 0 8px 15px rgba(0,0,0,0.1); transform: translateY(-2px); }

                .card-decoration-circle {
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    background: rgba(79, 70, 229, 0.03);
                    border-radius: 50%;
                    top: -50px;
                    right: -50px;
                    z-index: 0;
                }
                .bg-info-light { background: rgba(0, 207, 221, 0.03); }
                .bg-primary-light-large { width: 250px; height: 250px; background: rgba(79, 70, 229, 0.02); bottom: -100px; top: auto; right: -80px; }
                .border-dashed { border: 1px dashed rgba(0,0,0,0.1) !important; }
                .border-dashed-1 { border: 1px dashed rgba(0,0,0,0.05) !important; }
                .bg-info-soft { background: rgba(0, 207, 221, 0.05); }
                .bg-success-soft { background: rgba(28, 200, 138, 0.1); }
                .bg-danger-soft { background: rgba(220, 53, 69, 0.1); }
                .pulse-dot-info {
                    width: 8px;
                    height: 8px;
                    background-color: #00cfdd;
                    border-radius: 50%;
                    display: inline-block;
                    animation: pulse-info 2s infinite;
                }
                @keyframes pulse-info {
                    0% { box-shadow: 0 0 0 0 rgba(0, 207, 221, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 207, 221, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 207, 221, 0); }
                }
                .italic { font-style: italic; }
                .line-height-base { line-height: 1.5; }
                .z-index-1 { z-index: 1; }
            `}</style>
    </div>
  );
};

export default PatientAppointmentDetails;
