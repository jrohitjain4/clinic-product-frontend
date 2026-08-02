import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import Datatable from "../../../../core/common/dataTable";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";

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
  const [activeTab, setActiveTab] = useState<"procedures" | "categories" | "admission-fee">("procedures");

  // Admission Fee States
  const [admissionFee, setAdmissionFee] = useState("500");
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [savingFee, setSavingFee] = useState(false);

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

  // Auto-calculate Total Procedure Charge as sum of breakdown fees
  useEffect(() => {
    const pFee = parseFloat(procedureFee) || 0;
    const otFee = parseFloat(otCharges) || 0;
    const aFee = parseFloat(anaesthesiaCharges) || 0;
    const sFee = parseFloat(surgeonCharges) || 0;
    const asFee = parseFloat(assistantSurgeonCharges) || 0;
    const calculatedTotal = pFee + otFee + aFee + sFee + asFee;
    setTotalChargeInput(calculatedTotal > 0 ? String(calculatedTotal) : "");
  }, [procedureFee, otCharges, anaesthesiaCharges, surgeonCharges, assistantSurgeonCharges]);

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
      
      const feeRes = await fetch(apiUrl("/api/settings/ipd/admission-fee"), { headers });
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setAdmissionFee(String(feeData.ipdAdmissionFee !== undefined ? feeData.ipdAdmissionFee : "500"));
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

  const handleSaveAdmissionFee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!admissionFee || isNaN(parseFloat(admissionFee)) || parseFloat(admissionFee) < 0) {
      toast.error("Please enter a valid admission fee.");
      return;
    }

    setSavingFee(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl("/api/settings/ipd/admission-fee"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ipdAdmissionFee: parseFloat(admissionFee) }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update admission fee");
      }

      toast.success("Admission fee updated successfully!");
      setIsEditingFee(false);
    } catch (err: any) {
      toast.error(err.message || "Error updating admission fee");
    } finally {
      setSavingFee(false);
    }
  };

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

  const procedureTableData = useMemo(
    () =>
      filteredTreatments.map((t) => ({
        key: t.id,
        procedureCode: t.procedureCode || "—",
        procedureName: t.procedureName,
        description: t.description || "",
        departmentName: t.department?.name || "General",
        categoryLabel: t.categoryRef?.name || t.category || "Minor Procedure",
        procedureFee: t.procedureFee,
        otCharges: t.otCharges,
        anaesthesiaCharges: t.anaesthesiaCharges,
        surgeonCharges: t.surgeonCharges,
        assistantSurgeonCharges: t.assistantSurgeonCharges,
        totalPrice: t.totalPrice,
        estimatedDuration: t.estimatedDuration || "—",
        _raw: t,
      })),
    [filteredTreatments]
  );

  const procedureColumns = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "procedureCode",
        render: (text: string) => (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "#e2e8f0",
              color: "#1e293b",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className="ti ti-hash fs-14" />
            {text}
          </span>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.procedureCode.localeCompare(b.procedureCode),
      },
      {
        title: "Procedure / Surgery Name",
        dataIndex: "procedureName",
        render: (text: string, record: (typeof procedureTableData)[0]) => (
          <div className="lh-1">
            <h6 className="mb-1 fs-14 fw-semibold text-dark">{text}</h6>
            {record.description && (
              <span
                className="text-muted fs-12 fw-normal d-block mt-1 text-truncate"
                style={{ maxWidth: "220px" }}
              >
                {record.description}
              </span>
            )}
          </div>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.procedureName.localeCompare(b.procedureName),
      },
      {
        title: "Department",
        dataIndex: "departmentName",
        render: (text: string) => (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "#e0f2fe",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className="ti ti-building-hospital fs-14" />
            {text}
          </span>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.departmentName.localeCompare(b.departmentName),
      },
      {
        title: "Category",
        dataIndex: "categoryLabel",
        render: (text: string) => (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "#ede9fe",
              color: "#7c3aed",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className="ti ti-category fs-14" />
            {text}
          </span>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.categoryLabel.localeCompare(b.categoryLabel),
      },
      {
        title: "Breakdown Details",
        dataIndex: "procedureFee",
        render: (_: unknown, record: (typeof procedureTableData)[0]) => (
          <div className="fs-12 text-muted">
            <div>Proc Fee: ₹{record.procedureFee}</div>
            {record.otCharges > 0 && <div>OT Charges: ₹{record.otCharges}</div>}
            {record.anaesthesiaCharges > 0 && (
              <div>Anaesthesia: ₹{record.anaesthesiaCharges}</div>
            )}
            {record.surgeonCharges > 0 && <div>Surgeon: ₹{record.surgeonCharges}</div>}
            {record.assistantSurgeonCharges > 0 && (
              <div>Asst Surg: ₹{record.assistantSurgeonCharges}</div>
            )}
          </div>
        ),
      },
      {
        title: "Total Charge",
        dataIndex: "totalPrice",
        align: "right" as const,
        render: (val: number) => (
          <>
            <h6 className="fw-bold text-success mb-0 fs-15">
              ₹{val.toLocaleString("en-IN")}
            </h6>
            <small className="text-muted fs-11">Total Charge</small>
          </>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.totalPrice - b.totalPrice,
      },
      {
        title: "Duration",
        dataIndex: "estimatedDuration",
        render: (text: string) => (
          <span className="text-secondary fs-13">
            <i className="ti ti-clock me-1 text-muted" />
            {text}
          </span>
        ),
        sorter: (a: (typeof procedureTableData)[0], b: (typeof procedureTableData)[0]) =>
          a.estimatedDuration.localeCompare(b.estimatedDuration),
      },
      {
        title: "Action",
        className: "text-center text-nowrap",
        width: 120,
        align: "center" as const,
        render: (_: unknown, record: (typeof procedureTableData)[0]) => (
          <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
            <button
              type="button"
              className="bg-transparent border-0 text-primary p-1"
              title="Edit Procedure"
              onClick={() => handleEditProcedure(record._raw)}
            >
              <i className="ti ti-edit fs-18" />
            </button>
            <button
              type="button"
              className="bg-transparent border-0 text-danger p-1"
              title="Delete Procedure"
              onClick={() => handleDeleteProcedure(record.key)}
            >
              <i className="ti ti-trash fs-18" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const categoryTableData = useMemo(
    () =>
      categories.map((cat, idx) => ({
        key: cat.id,
        sr: idx + 1,
        name: cat.name,
        description: cat.description || "—",
        linkedCount: cat._count?.treatments || 0,
        status: cat.status || "Active",
        _raw: cat,
      })),
    [categories]
  );

  const categoryColumns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "sr",
        width: 60,
        sorter: (a: (typeof categoryTableData)[0], b: (typeof categoryTableData)[0]) =>
          a.sr - b.sr,
      },
      {
        title: "Category Name",
        dataIndex: "name",
        render: (text: string) => (
          <span className="fw-bold text-dark fs-14">{text}</span>
        ),
        sorter: (a: (typeof categoryTableData)[0], b: (typeof categoryTableData)[0]) =>
          a.name.localeCompare(b.name),
      },
      {
        title: "Description",
        dataIndex: "description",
        render: (text: string) => (
          <span className="text-muted fs-13">{text}</span>
        ),
      },
      {
        title: "Linked Procedures",
        dataIndex: "linkedCount",
        render: (count: number) => (
          <span className="badge bg-soft-info text-info">
            {count} Procedures
          </span>
        ),
        sorter: (a: (typeof categoryTableData)[0], b: (typeof categoryTableData)[0]) =>
          a.linkedCount - b.linkedCount,
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (text: string) => (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "#e6f8ef",
              color: "#198754",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <i className="ti ti-circle-check fs-14" />
            {text}
          </span>
        ),
      },
      {
        title: "Action",
        className: "text-center text-nowrap",
        width: 120,
        align: "center" as const,
        render: (_: unknown, record: (typeof categoryTableData)[0]) => (
          <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
            <button
              type="button"
              className="bg-transparent border-0 text-primary p-1"
              title="Edit Category"
              onClick={() => handleEditCategory(record._raw)}
            >
              <i className="ti ti-edit fs-18" />
            </button>
            <button
              type="button"
              className="bg-transparent border-0 text-danger p-1"
              title="Delete Category"
              onClick={() => handleDeleteCategory(record.key)}
            >
              <i className="ti ti-trash fs-18" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="page-wrapper">
      <style>{`
        .page-wrapper .ipd-treatments-empty-card.card,
        .page-wrapper .datatable-main-container .datatable-table-shell.card {
          border: none !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
          border-radius: 12px !important;
        }
      `}</style>
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
          <h3 className="page-title mb-0 flex-shrink-0 me-auto">IPD Treatment & Surgery Master</h3>

          <div style={{ width: "200px", flexShrink: 0 }}>
            <IconFormControl
              fieldLabel="search"
              type="text"
              className="form-control-sm"
              placeholder="Search procedure/code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{
              width: "150px",
              height: "46px",
              minHeight: "46px",
              flexShrink: 0,
              borderRadius: "12px",
              borderWidth: "1.5px",
              borderColor: "#6366f1",
              fontSize: "14px",
              fontWeight: 500,
            }}
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
              className="btn btn-light border fw-semibold d-inline-flex align-items-center"
              style={{ height: "46px", fontSize: "13px", borderRadius: "12px", flexShrink: 0 }}
              onClick={() => { setSearchQuery(""); setSelectedCategoryFilter("All"); }}
            >
              <i className="ti ti-x me-1" />Clear
            </button>
          )}

          <button
            className="btn btn-outline-primary d-inline-flex align-items-center"
            style={{ height: "46px", flexShrink: 0, borderRadius: "12px" }}
            onClick={handleOpenAddCategoryModal}
          >
            <i className="ti ti-folder-plus me-1" /> Add Category
          </button>
          <button
            className="btn btn-primary d-inline-flex align-items-center"
            style={{ height: "46px", flexShrink: 0, borderRadius: "12px" }}
            onClick={handleOpenAddProcedureModal}
          >
            <i className="ti ti-plus me-1" /> Add Surgery / Procedure
          </button>
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
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${activeTab === "admission-fee" ? "active text-primary" : "text-muted"}`}
              onClick={() => setActiveTab("admission-fee")}
            >
              <i className="ti ti-receipt-tax me-2" />
              IPD Admission Fee Configuration
            </button>
          </li>
        </ul>

        {/* TAB 1: PROCEDURES TABLE */}
        {activeTab === "procedures" && (
          <>
            {loading ? (
              <div className="card ipd-treatments-empty-card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0">Loading procedures...</p>
                </div>
              </div>
            ) : filteredTreatments.length === 0 ? (
              <div className="card ipd-treatments-empty-card">
                <div className="card-body text-center py-5">
                  <i className="ti ti-stethoscope fs-40 text-muted mb-2 d-block" />
                  <h5 className="fw-bold">No Surgery / Treatment Procedures Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    Start by adding your first surgery or procedure with total charges & component breakdown.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenAddProcedureModal}>
                    <i className="ti ti-plus me-1" /> Add Surgery / Procedure
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <Datatable
                  columns={procedureColumns}
                  dataSource={procedureTableData}
                  Selection={false}
                  searchText=""
                />
              </div>
            )}
          </>
        )}

        {/* TAB 2: CATEGORIES TABLE */}
        {activeTab === "categories" && (
          <>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <h5 className="fw-bold mb-0 text-dark">IPD Treatment / Surgery Categories</h5>
              <button className="btn btn-sm btn-primary" onClick={handleOpenAddCategoryModal}>
                <i className="ti ti-plus me-1" /> Add Category
              </button>
            </div>
            {categories.length === 0 ? (
              <div className="card ipd-treatments-empty-card">
                <div className="card-body text-center py-5">
                  <i className="ti ti-category fs-40 text-muted mb-2 d-block" />
                  <h5 className="fw-bold">No Custom Categories Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    Add custom IPD categories like Major Surgery, Minor OT, Cosmetic Surgery, Day Care, etc.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenAddCategoryModal}>
                    <i className="ti ti-plus me-1" /> Add Category
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <Datatable
                  columns={categoryColumns}
                  dataSource={categoryTableData}
                  Selection={false}
                  searchText=""
                />
              </div>
            )}
          </>
        )}

        {/* TAB 3: ADMISSION FEE CONFIGURATION */}
        {activeTab === "admission-fee" && (
          <div className="card border-0 shadow-sm rounded-3 mt-3" style={{ maxWidth: "600px" }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                <i className="ti ti-receipt-tax text-primary fs-20" />
                IPD Admission Fee Configuration
              </h5>
              <p className="text-muted fs-13 mb-4">
                This is the default admission fee charged when creating a new IPD patient admission record. 
                Doctors and admins can review or adjust this amount during the actual admission process.
              </p>

              <div className="mt-3">
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark fs-13">Admission Fee (₹)</label>
                  {isEditingFee ? (
                    <div className="input-group" style={{ maxWidth: "300px" }}>
                      <span className="input-group-text bg-light fw-bold">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 500"
                        value={admissionFee}
                        onChange={(e) => setAdmissionFee(e.target.value)}
                        disabled={savingFee}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-22 fw-extrabold text-primary">₹{parseFloat(admissionFee).toLocaleString('en-IN')}</span>
                      <span className="badge bg-light-primary text-primary px-2.5 py-1 fs-11 fw-semibold">Default Charge</span>
                    </div>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2 mt-4 pt-2 border-top">
                  {isEditingFee ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary d-inline-flex align-items-center gap-2"
                        disabled={savingFee}
                        onClick={() => handleSaveAdmissionFee()}
                      >
                        {savingFee ? (
                          <div className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <i className="ti ti-device-floppy fs-14" />
                        )}
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-light border"
                        onClick={() => {
                          setIsEditingFee(false);
                          fetchData(); // reset value
                        }}
                        disabled={savingFee}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-items-center gap-2"
                      onClick={() => setIsEditingFee(true)}
                    >
                      <i className="ti ti-edit fs-14" />
                      Edit Admission Fee
                    </button>
                  )}
                </div>
              </div>
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
                      <IconFormControl
                        fieldLabel="name"
                        type="text"
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
                      <IconFormControl
                        fieldLabel="Title"
                        type="text"
                        placeholder="Enter procedure code"
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
                      Pricing Breakdown
                    </span>
                  </h6>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Procedure Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="e.g. 2500"
                        value={procedureFee}
                        onChange={(e) => setProcedureFee(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">OT Charges (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="e.g. 1000"
                        value={otCharges}
                        onChange={(e) => setOtCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Anaesthesia Charges (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="e.g. 500"
                        value={anaesthesiaCharges}
                        onChange={(e) => setAnaesthesiaCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Surgeon Charges (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="e.g. 1000"
                        value={surgeonCharges}
                        onChange={(e) => setSurgeonCharges(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Assistant Surgeon Fee (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="e.g. 500 (Optional)"
                        value={assistantSurgeonCharges}
                        onChange={(e) => setAssistantSurgeonCharges(e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* DIRECT TOTAL CHARGE INPUT FIELD (MOVED TO BOTTOM & AUTO-SUMMED) */}
                  <div className="p-3 bg-soft-success border border-success rounded-3 mb-4">
                    <div className="row align-items-center g-2">
                      <div className="col-md-7">
                        <label className="form-label fw-bold text-dark mb-0">
                          <i className="ti ti-currency-rupee text-success me-1" />
                          Total Procedure Charge (₹) <span className="text-danger">*</span>
                        </label>
                        <small className="text-muted d-block">
                          Automatically summed from pricing breakdown above (or override manually)
                        </small>
                      </div>
                      <div className="col-md-5">
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-success text-white fw-bold">₹</span>
                          <IconFormControl
                            fieldLabel="amount"
                            type="number"
                            className="fw-bold text-success fs-18"
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
                      <IconFormControl
                        fieldLabel="description"
                        type="text"
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
                    <IconFormControl
                      fieldLabel="category"
                      type="text"
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
                    <IconTextarea
                      fieldLabel="description"
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
