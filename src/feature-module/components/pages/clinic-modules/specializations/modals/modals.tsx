import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import { StatusActive } from "../../../../../../core/common/selectOption";
import { apiPost, apiPut, apiDelete } from "../../../../../../core/utils/apiClient";
import { toast } from "react-toastify";

interface ModalsProps {
  selectedSpecialization?: any;
  refetch?: () => void;
}

const Modals = ({ selectedSpecialization, refetch }: ModalsProps) => {
  // Add Specialization
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");

  const handleAddSubmit = async (e: any) => {
    e.preventDefault();
    if (!addName) return;
    try {
      await apiPost("/api/specializations", {
        name: addName,
        description: addDesc,
        status: "Active"
      });
      toast.success("Specialization added successfully!");
      refetch?.();
      setAddName("");
      setAddDesc("");
      document.getElementById("close-add-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to add specialization");
    }
  };

  // Edit Specialization
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<any>(null);

  useEffect(() => {
    if (selectedSpecialization) {
      setEditName(selectedSpecialization.name);
      setEditDesc(selectedSpecialization.description || "");
      if (selectedSpecialization.status) {
        setEditStatus({
          value: selectedSpecialization.status,
          label: selectedSpecialization.status,
        });
      } else {
        setEditStatus(null);
      }
    }
  }, [selectedSpecialization]);

  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedSpecialization || !editName || !editStatus) return;
    try {
      await apiPut(`/api/specializations/${selectedSpecialization.id}`, {
        name: editName,
        description: editDesc,
        status: editStatus?.value || "Active",
      });
      toast.success("Specialization updated successfully!");
      refetch?.();
      document.getElementById("close-edit-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to update specialization");
    }
  };

  // Delete Specialization
  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedSpecialization) return;
    try {
      await apiDelete(`/api/specializations/${selectedSpecialization.id}`);
      toast.success("Specialization deleted successfully!");
      refetch?.();
      document.getElementById("close-delete-modal")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete specialization");
    }
  };

  return (
    <>
      {/* Start Add Modal */}
      <div id="add_specialization" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add New Specialization</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                id="close-add-modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Specialization<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                  />
                </div>
              </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light px-4 shadow-sm"
                    data-bs-dismiss="modal"
                    style={{ borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" style={{ borderRadius: '6px' }}>
                    Add Specialization
                  </button>
                </div>
              </form>
            </div>
        </div>
      </div>
      {/* End Add Modal */}

      {/* Start Edit Modal */}
      <div id="edit_specialization" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Edit Specialization</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                id="close-edit-modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Specialization<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">
                    Status<span className="text-danger ms-1">*</span>
                  </label>
                  <CommonSelect
                    options={StatusActive}
                    className="select"
                    value={editStatus}
                    onChange={(val) => setEditStatus(val)}
                  />
                </div>
              </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-light px-4 shadow-sm"
                    data-bs-dismiss="modal"
                    style={{ borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" style={{ borderRadius: '6px' }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
        </div>
      </div>
      {/* End Edit Modal */}

      {/* Start Delete Modal  */}
      <div className="modal fade" id="delete_specialization">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-n1"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-n1"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure want to delete?</p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                  id="close-delete-modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Delete Modal  */}
    </>
  );
};

export default Modals;
