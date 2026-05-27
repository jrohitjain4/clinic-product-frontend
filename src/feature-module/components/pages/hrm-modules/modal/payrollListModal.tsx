import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useState, useEffect } from "react";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import { Spin } from "antd";

interface PayrollModalProps {
  selectedPayroll?: any;
  refetch: () => void;
  staffs?: any[];
}

const PayrollListModal: React.FC<PayrollModalProps> = ({ selectedPayroll, refetch, staffs = [] }) => {
  const staffOptions = staffs.map((s) => ({ value: s.id, label: s.fullName }));

  const [staffId, setStaffId] = useState<any>(null);
  const [basicSalary, setBasicSalary] = useState(0);
  const [da, setDa] = useState(0);
  const [hra, setHra] = useState(0);
  const [conveyance, setConveyance] = useState(0);
  const [medicalAllowance, setMedicalAllowance] = useState(0);
  const [otherEarnings, setOtherEarnings] = useState(0);

  const [tds, setTds] = useState(0);
  const [esi, setEsi] = useState(0);
  const [pf, setPf] = useState(0);
  const [profTax, setProfTax] = useState(0);
  const [labourWelfare, setLabourWelfare] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const [loading, setLoading] = useState(false);

  const netSalary = (basicSalary + da + hra + conveyance + medicalAllowance + otherEarnings) -
    (tds + esi + pf + profTax + labourWelfare + otherDeductions);

  useEffect(() => {
    if (selectedPayroll) {
      setStaffId(staffOptions.find(o => o.value === selectedPayroll.staffId) || null);
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
    } else {
      resetForm();
    }
  }, [selectedPayroll]);

  const resetForm = () => {
    setStaffId(null);
    setBasicSalary(0); setDa(0); setHra(0); setConveyance(0); setMedicalAllowance(0); setOtherEarnings(0);
    setTds(0); setEsi(0); setPf(0); setProfTax(0); setLabourWelfare(0); setOtherDeductions(0);
  };

  const constructPayload = () => ({
    staffId: staffId?.value,
    netSalary,
    basicSalary, da, hra, conveyance, medicalAllowance, otherEarnings,
    tds, esi, pf, profTax, labourWelfare, otherDeductions
  });

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!staffId?.value) return;
    setLoading(true);
    try {
      await apiPost("/api/payroll", constructPayload());
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_payroll .btn-close")?.click();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedPayroll || !staffId?.value) return;
    setLoading(true);
    try {
      await apiPut(`/api/payroll/${selectedPayroll.id}`, constructPayload());
      refetch();
      document.querySelector<HTMLElement>("#edit_payroll .btn-close")?.click();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    setLoading(true);
    try {
      await apiDelete(`/api/payroll/${selectedPayroll.id}`);
      refetch();
      document.querySelector<HTMLElement>("#delete_payroll .btn-close")?.click();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Start Add Modal */}
      <div id="add_payroll" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Add Employee Salary</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="row row-gap-2 mb-3">
                  <div className="col-md-6">
                    <div className="mb-0">
                      <label className="form-label">Select Staff</label>
                      <CommonSelect
                        options={staffOptions}
                        className="select"
                        value={staffId}
                        onChange={(val: any) => setStaffId(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-0">
                      <label className="form-label">Net Salary</label>
                      <input type="text" className="form-control bg-light" disabled value={netSalary} />
                    </div>
                  </div>
                </div>
                {/* Earnings & Deductions Details */}
                <div className="row row-gap-2">
                  <div className="col-md-6">
                    <h6 className="mb-3">Earnings ($)</h6>
                    <div className="mb-3">
                      <label className="form-label">Basic Salary <span className="text-danger ms-1">*</span></label>
                      <input type="number" className="form-control" value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} required />
                    </div>
                    <div className="mb-3"><label className="form-label">DA (40%)</label><input type="number" className="form-control" value={da} onChange={(e) => setDa(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">HRA (15%)</label><input type="number" className="form-control" value={hra} onChange={(e) => setHra(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Conveyance</label><input type="number" className="form-control" value={conveyance} onChange={(e) => setConveyance(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Medical Allowance</label><input type="number" className="form-control" value={medicalAllowance} onChange={(e) => setMedicalAllowance(Number(e.target.value))} /></div>
                    <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control" value={otherEarnings} onChange={(e) => setOtherEarnings(Number(e.target.value))} /></div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3">Deductions ($)</h6>
                    <div className="mb-3"><label className="form-label">TDS</label><input type="number" className="form-control" value={tds} onChange={(e) => setTds(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">ESI</label><input type="number" className="form-control" value={esi} onChange={(e) => setEsi(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">PF</label><input type="number" className="form-control" value={pf} onChange={(e) => setPf(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Prof Tax</label><input type="number" className="form-control" value={profTax} onChange={(e) => setProfTax(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Labour Welfare</label><input type="number" className="form-control" value={labourWelfare} onChange={(e) => setLabourWelfare(Number(e.target.value))} /></div>
                    <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control" value={otherDeductions} onChange={(e) => setOtherDeductions(Number(e.target.value))} /></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <Spin size="small" /> : "Add Payslip"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div id="edit_payroll" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Edit Employee Salary</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="row row-gap-2 mb-3">
                  <div className="col-md-6">
                    <div className="mb-0">
                      <label className="form-label">Select Staff</label>
                      <CommonSelect
                        options={staffOptions}
                        className="select"
                        value={staffId}
                        onChange={(val: any) => setStaffId(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-0">
                      <label className="form-label">Net Salary</label>
                      <input type="text" className="form-control bg-light" disabled value={netSalary} />
                    </div>
                  </div>
                </div>
                <div className="row row-gap-2">
                  <div className="col-md-6">
                    <h6 className="mb-3">Earnings ($)</h6>
                    <div className="mb-3">
                      <label className="form-label">Basic Salary <span className="text-danger ms-1">*</span></label>
                      <input type="number" className="form-control" value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} required />
                    </div>
                    <div className="mb-3"><label className="form-label">DA (40%)</label><input type="number" className="form-control" value={da} onChange={(e) => setDa(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">HRA (15%)</label><input type="number" className="form-control" value={hra} onChange={(e) => setHra(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Conveyance</label><input type="number" className="form-control" value={conveyance} onChange={(e) => setConveyance(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Medical Allowance</label><input type="number" className="form-control" value={medicalAllowance} onChange={(e) => setMedicalAllowance(Number(e.target.value))} /></div>
                    <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control" value={otherEarnings} onChange={(e) => setOtherEarnings(Number(e.target.value))} /></div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3">Deductions ($)</h6>
                    <div className="mb-3"><label className="form-label">TDS</label><input type="number" className="form-control" value={tds} onChange={(e) => setTds(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">ESI</label><input type="number" className="form-control" value={esi} onChange={(e) => setEsi(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">PF</label><input type="number" className="form-control" value={pf} onChange={(e) => setPf(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Prof Tax</label><input type="number" className="form-control" value={profTax} onChange={(e) => setProfTax(Number(e.target.value))} /></div>
                    <div className="mb-3"><label className="form-label">Labour Welfare</label><input type="number" className="form-control" value={labourWelfare} onChange={(e) => setLabourWelfare(Number(e.target.value))} /></div>
                    <div className="mb-0"><label className="form-label">Others</label><input type="number" className="form-control" value={otherDeductions} onChange={(e) => setOtherDeductions(Number(e.target.value))} /></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <Spin size="small" /> : "Save Changes"}</button>
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
                <Link to="#" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal">Cancel</Link>
                <Link to="#" onClick={handleDelete} className="btn btn-danger position-relative z-1">{loading ? <Spin size="small" /> : "Yes, Delete"}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayrollListModal;
