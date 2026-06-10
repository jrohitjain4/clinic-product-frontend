import { Link } from "react-router";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import { DatePicker, Select } from "antd";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { all_routes, doctorDetailsPath } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import { useState } from "react";
import Datatable from "../../../../../core/common/dataTable";
import Modals from "./modals/modals";
import dayjs from "dayjs";

const PatientPrescriptions = () => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const { prescriptions, loading } = usePrescriptions();
  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const data = prescriptions.map((pres: any) => ({
    ...pres,
    key: pres.id,
    Prescription_ID: pres.prescriptionCode || `#PRES-${pres.id.slice(-4)}`,
    Doctor_Name: pres.doctor?.fullName
      ? (pres.doctor.fullName.startsWith('Dr.') ? pres.doctor.fullName : `Dr. ${pres.doctor.fullName}`)
      : (pres.doctorName || "Doctor"),
    img: pres.doctor?.profileImage || "assets/img/doctor-placeholder.png",
    role: pres.doctor?.designation?.name || pres.doctorRole || "Practitioner",
    Prescribed_On: pres.createdAt ? dayjs(pres.createdAt).format('DD MMM YYYY') : "—",
    doctorId: pres.doctorId,
    department: pres.doctor?.department?.name || "General",
  }));

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
        <Link to={`${all_routes.patientprescriptiondetails}?id=${record.id}`} className="text-primary fw-semibold">
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
            <span className="text-muted fs-11 fw-medium text-uppercase tracking-wider">
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
      render: (text: string) => <span className="fw-medium text-dark">{text}</span>
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
          <button
            className="btn btn-icon btn-sm btn-soft-info"
            title="Download PDF"
            onClick={() => { /* Implement download if needed */ }}
          >
            <i className="ti ti-download" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
            <div>
              <h6 className="fw-bold mb-1 d-flex align-items-center text-muted fs-12 text-uppercase">
                <Link to={all_routes.patientdashboard} className="text-muted hover-primary">Dashboard</Link>
                <i className="ti ti-chevron-right mx-2" />
                <span className="text-primary">Prescriptions</span>
              </h6>
              <h3 className="fw-bold mb-0">My Prescriptions</h3>
            </div>
            <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
              <div className="dropdown me-1">
                <Link
                  to="#"
                  className="btn btn-md border fs-14 fw-bold bg-white rounded text-dark d-inline-flex align-items-center shadow-sm"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-download me-2" />
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2 shadow-lg border-0">
                  <li>
                    <Link className="dropdown-item rounded" to="#">
                      <i className="ti ti-file-type-pdf me-2 text-danger" />
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item rounded" to="#">
                      <i className="ti ti-file-spreadsheet me-2 text-success" />
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="dropdown">
                <Link
                  to="#"
                  className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-bold shadow-sm"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter text-primary me-2" />
                  Filters
                </Link>
                <div
                  className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0 shadow-lg border-0"
                  id="filter-dropdown"
                >
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header p-3">
                    <h5 className="mb-0 fw-bold">Advanced Search</h5>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="link-danger fs-12 text-decoration-underline"
                      >
                        Clear All
                      </Link>
                    </div>
                  </div>
                  <form action="#">
                    <div className="filter-body p-3">
                      <div className="mb-3">
                        <label className="form-label fw-bold text-dark fs-13 mb-1">Doctor</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select Doctor"
                          options={Doctor}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-dark fs-13 mb-1">Department</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select Department"
                          options={Department}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-dark fs-13 mb-1">Date Range</label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control"
                            format="DD-MM-YYYY"
                            placeholder="Select Date"
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top p-3 bg-light">
                      <button type="button" className="btn btn-light btn-md me-2 fw-bold" id="close-filter">Close</button>
                      <button type="submit" className="btn btn-primary btn-md fw-bold px-4">Apply Filters</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-4">
            <div className="search-set w-100 w-md-auto">
              <SearchInput value={searchText} onChange={handleSearch} />
            </div>
          </div>

          <div className="table-responsive bg-white rounded shadow-sm border">
            <Datatable
              columns={columns}
              dataSource={data}
              loading={loading}
              Selection={true}
              searchText={searchText}
            />
          </div>
        </div>

        <div className="footer text-center bg-white p-2 border-top mt-4">
          <p className="text-dark mb-0">
            2025 © <Link to="#" className="link-primary fw-bold">Docyari</Link>, All Rights Reserved
          </p>
        </div>
      </div>

      <Modals />

      <style>{`
        .btn-soft-primary { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; border: none; }
        .btn-soft-primary:hover { background-color: #4f46e5 !color: white; }
        .btn-soft-info { background-color: rgba(13, 202, 240, 0.1); color: #0dcaf0; border: none; }
        .btn-soft-info:hover { background-color: #0dcaf0; color: white; }
        .filter-dropdown { min-width: 350px; }
        .avatar-md { width: 40px; height: 40px; }
        .tracking-wider { letter-spacing: 0.05em; }
        .shadow-sm { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; }
      `}</style>
    </>
  );
};

export default PatientPrescriptions;
