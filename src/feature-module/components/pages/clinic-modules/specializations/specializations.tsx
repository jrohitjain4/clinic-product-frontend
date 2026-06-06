import { useState } from "react";
import Modals from "./modals/modals";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { useClinicSpecializations } from "../../../../../core/hooks/useClinicSpecializations";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker, Select } from "antd";
import { Specialization, StatusActive } from "../../../../../core/common/selectOption";

const Specializations = () => {
  const { specializations, refetch } = useClinicSpecializations();
  const [selectedSpecialization, setSelectedSpecialization] = useState<any>(null);

  const data = specializations.map((spec) => ({
    key: spec.id,
    id: spec.id,
    img: spec.image || "specialization-01.jpg",
    Specialization: spec.name,
    CreatedDate: new Date(spec.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    NoofDoctor: String(spec.noOfDoctor || 0),
    Status: spec.status,
    raw: spec,
  }));

  const columns = [
    {
      title: "S.No",
      render: (_text: any, _record: any, index: number) => index + 1,
    },
    {
      title: "Specialization",
      dataIndex: "Specialization",
      render: (text: any, render: any) => {
        const imageSrc = render.img.startsWith("http") || render.img.startsWith("/uploads")
          ? render.img
          : `assets/img/doctors/${render.img}`;

        return (
          <div className="d-flex align-items-center">
            <Link
              to="#"
              className="avatar me-2"
            >
              <ImageWithBasePath
                src={imageSrc}
                alt="Doctor"
                className="rounded-circle"
              />
            </Link>
            <div>
              <h6 className="mb-0 fs-14 fw-semibold">
                <Link to="#">
                  {text}
                </Link>
              </h6>
            </div>
          </div>
        );
      },
      sorter: (a: any, b: any) =>
        a.Specialization.length - b.Specialization.length,
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      sorter: (a: any, b: any) => a.CreatedDate.length - b.CreatedDate.length,
    },
    {
      title: "No of Doctor",
      dataIndex: "NoofDoctor",
      sorter: (a: any, b: any) => a.NoofDoctor.length - b.NoofDoctor.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Active"
            ? "badge-soft-success border-success"
            : "badge-soft-danger border-danger"
            }  border  px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "Action",
      render: (_text: string, render: any) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="btn btn-sm btn-white text-primary d-flex align-items-center justify-content-center p-2"
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            data-bs-toggle="modal"
            data-bs-target="#edit_specialization"
            onClick={() => setSelectedSpecialization(render.raw)}
            title="Edit"
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            to="#"
            className="btn btn-sm btn-white text-danger d-flex align-items-center justify-content-center p-2"
            style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            data-bs-toggle="modal"
            data-bs-target="#delete_specialization"
            onClick={() => setSelectedSpecialization(render.raw)}
            title="Delete"
          >
            <i className="ti ti-trash fs-16" />
          </Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
  ];
  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
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
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
            <div className="d-flex align-items-center text-nowrap">
              <h4 className="fw-bold mb-0 d-flex align-items-center">
                Specializations
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Specializations : {specializations.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">

              {/* Inline Header Filters as Clones */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Specialization : </span> All
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-2">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">All</Link>
                  </li>
                  {Specialization.map((spec, idx) => (
                    <li key={idx}>
                      <Link to="#" className="dropdown-item rounded-1">
                        {spec.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Date : </span> Select
                </Link>
                <div className="dropdown-menu dropdown-menu-end p-2">
                  <DatePicker
                    format={{ format: "DD-MM-YYYY", type: "mask" }}
                    getPopupContainer={getModalContainer}
                    placeholder="DD-MM-YYYY"
                    suffixIcon={<i className="ti ti-calendar" />}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Status : </span> All
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-2">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">All</Link>
                  </li>
                  {StatusActive.map((status, idx) => (
                    <li key={idx}>
                      <Link to="#" className="dropdown-item rounded-1">
                        {status.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-2">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Recent
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Oldest
                    </Link>
                  </li>
                </ul>
              </div>

              <Link to="#"
                className="btn btn-primary text-white fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
              >
                Add New Specialization
                <i className="ti ti-plus ms-2" />
              </Link>
            </div>
          </div>
          {/* End Page Header */}

          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText={searchText}

            />
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals selectedSpecialization={selectedSpecialization} refetch={refetch} />
    </>
  );
};

export default Specializations;
