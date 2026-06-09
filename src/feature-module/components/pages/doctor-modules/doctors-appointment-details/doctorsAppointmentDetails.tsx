import { Link, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import AddPrescriptionModal from "../doctors-prescriptions/AddPrescriptionModal";
import {
  statusBadgeClass,
  formatAppointmentDate,
  formatAppointmentTimeRange
} from "../../../../../core/utils/appointmentForm";
import { Modal } from "antd";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import html2pdf from 'html2pdf.js';
import { useNotes } from "../../../../../core/hooks/useNotes";
import Footer from "../../../../../core/common/footer/footer";

const DoctorsAppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { appointment, loading, error, refetch } = useClinicAppointment(id!);
  const { prescriptions, createPrescription, refetch: refetchPres } = usePrescriptions();

  const [showPresModal, setShowPresModal] = useState(false);
  const [selectedPres, setSelectedPres] = useState<any>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [clinicalNote, setClinicalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const { notes, addNote } = useNotes({ appointmentId: id });

  // Fetch patient's full history
  const { appointments: history } = useClinicAppointments(
    appointment?.patientId ? { patientId: appointment.patientId } : undefined
  );

  // Calculate fully linked chain (Root Parent + all its Follow-ups)
  const rootId = (appointment as any)?.rootParentId || appointment?.id;
  const chainAppointments = history.filter(a => a.id === rootId || (a as any).rootParentId === rootId);
  const chainIds = chainAppointments.map(a => a.id);

  const sortedChain = [...chainAppointments].sort((a, b) => dayjs(a.scheduledAt).isBefore(dayjs(b.scheduledAt)) ? -1 : 1);

  const linkedPrescriptions = prescriptions.filter(p =>
    chainIds.includes(p.appointmentId) ||
    chainIds.includes(p.appointment?.id || "")
  );

  const handlePresSubmit = async (data: any) => {
    try {
      await createPrescription({
        ...data,
        appointmentId: data.appointmentId || id,
        patientId: appointment?.patientId,
        doctorId: appointment?.doctorId
      });
      setShowPresModal(false);
      refetchPres();
      toast.success("Prescription created successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create prescription");
    }
  };

  const handleNoteSave = async () => {
    if (!id || !clinicalNote.trim()) return;
    setSavingNote(true);
    try {
      await addNote({
        title: "Clinical Note",
        content: clinicalNote,
        priority: "Medium",
        noteDate: new Date().toISOString(),
        appointmentId: id
      });
      toast.success("Clinical note added");
      setClinicalNote("");
      setShowNoteModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDownload = () => {
    const element = document.getElementById('print-appointment');
    if (!element) return;

    const opt = {
      margin: 0.3,
      filename: `appointment_${appointment?.appointmentCode || 'report'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    const originalStyle = element.getAttribute('style') || '';
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.background = 'white';
    element.style.padding = '30px';

    toast.info("Generating PDF, please wait...");

    setTimeout(() => {
      html2pdf().set(opt).from(element).save().finally(() => {
        element.setAttribute('style', originalStyle);
        toast.success("Download started!");
      });
    }, 500);
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
            <Link to={all_routes.doctorsappointments} className="btn btn-primary">
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
    return resolveMediaUrl(img);
  };

  const truncateReason = (reason: string | null | undefined) => {
    if (!reason) return "General Consultation";
    return reason.length > 30 ? reason.substring(0, 30) + "..." : reason;
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
          <button className="btn btn-icon btn-sm btn-soft-info" title="More" onClick={() => toast.info("More options coming soon")}>
            <i className="ti ti-dots" />
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
      render: (text: string) => (
        <span className="fw-bold text-dark">{dayjs(text).format('DD MMM YYYY, hh:mm A')}</span>
      ),
      sorter: (a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (text: string) => (
        <span title={text}>{truncateReason(text)}</span>
      ),
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
          <Link to={all_routes.doctorsappointmentdetails.replace(":id", record.id)} className="btn btn-icon btn-sm btn-soft-primary" title="View Details">
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
              <Link to={all_routes.doctorsappointments} className="text-muted hover-primary">Appointments</Link>
              <i className="ti ti-chevron-right mx-2" />
              <span className="text-primary">Appointment Dashboard</span>
            </h6>
            <h3 className="fw-bold mb-0">Visit # {appointment.appointmentCode || id?.slice(-6).toUpperCase()}</h3>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button className="btn btn-outline-light border bg-white text-dark d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => window.print()}>
              <i className="ti ti-printer" /> Print
            </button>
            <button className="btn btn-outline-light border bg-white text-dark d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={handleDownload}>
              <i className="ti ti-download" /> Download
            </button>
            <button className="btn btn-soft-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
              <i className="ti ti-notes" /> Add Note
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => setShowPresModal(true)}>
              <i className="ti ti-prescription" /> Add Prescription
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {/* Patient Info */}
          <div className="col-xl-4 col-lg-4 col-md-6">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex align-items-start gap-3">
                  <div className="avatar avatar-xxl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                    <ImageWithBasePath
                      src={getProfileImage(appointment.patient?.profileImage, 'patient')}
                      className="rounded-circle img-fluid"
                      alt="Patient"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-1">Patient</span>
                      <span className="text-muted fs-11 fw-medium">#{appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2 fs-18">{appointment.patient?.firstName} {appointment.patient?.lastName}</h5>

                    <div className="d-flex flex-wrap gap-x-3 gap-y-1 mb-3">
                      <div className="d-flex align-items-center gap-1 text-muted fs-12">
                        <i className="ti ti-user fs-14 text-primary opacity-75" />
                        <span>{appointment.patient?.gender || "N/A"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted fs-12">
                        <i className="ti ti-calendar fs-14 text-primary opacity-75" />
                        <span>{appointment.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')} Yrs` : "N/A"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted fs-12">
                        <i className="ti ti-droplet fs-14 text-danger opacity-75" />
                        <span>{appointment.patient?.bloodGroup || "O+"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between pt-2">
                      <div>
                        <p className="text-muted fs-13 mb-0 d-flex align-items-center gap-1 fw-medium">
                          <i className="ti ti-phone-filled fs-14 text-primary opacity-75" />
                          {appointment.patient?.phone || "N/A"}
                        </p>
                      </div>
                      <div className="text-end opacity-75 bg-light p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                        <p className="fs-10 text-uppercase fw-bold text-muted mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Insurance</p>
                        <span className="badge bg-soft-success text-success fs-10 fw-bold border-0 p-0 text-uppercase">Verified ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-decoration-circle" />
            </div>
          </div>

          {/* Doctor Info */}
          <div className="col-xl-4 col-lg-4 col-md-6">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex align-items-start gap-3">
                  <div className="avatar avatar-xxl rounded-circle border p-1 bg-light shadow-sm flex-shrink-0">
                    <ImageWithBasePath
                      src={getProfileImage(appointment.doctor?.profileImage, 'doctor')}
                      className="rounded-circle img-fluid"
                      alt="Doctor"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-soft-info text-info fw-bold text-uppercase fs-10 tracking-wider px-2 py-1">Practitioner</span>
                      <div className="d-flex gap-1 text-warning fs-10">
                        <i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" /><i className="fa fa-star" />
                      </div>
                    </div>
                    <h5 className="fw-bold text-dark mb-2 fs-18">{appointment.doctor?.fullName}</h5>

                    <div className="d-flex flex-wrap gap-x-3 gap-y-1 mb-3">
                      <div className="d-flex align-items-center gap-1 text-muted fs-12">
                        <i className="ti ti-briefcase fs-14 text-info opacity-75" />
                        <span>{appointment.doctor?.yearOfExperience || "8"}+ Yrs Exp</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted fs-12">
                        <i className="ti ti-building fs-14 text-info opacity-75" />
                        <span>{appointment.doctor?.department?.name || "General"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between pt-2">
                      <div className="flex-grow-1">
                        <div className="text-muted fs-13 mb-0 d-flex align-items-center gap-1 fw-medium text-truncate" style={{ maxWidth: '120px' }}>
                          <i className="ti ti-shield-check-filled fs-14 text-info opacity-75" />
                          {appointment.doctor?.designation?.name || "Consultant"}
                        </div>
                      </div>
                      <div className="text-end bg-info-soft p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                        <p className="fs-10 text-uppercase fw-bold text-info mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Availability</p>
                        <span className="fs-11 fw-bold text-info d-flex align-items-center gap-1 justify-content-end">
                          <span className="pulse-dot-info" /> AVAILABLE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-decoration-circle bg-info-light" />
            </div>
          </div>

          {/* Slot Details */}
          <div className="col-xl-4 col-lg-4 col-md-12">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden bg-white border-primary-light hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex flex-column gap-1">
                    <div className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-1" style={{ width: 'fit-content' }}>Visit Slot</div>
                    {appointment.isFollowUp && (
                      <span className="badge bg-soft-success text-success fw-bold text-uppercase fs-10 tracking-wider px-2 py-1">Follow-up ✓</span>
                    )}
                  </div>
                  <span className={`badge ${statusBadgeClass(appointment.status)} rounded-pill px-3 py-1 fw-bold border-0 fs-11 shadow-xs`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="avatar avatar-lg bg-soft-primary text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center shadow-xs">
                    <i className="ti ti-calendar-event fs-24" />
                  </div>
                  <div>
                    <p className="text-muted fs-11 fw-bold text-uppercase mb-0 tracking-wider opacity-75">Date & Visit Type</p>
                    <h5 className="fw-bold text-dark mb-0 fs-15">
                      {dayjs(appointment.scheduledAt).format('DD MMM, YYYY')}
                      <span className="text-primary fs-11 ms-2 fw-medium px-2 py-1 bg-soft-primary rounded-pill">{appointment.appointmentType || "Routine"}</span>
                    </h5>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="avatar avatar-lg bg-soft-info text-info rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center shadow-xs">
                    <i className="ti ti-clock-hour-4 fs-24" />
                  </div>
                  <div>
                    <p className="text-muted fs-11 fw-bold text-uppercase mb-0 tracking-wider opacity-75">Scheduled Slot</p>
                    <h5 className="fw-bold text-dark mb-0 fs-15">{formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt)}</h5>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <i className="ti ti-map-pin text-muted fs-14" />
                    <span className="text-muted fs-12 fw-medium text-truncate">{appointment.location || "Room 102, OPD"}</span>
                  </div>
                  <div className="bg-success-soft px-2 py-1 rounded-2 border-dashed flex-shrink-0">
                    <span className="fs-10 fw-bold text-success text-uppercase">
                      Mode: {appointment.mode}
                    </span>
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
                        <button className="btn btn-soft-primary btn-xs fw-bold shadow-sm" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
                          <i className="ti ti-plus me-1" /> Add Note
                        </button>
                      </div>
                      <div className="p-3 bg-light rounded border fs-14 text-dark italic">
                        {appointment.reason || "General Check-up / Consultation"}
                      </div>
                    </div>
                    <div className="mb-0">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Physician Notes ({notes.length})</h6>
                        <button className="btn btn-primary btn-xs fw-bold shadow-sm px-3" onClick={() => { setClinicalNote(""); setShowNoteModal(true); }}>
                          <i className="ti ti-plus me-1" /> Add Note
                        </button>
                      </div>
                      <div className="p-0 bg-transparent rounded border-0 fs-14 text-dark min-height-200 shadow-none overflow-auto" style={{ maxHeight: '400px' }}>
                        {notes.length > 0 ? (
                          <div className="d-flex flex-column gap-3">
                            {notes.map((note) => (
                              <div key={note.id} className="p-3 bg-light rounded border shadow-sm border-start-4 border-start-primary">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="badge bg-soft-primary text-primary px-2 py-1 fs-11">
                                    <i className="ti ti-calendar-event me-1" />
                                    {dayjs(note.createdAt).format('DD MMM YYYY, hh:mm A')}
                                  </span>
                                  <span className="text-muted fs-11 fw-medium text-uppercase">Assessment</span>
                                </div>
                                <div className="white-space-pre-wrap text-dark fs-13 line-height-base italic">
                                  "{note.content}"
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-light rounded border text-muted text-center py-5">
                            <i className="ti ti-notes fs-30 mb-2 opacity-50" /><br />
                            No physician notes recorded yet.<br />
                            Click <strong>Add Note</strong> to record findings.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <h6 className="fw-bold text-primary mb-3 text-uppercase fs-12 letter-spacing-1">Visit Details</h6>
                    <div className="table-responsive">
                      <table className="table table-sm border-0 mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0">Department</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.department?.name || "General"}</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0">Duration</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.doctor?.appointmentDuration || 30} Mins</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0">Consultating Mode</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end">{appointment.mode}</td>
                          </tr>
                          <tr>
                            <td className="text-muted border-0 py-2 ps-0">Date Created</td>
                            <td className="fw-bold text-dark border-0 py-2 text-end">{dayjs(appointment.createdAt).format('DD MMM YYYY')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-3 bg-primary-subtle rounded-4 border border-dashed border-primary shadow-sm position-relative overflow-hidden">
                      <h6 className="fw-bold text-primary mb-3 text-uppercase fs-12 letter-spacing-1 d-flex align-items-center gap-2">
                        <i className="ti ti-repeat text-primary fs-14" /> Follow-up Details
                      </h6>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-light-subtle shadow-xs">
                          <span className="text-dark fw-medium fs-12">Follow-up Fee</span>
                          <span className="badge bg-success text-white fw-bold fs-12 px-2">₹{appointment.doctor?.followUpFee || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded-3 border border-light-subtle shadow-xs">
                          <span className="text-dark fw-medium fs-12">Validity Period</span>
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
                      <h5 className="fw-bold mb-0 text-dark">Prescription History</h5>
                      <button className="btn btn-primary btn-sm fw-bold shadow-sm" onClick={() => setShowPresModal(true)}>
                        <i className="ti ti-plus me-1" /> Add Prescription
                      </button>
                    </div>

                    {linkedPrescriptions.length > 0 ? (
                      <div className="table-responsive">
                        <Datatable
                          columns={columns}
                          dataSource={linkedPrescriptions}
                          Selection={false}
                          searchText=""
                        />
                      </div>
                    ) : (
                      <div className="text-center py-5 border rounded bg-light">
                        <i className="ti ti-prescription fs-36 text-muted opacity-50 mb-2" /><br />
                        <span className="text-muted fs-14">No prescriptions recorded.</span>
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
                        <h5 className="fw-bold mb-0 text-dark">Prescription Details</h5>
                      </div>
                    </div>
                    <div className="card shadow-sm border rounded-4">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div>
                              <h5 className="text-dark fw-bold mb-1">{(appointment as any)?.clinic?.name || "Clinical Center"}</h5>
                              <p className="mb-0 text-muted fs-13">{appointment?.doctor?.fullName}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-info-subtle text-info-emphasis fs-13 fw-medium border border-primary py-1 px-3">
                              {selectedPres.prescriptionCode || `#P-${selectedPres.id?.substring(0, 4)}`}
                            </span>
                            <p className="text-muted fs-11 mt-1 mb-0">{dayjs(selectedPres.createdAt).format('DD MMM YYYY')}</p>
                          </div>
                        </div>
                        <div className="table-responsive border bg-white mb-4">
                          <table className="table table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>SNO</th>
                                <th>Medicine Name</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Timings</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPres.medicines?.map((med: any, i: number) => (
                                <tr key={i}>
                                  <td>{i + 1}</td>
                                  <td className="fw-bold">{med.medicineName}</td>
                                  <td>{med.dosage}</td>
                                  <td className="text-primary fw-bold">{med.frequency}</td>
                                  <td>{med.duration}</td>
                                  <td>{med.timings}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-center">
                          <button onClick={() => window.print()} className="btn btn-dark btn-md">
                            <i className="ti ti-printer me-1" /> Print Prescription
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Follow-up Tab */}
              <div className="tab-pane fade" id="followup" role="tabpanel">
                <h5 className="fw-bold mb-4 text-dark">Follow-up Chain</h5>
                <div className="p-0 border-0 bg-transparent">
                  <Datatable
                    columns={followUpColumns}
                    dataSource={sortedChain}
                    Selection={false}
                    searchText=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPresModal && (
        <AddPrescriptionModal
          onClose={() => setShowPresModal(false)}
          onSubmit={handlePresSubmit}
          initialPatientId={appointment.patientId}
          initialDoctorId={appointment.doctorId}
          initialAppointmentId={appointment.id}
          linkedAppointments={chainAppointments}
        />
      )}

      {showNoteModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowNoteModal(false)} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold text-white mb-0">Add Clinical Note</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowNoteModal(false)} />
              </div>
              <div className="modal-body p-4">
                <textarea
                  className="form-control fs-14 text-dark border-primary-light"
                  rows={8}
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="Type assessment findings here..."
                />
              </div>
              <div className="modal-footer bg-light border-top-0 p-3">
                <button className="btn btn-light fw-bold px-4" onClick={() => setShowNoteModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handleNoteSave} disabled={savingNote}>
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Printable Area (Minimal / Hidden) */}
      <div id="print-appointment" style={{ display: 'none' }}>
        <div className="p-4" style={{ width: '21cm', margin: 'auto', background: '#fff' }}>
          <h4 className="text-center fw-bold mb-4">Appointment Summary</h4>
          <div className="row mb-4">
            <div className="col-6">
              <p><strong>Patient:</strong> {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
              <p><strong>Doctor:</strong> {appointment.doctor?.fullName}</p>
            </div>
            <div className="col-6 text-end">
              <p><strong>Date:</strong> {dayjs(appointment.scheduledAt).format('DD MMM YYYY')}</p>
              <p><strong>Status:</strong> {appointment.status}</p>
            </div>
          </div>
          <div className="border-top pt-4">
            <h6>Reason / Observation</h6>
            <p>{appointment.reason || "General visit recorded."}</p>
          </div>
        </div>
      </div>

      <style>{`
                .bg-primary-dark { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); }
                .min-height-200 { min-height: 200px; }
                .btn-xs { padding: 4px 10px; font-size: 11px; border-radius: 6px; }
                .avatar-xxl { width: 64px; height: 64px; }
                .card-decoration-circle { position: absolute; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -50px; right: -50px; }
                .bg-primary-light-large { position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.03); border-radius: 50%; top: -100px; left: -100px; }
            `}</style>
    </div>
  );
};

export default DoctorsAppointmentDetails;
