import { useState } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import Modals from "./modals/modals";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { useClinicSpecializations } from "../../../../../core/hooks/useClinicSpecializations";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker } from "antd";
import { Specialization, StatusActive } from "../../../../../core/common/selectOption";

const Specializations = () => {
  const { specializations, refetch, loading, error } = useClinicSpecializations();
  const [selectedSpecialization, setSelectedSpecialization] = useState<any>(null);
  const [viewSpec, setViewSpec] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filterSpecialization, setFilterSpecialization] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredData = specializations.filter((spec) => {
    const matchSpec = filterSpecialization === "All" || spec.name === filterSpecialization;
    const matchStatus = filterStatus === "All" || spec.status === filterStatus;
    return matchSpec && matchStatus;
  });

  const data = filteredData.map((spec, index) => ({
    key: spec.id,
    id: spec.id,
    S_No: index + 1,
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
      dataIndex: "S_No",
      render: (text: number) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Specialization",
      dataIndex: "Specialization",
      render: (text: string) => {
        return (
          <div className="d-flex align-items-center">
            <div>
              <h6 className="mb-0 fs-14 fw-semibold text-dark">
                <Link to="#">{text}</Link>
              </h6>
            </div>
          </div>
        );
      },
      sorter: (a: any, b: any) =>
        a.Specialization.localeCompare(b.Specialization),
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.createdAt).getTime() -
        new Date(b.raw.createdAt).getTime(),
    },
    {
      title: "No of Doctor",
      dataIndex: "NoofDoctor",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) =>
        parseInt(a.NoofDoctor) - parseInt(b.NoofDoctor),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Active"
              ? "badge-soft-success border-success"
              : "badge-soft-danger border-danger"
            } px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_text: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_specialization"
            onClick={() => setViewSpec(record.raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            data-bs-toggle="modal"
            data-bs-target="#edit_specialization"
            onClick={() => setSelectedSpecialization(record.raw)}
            title="Edit"
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            data-bs-toggle="modal"
            data-bs-target="#delete_specialization"
            onClick={() => setSelectedSpecialization(record.raw)}
            title="Delete"
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Specializations
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Specialization Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Specialization:</span>{" "}
                    {filterSpecialization}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterSpecialization("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  {Specialization.map((spec, idx) => (
                    <li key={idx}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterSpecialization(spec.label);
                        }}
                      >
                        {spec.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  {StatusActive.map((status, idx) => (
                    <li key={idx}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterStatus(status.label);
                        }}
                      >
                        {status.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add Specialization Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
                onClick={() => setSelectedSpecialization(null)}
              >
                Add Specialization <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading specializations</p>
            </div>
          ) : specializations.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No specializations yet"
                message="Categorize your clinical services by adding specializations like Cardiology or Pediatrics."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_specialization"
                    onClick={() => setSelectedSpecialization(null)}
                  >
                    Add Specialization <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_specialization"
                style={{
                  borderRadius: "8px",
                  minHeight: "42px",
                  fontWeight: "bold",
                }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
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

      <Modals selectedSpecialization={selectedSpecialization} refetch={refetch} />

      {/* ===== VIEW SPECIALIZATION MODAL ===== */}
      <div id="view_specialization" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Specialization Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewSpec(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewSpec && (
                <>
                  <div className="mb-3">
                    <label className="form-label">
                      Specialization
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewSpec.name || ""}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control bg-light"
                      rows={3}
                      value={viewSpec.description || ""}
                      readOnly
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewSpec.status || ""}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewSpec(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Specializations;