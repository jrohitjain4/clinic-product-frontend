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
    const printWindow = window.open('', '_blank');
    if (!printWindow || !appointment) return;

    const html = `<html>
        <head>
          <title>Clinical Summary - ${appointment.appointmentCode || 'Record'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            body { background: #fff; padding: 40px; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }
            .report-header { border-bottom: 2px solid #4f46e5; margin-bottom: 30px; padding-bottom: 20px; }
            .logo-box { width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff; }
            .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px; font-size: 11px; color: #64748b; letter-spacing: 1px; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 700; }
            .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
            .badge-status { padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; border: 1px solid #cbd5e1; }
            .clinical-box { padding: 20px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; font-size: 13px; line-height: 1.6; min-height: 100px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="d-flex justify-content-between align-items-start report-header">
            <div class="d-flex gap-3">
              <div class="logo-box">
                <img src="${resolveMediaUrl((appointment as any)?.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 60px; max-width: 60px; object-fit: contain;">
              </div>
              <div>
                <h4 class="fw-bold mb-1" style="color: #1e293b; font-size: 22px;">${appointment.clinicName || "DocYari Health Hub"}</h4>
                <p class="mb-1 text-muted small"><i class="ti ti-map-pin"></i> ${appointment.location || "Clinic Address"}</p>
                <div class="d-flex gap-2">
                   <p class="mb-0 small fw-bold text-primary">ID: ${appointment.appointmentCode || "#---"}</p>
                   <p class="mb-0 small text-muted">|</p>
                   <p class="mb-0 small text-muted">Domain: Clinical Portal</p>
                </div>
              </div>
            </div>
            <div class="text-end">
               <div class="info-label">Report Date</div>
               <div class="info-value mb-2">${dayjs().format('DD MMM YYYY')}</div>
               <span class="badge-status bg-light text-primary border-primary">OFFICIAL RECORD</span>
            </div>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-6">
              <h6 class="section-title">Patient Profile</h6>
              <div class="p-3 border rounded shadow-sm">
                <div class="row g-3">
                  <div class="col-12">
                    <div class="info-label">Full Name</div>
                    <div class="info-value" style="font-size: 15px; color: #4f46e5;">${appointment.patient?.firstName} ${appointment.patient?.lastName}</div>
                  </div>
                  <div class="col-6">
                    <div class="info-label">Age / Gender</div>
                    <div class="info-value">${appointment.patient?.dob ? dayjs().diff(appointment.patient.dob, 'year') : '--'}Y / ${appointment.patient?.gender || '--'}</div>
                  </div>
                  <div class="col-6">
                    <div class="info-label">Blood Group</div>
                    <div class="info-value">${appointment.patient?.bloodGroup || 'N/A'}</div>
                  </div>
                  <div class="col-12">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${appointment.patient?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6">
              <h6 class="section-title">Consulting Practitioner</h6>
              <div class="p-3 border rounded shadow-sm">
                <div class="row g-3">
                  <div class="col-12">
                    <div class="info-label">Practitioner Name</div>
                    <div class="info-value" style="font-size: 15px;">${appointment.doctor?.fullName?.startsWith('Dr.') ? appointment.doctor.fullName : `Dr. ${appointment.doctor?.fullName}`}</div>
                  </div>
                  <div class="col-6">
                    <div class="info-label">Specialization</div>
                    <div class="info-value">${appointment.doctor?.department?.name || 'General'}</div>
                  </div>
                  <div class="col-6">
                    <div class="info-label">Experience</div>
                    <div class="info-value">${appointment.doctor?.yearOfExperience || '8'}+ Years</div>
                  </div>
                  <div class="col-12">
                    <div class="info-label">Facility Location</div>
                    <div class="info-value">${appointment.location || 'Preclinic Main Tower'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <h6 class="section-title">Appointment Summary</h6>
            <div class="table-responsive">
              <table class="table table-bordered border-light-subtle">
                <thead class="table-light">
                  <tr style="font-size: 10px;">
                    <th class="py-2">VISIT TYPE</th>
                    <th class="py-2">MODE</th>
                    <th class="py-2">SCHEDULED ON</th>
                    <th class="py-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="align-middle">
                    <td class="py-3 fw-bold">${appointment.appointmentType || 'Routine Consultation'}</td>
                    <td class="py-3 fw-bold">${appointment.mode}</td>
                    <td class="py-3 fw-bold">${dayjs(appointment.scheduledAt).format('DD MMM YYYY, hh:mm A')}</td>
                    <td class="py-3 text-center"><span class="badge-status bg-success-subtle text-success border-success">${appointment.status}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mb-5">
            <h6 class="section-title">Clinical Findings & Notes</h6>
            <div class="clinical-box">
              <div class="fw-bold mb-2 text-primary">Reason for Visit:</div>
              <p class="mb-3">${appointment.reason || "General Patient Assessment"}</p>
              
              ${notes.length > 0 ? `
                <div class="fw-bold mb-2 text-primary">Clinical Assessment:</div>
                <div class="ps-3 border-start border-3 border-primary-subtle">
                  ${notes.map(n => `<p class="mb-2 italic">"${n.content}" <span class="text-muted small">(${dayjs(n.createdAt).format('DD MMM')})</span></p>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="mt-auto pt-5 text-center border-top">
            <p class="mb-1 fw-bold fs-11 text-muted text-uppercase letter-spacing-1">Generated via Docyari PHR System</p>
            <div class="d-flex justify-content-center gap-5 mt-4">
                <div class="text-center">
                    <p class="info-label mb-1">Authorised Signatory</p>
                    <p class="fw-bold small mb-0">${appointment.doctor?.fullName?.startsWith('Dr.') ? appointment.doctor.fullName : `Dr. ${appointment.doctor?.fullName}`}</p>
                </div>
            </div>
            <p class="mb-0 text-muted small mt-4">This is a system generated document. For any discrepancies, please contact the clinic.</p>
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
      title: "Reason",
      dataIndex: "reason",
      render: (text: string) => (
        <span title={text}>{truncateReason(text || "General Consultation")}</span>
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
                      <span className="text-black fw-bold fs-11">#{appointment.patient?.patientCode || appointment.patientId?.slice(-6).toUpperCase()}</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-2 fs-18">{appointment.patient?.firstName} {appointment.patient?.lastName}</h5>

                    <div className="d-flex flex-wrap gap-x-3 gap-y-1 mb-3">
                      <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                        <i className="ti ti-user fs-14 text-primary" />
                        <span>{appointment.patient?.gender || "N/A"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                        <i className="ti ti-calendar fs-14 text-primary" />
                        <span>{appointment.patient?.dob ? `${dayjs().diff(appointment.patient.dob, 'year')} Yrs` : "N/A"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                        <i className="ti ti-droplet fs-14 text-danger" />
                        <span>{appointment.patient?.bloodGroup || "O+"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between pt-2">
                      <div className="flex-grow-1">
                        <p className="text-black fw-bold fs-13 mb-1 d-flex align-items-center gap-1">
                          <i className="ti ti-phone-filled fs-14 text-primary" />
                          {appointment.patient?.phone || "N/A"}
                        </p>
                      </div>
                      <div className="text-end bg-light p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                        <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Insurance</p>
                        <span className="badge bg-soft-success text-success fs-10 fw-bold border-0 p-0 text-uppercase">Verified ✓</span>
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
              <div className="card-decoration-circle" />
            </div>
          </div>

          {/* Doctor Info */}
          <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-12">
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
                      <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                        <i className="ti ti-briefcase fs-14 text-info" />
                        <span>{appointment.doctor?.yearOfExperience || "8"}+ Yrs Exp</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-black fw-bold fs-12">
                        <i className="ti ti-building fs-14 text-info" />
                        <span>{appointment.doctor?.department?.name || "General"}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between pt-2">
                      <div className="flex-grow-1">
                        <div className="text-black fw-bold fs-13 mb-1 d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '120px' }}>
                          <i className="ti ti-shield-check-filled fs-14 text-info" />
                          {appointment.doctor?.designation?.name || "Consultant"}
                        </div>
                      </div>
                      <div className="text-end bg-info-soft p-2 rounded-3 border-dashed-1 flex-shrink-0" style={{ minWidth: '100px' }}>
                        <p className="fs-10 text-uppercase fw-bold text-black mb-0 letter-spacing-1" style={{ fontSize: '9px' }}>Availability</p>
                        <span className="fs-11 fw-bold text-info d-flex align-items-center gap-1 justify-content-end">
                          <span className="pulse-dot-info" /> AVAILABLE
                        </span>
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
                </div>
              </div>
              <div className="card-decoration-circle bg-info-light" />
            </div>
          </div>

          {/* Slot Details */}
          <div className="col-xxl-4 col-xl-12 col-lg-12 col-md-12">
            <div className="card shadow-sm border rounded-4 mb-0 h-100 overflow-hidden bg-white border-primary-light hover-shadow transition-all position-relative">
              <div className="card-body p-4 position-relative z-index-1">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex flex-column gap-1">
                    <div className="badge bg-soft-primary text-primary fw-bold text-uppercase fs-10 tracking-wider px-2 py-1" style={{ width: 'fit-content' }}>Visit Slot</div>
                    {appointment.isFollowUp && (
                      <span className="badge bg-soft-success text-success fw-bold text-uppercase fs-10 tracking-wider px-2 py-1 animate__animated animate__pulse animate__infinite">Follow-up ✓</span>
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
                  <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '140px' }}>
                    <i className="ti ti-map-pin text-muted fs-14" />
                    <span className="text-muted fs-12 fw-medium text-truncate">{appointment.location || "Room 102, OPD"}</span>
                  </div>
                  <div className={`${appointment.isFollowUp && appointment.paymentStatus === 'Unpaid' ? 'bg-danger-soft' : 'bg-success-soft'} px-2 py-1 rounded-2 border-dashed flex-shrink-0`}>
                    <span className={`fs-10 fw-bold ${appointment.isFollowUp && appointment.paymentStatus === 'Unpaid' ? 'text-danger' : 'text-success'} text-uppercase`}>
                      Payment: {appointment.isFollowUp ? (appointment.paymentStatus || 'FREE').toUpperCase() : 'PAID'} {appointment.paymentStatus === 'Unpaid' ? '✗' : '✓'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="fs-10 fw-bold text-muted text-uppercase">Support:</span>
                    <span className="fs-11 fw-bold text-primary">+1 (800) MED-HELP</span>
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
                          <button onClick={() => window.print()} className="btn btn-md btn-dark d-flex align-items-center">
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

      <style>{`
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
