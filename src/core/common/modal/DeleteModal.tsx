import React from "react";
import ImageWithBasePath from "../../imageWithBasePath";

interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  submitting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message,
  submitting = false,
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal-dialog modal-dialog-centered modal-sm" style={{ zIndex: 1050 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
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
                <i className="ti ti-trash fs-24"></i>
              </span>
            </div>
            <h5 className="fw-bold mb-2">{title}</h5>
            <p className="text-muted mb-4">{message}</p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-light position-relative z-1 px-4"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger position-relative z-1 px-4"
                onClick={onConfirm}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
