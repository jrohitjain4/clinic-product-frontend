import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import Datatable from "../../../../core/common/dataTable";
import { useClinicServices } from "../../../../core/hooks/useClinicServices";
import { useClinicSpecializations } from "../../../../core/hooks/useClinicSpecializations";
import { apiDelete } from "../../../../core/utils/apiClient";
import { resolveMediaUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import EmptyState from "../../../../core/common/emptyState";
import Modals from "../clinic-modules/specializations/modals/modals";

const TherapyServices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"list" | "categories">(
    tabParam === "categories" ? "categories" : "list"
  );

  useEffect(() => {
    if (tabParam === "categories") setActiveTab("categories");
    else if (tabParam === "list") setActiveTab("list");
  }, [tabParam]);

  const switchTab = (tab: "list" | "categories") => {
    setActiveTab(tab);
    setSearchParams(tab === "categories" ? { tab: "categories" } : {});
  };

  // ── Therapy List ──────────────────────────────────────────
  const { services, refetch, loading, error } = useClinicServices("therapy");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [viewService, setViewService] = useState<any>(null);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/services/${id}`);
      toast.success("Therapy service deleted successfully");
      refetch();
      document.getElementById("close-delete-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    }
  };

  const data = useMemo(() => {
    return services.map((s, index) => ({
      key: s.id,
      id: s.id,
      sr_no: index + 1,
      name: s.serviceName,
      code: (s as any).serviceCode || "N/A",
      category: (s as any).specialization?.name || "N/A",
      price: s.price,
      duration: s.duration || "N/A",
      status: s.status || "Active",
      raw: s,
    }));
  }, [services]);

  const columns = [
    {
      title: "Sr No.",
      dataIndex: "sr_no",
      render: (text: number) => <span className="fs-13 fw-medium text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.sr_no - b.sr_no,
      width: 60,
    },
    {
      title: "Therapy Name",
      dataIndex: "name",
      render: (text: string) => <span className="fw-semibold text-dark fs-14">{text}</span>,
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "Code",
      dataIndex: "code",
      render: (text: string) => <span className="text-secondary">{text}</span>,
      sorter: (a: any, b: any) => a.code.localeCompare(b.code),
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (text: string) => <span className="badge badge-soft-purple px-2 py-1 fs-12">{text}</span>,
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
    },
    {
      title: "Price per Session",
      dataIndex: "price",
      render: (text: number) => <span className="text-dark fw-bold">₹{text}</span>,
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      render: (text: string) => <span className="text-secondary">{text}</span>,
      sorter: (a: any, b: any) => a.duration.localeCompare(b.duration),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className={`badge border ${text === "Active" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} px-2 py-1 fs-12`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_text: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_therapy"
            onClick={() => setViewService(record.raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            data-bs-toggle="modal"
            data-bs-target="#delete_therapy"
            onClick={() => setSelectedService(record.raw)}
            title="Delete"
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
    },
  ];

  // ── Categories ────────────────────────────────────────────
  const {
    specializations,
    refetch: refetchCats,
    loading: loadingCats,
    error: errorCats,
  } = useClinicSpecializations("therapy");
  const [selectedSpecialization, setSelectedSpecialization] = useState<any>(null);
  const [viewSpec, setViewSpec] = useState<any>(null);

  const catData = useMemo(() => {
    return specializations.map((spec, index) => ({
      key: spec.id,
      id: spec.id,
      S_No: index + 1,
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
  }, [specializations]);

  const catColumns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Category Name",
      dataIndex: "CategoryName",
      render: (text: string) => (
        <h6 className="mb-0 fs-14 fw-semibold text-dark">{text}</h6>
      ),
      sorter: (a: any, b: any) => a.CategoryName.localeCompare(b.CategoryName),
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.createdAt).getTime() - new Date(b.raw.createdAt).getTime(),
    },
    {
      title: "No of Therapist",
      dataIndex: "NoofTherapist",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => parseInt(a.NoofTherapist) - parseInt(b.NoofTherapist),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${
            text === "Active" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"
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
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_specialization"
            onClick={() => setViewSpec(record.raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>
          <button
            className="bg-transparent border-0 text-primary p-1"
            data-bs-toggle="modal"
            data-bs-target="#edit_specialization"
            onClick={() => setSelectedSpecialization(record.raw)}
            title="Edit"
          >
            <i className="ti ti-edit fs-18"></i>
          </button>
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
      width: 120,
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
                Therapy Services
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  {activeTab === "list"
                    ? `Total Services: ${loading ? "…" : data.length}`
                    : `Total Categories: ${loadingCats ? "…" : catData.length}`}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              {activeTab === "list" ? (
                <Link
                  to="/add-service"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  style={{ minHeight: "38px" }}
                >
                  <i className="ti ti-plus" /> New Therapy
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  data-bs-toggle="modal"
                  data-bs-target="#add_specialization"
                  style={{ minHeight: "38px" }}
                >
                  <i className="ti ti-plus" /> New Category
                </button>
              )}
            </div>
          </div>

          {/* Tabs — same pattern as IPD Treatments */}
          <ul className="nav nav-tabs nav-tabs-bottom mb-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fw-semibold ${
                  activeTab === "list" ? "active text-primary" : "text-muted"
                }`}
                onClick={() => switchTab("list")}
              >
                <i className="ti ti-list-details me-2" />
                Therapy List ({loading ? "…" : data.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fw-semibold ${
                  activeTab === "categories" ? "active text-primary" : "text-muted"
                }`}
                onClick={() => switchTab("categories")}
              >
                <i className="ti ti-category me-2" />
                Categories ({loadingCats ? "…" : catData.length})
              </button>
            </li>
          </ul>

          {/* TAB: Therapy List */}
          {activeTab === "list" && (
            <>
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
              ) : data.length === 0 && !error ? (
                <div className="border rounded bg-white">
                  <EmptyState
                    title="No therapy services yet"
                    message="Add therapy services with customizable frequencies and session structures to schedule therapy sessions."
                    action={
                      <Link to="/add-service" className="btn btn-primary d-flex align-items-center gap-2">
                        <i className="ti ti-plus" /> New Therapy
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="table-responsive">
                  <Datatable columns={columns} dataSource={data} Selection={false} />
                </div>
              )}
            </>
          )}

          {/* TAB: Categories */}
          {activeTab === "categories" && (
            <>
              {errorCats && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
                  <span>{errorCats}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetchCats}>
                    Retry
                  </button>
                </div>
              )}

              {loadingCats ? (
                <div className="text-center py-5">
                  <span className="spinner-border text-primary" role="status" />
                </div>
              ) : catData.length === 0 && !errorCats ? (
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
                  <Datatable columns={catColumns} dataSource={catData} Selection={false} />
                </div>
              )}
            </>
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

      {/* Therapy view / delete modals */}
      <ViewModal
        id="view_therapy"
        title="Therapy Details"
        subtitle="View configured schedule & gallery specifications"
        headerIcon={<i className="ti ti-activity" />}
        highlightTitle={viewService?.serviceName || "Therapy"}
        highlightStatus={
          <span
            className={`badge border ${
              viewService?.status === "Active"
                ? "bg-success-transparent text-success border-success"
                : "bg-danger-transparent text-danger border-danger"
            } fw-bold px-2 py-1`}
            style={{ fontSize: "10px", borderRadius: "10px" }}
          >
            <i className="ti ti-point-filled me-1"></i>
            {viewService?.status || "Active"}
          </span>
        }
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-hash" />, label: "Therapy Code", value: viewService?.serviceCode || "N/A" },
          { icon: <i className="ti ti-folder" />, label: "Category", value: viewService?.specialization?.name || "N/A" },
          { icon: <i className="ti ti-clock" />, label: "Duration", value: viewService?.duration || "N/A" },
          { icon: <i className="ti ti-currency-rupee" />, label: "Price", value: `₹${viewService?.price || 0}` },
          { icon: <i className="ti ti-arrows-minimize" />, label: "Min Sessions", value: `${viewService?.minSessions || 1} session(s)` },
          { icon: <i className="ti ti-arrows-maximize" />, label: "Max Sessions", value: `${viewService?.maxSessions || 1} session(s)` },
          {
            icon: <i className="ti ti-calendar-time" />,
            label: "Schedule Type",
            value: viewService?.scheduleType
              ? viewService.scheduleType === "alternate"
                ? "Alternate Day"
                : viewService.scheduleType
              : "N/A",
          },
          { icon: <i className="ti ti-separator" />, label: "Session Gap", value: `${viewService?.sessionGap || 1} day(s)` },
        ]}
      >
        {viewService?.description && (
          <div className="px-4 pb-3">
            <label className="text-muted fs-12 mb-1 uppercase tracking-wider block fw-semibold">
              Description
            </label>
            <div className="fs-14 text-secondary leading-relaxed bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
              {viewService.description}
            </div>
          </div>
        )}

        {viewService?.gallery && viewService.gallery.length > 0 && (
          <div className="px-4 pb-4">
            <label className="text-muted fs-12 mb-2 uppercase tracking-wider block fw-semibold">
              Gallery Images ({viewService.gallery.length})
            </label>
            <div className="row g-2">
              {viewService.gallery.map((imgUrl: string, idx: number) => (
                <div key={idx} className="col-4">
                  <div className="border rounded overflow-hidden shadow-sm" style={{ height: "80px" }}>
                    <a href={resolveMediaUrl(imgUrl)} target="_blank" rel="noreferrer">
                      <img
                        src={resolveMediaUrl(imgUrl)}
                        alt="Gallery View"
                        className="w-100 h-100 object-fit-cover"
                        style={{ objectFit: "cover" }}
                      />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ViewModal>

      <div className="modal fade" id="delete_therapy">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Therapy</h5>
              <p className="mb-3 text-muted">Are you sure want to delete {selectedService?.serviceName}?</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal" id="close-delete-modal">
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => selectedService && handleDelete(selectedService.id)}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category modals (from old Therapy Categories page) */}
      <Modals
        selectedSpecialization={selectedSpecialization}
        refetch={refetchCats}
        specializationType="therapy"
      />

      <ViewModal
        id="view_specialization"
        title="Category Details"
        subtitle="View therapy category information"
        headerIcon={<i className="ti ti-stethoscope" />}
        highlightTitle={viewSpec?.name || "Category"}
        highlightStatus={
          <span
            className={`badge border ${
              viewSpec?.status === "Active"
                ? "bg-success-transparent text-success border-success"
                : "bg-danger-transparent text-danger border-danger"
            } fw-bold px-2 py-1`}
            style={{ fontSize: "10px", borderRadius: "10px" }}
          >
            <i className="ti ti-point-filled me-1"></i>
            {viewSpec?.status || "Active"}
          </span>
        }
        highlightColor="#e0e7ff"
        details={[
          {
            icon: <i className="ti ti-file-description" />,
            label: "Description",
            value: viewSpec?.description || "No description provided",
            fullWidth: true,
          },
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

export default TherapyServices;
