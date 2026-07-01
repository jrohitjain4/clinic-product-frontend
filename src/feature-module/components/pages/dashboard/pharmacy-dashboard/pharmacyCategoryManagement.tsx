import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { usePharmacyCategories } from "../../../../../core/hooks/usePharmacyCategories";
import EmptyState from "../../../../../core/common/emptyState";

const PharmacyCategoryManagement = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory, bulkDeleteCategories } = usePharmacyCategories();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  // Modal forms state
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [viewCategory, setViewCategory] = useState<any>(null);

  // Add/Edit Form State
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormName("");
    setFormDesc("");
    setFormStatus("Active");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createCategory({ name: formName.trim(), description: formDesc.trim(), status: formStatus });
      toast.success("Category added successfully!");
      setShowAddModal(false);
    } catch (err: any) {
      // toast already handled by apiClient
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (cat: any) => {
    setSelectedCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormStatus(cat.status);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category Name is required");
      return;
    }
    if (selectedCategory) {
      setSubmitting(true);
      try {
        await updateCategory(selectedCategory.id, { name: formName.trim(), description: formDesc.trim(), status: formStatus });
        toast.success("Category updated successfully!");
        setShowEditModal(false);
        setSelectedCategory(null);
      } catch (err: any) {
        // handled
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleOpenDelete = (cat: any) => {
    setSelectedCategory(cat);
    triggerModal("delete_pharmacy_category");
  };

  const handleDeleteConfirm = async () => {
    if (selectedCategory) {
      setSubmitting(true);
      try {
        await deleteCategory(selectedCategory.id);
        setSelectedIds(selectedIds.filter((id) => id !== selectedCategory.id));
        toast.success("Category deleted successfully!");
        document.getElementById("btn-close-delete-pharmacy-category")?.click();
        setSelectedCategory(null);
      } catch (err: any) {
        // handled
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await bulkDeleteCategories(selectedIds);
      setSelectedIds([]);
      toast.success("Selected categories deleted successfully!");
      document.getElementById("btn-close-bulk-delete-pharmacy-category")?.click();
    } catch (err: any) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredData = useMemo(() => {
    return categories.filter((cat) => {
      const matchStatus = filterStatus === "All" || cat.status === filterStatus;
      const matchSearch =
        cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (cat.description || "").toLowerCase().includes(searchText.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [categories, filterStatus, searchText]);

  const data = filteredData.map((cat, index) => ({
    key: cat.id,
    id: cat.id,
    S_No: index + 1,
    CategoryName: cat.name,
    Description: cat.description || "—",
    CreatedDate: dayjs(cat.createdAt).format("DD MMM YYYY"),
    Status: cat.status,
    raw: cat,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => <span className="text-dark fw-semibold">{text}</span>,
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 80,
    },
    {
      title: "Category Name",
      dataIndex: "CategoryName",
      render: (text: string) => (
        <span className="d-flex align-items-center gap-2">
          <span className="avatar avatar-sm bg-primary-transparent text-primary rounded-circle">
            <i className="ti ti-pill fs-16"></i>
          </span>
          <span className="text-dark fw-bold">{text}</span>
        </span>
      ),
      sorter: (a: any, b: any) => a.CategoryName.localeCompare(b.CategoryName),
    },
    {
      title: "Description",
      dataIndex: "Description",
      render: (text: string) => (
        <span
          className="text-muted"
          style={{
            maxWidth: "300px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "normal",
            wordBreak: "break-all",
          }}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Description.localeCompare(b.Description),
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => new Date(a.raw.createdAt).getTime() - new Date(b.raw.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`badge border ${text === "Active" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} px-2 py-1 fs-12 fw-medium`}>
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
          <Link to="#" className="bg-transparent border-0 text-info p-1" title="View Details" onClick={(e) => { e.preventDefault(); setViewCategory(record.raw); triggerModal("view_pharmacy_category"); }}>
            <i className="ti ti-eye fs-18"></i>
          </Link>
          <Link to="#" className="bg-transparent border-0 text-primary p-1" onClick={(e) => { e.preventDefault(); handleOpenEdit(record.raw); }} title="Edit">
            <i className="ti ti-edit fs-18"></i>
          </Link>
          <Link to="#" className="bg-transparent border-0 text-danger p-1" onClick={(e) => { e.preventDefault(); handleOpenDelete(record.raw); }} title="Delete">
            <i className="ti ti-trash fs-18"></i>
          </Link>
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
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                <i className="ti ti-pill me-2 text-primary fs-20"></i>
                Medicine Category
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "200px" }}>
                <input type="text" className="form-control fs-13 py-2" placeholder="Search Category..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "140px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Active"); }}>Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Inactive"); }}>Inactive</Link></li>
                </ul>
              </div>

              <button className="btn btn-primary d-flex align-items-center justify-content-center" style={{ minHeight: "38px", whiteSpace: "nowrap" }} onClick={handleOpenAdd}>
                Add Category <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="border rounded bg-white">
              <EmptyState title="No categories yet" message="Create your first medicine category to organize pharmacy products." />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable columns={columns} dataSource={data} Selection={true} searchText={searchText} onSelectionChange={(keys) => setSelectedIds(keys as string[])} />
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow" onClick={() => triggerModal("bulk_delete_pharmacy_category")} style={{ borderRadius: "8px", minHeight: "42px", fontWeight: "bold" }}>
                <i className="ti ti-trash fs-18"></i> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowAddModal(false)} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-pill"></i> Add Medicine Category
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="e.g. Tablet, Capsule, Syrup" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={3} placeholder="Provide category details..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Saving..." : "Save Category"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowEditModal(false)} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-edit"></i> Edit Medicine Category
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Updating..." : "Update Category"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <div className="modal fade" id="delete_pharmacy_category">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-delete-pharmacy-category" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleDeleteConfirm} disabled={submitting}>{submitting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BULK DELETE MODAL */}
      <div className="modal fade" id="bulk_delete_pharmacy_category">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete selected categories?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-bulk-delete-pharmacy-category" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleBulkDelete} disabled={submitting}>{submitting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <ViewModal id="view_pharmacy_category" title="Category Details" subtitle="View medicine category information" headerIcon={<i className="ti ti-pill" />}
        highlightTitle={viewCategory?.name || "Category"}
        highlightStatus={<span className={`badge border ${viewCategory?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}><i className="ti ti-point-filled me-1"></i>{viewCategory?.status}</span>}
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-pill" />, label: "Category Name", value: viewCategory?.name || "—" },
          { icon: <i className="ti ti-calendar" />, label: "Created Date", value: viewCategory?.createdAt ? dayjs(viewCategory.createdAt).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-file-description" />, label: "Description", value: viewCategory?.description || "No description provided", fullWidth: true },
        ]}
        onEdit={() => { document.getElementById("btn-close-view-pharmacy-category")?.click(); handleOpenEdit(viewCategory); }} editLabel="Edit Category" editModalTarget=""
      />
    </>
  );
};

export default PharmacyCategoryManagement;
