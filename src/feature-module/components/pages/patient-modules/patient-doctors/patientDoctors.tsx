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
import { useClinics } from "../../../../../core/hooks/useClinics";
import Datatable from "../../../../../core/common/dataTable";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Modals from "./modals/modals";

const PatientDoctors = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clinicId = queryParams.get("clinicId") || undefined;

  const { doctors, loading: doctorsLoading } = useClinicDoctors(clinicId);
  const { clinics } = useClinics();

  const selectedClinic = clinics.find(c => String(c.id) === String(clinicId));
  const loading = doctorsLoading;

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const data = doctors.map((doctor) => {
    const hasImage = doctor.profileImage && doctor.profileImage.trim() !== "" && !doctor.profileImage.includes("300x300");
    const doctorImg = hasImage ? doctor.profileImage : "assets/img/doctor-placeholder.png";

    return {
      id: doctor.id,
      Doctor_Name: doctor.fullName,
      img: doctorImg,
      role: doctor.designation?.name || doctor.department?.name || "Doctor",
      Phone: doctor.phone || "—",
      Last_Visit: "No visits yet", // Placeholder as visit history is not in the basic doctor object
    };
  });
  const columns = [
    {
      title: "Sr No",
      dataIndex: "id",
      render: (_: any, __: any, index: number) => (
        <span className="fw-bold d-flex align-items-center text-muted">
          <i className="ti ti-hash me-1 fs-10" />
          {String(index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      title: "Doctor Name",
      dataIndex: "Doctor_Name",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={doctorDetailsPath(record.id)}
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
              to={doctorDetailsPath(record.id)}
              className="text-dark fw-bold mb-0 hover-primary"
            >
              <i className="ti ti-user-check me-1 text-primary fs-12" />
              {text}
            </Link>
            <span className="text-muted fs-11 fw-medium text-uppercase tracking-wider">
              {record.role}
            </span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Doctor_Name.localeCompare(b.Doctor_Name),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      render: (text: string) => (
        <span className="text-dark fw-medium d-flex align-items-center">
          <i className="ti ti-phone-call me-2 text-muted fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Phone.length - b.Phone.length,
    },
    {
      title: "Last Visit",
      dataIndex: "Last_Visit",
      render: (text: string) => (
        <span className="text-muted fw-medium d-flex align-items-center">
          <i className="ti ti-calendar-event me-2 fs-14" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Last_Visit.length - b.Last_Visit.length,
    },
    {
      title: "Action",
      align: 'center' as const,
      render: (record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Link
            to={doctorDetailsPath(record.id)}
            className="btn btn-icon btn-sm btn-soft-primary border"
            title="View Details"
          >
            <i className="ti ti-eye fs-16" />
          </Link>

          <div className="dropdown">
            <Link
              to="#"
              data-bs-toggle="dropdown"
              className="btn btn-icon btn-sm btn-soft-secondary border"
            >
              <i className="ti ti-dots-vertical fs-16" />
            </Link>
            <ul className="dropdown-menu p-2 shadow border-0">
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#edit_doctors"
                >
                  <i className="ti ti-edit me-2" /> Edit Info
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item d-flex align-items-center text-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#delete_modal"
                >
                  <i className="ti ti-trash me-2" /> Remove
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
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
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-1 mb-4 border-bottom">
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-1 d-flex align-items-center text-muted fs-12 text-uppercase">
                <Link to={all_routes.patientclinics} className="text-muted hover-primary d-flex align-items-center">
                  <i className="ti ti-arrow-left me-1" /> Clinics
                </Link>
                <i className="ti ti-chevron-right mx-2" />
                <span className="text-primary">View Doctors</span>
              </h6>
              <div className="d-flex align-items-center">
                <h3 className="fw-bold mb-0">
                  {clinicId ? `Doctors in ${selectedClinic?.name || 'Clinic'}` : "Our Specialists"}
                </h3>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to={all_routes.patientclinics}
                className="btn btn-white border d-inline-flex align-items-center fw-medium"
              >
                <i className="ti ti-arrow-left me-2" /> Back to Directory
              </Link>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
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
