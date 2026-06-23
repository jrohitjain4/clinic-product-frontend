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
import AppointmentPrintSlip from "../../clinic-modules/appointments/AppointmentPrintSlip";
import PrescriptionPadSlip from "../../clinic-modules/appointments/PrescriptionPadSlip";

const DoctorsAppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { appointment, loading, error, refetch } = useClinicAppointment(id!);
  const { prescriptions, createPrescription, refetch: refetchPres } = usePrescriptions();

  const [showPresModal, setShowPresModal] = useState(false);
  const [selectedPres, setSelectedPres] = useState<any>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [clinicalNote, setClinicalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
  const [presDropdownOpen, setPresDropdownOpen] = useState(false);



  const { notes, addNote, deleteNote, updateNote } = useNotes({ appointmentId: id });

  // Fetch patient's full history
  const { appointments: history } = useClinicAppointments(
    appointment?.patientId ? { patientId: appointment.patientId } : undefined
  );

  // Fetch all appointments to compute dynamic queue/expected-time ranks
  const { appointments: allAppointments } = useClinicAppointments();

  const slotDetails = useMemo(() => {
      if (!appointment || !allAppointments || allAppointments.length === 0) return { expectedTime: "—", checkinHisNo: "—" };

      const dateStr = dayjs(appointment.scheduledAt).format("YYYY-MM-DD");
      const timeStr = dayjs(appointment.scheduledAt).format("HH:mm");
      const doctorId = appointment.doctorId;

      // Group appointments by doctor, date, and slot time
      const group = allAppointments.filter((a) => {
          const aDate = dayjs(a.scheduledAt).format("YYYY-MM-DD");
          const aTime = dayjs(a.scheduledAt).format("HH:mm");
          return a.doctorId === doctorId && aDate === dateStr && aTime === timeStr;
      }).sort((a, b) => {
          const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (createA !== createB) return createA - createB;
          return (a.id || "").localeCompare(b.id || "");
      });

      const indexInGroup = group.findIndex((item) => item.id === appointment.id);
      const queueNo = indexInGroup !== -1 ? indexInGroup + 1 : 1;

      const slotStartTime = dayjs(appointment.scheduledAt);
      const expectedTime = indexInGroup !== -1
          ? slotStartTime.add(indexInGroup * 15, "minute").format("hh:mm A")
          : slotStartTime.format("hh:mm A");

      const checkinsBefore = indexInGroup !== -1
          ? group.slice(0, indexInGroup).filter((item) => ["Checked In", "Checked Out"].includes(item.status)).length
          : 0;

      const checkinHisNo = `${checkinsBefore} / ${queueNo}`;

      return { expectedTime, checkinHisNo };
  }, [appointment, allAppointments]);

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
      if (editingNote) {
        await updateNote(editingNote.id, {
          content: clinicalNote
        });
        toast.success("Clinical note updated");
      } else {
        await addNote({
          title: "Clinical Note",
          content: clinicalNote,
          priority: "Medium",
          noteDate: new Date().toISOString(),
          appointmentId: id
        });
        toast.success("Clinical note added");
      }
      setClinicalNote("");
      setEditingNote(null);
      setShowNoteModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

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
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
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

  const handlePrescriptionPadPrint = () => {
    const pad = document.getElementById('print-prescription-pad');
    const slip = document.getElementById('print-appointment');
    if (!pad) return;
    pad.style.display = 'block';
    if (slip) slip.setAttribute('data-hidden-for-print', 'true');
    window.print();
    setTimeout(() => {
      pad.style.display = 'none';
      if (slip) slip.removeAttribute('data-hidden-for-print');
    }, 1500);
  };

  const handlePrescriptionPadDownload = () => {
    const element = document.getElementById('print-prescription-pad');
    if (!element || !appointment) return;
    const originalDisplay = element.style.display;
    element.style.display = 'block';
    const opt = {
      margin: 0,
      filename: `Prescription-Pad-${appointment.appointmentCode || 'Record'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        element.style.display = originalDisplay;
      })
      .catch((err: any) => {
        console.error("Prescription Pad PDF failed:", err);
        element.style.display = originalDisplay;
      });
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown")) {
        setPrintDropdownOpen(false);
        setPresDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="content text-center">
          <span className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-bold">Loading Visit Details...</p>
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
          <div className="d-flex align-items-center gap-3">
            <Link to={all_routes.doctorsappointments} className="btn btn-icon btn-light border rounded-circle shadow-sm flex-shrink-0" title="Back to Appointments">
              <i className="ti ti-arrow-left fs-18" />
            </Link>
            <div>
              <h6 className="fw-bold mb-1 d-flex align-items-center text-muted fs-12 text-uppercase">
                <Link to={all_routes.doctorsappointments} className="text-muted hover-primary">Appointments</Link>
                <i className="ti ti-chevron-right mx-2" />
                <span className="text-primary">Appointment Dashboard</span>
              </h6>
              <h3 className="fw-bold mb-0">Visit # {appointment.appointmentCode || id?.slice(-6).toUpperCase()}</h3>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 action-buttons-row">
            <div className="dropdown">
              <button 
                className="btn btn-sm btn-outline-light border bg-white text-dark dropdown-toggle d-flex align-items-center gap-2 fw-bold shadow-sm fs-14" 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setPrintDropdownOpen(!printDropdownOpen);
                  setPresDropdownOpen(false);
                }}
                aria-expanded={printDropdownOpen}
              >
                <i className="ti ti-printer" /> Print/Download
              </button>
              <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${printDropdownOpen ? 'show' : ''}`} style={{ display: printDropdownOpen ? 'block' : 'none' }}>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPrintDropdownOpen(false); window.print(); }}>
                    <i className="ti ti-printer" /> Print
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPrintDropdownOpen(false); handleDownload(); }}>
                    <i className="ti ti-download" /> Download PDF
                  </button>
                </li>
              </ul>
            </div>

            {/* Prescription Pad Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-2 fw-bold shadow-sm fs-14"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPresDropdownOpen(!presDropdownOpen);
                  setPrintDropdownOpen(false);
                }}
                aria-expanded={presDropdownOpen}
              >
                <i className="ti ti-file-text" /> Prescription Pad
              </button>
              <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${presDropdownOpen ? 'show' : ''}`} style={{ display: presDropdownOpen ? 'block' : 'none' }}>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPresDropdownOpen(false); handlePrescriptionPadPrint(); }}>
                    <i className="ti ti-printer" /> Print Prescription Pad
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center gap-2 text-dark fs-14 fw-semibold" onClick={() => { setPresDropdownOpen(false); handlePrescriptionPadDownload(); }}>
                    <i className="ti ti-download" /> Download Prescription PDF
                  </button>
                </li>
              </ul>
            </div>

            <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => setShowPresModal(true)}>
              <i className="ti ti-prescription" /> Add Prescription
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

                <div className="row g-2 text-dark fs-12">
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-user fs-14 text-primary" />
                      <span className="text-black fw-bold">Gender:</span>
                      <span className="text-black fw-bold">{appointment.patient?.gender || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-calendar fs-14 text-primary" />
                      <span className="text-black fw-bold">Age:</span>
                      <span className="text-black fw-bold">{appointment.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')} Yrs` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-droplet fs-14 text-danger" />
                      <span className="text-black fw-bold">Blood:</span>
                      <span className="text-black fw-bold">{appointment.patient?.bloodGroup || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-heart-handshake fs-14 text-primary" />
                      <span className="text-black fw-bold">Marital:</span>
                      <span className="text-black fw-bold">{appointment.patient?.maritalStatus || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-phone-filled fs-14 text-primary" />
                      <span className="text-black fw-bold">Phone:</span>
                      <span className="text-black fw-bold">{appointment.patient?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-start gap-2">
                      <i className="ti ti-map-pin fs-14 text-primary mt-0.5" />
                      <div className="flex-grow-1 lh-sm">
                        <span className="text-black fw-bold d-block fs-10 text-uppercase letter-spacing-1 mb-1">Address</span>
                        <div className="text-black fw-bold mb-1">
                          {[appointment.patient?.address1, appointment.patient?.address2].filter(p => p && p.trim() !== "").join(", ") || "N/A"}
                        </div>
                        <div className="text-black fw-bold">
                          {[appointment.patient?.city, appointment.patient?.state, appointment.patient?.pincode].filter(p => p && p.trim() !== "").join(", ") || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-decoration-circle" />
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

                <div className="row g-2 text-dark fs-12">
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-briefcase fs-14 text-info" />
                      <span className="text-black fw-bold">Exp:</span>
                      <span className="text-black fw-bold">{appointment.doctor?.yearOfExperience ? `${appointment.doctor.yearOfExperience}+ Yrs` : "8+ Yrs"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-building fs-14 text-info" />
                      <span className="text-black fw-bold">Specialty:</span>
                      <span className="text-black fw-bold text-truncate">{appointment.doctor?.department?.name || "General"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-shield-check-filled fs-14 text-info" />
                      <span className="text-black fw-bold">Role:</span>
                      <span className="text-black fw-bold text-truncate">{appointment.doctor?.designation?.name || "Consultant"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-coin fs-14 text-success" />
                      <span className="text-black fw-bold">Fee:</span>
                      <span className="text-black fw-bold">₹{appointment.doctor?.consultationCharge || "500"}</span>
                    </div>
                  </div>

                  {appointment.doctor?.medicalLicenseNumber && (
                    <div className="col-12">
                      <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                        <i className="ti ti-license fs-14 text-info" />
                        <span className="text-black fw-bold">License:</span>
                        <span className="text-black fw-bold">{appointment.doctor.medicalLicenseNumber}</span>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-phone-filled fs-14 text-info" />
                      <span className="text-black fw-bold">Phone:</span>
                      <span className="text-black fw-bold">{appointment.doctor?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="py-2 px-2 bg-light rounded-2 text-black fw-bold d-flex align-items-center gap-2">
                      <i className="ti ti-mail fs-14 text-info" />
                      <span className="text-black fw-bold">Email:</span>
                      <span className="text-black fw-bold text-truncate">{appointment.doctor?.email || "N/A"}</span>
                    </div>
                  </div>
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
                        <span className="badge bg-light text-dark fw-bold fs-10 px-2 py-0.5 border">#{appointment.appointmentCode || "—"}</span>
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

                <div className="row g-2 text-dark fs-12 mb-0">
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-building-hospital fs-14 text-primary" />
                      <span className="text-black fw-bold">Type:</span>
                      <span className="text-primary badge bg-soft-primary fs-11 px-2 py-1 rounded-pill">{appointment.appointmentType || "Routine"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-device-laptop fs-14 text-info" />
                      <span className="text-black fw-bold">Mode:</span>
                      <span className="text-black fw-bold">{appointment.mode || "In-person"}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-clock-hour-4 fs-14 text-info" />
                      <span className="text-black fw-bold">Scheduled Slot:</span>
                      <span className="text-black fw-bold">{formatAppointmentTimeRange(appointment.scheduledAt, appointment.endAt)}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-hourglass-low fs-14 text-warning" />
                      <span className="text-black fw-bold">Expected:</span>
                      <span className="text-black fw-bold">{slotDetails.expectedTime}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-users fs-14 text-success" />
                      <span className="text-black fw-bold">Check-in:</span>
                      <span className="text-black fw-bold">{slotDetails.checkinHisNo}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-building fs-14 text-primary" />
                      <span className="text-black fw-bold">Dept:</span>
                      <span className="text-black fw-bold text-truncate">{appointment.department?.name || "General"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-stopwatch fs-14 text-info" />
                      <span className="text-black fw-bold">Duration:</span>
                      <span className="text-black fw-bold">{appointment.doctor?.appointmentDuration || 30} Mins</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-map-pin fs-14 text-muted" />
                      <span className="text-black fw-bold">Location:</span>
                      <span className="text-black fw-bold text-truncate">{appointment.location || "OPD"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-cash fs-14 text-success" />
                      <span className="text-black fw-bold">Payment:</span>
                      <span className={`badge ${appointment.paymentStatus === 'Paid' ? 'bg-soft-success text-success' : appointment.paymentStatus === 'Free' ? 'bg-soft-info text-info' : 'bg-soft-warning text-warning'} fs-11 px-2 py-1 rounded-pill`}>{appointment.paymentStatus || "Unpaid"}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-start gap-2 py-2 px-2 bg-light rounded-2 text-black fw-bold">
                      <i className="ti ti-notes fs-14 text-muted mt-0.5" />
                      <div className="flex-grow-1 lh-sm">
                        <span className="text-black fw-bold d-block fs-10 text-uppercase letter-spacing-1 mb-1">Reason</span>
                        <span className="text-black fw-bold">{appointment.reason || "General Consultation"}</span>
                      </div>
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
            <ul className="nav nav-pills nav-pills-primary gap-1 mb-3 bg-white p-1 rounded shadow-sm border" role="tablist">
              <li className="nav-item border-0">
                <button className="nav-link active fw-bold py-1 px-3 fs-12 border-0" data-bs-toggle="pill" data-bs-target="#overview" type="button" role="tab">Overview</button>
              </li>
              <li className="nav-item border-0">
                <button className="nav-link fw-bold py-1 px-3 fs-12 border-0" data-bs-toggle="pill" data-bs-target="#prescription" type="button" role="tab">Prescriptions ({linkedPrescriptions.length})</button>
              </li>
              <li className="nav-item border-0">
                <button className="nav-link fw-bold py-1 px-3 fs-12 border-0" data-bs-toggle="pill" data-bs-target="#followup" type="button" role="tab">
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
                      <div className="p-3 bg-light rounded border fs-14 text-dark italic">
                        {appointment.reason || "General Check-up / Consultation"}
                      </div>
                    </div>
                    <div className="mb-0">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-primary mb-0">Physician Notes ({notes.length})</h6>
                        <button className="btn btn-primary btn-xs fw-bold shadow-sm px-3" onClick={() => { setClinicalNote(""); setEditingNote(null); setShowNoteModal(true); }}>
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
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted fs-11 fw-medium text-uppercase me-1">Assessment</span>
                                    <button 
                                      className="btn btn-icon btn-xs btn-soft-primary border-0 p-0" 
                                      style={{ width: '20px', height: '20px' }} 
                                      title="Edit Note" 
                                      onClick={() => { setClinicalNote(note.content); setEditingNote(note); setShowNoteModal(true); }}
                                    >
                                      <i className="ti ti-edit fs-12" />
                                    </button>
                                    <button 
                                      className="btn btn-icon btn-xs btn-soft-danger border-0 p-0" 
                                      style={{ width: '20px', height: '20px' }} 
                                      title="Delete Note" 
                                      onClick={() => { if (window.confirm("Are you sure you want to delete this note?")) deleteNote(note.id); }}
                                    >
                                      <i className="ti ti-trash fs-12" />
                                    </button>
                                  </div>
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
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => { setShowNoteModal(false); setEditingNote(null); }} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold text-white mb-0">{editingNote ? "Edit Clinical Note" : "Add Clinical Note"}</h5>
                <button className="btn-close btn-close-white" onClick={() => { setShowNoteModal(false); setEditingNote(null); }} />
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
                <button className="btn btn-light fw-bold px-4" onClick={() => { setShowNoteModal(false); setEditingNote(null); }}>Cancel</button>
                <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handleNoteSave} disabled={savingNote}>
                  {editingNote ? "Save Changes" : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Printable Appointment Summary */}
      <div id="print-appointment" style={{ display: 'none' }}>
        <AppointmentPrintSlip appointment={appointment} notes={notes} linkedPrescriptions={prescriptions} />
      </div>

      {/* Prescription Pad (pre-printed blank pad) */}
      <div id="print-prescription-pad" style={{ display: 'none' }}>
        <PrescriptionPadSlip appointment={appointment} prescription={selectedPres || linkedPrescriptions?.[0] || null} />
      </div>

      <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { visibility: hidden !important; }
                    #print-appointment:not([data-hidden-for-print]), 
                    #print-appointment:not([data-hidden-for-print]) * {
                        visibility: visible !important;
                    }
                    #print-appointment:not([data-hidden-for-print]) {
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
                    #print-prescription-pad, 
                    #print-prescription-pad * {
                        visibility: visible !important;
                    }
                    #print-prescription-pad {
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
                .btn-xs { padding: 4px 10px; font-size: 11px; border-radius: 6px; }
                .avatar-xxl { width: 64px; height: 64px; }
                .btn-soft-primary { background-color: #4f46e5; color: white; border: none; }
                .btn-soft-primary:hover { background-color: #3730a3; color: white; }
                .btn-soft-info { background-color: #0dcaf0; color: white; border: none; }
                .btn-soft-info:hover { background-color: #0baccc; color: white; }
                .card-decoration-circle { position: absolute; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -50px; right: -50px; }
                .bg-primary-light-large { position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.03); border-radius: 50%; top: -100px; left: -100px; }
                
                .action-buttons-row .btn, .action-buttons-row a.btn {
                    height: 48px !important;
                    padding: 0 24px !important;
                    font-size: 15px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    border-radius: 8px !important;
                    font-weight: 700 !important;
                }
                .action-buttons-row .btn i, .action-buttons-row a.btn i {
                    font-size: 18px !important;
                }
            `}</style>
    </div>
  );
};

export default DoctorsAppointmentDetails;
