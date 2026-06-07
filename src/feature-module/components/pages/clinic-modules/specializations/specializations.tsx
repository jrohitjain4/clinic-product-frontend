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
  const [viewSpec, setViewSpec] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        <div className="d-flex align-items-center justify-content-start gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_specialization"
            onClick={() => setViewSpec(render.raw)}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>

          <button
            className="bg-transparent border-0 text-primary p-1"
            data-bs-toggle="modal"
            data-bs-target="#edit_specialization"
            onClick={() => setSelectedSpecialization(render.raw)}
            title="Edit"
          >
            <i className="fa fa-edit fs-16"></i>
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            data-bs-toggle="modal"
            data-bs-target="#delete_specialization"
            onClick={() => setSelectedSpecialization(render.raw)}
            title="Delete"
          >
            <i className="fa fa-trash-alt fs-16"></i>
          </button>
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
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Specializations
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Specializations : {specializations.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">

              {/* Inline Header Filters as Clones */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '160px', minHeight: '38px' }}
                  data-bs-toggle="dropdown"
                >
                  <span><span className="text-muted">Specialization:</span> All</span>
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
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }}
                  data-bs-toggle="dropdown"
                >
                  <span><span className="text-muted">Date:</span> Select</span>
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
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }}
                  data-bs-toggle="dropdown"
                >
                  <span><span className="text-muted">Status:</span> All</span>
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



              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
              >
                Add New Specialization
                <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>
          {/* End Page Header */}

          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText={searchText}
              onSelectionChange={(keys) => setSelectedIds(keys as string[])}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_specialization"
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
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

      {/* ===== VIEW MODAL ===== */}
      <div id="view_specialization" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">View Specialization</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={() => setViewSpec(null)}></button>
            </div>
            <div className="modal-body">
              {viewSpec && (
                <div className="row g-3">
                  <div className="col-md-12 text-center mb-3">
                    <div className="avatar avatar-xxl bg-light p-1 rounded-circle shadow-sm mx-auto">
                      <ImageWithBasePath
                        src={viewSpec.image?.startsWith("http") || viewSpec.image?.startsWith("/uploads")
                          ? viewSpec.image
                          : `assets/img/doctors/${viewSpec.image || "specialization-01.jpg"}`}
                        alt={viewSpec.name}
                        className="rounded-circle"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Specialization Name</label>
                    <input type="text" className="form-control bg-light" value={viewSpec.name || ""} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Description</label>
                    <textarea className="form-control bg-light" rows={3} value={viewSpec.description || "No description provided"} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">No. of Doctors</label>
                    <input type="text" className="form-control bg-light" value={viewSpec.noOfDoctor || 0} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Status</label>
                    <input type="text" className="form-control bg-light" value={viewSpec.status || ""} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-muted">CREATED ON</label>
                    <div className="text-dark fw-medium small">{new Date(viewSpec.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button type="button" className="btn btn-primary px-5" data-bs-dismiss="modal" onClick={() => setViewSpec(null)} style={{ borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Specializations;
