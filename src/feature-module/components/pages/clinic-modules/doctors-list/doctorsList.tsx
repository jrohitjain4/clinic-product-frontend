import { Select } from "antd";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes, doctorDetailsPath, editDoctorPath } from "../../../../routes/all_routes";
import { useMemo, useState } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import Modals from "../doctors/modals/modals";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";

const PLACEHOLDER_IMAGES = [
  "doctor-01.jpg",
  "doctor-02.jpg",
  "doctor-03.jpg",
  "doctor-04.jpg",
  "doctor-05.jpg",
];

const DoctorsList = () => {
  const { doctors, loading, error, refetch } = useClinicDoctors();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const tableData = useMemo(
    () =>
      doctors.map((d, i) => ({
        key: d.id,
        Name_Designation: d.fullName,
        Department: d.department?.name || "",
        Phone: d.phone || "",
        Email: d.email || "",
        Fees: d.consultationCharge != null ? `$${d.consultationCharge}` : "",
        Status: d.status === "Active" ? "Available" : d.status,
        img:
          d.profileImage ||
          `assets/img/doctors/${PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]}`,
      })),
    [doctors]
  );

  const columns = [
    {
      title: "Name & Designation",
      dataIndex: "Name_Designation",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link to={doctorDetailsPath(record.key)} className="avatar me-2">
            <ImageWithBasePath
              src={record.img}
              alt="Doctor"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="mb-1 fs-14 fw-semibold">
              <Link to={doctorDetailsPath(record.key)}>{text}</Link>
            </h6>
            <span className="fs-13 d-block">{record.Department}</span>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Name_Designation.localeCompare(b.Name_Designation),
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Department.localeCompare(b.Department),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Phone.localeCompare(b.Phone),
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Email.localeCompare(b.Email),
    },
    {
      title: "Fees",
      dataIndex: "Fees",
      render: (text: string) => <h6 className="fs-14 fw-semibold mb-0">{text}</h6>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Fees.localeCompare(b.Fees),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Available" ? "badge-soft-success" : "badge-soft-danger"
            } border border-success`}
        >
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "right",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="text-end d-flex align-items-center justify-content-end gap-2">
          <Link
            to={all_routes.appointmentCalendar}
            className="btn btn-icon btn-sm btn-soft-info"
            title="Appointment Calendar"
          >
            <i className="ti ti-calendar-cog"></i>
          </Link>
          <Link
            to={doctorDetailsPath(record.key)}
            className="btn btn-icon btn-sm btn-soft-secondary"
            title="View Doctor"
          >
            <i className="ti ti-eye"></i>
          </Link>
          <Link
            to={editDoctorPath(record.key)}
            className="btn btn-icon btn-sm btn-soft-primary"
            title="Edit Doctor"
          >
            <i className="ti ti-edit"></i>
          </Link>
          <button
            className="btn btn-icon btn-sm btn-soft-danger"
            title="Delete Doctor"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
          >
            <i className="ti ti-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0">
                Doctor List
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {loading ? "" : doctors.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex align-items-center gap-2">
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={all_routes.doctorsList}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
              <div className="dropdown">
                <Link
                  to="#"
                  className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter text-gray-5 me-1" />
                  Filters
                </Link>
                <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                    <h4 className="mb-0">Filter</h4>
                    <Link to="#" className="link-danger text-decoration-underline">
                      Clear All
                    </Link>
                  </div>
                  <form action="#">
                    <div className="filter-body pb-0">
                      <div className="mb-3">
                        <label className="form-label">Doctor</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          options={Doctor}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Designation</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          options={Designation}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Department</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          options={Department}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          options={Amount}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Please select"
                          options={Status}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <Link to="#" className="btn btn-light btn-md me-2">
                        Close
                      </Link>
                      <button type="submit" className="btn btn-primary btn-md">
                        Filter
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <Link 
                to={all_routes.addDoctors} 
                className="btn btn-primary d-flex align-items-center justify-content-center ms-1"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
              >
                New Doctor <i className="fa fa-plus ms-2" />
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetch}>
                Retry
              </button>
            </div>
          )}



          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : tableData.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <p className="text-muted mb-3">No doctors found. Add a doctor to get started.</p>
              <Link 
                to={all_routes.addDoctors} 
                className="btn btn-primary d-flex align-items-center justify-content-center ms-1"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
              >
                New Doctor <i className="fa fa-plus ms-2" />
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={true}
                searchText={searchText}
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}
          
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_modal"
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
      <Modals />
    </>
  );
};

export default DoctorsList;
