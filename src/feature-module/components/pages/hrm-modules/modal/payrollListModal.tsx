import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useState, useEffect } from "react";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import { Spin } from "antd";
import { toast } from "react-toastify";

interface PayrollModalProps {
  selectedPayroll?: any;
  refetch: () => void;
  staffs?: any[];
  doctors?: any[];
}

const STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Due", label: "Due" },
  { value: "Pending", label: "Pending" }
];

const PayrollListModal: React.FC<PayrollModalProps> = ({ selectedPayroll, refetch, staffs = [], doctors = [] }) => {
  const staffOptions = [
    ...staffs.map((s) => ({ value: `staff_${s.id}`, label: `${s.fullName} (Staff)` })),
    ...doctors.map((d) => ({ value: `doctor_${d.id}`, label: `${d.fullName} (Doctor)` }))
  ];

  const [employeeId, setEmployeeId] = useState<any>(null);
  const [status, setStatus] = useState<any>({ value: "Paid", label: "Paid" });
  const [basicSalary, setBasicSalary] = useState<number | string>(0);
  const [da, setDa] = useState<number | string>(0);
  const [hra, setHra] = useState<number | string>(0);
  const [conveyance, setConveyance] = useState<number | string>(0);
  const [medicalAllowance, setMedicalAllowance] = useState<number | string>(0);
  const [otherEarnings, setOtherEarnings] = useState<number | string>(0);

  const [tds, setTds] = useState<number | string>(0);
  const [esi, setEsi] = useState<number | string>(0);
  const [pf, setPf] = useState<number | string>(0);
  const [profTax, setProfTax] = useState<number | string>(0);
  const [labourWelfare, setLabourWelfare] = useState<number | string>(0);
  const [otherDeductions, setOtherDeductions] = useState<number | string>(0);

  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleFocus = (val: number | string, setter: (v: number | string) => void) => {
    if (Number(val) === 0) {
      setter("");
    }
  };

  const handleBlur = (val: number | string, setter: (v: number | string) => void) => {
    if (val === "" || isNaN(Number(val))) {
      setter(0);
    }
  };

  const netSalary = (Number(basicSalary) + Number(da) + Number(hra) + Number(conveyance) + Number(medicalAllowance) + Number(otherEarnings)) -
    (Number(tds) + Number(esi) + Number(pf) + Number(profTax) + Number(labourWelfare) + Number(otherDeductions));

  useEffect(() => {
    if (selectedPayroll) {
      const targetVal = selectedPayroll.staffId ? `staff_${selectedPayroll.staffId}` : `doctor_${selectedPayroll.doctorId}`;
      setEmployeeId(staffOptions.find(o => o.value === targetVal) || null);
      const curStatus = selectedPayroll.status || "Paid";
      setStatus(STATUS_OPTIONS.find(o => o.value === curStatus) || { value: curStatus, label: curStatus });
      setBasicSalary(selectedPayroll.basicSalary || 0);
      setDa(selectedPayroll.da || 0);
      setHra(selectedPayroll.hra || 0);
      setConveyance(selectedPayroll.conveyance || 0);
      setMedicalAllowance(selectedPayroll.medicalAllowance || 0);
      setOtherEarnings(selectedPayroll.otherEarnings || 0);

      setTds(selectedPayroll.tds || 0);
      setEsi(selectedPayroll.esi || 0);
      setPf(selectedPayroll.pf || 0);
      setProfTax(selectedPayroll.profTax || 0);
      setLabourWelfare(selectedPayroll.labourWelfare || 0);
      setOtherDeductions(selectedPayroll.otherDeductions || 0);
      setSalaryDate(selectedPayroll.salaryDate ? new Date(selectedPayroll.salaryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      resetForm();
    }
  }, [selectedPayroll, staffs, doctors]);

  const resetForm = () => {
    setEmployeeId(null);
    setStatus({ value: "Paid", label: "Paid" });
    setBasicSalary(0); setDa(0); setHra(0); setConveyance(0); setMedicalAllowance(0); setOtherEarnings(0);
    setTds(0); setEsi(0); setPf(0); setProfTax(0); setLabourWelfare(0); setOtherDeductions(0);
    setSalaryDate(new Date().toISOString().split('T')[0]);
  };

  const constructPayload = () => {
    const isDoctor = employeeId?.value?.startsWith("doctor_");
    const rawId = employeeId?.value?.split("_")[1];
    return {
      staffId: isDoctor ? null : rawId,
      doctorId: isDoctor ? rawId : null,
      netSalary: Number(netSalary),
      basicSalary: Number(basicSalary),
      da: Number(da),
      hra: Number(hra),
      conveyance: Number(conveyance),
      medicalAllowance: Number(medicalAllowance),
      otherEarnings: Number(otherEarnings),
      tds: Number(tds),
      esi: Number(esi),
      pf: Number(pf),
      profTax: Number(profTax),
      labourWelfare: Number(labourWelfare),
      otherDeductions: Number(otherDeductions),
      status: status?.value || "Paid",
      salaryDate: salaryDate
    };
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!employeeId?.value) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/payroll", constructPayload());
      toast.success("Payroll record added successfully");
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_payroll .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add payroll");
    }
    setLoading(false);
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedPayroll || !employeeId?.value) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      await apiPut(`/api/payroll/${selectedPayroll.id}`, constructPayload());
      toast.success("Payroll record updated successfully");
      refetch();
      document.querySelector<HTMLElement>("#edit_payroll .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payroll");
    }
    setLoading(false);
  };


  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    setLoading(true);
    try {
      await apiDelete(`/api/payroll/${selectedPayroll.id}`);
      toast.success("Payroll record deleted successfully");
      refetch();
      document.querySelector<HTMLElement>("#delete_payroll .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete payroll");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Start Add Modal */}
      <div id="add_payroll" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Add Employee Salary</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="row row-gap-2 mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Select Employee <span className="text-danger">*</span></label>
                      <CommonSelect
                        options={staffOptions}
                        className="select"
                        value={employeeId}
                        onChange={(val: any) => setEmployeeId(val)}
                        placeholder="Select Employee"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                      <CommonSelect
                        options={STATUS_OPTIONS}
                        className="select"
                        value={status}
                        onChange={(val: any) => setStatus(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Salary Month / Date <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-0">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Net Salary</label>
                      <input type="text" className="form-control bg-light fw-bold text-success" disabled value={`₹${netSalary}`} />
                    </div>
                  </div>
                </div>
                {/* Earnings & Deductions Details */}
                <div className="row row-gap-2">
                  <div className="col-md-6">
                    <h6 className="mb-3 fw-bold">Earnings (₹)</h6>
                    <div className="mb-3">
                      <label className="form-label">Basic Salary <span className="text-danger ms-1">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        onFocus={() => handleFocus(basicSalary, setBasicSalary)}
                        onBlur={() => handleBlur(basicSalary, setBasicSalary)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">DA (40%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={da}
                        onChange={(e) => setDa(e.target.value)}
                        onFocus={() => handleFocus(da, setDa)}
                        onBlur={() => handleBlur(da, setDa)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">HRA (15%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={hra}
                        onChange={(e) => setHra(e.target.value)}
                        onFocus={() => handleFocus(hra, setHra)}
                        onBlur={() => handleBlur(hra, setHra)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Conveyance</label>
                      <input
                        type="number"
                        className="form-control"
                        value={conveyance}
                        onChange={(e) => setConveyance(e.target.value)}
                        onFocus={() => handleFocus(conveyance, setConveyance)}
                        onBlur={() => handleBlur(conveyance, setConveyance)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Medical Allowance</label>
                      <input
                        type="number"
                        className="form-control"
                        value={medicalAllowance}
                        onChange={(e) => setMedicalAllowance(e.target.value)}
                        onFocus={() => handleFocus(medicalAllowance, setMedicalAllowance)}
                        onBlur={() => handleBlur(medicalAllowance, setMedicalAllowance)}
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Others</label>
                      <input
                        type="number"
                        className="form-control"
                        value={otherEarnings}
                        onChange={(e) => setOtherEarnings(e.target.value)}
                        onFocus={() => handleFocus(otherEarnings, setOtherEarnings)}
                        onBlur={() => handleBlur(otherEarnings, setOtherEarnings)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3 fw-bold">Deductions (₹)</h6>
                    <div className="mb-3">
                      <label className="form-label">TDS</label>
                      <input
                        type="number"
                        className="form-control"
                        value={tds}
                        onChange={(e) => setTds(e.target.value)}
                        onFocus={() => handleFocus(tds, setTds)}
                        onBlur={() => handleBlur(tds, setTds)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">ESI</label>
                      <input
                        type="number"
                        className="form-control"
                        value={esi}
                        onChange={(e) => setEsi(e.target.value)}
                        onFocus={() => handleFocus(esi, setEsi)}
                        onBlur={() => handleBlur(esi, setEsi)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">PF</label>
                      <input
                        type="number"
                        className="form-control"
                        value={pf}
                        onChange={(e) => setPf(e.target.value)}
                        onFocus={() => handleFocus(pf, setPf)}
                        onBlur={() => handleBlur(pf, setPf)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Prof Tax</label>
                      <input
                        type="number"
                        className="form-control"
                        value={profTax}
                        onChange={(e) => setProfTax(e.target.value)}
                        onFocus={() => handleFocus(profTax, setProfTax)}
                        onBlur={() => handleBlur(profTax, setProfTax)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Labour Welfare</label>
                      <input
                        type="number"
                        className="form-control"
                        value={labourWelfare}
                        onChange={(e) => setLabourWelfare(e.target.value)}
                        onFocus={() => handleFocus(labourWelfare, setLabourWelfare)}
                        onBlur={() => handleBlur(labourWelfare, setLabourWelfare)}
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Others</label>
                      <input
                        type="number"
                        className="form-control"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        onFocus={() => handleFocus(otherDeductions, setOtherDeductions)}
                        onBlur={() => handleBlur(otherDeductions, setOtherDeductions)}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={loading} style={{ borderRadius: '6px' }}>{loading && <i className="fa fa-spinner fa-spin me-2" />} {loading ? "Saving..." : "Add Payslip"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div id="edit_payroll" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Edit Employee Salary</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="row row-gap-2 mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Select Employee <span className="text-danger">*</span></label>
                      <CommonSelect
                        options={staffOptions}
                        className="select"
                        value={employeeId}
                        onChange={(val: any) => setEmployeeId(val)}
                        placeholder="Select Employee"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Status <span className="text-danger">*</span></label>
                      <CommonSelect
                        options={STATUS_OPTIONS}
                        className="select"
                        value={status}
                        onChange={(val: any) => setStatus(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Salary Month / Date <span className="text-danger">*</span></label>
                      <input type="date" className="form-control" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-0">
                      <label className="form-label mb-1 text-dark fs-14 fw-medium">Net Salary</label>
                      <input type="text" className="form-control bg-light fw-bold text-success" disabled value={`₹${netSalary}`} />
                    </div>
                  </div>
                </div>
                <div className="row row-gap-2">
                  <div className="col-md-6">
                    <h6 className="mb-3 fw-bold">Earnings (₹)</h6>
                    <div className="mb-3">
                      <label className="form-label">Basic Salary <span className="text-danger ms-1">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        onFocus={() => handleFocus(basicSalary, setBasicSalary)}
                        onBlur={() => handleBlur(basicSalary, setBasicSalary)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">DA (40%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={da}
                        onChange={(e) => setDa(e.target.value)}
                        onFocus={() => handleFocus(da, setDa)}
                        onBlur={() => handleBlur(da, setDa)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">HRA (15%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={hra}
                        onChange={(e) => setHra(e.target.value)}
                        onFocus={() => handleFocus(hra, setHra)}
                        onBlur={() => handleBlur(hra, setHra)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Conveyance</label>
                      <input
                        type="number"
                        className="form-control"
                        value={conveyance}
                        onChange={(e) => setConveyance(e.target.value)}
                        onFocus={() => handleFocus(conveyance, setConveyance)}
                        onBlur={() => handleBlur(conveyance, setConveyance)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Medical Allowance</label>
                      <input
                        type="number"
                        className="form-control"
                        value={medicalAllowance}
                        onChange={(e) => setMedicalAllowance(e.target.value)}
                        onFocus={() => handleFocus(medicalAllowance, setMedicalAllowance)}
                        onBlur={() => handleBlur(medicalAllowance, setMedicalAllowance)}
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Others</label>
                      <input
                        type="number"
                        className="form-control"
                        value={otherEarnings}
                        onChange={(e) => setOtherEarnings(e.target.value)}
                        onFocus={() => handleFocus(otherEarnings, setOtherEarnings)}
                        onBlur={() => handleBlur(otherEarnings, setOtherEarnings)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3 fw-bold">Deductions (₹)</h6>
                    <div className="mb-3">
                      <label className="form-label">TDS</label>
                      <input
                        type="number"
                        className="form-control"
                        value={tds}
                        onChange={(e) => setTds(e.target.value)}
                        onFocus={() => handleFocus(tds, setTds)}
                        onBlur={() => handleBlur(tds, setTds)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">ESI</label>
                      <input
                        type="number"
                        className="form-control"
                        value={esi}
                        onChange={(e) => setEsi(e.target.value)}
                        onFocus={() => handleFocus(esi, setEsi)}
                        onBlur={() => handleBlur(esi, setEsi)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">PF</label>
                      <input
                        type="number"
                        className="form-control"
                        value={pf}
                        onChange={(e) => setPf(e.target.value)}
                        onFocus={() => handleFocus(pf, setPf)}
                        onBlur={() => handleBlur(pf, setPf)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Prof Tax</label>
                      <input
                        type="number"
                        className="form-control"
                        value={profTax}
                        onChange={(e) => setProfTax(e.target.value)}
                        onFocus={() => handleFocus(profTax, setProfTax)}
                        onBlur={() => handleBlur(profTax, setProfTax)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Labour Welfare</label>
                      <input
                        type="number"
                        className="form-control"
                        value={labourWelfare}
                        onChange={(e) => setLabourWelfare(e.target.value)}
                        onFocus={() => handleFocus(labourWelfare, setLabourWelfare)}
                        onBlur={() => handleBlur(labourWelfare, setLabourWelfare)}
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Others</label>
                      <input
                        type="number"
                        className="form-control"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        onFocus={() => handleFocus(otherDeductions, setOtherDeductions)}
                        onBlur={() => handleBlur(otherDeductions, setOtherDeductions)}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={loading} style={{ borderRadius: '6px' }}>{loading && <i className="fa fa-spinner fa-spin me-2" />} {loading ? "Saving..." : "Save Changes"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete_payroll">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure you want to delete this payroll record?</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</button>
                <button type="button" onClick={handleDelete} className="btn btn-danger position-relative z-1">{loading ? <Spin size="small" /> : "Yes, Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollListModal;
