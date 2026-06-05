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
import { toast } from "react-toastify";

interface AppointmentFormPageProps {
  mode: "create" | "edit";
}

const AppointmentFormPage = ({ mode }: AppointmentFormPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get("patientId") || "";

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isPatientRole = currentUser?.role === "PATIENT";

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
  const [availability, setAvailability] = useState<{
    schedules: any;
    duration?: number;
    holidays: any[];
    leaves: any[];
    appointments: any[];
  } | null>(null);

  const loadError = patientsError || doctorsError || deptsError;
  const optionsLoading = loadingPatients || loadingDoctors || loadingDepts;

  const nextCode =
    mode === "edit" && appointment?.appointmentCode
      ? appointment.appointmentCode
      : `AP${String(existingAppointments.length + 1).padStart(3, "0")}`;

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  useEffect(() => {
    if (mode === "create") {
      let targetId = prefillPatientId;
      if (isPatientRole && currentUser?.email && patients.length > 0) {
        const myPatient = patients.find((p: any) => p.email === currentUser.email);
        if (myPatient) targetId = myPatient.id;
      }
      if (targetId) {
        setForm((f) => ({ ...f, patientId: targetId }));
      }
    }
  }, [mode, prefillPatientId, isPatientRole, currentUser?.email, patients]);

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
      });
    }
  }, [mode, appointment?.id]);

  // ── Fetch Doctor Availability ──────────────────────────────────
  useEffect(() => {
    if (form.doctorId) {
      const start = dayjs().startOf("month").subtract(1, "month").toISOString();
      const end = dayjs().endOf("month").add(3, "month").toISOString();

      fetch(apiUrl(`/api/doctors/${form.doctorId}/availability?startDate=${start}&endDate=${end}`), {
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((data) => {
          setAvailability(data);
          // If a slot was previously selected but is no longer valid, we could warn,
          // but for now let it be.
        })
        .catch(console.error);
    } else {
      setAvailability(null);
    }
  }, [form.doctorId]);

  const availableSlots = useMemo(() => {
    if (!availability || !form.appointmentDate) return [];
    const dayName = form.appointmentDate.format("dddd");
    const dateStr = form.appointmentDate.format("YYYY-MM-DD");
    const daySchedule = availability.schedules?.[dayName];
    if (!Array.isArray(daySchedule)) return [];

    const duration = availability.duration || 30; // Default to 30 mins if not set
    const slots: any[] = [];

    daySchedule.forEach((session: any) => {
      let currentSlot = dayjs(session.from, "HH:mm");
      const sessionEnd = dayjs(session.to, "HH:mm");

      while (currentSlot.isBefore(sessionEnd)) {
        const slotTime = currentSlot.format("HH:mm");
        const isBooked = availability.appointments?.some((a: any) => {
          return (
            dayjs(a.start).format("YYYY-MM-DD") === dateStr &&
            dayjs(a.start).format("HH:mm") === slotTime
          );
        });

        slots.push({
          from: slotTime,
          isBooked,
          label: currentSlot.format("hh:mm A"),
        });

        currentSlot = currentSlot.add(duration, "minute");
      }
    });

    return slots;
  }, [availability, form.appointmentDate]);

  // ── Auto-check for Follow-up status ────────────────────────────
  useEffect(() => {
    if (mode === "create" && form.patientId && form.doctorId) {
      const scheduledAt = buildScheduledAt();
      const query = new URLSearchParams();
      query.append("patientId", form.patientId);
      query.append("doctorId", form.doctorId);
      if (scheduledAt) {
        query.append("date", scheduledAt);
      }

      fetch(apiUrl(`/api/appointments/check-followup?${query.toString()}`), {
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.isFollowup) {
            setForm((f) => ({ ...f, status: "Follow-up" }));
          } else if (form.status === "Follow-up") {
            // Revert if it's no longer a follow-up (e.g. doctor changed)
            setForm((f) => ({ ...f, status: "Schedule" }));
          }
        })
        .catch(console.error);
    }
  }, [mode, form.patientId, form.doctorId, form.appointmentDate, form.appointmentTime]);

  const patientOptions = useMemo(() => {
    let filtered = patients.filter((p: any) => p.id);
    if (isPatientRole && currentUser?.email) {
      filtered = filtered.filter((p: any) => p.email === currentUser.email);
    }
    return filtered.map((p: any) => ({
      value: p.id,
      label: p.fullName || `${p.firstName} ${p.lastName}`.trim(),
    }));
  }, [patients, isPatientRole, currentUser?.email]);

  const doctorOptions = useMemo(() => {
    let list = doctors.filter((d: any) => d.id);
    if (form.departmentId) {
      list = list.filter(
        (d: any) =>
          (d as { departmentId?: string }).departmentId === form.departmentId ||
          d.department?.id === form.departmentId
      );
    }
    return list.map((d: any) => ({ value: d.id, label: d.fullName }));
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save appointment");
      }

      toast.success(mode === "create" ? "Appointment created successfully!" : "Appointment updated successfully!");
      navigate(all_routes.appointments, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cellRender = (current: Dayjs | any, info: any) => {
    if (info.type !== 'date' || !availability || !dayjs.isDayjs(current)) return info.originNode;

    const dateStr = current.format("YYYY-MM-DD");
    const dayName = current.format("dddd");

    // 1. Holiday (Blueish) - HIGHEST PRIORITY as per user
    const isHoliday = availability.holidays.some((h) => {
      const start = dayjs(h.date).startOf("day");
      const end = h.endDate ? dayjs(h.endDate).endOf("day") : start.endOf("day");
      return (current.isAfter(start) || current.isSame(start)) && (current.isBefore(end) || current.isSame(end));
    });

    if (isHoliday) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px', color: '#0050b3' }}>
          {current.date()}
        </div>
      );
    }

    const daySchedule = availability.schedules?.[dayName];
    const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;

    // 2. Weekly Off (Red)
    if (!isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', color: '#a8071a' }}>
          {current.date()}
        </div>
      );
    }

    // 3. Leave (Yellow)
    const isLeave = availability.leaves.some((l) => {
      const s = dayjs(l.start).startOf("day");
      const e = dayjs(l.end).endOf("day");
      return (current.isAfter(s) || current.isSame(s)) && (current.isBefore(e) || current.isSame(e));
    });
    if (isLeave) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', color: '#874d00' }}>
          {current.date()}
        </div>
      );
    }

    // 4. Working Day (Green)
    if (isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px', color: '#237804' }}>
          {current.date()}
        </div>
      );
    }

    return info.originNode;
  };

  // Helper to determine if a time is within doctor's available slots
  const isTimeAvailable = (time: Dayjs) => {
    if (!availability || !form.appointmentDate) return true;
    const dayName = form.appointmentDate.format("dddd");
    const dateStr = form.appointmentDate.format("YYYY-MM-DD");
    const daySchedule = availability.schedules?.[dayName];
    if (!Array.isArray(daySchedule)) return false;

    const timeStr = time.format("HH:mm");

    // Check if within working hours
    const isWorking = daySchedule.some((slot: any) => {
      return timeStr >= slot.from && timeStr <= slot.to;
    });
    if (!isWorking) return false;

    // Check if booked
    const isBooked = availability.appointments?.some((a: any) => {
      return (
        dayjs(a.start).format("YYYY-MM-DD") === dateStr &&
        dayjs(a.start).format("HH:mm") === timeStr
      );
    });

    return !isBooked;
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
          <div className="col-lg-12">
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
                          {!isPatientRole && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0 px-2 fs-12"
                              style={{ height: '22px' }}
                              onClick={() => setShowAddPatient(true)}
                            >
                              <i className="ti ti-plus me-1" />
                              Add New
                            </button>
                          )}
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
                            cellRender={cellRender}
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
                            className={`form-control w-100 ${form.appointmentTime && isTimeAvailable(form.appointmentTime) ? 'border-success' : ''}`}
                            use12Hours
                            format="hh:mm A"
                            value={form.appointmentTime}
                            status={form.appointmentTime && !isTimeAvailable(form.appointmentTime) ? 'warning' : undefined}
                            onChange={(t: Dayjs | null) =>
                              setForm((f) => ({ ...f, appointmentTime: t }))
                            }
                            getPopupContainer={getModalContainer}
                          />
                          <span className="input-icon-addon">
                            <i className={`ti ti-clock ${form.appointmentTime && isTimeAvailable(form.appointmentTime) ? 'text-success' : 'text-gray-7'}`} />
                          </span>
                        </div>
                        {form.appointmentTime && !isTimeAvailable(form.appointmentTime) && (
                          <div className="text-warning fs-12 mt-1">
                            <i className="ti ti-alert-triangle me-1" />
                            Doctor may not be available at this time.
                          </div>
                        )}
                        {form.appointmentTime && isTimeAvailable(form.appointmentTime) && (
                          <div className="text-success fs-12 mt-1">
                            <i className="ti ti-check me-1" />
                            Doctor is available.
                          </div>
                        )}

                        {availability && availability.schedules && form.appointmentDate && (
                          <div className="mb-2">
                            {availability.schedules[form.appointmentDate.format("dddd")]?.map((s: any, idx: number) => (
                              <span key={idx} className="badge badge-soft-info me-2 p-2 border border-info mb-2 fs-11">
                                <i className="ti ti-info-circle me-1" />
                                {s.label || (idx === 0 ? "Session 1" : "Session 2")}: {dayjs(s.from, "HH:mm").format("hh:mm A")} - {dayjs(s.to, "HH:mm").format("hh:mm A")}
                              </span>
                            ))}
                          </div>
                        )}

                        {availableSlots.length > 0 && (
                          <div className="mt-3">
                            <label className="form-label mb-2 fw-medium fs-13">Available Slots on {form.appointmentDate?.format("DD MMM")}</label>
                            <div className="d-flex flex-wrap gap-2">
                              {availableSlots.map((slot, i) => {
                                const isSelected = form.appointmentTime?.format("HH:mm") === slot.from;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    className={`btn btn-sm ${slot.isBooked ? 'btn-danger' : isSelected ? 'btn-success' : 'btn-outline-success'} py-1 px-2 fs-12`}
                                    disabled={slot.isBooked}
                                    onClick={() => setForm(f => ({ ...f, appointmentTime: dayjs(slot.from, "HH:mm") }))}
                                    title={slot.isBooked ? "This slot is already booked" : "Click to select"}
                                  >
                                    <i className={`ti ${slot.isBooked ? 'ti-lock' : 'ti-clock'} me-1`} />
                                    {slot.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {form.doctorId && form.appointmentDate && availableSlots.length === 0 && !optionsLoading && (
                          <div className="alert alert-soft-danger py-2 px-3 fs-12 mt-3">
                            <i className="ti ti-alert-circle me-1" />
                            No active schedule slots found for this doctor on this day.
                          </div>
                        )}
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

                  <div className="mb-0">
                    <label className="form-label mb-1 fw-medium">
                      Status<span className="text-danger ms-1">*</span>
                    </label>
                    <CommonSelect
                      options={APPOINTMENT_STATUS_OPTIONS}
                      className="select"
                      isDisabled={isPatientRole}
                      value={findSelectOption(
                        APPOINTMENT_STATUS_OPTIONS,
                        isPatientRole ? "Schedule" : form.status
                      )}
                      onChange={(opt) =>
                        setForm((f) => ({ ...f, status: opt?.value || "Schedule" }))
                      }
                    />
                    <div className="mt-3 p-2 bg-light rounded border">
                      <div className="d-flex flex-wrap gap-3 fs-12">
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}></span>
                          Available
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}></span>
                          On Leave
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}></span>
                          Holiday
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }}></span>
                          Weekly Off
                        </div>
                      </div>
                    </div>
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
