import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { DatePicker } from "antd";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useMedicines } from "../../../../../core/hooks/useMedicines";
import type { Medicine } from "../../../../../core/hooks/useMedicines";
import { usePharmacyCategories } from "../../../../../core/hooks/usePharmacyCategories";
import EmptyState from "../../../../../core/common/emptyState";

const MedicineManagement = () => {
  const { medicines, loading, createMedicine, updateMedicine, deleteMedicine, bulkDeleteMedicines } = useMedicines();
  const { categories } = usePharmacyCategories();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterExpiryPreset, setFilterExpiryPreset] = useState<string>("All");
  const [filterExpiryStartDate, setFilterExpiryStartDate] = useState<dayjs.Dayjs | null>(null);
  const [filterExpiryEndDate, setFilterExpiryEndDate] = useState<dayjs.Dayjs | null>(null);
  const [searchText, setSearchText] = useState<string>("");

  // Modal states
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [viewMedicine, setViewMedicine] = useState<Medicine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formHsn, setFormHsn] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const [formPurchasePrice, setFormPurchasePrice] = useState("0");
  const [formSellingPrice, setFormSellingPrice] = useState("0");
  const [formGst, setFormGst] = useState("0");
  const [formMrp, setFormMrp] = useState("0");

  const [formOpeningStock, setFormOpeningStock] = useState("0");
  const [formMinStock, setFormMinStock] = useState("0");
  const [formUnit, setFormUnit] = useState("Tablet");

  const [formBatch, setFormBatch] = useState("");
  const [formMfgDate, setFormMfgDate] = useState("");
  const [formExpDate, setFormExpDate] = useState("");

  const [formPrescription, setFormPrescription] = useState(false);
  const [formStatus, setFormStatus] = useState("Active");

  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  const handleOpenAdd = () => {
    setFormName("");
    setFormGeneric("");
    setFormBrand("");
    setFormCategory(categories[0]?.id || "");
    setFormManufacturer("");
    setFormCode("");
    setFormHsn("");
    setFormDesc("");
    setFormPurchasePrice("0");
    setFormSellingPrice("0");
    setFormGst("0");
    setFormMrp("0");
    setFormOpeningStock("0");
    setFormMinStock("0");
    setFormUnit("Tablet");
    setFormBatch("");
    setFormMfgDate("");
    setFormExpDate("");
    setFormPrescription(false);
    setFormStatus("Active");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Medicine Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createMedicine({
        medicineName: formName.trim(),
        genericName: formGeneric.trim() || undefined,
        brandName: formBrand.trim() || undefined,
        categoryId: formCategory || undefined,
        manufacturer: formManufacturer.trim() || undefined,
        medicineCode: formCode.trim() || undefined,
        hsnCode: formHsn.trim() || undefined,
        description: formDesc.trim() || undefined,
        purchasePrice: parseFloat(formPurchasePrice) || 0,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        gst: parseFloat(formGst) || 0,
        mrp: parseFloat(formMrp) || 0,
        openingStock: parseInt(formOpeningStock) || 0,
        minimumStockAlert: parseInt(formMinStock) || 0,
        unit: formUnit,
        batchNumber: formBatch.trim() || undefined,
        manufacturingDate: formMfgDate ? new Date(formMfgDate).toISOString() : undefined,
        expiryDate: formExpDate ? new Date(formExpDate).toISOString() : undefined,
        prescriptionRequired: formPrescription,
        status: formStatus,
      });
      toast.success("Medicine added successfully!");
      setShowAddModal(false);
    } catch (err: any) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (med: Medicine) => {
    setSelectedMedicine(med);
    setFormName(med.medicineName);
    setFormGeneric(med.genericName || "");
    setFormBrand(med.brandName || "");
    setFormCategory(med.categoryId || "");
    setFormManufacturer(med.manufacturer || "");
    setFormCode(med.medicineCode || "");
    setFormHsn(med.hsnCode || "");
    setFormDesc(med.description || "");
    setFormPurchasePrice(med.purchasePrice.toString());
    setFormSellingPrice(med.sellingPrice.toString());
    setFormGst(med.gst.toString());
    setFormMrp(med.mrp.toString());
    setFormOpeningStock(med.openingStock.toString());
    setFormMinStock(med.minimumStockAlert.toString());
    setFormUnit(med.unit || "Tablet");
    setFormBatch(med.batchNumber || "");
    setFormMfgDate(med.manufacturingDate ? dayjs(med.manufacturingDate).format("YYYY-MM-DD") : "");
    setFormExpDate(med.expiryDate ? dayjs(med.expiryDate).format("YYYY-MM-DD") : "");
    setFormPrescription(med.prescriptionRequired);
    setFormStatus(med.status);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Medicine Name is required");
      return;
    }
    if (selectedMedicine) {
      setSubmitting(true);
      try {
        await updateMedicine(selectedMedicine.id, {
          medicineName: formName.trim(),
          genericName: formGeneric.trim() || undefined,
          brandName: formBrand.trim() || undefined,
          categoryId: formCategory || undefined,
          manufacturer: formManufacturer.trim() || undefined,
          medicineCode: formCode.trim() || undefined,
          hsnCode: formHsn.trim() || undefined,
          description: formDesc.trim() || undefined,
          purchasePrice: parseFloat(formPurchasePrice) || 0,
          sellingPrice: parseFloat(formSellingPrice) || 0,
          gst: parseFloat(formGst) || 0,
          mrp: parseFloat(formMrp) || 0,
          openingStock: parseInt(formOpeningStock) || 0,
          minimumStockAlert: parseInt(formMinStock) || 0,
          unit: formUnit,
          batchNumber: formBatch.trim() || undefined,
          manufacturingDate: formMfgDate ? new Date(formMfgDate).toISOString() : null,
          expiryDate: formExpDate ? new Date(formExpDate).toISOString() : null,
          prescriptionRequired: formPrescription,
          status: formStatus,
        });
        toast.success("Medicine updated successfully!");
        setShowEditModal(false);
        setSelectedMedicine(null);
      } catch (err: any) {
        // handled
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleOpenDelete = (med: Medicine) => {
    setSelectedMedicine(med);
    triggerModal("delete_medicine");
  };

  const handleDeleteConfirm = async () => {
    if (selectedMedicine) {
      setSubmitting(true);
      try {
        await deleteMedicine(selectedMedicine.id);
        setSelectedIds(selectedIds.filter((id) => id !== selectedMedicine.id));
        toast.success("Medicine deleted successfully!");
        document.getElementById("btn-close-delete-medicine")?.click();
        setSelectedMedicine(null);
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
      await bulkDeleteMedicines(selectedIds);
      setSelectedIds([]);
      toast.success("Selected medicines deleted successfully!");
      document.getElementById("btn-close-bulk-delete-medicine")?.click();
    } catch (err: any) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and Search logic
  const filteredData = useMemo(() => {
    return medicines.filter((med) => {
      const matchStatus = filterStatus === "All" || med.status === filterStatus;
      const matchCategory = filterCategory === "All" || med.categoryId === filterCategory;
      
      let matchExpiry = true;
      if (filterExpiryPreset !== "All") {
        if (med.expiryDate) {
          const exp = dayjs(med.expiryDate);
          const today = dayjs().startOf('day');
          const endOfToday = dayjs().endOf('day');

          if (filterExpiryPreset === "Today") {
            matchExpiry = exp.isSame(dayjs(), 'day');
          } else if (filterExpiryPreset === "Expired") {
            matchExpiry = exp.isBefore(today);
          } else if (filterExpiryPreset === "Last 7 Days") {
            matchExpiry = exp.isAfter(dayjs().subtract(7, 'day').startOf('day')) && exp.isBefore(endOfToday);
          } else if (filterExpiryPreset === "Upcoming 7 Days") {
            matchExpiry = exp.isAfter(today.subtract(1, 'second')) && exp.isBefore(dayjs().add(7, 'day').endOf('day'));
          } else if (filterExpiryPreset === "Custom") {
            const expDate = exp.startOf('day');
            if (filterExpiryStartDate && filterExpiryEndDate) {
              const start = filterExpiryStartDate.startOf('day');
              const end = filterExpiryEndDate.startOf('day');
              matchExpiry = (expDate.isAfter(start) || expDate.isSame(start, 'day')) && 
                            (expDate.isBefore(end) || expDate.isSame(end, 'day'));
            } else if (filterExpiryStartDate) {
              const start = filterExpiryStartDate.startOf('day');
              matchExpiry = expDate.isAfter(start) || expDate.isSame(start, 'day');
            } else if (filterExpiryEndDate) {
              const end = filterExpiryEndDate.startOf('day');
              matchExpiry = expDate.isBefore(end) || expDate.isSame(end, 'day');
            } else {
              matchExpiry = true;
            }
          } else {
            matchExpiry = false;
          }
        } else {
          // If a preset is requested but the medicine has no expiry date, it doesn't match.
          matchExpiry = false;
        }
      }

      const matchSearch =
        med.medicineName.toLowerCase().includes(searchText.toLowerCase()) ||
        (med.genericName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (med.brandName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (med.medicineCode || "").toLowerCase().includes(searchText.toLowerCase());
      return matchStatus && matchCategory && matchExpiry && matchSearch;
    });
  }, [medicines, filterStatus, filterCategory, filterExpiryPreset, filterExpiryStartDate, filterExpiryEndDate, searchText]);

  const data = filteredData.map((med, index) => ({
    key: med.id,
    id: med.id,
    S_No: index + 1,
    MedicineName: med.medicineName,
    GenericName: med.genericName || "—",
    BrandName: med.brandName || "—",
    Category: med.category?.name || "—",
    Stock: `${(med.stockIn || 0) - (med.stockOut || 0)} ${med.unit || "Tablet"}`,
    ExpiryDate: med.expiryDate ? dayjs(med.expiryDate).format("DD MMM YYYY") : "—",
    Price: `₹${med.sellingPrice}`,
    MRP: `₹${med.mrp}`,
    Batch: med.batchNumber || "—",
    Prescription: med.prescriptionRequired ? "Yes" : "No",
    Status: med.status,
    raw: med,
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
      title: "Medicine Name",
      dataIndex: "MedicineName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center gap-2">
          <span className="avatar avatar-sm bg-primary-transparent text-primary rounded-circle">
            <i className="ti ti-pill fs-16"></i>
          </span>
          <div>
            <span className="text-dark fw-bold d-block">{text}</span>
            <small className="text-muted">{record.raw.medicineCode || ""}</small>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.MedicineName.localeCompare(b.MedicineName),
    },
    {
      title: "Generic Name",
      dataIndex: "GenericName",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.GenericName.localeCompare(b.GenericName),
    },
    {
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => <span className="badge badge-soft-primary border border-primary px-2 py-1 fs-12 fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.Category.localeCompare(b.Category),
    },
    {
      title: "Stock",
      dataIndex: "Stock",
      render: (text: string, record: any) => {
        const currentStock = (record.raw.stockIn || 0) - (record.raw.stockOut || 0);
        const isLow = currentStock <= record.raw.minimumStockAlert;
        return (
          <span className={`fw-semibold ${isLow ? "text-danger" : "text-success"}`}>
            {text} {isLow && <i className="ti ti-alert-triangle ms-1" title="Low Stock!" />}
          </span>
        );
      },
      sorter: (a: any, b: any) => {
        const stockA = (a.raw.stockIn || 0) - (a.raw.stockOut || 0);
        const stockB = (b.raw.stockIn || 0) - (b.raw.stockOut || 0);
        return stockA - stockB;
      },
    },
    {
      title: "Expiry Date",
      dataIndex: "ExpiryDate",
      render: (text: string, record: any) => {
        const isExpired = record.raw.expiryDate && new Date(record.raw.expiryDate) < new Date();
        return (
          <span className={`fw-semibold ${isExpired ? "text-danger" : "text-dark"}`}>
            {text} {isExpired && <span className="badge bg-danger ms-1" style={{ fontSize: '9px' }}>Expired</span>}
          </span>
        );
      },
      sorter: (a: any, b: any) => {
        const dateA = a.raw.expiryDate ? new Date(a.raw.expiryDate).getTime() : 0;
        const dateB = b.raw.expiryDate ? new Date(b.raw.expiryDate).getTime() : 0;
        return dateA - dateB;
      }
    },
    {
      title: "Selling Price",
      dataIndex: "Price",
      render: (text: string) => <span className="text-dark fw-semibold">{text}</span>,
      sorter: (a: any, b: any) => a.raw.sellingPrice - b.raw.sellingPrice,
    },
    {
      title: "Rx Req.",
      dataIndex: "Prescription",
      render: (text: string) => (
        <span className={`badge ${text === "Yes" ? "bg-danger-transparent text-danger border-danger" : "bg-light text-muted"} border px-2 py-1 fs-11 fw-medium`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Prescription.localeCompare(b.Prescription),
      width: 100,
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
          <Link to="#" className="bg-transparent border-0 text-info p-1" title="View Details" onClick={(e) => { e.preventDefault(); setViewMedicine(record.raw); triggerModal("view_medicine"); }}>
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
                Medicine Management
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "200px" }}>
                <input type="text" className="form-control fs-13 py-2" placeholder="Search Medicine..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "160px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Category:</span> {filterCategory === "All" ? "All" : categories.find(c => c.id === filterCategory)?.name || "All"}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterCategory("All"); }}>All Categories</Link></li>
                  {categories.map(cat => (
                    <li key={cat.id}><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterCategory(cat.id); }}>{cat.name}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "130px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Active"); }}>Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStatus("Inactive"); }}>Inactive</Link></li>
                </ul>
              </div>

              {/* Expiry Date Filter */}
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "165px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate">
                    <span className="text-muted">Expiry:</span> {
                      filterExpiryPreset === "Custom" 
                        ? (filterExpiryStartDate || filterExpiryEndDate 
                          ? `${filterExpiryStartDate ? filterExpiryStartDate.format("DD/MM") : "From"} - ${filterExpiryEndDate ? filterExpiryEndDate.format("DD/MM") : "To"}` 
                          : "Custom")
                        : filterExpiryPreset
                    }
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3" style={{ minWidth: "260px" }}>
                  {["All", "Today", "Expired", "Last 7 Days", "Upcoming 7 Days"].map(preset => (
                    <li key={preset}>
                      <Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { 
                        e.preventDefault(); 
                        setFilterExpiryPreset(preset); 
                        setFilterExpiryStartDate(null);
                        setFilterExpiryEndDate(null);
                      }}>
                        {preset}
                      </Link>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <div className="px-2" onClick={(e) => e.stopPropagation()}>
                      <div className="form-check mb-2">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="expiryPreset" 
                          id="presetCustom" 
                          checked={filterExpiryPreset === "Custom"} 
                          onChange={() => setFilterExpiryPreset("Custom")} 
                        />
                        <label className="form-check-label fs-13 fw-semibold text-dark mb-0 ms-1" style={{ cursor: "pointer" }} htmlFor="presetCustom">
                          Custom Range
                        </label>
                      </div>
                      
                      <div className="d-flex flex-column gap-2 mt-2">
                        <div>
                          <small className="text-muted d-block mb-1">From:</small>
                          <DatePicker
                            placeholder="Select Date"
                            className="form-control text-dark text-nowrap fs-13 w-100"
                            style={{ minHeight: "34px", paddingTop: "5px" }}
                            format="DD-MM-YYYY"
                            allowClear={true}
                            suffixIcon={<i className="ti ti-calendar" />}
                            onChange={(date) => {
                              setFilterExpiryPreset("Custom");
                              setFilterExpiryStartDate(date);
                            }}
                            value={filterExpiryStartDate}
                            getPopupContainer={(trigger) => trigger.parentElement}
                          />
                        </div>
                        <div>
                          <small className="text-muted d-block mb-1">To:</small>
                          <DatePicker
                            placeholder="Select Date"
                            className="form-control text-dark text-nowrap fs-13 w-100"
                            style={{ minHeight: "34px", paddingTop: "5px" }}
                            format="DD-MM-YYYY"
                            allowClear={true}
                            suffixIcon={<i className="ti ti-calendar" />}
                            onChange={(date) => {
                              setFilterExpiryPreset("Custom");
                              setFilterExpiryEndDate(date);
                            }}
                            value={filterExpiryEndDate}
                            getPopupContainer={(trigger) => trigger.parentElement}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <button className="btn btn-primary d-flex align-items-center justify-content-center" style={{ minHeight: "38px", whiteSpace: "nowrap" }} onClick={handleOpenAdd}>
                Add Medicine <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading medicines...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="border rounded bg-white">
              <EmptyState title="No medicines yet" message="Add your first medicine to manage pharmacy stock and batch data." />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable columns={columns} dataSource={data} Selection={true} searchText={searchText} onSelectionChange={(keys) => setSelectedIds(keys as string[])} />
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow" onClick={() => triggerModal("bulk_delete_medicine")} style={{ borderRadius: "8px", minHeight: "42px", fontWeight: "bold" }}>
                <i className="ti ti-trash fs-18"></i> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ADD / EDIT MODALS CONTAINER */}
      {(showAddModal || showEditModal) && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-pill"></i> {showAddModal ? "Add Medicine" : "Edit Medicine"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}></button>
              </div>
              <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 210px)" }}>
                  
                  {/* Basic Information Section */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center">
                    <i className="ti ti-info-circle me-1" /> Basic Information
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Medicine Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="e.g. Paracetamol 650" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Generic Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Acetaminophen" value={formGeneric} onChange={(e) => setFormGeneric(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Brand Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Dolo" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                      <select className="form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Manufacturer</label>
                      <input type="text" className="form-control" placeholder="e.g. Micro Labs Ltd" value={formManufacturer} onChange={(e) => setFormManufacturer(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">SKU / Code</label>
                      <input type="text" className="form-control" placeholder="e.g. MED10009" value={formCode} onChange={(e) => setFormCode(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">HSN Code</label>
                      <input type="text" className="form-control" placeholder="e.g. 3004" value={formHsn} onChange={(e) => setFormHsn(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control" rows={2} placeholder="Medicine details, instructions, etc..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center">
                    <i className="ti ti-currency-rupee me-1" /> Pricing
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Purchase Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        value={formPurchasePrice} 
                        onChange={(e) => setFormPurchasePrice(e.target.value)} 
                        onFocus={() => { if (formPurchasePrice === "0") setFormPurchasePrice(""); }}
                        onBlur={() => { if (formPurchasePrice.trim() === "") setFormPurchasePrice("0"); }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Selling Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        value={formSellingPrice} 
                        onChange={(e) => setFormSellingPrice(e.target.value)} 
                        onFocus={() => { if (formSellingPrice === "0") setFormSellingPrice(""); }}
                        onBlur={() => { if (formSellingPrice.trim() === "") setFormSellingPrice("0"); }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">GST (%)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formGst} 
                        onChange={(e) => setFormGst(e.target.value)} 
                        onFocus={() => { if (formGst === "0") setFormGst(""); }}
                        onBlur={() => { if (formGst.trim() === "") setFormGst("0"); }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">MRP (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        value={formMrp} 
                        onChange={(e) => setFormMrp(e.target.value)} 
                        onFocus={() => { if (formMrp === "0") setFormMrp(""); }}
                        onBlur={() => { if (formMrp.trim() === "") setFormMrp("0"); }}
                      />
                    </div>
                  </div>

                  {/* Stock Information Section */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center">
                    <i className="ti ti-package me-1" /> Stock Information
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Opening Stock</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formOpeningStock} 
                        onChange={(e) => setFormOpeningStock(e.target.value)} 
                        onFocus={() => { if (formOpeningStock === "0") setFormOpeningStock(""); }}
                        onBlur={() => { if (formOpeningStock.trim() === "") setFormOpeningStock("0"); }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Min Stock Alert</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formMinStock} 
                        onChange={(e) => setFormMinStock(e.target.value)} 
                        onFocus={() => { if (formMinStock === "0") setFormMinStock(""); }}
                        onBlur={() => { if (formMinStock.trim() === "") setFormMinStock("0"); }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Unit</label>
                      <select className="form-select" value={formUnit} onChange={(e) => setFormUnit(e.target.value)}>
                        <option value="Tablet">Tablet</option>
                        <option value="Strip">Strip</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Tube">Tube</option>
                        <option value="Box">Box</option>
                        <option value="Piece">Piece</option>
                        <option value="Vial">Vial</option>
                      </select>
                    </div>
                  </div>

                  {/* Batch Information Section */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center">
                    <i className="ti ti-calendar me-1" /> Batch & Expiry
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Batch Number</label>
                      <input type="text" className="form-control" placeholder="e.g. B-9011" value={formBatch} onChange={(e) => setFormBatch(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Manufacturing Date</label>
                      <input type="date" className="form-control" value={formMfgDate} onChange={(e) => setFormMfgDate(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Expiry Date</label>
                      <input type="date" className="form-control" value={formExpDate} onChange={(e) => setFormExpDate(e.target.value)} />
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom d-flex align-items-center">
                    <i className="ti ti-settings me-1" /> Settings
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6 d-flex align-items-center">
                      <div className="form-check form-switch pt-2">
                        <input className="form-check-input" type="checkbox" id="prescriptionSwitch" checked={formPrescription} onChange={(e) => setFormPrescription(e.target.checked)} />
                        <label className="form-check-label fw-semibold ms-2" htmlFor="prescriptionSwitch">Prescription Required (Rx)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>{submitting ? "Saving..." : "Save Medicine"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <div className="modal fade" id="delete_medicine">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete <strong>{selectedMedicine?.medicineName}</strong>?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-delete-medicine" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleDeleteConfirm} disabled={submitting}>{submitting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BULK DELETE MODAL */}
      <div className="modal fade" id="bulk_delete_medicine">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <div className="mb-3"><span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24"></i></span></div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">Are you sure you want to delete selected medicines?</p>
              <div className="d-flex justify-content-center gap-2">
                <button id="btn-close-bulk-delete-medicine" type="button" className="btn btn-light position-relative z-1 px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1 px-4" onClick={handleBulkDelete} disabled={submitting}>{submitting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <ViewModal id="view_medicine" title="Medicine Details" subtitle="View full medicine information" headerIcon={<i className="ti ti-pill" />}
        highlightTitle={viewMedicine?.medicineName || "Medicine"}
        highlightStatus={<span className={`badge border ${viewMedicine?.status === "Active" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}><i className="ti ti-point-filled me-1"></i>{viewMedicine?.status}</span>}
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-barcode" />, label: "SKU / Code", value: viewMedicine?.medicineCode || "—" },
          { icon: <i className="ti ti-tag" />, label: "Brand Name", value: viewMedicine?.brandName || "—" },
          { icon: <i className="ti ti-dna" />, label: "Generic Name", value: viewMedicine?.genericName || "—" },
          { icon: <i className="ti ti-tags" />, label: "Category", value: viewMedicine?.category?.name || "—" },
          { icon: <i className="ti ti-building-factory" />, label: "Manufacturer", value: viewMedicine?.manufacturer || "—" },
          { icon: <i className="ti ti-hash" />, label: "HSN Code", value: viewMedicine?.hsnCode || "—" },
          { icon: <i className="ti ti-currency-rupee" />, label: "Selling Price", value: viewMedicine ? `₹${viewMedicine.sellingPrice}` : "—" },
          { icon: <i className="ti ti-currency-rupee" />, label: "Purchase Price", value: viewMedicine ? `₹${viewMedicine.purchasePrice}` : "—" },
          { icon: <i className="ti ti-percentage" />, label: "GST (%)", value: viewMedicine ? `${viewMedicine.gst}%` : "—" },
          { icon: <i className="ti ti-currency-rupee" />, label: "MRP", value: viewMedicine ? `₹${viewMedicine.mrp}` : "—" },
          { icon: <i className="ti ti-package" />, label: "Current Stock", value: viewMedicine ? `${viewMedicine.openingStock} ${viewMedicine.unit || "Tablet"}` : "—" },
          { icon: <i className="ti ti-alert-triangle" />, label: "Min Stock Alert", value: viewMedicine ? `${viewMedicine.minimumStockAlert} ${viewMedicine.unit || "Tablet"}` : "—" },
          { icon: <i className="ti ti-calendar" />, label: "Batch Number", value: viewMedicine?.batchNumber || "—" },
          { icon: <i className="ti ti-calendar-event" />, label: "Mfg. Date", value: viewMedicine?.manufacturingDate ? dayjs(viewMedicine.manufacturingDate).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-calendar-x" />, label: "Expiry Date", value: viewMedicine?.expiryDate ? dayjs(viewMedicine.expiryDate).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-file-certificate" />, label: "Prescription Required", value: viewMedicine?.prescriptionRequired ? "Yes (Rx)" : "No" },
          { icon: <i className="ti ti-file-description" />, label: "Description", value: viewMedicine?.description || "No description provided", fullWidth: true },
        ]}
        onEdit={() => { document.getElementById("btn-close-view-medicine")?.click(); handleOpenEdit(viewMedicine!); }} editLabel="Edit Medicine" editModalTarget=""
      />
    </>
  );
};

export default MedicineManagement;
