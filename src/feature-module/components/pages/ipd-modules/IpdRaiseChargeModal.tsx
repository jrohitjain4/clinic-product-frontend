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

  const selectedChargeType = useMemo(() => {
    return chargeTypes.find((ct) => ct.name === currentType);
  }, [chargeTypes, currentType]);

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
    } else {
      const customTypeObj = chargeTypes.find((ct) => ct.name === type);
      if (customTypeObj) {
        if (customTypeObj.items && customTypeObj.items.length > 0) {
          const firstItem = customTypeObj.items[0];
          setSelectedItemId(firstItem.id);
          setCurrentItemName(firstItem.itemName);
          setCurrentUnitPrice(String(firstItem.standardFee || 0));
        } else {
          setSelectedItemId("custom");
          setCurrentItemName("");
          setCurrentUnitPrice("");
        }
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

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white" style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
            <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
              <i className="ti ti-plus fs-20" />
              Raise New IPD Service Charge & Itemized Invoice
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleSubmitRaiseInvoice}>
            <div className="modal-body p-4" style={{ maxHeight: "78vh", overflowY: "auto" }}>
              {/* Select Admission & Invoice Date */}
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <label className="form-label fw-bold text-dark mb-1">
                    Select Inpatient Admission <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-lg fw-semibold"
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
                  <label className="form-label fw-bold text-dark mb-1">
                    Invoice Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg fw-bold text-dark"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    min={getMinInvoiceDate()}
                    required
                  />
                </div>
              </div>

              {/* Add Item Row */}
              <div className="p-3 bg-light rounded border mb-4">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                  Add Item / Service Charge
                </h6>

                <div className="row g-2 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fs-12 fw-semibold mb-1">Charge Item Type</label>
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

                  {/* Sub-selector depending on type */}
                  <div className="col-md-4">
                    {currentType === "Doctor Visit" ? (
                      <div>
                        <label className="form-label fs-12 fw-semibold mb-1">Select Doctor *</label>
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
                        <label className="form-label fs-12 fw-semibold mb-1">Select Ward *</label>
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
                        <label className="form-label fs-12 fw-semibold mb-1">Select Medicine *</label>
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
                        <label className="form-label fs-12 fw-semibold mb-1">Select Lab Test *</label>
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
                    ) : selectedChargeType ? (
                      <div>
                        <label className="form-label fs-12 fw-semibold mb-1">Select Item *</label>
                        <select
                          className="form-select"
                          value={selectedItemId}
                          onChange={(e) => {
                            const itemId = e.target.value;
                            setSelectedItemId(itemId);
                            if (itemId === "custom") {
                              setCurrentItemName("");
                              setCurrentUnitPrice("");
                            } else {
                              const it = selectedChargeType.items?.find((i) => i.id === itemId);
                              if (it) {
                                setCurrentItemName(it.itemName);
                                setCurrentUnitPrice(String(it.standardFee));
                              }
                            }
                          }}
                        >
                          {selectedChargeType.items?.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.itemName} (Rate: ₹{it.standardFee})
                            </option>
                          ))}
                          <option value="custom">-- Custom Description --</option>
                        </select>
                        {selectedItemId === "custom" && (
                          <div className="mt-2">
                            <IconFormControl
                              fieldLabel="service"
                              type="text"
                              placeholder="Enter custom description"
                              value={currentItemName}
                              onChange={(e) => setCurrentItemName(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="form-label fs-12 fw-semibold mb-1">Service / Item Description *</label>
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
                    <label className="form-label fs-12 fw-semibold mb-1">Unit Price (₹) *</label>
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
                    <label className="form-label fs-12 fw-semibold mb-1">Quantity</label>
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
                      className="btn btn-success w-100 fw-bold"
                      onClick={handleAddDraftItem}
                      title="Add to invoice list"
                    >
                      <i className="ti ti-plus me-1" /> Add
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
                  <div className="col-md-4">
                    <span className="fs-13 text-secondary fw-semibold d-block">Total Invoice Amount:</span>
                    <h3 className="fw-bold text-primary mb-0">₹{draftTotalAmount.toLocaleString("en-IN")}</h3>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold text-dark mb-1">Payment Paid Now (₹)</label>
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

                  <div className="col-md-4">
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
                onClick={onClose}
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
  );
};

export default IpdRaiseChargeModal;
