import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import Datatable from "../../../../core/common/dataTable";
import { useClinicServices } from "../../../../core/hooks/useClinicServices";
import { useClinicSpecializations } from "../../../../core/hooks/useClinicSpecializations";
import { apiDelete, apiPut } from "../../../../core/utils/apiClient";
import { resolveMediaUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import EmptyState from "../../../../core/common/emptyState";
import Modals from "../clinic-modules/specializations/modals/modals";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily", icon: "ti ti-calendar-event" },
  { value: "alternate", label: "Alternate Day", icon: "ti ti-calendar-stats" },
  { value: "weekly", label: "Weekly", icon: "ti ti-calendar-week" },
  { value: "custom", label: "Custom", icon: "ti ti-adjustments" },
];

const parseDurationMinutes = (duration?: string | null) => {
  if (!duration) return "";
  const match = String(duration).match(/(\d+)/);
  return match ? match[1] : "";
};

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
  const {
    specializations,
    refetch: refetchCats,
    loading: loadingCats,
    error: errorCats,
  } = useClinicSpecializations("therapy");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [viewService, setViewService] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [editMinSessions, setEditMinSessions] = useState("1");
  const [editMaxSessions, setEditMaxSessions] = useState("10");
  const [editSessionGap, setEditSessionGap] = useState("0");
  const [editScheduleType, setEditScheduleType] = useState("daily");

  const openEditTherapy = (service: any) => {
    setSelectedService(service);
    setEditName(service?.serviceName || "");
    setEditCategory(service?.specializationId || service?.specialization?.id || "");
    setEditCode(service?.serviceCode || "");
    setEditDuration(parseDurationMinutes(service?.duration));
    setEditPrice(service?.price != null ? String(service.price) : "");
    setEditDescription(service?.description || "");
    setEditStatus(service?.status || "Active");
    setEditMinSessions(String(service?.minSessions ?? 1));
    setEditMaxSessions(String(service?.maxSessions ?? 10));
    setEditSessionGap(String(service?.sessionGap ?? 0));
    setEditScheduleType(service?.scheduleType || "daily");
  };

  const getRelativeScheduledDays = () => {
    const days: number[] = [];
    const count = editMinSessions ? parseInt(editMinSessions, 10) : 1;
    let increment = 1;
    if (editScheduleType === "daily") increment = 1;
    else if (editScheduleType === "alternate") increment = 2;
    else if (editScheduleType === "weekly") increment = 7;
    else if (editScheduleType === "custom") {
      increment = editSessionGap ? parseInt(editSessionGap, 10) : 1;
    }
    for (let i = 0; i < (Number.isFinite(count) ? count : 1); i++) {
      days.push(1 + i * (Number.isFinite(increment) && increment > 0 ? increment : 1));
    }
    return days;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (!editName || !editCategory || !editDuration || !editPrice || !editMinSessions || !editMaxSessions) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSavingEdit(true);
    try {
      const relativeDays = getRelativeScheduledDays();
      await apiPut(`/api/services/${selectedService.id}`, {
        serviceName: editName.trim(),
        serviceCode: editCode || selectedService.serviceCode,
        serviceType: "therapy",
        specializationId: editCategory,
        price: parseFloat(editPrice),
        duration: `${editDuration} mins`,
        description: editDescription,
        gallery: Array.isArray(selectedService.gallery) ? selectedService.gallery : [],
        minSessions: parseInt(editMinSessions, 10),
        maxSessions: parseInt(editMaxSessions, 10),
        sessionGap: editSessionGap ? parseInt(editSessionGap, 10) : 0,
        scheduleType: editScheduleType,
        customDates: relativeDays.map((d) => `Day ${d}`),
        status: editStatus,
      });
      toast.success("Therapy updated successfully");
      refetch();
      document.getElementById("close-edit-therapy-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to update therapy");
    } finally {
      setSavingEdit(false);
    }
  };

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
      width: 90,
      className: "text-nowrap",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", minWidth: 90 },
      }),
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
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_therapy"
            onClick={() => openEditTherapy(record.raw)}
          >
            <i className="ti ti-edit fs-18"></i>
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
      width: 120,
    },
  ];

  // ── Categories ────────────────────────────────────────────
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
      width: 90,
      className: "text-nowrap",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", minWidth: 90 },
      }),
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
        onEdit={() => {
          if (viewService) openEditTherapy(viewService);
        }}
        editLabel="Edit Therapy"
        editModalTarget="#edit_therapy"
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

      {/* Edit Therapy Modal */}
      <div className="modal fade" id="edit_therapy" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12, overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white">
              <h4 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <i className="ti ti-edit" /> Edit Therapy
              </h4>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="close-edit-therapy-modal"
              />
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      Therapy Name <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="service"
                      type="text"
                      placeholder="Therapy name"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      required
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {specializations.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Therapy Code</label>
                    <IconFormControl
                      type="text"
                      fieldLabel="service"
                      className="bg-light"
                      readOnly
                      value={editCode}
                      placeholder="Therapy Code"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">
                      Duration (Minutes) <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      type="number"
                      fieldLabel="time"
                      placeholder="e.g. 50"
                      required
                      min="1"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">
                      Price / Session (₹) <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="price"
                      type="number"
                      placeholder="e.g. 1500"
                      required
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">
                      Min Sessions <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      type="number"
                      fieldLabel="quantity"
                      min="1"
                      required
                      value={editMinSessions}
                      onChange={(e) => setEditMinSessions(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">
                      Max Sessions <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      type="number"
                      fieldLabel="quantity"
                      min="1"
                      required
                      value={editMaxSessions}
                      onChange={(e) => setEditMaxSessions(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Status</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Schedule Type</label>
                    <div className="d-flex flex-wrap gap-2">
                      {SCHEDULE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                            editScheduleType === opt.value ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => {
                            setEditScheduleType(opt.value);
                            if (opt.value === "daily") setEditSessionGap("0");
                            else if (opt.value === "alternate") setEditSessionGap("1");
                            else if (opt.value === "weekly") setEditSessionGap("7");
                            else setEditSessionGap("");
                          }}
                        >
                          <i className={opt.icon} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Session Gap (Days)</label>
                    <IconFormControl
                      type="number"
                      fieldLabel="time"
                      min="0"
                      disabled={editScheduleType !== "custom"}
                      value={editSessionGap}
                      onChange={(e) => setEditSessionGap(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark">Description</label>
                    <IconTextarea
                      fieldLabel="description"
                      rows={3}
                      placeholder="Therapy details (optional)"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-light px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
