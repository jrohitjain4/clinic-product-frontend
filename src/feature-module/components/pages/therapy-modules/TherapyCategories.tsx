import { useState } from "react";
import EmptyState from "../../../../core/common/emptyState";
import Modals from "../clinic-modules/specializations/modals/modals";
import Datatable from "../../../../core/common/dataTable";
import { Link } from "react-router";
import { useClinicSpecializations } from "../../../../core/hooks/useClinicSpecializations";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { ViewModal } from "../../../../core/common/modal/ViewModal";

const TherapyCategories = () => {
  const { specializations, refetch, loading, error } = useClinicSpecializations("therapy");
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
    CategoryName: spec.name,
    CreatedDate: new Date(spec.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    NoofTherapist: String(spec.noOfDoctor || 0),
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
      title: "Category Name",
      dataIndex: "CategoryName",
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
        a.CategoryName.localeCompare(b.CategoryName),
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
      title: "No of Therapist",
      dataIndex: "NoofTherapist",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) =>
        parseInt(a.NoofTherapist) - parseInt(b.NoofTherapist),
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
              <h4 className="page-title fw-bold mb-0">
                Therapy Categories
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Categories: {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
                style={{ minHeight: "38px" }}
              >
                <i className="ti ti-plus" /> New Category
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={refetch}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : data.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No therapy categories yet"
                message="Define therapy categories (e.g. Cognitive Behavioral Therapy, Physical Therapy) to organize your services."
                action={
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    data-bs-toggle="modal"
                    data-bs-target="#add_specialization"
                  >
                    <i className="ti ti-plus" /> New Category
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025{" "}
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      <Modals
        selectedSpecialization={selectedSpecialization}
        refetch={refetch}
        specializationType="therapy"
      />

      {/* ===== VIEW CATEGORY MODAL ===== */}
      <ViewModal
        id="view_specialization"
        title="Category Details"
        subtitle="View therapy category information"
        headerIcon={<i className="ti ti-stethoscope" />}
        highlightTitle={viewSpec?.name || "Category"}
        highlightStatus={
          <span className={`badge border ${viewSpec?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewSpec?.status || "Active"}
          </span>
        }
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-file-description" />, label: "Description", value: viewSpec?.description || "No description provided", fullWidth: true }
        ]}
        onEdit={() => {
          setSelectedSpecialization(viewSpec);
        }}
        editLabel="Edit Category"
        editModalTarget="#edit_specialization"
      />
    </>
  );
};

export default TherapyCategories;
