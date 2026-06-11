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
      className: "text-center",
      align: 'center' as const,
      render: (record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-1">
          <Link
            to={`${all_routes.patientprescriptiondetails}?id=${record.id}`}
            className="btn btn-icon btn-sm btn-soft-primary"
            title="View Details"
          >
            <i className="ti ti-eye" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <style>{customSelectStyles}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center pb-3 mb-4 border-bottom overflow-hidden" style={{ gap: '16px' }}>
            <h4 className="fw-bold mb-0 flex-shrink-0">My Prescriptions</h4>

            <div className="ms-auto d-flex align-items-center" style={{ gap: '12px' }}>
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
