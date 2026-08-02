import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import Footer from "../../../../../core/common/footer/footer";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import type { ClinicAppointment } from "../../../../../core/types/clinicAppointment";
import {
  appointmentToTableRow,
  statusBadgeClass,
} from "../../../../../core/utils/appointmentForm";
import Datatable from "../../../../../core/common/dataTable";
import { resolveMediaUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";
import PrescriptionPadSlip from "./PrescriptionPadSlip";
import PrescriptionPad from "./PrescriptionPad";
import AddPrescriptionModal from "../../doctor-modules/doctors-prescriptions/AddPrescriptionModal";

const getInitial = (value?: string) =>
  (value || "").trim().charAt(0).toUpperCase() || "?";

const Consultations = () => {
  const customSelectStyles = `
    .compact-table .ant-table-tbody > tr > td {
      padding: 8px 12px !important;
    }
    .compact-table .avatar-md {
      width: 38px !important;
      height: 38px !important;
    }
    .compact-table .avatar-xs {
      width: 24px !important;
      height: 24px !important;
    }
    .compact-table .card {
      margin-bottom: 0 !important;
      border-radius: 8px !important;
    }

    .print-action-btn {
      width: 48px !important;
      min-width: 48px !important;
      height: 40px !important;
      padding: 0 8px !important;
      border-radius: 10px !important;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06) !important;
      gap: 6px !important;
    }
    .print-action-btn.dropdown-toggle::after {
      margin-left: 2px !important;
      vertical-align: middle !important;
      border-top-width: 0.35em !important;
      border-right-width: 0.35em !important;
      border-left-width: 0.35em !important;
      opacity: 0.75;
    }

    .appointments-filter-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      width: 100%;
      overflow: visible;
    }
    .appointments-filter-line h4 {
      font-size: 16px !important;
      flex-shrink: 0;
      margin: 0 !important;
    }
    .appointments-filter-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1 1 auto;
      min-width: 0;
    }
    .status-buttons-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-left: 0 !important;
    }
    .status-btn {
      padding: 0 8px !important;
      font-weight: 700 !important;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 1px;
      text-wrap: nowrap;
      border-radius: 6px !important;
      height: 32px !important;
      font-size: 11px !important;
    }
    .count-badge {
      font-size: 10px !important;
      padding: 2px 4px !important;
    }
    .follow-up-select-wrapper {
      width: 125px;
      flex-shrink: 0;
    }
    .follow-up-select {
      height: 32px !important;
      font-size: 11px !important;
      font-weight: bold !important;
      padding: 0 34px 0 10px !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      min-width: 140px !important;
      max-width: 190px !important;
      background-position: right 10px center !important;
      background-size: 12px 10px !important;
    }
    .follow-up-select > span {
      display: block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 4px;
    }
    .filter-btn {
      height: 32px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      padding: 0 8px !important;
      font-weight: 700 !important;
      background-color: #fff !important;
      flex-shrink: 0;
    }
    .filter-btn i {
      font-size: 13px !important;
    }
    .clear-filter-btn {
      height: 32px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      padding: 0 8px !important;
      font-weight: 700 !important;
      background-color: #dc3545 !important;
      color: #fff !important;
      border-color: #dc3545 !important;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    @media (min-width: 1400px) {
      .appointments-filter-line {
        gap: 16px;
      }
      .appointments-filter-line h4 {
        font-size: 18px !important;
      }
      .appointments-filter-actions {
        gap: 12px;
      }
      .status-buttons-group {
        gap: 12px;
      }
      .status-btn {
        padding: 0 12px !important;
        height: 36px !important;
        font-size: 12px !important;
        gap: 2px;
      }
      .count-badge {
        font-size: 11px !important;
        padding: 3px 6px !important;
      }
      .follow-up-select-wrapper {
        width: 165px;
      }
      .follow-up-select {
        height: 36px !important;
        font-size: 13px !important;
        padding: 0 36px 0 12px !important;
        min-width: 150px !important;
        max-width: 210px !important;
        background-position: right 12px center !important;
      }
      .filter-btn {
        height: 36px !important;
        font-size: 12px !important;
        padding: 0 12px !important;
      }
      .filter-btn i {
        font-size: 14px !important;
      }
      .clear-filter-btn {
        height: 36px !important;
        font-size: 12px !important;
        padding: 0 12px !important;
      }
    }

    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden !important; }
      #print-prescription-pad[data-print-active],
      #print-prescription-pad[data-print-active] *,
      #print-prescription-slip[data-print-active],
      #print-prescription-slip[data-print-active] * {
        visibility: visible !important;
      }
      #print-prescription-pad[data-print-active] {
        visibility: visible !important;
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: white !important;
        z-index: 99999 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      #print-prescription-slip[data-print-active] {
        visibility: visible !important;
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 210mm !important;
        max-height: 297mm !important;
        height: auto !important;
        overflow: hidden !important;
        background: white !important;
        z-index: 99999 !important;
        padding: 0 !important;
        margin: 0 !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
      #print-prescription-pad:not([data-print-active]),
      #print-prescription-slip:not([data-print-active]),
      [data-hidden-for-print],
      [data-hidden-for-print] * {
        display: none !important;
        visibility: hidden !important;
      }
    }
  `;

  // Fetch appointments and prescriptions
  const { appointments: rawAppointments, loading: loadingAppts, updateAppointmentStatus } = useClinicAppointments();
  const { prescriptions, refetch: refetchPres, createPrescription, updatePrescription } = usePrescriptions();

  // Exclude appointments with status "Schedule" or "Scheduled"
  const appointments = useMemo(() => {
    return rawAppointments.filter(a => a.status !== "Schedule" && a.status !== "Scheduled");
  }, [rawAppointments]);

  const [selectedAppointment, setSelectedAppointment] = useState<ClinicAppointment | null>(null);
  const [showPresModal, setShowPresModal] = useState(false);
  const [showViewPresModal, setShowViewPresModal] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const CONSULTATION_STATUSES = ["Confirmed", "Checked In", "Checked Out", "Cancelled"] as const;

  const handleUpdateStatus = async (appointmentId: string, nextStatus: string) => {
    setStatusUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, nextStatus);
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const [searchText, setSearchText] = useState("");
  const [printAppointment, setPrintAppointment] = useState<any | null>(null);
  const [printPrescription, setPrintPrescription] = useState<any | null>(null);

  const [filterFollowUp, setFilterFollowUp] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [datePreset, setDatePreset] = useState("All"); // All, Today, Yesterday, Last 7 Days, Custom
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");

  const tableData = useMemo(() => {
    // Determine expected queue ranks
    const groups: Record<string, ClinicAppointment[]> = {};

    const sortedAppts = [...appointments].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || "").localeCompare(b.id || "");
    });

    sortedAppts.forEach((a) => {
      const dateStr = dayjs(a.scheduledAt).format("YYYY-MM-DD");
      const timeStr = dayjs(a.scheduledAt).format("HH:mm");
      const key = `${a.doctorId}_${dateStr}_${timeStr}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(a);
    });

    return appointments.map((a, i) => {
      const dateStr = dayjs(a.scheduledAt).format("YYYY-MM-DD");
      const timeStr = dayjs(a.scheduledAt).format("HH:mm");
      const key = `${a.doctorId}_${dateStr}_${timeStr}`;
      const group = groups[key] || [];

      const indexInGroup = group.findIndex((item) => item.id === a.id);
      const queueNo = indexInGroup !== -1 ? indexInGroup + 1 : 1;

      const slotStartTime = dayjs(a.scheduledAt);
      const expectedTime = indexInGroup !== -1
        ? slotStartTime.add(indexInGroup * 15, "minute").format("hh:mm A")
        : slotStartTime.format("hh:mm A");

      const checkinsBefore = indexInGroup !== -1
        ? group.slice(0, indexInGroup).filter((item) => ["Checked In", "Checked Out"].includes(item.status)).length
        : 0;

      const checkinHisNo = `${checkinsBefore} / ${queueNo}`;

      return {
        ...appointmentToTableRow(a, i),
        SrNo: i + 1,
        key: a.id,
        department: a.doctor?.department?.name || "N/A",
        expectedTime,
        checkinHisNo,
        queueNo,
      };
    });
  }, [appointments]);

  // Filter logic
  const filteredSubData = useMemo(() => {
    return tableData.filter((row) => {
      const matchFollowUp = filterFollowUp === "All" || !filterFollowUp
        ? true
        : filterFollowUp === "Free"
          ? row._raw.isFollowUp && row._raw.paymentStatus === "Free"
          : filterFollowUp === "Paid"
            ? row._raw.isFollowUp && row._raw.paymentStatus === "Paid"
            : row._raw.followUpStatus?.toLowerCase() === filterFollowUp.toLowerCase() || (filterFollowUp === "Follow-up" && row._raw.isFollowUp);

      const matchDoctor = filterDoctor
        ? row.Doctor.toLowerCase().includes(filterDoctor.toLowerCase())
        : true;

      // Date Filter
      let matchDate = true;
      const rowDate = dayjs(row._raw.scheduledAt);
      if (datePreset === "Today") {
        matchDate = rowDate.isSame(dayjs(), 'day');
      } else if (datePreset === "Yesterday") {
        matchDate = rowDate.isSame(dayjs().subtract(1, 'day'), 'day');
      } else if (datePreset === "Last 7 Days") {
        matchDate = rowDate.isAfter(dayjs().subtract(7, 'day'));
      } else if (datePreset === "Custom") {
        const rowDateStr = rowDate.format("YYYY-MM-DD");
        if (filterStartDate && filterEndDate) {
          matchDate = rowDateStr >= filterStartDate && rowDateStr <= filterEndDate;
        } else if (filterStartDate) {
          matchDate = rowDateStr >= filterStartDate;
        } else if (filterEndDate) {
          matchDate = rowDateStr <= filterEndDate;
        }
      }

      const matchDept = filterDepartment
        ? row.department.toLowerCase().includes(filterDepartment.toLowerCase())
        : true;
      const matchType = filterType
        ? row.Mode.toLowerCase() === filterType.toLowerCase()
        : true;

      return matchFollowUp && matchDate && matchDept && matchType && matchDoctor;
    });
  }, [tableData, filterFollowUp, filterStartDate, filterEndDate, datePreset, filterDepartment, filterType, filterDoctor]);

  const filteredData = useMemo(() => {
    const list = filteredSubData.filter((row) => {
      const matchStatus = filterStatus === "All" || !filterStatus
        ? true
        : row.Status.toLowerCase() === filterStatus.toLowerCase();
      return matchStatus;
    });

    const isDateFilterActive = datePreset !== "All" || filterStartDate !== "" || filterEndDate !== "";
    if (isDateFilterActive) {
      return [...list].sort((a, b) => {
        const timeA = dayjs(a._raw.scheduledAt).valueOf();
        const timeB = dayjs(b._raw.scheduledAt).valueOf();
        if (timeA !== timeB) return timeA - timeB;
        return (a.queueNo || 1) - (b.queueNo || 1);
      });
    }

    return list;
  }, [filteredSubData, filterStatus, datePreset, filterStartDate, filterEndDate]);

  // Counts for status filters (Excluding "Schedule" dynamically since filteredSubData already excludes it)
  const counts = useMemo(() => {
    return {
      all: filteredSubData.length,
      checkedOut: filteredSubData.filter(a => a._raw.status === "Checked Out").length,
      checkedIn: filteredSubData.filter(a => a._raw.status === "Checked In").length,
      confirmed: filteredSubData.filter(a => a._raw.status === "Confirmed").length,
      cancelled: filteredSubData.filter(a => a._raw.status === "Cancelled").length,
    };
  }, [filteredSubData]);

  const isAnyFilterActive = useMemo(() => {
    return (
      (filterStatus !== "All" && filterStatus !== "") ||
      datePreset !== "All" ||
      filterStartDate !== "" ||
      filterEndDate !== "" ||
      (filterFollowUp !== "All" && filterFollowUp !== "") ||
      filterDepartment !== "" ||
      filterDoctor !== "" ||
      filterType !== ""
    );
  }, [filterStatus, datePreset, filterStartDate, filterEndDate, filterFollowUp, filterDepartment, filterDoctor, filterType]);

  const handleClearFilters = () => {
    setFilterFollowUp("All");
    setFilterStartDate("");
    setFilterEndDate("");
    setDatePreset("All");
    setFilterStatus("All");
    setFilterDepartment("");
    setFilterType("");
    setFilterDoctor("");
  };

  const doctorsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctorName || a.doctor?.fullName)));
    return names.filter(n => n).sort();
  }, [appointments]);

  const departmentsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctor?.department?.name)));
    return names.filter(n => n).sort();
  }, [appointments]);

  const handlePrintPrescription = (appt: any, detailed: boolean = true) => {
    const pres = prescriptions.find(p => p.appointmentId === appt.id || p.appointmentCode === appt.appointmentCode);
    setPrintAppointment(appt);
    setPrintPrescription(detailed && pres ? pres : null);

    // Give state time to update prior to printing
    setTimeout(() => {
      const elementId = detailed && pres ? 'print-prescription-slip' : 'print-prescription-pad';
      const otherId = detailed && pres ? 'print-prescription-pad' : 'print-prescription-slip';
      const el = document.getElementById(elementId);
      const other = document.getElementById(otherId);
      if (!el) return;
      el.style.display = 'block';
      el.setAttribute('data-print-active', 'true');
      el.removeAttribute('data-hidden-for-print');
      if (other) {
        other.setAttribute('data-hidden-for-print', 'true');
        other.removeAttribute('data-print-active');
        other.style.display = 'none';
      }
      window.print();
      setTimeout(() => {
        el.style.display = 'none';
        el.removeAttribute('data-print-active');
        if (other) {
          other.removeAttribute('data-hidden-for-print');
          other.style.display = 'none';
        }
        setPrintAppointment(null);
        setPrintPrescription(null);
      }, 1500);
    }, 300);
  };

  const handleDownloadPrescription = (appt: any, detailed: boolean = true) => {
    const pres = prescriptions.find(p => p.appointmentId === appt.id || p.appointmentCode === appt.appointmentCode);
    setPrintAppointment(appt);
    setPrintPrescription(detailed && pres ? pres : null);

    // Give state time to update prior to downloading
    setTimeout(() => {
      const elementId = detailed && pres ? 'print-prescription-slip' : 'print-prescription-pad';
      const el = document.getElementById(elementId);
      if (!el) return;
      el.style.display = 'block';
      const opt = {
        margin: 0,
        filename: `Prescription-${detailed && pres?.prescriptionCode ? pres.prescriptionCode : (appt.appointmentCode || 'Pad')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all'] as const }
      };
      html2pdf().from(el).set(opt).save().then(() => {
        el.style.display = 'none';
        setPrintAppointment(null);
        setPrintPrescription(null);
      }).catch((err: any) => {
        console.error("PDF Download Error:", err);
        el.style.display = 'none';
        setPrintAppointment(null);
        setPrintPrescription(null);
      });
    }, 300);
  };

  const columns = [
    {
      title: "# / Queue",
      dataIndex: "SrNo",
      render: (text: number, record: any) => {
        const isSlotBooking = !!(record._raw.doctor?.appointmentDuration && record._raw.doctor?.maxBookingsPerSlot);
        return (
          <span className="fw-bold">
            {text} / <span className="text-primary fw-medium">{isSlotBooking ? "Slot" : record.checkinHisNo}</span>
          </span>
        );
      },
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      render: (_: any, record: any) => {
        const dateStr = record._raw.scheduledAt ? dayjs(record._raw.scheduledAt).format("DD MMM YYYY") : "—";
        const timeStr = record._raw.scheduledAt ? dayjs(record._raw.scheduledAt).format("hh:mm A") : "";
        return (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center fw-bold text-dark fs-13">
              <i className="ti ti-calendar-event me-2 text-primary fs-16"></i>
              {dateStr}
            </div>
            {timeStr && (
              <div className="d-flex align-items-center text-muted fs-12 fw-medium">
                <i className="ti ti-clock me-2 fs-16"></i>
                {timeStr}
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Expected Time",
      dataIndex: "expectedTime",
      render: (text: string) => (
        <div className="d-flex align-items-center fw-bold text-dark fs-13">
          <i className="ti ti-clock me-2 text-muted fs-16"></i>
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.patientDetails.replace(":id", record._raw.patientId)} className="avatar avatar-md me-2">
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white"
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                fontSize: "15px",
              }}
            >
              {getInitial(text)}
            </span>
          </Link>
          <div className="lh-1">
            <Link to={all_routes.patientDetails.replace(":id", record._raw.patientId)} className="text-dark fw-bold d-block mb-1 fs-13 text-nowrap">{text}</Link>
            <span className="text-muted fs-11">{record.Phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.doctorsDetails.replace(":id", record._raw.doctorId)} className="avatar avatar-xs me-2">
            <ImageWithBasePath src={record.Doctor_Image} alt="Doctor" className="rounded-circle" />
          </Link>
          <Link to={all_routes.doctorsDetails.replace(":id", record._raw.doctorId)} className="text-dark fw-medium fs-13 text-nowrap">{text}</Link>
        </div>
      ),
    },
    { 
      title: "Mode", 
      dataIndex: "Mode",
      render: (text: string) => {
        const isOnline = (text || "").toLowerCase() === "online";
        return (
          <div className="d-flex align-items-center fw-bold text-dark fs-13">
            <i className={`${isOnline ? 'ti ti-world' : 'ti ti-walk'} me-2 fs-18`} style={{ color: '#6610f2' }}></i>
            {text || "—"}
          </div>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        const s = (text || "").toLowerCase();
        let bg = "#f8f9fa", color = "#6c757d", icon = "ti ti-point";
        if (s.includes("confirmed")) { bg = "#f0eaff"; color = "#6610f2"; icon = "ti ti-circle-check"; }
        else if (s.includes("checked out")) { bg = "#e8f3ff"; color = "#0d6efd"; icon = "ti ti-circle-check"; }
        else if (s.includes("checked in")) { bg = "#fff3cd"; color = "#fd7e14"; icon = "ti ti-clock"; }
        else if (s.includes("schedule")) { bg = "#e7f1ff"; color = "#0d6efd"; icon = "ti ti-calendar"; }
        else if (s.includes("cancel")) { bg = "#fdeded"; color = "#dc3545"; icon = "ti ti-circle-x"; }

        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className="badge px-3 py-2 rounded-pill d-flex align-items-center gap-1" style={{ backgroundColor: bg, color: color, fontWeight: 600, fontSize: '12px' }}>
              <i className={`${icon} fs-14`}></i> {text}
            </span>
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 200,
      align: "center" as const,
      render: (_: any, record: any) => {
        const raw = record._raw;
        const hasPres = prescriptions.some(p => p.appointmentId === raw.id || p.appointmentCode === raw.appointmentCode);
        const currentStatus = raw.status || "";
        const isUpdating = statusUpdatingId === raw.id;
        return (
          <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
            {/* Add / View Prescription */}
            <button
              className={`bg-transparent border-0 p-1 position-relative ${hasPres ? 'text-success' : 'text-primary'}`}
              onClick={() => {
                setSelectedAppointment(raw);
                if (hasPres) {
                  setShowViewPresModal(true);
                } else {
                  setShowPresModal(true);
                }
              }}
              title={hasPres ? "View Prescription" : "Generate Prescription"}
              style={{ transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className="ti ti-prescription fs-18" />
              {hasPres && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-success p-0.5" 
                  style={{ width: '6px', height: '6px' }}
                />
              )}
            </button>

            {/* Update Status */}
            <div className="dropdown d-inline-block">
              <button
                className="btn btn-light border print-action-btn dropdown-toggle d-inline-flex align-items-center justify-content-center gap-1"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Update Status"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="spinner-border spinner-border-sm text-primary" style={{ width: 16, height: 16 }} />
                ) : (
                  <i className="ti ti-refresh fs-18 text-info" />
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-2 fs-12" style={{ zIndex: 1050, minWidth: 160 }}>
                <li className="px-3 pb-1 text-muted fw-semibold" style={{ fontSize: 10, letterSpacing: "0.04em" }}>
                  UPDATE STATUS
                </li>
                {CONSULTATION_STATUSES.map((status) => {
                  const isCurrent = currentStatus === status;
                  return (
                    <li key={status}>
                      <button
                        type="button"
                        className={`dropdown-item py-2 fw-semibold d-flex align-items-center justify-content-between gap-2 ${
                          isCurrent ? "active" : "text-dark"
                        }`}
                        disabled={isCurrent || isUpdating}
                        onClick={() => handleUpdateStatus(raw.id, status)}
                      >
                        <span className="d-flex align-items-center gap-2">
                          <i
                            className={`ti ${
                              status === "Confirmed"
                                ? "ti-circle-check text-primary"
                                : status === "Checked In"
                                ? "ti-login text-warning"
                                : status === "Checked Out"
                                ? "ti-circle-check text-success"
                                : "ti-ban text-danger"
                            } fs-14`}
                          />
                          {status}
                        </span>
                        {isCurrent && <i className="ti ti-check text-success fs-14" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Print/Download Dropdown Option Menu */}
            <div className="dropdown d-inline-block">
              <button
                className="btn btn-light border print-action-btn dropdown-toggle d-inline-flex align-items-center justify-content-center gap-1"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Print / Download Options"
              >
                <i className="ti ti-printer fs-18 text-secondary" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-2 fs-12" style={{ zIndex: 1050 }}>
                {hasPres && (
                  <>
                    <li>
                      <button className="dropdown-item py-2 fw-semibold text-dark d-flex align-items-center gap-2" onClick={() => handlePrintPrescription(raw, true)}>
                        <i className="ti ti-printer text-success fs-14" /> Print Detailed Slip
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item py-2 fw-semibold text-dark d-flex align-items-center gap-2" onClick={() => handleDownloadPrescription(raw, true)}>
                        <i className="ti ti-download text-success fs-14" /> Download Detailed PDF
                      </button>
                    </li>
                    <li className="dropdown-divider" />
                  </>
                )}
                <li>
                  <button className="dropdown-item py-2 fw-semibold text-dark d-flex align-items-center gap-2" onClick={() => handlePrintPrescription(raw, false)}>
                    <i className="ti ti-printer text-secondary fs-14" /> Print Blank Pad
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 fw-semibold text-dark d-flex align-items-center gap-2" onClick={() => handleDownloadPrescription(raw, false)}>
                    <i className="ti ti-download text-secondary fs-14" /> Download Blank Pad PDF
                  </button>
                </li>
              </ul>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="appointments-filter-line pb-3 mb-3 border-bottom">
            <h4 className="fw-bold mb-0 text-dark flex-shrink-0">Consultations</h4>
            <div className="appointments-filter-actions">
              {/* Tab Filters: Checked Out, Checked In, Confirmed, Cancelled */}
              <div className="status-buttons-group">
                {[
                  { key: "All", label: "All", count: counts.all },
                  { key: "Checked Out", label: "Checked Out", count: counts.checkedOut },
                  { key: "Checked In", label: "Checked In", count: counts.checkedIn },
                  { key: "Confirmed", label: "Confirmed", count: counts.confirmed },
                  { key: "Cancelled", label: "Cancelled", count: counts.cancelled }
                ].map((s) => (
                  <button
                    key={s.key}
                    className={`btn btn-sm ${filterStatus === s.key || (s.key === "All" && filterStatus === "") ? "btn-primary shadow-sm" : "btn-light border bg-white"} status-btn`}
                    onClick={() => setFilterStatus(s.key)}
                  >
                    {s.label}
                    <span className={`badge ${filterStatus === s.key || (s.key === "All" && filterStatus === "") ? "bg-white text-primary" : "bg-light text-dark"} ms-1 count-badge`}>
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="dropdown flex-shrink-0">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center text-nowrap follow-up-select"
                  style={{ height: "32px", fontSize: "11px", display: "flex", alignItems: "center", minWidth: "150px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate pe-1">
                    <span className="text-muted"><i className="ti ti-user-heart me-1"></i></span>{" "}
                    {filterDoctor || "Filter Doctor"}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2 animate__animated animate__fadeIn" style={{ minWidth: "200px", maxHeight: "280px", overflowY: "auto", zIndex: 1050 }}>
                  <li>
                    <Link
                      to="#"
                      className={`dropdown-item rounded-1 fs-12 py-2 ${!filterDoctor ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterDoctor("");
                      }}
                    >
                      All Doctors
                    </Link>
                  </li>
                  {doctorsList.map((d) => (
                    <li key={d}>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 fs-12 py-2 ${filterDoctor === d ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDoctor(d || "");
                        }}
                      >
                        {d}
                      </Link>
                    </li>
                  ))}
                  {doctorsList.length === 0 && (
                    <li>
                      <span className="dropdown-item-text text-muted fs-12 py-2">No doctors found</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="dropdown flex-shrink-0">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap follow-up-select"
                  style={{ minWidth: "140px", height: "32px", fontSize: "11px", display: "flex", alignItems: "center" }}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <span className="text-truncate">
                    <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {datePreset === "All" ? "Filter Date" : datePreset}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2 animate__animated animate__fadeIn" style={{ minWidth: "180px", zIndex: 1050 }}>
                  {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1 fs-12 py-2"
                        onClick={(e) => {
                          e.preventDefault();
                          if (preset === "Custom") {
                            e.stopPropagation();
                          }
                          setDatePreset(preset);
                        }}
                      >
                        {preset}
                      </Link>
                    </li>
                  ))}
                  {datePreset === "Custom" && (
                    <li className="p-2 border-top mt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex flex-column gap-1">
                        <label className="text-muted fs-10 fw-bold text-uppercase mb-0">Start Date</label>
                        <input
                          type="date"
                          className="form-control fs-12 px-2 py-1"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="text-muted fs-10 fw-bold text-uppercase mb-0 mt-1">End Date</label>
                        <input
                          type="date"
                          className="form-control fs-12 px-2 py-1"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              {isAnyFilterActive ? (
                <button className="btn btn-sm clear-filter-btn" onClick={handleClearFilters}>
                  <i className="ti ti-refresh" /> Clear
                </button>
              ) : (
                <button className="btn btn-sm btn-light border filter-btn" data-bs-toggle="offcanvas" data-bs-target="#filter_drawer">
                  <i className="ti ti-filter" /> Filter
                </button>
              )}
            </div>
          </div>

          <div className="table-responsive rounded bg-white compact-table" style={{ border: "none", borderRadius: "12px", boxShadow: "none" }}>
            <Datatable
              columns={columns}
              dataSource={filteredData}
              Selection={false}
              searchText={searchText}
              loading={loadingAppts}
              emptyTitle="No Consultations"
              emptyMessage="We couldn't find any consultations matching your filters."
            />
          </div>
        </div>
        <Footer />
      </div>

      {/* Advanced Filter Drawer */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="filter_drawer" aria-labelledby="filter_drawer_label">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="filter_drawer_label">Advanced Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Follow-up Status</label>
            <select className="form-select fs-13" value={filterFollowUp} onChange={(e) => setFilterFollowUp(e.target.value)}>
              <option value="All">Choose Follow-up Status</option>
              <option value="Free">Free Follow-up</option>
              <option value="Paid">Paid Follow-up</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Department</label>
            <select className="form-select fs-13" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Doctor</label>
            <select className="form-select fs-13" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}>
              <option value="">All Doctors</option>
              {doctorsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Date Range</label>
            <select className="form-select fs-13 mb-2" value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Custom">Choose Custom Date</option>
            </select>
            {datePreset === "Custom" && (
              <div className="d-flex gap-1 align-items-center mt-2">
                <input type="date" className="form-control fs-13" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                <span className="text-muted small">to</span>
                <input type="date" className="form-control fs-13" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Appointment Status</label>
            <select className="form-select fs-13" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Checked In">Checked In</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Visit Type (Mode)</label>
            <select className="form-select fs-13" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Walk In">Walk In</option>
              <option value="Online">Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* View existing prescription (print-style slip) */}
      {showViewPresModal && selectedAppointment && (() => {
        const viewPres =
          prescriptions.find(
            (p) =>
              p.appointmentId === selectedAppointment.id ||
              p.appointmentCode === selectedAppointment.appointmentCode
          ) || null;
        if (!viewPres) return null;
        return (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", zIndex: 1060 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowViewPresModal(false);
                setSelectedAppointment(null);
              }
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div
                className="modal-content border-0 shadow-lg"
                style={{ borderRadius: 12, overflow: "hidden" }}
              >
                <div
                  className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        background: "#f3e8ff",
                        color: "#6d28d9",
                      }}
                    >
                      <i className="ti ti-prescription fs-20" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold" style={{ color: "#1e1b4b", fontSize: 18 }}>
                        Prescription
                      </h5>
                      <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                        {selectedAppointment.appointmentCode || "Visit prescription"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewPresModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="d-inline-flex align-items-center justify-content-center text-muted bg-white"
                    aria-label="Close"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <i className="ti ti-x fs-18" />
                  </button>
                </div>

                <div
                  className="px-3 py-3 bg-light"
                  style={{ maxHeight: "70vh", overflowY: "auto" }}
                >
                  <div className="bg-white rounded-3 shadow-sm p-2">
                    <PrescriptionPadSlip
                      appointment={selectedAppointment}
                      prescription={viewPres}
                      suggestIPD={
                        selectedAppointment?.patient?.suggestIPD ||
                        viewPres?.patient?.suggestIPD
                      }
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between gap-2 px-4 py-3 border-top bg-white">
                  <button
                    type="button"
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                    onClick={() => {
                      setShowViewPresModal(false);
                      setShowPresModal(true);
                    }}
                  >
                    <i className="ti ti-edit" />
                    Edit Prescription
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => {
                        setShowViewPresModal(false);
                        setSelectedAppointment(null);
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center gap-2"
                      onClick={() => handlePrintPrescription(selectedAppointment, true)}
                    >
                      <i className="ti ti-printer" />
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Prescription Modal */}
      {showPresModal && selectedAppointment && (() => {
        const existingPrescription = prescriptions.find(p => p.appointmentId === selectedAppointment.id) || null;
        const handlePresSubmit = async (data: any) => {
          if (existingPrescription) {
            await updatePrescription(existingPrescription.id, {
              ...data,
              appointmentId: selectedAppointment.id,
              patientId: selectedAppointment.patientId,
              doctorId: selectedAppointment.doctorId,
            });
          } else {
            await createPrescription({
              ...data,
              appointmentId: selectedAppointment.id,
              patientId: selectedAppointment.patientId,
              doctorId: selectedAppointment.doctorId,
            });
          }
          setShowPresModal(false);
          setSelectedAppointment(null);
          refetchPres();
        };
        return (
          <AddPrescriptionModal
            onClose={() => { setShowPresModal(false); setSelectedAppointment(null); }}
            onSubmit={handlePresSubmit}
            initialPatientId={selectedAppointment.patientId}
            initialDoctorId={selectedAppointment.doctorId}
            initialAppointmentId={selectedAppointment.id}
            linkedAppointments={[selectedAppointment]}
            initialPrescription={existingPrescription}
            appointment={selectedAppointment}
          />
        );
      })()}

      {/* Printable Prescription Pad Slip (detailed with medicines) */}
      {printAppointment && printPrescription && (
        <div id="print-prescription-slip" style={{ display: 'none' }}>
          <PrescriptionPadSlip 
            appointment={printAppointment} 
            prescription={printPrescription} 
            suggestIPD={printAppointment?.patient?.suggestIPD || printPrescription?.patient?.suggestIPD} 
          />
        </div>
      )}

      {/* Printable Prescription Pad (blank pad) */}
      {printAppointment && !printPrescription && (
        <div id="print-prescription-pad" style={{ display: 'none' }}>
          <PrescriptionPad appointment={printAppointment} prescription={null} />
        </div>
      )}
    </>
  );
};

export default Consultations;

