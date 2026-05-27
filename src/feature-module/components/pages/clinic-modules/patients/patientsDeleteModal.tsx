import { useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../../core/config/api";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import { closeBootstrapModal } from "../../../../../core/utils/staffForm";

interface PatientsDeleteModalProps {
  patient: ClinicPatient | null;
  onDeleted: () => void;
  onClear: () => void;
}

const PatientsDeleteModal = ({
  patient,
  onDeleted,
  onClear,
}: PatientsDeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!patient?.id) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/patients/${patient.id}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete");
      }
      closeBootstrapModal("delete_patient_modal");
      onClear();
      onDeleted();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal fade" id="delete_patient_modal">
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
            <p className="mb-3">
              Delete <strong>{patient?.fullName || "this patient"}</strong>?
            </p>
            <div className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-light position-relative z-1 me-3"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger position-relative z-1"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsDeleteModal;
