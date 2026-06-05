import { DatePicker, Select } from "antd";
import { Link, useLocation } from "react-router";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes, doctorDetailsPath } from "../../../../routes/all_routes";
import { useState } from "react";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import Datatable from "../../../../../core/common/dataTable";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Modals from "./modals/modals";

const PatientDoctors = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clinicId = queryParams.get("clinicId") || undefined;

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const { doctors, loading } = useClinicDoctors(clinicId);
  const data = doctors.map((doctor) => ({
    id: doctor.id,
    Doctor_Name: doctor.fullName,
    img: doctor.profileImage || "doctor-01.jpg",
    role: doctor.designation?.name || doctor.department?.name || "Doctor",
    Phone: doctor.phone || "—",
    Last_Visit: "No visits yet", // Placeholder as visit history is not in the basic doctor object
  }));
  const columns = [
    {
      title: "Doctor Name",
      dataIndex: "Doctor_Name",
      render: (text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={doctorDetailsPath(render.id)}
            className="avatar avatar-md me-2"
          >
            <ImageWithBasePath
              src={render.img.startsWith('assets') || render.img.startsWith('/uploads') || render.img.startsWith('http') ? render.img : `assets/img/doctors/${render.img}`}
              alt="doctor"
              className="rounded-circle"
            />
          </Link>
          <Link
            to={doctorDetailsPath(render.id)}
            className="text-dark fw-semibold"
          >
            {text}
            <span className="text-body fs-13 fw-normal d-block">
              {render.role}
            </span>
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.Doctor_Name.length - b.Doctor_Name.length,
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: any, b: any) => a.Phone.length - b.Phone.length,
    },
    {
      title: "Last Visit",
      dataIndex: "Last_Visit",
      sorter: (a: any, b: any) => a.Last_Visit.length - b.Last_Visit.length,
    },
    {
      title: "",
      render: () => (
        <div>
          <>
            <Link
              to={all_routes.patientappointmentdetails}
              className="border p-1 rounded-3 fs-13 text-body d-inline-flex align-items-center justify-content-center"
            >
              <i className="ti ti-calendar-cog" />
            </Link>
            <Link
              to="#"
              data-bs-toggle="dropdown"
              className="avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent"
            >
              <i className="ti ti-dots-vertical" />
            </Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#edit_doctors"
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
          </>
        </div>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
  ];
  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0"> Doctors </h4>
            </div>
            {/* dropdown*/}
            <div className="dropdown me-1">
              <Link
                to="#"
                className="btn btn-md fw-normal border fs-14 bg-white rounded text-dark d-inline-flex align-items-center"
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
            <div className="dropdown">
              <Link
                to="#"
                className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
              >
                <i className="ti ti-filter text-gray-5 me-1" />
                Filters
              </Link>
              <div
                className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0"
                id="filter-dropdown"
              >
                <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                  <h4 className="mb-0 fw-bold">Filter</h4>
                  <div className="d-flex align-items-center">
                    <Link
                      to="#"
                      className="link-danger text-decoration-underline"
                    >
                      Clear All
                    </Link>
                  </div>
                </div>
                <form action="#">
                  <div className="filter-body pb-0">
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label mb-1">Doctor</label>
                        <Link to="#" className="link-primary mb-1">
                          Reset
                        </Link>
                      </div>
                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Please select"
                        defaultValue={[]}
                        options={Doctor}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label">Designation</label>
                        <Link to="#" className="link-primary mb-1">
                          Reset
                        </Link>
                      </div>
                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Please select"
                        defaultValue={[]}
                        options={Designation}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label">Department</label>
                        <Link to="#" className="link-primary mb-1">
                          Reset
                        </Link>
                      </div>
                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Please select"
                        defaultValue={[]}
                        options={Department}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">
                        Date<span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label">Amount</label>
                        <Link to="#" className="link-primary mb-1">
                          Reset
                        </Link>
                      </div>
                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Please select"
                        defaultValue={[]}
                        options={Amount}
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <label className="form-label">Status</label>
                        <Link to="#" className="link-primary mb-1">
                          Reset
                        </Link>
                      </div>
                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Please select"
                        defaultValue={[]}
                        options={Status}
                      />
                    </div>
                  </div>
                  <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                    <Link
                      to="#"
                      className="btn btn-light btn-md me-2 fw-medium"
                      id="close-filter"
                    >
                      Close
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary btn-md fw-medium"
                    >
                      Filter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
              searchText={searchText}
              loading={loading}
            />
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Docyori
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
    </>
  );
};

export default PatientDoctors;
