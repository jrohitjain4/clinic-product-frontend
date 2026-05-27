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

  const tableData = useMemo(
    () =>
      doctors.map((d, i) => ({
        key: d.id,
        Name_Designation: d.fullName,
        Department: d.department?.name || "—",
        Phone: d.phone || "—",
        Email: d.email || "—",
        Fees: d.consultationCharge != null ? `$${d.consultationCharge}` : "—",
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
          className={`badge ${
            text === "Available" ? "badge-soft-success" : "badge-soft-danger"
          } border border-success`}
        >
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <div className="action-item me-2">
            <Link to={all_routes.appointmentCalendar}>
              <i className="ti ti-calendar-cog" />
            </Link>
          </div>
          <div className="action-item">
            <Link to="#" data-bs-toggle="dropdown">
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link
                  to={editDoctorPath(record.key)}
                  className="dropdown-item d-flex align-items-center"
                >
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#delete_modal"
                >
                  Delete
                </Link>
              </li>
            </ul>
          </div>
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
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Doctor List
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {loading ? "…" : doctors.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="dropdown me-1">
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
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  to={all_routes.doctorsList}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div>
              <Link to={all_routes.addDoctors} className="btn btn-primary ms-2 fs-13 btn-md">
                <i className="ti ti-plus me-1" />
                New Doctor
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

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="table-search d-flex align-items-center mb-0">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : tableData.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <p className="text-muted mb-3">No doctors found. Add a doctor to get started.</p>
              <Link to={all_routes.addDoctors} className="btn btn-primary">
                Add Doctor
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={false}
                searchText={searchText}
              />
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Preclinic
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
