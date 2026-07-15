import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import Datatable from "../../../../core/common/dataTable";
import { useClinicServices } from "../../../../core/hooks/useClinicServices";
import { apiDelete } from "../../../../core/utils/apiClient";
import { resolveMediaUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import EmptyState from "../../../../core/common/emptyState";

const TherapyServices = () => {
  const { services, refetch, loading, error } = useClinicServices("therapy");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [viewService, setViewService] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
                  Total Services: {loading ? "" : data.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/add-service"
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ minHeight: "38px" }}
              >
                <i className="ti ti-plus" /> New Therapy
              </Link>
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
                title="No therapy services yet"
                message="Add therapy services with customizable frequencies and session structures to schedule therapy sessions."
                action={
                  <Link
                    to="/add-service"
                    className="btn btn-primary d-flex align-items-center gap-2"
                  >
                    <i className="ti ti-plus" /> New Therapy
                  </Link>
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

      {/* ===== VIEW DETAILS MODAL ===== */}
      <ViewModal
        id="view_therapy"
        title="Therapy Details"
        subtitle="View configured schedule & gallery specifications"
        headerIcon={<i className="ti ti-activity" />}
        highlightTitle={viewService?.serviceName || "Therapy"}
        highlightStatus={
          <span className={`badge border ${viewService?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewService?.status || "Active"}
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
          { icon: <i className="ti ti-calendar-time" />, label: "Schedule Type", value: viewService?.scheduleType ? (viewService.scheduleType === "alternate" ? "Alternate Day" : viewService.scheduleType) : "N/A" },
          { icon: <i className="ti ti-separator" />, label: "Session Gap", value: `${viewService?.sessionGap || 1} day(s)` }
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
                        className="w-100 h-100 object-fit-cover hover-scale"
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

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
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
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                  id="close-delete-modal"
                >
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
    </>
  );
};

export default TherapyServices;
