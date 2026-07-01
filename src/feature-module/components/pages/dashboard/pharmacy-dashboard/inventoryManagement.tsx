import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import dayjs from "dayjs";
import { useMedicines } from "../../../../../core/hooks/useMedicines";
import { usePharmacyCategories } from "../../../../../core/hooks/usePharmacyCategories";
import EmptyState from "../../../../../core/common/emptyState";
import { toast } from "react-toastify";

const InventoryManagement = () => {
  const { medicines, loading, refetch: refetchMedicines, addStock } = useMedicines();
  const { categories } = usePharmacyCategories();

  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [quantityToAdd, setQuantityToAdd] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineId) {
      toast.error("Please select a medicine");
      return;
    }
    const qty = Number(quantityToAdd);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await addStock(selectedMedicineId, qty);
      toast.success("Stock added successfully!");
      setShowAddStockModal(false);
      setSelectedMedicineId("");
      setQuantityToAdd("");
      refetchMedicines();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStockStatus, setFilterStockStatus] = useState<string>("All");
  const [filterExpiryStatus, setFilterExpiryStatus] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  // Helper helper to check expiry status
  const getExpiryStatus = (expiryDateStr: string | null | undefined) => {
    if (!expiryDateStr) return { label: "No Expiry", color: "badge-soft-secondary border-secondary", key: "none" };
    const expiry = dayjs(expiryDateStr);
    const today = dayjs();
    if (expiry.isBefore(today, "day")) {
      return { label: "Expired", color: "badge-soft-danger border-danger animate-pulse", key: "expired" };
    }
    if (expiry.diff(today, "day") <= 60) {
      return { label: "Expiring Soon", color: "badge-soft-warning border-warning", key: "soon" };
    }
    return { label: "Valid", color: "badge-soft-success border-success", key: "valid" };
  };

  // Helper to get stock status
  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Out of Stock", color: "badge-soft-danger border-danger", key: "out" };
    if (current <= min) return { label: "Low Stock", color: "badge-soft-warning border-warning", key: "low" };
    return { label: "Good Stock", color: "badge-soft-success border-success", key: "good" };
  };

  // Filter and Search logic
  const filteredData = useMemo(() => {
    return medicines.filter((med) => {
      const currentStock = (med.stockIn || 0) - (med.stockOut || 0);
      const stockAlert = med.minimumStockAlert;
      
      // Stock status check
      let matchStock = true;
      if (filterStockStatus === "Low Stock") {
        matchStock = currentStock > 0 && currentStock <= stockAlert;
      } else if (filterStockStatus === "Out of Stock") {
        matchStock = currentStock === 0;
      } else if (filterStockStatus === "Good Stock") {
        matchStock = currentStock > stockAlert;
      }

      // Expiry status check
      let matchExpiry = true;
      const exp = getExpiryStatus(med.expiryDate);
      if (filterExpiryStatus === "Expired") {
        matchExpiry = exp.key === "expired";
      } else if (filterExpiryStatus === "Expiring Soon") {
        matchExpiry = exp.key === "soon";
      } else if (filterExpiryStatus === "Valid") {
        matchExpiry = exp.key === "valid";
      }

      const matchCategory = filterCategory === "All" || med.categoryId === filterCategory;
      const matchSearch =
        med.medicineName.toLowerCase().includes(searchText.toLowerCase()) ||
        (med.genericName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (med.brandName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (med.medicineCode || "").toLowerCase().includes(searchText.toLowerCase());

      return matchStock && matchExpiry && matchCategory && matchSearch;
    });
  }, [medicines, filterStockStatus, filterExpiryStatus, filterCategory, searchText]);

  const data = filteredData.map((med, index) => {
    const currentStock = (med.stockIn || 0) - (med.stockOut || 0);
    const stockStatus = getStockStatus(currentStock, med.minimumStockAlert);
    const expiryStatus = getExpiryStatus(med.expiryDate);

    return {
      key: med.id,
      id: med.id,
      S_No: index + 1,
      MedicineName: med.medicineName,
      Category: med.category?.name || "—",
      OpeningStock: `${med.openingStock} ${med.unit || "Tablet"}`,
      StockIn: `${med.stockIn} ${med.unit || "Tablet"}`,
      StockOut: `${med.stockOut} ${med.unit || "Tablet"}`,
      CurrentStock: `${currentStock} ${med.unit || "Tablet"}`,
      ExpiryDate: med.expiryDate ? dayjs(med.expiryDate).format("DD MMM YYYY") : "—",
      StockStatus: stockStatus,
      ExpiryStatus: expiryStatus,
      raw: med,
    };
  });

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
      title: "Category",
      dataIndex: "Category",
      render: (text: string) => <span className="badge badge-soft-primary border border-primary px-2 py-1 fs-12 fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.Category.localeCompare(b.Category),
    },
    {
      title: "Opening Stock",
      dataIndex: "OpeningStock",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.raw.openingStock - b.raw.openingStock,
    },
    {
      title: "Stock In",
      dataIndex: "StockIn",
      render: (text: string) => <span className="text-success fw-medium"><i className="ti ti-arrow-down-left me-1"></i>{text}</span>,
      sorter: (a: any, b: any) => a.raw.stockIn - b.raw.stockIn,
    },
    {
      title: "Stock Out",
      dataIndex: "StockOut",
      render: (text: string) => <span className="text-danger fw-medium"><i className="ti ti-arrow-up-right me-1"></i>{text}</span>,
      sorter: (a: any, b: any) => a.raw.stockOut - b.raw.stockOut,
    },
    {
      title: "Current Stock",
      dataIndex: "CurrentStock",
      render: (text: string, record: any) => {
        const currentStock = (record.raw.stockIn || 0) - (record.raw.stockOut || 0);
        const isLow = currentStock <= record.raw.minimumStockAlert;
        return (
          <span className={`fw-bold fs-14 ${isLow ? "text-danger" : "text-success"}`}>
            {text}
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
        const isExpired = record.ExpiryStatus.key === "expired";
        return <span className={isExpired ? "text-danger fw-bold" : "text-dark"}>{text}</span>;
      },
      sorter: (a: any, b: any) => {
        if (!a.raw.expiryDate) return 1;
        if (!b.raw.expiryDate) return -1;
        return new Date(a.raw.expiryDate).getTime() - new Date(b.raw.expiryDate).getTime();
      },
    },
    {
      title: "Alert Status",
      render: (_text: any, record: any) => (
        <div className="d-flex flex-column gap-1">
          <span className={`badge border ${record.StockStatus.color} px-2 py-1 fs-11 fw-medium text-center`}>
            {record.StockStatus.label}
          </span>
          <span className={`badge border ${record.ExpiryStatus.color} px-2 py-1 fs-11 fw-medium text-center`}>
            {record.ExpiryStatus.label}
          </span>
        </div>
      ),
      width: 140,
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
                <i className="ti ti-package me-2 text-primary fs-20"></i>
                Inventory Management
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Medicines: {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "180px" }}>
                <input type="text" className="form-control fs-13 py-2" placeholder="Search Medicine..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "150px", minHeight: "38px" }} data-bs-toggle="dropdown">
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
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "140px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Stock:</span> {filterStockStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStockStatus("All"); }}>All Stock</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStockStatus("Good Stock"); }}>Good Stock</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStockStatus("Low Stock"); }}>Low Stock</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterStockStatus("Out of Stock"); }}>Out of Stock</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "140px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Expiry:</span> {filterExpiryStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterExpiryStatus("All"); }}>All Expiry</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterExpiryStatus("Valid"); }}>Valid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterExpiryStatus("Expiring Soon"); }}>Expiring Soon</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterExpiryStatus("Expired"); }}>Expired</Link></li>
                </ul>
              </div>

              <button 
                className="btn btn-primary d-flex align-items-center justify-content-center" 
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                onClick={() => setShowAddStockModal(true)}
              >
                Add Stock <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading inventory...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="border rounded bg-white">
              <EmptyState title="No inventory data yet" message="Add medicines first to view and track automatically calculated stock and expiry alerts." />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable columns={columns} dataSource={data} Selection={false} searchText={searchText} />
            </div>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p>
        </div>
      </div>

      {/* ADD STOCK MODAL */}
      {showAddStockModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowAddStockModal(false)} />
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-package"></i> Add Medicine Stock
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddStockModal(false)}></button>
              </div>
              <form onSubmit={handleAddStockSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Medicine <span className="text-danger">*</span></label>
                    <select 
                      className="form-select animate-fade-in" 
                      value={selectedMedicineId} 
                      onChange={(e) => setSelectedMedicineId(e.target.value)}
                      required
                    >
                      <option value="">Choose a medicine...</option>
                      {medicines.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.medicineName} ({med.medicineCode || ""}) - Current: {(med.stockIn || 0) - (med.stockOut || 0)} {med.unit || "Tablet"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Quantity to Add <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 50" 
                      min={1}
                      value={quantityToAdd} 
                      onChange={(e) => setQuantityToAdd(e.target.value === "" ? "" : parseInt(e.target.value))}
                      required 
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddStockModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={submitting || !selectedMedicineId || !quantityToAdd}>
                    {submitting ? "Adding..." : "Add Stock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryManagement;
