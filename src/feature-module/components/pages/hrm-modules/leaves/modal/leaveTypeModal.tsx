import React, { useState, useEffect } from "react";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import { StatusActive } from "../../../../../../core/common/selectOption";
import { toast } from "react-toastify";

type Props = {
  currentRecord: any;
  handleCreate: (data: any) => Promise<{ success: boolean; message: string }>;
  handleUpdate: (id: string, data: any) => Promise<{ success: boolean; message: string }>;
  handleDelete: (id: string) => Promise<{ success: boolean; message: string }>;
};

const LeaveTypeModal = ({ currentRecord, handleCreate, handleUpdate, handleDelete }: Props) => {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (currentRecord) {
      setName(currentRecord.name || "");
      setQuota(currentRecord.quota || "");
      setStatus(currentRecord.status || "Active");
    } else {
      setName("");
      setQuota("");
      setStatus("Active");
    }
  }, [currentRecord]);

  const onSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleCreate({ name, quota: parseInt(quota, 10), status });
    if (result.success) {
      toast.success(result.message);
      const btn = document.querySelector("#add_leave_type .btn-close") as HTMLButtonElement;
      if (btn) btn.click();
    } else {
      toast.error(result.message);
    }
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    const result = await handleUpdate(currentRecord.id, { name, quota: parseInt(quota, 10), status });
    if (result.success) {
      toast.success(result.message);
      const btn = document.querySelector("#edit_leave_type .btn-close") as HTMLButtonElement;
      if (btn) btn.click();
    } else {
      toast.error(result.message);
    }
  };

  const onConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    const result = await handleDelete(currentRecord.id);
    if (result.success) {
      toast.success(result.message);
      const btn = document.querySelector("#delete_leave_type_cancel") as HTMLAnchorElement;
      if (btn) btn.click();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div id="add_leave_type" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add Leave Type</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={onSubmitAdd}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Leave Type<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="mb-0">
                  <label className="form-label">Leave Quota (Days)<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={quota} onChange={e => setQuota(e.target.value)} required />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" style={{ borderRadius: '6px' }}>Add New Leave Type</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div id="edit_leave_type" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Edit Leave Type</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={onSubmitEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Leave Type<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Leave Quota (Days)<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={quota} onChange={e => setQuota(e.target.value)} required />
                </div>
                <div className="mb-0">
                  <label className="form-label">Status</label>
                  <CommonSelect
                    options={StatusActive}
                    className="select"
                    defaultValue={StatusActive.find(o => o.value === status) || StatusActive[0]}
                    onChange={(val: any) => setStatus(val)}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" style={{ borderRadius: '6px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete_leave_type">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure want to delete?</p>
              <div className="d-flex justify-content-center">
                <a href="#" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal" id="delete_leave_type_cancel">
                  Cancel
                </a>
                <a href="#" onClick={onConfirmDelete} className="btn btn-danger position-relative z-1">
                  Yes, Delete
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveTypeModal;
