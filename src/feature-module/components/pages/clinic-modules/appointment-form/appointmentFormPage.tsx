import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { DatePicker, TimePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { all_routes } from "../../../../routes/all_routes";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { apiUrl } from "../../../../../core/config/api";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicDepartments } from "../../../../../core/hooks/useClinicDepartments";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import {
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  emptyAppointmentForm,
} from "../../../../../core/utils/appointmentForm";
import { authHeaders } from "../../../../../core/utils/apiClient";
import { findSelectOption } from "../../../../../core/utils/doctorSchedule";
import AddPatientModal from "../appointments/modals/addPatientModal";

interface AppointmentFormPageProps {
  mode: "create" | "edit";
}

const AppointmentFormPage = ({ mode }: AppointmentFormPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get("patientId") || "";

  const { appointment, loading: loadingAppt } = useClinicAppointment(
    mode === "edit" ? id : undefined
  );
  const {
    patients,
    loading: loadingPatients,
    error: patientsError,
    reload: reloadPatients,
  } = useClinicPatients();
  const {
    doctors,
    loading: loadingDoctors,
    error: doctorsError,
    refetch: reloadDoctors,
  } = useClinicDoctors();
  const {
    departments,
    loading: loadingDepts,
    error: deptsError,
    refetch: reloadDepts,
  } = useClinicDepartments();
  const { appointments: existingAppointments } = useClinicAppointments();

  const [form, setForm] = useState(emptyAppointmentForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);

  const loadError = patientsError || doctorsError || deptsError;
  const optionsLoading = loadingPatients || loadingDoctors || loadingDepts;

  const nextCode =
    mode === "edit" && appointment?.appointmentCode
      ? appointment.appointmentCode
      : `AP${String(existingAppointments.length + 1).padStart(3, "0")}`;

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  useEffect(() => {
    if (mode === "create" && prefillPatientId) {
      setForm((f) => ({ ...f, patientId: prefillPatientId }));
    }
  }, [mode, prefillPatientId]);

  useEffect(() => {
    if (mode === "edit" && appointment) {
      setForm({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId || "",
        appointmentDate: dayjs(appointment.scheduledAt),
        appointmentTime: dayjs(appointment.scheduledAt),
        appointmentType: appointment.appointmentType || "Offline Consultation",
        status: appointment.status,
        reason: appointment.reason || "",
        location: appointment.location || "",
      });
    }
  }, [mode, appointment?.id]);

  const patientOptions = useMemo(
    () =>
      patients
        .filter((p) => p.id)
        .map((p) => ({
          value: p.id,
          label: p.fullName || `${p.firstName} ${p.lastName}`.trim(),
        })),
    [patients]
  );

  const doctorOptions = useMemo(() => {
    let list = doctors.filter((d) => d.id);
    if (form.departmentId) {
      list = list.filter(
        (d) =>
          (d as { departmentId?: string }).departmentId === form.departmentId ||
          d.department?.id === form.departmentId
      );
    }
    return list.map((d) => ({ value: d.id, label: d.fullName }));
  }, [doctors, form.departmentId]);

  const deptOptions = useMemo(
    () =>
      departments
        .filter((d) => d.id)
        .map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );

  const buildScheduledAt = () => {
    if (!form.appointmentDate || !form.appointmentTime) return null;
    return form.appointmentDate
      .hour(form.appointmentTime.hour())
      .minute(form.appointmentTime.minute())
      .second(0)
      .millisecond(0)
      .toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setFormError("Patient is required.");
      return;
    }
    if (!form.doctorId) {
      setFormError("Doctor is required.");
      return;
    }
    const scheduledAt = buildScheduledAt();
    if (!scheduledAt) {
      setFormError("Date and time are required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const url =
        mode === "create"
          ? apiUrl("/api/appointments")
          : apiUrl(`/api/appointments/${id}`);
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: form.doctorId,
          departmentId: form.departmentId || null,
          scheduledAt,
          appointmentType: form.appointmentType,
          status: form.status,
          reason: form.reason,
          location: form.location || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save appointment");
      }
      navigate(all_routes.appointments, { replace: true });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "edit" && loadingAppt) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="mb-4">
              <h6 className="fw-bold mb-0">
                <Link to={all_routes.appointments} className="text-dark">
                  <i className="ti ti-chevron-left me-1" />
                  Appointments
                </Link>
              </h6>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-body">
                  {loadError && (
                    <div className="alert alert-warning d-flex justify-content-between align-items-center py-2 fs-13 mb-3">
                      <span>
                        Could not load dropdown data: {loadError}. Log in as clinic
                        owner (owner@clinic.com) and ensure the backend is running.
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning ms-2"
                        onClick={() => {
                          reloadPatients();
                          reloadDoctors();
                          reloadDepts();
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {formError && (
                    <div className="alert alert-danger py-2 fs-13 mb-3">
                      {formError}
                    </div>
                  )}
                  {optionsLoading && (
                    <p className="text-muted fs-13 mb-3">
                      <span className="spinner-border spinner-border-sm me-1" />
                      Loading patients, doctors, and departments…
                    </p>
                  )}
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Appointment ID
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={nextCode}
                      disabled
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="form-label mb-0 fw-medium">
                            Patient<span className="text-danger ms-1">*</span>
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-0 px-2 fs-12"
                            style={{ height: '22px' }}
                            onClick={() => setShowAddPatient(true)}
                          >
                            <i className="ti ti-plus me-1" />
                            Add New
                          </button>
                        </div>
                        <CommonSelect
                          key={`patient-${patientOptions.length}`}
                          options={patientOptions}
                          className="select"
                          value={findSelectOption(patientOptions, form.patientId)}
                          placeholder={
                            patientOptions.length
                              ? "Select patient"
                              : optionsLoading
                                ? "Loading…"
                                : "No patients — add a patient first"
                          }
                          isDisabled={optionsLoading || patientOptions.length === 0}
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, patientId: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Department<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          key={`dept-${deptOptions.length}`}
                          options={deptOptions}
                          className="select"
                          value={findSelectOption(deptOptions, form.departmentId)}
                          placeholder={
                            deptOptions.length
                              ? "Select department"
                              : optionsLoading
                                ? "Loading…"
                                : "No departments found"
                          }
                          isDisabled={optionsLoading || deptOptions.length === 0}
                          onChange={(opt) =>
                            setForm((f) => ({
                              ...f,
                              departmentId: opt?.value || "",
                              doctorId: "",
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Doctor<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          key={`doctor-${doctorOptions.length}-${form.departmentId}`}
                          options={doctorOptions}
                          className="select"
                          value={findSelectOption(doctorOptions, form.doctorId)}
                          placeholder={
                            doctorOptions.length
                              ? "Select doctor"
                              : form.departmentId
                                ? "No doctors in this department"
                                : optionsLoading
                                  ? "Loading…"
                                  : "Select department first or add doctors"
                          }
                          isDisabled={optionsLoading || doctorOptions.length === 0}
                          onChange={(opt) =>
                            setForm((f) => ({ ...f, doctorId: opt?.value || "" }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Appointment Type<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={APPOINTMENT_TYPE_OPTIONS}
                          className="select"
                          value={findSelectOption(
                            APPOINTMENT_TYPE_OPTIONS,
                            form.appointmentType
                          )}
                          onChange={(opt) =>
                            setForm((f) => ({
                              ...f,
                              appointmentType: opt?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Date of Appointment<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker w-100"
                            format={{ format: "DD-MM-YYYY", type: "mask" }}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            suffixIcon={null}
                            value={form.appointmentDate}
                            onChange={(d: Dayjs | null) =>
                              setForm((f) => ({ ...f, appointmentDate: d }))
                            }
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label mb-1 fw-medium">
                          Time<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <TimePicker
                            className="form-control w-100"
                            use12Hours
                            format="hh:mm A"
                            value={form.appointmentTime}
                            onChange={(t: Dayjs | null) =>
                              setForm((f) => ({ ...f, appointmentTime: t }))
                            }
                            getPopupContainer={getModalContainer}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-clock text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Appointment Reason<span className="text-danger ms-1">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.reason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reason: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.location}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, location: e.target.value }))
                      }
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label mb-1 fw-medium">
                      Status<span className="text-danger ms-1">*</span>
                    </label>
                    <CommonSelect
                      options={APPOINTMENT_STATUS_OPTIONS}
                      className="select"
                      value={findSelectOption(
                        APPOINTMENT_STATUS_OPTIONS,
                        form.status
                      )}
                      onChange={(opt) =>
                        setForm((f) => ({ ...f, status: opt?.value || "Schedule" }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Link to={all_routes.appointments} className="btn btn-light me-2">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving…"
                    : mode === "create"
                      ? "Create Appointment"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <AddPatientModal
        show={showAddPatient}
        onHide={() => setShowAddPatient(false)}
        onSuccess={(newPatient) => {
          reloadPatients();
          setForm((f) => ({ ...f, patientId: newPatient.id }));
        }}
      />
    </div>
  );
};

export default AppointmentFormPage;
