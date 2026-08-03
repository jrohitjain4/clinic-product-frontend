import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { IconFormControl } from "../../../../core/common/form-fields";

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

interface IpdRaiseChargeModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admissionId?: string;
}

const getPatientName = (p?: { fullName?: string; firstName?: string; lastName?: string } | null) => {
  if (!p) return "Patient";
  if (p.fullName) return p.fullName;
  const name = `${p.firstName || ""}` + `${p.lastName ? ` ${p.lastName}` : ""}`;
  return name.trim() || "Patient";
};

const IpdRaiseChargeModal: React.FC<IpdRaiseChargeModalProps> = ({
  show,
  onClose,
  onSuccess,
  admissionId,
}) => {
  const [admissions, setAdmissions] = useState<AdmissionOption[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [labTestsList, setLabTestsList] = useState<any[]>([]);
  const [wardsList, setWardsList] = useState<any[]>([]);

  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  // Current Item Input state in Raise Modal
  const [currentType, setCurrentType] = useState("Doctor Visit");
  const [currentItemName, setCurrentItemName] = useState("");
  const [currentUnitPrice, setCurrentUnitPrice] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("1");
  const [selectedItemId, setSelectedItemId] = useState("");

  // Draft Items List
  const [draftItems, setDraftItems] = useState<DraftInvoiceItem[]>([]);

  const [raisePaidAmount, setRaisePaidAmount] = useState("");
  const [raisePaymentMethod, setRaisePaymentMethod] = useState("Cash");
  const [raiseNotes, setRaiseNotes] = useState("");
  const [submittingRaise, setSubmittingRaise] = useState(false);

  // Fetch Master Options
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [admRes, ctRes, docRes, medRes, labRes, wardRes] = await Promise.all([
        fetch(apiUrl("/api/ipd/admissions"), { headers }),
        fetch(apiUrl("/api/ipd/charge-types"), { headers }),
        fetch(apiUrl("/api/doctors?type=IPD"), { headers }),
        fetch(apiUrl("/api/medicines"), { headers }),
        fetch(apiUrl("/api/lab-tests"), { headers }),
        fetch(apiUrl("/api/ipd/wards"), { headers }),
      ]);

      let loadedAdmissions: AdmissionOption[] = [];
      let loadedDoctors: any[] = [];
      let loadedWards: any[] = [];

      if (admRes.ok) {
        const data = await admRes.json();
        loadedAdmissions = Array.isArray(data) ? data : [];
        setAdmissions(loadedAdmissions);
      }
      if (ctRes.ok) {
        const data = await ctRes.json();
        setChargeTypes(Array.isArray(data) ? data : []);
      }
      if (docRes.ok) {
        const data = await docRes.json();
        loadedDoctors = Array.isArray(data) ? data : [];
        setDoctorsList(loadedDoctors);
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
        loadedWards = Array.isArray(data) ? data : [];
        setWardsList(loadedWards);
      }

      // Pre-select admission if provided or default to first
      const targetAdmId = admissionId || (loadedAdmissions[0]?.id || "");
      setSelectedAdmissionId(targetAdmId);

      if (targetAdmId) {
        const targetAdm = loadedAdmissions.find((a) => a.id === targetAdmId);
        if (targetAdm) {
          setCurrentType("Doctor Visit");
          const primaryDocId = targetAdm.doctorId || "";
          setSelectedItemId(primaryDocId);
          const doc = loadedDoctors.find((d) => d.id === primaryDocId);
          const docName = doc ? doc.fullName : (targetAdm.doctor?.fullName || "Assigned Doctor");
          setCurrentItemName(`Doctor Visit: Dr. ${docName}`);
          setCurrentUnitPrice(String(doc?.ipdVisitCharge || targetAdm.doctorVisitCharge || doc?.consultationCharge || 500));
          setCurrentQuantity("1");
          if (targetAdm.admissionDate) {
            setInvoiceDate(targetAdm.admissionDate.split("T")[0]);
          }
        }
      }
    } catch (err: any) {
      toast.error("Failed to load options for raising charge");
    }
  }, [admissionId]);

  useEffect(() => {
    if (show) {
      fetchData();
      setDraftItems([]);
      setRaisePaidAmount("");
      setRaiseNotes("");
    }
  }, [show, fetchData]);

  const handlePatientChange = (admId: string) => {
    setSelectedAdmissionId(admId);
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
      setInvoiceDate(admission.admissionDate.split("T")[0]);
    } else {
      setInvoiceDate(new Date().toISOString().split("T")[0]);
    }
  };

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

    setCurrentItemName("");
    setCurrentUnitPrice("");
    setCurrentQuantity("1");
    toast.info("Item added to draft invoice list!");
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const draftTotalAmount = useMemo(() => {
    let total = 0;
    draftItems.forEach((it) => {
      total += it.unitPrice * it.quantity;
    });
    if (draftItems.length === 0 && currentItemName.trim()) {
      const uPrice = parseFloat(currentUnitPrice) || 0;
      const qty = parseInt(currentQuantity, 10) || 1;
      total += uPrice * qty;
    }
    return total;
  }, [draftItems, currentItemName, currentUnitPrice, currentQuantity]);

  const getMinInvoiceDate = () => {
    if (!selectedAdmissionId) return "";
    const adm = admissions.find((a) => a.id === selectedAdmissionId);
    if (adm && adm.admissionDate) {
      return adm.admissionDate.split("T")[0];
    }
    return "";
  };

  const handleSubmitRaiseInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      toast.error("Please select an admitted patient.");
      return;
    }

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
    const pPaid = parseFloat(raisePaidAmount) || 0;

    const payload = {
      admissionId: selectedAdmissionId,
      items: finalItems,
      paidAmount: pPaid,
      paymentMethod: raisePaymentMethod,
      notes: raiseNotes.trim() || undefined,
      invoiceDate: invoiceDate || undefined,
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

      toast.success("IPD Charge raised & Invoice created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error creating invoice");
    } finally {
      setSubmittingRaise(false);
    }
  };

  if (!show) return null;

  const selectedAdmission = admissions.find((a) => a.id === selectedAdmissionId);

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {/* Header — common modal theme */}
          <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36 }}
              >
                <i className="ti ti-file-invoice text-primary fs-18" />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0">
                  Raise New IPD Service Charge
                  {selectedAdmission?.admissionCode ? ` — ${selectedAdmission.admissionCode}` : ""}
                </h5>
                <p className="mb-0 text-white-50 fs-12">Create Itemized Invoice for Inpatient Services</p>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
          </div>

          <form onSubmit={handleSubmitRaiseInvoice}>
            <div className="modal-body p-4">
              {/* Admission context banner */}
              {selectedAdmission && (
                <div className="p-3 bg-soft-light rounded-3 border mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <span className="text-muted fs-12 d-block fw-semibold">PATIENT</span>
                    <strong className="text-dark fs-14">{getPatientName(selectedAdmission.patient)}</strong>
                    <span className="badge bg-soft-dark text-dark fw-bold ms-2">
                      {selectedAdmission.patient?.patientCode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block fw-semibold">WARD</span>
                    <strong className="text-dark fs-14">{selectedAdmission.ward?.wardName || "Not Assigned"}</strong>
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block fw-semibold">DOCTOR</span>
                    <strong className="text-primary fs-14">
                      {selectedAdmission.doctor?.fullName
                        ? `Dr. ${selectedAdmission.doctor.fullName}`
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block fw-semibold">INVOICE TOTAL</span>
                    <strong className="text-danger fs-14">
                      ₹{draftTotalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              )}

              {/* Admission + Date */}
              <div className="card border shadow-none mb-4">
                <div className="card-header bg-light py-2 px-3 border-bottom">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-user me-1 text-primary" /> Admission & Invoice Date
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label fw-semibold text-muted fs-12 mb-1">
                        Select Inpatient Admission <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select fw-semibold"
                        value={selectedAdmissionId}
                        onChange={(e) => handlePatientChange(e.target.value)}
                        required
                      >
                        <option value="">-- Select Patient Admission --</option>
                        {admissions.map((adm) => (
                          <option key={adm.id} value={adm.id}>
                            {adm.admissionCode} - {getPatientName(adm.patient)} ({adm.ward?.wardName || "No Ward"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-muted fs-12 mb-1">
                        Invoice Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control fw-semibold text-dark"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        min={getMinInvoiceDate()}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Item */}
              <div className="card border shadow-none mb-4">
                <div className="card-header bg-light py-2 px-3 border-bottom">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-plus me-1 text-success" /> Add Item / Service Charge
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Charge Item Type</label>
                      <select
                        className="form-select"
                        value={currentType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                      >
                        <option value="Doctor Visit">Doctor Visit</option>
                        <option value="Nurse Visit">Nurse Visit</option>
                        <option value="Ward Stay">Ward Stay</option>
                        <option value="Medicine">Medicine / Pharmacy</option>
                        <option value="Diagnostic">Diagnostic / Lab Test</option>
                        {chargeTypes.map((ct) => (
                          <option key={ct.id} value={ct.name}>
                            {ct.name}
                          </option>
                        ))}
                        <option value="Other">Other / Custom Charge</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      {currentType === "Doctor Visit" ? (
                        <div>
                          <label className="form-label fs-12 fw-semibold text-muted mb-1">Select Doctor *</label>
                          <select
                            className="form-select"
                            value={selectedItemId}
                            onChange={(e) => handleDoctorChange(e.target.value)}
                          >
                            <option value="">-- Choose Doctor --</option>
                            {doctorsList.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                Dr. {doc.fullName} (Fee: ₹{doc.ipdVisitCharge || doc.consultationCharge || 500})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : currentType === "Ward Stay" ? (
                        <div>
                          <label className="form-label fs-12 fw-semibold text-muted mb-1">Select Ward *</label>
                          <select
                            className="form-select"
                            value={selectedItemId}
                            onChange={(e) => handleWardChange(e.target.value)}
                          >
                            <option value="">-- Choose Ward --</option>
                            {wardsList.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.wardName} (Rate: ₹{w.chargePerNight}/night)
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : currentType === "Medicine" ? (
                        <div>
                          <label className="form-label fs-12 fw-semibold text-muted mb-1">Select Medicine *</label>
                          <select
                            className="form-select"
                            value={selectedItemId}
                            onChange={(e) => handleMedicineChange(e.target.value)}
                          >
                            <option value="">-- Choose Medicine --</option>
                            {medicinesList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.medicineName} (₹{m.sellingPrice || m.mrp || 0})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : currentType === "Diagnostic" ? (
                        <div>
                          <label className="form-label fs-12 fw-semibold text-muted mb-1">Select Lab Test *</label>
                          <select
                            className="form-select"
                            value={selectedItemId}
                            onChange={(e) => handleLabTestChange(e.target.value)}
                          >
                            <option value="">-- Choose Test --</option>
                            {labTestsList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} (₹{t.price || 0})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="form-label fs-12 fw-semibold text-muted mb-1">Service / Item Description *</label>
                          <IconFormControl
                            fieldLabel="service"
                            type="text"
                            placeholder="Enter item description"
                            value={currentItemName}
                            onChange={(e) => setCurrentItemName(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Unit Price (₹) *</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        placeholder="Rate"
                        value={currentUnitPrice}
                        onChange={(e) => setCurrentUnitPrice(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fs-12 fw-semibold text-muted mb-1">Quantity</label>
                      <IconFormControl
                        fieldLabel="number"
                        type="number"
                        placeholder="Qty"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(e.target.value)}
                        min={1}
                      />
                    </div>

                    <div className="col-md-1 d-flex align-items-end">
                      <button
                        type="button"
                        className="btn btn-primary w-100 fw-semibold"
                        onClick={handleAddDraftItem}
                        title="Add to invoice list"
                      >
                        <i className="ti ti-plus me-1" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized list */}
              <div className="card border shadow-none mb-4">
                <div className="card-header bg-light py-2 px-3 border-bottom">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-list-details me-1 text-info" /> Itemized Charges List
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 fs-13">
                      <thead style={{ background: "#EEF2FF" }}>
                        <tr>
                          <th className="ps-3 py-2 border-0 fw-semibold text-dark">Category Type</th>
                          <th className="py-2 border-0 fw-semibold text-dark">Service / Item Description</th>
                          <th className="text-center py-2 border-0 fw-semibold text-dark">Unit Price (₹)</th>
                          <th className="text-center py-2 border-0 fw-semibold text-dark">Qty</th>
                          <th className="text-end py-2 border-0 fw-semibold text-dark">Total Price (₹)</th>
                          <th className="text-center py-2 border-0 fw-semibold text-dark pe-3" style={{ width: "60px" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted">
                              {currentItemName.trim() ? (
                                <span>
                                  Pending Item: <strong className="text-dark">{currentItemName}</strong> (₹
                                  {currentUnitPrice} x {currentQuantity} = ₹
                                  {(parseFloat(currentUnitPrice) || 0) * (parseInt(currentQuantity, 10) || 1)}) — Click{" "}
                                  <strong>+ Add</strong> or proceed to generate.
                                </span>
                              ) : (
                                "No items added to bill yet. Use the form above to add items."
                              )}
                            </td>
                          </tr>
                        ) : (
                          draftItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="ps-3">
                                <span className="badge bg-soft-primary text-primary fw-semibold">{item.itemType}</span>
                              </td>
                              <td className="fw-semibold text-dark">{item.itemName}</td>
                              <td className="text-center">₹{item.unitPrice}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end fw-bold text-dark">
                                ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                              </td>
                              <td className="text-center pe-3">
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
                </div>
              </div>

              {/* Billing & Payment Summary */}
              <div className="card border shadow-none bg-light mb-4">
                <div className="card-header bg-white py-2 px-3 border-bottom">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-receipt me-1 text-warning" /> Billing & Payment Summary
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="p-2 bg-white rounded border h-100">
                        <span className="text-muted fs-11 d-block fw-semibold">TOTAL INVOICE</span>
                        <h6 className="fw-bold mb-0 text-primary mt-1">
                          ₹{draftTotalAmount.toLocaleString("en-IN")}
                        </h6>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-muted fs-12 mb-1">Payment Paid Now (₹)</label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        className="fw-bold text-success"
                        placeholder="e.g. 0 if unpaid"
                        value={raisePaidAmount}
                        onChange={(e) => setRaisePaidAmount(e.target.value)}
                        min={0}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-muted fs-12 mb-1">Payment Method</label>
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
                    <div className="col-md-3">
                      <div className="p-2 bg-white rounded border h-100">
                        <span className="text-muted fs-11 d-block fw-semibold">BALANCE DUE</span>
                        <h6
                          className={`fw-bold mb-0 mt-1 ${
                            Math.max(0, draftTotalAmount - (parseFloat(raisePaidAmount) || 0)) > 0
                              ? "text-danger"
                              : "text-success"
                          }`}
                        >
                          ₹
                          {Math.max(0, draftTotalAmount - (parseFloat(raisePaidAmount) || 0)).toLocaleString(
                            "en-IN"
                          )}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border shadow-none mb-0">
                <div className="card-header bg-light py-2 px-3 border-bottom">
                  <h6 className="mb-0 fw-bold fs-13 text-dark">
                    <i className="ti ti-notes me-1 text-secondary" /> Invoice Notes / Remark
                  </h6>
                </div>
                <div className="card-body p-3">
                  <IconFormControl
                    fieldLabel="notes"
                    type="text"
                    placeholder="Optional remarks..."
                    value={raiseNotes}
                    onChange={(e) => setRaiseNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3 bg-white d-flex align-items-center justify-content-between">
              <button type="button" className="btn btn-light fw-medium border" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-medium px-4"
                disabled={submittingRaise}
              >
                {submittingRaise ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="ti ti-file-invoice me-1" /> Generate Itemized Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IpdRaiseChargeModal;
