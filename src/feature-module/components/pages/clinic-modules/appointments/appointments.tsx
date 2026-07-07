import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Select } from "antd";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import Footer from "../../../../../core/common/footer/footer";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import type { ClinicAppointment } from "../../../../../core/types/clinicAppointment";
import {
  appointmentToTableRow,
  statusBadgeClass,
} from "../../../../../core/utils/appointmentForm";
import Datatable from "../../../../../core/common/dataTable";
import AppointmentsModals from "./appointmentsModals";
import { resolveMediaUrl, apiUrl } from "../../../../../core/config/api";
import { apiDelete, authHeaders } from "../../../../../core/utils/apiClient";
import { toast } from "react-toastify";
import AppointmentPrintSlip from "./AppointmentPrintSlip";

const Appointments = () => {
  const customSelectStyles = `
    .custom-select-header .ant-select-selector {
      border-color: #dee2e6 !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      color: #333 !important;
      background-color: #fff !important;
    }
    .custom-select-header .ant-select-selection-placeholder {
      font-weight: 700 !important;
      color: #6c757d !important;
    }
    .compact-table .ant-table-tbody > tr > td {
      padding: 8px 12px !important; /* Further reduced padding */
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

    /* Appointments responsive filter line classes */
    .appointments-filter-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      width: 100%;
    }
    .appointments-filter-line h4 {
      font-size: 16px !important;
    }
    .status-buttons-group {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 4px;
      margin-left: auto !important;
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
      padding: 0 24px 0 8px !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      overflow: hidden !important;
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
    .new-appointment-btn {
      height: 32px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      padding: 0 10px !important;
      font-weight: 700 !important;
      white-space: nowrap;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    /* Standard large screen (100% zoom / wide screen) styling */
    @media (min-width: 1400px) {
      .appointments-filter-line {
        gap: 16px;
      }
      .appointments-filter-line h4 {
        font-size: 18px !important;
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
        padding: 0 24px 0 12px !important;
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
      .new-appointment-btn {
        height: 36px !important;
        font-size: 12px !important;
        padding: 0 12px !important;
      }
    }

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
  `;

  const { appointments, loading, error, refetch, reload, updateAppointmentStatus } = useClinicAppointments();
  const [selected, setSelected] = useState<ClinicAppointment | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [printAppointment, setPrintAppointment] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (printAppointment) {
      const handleAfterPrint = () => {
        setPrintAppointment(null);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
      window.addEventListener("afterprint", handleAfterPrint);

      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [printAppointment]);

  const handleStatusToggle = async (appointmentId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "Schedule") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Checked In";
    else if (currentStatus === "Checked In") nextStatus = "Checked Out";

    if (nextStatus) {
      setTogglingId(appointmentId);
      const startTime = Date.now();
      try {
        await updateAppointmentStatus(appointmentId, nextStatus);
        toast.success(`Appointment marked as ${nextStatus}`);
      } catch (err) {
        console.error("Error updating status:", err);
        toast.error("Failed to update status");
      } finally {
        const elapsedTime = Date.now() - startTime;
        const minDelay = 400; // minimum duration to let transition animate smoothly
        if (elapsedTime < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsedTime));
        }
        setTogglingId(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} appointments?`)) return;
    try {
      for (const id of selectedIds) {
        await apiDelete(`/api/appointments/${id}`);
      }
      setSelectedIds([]);
      toast.success(`${selectedIds.length} appointments deleted successfully.`);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete some appointments.");
    }
  };

  const [filterPatient, setFilterPatient] = useState("");
  const [filterFollowUp, setFilterFollowUp] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [datePreset, setDatePreset] = useState("All"); // All, Today, Yesterday, Last 7 Days, Custom
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSession, setFilterSession] = useState("All");
  const [sessionOptions, setSessionOptions] = useState<{ value: string, label: string, from: string, to: string }[]>([]);

  const selectedDoctorId = useMemo(() => {
    if (!filterDoctor) return "";
    return appointments.find(a => (a.doctorName || a.doctor?.fullName) === filterDoctor)?.doctorId || "";
  }, [filterDoctor, appointments]);

  const filterTargetDate = useMemo(() => {
    if (datePreset === "Today") return dayjs().format("YYYY-MM-DD");
    if (datePreset === "Yesterday") return dayjs().subtract(1, "day").format("YYYY-MM-DD");
    if (datePreset === "Custom" && filterStartDate) return filterStartDate;
    return "";
  }, [datePreset, filterStartDate]);

  useEffect(() => {
    if (selectedDoctorId && filterTargetDate) {
      const start = dayjs(filterTargetDate).startOf("day").toISOString();
      const end = dayjs(filterTargetDate).endOf("day").toISOString();
      fetch(apiUrl(`/api/doctors/${selectedDoctorId}/availability?startDate=${start}&endDate=${end}`), {
        headers: authHeaders(),
      })
        .then(r => r.json())
        .then(data => {
          const dayName = dayjs(filterTargetDate).format("dddd");
          const daySchedule = data.schedules?.[dayName] || [];
          const isSlotBookingActive = !!(data.duration && data.duration > 0 && data.maxBookingsPerSlot && data.maxBookingsPerSlot > 0);

          if (isSlotBookingActive) {
            const duration = data.duration;
            const opts: any[] = [];
            daySchedule.forEach((session: any) => {
              let currentSlot = dayjs(session.from, "HH:mm");
              const sessionEnd = dayjs(session.to, "HH:mm");

              while (currentSlot.isBefore(sessionEnd)) {
                const slotTime = currentSlot.format("HH:mm");
                const label = currentSlot.format("hh:mm A");
                opts.push({
                  value: slotTime,
                  label: label,
                  from: slotTime,
                  to: slotTime,
                });
                currentSlot = currentSlot.add(duration, "minute");
              }
            });
            setSessionOptions(opts);
          } else {
            const opts = daySchedule.map((session: any, idx: number) => {
              const sessionLabel = session.label || (idx === 0 ? "Morning Session" : idx === 1 ? "Evening Session" : `Session ${idx + 1}`);
              const fromFormatted = dayjs(session.from, "HH:mm").format("hh:mm A");
              const toFormatted = dayjs(session.to, "HH:mm").format("hh:mm A");
              return {
                value: session.from,
                label: `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
                from: session.from,
                to: session.to
              };
            });
            setSessionOptions(opts);
          }
        })
        .catch(err => {
          console.error("Error loading sessions in filter:", err);
          setSessionOptions([]);
        });
    } else {
      setSessionOptions([]);
      setFilterSession("All");
    }
  }, [selectedDoctorId, filterTargetDate]);

  const tableData = useMemo(() => {
    // Group all appointments by doctor, date, and slot time to determine queue ranks
    const groups: Record<string, ClinicAppointment[]> = {};

    const sortedAppts = [...appointments].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createA !== createB) return createA - createB;
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

  // Status Counts
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

      // Date Filter Logic
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

      let matchSession = true;
      if (filterSession !== "All" && sessionOptions.length > 0) {
        const activeSession = sessionOptions.find(opt => opt.value === filterSession);
        if (activeSession) {
          const apptTime = dayjs(row._raw.scheduledAt).format("HH:mm");
          matchSession = apptTime >= activeSession.from && apptTime <= activeSession.to;
        }
      }

      return matchFollowUp && matchDate && matchDept && matchType && matchDoctor && matchSession;
    });
  }, [tableData, filterFollowUp, filterStartDate, filterEndDate, datePreset, filterDepartment, filterType, filterDoctor, filterSession, sessionOptions]);

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

  const counts = useMemo(() => {
    return {
      all: filteredSubData.length,
      schedule: filteredSubData.filter(a => a._raw.status === "Schedule").length,
      confirmed: filteredSubData.filter(a => a._raw.status === "Confirmed").length,
      checkedIn: filteredSubData.filter(a => a._raw.status === "Checked In").length,
      checkedOut: filteredSubData.filter(a => a._raw.status === "Checked Out").length,
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
      filterType !== "" ||
      filterSession !== "All"
    );
  }, [filterStatus, datePreset, filterStartDate, filterEndDate, filterFollowUp, filterDepartment, filterDoctor, filterType, filterSession]);

  const handleClearFilters = () => {
    setFilterFollowUp("All");
    setFilterStartDate("");
    setFilterEndDate("");
    setDatePreset("All");
    setFilterStatus("All");
    setFilterDepartment("");
    setFilterType("");
    setFilterDoctor("");
    setFilterSession("All");
  };

  const doctorsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctorName || a.doctor?.fullName)));
    return names.filter(n => n && n !== "—").sort();
  }, [appointments]);

  const departmentsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctor?.department?.name)));
    return names.filter(n => n).sort();
  }, [appointments]);

  const handlePrintAppointment = (a: any) => {
    setPrintAppointment(a);
  };

  const handleExportCSV = () => {
    const headers = ["Sr No", "Date & Time", "Patient", "Doctor", "Department", "Mode", "Status"];
    const csvData = filteredData.map(row => [
      row.SrNo, row.Date_Time, row.Patient, row.Doctor, row.department, row.Mode, row.Status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "appointments_report.csv";
    link.click();
  };

  const handleDownloadCopy = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = `
  < html >
        <head>
          <title>Appointments Report</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            body { padding: 40px; background: #fff; font-family: 'Inter', sans-serif; color: #1e293b; }
            .report-header { border-bottom: 3px solid #4f46e5; margin-bottom: 30px; padding-bottom: 20px; }
            th { background-color: #1e293b !important; color: #ffffff !important; text-transform: uppercase; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-color: #334155 !important; }
            td { font-size: 12px; vertical-align: middle; border-color: #e2e8f0 !important; color: #475569; }
            .fw-heavy { font-weight: 800; color: #0f172a; }
            .badge-custom { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; border: 1px solid #cbd5e1; background: #f8fafc; }
            @media print { body { padding: 1.5cm; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom">
            <div class="d-flex gap-3">
              <div style="width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff;">
                <img src="${resolveMediaUrl(appointments[0]?.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 60px; max-width: 60px; object-fit: contain;">
              </div>
              <div>
                <h4 class="fw-bold mb-1 mt-1" style="color: #000; font-size: 24px;">${appointments[0]?.clinic?.name || appointments[0]?.clinicName || "DocYari Clinic"}</h4>
                <p class="mb-1 text-muted small"><i class="ti ti-map-pin"></i> ${appointments[0]?.clinic?.landingPage?.address || appointments[0]?.location || "Clinic Address"}</p>
                <h6 class="fw-bold fs-14 mb-0 text-dark">APPOINTMENTS MASTER LEDGER</h6>
                <p class="text-primary small fw-bold mb-0">TOTAL RECORDS: ${filteredData.length}</p>
              </div>
            </div>
            <div class="text-end">
              <span class="badge bg-dark text-white fw-bold px-3 py-2 mb-2" style="font-size: 11px; border-radius: 4px; letter-spacing: 1px;">
                GEN_ID_${new Date().getTime().toString().slice(-6)}
              </span>
              <div class="text-muted small mt-1">
                <div class="mb-1 text-dark"><strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div class="text-dark"><strong>Domain:</strong> Healthcare Master Log</div>
              </div>
            </div>
          </div>

          <table class="table table-bordered shadow-sm">
            <thead>
              <tr>
                <th class="py-3 px-3 text-center">SR NO</th>
                <th class="py-3 px-3">DATE & TIME</th>
                <th class="py-3 px-3">PATIENT NAME</th>
                <th class="py-3 px-3">CONSULTING DOCTOR</th>
                <th class="py-3 px-3 text-center">MODE</th>
                <th class="py-3 px-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(r => `
                <tr style="background: ${r.SrNo % 2 === 0 ? '#fcfcfc' : '#ffffff'};">
                  <td class="text-center fw-heavy">#${r.SrNo}</td>
                  <td class="fw-bold text-dark">${r.Date_Time}</td>
                  <td class="fw-heavy text-primary" style="font-size: 13px;">${r.Patient}</td>
                  <td class="fw-bold">${r.Doctor}</td>
                  <td class="text-center fw-medium">${r.Mode}</td>
                  <td class="text-center"><span class="badge-custom text-uppercase">${r.Status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="mt-5 pt-4 text-center border-top text-muted small">
            <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #4f46e5;">Docyari</span>, All Rights Reserved</p>
            <p class="mt-1 opacity-50" style="font-size: 10px;">End of Report. Confidential Clinical Document.</p>
          </div>

          <script>
            // Auto-print disabled to allow direct PDF download option
            // window.onload = () => {setTimeout(() => { window.print(); }, 500); };
    </script>
  </body>
      </html >
  `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const columns = [
    {
      title: "Sr / Queue",
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
          <div className="d-flex flex-column" style={{ lineHeight: '1.2' }}>
            <span className="fw-medium text-dark text-nowrap">{dateStr}</span>
            {timeStr && <span className="text-muted fs-11 mt-1 text-nowrap">{timeStr}</span>}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Expected Time",
      dataIndex: "expectedTime",
      render: (text: string) => <span className="fw-bold text-dark">{text}</span>,
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.patientDetails.replace(":id", record._raw.patientId)} className="avatar avatar-md me-2">
            <ImageWithBasePath src={record.Patient_Image} alt="Patient" className="rounded-circle" />
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
    { title: "Mode", dataIndex: "Mode" },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => {
        const raw = record._raw;
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge ${statusBadgeClass(text)} `}>{text}</span>
            {["Schedule", "Confirmed", "Checked In"].includes(text) && (
              <div className="form-check form-switch p-0 ms-2" style={{ minHeight: 'auto' }}>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  checked={togglingId === raw.id}
                  onChange={() => handleStatusToggle(raw.id, text)}
                  style={{ cursor: 'pointer', width: '30px', height: '16px' }}
                />
                <label className="text-black fw-bold small ms-1" style={{ fontSize: '10px' }}>
                  {text === "Schedule" ? "Confirm" : text === "Confirmed" ? "Checkin" : "Checkout"}
                </label>
              </div>
            )}
            {raw?.isFollowUp && (
              <div className="mt-1">
                <span className="text-muted fw-bold" style={{ fontSize: '10px' }}>
                  {raw.followUpStatus || "Follow-up"}
                </span>
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <Link to={all_routes.appointmentDetails.replace(":id", record._raw.id)} className="text-info p-1" title="View"><i className="ti ti-eye fs-18" /></Link>
          <button className="bg-transparent border-0 text-secondary p-1" onClick={() => handlePrintAppointment(record._raw)} title="Print"><i className="ti ti-printer fs-18" /></button>
          <button className="bg-transparent border-0 text-danger p-1" data-bs-toggle="modal" data-bs-target="#delete_appointment_modal" onClick={() => setSelected(record._raw)} title="Delete"><i className="ti ti-trash fs-18" /></button>
        </div>
      )
    }
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="appointments-filter-line pb-3 mb-3 border-bottom">
            <h4 className="fw-bold mb-0 text-dark flex-shrink-0">Appointment</h4>
            <div className="status-buttons-group ms-auto">
              {["All", "Schedule", "Confirmed", "Checked In"].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "") ? "btn-primary shadow-sm" : "btn-light border bg-white"} status-btn`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                  <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "") ? "bg-white text-primary" : "bg-light text-dark"} ms-1 count-badge`}>
                    {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Checked In" ? counts.checkedIn : appointments.filter(a => a.status === s).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="dropdown">
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

            <Link to={all_routes.newAppointment} className="btn btn-sm btn-primary new-appointment-btn">
              <i className="ti ti-plus me-1" /> New Appointment
            </Link>
          </div>

          <div className="table-responsive border rounded bg-white compact-table">
            <Datatable
              columns={columns}
              dataSource={filteredData}
              Selection={true}
              onSelectionChange={(keys: any) => setSelectedIds(keys as string[])}
              searchText={searchText}
              loading={loading}
              emptyTitle="No Appointments Scheduled"
              emptyMessage="We couldn't find any appointments matching your current filters. You can try adjusting the date range or follow-up status."
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-3 pb-3">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 shadow"
                onClick={handleBulkDelete}
                style={{ borderRadius: '8px', minHeight: '40px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
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
              <option value="Schedule">Schedule</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
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

          {sessionOptions.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase">Session / Shift</label>
              <select className="form-select fs-13" value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
                <option value="All">All Sessions</option>
                {sessionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <hr />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold py-2" onClick={() => {
              setFilterFollowUp("All"); setFilterDate(""); setFilterStartDate(""); setFilterEndDate(""); setDatePreset("All"); setFilterStatus("All"); setFilterDepartment(""); setFilterType(""); setFilterDoctor(""); setFilterSession("All");
            }}>
              <i className="ti ti-refresh me-2" />Clear All Filters
            </button>
            <button className="btn btn-soft-info fw-bold py-2" onClick={handleDownloadCopy}><i className="ti ti-download me-2" />Download Ledger</button>
            <button className="btn btn-soft-success fw-bold py-2" onClick={handleExportCSV}><i className="ti ti-file-export me-2" />Export CSV</button>
          </div>
        </div>
      </div>

      {printAppointment && (
        <div id="print-appointment" style={{ display: 'none' }}>
          <AppointmentPrintSlip appointment={printAppointment} />
        </div>
      )}

      <AppointmentsModals selected={selected} onClear={() => setSelected(null)} onDeleted={refetch} />
    </>
  );
};

export default Appointments;
