import { useState, useMemo, useEffect } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { DatePicker } from "antd";
import { Link } from "react-router";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import html2pdf from "html2pdf.js";
import PharmacyInvoicePrintLayout from "./PharmacyInvoicePrintLayout";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import { useMedicines } from "../../../../../core/hooks/useMedicines";
import { usePharmacyBilling } from "../../../../../core/hooks/usePharmacyBilling";
import type { PharmacyInvoice } from "../../../../../core/hooks/usePharmacyBilling";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import EmptyState from "../../../../../core/common/emptyState";
import AddPatientModal from "../../clinic-modules/appointments/modals/addPatientModal";
import { IconFormControl } from "../../../../../core/common/form-fields";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";

interface BillingItem {
  medicineId: string;
  medicineName: string;
  quantity: number | "";
  unitCost: number;
  gst: number;
  amount: number;
  currentStock: number;
}

const PharmacyBilling = () => {
  const { invoices, loading, refetch: refetchInvoices, createInvoice } = usePharmacyBilling();
  const { patients, refetch: refetchPatients } = useClinicPatients();
  const { medicines, refetch: refetchMedicines } = useMedicines();
  const { prescriptions } = usePrescriptions();

  // Search and status filter for table
  const [searchText, setSearchText] = useState("");
  const [filterPayment, setFilterPayment] = useState("All");

  // Show Add Bill Modal
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState<any | null>(null);
  const [printAction, setPrintAction] = useState<"print" | "download" | null>(null);
  const [viewInvoiceData, setViewInvoiceData] = useState<PharmacyInvoice | null>(null);

  // Form states inside modal
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Patient modal within billing modal
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const patientPrescriptions = useMemo(() => {
    if (!selectedPatientId) return [];
    return prescriptions.filter((p: any) => p.patientId === selectedPatientId);
  }, [prescriptions, selectedPatientId]);

  const handleApplyPrescription = (pres: any) => {
    if (!pres.medicines || !Array.isArray(pres.medicines)) return;
    
    let addedItems: BillingItem[] = [];
    let warnings: string[] = [];
    
    pres.medicines.forEach((m: any) => {
      let searchName = m.medicineName;
      const dashIndex = searchName.indexOf(" - ");
      if (dashIndex !== -1) {
        searchName = searchName.substring(0, dashIndex);
      }

      const matchedMed = medicines.find(item => item.medicineName.toLowerCase() === searchName.toLowerCase());
      if (!matchedMed) {
        warnings.push(`"${searchName}" not found in inventory.`);
        return;
      }
      
      const currentStock = (matchedMed.stockIn || 0) - (matchedMed.stockOut || 0);
      if (currentStock <= 0) {
        warnings.push(`"${matchedMed.medicineName}" is out of stock.`);
        return;
      }
      
      const isExpired = matchedMed.expiryDate && new Date(matchedMed.expiryDate) < new Date();
      if (isExpired) {
        warnings.push(`"${matchedMed.medicineName}" is expired.`);
        return;
      }
      
      const costBeforeGst = 1 * matchedMed.sellingPrice;
      const gstAmount = costBeforeGst * (matchedMed.gst / 100);
      addedItems.push({
        medicineId: matchedMed.id,
        medicineName: matchedMed.medicineName,
        quantity: 1,
        unitCost: matchedMed.sellingPrice,
        gst: matchedMed.gst,
        amount: costBeforeGst + gstAmount,
        currentStock
      });
    });
    
    if (addedItems.length > 0) {
      setBillingItems(prev => {
        const updated = [...prev];
        addedItems.forEach(newItem => {
          const exists = updated.find(item => item.medicineId === newItem.medicineId);
          if (!exists) {
            updated.push(newItem);
          }
        });
        return updated;
      });
      toast.success(`Added ${addedItems.length} medicine(s) from prescription!`);
    }
    
    if (warnings.length > 0) {
      toast.warning(`Some medicines could not be loaded: ${warnings.join(", ")}`, { autoClose: 5000 });
    }
  };

  const patientOptions = useMemo(() => {
    return patients.map(p => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName} (${p.patientCode || ""}) - ${p.phone || ""}`
    }));
  }, [patients]);

  const selectedPatientOption = useMemo(() => {
    return patientOptions.find(o => o.value === selectedPatientId) || null;
  }, [patientOptions, selectedPatientId]);

  const medicineOptions = useMemo(() => {
    return medicines
      .filter(m => m.status === "Active")
      .map(m => {
        const currentStock = (m.stockIn || 0) - (m.stockOut || 0);
        const isExpired = m.expiryDate && new Date(m.expiryDate) < new Date();
        let label = `${m.medicineName} (${m.medicineCode || ""}) - Stock: ${currentStock} ${m.unit || "Tablet"} | Price: ₹${m.sellingPrice}`;
        if (isExpired) {
          label += " (Expired)";
        }
        return {
          value: m.id,
          label,
          disabled: currentStock <= 0 || isExpired
        };
      });
  }, [medicines]);


  // Open Billing Modal Reset
  const handleOpenAddBill = () => {
    setSelectedPatientId("");
    setBillingItems([]);
    setSelectedMedId("");
    setDiscountPercent(0);
    setPaymentMethod("Cash");
    setPaymentStatus("Paid");
    setShowAddBillModal(true);
  };

  // Select medicine logic - immediately adds medicine to billing items with quantity 1
  const handleSelectMedicine = (medId: string) => {
    if (!medId) return;
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
    if (isExpired) {
      toast.error("This medicine is expired and cannot be sold!");
      return;
    }

    const currentStock = (med.stockIn || 0) - (med.stockOut || 0);
    if (currentStock <= 0) {
      toast.error("This medicine is out of stock!");
      return;
    }

    const existingItem = billingItems.find(item => item.medicineId === med.id);
    const totalQtyNeeded = 1 + (existingItem ? (Number(existingItem.quantity) || 0) : 0);

    if (totalQtyNeeded > currentStock) {
      toast.error(`Insufficient stock! Only ${currentStock} units remaining.`);
      return;
    }

    if (existingItem) {
      setBillingItems(prev => prev.map(item => {
        if (item.medicineId === med.id) {
          const newQty = (Number(item.quantity) || 0) + 1;
          const costBeforeGst = newQty * item.unitCost;
          const gstAmount = costBeforeGst * (item.gst / 100);
          return {
            ...item,
            quantity: newQty,
            amount: costBeforeGst + gstAmount
          };
        }
        return item;
      }));
    } else {
      const costBeforeGst = 1 * med.sellingPrice;
      const gstAmount = costBeforeGst * (med.gst / 100);
      setBillingItems(prev => [
        ...prev,
        {
          medicineId: med.id,
          medicineName: med.medicineName,
          quantity: 1,
          unitCost: med.sellingPrice,
          gst: med.gst,
          amount: costBeforeGst + gstAmount,
          currentStock
        }
      ]);
    }
    setSelectedMedId("");
  };

  const handleUpdateItemQty = (medId: string, valStr: string) => {
    if (valStr === "") {
      setBillingItems(prev => prev.map(item => {
        if (item.medicineId === medId) {
          return {
            ...item,
            quantity: "",
            amount: 0
          };
        }
        return item;
      }));
      return;
    }

    let newQty = parseInt(valStr) || 0;
    if (newQty < 1) newQty = 1;

    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    const currentStock = (med.stockIn || 0) - (med.stockOut || 0);

    if (newQty > currentStock) {
      toast.error(`Insufficient stock! Only ${currentStock} units remaining.`);
      return;
    }

    setBillingItems(prev => prev.map(item => {
      if (item.medicineId === medId) {
        const costBeforeGst = newQty * item.unitCost;
        const gstAmount = costBeforeGst * (item.gst / 100);
        return {
          ...item,
          quantity: newQty,
          amount: costBeforeGst + gstAmount
        };
      }
      return item;
    }));
  };

  const handleBlurItemQty = (medId: string, qty: number | "") => {
    if (qty === "" || qty < 1) {
      handleUpdateItemQty(medId, "1");
    }
  };

  const handleRemoveItem = (medId: string) => {
    setBillingItems(prev => prev.filter(item => item.medicineId !== medId));
  };

  // Calculations for billing modal
  const subTotal = useMemo(() => {
    return billingItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * item.unitCost), 0);
  }, [billingItems]);

  const totalGst = useMemo(() => {
    return billingItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * item.unitCost * (item.gst / 100)), 0);
  }, [billingItems]);

  const discountAmount = useMemo(() => {
    const amt = (subTotal * discountPercent) / 100;
    return amt < 0 ? 0 : amt;
  }, [subTotal, discountPercent]);

  const totalAmount = useMemo(() => {
    const total = subTotal + totalGst - discountAmount;
    return total < 0 ? 0 : total;
  }, [subTotal, totalGst, discountAmount]);

  // Generate Bill
  const handleSubmitBill = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }
    if (billingItems.length === 0) {
      toast.error("Please add at least one medicine to the bill");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        discount: discountAmount,
        tax: totalGst,
        subTotal,
        totalAmount,
        paymentMethod,
        paymentStatus,
        items: billingItems.map(item => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: Number(item.quantity) || 1,
          unitCost: item.unitCost,
          gst: item.gst,
          amount: item.amount
        }))
      };

      const invoice = await createInvoice(payload);
      toast.success("Bill generated successfully and inventory updated!");
      setShowAddBillModal(false);

      refetchInvoices();
      refetchMedicines();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate bill");
    } finally {
      setSubmitting(false);
    }
  };



  const triggerModal = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && (window as any).bootstrap) {
        (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
      }
    }, 50);
  };

  const buildInvoiceData = (inv: any) => {
    if (!inv) return null;
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const loginClinic = userObj?.clinic || {};
    const clinic = inv.clinic || loginClinic || {};

    const clinicName = clinic.name || userObj.clinicName || userObj.name || "Clinic";
    const clinicPhone = clinic.phone || userObj.phone || "";
    const clinicEmail = clinic.email || clinic.ownerEmail || userObj.email || "";

    const addressParts = [
      clinic.addressLine1,
      clinic.addressLine2,
      clinic.city,
      clinic.state,
      clinic.country,
      clinic.pincode ? `PIN - ${clinic.pincode}` : "",
    ].filter(Boolean);
    const clinicAddress = addressParts.length > 0 ? addressParts.join(", ") : clinic.address || "";

    return {
      ...inv,
      clinic: {
        ...clinic,
        name: clinicName,
        phone: clinicPhone,
        email: clinicEmail,
        addressLine1: clinic.addressLine1 || clinicAddress,
        addressLine2: clinic.addressLine2 || "",
        city: clinic.city || "",
        state: clinic.state || "",
        country: clinic.country || "",
        pincode: clinic.pincode || "",
        landingPage: {
          tagline: clinic.landingPage?.tagline || clinic.tagline || "",
          logo: clinic.landingPage?.logo || clinic.logo || null,
          email: clinic.landingPage?.email || clinicEmail,
        },
      },
      invoiceCode: inv.invoiceNo,
      items: inv.items?.map((item: any) => {
        const descParts = [];
        if (item.medicine?.brandName) descParts.push(`Brand: ${item.medicine.brandName}`);
        if (item.medicine?.genericName) descParts.push(`Generic: ${item.medicine.genericName}`);
        if (item.medicine?.medicineCode) descParts.push(`SKU: ${item.medicine.medicineCode}`);
        return {
          ...item,
          name: item.medicineName,
          description: descParts.join(" | ") || undefined,
        };
      }) || [],
      isPharmacy: true,
    };
  };

  useEffect(() => {
    if (!printInvoiceData || !printAction) return;

    let triggered = false;

    const run = () => {
      if (triggered) return true;
      const el = document.getElementById("pharmacy-invoice-print");
      const slip = el?.querySelector(".pharm-slip");
      if (!el || !slip) return false;

      triggered = true;

      if (printAction === "print") {
        requestAnimationFrame(() => {
          window.print();
          setTimeout(() => {
            setPrintInvoiceData(null);
            setPrintAction(null);
          }, 800);
        });
      } else if (printAction === "download") {
        const prevStyle = el.getAttribute("style") || "";
        el.setAttribute(
          "style",
          "position:fixed;left:0;top:0;width:210mm;opacity:1;z-index:99999;pointer-events:none;background:#fff;"
        );

        const opt = {
          margin: 0,
          filename: `Pharmacy-Invoice-${printInvoiceData.invoiceNo || printInvoiceData.invoiceCode || "bill"}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        };

        html2pdf()
          .from(el)
          .set(opt)
          .save()
          .finally(() => {
            if (prevStyle) el.setAttribute("style", prevStyle);
            else el.removeAttribute("style");
            setPrintInvoiceData(null);
            setPrintAction(null);
          });
      }
      return true;
    };

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (run() || attempts >= 20) clearInterval(timer);
    }, 100);

    return () => clearInterval(timer);
  }, [printInvoiceData, printAction]);

  const handlePrint = (inv: any) => {
    if (!inv) return;
    setPrintInvoiceData(buildInvoiceData(inv));
    setPrintAction("print");
  };

  const handleDownload = (inv: any) => {
    if (!inv) return;
    setPrintInvoiceData(buildInvoiceData(inv));
    setPrintAction("download");
  };

  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  // Main list filters
  const filteredData = useMemo(() => {
    return invoices.filter(inv => {
      const matchPayment = filterPayment === "All" || inv.paymentStatus === filterPayment;
      const patientName = inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase() : "";
      const custName = inv.customerName ? inv.customerName.toLowerCase() : "";
      const matchesMedicine = inv.items?.some((item: any) =>
        item.medicineName.toLowerCase().includes(searchText.toLowerCase())
      ) || false;
      const matchSearch =
        inv.invoiceNo.toLowerCase().includes(searchText.toLowerCase()) ||
        patientName.includes(searchText.toLowerCase()) ||
        custName.includes(searchText.toLowerCase()) ||
        matchesMedicine;

      const matchDate = !filterDate || dayjs(inv.invoiceDate).isSame(filterDate, "day");

      return matchPayment && matchSearch && matchDate;
    });
  }, [invoices, filterPayment, searchText, filterDate]);

  const data = filteredData.map((inv, index) => ({
    key: inv.id,
    id: inv.id,
    S_No: index + 1,
    InvoiceNo: inv.invoiceNo,
    Customer: inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : inv.customerName || "Walk-in Customer",
    Phone: inv.patient?.phone || inv.customerPhone || "—",
    Date: dayjs(inv.invoiceDate).format("DD MMM YYYY HH:mm"),
    Total: `₹${inv.totalAmount.toFixed(2)}`,
    Method: inv.paymentMethod,
    Status: inv.paymentStatus,
    raw: inv
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
      title: "Invoice No",
      dataIndex: "InvoiceNo",
      render: (text: string) => <span className="text-dark fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.InvoiceNo.localeCompare(b.InvoiceNo),
    },
    {
      title: "Customer Name",
      dataIndex: "Customer",
      render: (text: string, record: any) => (
        <div>
          <span className="text-dark fw-semibold d-block">{text}</span>
          {record.Phone && record.Phone !== "—" && <small className="text-muted">{record.Phone}</small>}
        </div>
      ),
      sorter: (a: any, b: any) => a.Customer.localeCompare(b.Customer),
    },
    {
      title: "Billing Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => new Date(a.raw.invoiceDate).getTime() - new Date(b.raw.invoiceDate).getTime(),
    },
    {
      title: "Grand Total",
      dataIndex: "Total",
      render: (text: string) => <span className="text-dark fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.raw.totalAmount - b.raw.totalAmount,
    },
    {
      title: "Method",
      dataIndex: "Method",
      render: (text: string) => <span className="text-muted">{text}</span>,
      sorter: (a: any, b: any) => a.Method.localeCompare(b.Method),
    },
    {
      title: "Payment",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
          style={{
            backgroundColor:
              text === "Paid"
                ? "#e6f8ef"
                : text === "Partial"
                  ? "#fff3cd"
                  : "#fdeded",
            color:
              text === "Paid"
                ? "#198754"
                : text === "Partial"
                  ? "#fd7e14"
                  : "#dc3545",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          <i
            className={`${
              text === "Paid"
                ? "ti ti-circle-check"
                : text === "Partial"
                  ? "ti ti-clock"
                  : "ti ti-circle-x"
            } fs-14`}
          />
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
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            onClick={() => {
              setViewInvoiceData(record.raw);
              triggerModal("view_invoice");
            }}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-secondary p-1"
            title="Print Invoice"
            onClick={() => handlePrint(record.raw)}
          >
            <i className="ti ti-printer fs-18"></i>
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-success p-1"
            title="Download PDF"
            onClick={() => handleDownload(record.raw)}
          >
            <i className="ti ti-download fs-18"></i>
          </button>
        </div>
      ),
      width: 120,
    }
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                <i className="ti ti-file-invoice me-2 text-primary fs-20"></i>
                Pharmacy Billing
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Bills: {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="search-field position-relative" style={{ width: "220px" }}>
                <IconFormControl fieldLabel="search" type="text" className="fs-13 py-2" placeholder="Search Invoice/Patient/Medicine..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>

              {/* Date Filter */}
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap fs-13"
                style={{ width: "130px", minHeight: "38px", paddingTop: "7px" }}
                format="DD-MM-YYYY"
                allowClear={true}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap fs-13" style={{ minWidth: "150px", minHeight: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Payment:</span> {filterPayment}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("All"); }}>All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("Paid"); }}>Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1 fs-13" onClick={(e) => { e.preventDefault(); setFilterPayment("Unpaid"); }}>Unpaid</Link></li>
                </ul>
              </div>

              <button className="btn btn-primary d-flex align-items-center justify-content-center" style={{ minHeight: "38px", whiteSpace: "nowrap" }} onClick={handleOpenAddBill}>
                Create Bill <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading billing list...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="border rounded bg-white">
              <EmptyState title="No billing records" message="Generate your first pharmacy customer bill using the Create Bill button." />
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

      {/* CREATE BILL MODAL */}
      {showAddBillModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowAddBillModal(false)} />
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-file-invoice"></i> Create Pharmacy Bill
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddBillModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
                <div className="row g-3">
                  {/* Patient & Medicine Selector in one row */}
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold mb-0">Patient Name <span className="text-danger">*</span></label>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-flex align-items-center py-1 px-2"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddBillModal(false); setShowAddPatientModal(true); }}
                      >
                        <i className="ti ti-plus me-1" /> Add Patient
                      </button>
                    </div>
                    <CommonSelect
                      options={patientOptions}
                      value={selectedPatientOption}
                      placeholder="Select Patient"
                      onChange={(opt) => setSelectedPatientId(opt?.value || "")}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold mb-1" style={{ marginTop: "1px" }}>Select Medicine</label>
                    <CommonSelect
                      options={medicineOptions}
                      value={medicineOptions.find(o => o.value === selectedMedId) || null}
                      placeholder="Search and select medicine to add..."
                      onChange={(opt) => handleSelectMedicine(opt?.value || "")}
                    />
                  </div>

                  {selectedPatientId && patientPrescriptions.length > 0 && (
                    <div className="col-12 mt-2 border-top pt-2">
                      <label className="form-label fw-bold text-primary mb-1.5 fs-12"><i className="ti ti-clipboard-list me-1"></i>Select from Patient's Previous Prescriptions</label>
                      <div className="d-flex flex-wrap gap-2">
                        {patientPrescriptions.map((pres: any) => {
                          const dateStr = dayjs(pres.appointment?.scheduledAt || pres.createdAt).format("DD MMM YYYY, hh:mm A");
                          const apptCode = pres.appointment?.appointmentCode || pres.prescriptionCode || "Direct Visit";
                          const medicineCount = pres.medicines?.length || 0;
                          return (
                            <button
                              key={pres.id}
                              type="button"
                              className="btn btn-sm btn-outline-info text-start d-flex flex-column p-2 rounded-3 border-secondary-subtle"
                              style={{ minWidth: '180px', flex: '1 1 180px', background: '#fafcff' }}
                              onClick={() => handleApplyPrescription(pres)}
                            >
                              <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                                <span className="fw-bold text-dark fs-12">{apptCode}</span>
                                <span className="badge bg-soft-info text-info border border-info-subtle fs-10">{medicineCount} meds</span>
                              </div>
                              <span className="text-muted fs-11" style={{ fontSize: '10.5px' }}><i className="ti ti-calendar me-1"></i>{dateStr}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="col-12 mt-4">
                    {billingItems.length === 0 ? (
                      <p className="text-muted text-center py-4 bg-light rounded-3 mb-0">No medicines added to bill yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Medicine</th>
                              <th className="text-center" style={{ width: "90px" }}>Qty</th>
                              <th className="text-end">Cost</th>
                              <th className="text-center">GST</th>
                              <th className="text-end">Total</th>
                              <th className="text-center" style={{ width: "60px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {billingItems.map((item) => (
                              <tr key={item.medicineId}>
                                <td className="fw-semibold text-dark">{item.medicineName}</td>
                                <td className="text-center">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center px-1"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItemQty(item.medicineId, e.target.value)}
                                    onBlur={() => handleBlurItemQty(item.medicineId, item.quantity)}
                                  />
                                </td>
                                <td className="text-end">₹{item.unitCost.toFixed(2)}</td>
                                <td className="text-center">{item.gst}%</td>
                                <td className="text-end fw-bold text-dark">₹{item.amount.toFixed(2)}</td>
                                <td className="text-center">
                                  <button type="button" className="btn btn-sm btn-outline-danger border-0 p-1" onClick={() => handleRemoveItem(item.medicineId)}>
                                    <i className="ti ti-trash fs-14"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Checkout Summary Grid */}
                  <div className="col-12 mt-4 bg-light p-3 rounded-3">
                    <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Checkout Summary</h6>
                    <div className="row g-3 align-items-center">
                      <div className="col-md-3">
                        <span className="text-muted d-block">Subtotal</span>
                        <span className="fw-bold text-dark fs-14">₹{subTotal.toFixed(2)}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="text-muted d-block">GST (Tax)</span>
                        <span className="fw-bold text-dark fs-14">₹{totalGst.toFixed(2)}</span>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label text-muted mb-0">Discount (%)</label>
                        <IconFormControl
                          fieldLabel="Amount"
                          type="number"
                          min={0}
                          max={100}
                          className="form-control-sm"
                          placeholder="0"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          onFocus={() => { if (discountPercent === 0) setDiscountPercent("" as any); }}
                          onBlur={() => { if (discountPercent.toString().trim() === "") setDiscountPercent(0); }}
                        />
                      </div>
                      <div className="col-md-3">
                        <span className="text-muted d-block">Grand Total</span>
                        <span className="fw-bold text-primary fs-16">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="row g-3 mt-2">
                      <div className="col-md-6">
                        <label className="form-label text-muted mb-1">Payment Status</label>
                        <select className="form-select form-select-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>
                      </div>
                      {paymentStatus === "Paid" && (
                        <div className="col-md-6">
                          <label className="form-label text-muted mb-1">Payment Method</label>
                          <select className="form-select form-select-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="Cash">Cash</option>
                            <option value="UPI / QR Code">UPI / QR Code</option>
                            <option value="Card">Card</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-light" onClick={() => setShowAddBillModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary px-4 fw-bold"
                  disabled={submitting || billingItems.length === 0}
                  onClick={handleSubmitBill}
                >
                  {submitting ? "Saving Bill..." : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REGISTER PATIENT MODAL */}
      <AddPatientModal
        show={showAddPatientModal}
        onHide={() => {
          setShowAddPatientModal(false);
          setShowAddBillModal(true);
        }}
        onSuccess={(newPatient) => {
          refetchPatients();
          setSelectedPatientId(newPatient.id);
          setShowAddPatientModal(false);
          setShowAddBillModal(true);
        }}
      />

      {/* Pharmacy Invoice Print Layout (portal) */}
      <PharmacyInvoicePrintLayout invoice={printInvoiceData} />

      {/* VIEW DETAILS MODAL */}
      <ViewModal
        id="view_invoice"
        title="Pharmacy Invoice Details"
        subtitle="View pharmacy billing details"
        headerIcon={<i className="ti ti-file-invoice" />}
        highlightTitle={
          viewInvoiceData?.patient
            ? `${viewInvoiceData.patient.firstName} ${viewInvoiceData.patient.lastName}`
            : viewInvoiceData?.customerName || "Walk-in Patient"
        }
        highlightStatus={
          <span className={`badge border ${viewInvoiceData?.paymentStatus === "Paid" ? "bg-success-transparent text-success border-success" : "bg-danger-transparent text-danger border-danger"} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewInvoiceData?.paymentStatus || "Unpaid"}
          </span>
        }
        highlightColor="#e0f2fe"
        details={
          viewInvoiceData
            ? [
              { icon: <i className="ti ti-receipt" />, label: "Invoice No", value: viewInvoiceData.invoiceNo },
              { icon: <i className="ti ti-calendar" />, label: "Invoice Date", value: dayjs(viewInvoiceData.invoiceDate).format("DD MMM YYYY") },
              { icon: <i className="ti ti-user" />, label: "Patient / Customer", value: viewInvoiceData.patient ? `${viewInvoiceData.patient.firstName} ${viewInvoiceData.patient.lastName} (${viewInvoiceData.patient.patientCode || "--"})` : viewInvoiceData.customerName || "Walk-in Patient", fullWidth: true },
              { icon: <i className="ti ti-phone" />, label: "Mobile No.", value: viewInvoiceData.patient?.phone || viewInvoiceData.customerPhone || "—" },
              { icon: <i className="ti ti-credit-card" />, label: "Payment Mode", value: viewInvoiceData.paymentMethod },
              { icon: <i className="ti ti-cash" />, label: "Sub Total", value: `₹${viewInvoiceData.subTotal.toFixed(2)}` },
              { icon: <i className="ti ti-discount" />, label: "Discount Amount", value: `₹${viewInvoiceData.discount.toFixed(2)}` },
              { icon: <i className="ti ti-receipt-tax" />, label: "GST Tax", value: `₹${viewInvoiceData.tax.toFixed(2)}` },
              { icon: <i className="ti ti-currency-rupee" />, label: "Total Paid Amount", value: `₹${viewInvoiceData.totalAmount.toFixed(2)}`, fullWidth: true },
            ]
            : []
        }
      >
        {viewInvoiceData && (
          <div className="mt-4 border-top pt-3">
            <h6 className="fw-bold text-dark mb-3"><i className="ti ti-pill me-2 text-primary"></i>Medicines Detail</h6>
            <div className="table-responsive text-start">
              <table className="table table-bordered table-striped align-middle fs-13 mb-0">
                <thead className="table-light text-start">
                  <tr className="text-start">
                    <th className="text-start">Medicine Description</th>
                    <th className="text-center" style={{ width: "100px" }}>Qty</th>
                    <th className="text-end" style={{ width: "120px" }}>Unit Cost</th>
                    <th className="text-end" style={{ width: "140px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody className="text-start">
                  {viewInvoiceData.items?.map((item: any, i: number) => {
                    const descParts = [];
                    if (item.medicine?.brandName) descParts.push(`Brand: ${item.medicine.brandName}`);
                    if (item.medicine?.genericName) descParts.push(`Generic: ${item.medicine.genericName}`);
                    if (item.medicine?.medicineCode) descParts.push(`SKU: ${item.medicine.medicineCode}`);
                    const desc = descParts.join(" | ");

                    return (
                      <tr key={i} className="text-start">
                        <td className="text-start">
                          <div className="fw-semibold text-dark">{item.medicineName}</div>
                          {desc && <small className="text-muted d-block mt-1">{desc}</small>}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">₹{item.unitCost.toFixed(2)}</td>
                        <td className="text-end fw-medium">₹{item.amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ViewModal>
    </>
  );
};

export default PharmacyBilling;
