import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import Datatable from "../../../../core/common/dataTable";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import IpdViewDetailsModal from "./IpdViewDetailsModal";
import { IconFormControl } from "../../../../core/common/form-fields";

interface InvoiceItem {
  id: string;
  itemType: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface IPDInvoice {
  id: string;
  invoiceNumber: string;
  admissionId: string;
  admission?: {
    id: string;
    admissionCode: string;
    status?: string;
    ward?: { wardName: string };
  };
  patient?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    patientCode?: string;
    phone?: string;
  };
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  notes?: string;
  items: InvoiceItem[];
}

interface AdmissionOption {
  id: string;
  admissionCode: string;
  patient: { fullName?: string; firstName?: string; lastName?: string; patientCode?: string };
  doctor?: { fullName: string; ipdVisitCharge?: number };
  ward?: { wardName: string; chargePerNight?: number; nursingChargePerNight?: number };
  doctorId?: string;
  doctorVisitCharge?: number;
  nursingFee?: number;
  wardId?: string;
  admissionDate?: string;
  invoices?: any[];
}

interface ChargeItemMaster {
  id: string;
  itemName: string;
  standardFee: number;
}

interface ChargeType {
  id: string;
  name: string;
  description?: string;
  items: ChargeItemMaster[];
}

interface DraftInvoiceItem {
  itemType: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

const getPatientName = (p?: { fullName?: string; firstName?: string; lastName?: string } | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

const IpdBillingsPage: React.FC = () => {
  const [invoices, setInvoices] = useState<IPDInvoice[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionOption[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [wardsList, setWardsList] = useState<any[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Raise Charge / Invoice Modal State
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  
  // Current Item Input state in Raise Modal
  const [currentType, setCurrentType] = useState("Doctor Visit");
  const [currentItemName, setCurrentItemName] = useState("");
  const [currentUnitPrice, setCurrentUnitPrice] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("1");
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [labTestsList, setLabTestsList] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");

  // Draft Items List inside Raise Modal
  const [draftItems, setDraftItems] = useState<DraftInvoiceItem[]>([]);

  const [raisePaidAmount, setRaisePaidAmount] = useState("");
  const [raisePaymentMethod, setRaisePaymentMethod] = useState("Cash");
  const [raiseNotes, setRaiseNotes] = useState("");
  const [submittingRaise, setSubmittingRaise] = useState(false);

  // Add New Charge Type Modal State
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [submittingType, setSubmittingType] = useState(false);

  // Manage Charge Types Modal State
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);
  const [selectedTypeForMaster, setSelectedTypeForMaster] = useState<ChargeType | null>(null);
  const [masterItemName, setMasterItemName] = useState("");
  const [masterItemFee, setMasterItemFee] = useState("");
  const [submittingMasterItem, setSubmittingMasterItem] = useState(false);

  // Single Invoice View Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<IPDInvoice | null>(null);
  const [showIpdViewDetailsModal, setShowIpdViewDetailsModal] = useState(false);
  const [selectedViewAdmissionData, setSelectedViewAdmissionData] = useState<any>(null);

  // Master IPD Statement Modal State
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterStatementData, setMasterStatementData] = useState<{
    admissionCode: string;
    patientName: string;
    patientCode: string;
    wardName: string;
    doctorName: string;
    invoicesCount: number;
    allItems: { itemType: string; itemName: string; unitPrice: number; quantity: number; totalPrice: number; invoiceNumber: string }[];
    totalBilled: number;
    totalPaid: number;
    dueAmount: number;
  } | null>(null);

  // Expandable Admission Rows State
  const [expandedAdmissionIds, setExpandedAdmissionIds] = useState<string[]>([]);

  const toggleExpandAdmission = (id: string) => {
    setExpandedAdmissionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Collect Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoice, setPayInvoice] = useState<IPDInvoice | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("Cash");
  const [submittingPay, setSubmittingPay] = useState(false);

  const [showAdmissionPayModal, setShowAdmissionPayModal] = useState(false);
  const [payAdmissionRecord, setPayAdmissionRecord] = useState<any>(null);
  const [admissionPaymentInput, setAdmissionPaymentInput] = useState("");
  const [admissionPaymentMethod, setAdmissionPaymentMethod] = useState("Cash");
  const [submittingAdmissionPay, setSubmittingAdmissionPay] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [invRes, admRes, ctRes, docRes, medRes, labRes, wardRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/invoices"), { headers }),
        fetch(apiUrl("/api/ipd/admissions"), { headers }),
        fetch(apiUrl("/api/ipd/charge-types"), { headers }),
        fetch(apiUrl("/api/doctors?type=IPD"), { headers }),
        fetch(apiUrl("/api/medicines"), { headers }),
        fetch(apiUrl("/api/lab-tests"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(Array.isArray(data) ? data : []);
      }
      if (admRes.ok) {
        const data = await admRes.json();
        setAdmissions(Array.isArray(data) ? data : []);
      }
      if (ctRes.ok) {
        const data = await ctRes.json();
        setChargeTypes(Array.isArray(data) ? data : []);
      }
      if (docRes.ok) {
        const data = await docRes.json();
        setDoctorsList(Array.isArray(data) ? data : []);
      }
      if (medRes.ok) {
        const data = await medRes.json();
        setMedicinesList(Array.isArray(data) ? data : []);
      }
      if (labRes.ok) {
        const data = await labRes.json();
        setLabTestsList(Array.isArray(data) ? data : []);
      }
      if (wardRes.ok) {
        const data = await wardRes.json();
        setWardsList(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast.error("Failed to load IPD billings data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      totalDue += inv.dueAmount || 0;
    });

    return {
      totalInvoices: invoices.length,
      totalBilled,
      totalPaid,
      totalDue,
    };
  }, [invoices]);

  const handlePatientChange = (admId: string) => {
    if (!admId) return;
    const admission = admissions.find((a) => a.id === admId);
    if (!admission) return;

    setCurrentType("Doctor Visit");
    const primaryDocId = admission.doctorId || "";
    setSelectedItemId(primaryDocId);
    const doc = doctorsList.find((d) => d.id === primaryDocId);
    const docName = doc ? doc.fullName : (admission.doctor?.fullName || "Assigned Doctor");
    setCurrentItemName(`Doctor Visit: Dr. ${docName}`);
    setCurrentUnitPrice(String(doc?.ipdVisitCharge || admission.doctorVisitCharge || doc?.consultationCharge || 500));
    setCurrentQuantity("1");

    if (admission.admissionDate) {
      const admDateStr = admission.admissionDate.split("T")[0];
      setInvoiceDate(admDateStr);
    } else {
      setInvoiceDate(new Date().toISOString().split("T")[0]);
    }
  };

  // Handle Type Change in Raise Modal
  const handleTypeChange = (type: string) => {
    setCurrentType(type);
    setCurrentItemName("");
    setCurrentUnitPrice("");
    setCurrentQuantity("1");
    setSelectedItemId("");

    if (!selectedAdmissionId) return;
    const admission = admissions.find((a) => a.id === selectedAdmissionId);
    if (!admission) return;

    if (type === "Doctor Visit") {
      const primaryDocId = admission.doctorId || "";
      setSelectedItemId(primaryDocId);
      const doc = doctorsList.find((d) => d.id === primaryDocId);
      const docName = doc ? doc.fullName : (admission.doctor?.fullName || "Assigned Doctor");
      setCurrentItemName(`Doctor Visit: Dr. ${docName}`);
      setCurrentUnitPrice(String(doc?.ipdVisitCharge || admission.doctorVisitCharge || doc?.consultationCharge || 500));
    } else if (type === "Nurse Visit") {
      setCurrentItemName("Daily Nursing Care Fee");
      const wardNursingFee = admission.ward?.nursingChargePerNight || admission.nursingFee || 0;
      setCurrentUnitPrice(String(wardNursingFee));
    } else if (type === "Ward Stay") {
      const primaryWardId = admission.wardId || "";
      setSelectedItemId(primaryWardId);
      const ward = wardsList.find((w) => w.id === primaryWardId);
      const wardName = ward ? ward.wardName : (admission.ward?.wardName || "Assigned Ward");
      setCurrentItemName(`Ward Stay: ${wardName}`);
      setCurrentUnitPrice(String(admission.ward?.chargePerNight || ward?.chargePerNight || 0));
    } else if (type === "Medicine") {
      if (medicinesList.length > 0) {
        const firstMed = medicinesList[0];
        setSelectedItemId(firstMed.id);
        setCurrentItemName(firstMed.medicineName);
        setCurrentUnitPrice(String(firstMed.sellingPrice || firstMed.mrp || 0));
      }
    } else if (type === "Diagnostic") {
      if (labTestsList.length > 0) {
        const firstTest = labTestsList[0];
        setSelectedItemId(firstTest.id);
        setCurrentItemName(firstTest.name);
        setCurrentUnitPrice(String(firstTest.price || 0));
      }
    } else {
      setCurrentItemName("");
      setCurrentUnitPrice("");
    }
  };

  const handleDoctorChange = (docId: string) => {
    setSelectedItemId(docId);
    const doc = doctorsList.find((d) => d.id === docId);
    if (doc) {
      setCurrentItemName(`Doctor Visit: Dr. ${doc.fullName}`);
      const admission = admissions.find((a) => a.id === selectedAdmissionId);
      if (admission && admission.doctorId === docId) {
        setCurrentUnitPrice(String(doc.ipdVisitCharge || admission.doctorVisitCharge || doc.consultationCharge || 500));
      } else {
        setCurrentUnitPrice(String(doc.ipdVisitCharge || doc.consultationCharge || 500));
      }
    }
  };

  const handleWardChange = (wardId: string) => {
    setSelectedItemId(wardId);
    const ward = wardsList.find((w) => w.id === wardId);
    if (ward) {
      setCurrentItemName(`Ward Stay: ${ward.wardName}`);
      setCurrentUnitPrice(String(ward.chargePerNight || 0));
    }
  };

  const handleMedicineChange = (medId: string) => {
    setSelectedItemId(medId);
    const med = medicinesList.find((m) => m.id === medId);
    if (med) {
      setCurrentItemName(med.medicineName);
      setCurrentUnitPrice(String(med.sellingPrice || med.mrp || 0));
    }
  };

  const handleLabTestChange = (testId: string) => {
    setSelectedItemId(testId);
    const test = labTestsList.find((t) => t.id === testId);
    if (test) {
      setCurrentItemName(test.name);
      setCurrentUnitPrice(String(test.price || 0));
    }
  };

  // Open Raise Modal
  const handleOpenRaiseModal = (admId?: string) => {
    const targetAdmId = admId || (admissions[0]?.id || "");
    setSelectedAdmissionId(targetAdmId);

    setCurrentType("Doctor Visit");
    setDraftItems([]);
    setRaisePaidAmount("");
    setRaisePaymentMethod("Cash");
    setRaiseNotes("");
    setShowRaiseModal(true);

    setTimeout(() => {
      handlePatientChange(targetAdmId);
    }, 100);
  };

  // Add Item to Draft Table inside Raise Modal
  const handleAddDraftItem = () => {
    if (!currentItemName.trim()) {
      toast.error("Please enter or select an item description.");
      return;
    }
    const uPrice = parseFloat(currentUnitPrice) || 0;
    const qty = parseInt(currentQuantity, 10) || 1;
    if (uPrice <= 0 || qty <= 0) {
      toast.error("Please enter a valid unit price and quantity.");
      return;
    }

    setDraftItems((prev) => [
      ...prev,
      {
        itemType: currentType || "General Charge",
        itemName: currentItemName.trim(),
        unitPrice: uPrice,
        quantity: qty,
      },
    ]);

    // Reset current item fields for next entry
    setCurrentItemName("");
    setCurrentUnitPrice("");
    setCurrentQuantity("1");
    toast.info("Item added to draft invoice list!");
  };

  // Remove Draft Item
  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Total amount of draft items
  const draftTotalAmount = useMemo(() => {
    let total = 0;
    draftItems.forEach((it) => {
      total += it.unitPrice * it.quantity;
    });

    // Also include currently typed item if valid and no draft items yet
    if (draftItems.length === 0 && currentItemName.trim()) {
      const uPrice = parseFloat(currentUnitPrice) || 0;
      const qty = parseInt(currentQuantity, 10) || 1;
      total += uPrice * qty;
    }

    return total;
  }, [draftItems, currentItemName, currentUnitPrice, currentQuantity]);

  // Submit Final Invoice Generation
  const handleSubmitRaiseInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      toast.error("Please select an admitted patient.");
      return;
    }

    // Build final items array
    let finalItems: DraftInvoiceItem[] = [...draftItems];
    if (finalItems.length === 0) {
      if (!currentItemName.trim()) {
        toast.error("Please add at least one charge item.");
        return;
      }
      const uPrice = parseFloat(currentUnitPrice) || 0;
      const qty = parseInt(currentQuantity, 10) || 1;
      if (uPrice <= 0 || qty <= 0) {
        toast.error("Please enter a valid price and quantity.");
        return;
      }
      finalItems.push({
        itemType: currentType || "General Charge",
        itemName: currentItemName.trim(),
        unitPrice: uPrice,
        quantity: qty,
      });
    }

    setSubmittingRaise(true);
    const token = localStorage.getItem("token");
    const payload = {
      admissionId: selectedAdmissionId,
      items: finalItems,
      paidAmount: parseFloat(raisePaidAmount) || 0,
      paymentMethod: raisePaymentMethod,
      notes: raiseNotes.trim() || undefined,
      invoiceDate,
    };

    try {
      const res = await fetch(apiUrl("/api/ipd/invoices"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to raise IPD charge");
      }

      toast.success("IPD Invoice created & generated successfully!");
      setShowRaiseModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error raising charge");
    } finally {
      setSubmittingRaise(false);
    }
  };

  // Submit Add New Charge Type Category
  const handleCreateChargeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error("Please enter charge type category name.");
      return;
    }

    setSubmittingType(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl("/api/ipd/charge-types"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          description: newTypeDesc.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create charge type");
      }

      const created = await res.json();
      toast.success(`Charge Category '${created.name}' created!`);
      setNewTypeName("");
      setNewTypeDesc("");
      setShowAddTypeModal(false);

      // Refresh charge types & set as selected
      fetchData();
      setCurrentType(created.name);
    } catch (err: any) {
      toast.error(err.message || "Error creating charge type");
    } finally {
      setSubmittingType(false);
    }
  };

  // Submit Add Master Item to Charge Type
  const handleAddMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeForMaster) return;
    if (!masterItemName.trim()) {
      toast.error("Please enter item name.");
      return;
    }

    setSubmittingMasterItem(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/charge-types/${selectedTypeForMaster.id}/items`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemName: masterItemName.trim(),
          standardFee: parseFloat(masterItemFee) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add service item");
      }

      toast.success("Standard service item added!");
      setMasterItemName("");
      setMasterItemFee("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error adding item");
    } finally {
      setSubmittingMasterItem(false);
    }
  };

  // Delete Master Item
  const handleDeleteMasterItem = async (itemId: string) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(apiUrl(`/api/ipd/charge-types/items/${itemId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Service item deleted!");
      fetchData();
    } catch (err: any) {
      toast.error("Error deleting item");
    }
  };

  // Open Collect Payment Modal
  const handleOpenPayModal = (inv: IPDInvoice) => {
    setPayInvoice(inv);
    setPaymentInput(String(inv.dueAmount || 0));
    setPaymentMethodInput("Cash");
    setShowPayModal(true);
  };

  // Submit Payment
  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice) return;
    const pAmt = parseFloat(paymentInput) || 0;
    if (pAmt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setSubmittingPay(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/invoices/${payInvoice.id}/pay`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentAmount: pAmt,
          paymentMethod: paymentMethodInput,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Payment failed");
      }

      toast.success("Payment collected successfully!");
      setShowPayModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error submitting payment");
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleOpenAdmissionPayModal = (record: any) => {
    setPayAdmissionRecord(record);
    setAdmissionPaymentInput(String(record.totalDue || 0));
    setAdmissionPaymentMethod("Cash");
    setShowAdmissionPayModal(true);
  };

  const handleSubmitAdmissionPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAdmissionRecord) return;
    const totalToPay = parseFloat(admissionPaymentInput) || 0;
    if (totalToPay <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setSubmittingAdmissionPay(true);
    const token = localStorage.getItem("token");

    try {
      const admissionId = payAdmissionRecord.admissionId;
      const fullAdmission = admissions.find((a) => a.id === admissionId);
      if (!fullAdmission) {
        throw new Error("Admission record not found");
      }

      const unpaidInvoices = [...(fullAdmission.invoices || [])]
        .filter((inv) => (inv.dueAmount || 0) > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (unpaidInvoices.length === 0) {
        toast.info("No unpaid invoices found to allocate payment.");
        setShowAdmissionPayModal(false);
        return;
      }

      let remaining = totalToPay;
      for (const inv of unpaidInvoices) {
        if (remaining <= 0) break;
        const absorb = Math.min(inv.dueAmount, remaining);
        if (absorb <= 0) continue;

        const res = await fetch(apiUrl(`/api/ipd/invoices/${inv.id}/pay`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentAmount: absorb,
            paymentMethod: admissionPaymentMethod,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to pay invoice ${inv.invoiceNumber}`);
        }
        remaining -= absorb;
      }

      toast.success("Payment collected and allocated successfully!");
      setShowAdmissionPayModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error collecting admission payment");
    } finally {
      setSubmittingAdmissionPay(false);
    }
  };

  // View Details Modal
  const handleViewInvoice = (inv: IPDInvoice) => {
    setSelectedInvoice(inv);
    setShowViewModal(true);
  };

  // View Master IPD Statement for Admission
  const handleViewMasterStatement = (admissionId: string) => {
    const relatedInvoices = invoices.filter((inv) => inv.admissionId === admissionId);
    const admissionInfo = admissions.find((a) => a.id === admissionId);

    const allItems: { itemType: string; itemName: string; unitPrice: number; quantity: number; totalPrice: number; invoiceNumber: string }[] = [];
    let totalBilled = 0;
    let totalPaid = 0;

    relatedInvoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      if (inv.items) {
        inv.items.forEach((it) => {
          allItems.push({
            itemType: it.itemType,
            itemName: it.itemName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            totalPrice: it.totalPrice,
            invoiceNumber: inv.invoiceNumber,
          });
        });
      }
    });

    const dueAmount = Math.max(0, totalBilled - totalPaid);

    setMasterStatementData({
      admissionCode: admissionInfo?.admissionCode || "IPD Admission",
      patientName: getPatientName(admissionInfo?.patient),
      patientCode: admissionInfo?.patient?.patientCode || "—",
      wardName: admissionInfo?.ward?.wardName || "Assigned Ward",
      doctorName: admissionInfo?.doctor?.fullName || "Primary Doctor",
      invoicesCount: relatedInvoices.length,
      allItems,
      totalBilled,
      totalPaid,
      dueAmount,
    });

    setShowMasterModal(true);
  };

  // Group Invoices by IPD Admission
  const groupedAdmissions = useMemo(() => {
    const map = new Map<string, {
      admissionId: string;
      admissionCode: string;
      patient: any;
      wardName: string;
      doctorName: string;
      admissionStatus: string;
      computed?: any;
      invoices: IPDInvoice[];
      totalBilled: number;
      totalPaid: number;
      totalDue: number;
      paymentStatus: string;
    }>();

    // First seed from admissions list
    admissions.forEach((adm: any) => {
      map.set(adm.id, {
        admissionId: adm.id,
        admissionCode: adm.admissionCode,
        patient: adm.patient,
        wardName: adm.ward?.wardName || "Assigned Ward",
        doctorName: adm.doctor?.fullName || "Primary Doctor",
        admissionStatus: adm.status || "Admitted",
        computed: adm.computed || null,
        invoices: [],
        totalBilled: 0,
        totalPaid: 0,
        totalDue: 0,
        paymentStatus: "Unpaid",
      });
    });

    // Populate invoices into admission groups
    invoices.forEach((inv) => {
      let group = map.get(inv.admissionId);
      if (!group) {
        group = {
          admissionId: inv.admissionId,
          admissionCode: inv.admission?.admissionCode || "IPD Admission",
          patient: inv.patient,
          wardName: inv.admission?.ward?.wardName || "Ward",
          doctorName: "Primary Doctor",
          admissionStatus: inv.admission?.status || "Admitted",
          invoices: [],
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          paymentStatus: "Unpaid",
        };
        map.set(inv.admissionId, group);
      }

      group!.invoices.push(inv);
      group!.totalBilled += inv.totalAmount || 0;
      group!.totalPaid += inv.paidAmount || 0;
      group!.totalDue += inv.dueAmount || 0;
    });

    // Compute overall paymentStatus for each grouped admission
    const result = Array.from(map.values()).map((g) => {
      const pStatus =
        g.totalPaid >= g.totalBilled && g.totalBilled > 0
          ? "Paid"
          : g.totalPaid > 0
          ? "Partial"
          : "Unpaid";
      return { ...g, paymentStatus: pStatus };
    });

    // Filter based on search query and status filter
    return result.filter((g) => {
      const pName = getPatientName(g.patient);
      const admCode = g.admissionCode || "";
      const invNumbers = g.invoices.map((inv) => inv.invoiceNumber).join(" ");

      const matchQuery =
        admCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invNumbers.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "All" || g.paymentStatus === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [admissions, invoices, searchQuery, statusFilter]);

  const tableData = useMemo(
    () =>
      groupedAdmissions.map((group) => ({
        key: group.admissionId,
        admissionId: group.admissionId,
                                        admissionCode: group.admissionCode,
        doctorName: group.doctorName,
        patientName: getPatientName(group.patient),
        patientCode: group.patient?.patientCode || "—",
        wardName: group.wardName,
        invoiceCount: group.invoices.length,
                                        totalBilled: group.totalBilled,
                                        totalPaid: group.totalPaid,
        totalDue: group.totalDue,
                                        paymentStatus: group.paymentStatus,
        admissionStatus: group.admissionStatus,
        patient: group.patient,
        invoices: group.invoices,
        computed: group.computed,
        _raw: group,
      })),
    [groupedAdmissions]
  );

  const renderExpandedRow = useCallback((record: (typeof tableData)[0]) => {
    const group = record._raw;
    return (
      <div className="ipd-billing-expanded p-2">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                      <span className="fw-bold text-dark fs-13">
                                        <i className="ti ti-file-invoice me-1 text-primary" />
                                        Individual Invoices & Receipts for Admission: {group.admissionCode}
                                      </span>
                                      <button
            type="button"
                                        className="btn btn-sm btn-primary py-0 px-2 fs-12"
                                        onClick={() => handleOpenRaiseModal(group.admissionId)}
                                      >
                                        + Raise New Charge
                                      </button>
                                    </div>

                                      {group.invoices.length === 0 ? (
                                        <div className="text-center py-3 text-muted fs-13">
                                          No individual invoices generated yet for this admission.
                                        </div>
                                      ) : (
          <div className="table-responsive border rounded mb-3">
                                        <table className="table table-bordered table-sm align-middle mb-0 fs-13">
              <thead style={{ background: "#E6E6FF" }}>
                                            <tr>
                                              <th>Invoice #</th>
                                              <th>Date</th>
                                              <th>Itemized Charges</th>
                                              <th className="text-center">Total (₹)</th>
                                              <th className="text-center">Paid (₹)</th>
                                              <th className="text-center">Due (₹)</th>
                                              <th className="text-center">Status</th>
                                              <th className="text-end">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                {group.invoices.map((inv: IPDInvoice) => (
                                              <tr key={inv.id}>
                                                <td className="fw-bold text-dark">{inv.invoiceNumber}</td>
                                                <td className="text-muted">
                                                  {new Date(inv.invoiceDate).toLocaleDateString()}
                                                </td>
                                                <td>
                                                  {inv.items && inv.items.length > 0 ? (
                                                    inv.items.map((it) => (
                                                      <div key={it.id} className="text-dark">
                            • <span className="text-muted">[{it.itemType}]</span> {it.itemName}{" "}
                            (₹{it.unitPrice} x {it.quantity})
                                                      </div>
                                                    ))
                                                  ) : (
                                                    <span className="text-muted">IPD General Charges</span>
                                                  )}
                                                </td>
                                                <td className="text-center fw-bold">₹{inv.totalAmount}</td>
                                                <td className="text-center text-success fw-bold">₹{inv.paidAmount}</td>
                                                <td className="text-center text-danger fw-bold">₹{inv.dueAmount}</td>
                                                <td className="text-center">
                                                  <span
                        className={`badge rounded-pill px-2 py-1 ${
                                                      inv.paymentStatus === "Paid"
                                                        ? "bg-soft-success text-success"
                                                        : inv.paymentStatus === "Partial"
                                                        ? "bg-soft-warning text-warning"
                                                        : "bg-soft-danger text-danger"
                                                    }`}
                                                  >
                                                    {inv.paymentStatus}
                                                  </span>
                                                </td>
                                                <td className="text-end">
                                                  <div className="btn-group btn-group-sm">
                                                    <button
                          type="button"
                                                      className="btn btn-outline-secondary"
                                                      onClick={() => handleViewInvoice(inv)}
                                                      title="View Invoice Items"
                                                    >
                                                      <i className="ti ti-eye" />
                                                    </button>
                                                    {inv.dueAmount > 0 && (
                                                      <button
                            type="button"
                                                        className="btn btn-outline-success"
                                                        onClick={() => handleOpenPayModal(inv)}
                                                        title="Collect Payment"
                                                      >
                                                        <i className="ti ti-wallet" /> Pay
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                    </div>
        )}

        {group.admissionStatus !== "Discharged" &&
          group.computed &&
          group.computed.daysStayed > 0 && (
                                        <div
                                          className="rounded-3 p-3 mb-3 border"
              style={{
                background: "linear-gradient(135deg,#fff3cd 0%,#ffeaa7 100%)",
                borderColor: "#f0c040",
              }}
                                        >
                                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-2">
                                              <i className="ti ti-building-hospital text-warning fs-20" />
                                              <div>
                                                <strong className="text-dark fs-13 d-block">
                      Running Ward Stay Charges (Auto-calculated)
                                                </strong>
                                                <small className="text-muted">
                      {group.wardName} — ₹
                      {group.computed.runningWardChargePerDay.toLocaleString("en-IN")}/day
                                                </small>
                                              </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-4">
                                              <div className="text-center">
                                                <span className="text-muted fs-11 fw-bold d-block">DAYS STAYED</span>
                                                <strong className="text-dark fs-16">{group.computed.daysStayed} Days</strong>
                                              </div>
                                              <div className="text-center">
                                                <span className="text-muted fs-11 fw-bold d-block">WARD CHARGES</span>
                    <strong className="text-warning fs-16">
                      ₹{group.computed.runningWardChargeTotal.toLocaleString("en-IN")}
                    </strong>
                                              </div>
                                              <div className="text-center">
                                                <span className="text-muted fs-11 fw-bold d-block">TOTAL DUE (incl. Ward)</span>
                    <strong className="text-danger fs-16">
                      ₹{group.computed.runningDueAmount.toLocaleString("en-IN")}
                    </strong>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2">
                                        <div className="d-flex align-items-center gap-4">
                                          <div>
                                            <span className="text-muted fs-12 fw-semibold d-block">TOTAL INVOICED</span>
              <strong className="text-dark fs-15">
                ₹{group.totalBilled.toLocaleString("en-IN")}
              </strong>
                                          </div>
                                          <div>
                                            <span className="text-muted fs-12 fw-semibold d-block">TOTAL PAID AMOUNT</span>
              <strong className="text-success fs-15">
                ₹{group.totalPaid.toLocaleString("en-IN")}
              </strong>
                                          </div>
                                          <div>
                                            <span className="text-muted fs-12 fw-semibold d-block">REMAINING DUE BALANCE</span>
              <strong className="text-danger fs-15">
                ₹{group.totalDue.toLocaleString("en-IN")}
              </strong>
                                          </div>
                                        </div>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary fw-bold px-3"
                                            onClick={() => handleViewMasterStatement(group.admissionId)}
                                          >
                                            <i className="ti ti-receipt-tax me-1" /> View Full Master IPD Statement
                                          </button>
                                        </div>
                                      </div>
    );
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Admission Code",
        dataIndex: "admissionCode",
        render: (text: string, record: (typeof tableData)[0]) => (
          <>
            <span className="badge bg-soft-dark text-dark fw-bold px-2 py-1 rounded-pill d-inline-block mb-1">
              {text}
            </span>
            <small className="text-muted d-block">{record.doctorName}</small>
          </>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.admissionCode.localeCompare(b.admissionCode),
      },
      {
        title: "Patient Details",
        dataIndex: "patientName",
        render: (text: string, record: (typeof tableData)[0]) => (
          <div className="lh-1">
            <h6 className="mb-1 fs-14 fw-semibold text-primary">{text}</h6>
            <span className="text-muted fs-12 fw-normal d-block mt-1">
              UHID: {record.patientCode}
            </span>
                                    </div>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.patientName.localeCompare(b.patientName),
      },
      {
        title: "Assigned Ward",
        dataIndex: "wardName",
        render: (text: string) => (
          <span className="badge bg-soft-info text-info fw-medium">{text}</span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.wardName.localeCompare(b.wardName),
      },
      {
        title: "Invoices Included",
        dataIndex: "invoiceCount",
        render: (count: number, record: (typeof tableData)[0]) => {
          const isExpanded = expandedAdmissionIds.includes(record.key);
          return (
            <button
              type="button"
              className="badge bg-soft-primary text-primary fw-bold border-0"
              onClick={() => toggleExpandAdmission(record.key)}
            >
              <i className="ti ti-file-invoice me-1" />
              {count} Invoices {isExpanded ? "▲" : "▼"}
            </button>
          );
        },
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.invoiceCount - b.invoiceCount,
      },
      {
        title: "Total Billed",
        dataIndex: "totalBilled",
        render: (val: number) => (
          <span className="fw-bold text-dark fs-14">₹{val.toLocaleString("en-IN")}</span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.totalBilled - b.totalBilled,
      },
      {
        title: "Total Paid",
        dataIndex: "totalPaid",
        render: (val: number) => (
          <span className="fw-bold text-success fs-14">₹{val.toLocaleString("en-IN")}</span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.totalPaid - b.totalPaid,
      },
      {
        title: "Due Balance",
        dataIndex: "totalDue",
        render: (val: number) => (
          <span className={`fw-bold fs-14 ${val > 0 ? "text-danger" : "text-success"}`}>
            ₹{val.toLocaleString("en-IN")}
          </span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.totalDue - b.totalDue,
      },
      {
        title: "Status",
        dataIndex: "paymentStatus",
        render: (text: string) => (
          <span
            className={`badge rounded-pill px-3 py-2 ${
              text === "Paid"
                ? "bg-soft-success text-success"
                : text === "Partial"
                  ? "bg-soft-warning text-warning"
                  : "bg-soft-danger text-danger"
            }`}
          >
            {text}
          </span>
        ),
        sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
          a.paymentStatus.localeCompare(b.paymentStatus),
      },
      {
        title: "Action",
        className: "text-center text-nowrap",
        width: 180,
        align: "center" as const,
        render: (_: unknown, record: (typeof tableData)[0]) => {
          const isExpanded = expandedAdmissionIds.includes(record.key);
          return (
            <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
              <button
                type="button"
                className="bg-transparent border-0 text-primary p-1"
                title="View Full IPD Details"
                onClick={() => {
                  const fullAdm =
                    admissions.find((a) => a.id === record.admissionId) || {
                      admissionCode: record.admissionCode,
                      patient: record.patient,
                      ward: { wardName: record.wardName },
                      doctor: { fullName: record.doctorName },
                      status: record.admissionStatus,
                      totalBilled: record.totalBilled,
                      totalPaid: record.totalPaid,
                      dueAmount: record.totalDue,
                      paymentStatus: record.paymentStatus,
                    };
                  setSelectedViewAdmissionData(fullAdm);
                  setShowIpdViewDetailsModal(true);
                }}
              >
                <i className="ti ti-eye fs-18" />
              </button>
              <button
                type="button"
                className="bg-transparent border-0 text-info p-1"
                title="View Master IPD Statement"
                onClick={() => handleViewMasterStatement(record.admissionId)}
              >
                <i className="ti ti-receipt-tax fs-18" />
              </button>
              <button
                type="button"
                className="bg-transparent border-0 text-primary p-1"
                title="Raise New IPD Charge"
                onClick={() => handleOpenRaiseModal(record.admissionId)}
              >
                <i className="ti ti-plus fs-18" />
              </button>
              {record.totalDue > 0 && (
                <button
                  type="button"
                  className="bg-transparent border-0 text-success p-1"
                  title="Collect Due Payment"
                  onClick={() => handleOpenAdmissionPayModal(record)}
                >
                  <i className="ti ti-wallet fs-18" />
                </button>
              )}
              {record.invoiceCount > 0 && (
                <button
                  type="button"
                  className={`bg-transparent border-0 p-1 ${
                    isExpanded ? "text-dark" : "text-warning"
                  }`}
                  title={isExpanded ? "Hide Invoices" : "View Invoices List"}
                  onClick={() => toggleExpandAdmission(record.key)}
                >
                  <i className={`ti ti-${isExpanded ? "chevron-up" : "list-details"} fs-18`} />
                </button>
              )}
              </div>
          );
        },
      },
    ],
    [expandedAdmissionIds, admissions]
  );

  const expandableConfig = useMemo(
    () => ({
      expandedRowKeys: expandedAdmissionIds,
      onExpand: (_expanded: boolean, record: (typeof tableData)[0]) => {
        toggleExpandAdmission(record.key);
      },
      expandedRowRender: renderExpandedRow,
    }),
    [expandedAdmissionIds, renderExpandedRow]
  );

  const getMinInvoiceDate = () => {
    if (!selectedAdmissionId) return "";
    const adm = admissions.find((a) => a.id === selectedAdmissionId);
    if (adm && adm.admissionDate) {
      return adm.admissionDate.split("T")[0];
    }
    return "";
  };

  return (
    <div className="page-wrapper ipd-billings-page">
      <style>{`
        .ipd-billings-page .ipd-metric-card.card,
        .page-wrapper .ipd-billings-empty-card.card,
        .page-wrapper .datatable-main-container .datatable-table-shell.card {
          border: none !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
          border-radius: 12px !important;
        }
        .ipd-billing-expanded thead th {
          background: #E6E6FF !important;
          color: #1e293b !important;
          font-weight: 700 !important;
        }
      `}</style>
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
          <h3 className="page-title mb-0 flex-shrink-0 me-auto">IPD Billings & Invoices</h3>

          <div style={{ width: "220px", flexShrink: 0 }}>
            <IconFormControl
              fieldLabel="search"
              type="text"
              className="form-control-sm"
              placeholder="Search invoice/patient..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          {(searchQuery || statusFilter !== "All") && (
            <button
              className="btn btn-light border fw-semibold d-inline-flex align-items-center"
              style={{ height: "46px", fontSize: "13px", borderRadius: "12px", flexShrink: 0 }}
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
            >
              <i className="ti ti-x me-1" />Clear
            </button>
          )}

          <button
            className="btn btn-outline-secondary d-inline-flex align-items-center"
            style={{ height: "46px", flexShrink: 0, borderRadius: "12px" }}
            onClick={() => {
              if (chargeTypes.length > 0) setSelectedTypeForMaster(chargeTypes[0]);
              setShowManageTypesModal(true);
            }}
          >
            <i className="ti ti-settings me-1" /> Charge Types
          </button>

          <button
            className="btn btn-primary d-inline-flex align-items-center"
            style={{ height: "46px", flexShrink: 0, borderRadius: "12px" }}
            onClick={() => handleOpenRaiseModal()}
          >
            <i className="ti ti-plus me-1" /> Raise Charge
          </button>
          </div>
        {/* Overview Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow ipd-metric-card">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL INVOICES</span>
                    <h3 className="fw-bold mb-0 text-dark">{metrics.totalInvoices}</h3>
        </div>
                  <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle">
                    <i className="ti ti-file-invoice fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow ipd-metric-card">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL BILLED AMOUNT</span>
                    <h3 className="fw-bold mb-0 text-info">
                      ₹{metrics.totalBilled.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-info text-info rounded-circle">
                    <i className="ti ti-receipt fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow ipd-metric-card">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">COLLECTED (PAID)</span>
                    <h3 className="fw-bold mb-0 text-success">
                      ₹{metrics.totalPaid.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-success text-success rounded-circle">
                    <i className="ti ti-wallet fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow ipd-metric-card">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">UNPAID / DUE BALANCE</span>
                    <h3 className="fw-bold mb-0 text-danger">
                      ₹{metrics.totalDue.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-danger text-danger rounded-circle">
                    <i className="ti ti-alert-circle fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Invoices Table — same Datatable shell/header/pagination as Patients */}
        {loading ? (
          <div className="card ipd-billings-empty-card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading IPD Invoices...</p>
            </div>
          </div>
        ) : groupedAdmissions.length === 0 ? (
          <div className="card ipd-billings-empty-card">
            <div className="card-body text-center py-5">
              <i className="ti ti-receipt-off fs-40 text-muted mb-2 d-block" />
              <h5 className="fw-bold">No Invoices Found</h5>
              <p className="text-muted fs-13 mb-3">
                Raise your first doctor visit, nurse care, oxygen or ward stay charge invoice.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenRaiseModal()}>
                <i className="ti ti-plus me-1" /> + Raise New IPD Charge
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={tableData}
              Selection={false}
              searchText=""
              expandable={expandableConfig}
            />
          </div>
        )}
      </div>

      {/* MODAL: RAISE NEW IPD SERVICE CHARGE / INVOICE */}
      {showRaiseModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-plus me-2" />
                  Raise New IPD Service Charge & Itemized Invoice
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRaiseModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitRaiseInvoice}>
                <div className="modal-body p-4">
                  {/* Select Inpatient */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Select Inpatient Admission <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select fw-bold text-primary fs-15"
                      value={selectedAdmissionId}
                      onChange={(e) => {
                        const admId = e.target.value;
                        setSelectedAdmissionId(admId);
                        handlePatientChange(admId);
                      }}
                      required
                    >
                      <option value="">Choose Admitted Patient</option>
                      {admissions.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.admissionCode} - {getPatientName(adm.patient)} ({adm.ward?.wardName || "Ward"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Charge Item Form Box */}
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                        Add Item / Service Charge
                      </h6>
                    </div>

                    <div className="row g-3">
                      {/* Charge Type Dropdown */}
                      <div className="col-md-3">
                        <label className="form-label fw-semibold fs-13">Charge Item Type</label>
                        <select
                          className="form-select"
                          value={currentType}
                          onChange={(e) => handleTypeChange(e.target.value)}
                        >
                          <option value="Doctor Visit">Doctor Visit</option>
                          <option value="Nurse Visit">Nurse Visit</option>
                          <option value="Ward Stay">Ward Stay</option>
                          <option value="Medicine">Medicine</option>
                          <option value="Diagnostic">Diagnostic</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Doctor Select Dropdown */}
                      {currentType === "Doctor Visit" && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Select Doctor *</label>
                          <select
                            className="form-select text-dark fw-bold"
                            value={selectedItemId}
                            onChange={(e) => handleDoctorChange(e.target.value)}
                          >
                            <option value="">Choose Doctor</option>
                            {doctorsList.map((d) => (
                              <option key={d.id} value={d.id}>
                                Dr. {d.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                      )}

                      {/* Medicine Select Dropdown */}
                      {currentType === "Medicine" && (
                      <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Select Medicine *</label>
                                <select
                            className="form-select text-dark fw-bold"
                            value={selectedItemId}
                            onChange={(e) => handleMedicineChange(e.target.value)}
                          >
                            <option value="">Choose Medicine</option>
                            {medicinesList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.medicineName} {m.brandName ? `[${m.brandName}]` : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                      )}

                      {/* Diagnostic Select Dropdown */}
                      {currentType === "Diagnostic" && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Select Diagnostic Test *</label>
                          <select
                            className="form-select text-dark fw-bold"
                            value={selectedItemId}
                            onChange={(e) => handleLabTestChange(e.target.value)}
                          >
                            <option value="">Choose Diagnostic Test</option>
                            {labTestsList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Ward Stay Select Dropdown */}
                      {currentType === "Ward Stay" && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Select Ward *</label>
                          <select
                            className="form-select text-dark fw-bold"
                            value={selectedItemId}
                            onChange={(e) => handleWardChange(e.target.value)}
                          >
                            <option value="">Choose Ward</option>
                            {wardsList.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.wardName} - Room Rate: ₹{w.chargePerNight}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Nurse Visit (ReadOnly/Input Info) */}
                      {currentType === "Nurse Visit" && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Service / Item Description *</label>
                            <IconFormControl
                              fieldLabel="service"
                              type="text"
                              value={currentItemName}
                              onChange={(e) => setCurrentItemName(e.target.value)}
                            />
                      </div>
                      )}

                      {/* Other Custom Service Input */}
                      {currentType === "Other" && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold fs-13">Service / Item Description *</label>
                          <IconFormControl
                            fieldLabel="service"
                            type="text"
                            placeholder="e.g. Oxygen Cylinder, Dressing"
                            value={currentItemName}
                            onChange={(e) => setCurrentItemName(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Unit Price */}
                      <div className="col-md-2">
                        <label className="form-label fw-semibold fs-13">Unit Price (₹) *</label>
                        <IconFormControl
                          fieldLabel="price"
                          type="number"
                          className="fw-bold text-success"
                          placeholder="Rate"
                          value={currentUnitPrice}
                          onChange={(e) => setCurrentUnitPrice(e.target.value)}
                          min={0}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-md-2">
                        <label className="form-label fw-semibold fs-13">Quantity</label>
                        <IconFormControl
                          fieldLabel="quantity"
                          type="number"
                          placeholder="Qty"
                          value={currentQuantity}
                          onChange={(e) => setCurrentQuantity(e.target.value)}
                          min={1}
                        />
                      </div>

                      {/* Add Button */}
                      <div className="col-md-1 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-success w-100 fw-bold"
                          onClick={handleAddDraftItem}
                          title="Add to invoice list"
                        >
                          <i className="ti ti-plus" /> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Draft Items Table */}
                  <h6 className="fw-bold text-dark mb-2">Itemized Charges List</h6>
                  <div className="table-responsive mb-3 border rounded">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Category Type</th>
                          <th>Service / Item Description</th>
                          <th className="text-center">Unit Price (₹)</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Total Price (₹)</th>
                          <th className="text-center" style={{ width: "60px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-3 text-muted">
                              {currentItemName.trim() ? (
                                <span>
                                  Pending Item: <strong>{currentItemName}</strong> (₹{currentUnitPrice} x {currentQuantity} = ₹
                                  {(parseFloat(currentUnitPrice) || 0) * (parseInt(currentQuantity, 10) || 1)}) — Click <strong>+ Add</strong> or proceed to generate.
                                </span>
                              ) : (
                                "No items added to bill yet. Use the form above to add items."
                              )}
                            </td>
                          </tr>
                        ) : (
                          draftItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="badge bg-soft-info text-info">{item.itemType}</span>
                              </td>
                              <td className="fw-semibold text-dark">{item.itemName}</td>
                              <td className="text-center">₹{item.unitPrice}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end fw-bold text-success">
                                ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-danger"
                                  onClick={() => handleRemoveDraftItem(idx)}
                                >
                                  <i className="ti ti-trash" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Total & Payment Section */}
                  <div className="p-3 bg-soft-primary border border-primary rounded-3 mb-3">
                    <div className="row align-items-center g-3">
                      <div className="col-md-3">
                        <span className="fs-13 text-secondary fw-semibold d-block">
                          Total Invoice Amount:
                        </span>
                        <h3 className="fw-bold text-primary mb-0">
                          ₹{draftTotalAmount.toLocaleString("en-IN")}
                        </h3>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold text-dark mb-1">
                          Invoice Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control fw-bold text-dark"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          min={getMinInvoiceDate()}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold text-dark mb-1">
                          Payment Paid Now (₹)
                        </label>
                        <IconFormControl
                          fieldLabel="amount"
                          type="number"
                          className="fw-bold text-success fs-16"
                          placeholder="e.g. 0 if unpaid"
                          value={raisePaidAmount}
                          onChange={(e) => setRaisePaidAmount(e.target.value)}
                          min={0}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-semibold mb-1">Payment Method</label>
                        <select
                          className="form-select"
                          value={raisePaymentMethod}
                          onChange={(e) => setRaisePaymentMethod(e.target.value)}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / GPay / PhonePe</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold">Invoice Notes / Remark</label>
                    <IconFormControl
                      fieldLabel="notes"
                      type="text"
                      placeholder="Optional remarks..."
                      value={raiseNotes}
                      onChange={(e) => setRaiseNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRaiseModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submittingRaise}
                  >
                    {submittingRaise ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Generating...
                      </>
                    ) : (
                      "Generate Itemized Invoice"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CHARGE TYPE CATEGORY */}
      {showAddTypeModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-plus me-2" />
                  Add New Charge Type Category
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddTypeModal(false)}
                />
              </div>

              <form onSubmit={handleCreateChargeType}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Charge Category Name <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="category"
                      type="text"
                      className="fw-bold"
                      placeholder="e.g. Oxygen & Equipment, ICU Nursing, Blood Bank"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <IconFormControl
                      fieldLabel="description"
                      type="text"
                      placeholder="Optional description of this charge category..."
                      value={newTypeDesc}
                      onChange={(e) => setNewTypeDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddTypeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4"
                    disabled={submittingType}
                  >
                    {submittingType ? "Saving..." : "Save Charge Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE CHARGE TYPES & PRESET ITEMS MASTER */}
      {showManageTypesModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-settings me-2" />
                  IPD Charge Categories & Preset Items Master
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowManageTypesModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  {/* Left Column: Categories List */}
                  <div className="col-md-4 border-end">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bold text-dark mb-0">Charge Categories</h6>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowAddTypeModal(true)}
                      >
                        + Add New Category
                      </button>
                    </div>

                    <div className="list-group">
                      {chargeTypes.map((ct) => (
                        <button
                          key={ct.id}
                          type="button"
                          className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                            selectedTypeForMaster?.id === ct.id ? "active fw-bold" : ""
                          }`}
                          onClick={() => setSelectedTypeForMaster(ct)}
                        >
                          <div>
                            <div>{ct.name}</div>
                            <small className="opacity-75">{ct.items?.length || 0} Preset Items</small>
                          </div>
                          <i className="ti ti-chevron-right" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Preset Items Master inside selected Category */}
                  <div className="col-md-8">
                    {selectedTypeForMaster ? (
                      <>
                        <h6 className="fw-bold text-dark mb-3">
                          Preset Items in &quot;{selectedTypeForMaster.name}&quot;
                        </h6>

                        {/* Add Item Form */}
                        <form onSubmit={handleAddMasterItem} className="p-3 bg-light rounded border mb-4">
                          <div className="row g-2 align-items-end">
                            <div className="col-md-6">
                              <label className="form-label fs-12 fw-semibold mb-1">
                                Item / Service Name *
                              </label>
                              <IconFormControl
                                fieldLabel="service"
                                type="text"
                                placeholder="e.g. Oxygen Concentrator Per Day"
                                value={masterItemName}
                                onChange={(e) => setMasterItemName(e.target.value)}
                                required
                              />
                            </div>

                            <div className="col-md-4">
                              <label className="form-label fs-12 fw-semibold mb-1">
                                Standard Rate (₹) *
                              </label>
                              <IconFormControl
                                fieldLabel="amount"
                                type="number"
                                placeholder="Rate"
                                value={masterItemFee}
                                onChange={(e) => setMasterItemFee(e.target.value)}
                                min={0}
                                required
                              />
                            </div>

                            <div className="col-md-2">
                              <button
                                type="submit"
                                className="btn btn-success w-100 fw-bold"
                                disabled={submittingMasterItem}
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Master Items Table */}
                        <div className="table-responsive border rounded">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Item / Service Name</th>
                                <th className="text-center">Standard Fee (₹)</th>
                                <th className="text-center" style={{ width: "60px" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!selectedTypeForMaster.items || selectedTypeForMaster.items.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="text-center py-4 text-muted">
                                    No preset items added in this category yet. Use the form above to add items.
                                  </td>
                                </tr>
                              ) : (
                                selectedTypeForMaster.items.map((it) => (
                                  <tr key={it.id}>
                                    <td className="fw-semibold text-dark">{it.itemName}</td>
                                    <td className="text-center fw-bold text-success">₹{it.standardFee}</td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger"
                                        onClick={() => handleDeleteMasterItem(it.id)}
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        Select a charge category from the left menu to view preset items.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowManageTypesModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT PAYMENT */}
      {showPayModal && payInvoice && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-wallet me-2" />
                  Collect Payment - {payInvoice.invoiceNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPayModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitPay}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-soft-success border border-success rounded-3 mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Patient:</span>
                      <strong className="text-dark">{getPatientName(payInvoice.patient)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Total Invoice Amount:</span>
                      <span className="fw-semibold">₹{payInvoice.totalAmount}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Already Paid:</span>
                      <span className="text-success fw-semibold">₹{payInvoice.paidAmount}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                      <span className="fw-bold text-dark">Outstanding Due Balance:</span>
                      <h4 className="fw-bold text-danger mb-0">₹{payInvoice.dueAmount}</h4>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Payment Amount Collecting (₹) <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="amount"
                      type="number"
                      className="fw-bold text-success fs-18"
                      placeholder="Enter payment amount"
                      value={paymentInput}
                      onChange={(e) => setPaymentInput(e.target.value)}
                      max={payInvoice.dueAmount}
                      min={1}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethodInput}
                      onChange={(e) => setPaymentMethodInput(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPayModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4 fw-bold"
                    disabled={submittingPay}
                  >
                    {submittingPay ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Processing...
                      </>
                    ) : (
                      "Record Payment"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdmissionPayModal && payAdmissionRecord && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-wallet me-2" />
                  Collect IPD Admission Payment - {payAdmissionRecord.admissionCode}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAdmissionPayModal(false)}
                />
              </div>

              <form onSubmit={handleSubmitAdmissionPay}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-soft-success border border-success rounded-3 mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Patient Name:</span>
                      <strong className="text-dark">{payAdmissionRecord.patientName}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Total Incurred Billed:</span>
                      <span className="fw-semibold">₹{payAdmissionRecord.totalBilled.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted fs-13">Already Paid:</span>
                      <span className="text-success fw-semibold">₹{payAdmissionRecord.totalPaid.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                      <span className="fw-bold text-dark">Total Outstanding Due:</span>
                      <h4 className="fw-bold text-danger mb-0">₹{payAdmissionRecord.totalDue.toLocaleString("en-IN")}</h4>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Payment Amount To Collect (₹) <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="amount"
                      type="number"
                      className="fw-bold text-success fs-18"
                      placeholder="Enter payment amount"
                      value={admissionPaymentInput}
                      onChange={(e) => setAdmissionPaymentInput(e.target.value)}
                      max={payAdmissionRecord.totalDue}
                      min={1}
                      required
                    />
                    <small className="text-muted mt-1 d-block">
                      Note: Collected payment will be distributed and allocated across the unpaid invoices automatically.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Method</label>
                    <select
                      className="form-select"
                      value={admissionPaymentMethod}
                      onChange={(e) => setAdmissionPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAdmissionPayModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4 fw-bold"
                    disabled={submittingAdmissionPay}
                  >
                    {submittingAdmissionPay ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Collecting...
                      </>
                    ) : (
                      "Collect Payment & Allocate"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW INVOICE DETAILS */}
      {showViewModal && selectedInvoice && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-file-invoice me-2" />
                  Invoice Breakdown - {selectedInvoice.invoiceNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4 p-3 bg-light rounded border">
                  <div className="col-md-6">
                    <span className="text-muted fs-12 d-block">Patient Name:</span>
                    <h5 className="fw-bold text-dark mb-0">{getPatientName(selectedInvoice.patient)}</h5>
                    <small className="text-muted">UHID: {selectedInvoice.patient?.patientCode || "—"}</small>
                  </div>

                  <div className="col-md-6 text-md-end">
                    <span className="text-muted fs-12 d-block">Admission Code:</span>
                    <h6 className="fw-bold text-primary mb-0">{selectedInvoice.admission?.admissionCode}</h6>
                    <small className="text-muted">Date: {new Date(selectedInvoice.invoiceDate).toLocaleString()}</small>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2">Itemized Services & Charges</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Category Type</th>
                        <th>Item Description</th>
                        <th className="text-center">Rate</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((it) => (
                        <tr key={it.id}>
                          <td>
                            <span className="badge bg-soft-info text-info">{it.itemType}</span>
                          </td>
                          <td className="fw-semibold text-dark">{it.itemName}</td>
                          <td className="text-center">₹{it.unitPrice}</td>
                          <td className="text-center">{it.quantity}</td>
                          <td className="text-end fw-bold text-success">₹{it.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-soft-success border border-success rounded-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fs-12 text-muted d-block">Payment Summary:</span>
                    <small className="text-muted">Method: {selectedInvoice.paymentMethod || "Cash"}</small>
                  </div>

                  <div className="text-end">
                    <div>Total Billed: <strong>₹{selectedInvoice.totalAmount}</strong></div>
                    <div>Paid Amount: <strong className="text-success">₹{selectedInvoice.paidAmount}</strong></div>
                    <div>Due Balance: <strong className="text-danger">₹{selectedInvoice.dueAmount}</strong></div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL IPD MASTER STATEMENT & SUMMARY INVOICE */}
      {showMasterModal && masterStatementData && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white print-d-none">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-receipt-tax me-2" />
                  Full IPD Master Statement & Invoice ({masterStatementData.admissionCode})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowMasterModal(false)}
                />
              </div>

              <div className="modal-body p-4" id="printableMasterInvoice">
                {/* Hospital Header Banner */}
                <div className="d-flex justify-content-between align-items-start pb-3 border-bottom mb-4">
                  <div>
                    <h3 className="fw-bold text-primary mb-1">DocYori Hospital</h3>
                    <p className="text-muted fs-13 mb-0">Complete IPD Inpatient Statement & Medical Bill</p>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-primary fs-14 py-2 px-3 mb-1 d-inline-block">
                      Admission Code: {masterStatementData.admissionCode}
                    </span>
                    <div className="text-muted fs-12">
                      Generated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Patient & Admission Info Card */}
                <div className="row g-3 p-3 bg-light rounded border mb-4">
                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">PATIENT NAME</span>
                    <strong className="text-dark fs-15">{masterStatementData.patientName}</strong>
                    <small className="text-muted d-block">UHID: {masterStatementData.patientCode}</small>
                  </div>

                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">PRIMARY DOCTOR</span>
                    <strong className="text-primary fs-15">{masterStatementData.doctorName}</strong>
                  </div>

                  <div className="col-md-3 col-6">
                    <span className="text-muted fs-12 fw-semibold d-block">ASSIGNED WARD</span>
                    <span className="badge bg-soft-info text-info fw-bold fs-13">
                      {masterStatementData.wardName}
                    </span>
                  </div>

                  <div className="col-md-3 col-6 text-md-end">
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL INVOICES</span>
                    <strong className="text-dark fs-15">{masterStatementData.invoicesCount} Invoices Raised</strong>
                  </div>
                </div>

                {/* All Consolidated Items Table */}
                <h6 className="fw-bold text-dark mb-2">Itemized Inpatient Charges Summary</h6>
                <div className="table-responsive mb-4 border rounded">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Category</th>
                        <th>Service / Item Description</th>
                        <th className="text-center">Invoice #</th>
                        <th className="text-center">Unit Price (₹)</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterStatementData.allItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No charges raised for this IPD admission yet.
                          </td>
                        </tr>
                      ) : (
                        masterStatementData.allItems.map((it, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="badge bg-soft-info text-info">{it.itemType}</span>
                            </td>
                            <td className="fw-semibold text-dark">{it.itemName}</td>
                            <td className="text-center text-muted fs-12">{it.invoiceNumber}</td>
                            <td className="text-center">₹{it.unitPrice.toLocaleString("en-IN")}</td>
                            <td className="text-center">{it.quantity}</td>
                            <td className="text-end fw-bold text-dark">
                              ₹{it.totalPrice.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Overall Financial Summary Box */}
                <div className="p-4 bg-soft-primary border border-primary rounded-3">
                  <div className="row g-3 align-items-center text-center text-md-start">
                    <div className="col-md-4 border-end-md">
                      <span className="text-muted fs-13 fw-semibold d-block">TOTAL BILLED AMOUNT</span>
                      <h3 className="fw-bold text-dark mb-0">
                        ₹{masterStatementData.totalBilled.toLocaleString("en-IN")}
                      </h3>
                    </div>

                    <div className="col-md-4 border-end-md">
                      <span className="text-muted fs-13 fw-semibold d-block">TOTAL AMOUNT PAID</span>
                      <h3 className="fw-bold text-success mb-0">
                        ₹{masterStatementData.totalPaid.toLocaleString("en-IN")}
                      </h3>
                    </div>

                    <div className="col-md-4">
                      <span className="text-muted fs-13 fw-semibold d-block">OUTSTANDING DUE BALANCE</span>
                      <h3 className="fw-bold text-danger mb-0">
                        ₹{masterStatementData.dueAmount.toLocaleString("en-IN")}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light print-d-none">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMasterModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => window.print()}
                >
                  <i className="ti ti-printer me-1" /> Print Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW IPD DETAILS MODAL */}
      <IpdViewDetailsModal
        show={showIpdViewDetailsModal}
        onClose={() => setShowIpdViewDetailsModal(false)}
        admission={selectedViewAdmissionData}
      />

      <Footer />
    </div>
  );
};

export default IpdBillingsPage;
