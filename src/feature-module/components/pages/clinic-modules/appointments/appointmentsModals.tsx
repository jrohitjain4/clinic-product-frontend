import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { Link } from "react-router";
import { all_routes } from "../../../../routes/all_routes";
import type { ClinicAppointment } from "../../../../../core/types/clinicAppointment";
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  statusBadgeClass,
} from "../../../../../core/utils/appointmentForm";
import { closeBootstrapModal } from "../../../../../core/utils/staffForm";
import { apiUrl } from "../../../../../core/config/api";
import { useState } from "react";

interface AppointmentsModalsProps {
  selected: ClinicAppointment | null;
  onClear: () => void;
  onDeleted: () => void;
}

const AppointmentsModals = ({
  selected,
  onClear,
  onDeleted,
}: AppointmentsModalsProps) => {
  const [deleting, setDeleting] = useState(false);

  const patientPath = selected
    ? all_routes.patientDetails.replace(":id", selected.patientId)
    : "#";
  const doctorPath = selected
    ? all_routes.doctorsDetails.replace(":id", selected.doctorId)
    : "#";

  const handleDelete = async () => {
    if (!selected?.id) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/appointments/${selected.id}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete");
      }
      closeBootstrapModal("delete_appointment_modal");
      onClear();
      onDeleted();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const patientImg =
    selected?.patient.profileImage || "assets/img/users/user-08.jpg";
  const doctorImg =
    selected?.doctor.profileImage || "assets/img/doctors/doctor-01.jpg";

  return (
    <>
      <div
        className="offcanvas offcanvas-offset offcanvas-end"
        tabIndex={-1}
        id="view_details"
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">
              Appointment Details
              {selected?.appointmentCode && (
                <span className="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium ms-2">
                  #{selected.appointmentCode}
                </span>
              )}
            </h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x bg-white fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-0 px-0">
          {selected ? (
            <>
              <h6 className="bg-light py-2 px-3 fw-bold">When &amp; Where</h6>
              <div className="px-3 my-4">
                <div className="bg-light p-3 mb-3 border rounded-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <Link to={doctorPath} className="avatar avatar-md me-2">
                      <ImageWithBasePath
                        src={doctorImg}
                        alt="Doctor"
                        className="rounded-circle"
                      />
                    </Link>
                    <div>
                      <Link to={doctorPath} className="text-dark fw-semibold">
                        {selected.doctor.fullName}
                      </Link>
                      <span className="text-body fs-13 fw-normal d-block">
                        {selected.doctorRole ||
                          selected.doctor.designation?.name ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Appointment On
                  <span className="text-body fw-normal">
                    {formatAppointmentDate(selected.scheduledAt)}
                  </span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Time
                  <span className="text-body fw-normal">
                    {formatAppointmentTimeRange(
                      selected.scheduledAt,
                      selected.endAt
                    )}
                  </span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Mode
                  <span className="text-body fw-normal">{selected.mode}</span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Appointment Type
                  <span className="text-body fw-normal">
                    {selected.appointmentType || "—"}
                  </span>
                </p>
                <p className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Status
                  <span
                    className={`badge fs-13 rounded fw-medium ${statusBadgeClass(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                </p>
                <div className="text-dark mb-3 fw-semibold d-flex align-items-center justify-content-between">
                  Patient
                  <div className="text-body fw-normal d-flex align-items-center">
                    <span className="avatar avatar-xs flex-shrink-0 me-1">
                      <ImageWithBasePath
                        src={patientImg}
                        alt=""
                        className="rounded-circle"
                      />
                    </span>
                    <Link to={patientPath}>{selected.patientName}</Link>
                  </div>
                </div>
                {selected.reason && (
                  <p className="text-dark mb-0">
                    <span className="fw-semibold">Reason: </span>
                    {selected.reason}
                  </p>
                )}
              </div>
              <div className="px-3 pb-3">
                <Link
                  to={all_routes.editAppointment.replace(":id", selected.id)}
                  className="btn btn-primary w-100"
                >
                  Edit Appointment
                </Link>
              </div>
            </>
          ) : (
            <p className="text-muted px-3">Select an appointment.</p>
          )}
        </div>
      </div>

      <div className="modal fade" id="delete_appointment_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Delete this appointment?</p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
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
    </>
  );
};

export default AppointmentsModals;
