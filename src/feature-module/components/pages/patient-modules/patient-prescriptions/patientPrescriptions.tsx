import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Select } from "antd";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes, doctorDetailsPath } from "../../../../routes/all_routes";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import Datatable from "../../../../../core/common/dataTable";
import Modals from "./modals/modals";
import Footer from "../../../../../core/common/footer/footer";
import { resolveMediaUrl } from "../../../../../core/config/api";

const PatientPrescriptions = () => {
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

  const { prescriptions, loading } = usePrescriptions();
  const [searchText, setSearchText] = useState<string>("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [datePreset, setDatePreset] = useState("All"); // All, Today, Yesterday, Last 7 Days, Custom

  const doctorsList = useMemo(() => {
    const names = Array.from(new Set(prescriptions.map(p => p.doctor?.fullName || p.doctorName)));
    return names.filter(n => n).sort();
  }, [prescriptions]);

  const data = useMemo(() => prescriptions.map((pres: any) => ({
    ...pres,
    key: pres.id,
    Prescription_ID: pres.prescriptionCode || `#PRES-${pres.id.slice(-4)}`,
    Doctor_Name: pres.doctor?.fullName
      ? (pres.doctor.fullName.startsWith('Dr.') ? pres.doctor.fullName : `Dr. ${pres.doctor.fullName}`)
      : (pres.doctorName || "Doctor"),
    img: pres.doctor?.profileImage || "assets/img/doctor-placeholder.png",
    role: pres.doctor?.designation?.name || pres.doctorRole || "Practitioner",
    Prescribed_On_Date: pres.createdAt ? dayjs(pres.createdAt) : null,
    Prescribed_On: pres.createdAt ? dayjs(pres.createdAt).format('DD MMM YYYY') : "—",
    doctorId: pres.doctorId,
    department: pres.doctor?.department?.name || "General",
  })), [prescriptions]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchSearch = searchText
        ? row.Prescription_ID.toLowerCase().includes(searchText.toLowerCase()) ||
        row.Doctor_Name.toLowerCase().includes(searchText.toLowerCase())
        : true;

      const matchDoctor = filterDoctor
        ? row.Doctor_Name.toLowerCase().includes(filterDoctor.toLowerCase())
        : true;

      // Date Filter Logic
      let matchDate = true;
      const rowDate = row.Prescribed_On_Date;
      if (rowDate) {
        if (datePreset === "Today") {
          matchDate = rowDate.isSame(dayjs(), 'day');
        } else if (datePreset === "Yesterday") {
          matchDate = rowDate.isSame(dayjs().subtract(1, 'day'), 'day');
        } else if (datePreset === "Last 7 Days") {
          matchDate = rowDate.isAfter(dayjs().subtract(7, 'day'));
        } else if (datePreset === "Custom" && filterDate) {
          matchDate = rowDate.format("YYYY-MM-DD") === filterDate;
        }
      }

      return matchSearch && matchDoctor && matchDate;
    });
  }, [data, searchText, filterDoctor, filterDate, datePreset]);

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
      dataIndex: "Prescription_ID",
      sorter: (a: any, b: any) => a.Prescription_ID.localeCompare(b.Prescription_ID),
      render: (text: string, record: any) => (
        <Link to={`${all_routes.patientprescriptiondetails}?id=${record.id}`} className="text-primary fw-bold">
          {text}
        </Link>
      ),
    },
    {
      title: "Doctor Name",
      dataIndex: "Doctor_Name",
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={record.doctorId ? doctorDetailsPath(record.doctorId) : "#"}
            className="avatar avatar-md me-2 border rounded-circle"
          >
            <ImageWithBasePath
              src={record.img.startsWith('assets') || record.img.startsWith('/uploads') || record.img.startsWith('http') ? record.img : `assets/img/doctors/${record.img}`}
              alt="doctor"
              className="rounded-circle"
            />
          </Link>
          <div className="d-flex flex-column">
            <Link
              to={record.doctorId ? doctorDetailsPath(record.doctorId) : "#"}
              className="text-dark fw-bold"
            >
              {text}
            </Link>
            <span className="text-muted fs-11 fw-bold text-uppercase tracking-wider">
              {record.role} · {record.department}
            </span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Doctor_Name.localeCompare(b.Doctor_Name),
    },
    {
      title: "Prescribed On",
      dataIndex: "Prescribed_On",
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text: string) => <span className="fw-bold text-dark">{text}</span>
    },
    {
      title: "Action",
      className: "text-center text-nowrap",
      align: 'center' as const,
      render: (record: any) => {
        const handleDownloadPrescription = () => {
          const pres = record;
          const doctor = pres.doctor || {};
          const patient = pres.patient || {};
          const printWindow = window.open('', '_blank');
          if (!printWindow) return;
          const html = `<html>
            <head>
              <title>Prescription - ${pres.prescriptionCode || 'Record'}</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                .header-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important; color: #fff !important; padding: 24px !important; border-radius: 8px !important; margin-bottom: 25px !important; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .header-banner h4 { color: #fff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                .header-banner h6 { color: #fff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; }
                .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
                .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 700; }
                .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
                .rx-symbol { font-size: 32px; font-weight: 700; color: #1e3a8a; font-family: serif; }
                .med-table th { background: #0f172a !important; color: #fff !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px !important; }
                .med-table td { font-size: 12px; vertical-align: middle; padding: 12px 8px; border-bottom: 1px solid #cbd5e1; color: #0f172a !important; font-weight: 600; }
                .advice-box { padding: 20px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; font-size: 13px; min-height: 80px; border-left: 4px solid #1e3a8a; }
                @media print { body { padding: 0; } .no-print { display: none; } .header-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              <div class="header-banner">
                <div class="d-flex align-items-center gap-3">
                  <div class="logo-box"><img src="${resolveMediaUrl(pres?.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height:55px;max-width:55px;object-fit:contain;"></div>
                  <div>
                    <h4>${pres.clinicName || pres.clinic?.name || "DocYari Health Hub"}</h4>
                    <p>${pres.location || pres.clinic?.landingPage?.address || "Clinic Location"}</p>
                    <h6>${doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : 'Dr. ' + doctor.fullName) : 'Doctor'}</h6>
                    <p>${doctor.designation?.name || "Consultant"} · ${doctor.department?.name || "Medicine"}</p>
                  </div>
                </div>
                <div class="text-end text-white">
                  <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size:12px;border-radius:4px;">${pres.prescriptionCode || "#---"}</span>
                  <div class="small mt-1 opacity-90">
                    <div class="mb-1"><strong>Dept:</strong> ${doctor.department?.name || 'General'}</div>
                    <div><strong>Date:</strong> ${new Date(pres.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>
              <div class="bg-light p-3 rounded mb-4 border d-flex justify-content-between">
                <div><div class="info-label">Patient Name</div><div class="info-value" style="font-size:16px;">${patient.firstName || ''} ${patient.lastName || ''}</div></div>
                <div class="text-center"><div class="info-label">Age / Gender</div><div class="info-value">${patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : '--'}Y / ${patient.gender || '--'}</div></div>
                <div class="text-end"><div class="info-label">Patient ID</div><div class="info-value">${patient.patientCode || 'N/A'}</div></div>
              </div>
              <div class="mb-2 d-flex align-items-center gap-2"><span class="rx-symbol">Rx</span><h6 class="section-title mb-0 border-0">Medication Order</h6></div>
              <table class="table med-table mb-4">
                <thead><tr><th>S.NO</th><th>MEDICINE NAME</th><th>DOSAGE</th><th>FREQUENCY</th><th>DURATION</th><th>TIMINGS</th></tr></thead>
                <tbody>${(pres.medicines || []).map((med: any, i: number) => `<tr><td class="text-muted fw-bold">${String(i + 1).padStart(2, '0')}</td><td class="fw-bold text-dark">${med.medicineName}</td><td>${med.dosage || '—'}</td><td class="fw-bold text-primary">${med.frequency || '—'}</td><td>${med.duration || '—'}</td><td>${med.timings || '—'}</td></tr>`).join('')}</tbody>
              </table>
              ${pres.advice ? `<div class="row mb-5"><div class="col-12"><h6 class="section-title">Instructions &amp; Advice</h6><div class="advice-box">${pres.advice}</div></div></div>` : ''}
              <div class="mt-auto pt-5 text-center border-top">
                <p class="mb-1 fw-bold fs-11 text-muted">2025 &copy; Docyari Clinical Solutions</p>
                <p class="mb-0 italic opacity-50" style="font-size:9px;">This document is digitally signed and valid without a physical rubber stamp.</p>
              </div>
              <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
            </body></html>`;
          printWindow.document.write(html);
          printWindow.document.close();
        };
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <Link
              to={`${all_routes.patientprescriptiondetails}?id=${record.id}`}
              className="text-info p-1"
              title="View"
            >
              <i className="ti ti-eye fs-18" />
            </Link>
            <button className="bg-transparent border-0 text-secondary p-1" onClick={() => window.print()} title="Print">
              <i className="ti ti-printer fs-18" />
            </button>
            <button className="bg-transparent border-0 text-primary p-1" onClick={handleDownloadPrescription} title="Download">
              <i className="ti ti-download fs-18" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-column flex-sm-row justify-content-between pb-3 mb-4 border-bottom gap-3 flex-wrap">
            <h4 className="fw-bold mb-0">My Prescriptions</h4>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {/* Doctor Filter Select */}
              <div className="position-relative" style={{ minWidth: '160px' }}>
                <select
                  className="form-select fs-12 fw-bold border-secondary-subtle bg-white shadow-sm"
                  style={{ height: '36px', borderRadius: '6px' }}
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                >
                  <option value="">All Doctors</option>
                  {doctorsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter Select */}
              <div className="position-relative" style={{ minWidth: '150px' }}>
                <select
                  className="form-select fs-12 fw-bold border-secondary-subtle bg-white shadow-sm"
                  style={{ height: '36px', borderRadius: '6px' }}
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                </select>
              </div>

              {/* Clear Filter Button */}
              {(filterDoctor !== "" || datePreset !== "All") && (
                <button
                  className="btn btn-sm btn-soft-danger d-flex align-items-center justify-content-center p-0 rounded-circle flex-shrink-0 shadow-xs"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => { setFilterDoctor(""); setDatePreset("All"); }}
                  title="Clear Filters"
                >
                  <i className="ti ti-rotate-clockwise fs-14" />
                </button>
              )}
            </div>
          </div>

          <div className="table-responsive bg-white rounded shadow-sm border p-0">
            <Datatable
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              Selection={true}
              searchText={searchText}
            />
          </div>
        </div>

        <Footer />
      </div>

      <Modals />

      <style>{`
        .btn-soft-primary { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; border: none; }
        .btn-soft-primary:hover { background-color: #4f46e5; color: white; }
        .btn-soft-danger { background-color: rgba(220, 38, 38, 0.1); color: #dc2626; border: none; }
        .btn-soft-danger:hover { background-color: #dc2626; color: white; }
        .avatar-md { width: 40px; height: 40px; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      `}</style>
    </>
  );
};

export default PatientPrescriptions;
