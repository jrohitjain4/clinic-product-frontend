import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

interface Department {
  id: string;
  name: string;
}

interface IPDCategory {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  _count?: { treatments: number };
}

interface Treatment {
  id: string;
  procedureName: string;
  procedureCode?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  categoryId?: string | null;
  categoryRef?: { id: string; name: string } | null;
  category: string;
  procedureFee: number;
  otCharges: number;
  anaesthesiaCharges: number;
  surgeonCharges: number;
  assistantSurgeonCharges: number;
  totalPrice: number;
  estimatedDuration?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
}

const DEFAULT_CATEGORIES = [
  "Minor Procedure",
  "Major Surgery",
  "Day Care Procedure",
  "OT Procedure",
];

const DURATIONS = [
  "30 Minutes",
  "45 Minutes",
  "1 Hour",
  "1.5 Hours",
  "2 Hours",
  "3 Hours",
  "4 Hours",
  "5+ Hours",
];

const IpdTreatmentsPage: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"procedures" | "categories">("procedures");

  // Data States
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<IPDCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Procedure Modal State
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [isEditingProcedure, setIsEditingProcedure] = useState(false);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [submittingProcedure, setSubmittingProcedure] = useState(false);

  // Procedure Form Fields
  const [procedureName, setProcedureName] = useState("");
  const [procedureCode, setProcedureCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("Minor Procedure");
  const [procedureFee, setProcedureFee] = useState("");
  const [otCharges, setOtCharges] = useState("");
  const [anaesthesiaCharges, setAnaesthesiaCharges] = useState("");
  const [surgeonCharges, setSurgeonCharges] = useState("");
  const [assistantSurgeonCharges, setAssistantSurgeonCharges] = useState("");
  const [totalChargeInput, setTotalChargeInput] = useState(""); // Direct Total Charge Input
  const [isManualTotal, setIsManualTotal] = useState(false); // Track if user manually typed total
  const [estimatedDuration, setEstimatedDuration] = useState("1 Hour");
  const [description, setDescription] = useState("");

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryInputName, setCategoryInputName] = useState("");
  const [categoryInputDesc, setCategoryInputDesc] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Fetch Treatments, Categories & Departments
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [trtRes, catRes, deptRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/treatments"), { headers }),
        fetch(apiUrl("/api/ipd/categories"), { headers }),
        fetch(apiUrl("/api/departments"), { headers }),
      ]);

      if (trtRes.ok) {
        const data = await trtRes.json();
        setTreatments(Array.isArray(data) ? data : []);
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(Array.isArray(data) ? data : []);
      }
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(Array.isArray(data) ? data.filter((d: any) => d.status === "Active" || !d.status) : []);
      }
    } catch (err: any) {
      toast.error("Failed to load IPD treatment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine fetched categories with defaults for dropdown
  const categoryOptions = useMemo(() => {
    const customNames = categories.map((c) => c.name);
    const combined = [...customNames];
    DEFAULT_CATEGORIES.forEach((d) => {
      if (!combined.includes(d)) combined.push(d);
    });
    return combined;
  }, [categories]);

  // Reset Procedure Form
  const resetProcedureForm = () => {
    setProcedureName("");
    setProcedureCode("");
    setDepartmentId(departments[0]?.id || "");
    setSelectedCategoryId(categories[0]?.id || "");
    setCategoryName(categoryOptions[0] || "Minor Procedure");
    setProcedureFee("");
    setOtCharges("");
    setAnaesthesiaCharges("");
    setSurgeonCharges("");
    setAssistantSurgeonCharges("");
    setTotalChargeInput("");
    setIsManualTotal(false);
    setEstimatedDuration("1 Hour");
    setDescription("");
    setIsEditingProcedure(false);
    setEditingProcedureId(null);
  };

  const handleOpenAddProcedureModal = () => {
    resetProcedureForm();
    if (departments.length > 0) setDepartmentId(departments[0].id);
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      setCategoryName(categories[0].name);
    }
    setShowProcedureModal(true);
  };

  const handleEditProcedure = (trt: Treatment) => {
    setEditingProcedureId(trt.id);
    setIsEditingProcedure(true);
    setProcedureName(trt.procedureName || "");
    setProcedureCode(trt.procedureCode || "");
    setDepartmentId(trt.departmentId || trt.department?.id || "");
    setSelectedCategoryId(trt.categoryId || trt.categoryRef?.id || "");
    setCategoryName(trt.categoryRef?.name || trt.category || "Minor Procedure");
    setProcedureFee(trt.procedureFee ? String(trt.procedureFee) : "");
    setOtCharges(trt.otCharges ? String(trt.otCharges) : "");
    setAnaesthesiaCharges(trt.anaesthesiaCharges ? String(trt.anaesthesiaCharges) : "");
    setSurgeonCharges(trt.surgeonCharges ? String(trt.surgeonCharges) : "");
    setAssistantSurgeonCharges(trt.assistantSurgeonCharges ? String(trt.assistantSurgeonCharges) : "");
    setTotalChargeInput(trt.totalPrice ? String(trt.totalPrice) : "");
    setIsManualTotal(true);
    setEstimatedDuration(trt.estimatedDuration || "1 Hour");
    setDescription(trt.description || "");
    setShowProcedureModal(true);
  };

  const handleDeleteProcedure = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this procedure?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/treatments/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete procedure");
      toast.success("Procedure deleted successfully");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSubmitProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureName.trim()) {
      toast.error("Procedure Name is required.");
      return;
    }
    if (!totalChargeInput || parseFloat(totalChargeInput) <= 0) {
      toast.error("Please enter a valid Total Charge for this procedure.");
      return;
    }

    setSubmittingProcedure(true);
    const token = localStorage.getItem("token");

    const payload = {
      procedureName: procedureName.trim(),
      procedureCode: procedureCode.trim() || undefined,
      departmentId: departmentId || undefined,
      categoryId: selectedCategoryId || undefined,
      category: categoryName || "Minor Procedure",
      procedureFee: parseFloat(procedureFee) || 0,
      otCharges: parseFloat(otCharges) || 0,
      anaesthesiaCharges: parseFloat(anaesthesiaCharges) || 0,
      surgeonCharges: parseFloat(surgeonCharges) || 0,
      assistantSurgeonCharges: parseFloat(assistantSurgeonCharges) || 0,
      totalPrice: parseFloat(totalChargeInput) || 0,
      estimatedDuration,
      description: description.trim() || undefined,
    };

    try {
      const res = await fetch(
        apiUrl(isEditingProcedure ? `/api/ipd/treatments/${editingProcedureId}` : "/api/ipd/treatments"),
        {
          method: isEditingProcedure ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Saving procedure failed");
      }

      toast.success(isEditingProcedure ? "Procedure updated successfully!" : "Procedure added successfully!");
      setShowProcedureModal(false);
      resetProcedureForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving procedure");
    } finally {
      setSubmittingProcedure(false);
    }
  };

  // Category Modal Handlers
  const handleOpenAddCategoryModal = () => {
    setCategoryInputName("");
    setCategoryInputDesc("");
    setIsEditingCategory(false);
    setEditingCategoryId(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat: IPDCategory) => {
    setEditingCategoryId(cat.id);
    setIsEditingCategory(true);
    setCategoryInputName(cat.name);
    setCategoryInputDesc(cat.description || "");
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/categories/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete category");
      toast.success("Category deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInputName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSubmittingCategory(true);
    const token = localStorage.getItem("token");
    const payload = {
      name: categoryInputName.trim(),
      description: categoryInputDesc.trim() || undefined,
    };

    try {
      const res = await fetch(
        apiUrl(isEditingCategory ? `/api/ipd/categories/${editingCategoryId}` : "/api/ipd/categories"),
        {
          method: isEditingCategory ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Saving category failed");
      }

      const savedCategory = await res.json();
      toast.success(isEditingCategory ? "Category updated!" : "New Category added successfully!");
      setShowCategoryModal(false);

      // If user added a category while creating a procedure, select it!
      if (!isEditingCategory && savedCategory?.id) {
        setSelectedCategoryId(savedCategory.id);
        setCategoryName(savedCategory.name);
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error saving category");
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Filtered Procedures
  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const matchQuery =
        t.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.procedureCode && t.procedureCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.department?.name && t.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory =
        selectedCategoryFilter === "All" ||
        t.category === selectedCategoryFilter ||
        t.categoryRef?.name === selectedCategoryFilter;
      return matchQuery && matchCategory;
    });
  }, [treatments, searchQuery, selectedCategoryFilter]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="page-title mb-0">IPD Treatment & Surgery Master</h3>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Search Input */}
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: "220px" }}
              placeholder="Search procedure/code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Category Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {(searchQuery || selectedCategoryFilter !== "All") && (
              <button
                className="btn btn-sm btn-light border fw-semibold"
                style={{ fontSize: '12px', borderRadius: '6px' }}
                onClick={() => { setSearchQuery(""); setSelectedCategoryFilter("All"); }}
              >
                <i className="ti ti-x me-1" />Clear
              </button>
            )}

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleOpenAddCategoryModal}
            >
              <i className="ti ti-folder-plus me-1" /> + Add Category
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddProcedureModal}
            >
              <i className="ti ti-plus me-1" /> + Add Surgery / Procedure
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs nav-tabs-bottom mb-4">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "procedures" ? "active text-primary" : "text-muted"}`}
              onClick={() => setActiveTab("procedures")}
            >
              <i className="ti ti-stethoscope me-2" />
              Surgery / Treatment Procedures ({treatments.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "categories" ? "active text-primary" : "text-muted"}`}
              onClick={() => setActiveTab("categories")}
            >
              <i className="ti ti-category me-2" />
              IPD Treatment Categories ({categories.length})
            </button>
          </li>
        </ul>

        {/* TAB 1: PROCEDURES TABLE */}
        {activeTab === "procedures" && (
          <>


            {/* Procedures Data Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="text-muted mt-2 mb-0">Loading procedures...</p>
                  </div>
                ) : filteredTreatments.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-stethoscope fs-40 text-muted mb-2 d-block" />
                    <h5 className="fw-bold">No Surgery / Treatment Procedures Found</h5>
                    <p className="text-muted fs-13 mb-3">
                      Start by adding your first surgery or procedure with total charges & component breakdown.
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={handleOpenAddProcedureModal}>
                      <i className="ti ti-plus me-1" /> Add Surgery / Procedure
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Code</th>
                          <th>Procedure / Surgery Name</th>
                          <th>Department</th>
                          <th>Category</th>
                          <th>Breakdown Details</th>
                          <th className="text-end">Total Charge</th>
                          <th>Duration</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTreatments.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <span className="badge bg-soft-dark text-dark fw-bold">
                                {t.procedureCode || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold text-dark d-block">{t.procedureName}</span>
                              {t.description && (
                                <small className="text-muted d-block text-truncate" style={{ maxWidth: "220px" }}>
                                  {t.description}
                                </small>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-soft-info text-info fw-medium">
                                {t.department?.name || "General"}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-soft-primary text-primary fw-semibold">
                                {t.categoryRef?.name || t.category || "Minor Procedure"}
                              </span>
                            </td>
                            <td>
                              <div className="fs-12 text-muted">
                                <div>Proc Fee: ₹{t.procedureFee}</div>
                                {t.otCharges > 0 && <div>OT Charges: ₹{t.otCharges}</div>}
                                {t.anaesthesiaCharges > 0 && <div>Anaesthesia: ₹{t.anaesthesiaCharges}</div>}
                                {t.surgeonCharges > 0 && <div>Surgeon: ₹{t.surgeonCharges}</div>}
                                {t.assistantSurgeonCharges > 0 && <div>Asst Surg: ₹{t.assistantSurgeonCharges}</div>}
                              </div>
                            </td>
                            <td className="text-end">
                              <h6 className="fw-bold text-success mb-0 fs-15">
                                ₹{t.totalPrice.toLocaleString("en-IN")}
                              </h6>
                              <small className="text-muted fs-11">Total Charge</small>
                            </td>
                            <td>
                              <span className="text-secondary fs-13">
                                <i className="ti ti-clock me-1 text-muted" />
                                {t.estimatedDuration || "—"}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-icon btn-light me-1"
                                onClick={() => handleEditProcedure(t)}
                                title="Edit Procedure"
                              >
                                <i className="ti ti-edit text-primary" />
                              </button>
                              <button
                                className="btn btn-sm btn-icon btn-light text-danger"
                                onClick={() => handleDeleteProcedure(t.id)}
                                title="Delete Procedure"
                              >
                                <i className="ti ti-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: CATEGORIES TABLE */}
        {activeTab === "categories" && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 text-dark">IPD Treatment / Surgery Categories</h5>
              <button className="btn btn-sm btn-primary" onClick={handleOpenAddCategoryModal}>
                <i className="ti ti-plus me-1" /> Add Category
              </button>
            </div>
            <div className="card-body p-0">
              {categories.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-category fs-40 text-muted mb-2 d-block" />
                  <h5 className="fw-bold">No Custom Categories Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    Add custom IPD categories like Major Surgery, Minor OT, Cosmetic Surgery, Day Care, etc.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenAddCategoryModal}>
                    <i className="ti ti-plus me-1" /> Add Category
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Linked Procedures</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => (
                        <tr key={cat.id}>
                          <td className="fw-bold text-muted">{idx + 1}</td>
                          <td>
                            <span className="fw-bold text-dark">{cat.name}</span>
                          </td>
                          <td>
                            <span className="text-muted fs-13">{cat.description || "—"}</span>
                          </td>
                          <td>
                            <span className="badge bg-soft-info text-info">
                              {cat._count?.treatments || 0} Procedures
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-soft-success text-success">
                              {cat.status || "Active"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-icon btn-light me-1"
                              onClick={() => handleEditCategory(cat)}
                              title="Edit Category"
                            >
                              <i className="ti ti-edit text-primary" />
                            </button>
                            <button
                              className="btn btn-sm btn-icon btn-light text-danger"
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="Delete Category"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PROCEDURE */}
      {showProcedureModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-stethoscope me-2" />
                  {isEditingProcedure ? "Edit Surgery / Procedure" : "Add Surgery / Procedure"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowProcedureModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitProcedure}>
                <div className="modal-body p-4">
                  {/* Basic Information */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Basic Information
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">
                        Procedure Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Hand Fracture Surgery"
                        value={procedureName}
                        onChange={(e) => setProcedureName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label fw-semibold">
                        Procedure Code <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. ORTH-001"
                        value={procedureCode}
                        onChange={(e) => setProcedureCode(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label fw-semibold mb-0">
                          Category <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-link p-0 fs-12 text-primary text-decoration-none fw-bold"
                          onClick={() => {
                            setShowProcedureModal(false);
                            handleOpenAddCategoryModal();
                          }}
                        >
                          + Add New Category
                        </button>
                      </div>
                      <select
                        className="form-select"
                        value={selectedCategoryId || categoryName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const foundCat = categories.find((c) => c.id === val || c.name === val);
                          if (foundCat) {
                            setSelectedCategoryId(foundCat.id);
                            setCategoryName(foundCat.name);
                          } else {
                            setSelectedCategoryId("");
                            setCategoryName(val);
                          }
                        }}
                        required
                      >
                        {categories.length > 0 && (
                          <optgroup label="Custom IPD Categories">
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Standard Categories">
                          {DEFAULT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Direct Total Charge */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between">
                    <span>
                      <span className="badge bg-success rounded-circle p-1 me-2" style={{ width: "8px", height: "8px" }} />
                      Pricing Breakdown & Total Charge
                    </span>
                  </h6>

                  {/* DIRECT TOTAL CHARGE INPUT FIELD */}
                  <div className="p-3 bg-soft-success border border-success rounded-3 mb-3">
                    <div className="row align-items-center g-2">
                      <div className="col-md-7">
                        <label className="form-label fw-bold text-dark mb-0">
                          <i className="ti ti-currency-rupee text-success me-1" />
                          Total Procedure Charge (₹) <span className="text-danger">*</span>
                        </label>
                        <small className="text-muted d-block">
                          Enter total procedure charge manually (Independent of breakdown fees below)
                        </small>
                      </div>
                      <div className="col-md-5">
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-success text-white fw-bold">₹</span>
                          <input
                            type="number"
                            className="form-control fw-bold text-success fs-18"
                            placeholder="e.g. 5000"
                            value={totalChargeInput}
                            onChange={(e) => setTotalChargeInput(e.target.value)}
                            min={0}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Procedure Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 2500"
                        value={procedureFee}
                        onChange={(e) => setProcedureFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">OT Charges (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 1000"
                        value={otCharges}
                        onChange={(e) => setOtCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Anaesthesia Charges (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 500"
                        value={anaesthesiaCharges}
                        onChange={(e) => setAnaesthesiaCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Surgeon Charges (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 1000"
                        value={surgeonCharges}
                        onChange={(e) => setSurgeonCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Assistant Surgeon Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 500 (Optional)"
                        value={assistantSurgeonCharges}
                        onChange={(e) => setAssistantSurgeonCharges(e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Duration & Notes */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-warning rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Duration & Notes
                  </h6>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estimated Duration</label>
                      <select
                        className="form-select"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Description / Notes <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Special preparation or notes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowProcedureModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submittingProcedure}
                  >
                    {submittingProcedure ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving...
                      </>
                    ) : isEditingProcedure ? (
                      "Update Procedure"
                    ) : (
                      "Save Procedure"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT IPD CATEGORY */}
      {showCategoryModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-category me-2" />
                  {isEditingCategory ? "Edit IPD Category" : "Add New IPD Category"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCategoryModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitCategory}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Major OT Surgery, Cosmetic Surgery, Day Care"
                      value={categoryInputName}
                      onChange={(e) => setCategoryInputName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Description <span className="text-muted font-normal">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Brief details about this category..."
                      value={categoryInputDesc}
                      onChange={(e) => setCategoryInputDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submittingCategory}
                  >
                    {submittingCategory ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving...
                      </>
                    ) : isEditingCategory ? (
                      "Update Category"
                    ) : (
                      "Save Category"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default IpdTreatmentsPage;
