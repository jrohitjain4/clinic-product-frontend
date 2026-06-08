import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Select } from "antd";
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
import { resolveMediaUrl } from "../../../../../core/config/api";

const Appointments = () => {
  // Add direct styling for antd select to match bootstrap buttons
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
  `;

  const { appointments, loading, error, refetch, reload } = useClinicAppointments();
  const [selected, setSelected] = useState<ClinicAppointment | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  // Filters State
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
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
      followUp: appointments.filter(a => a.status === "Follow-up").length,
    };
  }, [appointments]);

  const doctorsList = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctorName || a.doctor.fullName)));
    return names.filter(n => n && n !== "—").sort();
  }, [appointments]);

  const filteredData = useMemo(() => {
    return tableData.filter((row) => {
      const matchDoctor = filterDoctor
        ? row.Doctor.toLowerCase().includes(filterDoctor.toLowerCase())
        : true;
      const matchStatus = filterStatus === "All" || !filterStatus
        ? true
        : row.Status.toLowerCase() === filterStatus.toLowerCase();
      const matchDate = filterDate
        ? row.Date_Time.includes(filterDate)
        : true;
      const matchDept = filterDepartment
        ? row.department.toLowerCase().includes(filterDepartment.toLowerCase())
        : true;
      const matchType = filterType
        ? row.Mode.toLowerCase() === filterType.toLowerCase()
        : true;

      return matchDoctor && matchStatus && matchDate && matchDept && matchType;
    });
  }, [tableData, filterDoctor, filterStatus, filterDate, filterDepartment, filterType]);

  const handlePrintAppointment = (a: ClinicAppointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Appointment Summary - ${a.appointmentCode || 'Record'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            body { background: #fff; padding: 40px; font-family: 'Inter', sans-serif; color: #000; }
            .logo-box { width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff; }
            .patient-infobar { background: #f8f9fa; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; margin-bottom: 30px; }
            .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
            @media print { .no-print { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="d-flex justify-content-between align-items-start mb-4">
            <div class="d-flex gap-3">
              <div class="logo-box" style="width: 80px; height: 80px; border: 1px dashed #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff;">
                <img src="${resolveMediaUrl(a.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 60px; max-width: 60px; object-fit: contain;">
              </div>
              <div>
                <h4 class="fw-bold mb-1 mt-1" style="font-size: 20px;">${a.clinic?.name || a.clinicName || "DocYari Clinical Network"}</h4>
                <p class="mb-1 text-muted small"><i class="ti ti-map-pin"></i> ${a.clinic?.landingPage?.address || a.location || "Clinic Address"}</p>
                <h6 class="fw-bold mb-0" style="font-size: 14px;">${a.doctorName || a.doctor?.fullName}</h6>
                <p class="text-muted small mb-0">${a.doctor?.designation?.name || "Consultant"} · ${a.doctor?.department?.name || "Medicine"}</p>
              </div>
            </div>
            <div class="text-end">
              <span class="badge bg-white text-primary border border-primary-subtle fw-bold px-3 py-2 mb-2" style="font-size: 11px; border-radius: 4px;">
                ${a.appointmentCode || "#---"}
              </span>
              <div class="text-muted small mt-1">
                <div class="mb-1 text-dark"><strong>Dept:</strong> ${a.doctor?.department?.name || "General"}</div>
                <div class="text-dark"><strong>Date:</strong> ${new Date(a.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <h6 class="fw-bold text-uppercase border-bottom pb-2" style="font-size: 10px; color: #64748b; letter-spacing: 1px;">Patient Clinical Profile</h6>
            <table class="table table-bordered mb-0" style="font-size: 11px; border-color: #cbd5e1;">
              <thead style="background: #1e293b;">
                <tr>
                  <th class="py-3 text-white">PATIENT NAME</th>
                  <th class="py-3 text-center text-white">AGE / GENDER</th>
                  <th class="py-3 text-center text-white">BLOOD GROUP</th>
                  <th class="py-3 text-center text-white">PATIENT ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-3 fw-bold text-primary" style="font-size: 14px;">${a.patientName}</td>
                  <td class="py-3 text-center fw-bold text-dark">${a.patient?.dob ? Math.floor((new Date().getTime() - new Date(a.patient.dob).getTime()) / 31557600000) : '--'}Y / ${a.patient?.gender || '--'}</td>
                  <td class="py-3 text-center fw-bold text-dark">${a.patient?.bloodGroup || 'N/A'}</td>
                  <td class="py-3 text-center fw-bold text-dark">${a.patient?.patientCode || a.patientId?.slice(-6).toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-center mb-4 pt-3">
            <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #1e293b; display: inline-block; padding-bottom: 8px;">
              Clinical Appointment Summary
            </h5>
          </div>

          <div class="mb-4">
            <h6 class="fw-bold text-uppercase border-bottom pb-2" style="font-size: 10px; color: #64748b; letter-spacing: 1px;">Appointment Registration Details</h6>
            <table class="table table-bordered mb-0" style="font-size: 11px; border-color: #cbd5e1;">
              <thead style="background: #1e293b;">
                <tr>
                  <th class="py-3 text-center text-white fw-bold">S.NO</th>
                  <th class="py-3 text-white fw-bold">APPOINT ID</th>
                  <th class="py-3 text-white fw-bold">PATIENT NAME</th>
                  <th class="py-3 text-white fw-bold">DOCTOR NAME</th>
                  <th class="py-3 text-center text-white fw-bold">MODE</th>
                  <th class="py-3 text-center text-white fw-bold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-3 text-center text-muted fw-bold">01</td>
                  <td class="py-3 fw-bold text-dark">${a.appointmentCode}</td>
                  <td class="py-3 fw-bold text-primary">${a.patientName}</td>
                  <td class="py-3 fw-bold text-dark">${a.doctorName || a.doctor?.fullName}</td>
                  <td class="py-3 text-center fw-bold text-dark">${a.mode}</td>
                  <td class="py-3 text-center"><span class="badge bg-light text-dark border px-2 py-1 text-uppercase" style="font-size: 10px;">${a.status}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mb-5">
            <h6 class="fw-bold text-uppercase border-bottom pb-2" style="font-size: 10px; color: #64748b; letter-spacing: 1px;">Clinical Findings / Assessment</h6>
            <div style="padding: 15px; border: 1px solid #e2e8f0; background: #fff; min-height: 120px; line-height: 1.6; font-size: 13px;">
              ${a.reason || "Patient presented for follow-up review. Clinical status stable."}
            </div>
          </div>

          <div class="mt-auto pt-4 border-top text-center text-muted small">
            <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #4f46e5;">Docyari</span>, All Rights Reserved</p>
            <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated clinical summary and does not require a physical signature.</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
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

          <script>
            // Auto-print disabled to allow direct PDF download option
            // window.onload = () => { setTimeout(() => { window.print(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const columns = [
    {
      title: "Sr No",
      dataIndex: "SrNo",
      render: (text: number) => <span className="fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.patientDetails.replace(":id", record._raw.patientId)} className="avatar avatar-md me-2">
            <ImageWithBasePath src={record.Patient_Image} alt="Patient" className="rounded-circle" />
          </Link>
          <div>
            <Link to={all_routes.patientDetails.replace(":id", record._raw.patientId)} className="text-dark fw-bold d-block">{text}</Link>
            <span className="text-muted fs-12">{record.Phone}</span>
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
          <Link to={all_routes.doctorsDetails.replace(":id", record._raw.doctorId)} className="text-dark fw-medium">{text}</Link>
        </div>
      ),
    },
    { title: "Mode", dataIndex: "Mode" },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => {
        const raw = record._raw;
        const payStatus = raw?.followUpPaymentStatus;
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge ${statusBadgeClass(text)}`}>{text}</span>
            {text === "Follow-up" && payStatus && (
              <span className={`badge fs-10 ${payStatus === "Free" ? "badge-soft-success" : payStatus === "Paid" ? "badge-soft-info" : "badge-soft-danger"}`}>
                {payStatus === "Free" ? "Free" : payStatus === "Paid" ? "₹ Paid" : "₹ Unpaid"}
              </span>
            )}
            {raw?.parentAppointment?.appointmentCode && (
              <small className="text-muted fs-10">
                <i className="ti ti-link me-1" />{raw.parentAppointment.appointmentCode}
              </small>
            )}
          </div>
        );
      },
    },
    {
      title: "Action",
      className: "text-center",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center gap-1 justify-content-center">
          <Link to={all_routes.appointmentDetails.replace(":id", record._raw.id)} className="btn btn-icon btn-sm btn-soft-info"><i className="ti ti-eye" /></Link>
          <Link to={all_routes.editAppointment.replace(":id", record._raw.id)} className="btn btn-icon btn-sm btn-soft-primary"><i className="ti ti-edit" /></Link>
          <button className="btn btn-icon btn-sm btn-soft-secondary" onClick={() => handlePrintAppointment(record._raw)}><i className="ti ti-printer" /></button>
          <button className="btn btn-icon btn-sm btn-soft-danger" data-bs-toggle="modal" data-bs-target="#delete_appointment_modal" onClick={() => setSelected(record._raw)}><i className="ti ti-trash" /></button>
        </div>
      )
    }
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center pb-3 mb-3 border-bottom overflow-hidden" style={{ gap: '16px' }}>
            <h4 className="fw-bold mb-0 flex-shrink-0">Appointment</h4>
            <div className="d-flex align-items-center flex-nowrap" style={{ gap: '16px' }}>
              {["All", "Schedule", "Confirmed", "Checked In"].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-2 fs-12 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                  onClick={() => setFilterStatus(s)}
                  style={{ borderRadius: '6px', height: '36px' }}
                >
                  {s === "Checked In" ? "Check-in" : s}
                  <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                    {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Follow-up" ? counts.followUp : counts.checkedIn}
                  </span>
                </button>
              ))}
            </div>

            <div className="d-flex align-items-center" style={{ gap: '16px' }}>
              <div className="position-relative" style={{ width: '175px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', paddingLeft: '35px', fontSize: '13px', fontWeight: 'bold' }}
                  placeholder="Search Doctor..."
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                />
                <i className="ti ti-search position-absolute top-50 translate-middle-y text-muted" style={{ left: '12px', fontSize: '14px' }} />
              </div>
              <button className="btn btn-sm btn-light border d-flex align-items-center gap-2 fw-bold fs-12 flex-shrink-0 shadow-sm bg-white" style={{ height: '36px', borderRadius: '6px' }} data-bs-toggle="offcanvas" data-bs-target="#filter_drawer">
                <i className="ti ti-filter fs-14" /> Filter
              </button>
            </div>

            <Link to={all_routes.newAppointment} className="btn btn-sm btn-primary fw-bold fs-12 d-flex align-items-center shadow-sm flex-shrink-0 text-nowrap" style={{ height: '36px', borderRadius: '6px' }}>
              <i className="ti ti-plus me-1" /> New Appointment
            </Link>
          </div>

          <div className="table-responsive border rounded bg-white shadow-sm">
            <Datatable columns={columns} dataSource={filteredData} Selection={true} onSelectionChange={(keys: any) => setSelectedIds(keys as string[])} searchText={searchText} />
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
            <label className="form-label fw-bold small">Department</label>
            <input type="text" className="form-control fs-13" placeholder="Search Department" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small">Doctor</label>
            <input type="text" className="form-control fs-13" placeholder="Search Doctor" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small">Date</label>
            <input type="date" className="form-control fs-13" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small">Status</label>
            <select className="form-select fs-13" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Schedule">Schedule</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small">Type (Mode)</label>
            <select className="form-select fs-13" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="In-person">In-person</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <hr />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold" onClick={() => {
              setFilterDoctor(""); setFilterDate(""); setFilterStatus("All"); setFilterDepartment(""); setFilterType("");
            }}>Clear All Filters</button>
            <button className="btn btn-soft-info fw-bold" onClick={handleDownloadCopy}><i className="ti ti-download me-2" />Download Appointments</button>
            <button className="btn btn-soft-success fw-bold" onClick={handleExportCSV}><i className="ti ti-file-export me-2" />Export to CSV</button>
          </div>
        </div>
      </div>

      <AppointmentsModals selected={selected} onClear={() => setSelected(null)} onDeleted={refetch} />
    </>
  );
};

export default Appointments;
