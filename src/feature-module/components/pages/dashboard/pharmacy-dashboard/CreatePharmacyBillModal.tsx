import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import { useMedicines } from "../../../../../core/hooks/useMedicines";
import { usePharmacyBilling } from "../../../../../core/hooks/usePharmacyBilling";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import AddPatientModal from "../../clinic-modules/appointments/modals/addPatientModal";
import { IconFormControl } from "../../../../../core/common/form-fields";

interface BillingItem {
  medicineId: string;
  medicineName: string;
  quantity: number | "";
  unitCost: number;
  gst: number;
  amount: number;
  currentStock: number;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const CreatePharmacyBillModal = ({ open, onClose, onCreated }: Props) => {
  const { createInvoice } = usePharmacyBilling();
  const { patients, refetch: refetchPatients } = useClinicPatients();
  const { medicines, refetch: refetchMedicines } = useMedicines();
  const { prescriptions } = usePrescriptions();

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [submitting, setSubmitting] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const resetForm = () => {
    setSelectedPatientId("");
    setBillingItems([]);
    setSelectedMedId("");
    setDiscountPercent(0);
    setPaymentMethod("Cash");
    setPaymentStatus("Paid");
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const patientPrescriptions = useMemo(() => {
    if (!selectedPatientId) return [];
    return prescriptions.filter((p: any) => p.patientId === selectedPatientId);
  }, [prescriptions, selectedPatientId]);

  const patientOptions = useMemo(() => {
    return patients.map((p) => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName} (${p.patientCode || ""}) - ${p.phone || ""}`,
    }));
  }, [patients]);

  const selectedPatientOption = useMemo(() => {
    return patientOptions.find((o) => o.value === selectedPatientId) || null;
  }, [patientOptions, selectedPatientId]);

  const medicineOptions = useMemo(() => {
    return medicines
      .filter((m) => m.status === "Active")
      .map((m) => {
        const currentStock = (m.stockIn || 0) - (m.stockOut || 0);
        const isExpired = m.expiryDate && new Date(m.expiryDate) < new Date();
        let label = `${m.medicineName} (${m.medicineCode || ""}) - Stock: ${currentStock} ${m.unit || "Tablet"} | Price: ₹${m.sellingPrice}`;
        if (isExpired) label += " (Expired)";
        return {
          value: m.id,
          label,
          disabled: currentStock <= 0 || !!isExpired,
        };
      });
  }, [medicines]);

  const handleApplyPrescription = (pres: any) => {
    if (!pres.medicines || !Array.isArray(pres.medicines)) return;

    const addedItems: BillingItem[] = [];
    const warnings: string[] = [];

    pres.medicines.forEach((m: any) => {
      let searchName = m.medicineName;
      const dashIndex = searchName.indexOf(" - ");
      if (dashIndex !== -1) searchName = searchName.substring(0, dashIndex);

      const matchedMed = medicines.find(
        (item) => item.medicineName.toLowerCase() === searchName.toLowerCase()
      );
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

      const costBeforeGst = matchedMed.sellingPrice;
      const gstAmount = costBeforeGst * (matchedMed.gst / 100);
      addedItems.push({
        medicineId: matchedMed.id,
        medicineName: matchedMed.medicineName,
        quantity: 1,
        unitCost: matchedMed.sellingPrice,
        gst: matchedMed.gst,
        amount: costBeforeGst + gstAmount,
        currentStock,
      });
    });

    if (addedItems.length > 0) {
      setBillingItems((prev) => {
        const updated = [...prev];
        addedItems.forEach((newItem) => {
          if (!updated.find((item) => item.medicineId === newItem.medicineId)) {
            updated.push(newItem);
          }
        });
        return updated;
      });
      toast.success(`Added ${addedItems.length} medicine(s) from prescription!`);
    }

    if (warnings.length > 0) {
      toast.warning(`Some medicines could not be loaded: ${warnings.join(", ")}`, {
        autoClose: 5000,
      });
    }
  };

  const handleSelectMedicine = (medId: string) => {
    if (!medId) return;
    const med = medicines.find((m) => m.id === medId);
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

    const existingItem = billingItems.find((item) => item.medicineId === med.id);
    const totalQtyNeeded = 1 + (existingItem ? Number(existingItem.quantity) || 0 : 0);

    if (totalQtyNeeded > currentStock) {
      toast.error(`Insufficient stock! Only ${currentStock} units remaining.`);
      return;
    }

    if (existingItem) {
      setBillingItems((prev) =>
        prev.map((item) => {
          if (item.medicineId !== med.id) return item;
          const newQty = (Number(item.quantity) || 0) + 1;
          const costBeforeGst = newQty * item.unitCost;
          const gstAmount = costBeforeGst * (item.gst / 100);
          return { ...item, quantity: newQty, amount: costBeforeGst + gstAmount };
        })
      );
    } else {
      const costBeforeGst = med.sellingPrice;
      const gstAmount = costBeforeGst * (med.gst / 100);
      setBillingItems((prev) => [
        ...prev,
        {
          medicineId: med.id,
          medicineName: med.medicineName,
          quantity: 1,
          unitCost: med.sellingPrice,
          gst: med.gst,
          amount: costBeforeGst + gstAmount,
          currentStock,
        },
      ]);
    }
    setSelectedMedId("");
  };

  const handleUpdateItemQty = (medId: string, valStr: string) => {
    if (valStr === "") {
      setBillingItems((prev) =>
        prev.map((item) =>
          item.medicineId === medId ? { ...item, quantity: "", amount: 0 } : item
        )
      );
      return;
    }

    let newQty = parseInt(valStr) || 0;
    if (newQty < 1) newQty = 1;

    const med = medicines.find((m) => m.id === medId);
    if (!med) return;
    const currentStock = (med.stockIn || 0) - (med.stockOut || 0);

    if (newQty > currentStock) {
      toast.error(`Insufficient stock! Only ${currentStock} units remaining.`);
      return;
    }

    setBillingItems((prev) =>
      prev.map((item) => {
        if (item.medicineId !== medId) return item;
        const costBeforeGst = newQty * item.unitCost;
        const gstAmount = costBeforeGst * (item.gst / 100);
        return { ...item, quantity: newQty, amount: costBeforeGst + gstAmount };
      })
    );
  };

  const handleBlurItemQty = (medId: string, qty: number | "") => {
    if (qty === "" || qty < 1) handleUpdateItemQty(medId, "1");
  };

  const handleRemoveItem = (medId: string) => {
    setBillingItems((prev) => prev.filter((item) => item.medicineId !== medId));
  };

  const subTotal = useMemo(
    () => billingItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * item.unitCost, 0),
    [billingItems]
  );

  const totalGst = useMemo(
    () =>
      billingItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * item.unitCost * (item.gst / 100),
        0
      ),
    [billingItems]
  );

  const discountAmount = useMemo(() => {
    const amt = (subTotal * discountPercent) / 100;
    return amt < 0 ? 0 : amt;
  }, [subTotal, discountPercent]);

  const totalAmount = useMemo(() => {
    const total = subTotal + totalGst - discountAmount;
    return total < 0 ? 0 : total;
  }, [subTotal, totalGst, discountAmount]);

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
      await createInvoice({
        patientId: selectedPatientId,
        discount: discountAmount,
        tax: totalGst,
        subTotal,
        totalAmount,
        paymentMethod,
        paymentStatus,
        items: billingItems.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: Number(item.quantity) || 1,
          unitCost: item.unitCost,
          gst: item.gst,
          amount: item.amount,
        })),
      });
      toast.success("Bill generated successfully and inventory updated!");
      refetchMedicines();
      onClose();
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate bill");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {!showAddPatientModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            style={{ zIndex: 1050 }}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: "12px", overflow: "hidden" }}
            >
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-white d-flex align-items-center gap-2">
                  <i className="ti ti-file-invoice" /> Create Pharmacy Bill
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={onClose} />
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold mb-0">
                        Patient Name <span className="text-danger">*</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-flex align-items-center py-1 px-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAddPatientModal(true);
                        }}
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
                    <label className="form-label fw-semibold mb-1" style={{ marginTop: "1px" }}>
                      Select Medicine
                    </label>
                    <CommonSelect
                      options={medicineOptions}
                      value={medicineOptions.find((o) => o.value === selectedMedId) || null}
                      placeholder="Search and select medicine to add..."
                      onChange={(opt) => handleSelectMedicine(opt?.value || "")}
                    />
                  </div>

                  {selectedPatientId && patientPrescriptions.length > 0 && (
                    <div className="col-12 mt-2 border-top pt-2">
                      <label className="form-label fw-bold text-primary mb-1.5 fs-12">
                        <i className="ti ti-clipboard-list me-1" />
                        Select from Patient's Previous Prescriptions
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {patientPrescriptions.map((pres: any) => {
                          const dateStr = dayjs(
                            pres.appointment?.scheduledAt || pres.createdAt
                          ).format("DD MMM YYYY, hh:mm A");
                          const apptCode =
                            pres.appointment?.appointmentCode ||
                            pres.prescriptionCode ||
                            "Direct Visit";
                          const medicineCount = pres.medicines?.length || 0;
                          return (
                            <button
                              key={pres.id}
                              type="button"
                              className="btn btn-sm btn-outline-info text-start d-flex flex-column p-2 rounded-3 border-secondary-subtle"
                              style={{ minWidth: "180px", flex: "1 1 180px", background: "#fafcff" }}
                              onClick={() => handleApplyPrescription(pres)}
                            >
                              <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                                <span className="fw-bold text-dark fs-12">{apptCode}</span>
                                <span className="badge bg-soft-info text-info border border-info-subtle fs-10">
                                  {medicineCount} meds
                                </span>
                              </div>
                              <span className="text-muted" style={{ fontSize: "10.5px" }}>
                                <i className="ti ti-calendar me-1" />
                                {dateStr}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-4">
                    {billingItems.length === 0 ? (
                      <p className="text-muted text-center py-4 bg-light rounded-3 mb-0">
                        No medicines added to bill yet.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Medicine</th>
                              <th className="text-center" style={{ width: "90px" }}>
                                Qty
                              </th>
                              <th className="text-end">Cost</th>
                              <th className="text-center">GST</th>
                              <th className="text-end">Total</th>
                              <th className="text-center" style={{ width: "60px" }} />
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
                                    onChange={(e) =>
                                      handleUpdateItemQty(item.medicineId, e.target.value)
                                    }
                                    onBlur={() =>
                                      handleBlurItemQty(item.medicineId, item.quantity)
                                    }
                                  />
                                </td>
                                <td className="text-end">₹{item.unitCost.toFixed(2)}</td>
                                <td className="text-center">{item.gst}%</td>
                                <td className="text-end fw-bold text-dark">
                                  ₹{item.amount.toFixed(2)}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger border-0 p-1"
                                    onClick={() => handleRemoveItem(item.medicineId)}
                                  >
                                    <i className="ti ti-trash fs-14" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

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
                          onChange={(e) =>
                            setDiscountPercent(
                              Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                            )
                          }
                          onFocus={() => {
                            if (discountPercent === 0) setDiscountPercent("" as any);
                          }}
                          onBlur={() => {
                            if (discountPercent.toString().trim() === "") setDiscountPercent(0);
                          }}
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
                        <select
                          className="form-select form-select-sm"
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>
                      </div>
                      {paymentStatus === "Paid" && (
                        <div className="col-md-6">
                          <label className="form-label text-muted mb-1">Payment Method</label>
                          <select
                            className="form-select form-select-sm"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
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
                <button type="button" className="btn btn-light" onClick={onClose}>
                  Cancel
                </button>
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

      <AddPatientModal
        show={showAddPatientModal}
        onHide={() => {
          setShowAddPatientModal(false);
        }}
        onSuccess={(newPatient) => {
          refetchPatients();
          setSelectedPatientId(newPatient.id);
          setShowAddPatientModal(false);
        }}
      />
    </>
  );
};

export default CreatePharmacyBillModal;
