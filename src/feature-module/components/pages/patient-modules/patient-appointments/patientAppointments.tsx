import { useMemo, useState } from "react";
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
import Modals from "./modals/modals";
import { resolveMediaUrl } from "../../../../../core/config/api";

const PatientAppointments = () => {
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
  `;

  const { appointments, loading, refetch } = useClinicAppointments();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  const [filterFollowUp, setFilterFollowUp] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [datePreset, setDatePreset] = useState("All"); // All, Today, Yesterday, Last 7 Days, Custom
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterType, setFilterType] = useState("");

  const tableData = useMemo(
    () => appointments.map((a, i) => ({
      ...appointmentToTableRow(a, i),
      SrNo: i + 1,
      key: a.id,
      department: a.doctor?.department?.name || "N/A"
    })),
    [appointments]
  );

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      schedule: appointments.filter(a => a.status === "Schedule").length,
      confirmed: appointments.filter(a => a.status === "Confirmed").length,
      checkedIn: appointments.filter(a => a.status === "Checked In").length,
      checkedOut: appointments.filter(a => a.status === "Checked Out").length,
      cancelled: appointments.filter(a => a.status === "Cancelled").length,
    };
  }, [appointments]);

  const doctorsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctorName || a.doctor?.fullName)));
    return names.filter(n => n && n !== "—").sort();
  }, [appointments]);

  const departmentsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctor?.department?.name)));
    return names.filter(n => n).sort();
  }, [appointments]);

  const filteredData = useMemo(() => {
    return tableData.filter((row) => {
      const matchFollowUp = filterFollowUp === "All" || !filterFollowUp
        ? true
        : filterFollowUp === "Free"
          ? row._raw.isFollowUp && row._raw.paymentStatus === "Free"
          : filterFollowUp === "Paid"
            ? row._raw.isFollowUp && row._raw.paymentStatus === "Paid"
            : row._raw.followUpStatus?.toLowerCase() === filterFollowUp.toLowerCase() || (filterFollowUp === "Follow-up" && row._raw.isFollowUp);

      const matchStatus = filterStatus === "All" || !filterStatus
        ? true
        : row.Status.toLowerCase() === filterStatus.toLowerCase();

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
      } else if (datePreset === "Custom" && filterDate) {
        matchDate = rowDate.format("YYYY-MM-DD") === filterDate;
      }

      const matchDept = filterDepartment
        ? row.department.toLowerCase().includes(filterDepartment.toLowerCase())
        : true;
      const matchType = filterType
        ? row.Mode.toLowerCase() === filterType.toLowerCase()
        : true;

      return matchFollowUp && matchStatus && matchDate && matchDept && matchType && matchDoctor;
    });
  }, [tableData, filterFollowUp, filterStatus, filterDate, datePreset, filterDepartment, filterType, filterDoctor]);

  const handlePrintAppointment = (a: ClinicAppointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<html>
        <head>
          <title>Appointment Summary - ${a.appointmentCode || 'Record'}</title>
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
            .table-bordered th { background: #0f172a !important; color: #ffffff !important; border: 2px solid #0f172a !important; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; padding: 12px 10px !important; }
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
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="d-flex align-items-center gap-3">
              <div class="logo-box">
                <img src="${resolveMediaUrl(a.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
              </div>
              <div>
                <h4>${a.clinic?.name || a.clinicName || "DocYari Clinical Network"}</h4>
                <p><i class="ti ti-map-pin"></i> ${a.clinic?.landingPage?.address || a.location || "Clinic Address"}</p>
                <h6>${a.doctorName || a.doctor?.fullName}</h6>
                <p>${a.doctor?.designation?.name || "Consultant"} · ${a.doctor?.department?.name || "Medicine"}</p>
              </div>
            </div>
            <div class="text-end text-white">
              <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${a.appointmentCode || "#---"}
              </span>
              <div class="small mt-1 opacity-90">
                <div class="mb-1"><strong>Dept:</strong> ${a.doctor?.department?.name || "General"}</div>
                <div><strong>Date:</strong> ${new Date(a.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
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
                  <td class="text-primary" style="font-size: 15px; font-weight: 700;">${a.patientName}</td>
                  <td class="text-center">${a.patient?.dob ? Math.floor((new Date().getTime() - new Date(a.patient.dob).getTime()) / 31557600000) : '--'}Y / ${a.patient?.gender || '--'}</td>
                  <td class="text-center">${a.patient?.bloodGroup || 'N/A'}</td>
                  <td class="text-center">${a.patient?.patientCode || a.patientId?.slice(-6).toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-center mb-4 pt-3">
            <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #0f172a; display: inline-block; padding-bottom: 8px;">
              Clinical Appointment Summary
            </h5>
          </div>

          <div class="mb-4">
            <h6 class="section-title">Appointment Registration Details</h6>
            <table class="table table-bordered mb-0">
              <thead>
                <tr>
                  <th class="text-center text-white">S.NO</th>
                  <th class="text-white">APPOINT ID</th>
                  <th class="text-white">PATIENT NAME</th>
                  <th class="text-white">DOCTOR NAME</th>
                  <th class="text-center text-white">MODE</th>
                  <th class="text-center text-white">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center text-muted">01</td>
                  <td>${a.appointmentCode}</td>
                  <td class="text-primary" style="font-weight: 700;">${a.patientName}</td>
                  <td>${a.doctorName || a.doctor?.fullName}</td>
                  <td class="text-center">${a.mode}</td>
                  <td class="text-center"><span class="badge bg-dark text-white border px-3 py-1 text-uppercase" style="font-size: 10px; font-weight: 700;">${a.status}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mb-5">
            <h6 class="section-title">Clinical Findings / Assessment</h6>
            <div class="clinical-findings">
              ${a.reason || "Patient presented for follow-up review. Clinical status stable."}
            </div>
          </div>

          <div class="mt-auto pt-4 border-top text-center text-muted small">
            <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #1e3a8a;">Docyari</span>, All Rights Reserved</p>
            <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated clinical summary and does not require a physical signature.</p>
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
  <html>
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
        </body>
      </html>
  `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const columns = [
    {
      title: "Sr / Queue",
      dataIndex: "SrNo",
      render: (text: number, record: any) => {
        return (
          <span className="fw-bold">
            {text} / <span className="text-primary fw-medium">{record._raw.checkinHisNo || "NULL"}</span>
          </span>
        );
      },
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      render: (_: any, record: any) => {
        const dateStr = record._raw.scheduledAt ? dayjs(record._raw.scheduledAt).format("DD MMM YYYY") : "NULL";
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
      render: (_: any, record: any) => <span className="fw-bold text-dark">{record._raw.expectedTime || "NULL"}</span>,
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.patientappointmentdetails.replace(":id", record._raw.id)} className="avatar avatar-xs me-2">
            <ImageWithBasePath src={record.Doctor_Image} alt="Doctor" className="rounded-circle" />
          </Link>
          <Link to={all_routes.patientappointmentdetails.replace(":id", record._raw.id)} className="text-dark fw-medium fs-13 text-nowrap">{text}</Link>
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
          <div className="d-flex flex-column align-items-start">
            <span className={`badge ${statusBadgeClass(text)} `}>{text}</span>
            {raw?.isFollowUp && (
              <div className="mt-1">
                <span className={`text-muted fw-bold`} style={{ fontSize: '10px' }}>
                  {raw.followUpStatus || "Follow-up"}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <Link to={all_routes.patientappointmentdetails.replace(":id", record._raw.id)} className="text-info p-1" title="View"><i className="ti ti-eye fs-18" /></Link>
          <button className="bg-transparent border-0 text-secondary p-1" onClick={() => handlePrintAppointment(record._raw)} title="Print"><i className="ti ti-printer fs-18" /></button>
          <button className="bg-transparent border-0 text-danger p-1" data-bs-toggle="modal" data-bs-target="#delete_appointment_modal" onClick={() => setSelectedIds([record._raw.id])} title="Delete"><i className="ti ti-trash fs-18" /></button>
        </div>
      )
    }
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center flex-wrap pb-3 mb-3 border-bottom gap-2">
            <h4 className="fw-bold mb-0 me-2 flex-shrink-0">Appointment</h4>
            {["All", "Schedule", "Confirmed"].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-2 fs-12 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                onClick={() => setFilterStatus(s)}
                style={{ borderRadius: '6px', height: '36px' }}
              >
                {s}
                <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                  {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : appointments.filter(a => a.status === s).length}
                </span>
              </button>
            ))}

            <div className="position-relative" style={{ width: '185px' }}>
              <select
                className="form-select fs-13"
                style={{ height: '36px', fontSize: '13px', fontWeight: 'bold' }}
                value={filterFollowUp}
                onChange={(e) => setFilterFollowUp(e.target.value)}
              >
                <option value="All">Follow-up Status</option>
                <option value="Free">Free Follow-up</option>
                <option value="Paid">Paid Follow-up</option>
              </select>
            </div>
            <div className="position-relative" style={{ width: '185px' }}>
              <select
                className="form-select fs-13"
                style={{ height: '36px', fontSize: '13px', fontWeight: 'bold' }}
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
              >
                <option value="">All Doctors</option>
                {doctorsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-sm btn-light border text-danger d-flex align-items-center gap-2 fw-bold fs-12 flex-shrink-0 shadow-sm bg-white hover-bg-light" 
              style={{ height: '36px', borderRadius: '6px' }} 
              onClick={() => {
                setFilterFollowUp("All"); 
                setFilterStatus("All"); 
                setFilterDoctor(""); 
                setDatePreset("All"); 
                setFilterDate(""); 
                setFilterDepartment(""); 
                setFilterType("");
              }}
            >
              <i className="ti ti-refresh fs-14" /> Clear
            </button>

            <Link to={all_routes.newAppointment} className="btn btn-sm btn-primary ms-auto flex-shrink-0 d-flex align-items-center gap-2 fw-bold" style={{ height: '36px', borderRadius: '6px' }}>
              <i className="ti ti-plus fs-14" /> New Appointment
            </Link>
          </div>

          <div className="compact-table">
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
              <input type="date" className="form-control fs-13" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
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
              <option value="In-person">In-person</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <hr />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold py-2" onClick={() => {
              setFilterFollowUp("All"); setFilterDate(""); setDatePreset("All"); setFilterStatus("All"); setFilterDepartment(""); setFilterType(""); setFilterDoctor("");
            }}>
              <i className="ti ti-refresh me-2" />Clear All Filters
            </button>
            <button className="btn btn-soft-info fw-bold py-2" onClick={handleDownloadCopy}><i className="ti ti-download me-2" />Download Ledger</button>
            <button className="btn btn-soft-success fw-bold py-2" onClick={handleExportCSV}><i className="ti ti-file-export me-2" />Export CSV</button>
          </div>
        </div>
      </div>

      <Modals />
    </>
  );
};

export default PatientAppointments;
