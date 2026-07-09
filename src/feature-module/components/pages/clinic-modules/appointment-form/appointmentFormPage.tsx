import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { all_routes } from "../../../../routes/all_routes";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { apiUrl } from "../../../../../core/config/api";
import { useClinicAppointment } from "../../../../../core/hooks/useClinicAppointment";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicDepartments } from "../../../../../core/hooks/useClinicDepartments";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
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
  mode?: "create" | "edit";
  isModal?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  preSelectedDoctorId?: string;
  preSelectedDepartmentId?: string;
}

const AppointmentFormPage = ({ mode = "create", isModal = false, onSuccess, onCancel, onClose, preSelectedDoctorId, preSelectedDepartmentId }: AppointmentFormPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get("patientId") || "";
  const prefillDoctorId = preSelectedDoctorId || searchParams.get("doctorId") || "";
  const prefillDeptId = preSelectedDepartmentId || searchParams.get("departmentId") || "";

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
  const { services } = useClinicServices();

  const [form, setForm] = useState({
    ...emptyAppointmentForm(),
    serviceIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isSessionMode, setIsSessionMode] = useState(false);
  const [showSlotsDropdown, setShowSlotsDropdown] = useState(false);
  const [isSlotsDropdownFocused, setIsSlotsDropdownFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSlotsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [availability, setAvailability] = useState<{
    schedules: any;
    duration?: number;
    maxBookingsPerSlot?: number;
    holidays: any[];
    leaves: any[];
    appointments: any[];
    clinicWorkingDays?: number[];
    clinicSchedules?: any[];
  } | null>(null);

  const loadError = patientsError || doctorsError || deptsError;
  const optionsLoading = loadingPatients || loadingDoctors || loadingDepts;

  const serviceOptions = useMemo(() => {
    return services.filter(s => s.status === "Active").map(s => ({
      value: s.id,
      label: `${s.serviceName} (₹${s.price || 0})${s.duration ? ` - ${s.duration}` : ''}`,
    }));
  }, [services]);

  const selectedDoctor = useMemo(() => {
    if (!form.doctorId || !doctors) return null;
    return doctors.find((d: any) => d.id === form.doctorId);
  }, [form.doctorId, doctors]);

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
      setForm((f) => ({
        ...f,
        patientId: targetId || f.patientId,
        doctorId: prefillDoctorId || f.doctorId,
        departmentId: prefillDeptId || f.departmentId,
      }));
    }
  }, [mode, prefillPatientId, prefillDoctorId, prefillDeptId, isPatientRole, currentUser?.email, patients]);

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
        isFollowUp: appointment.isFollowUp || false,
        followUpStatus: appointment.followUpStatus || "Free Follow-up",
        paymentStatus: appointment.paymentStatus || "Free",
        parentAppointmentId: appointment.parentAppointmentId || "",
        serviceIds: appointment.serviceIds || [],
      });
      if (appointment.isFollowUp) {
        setShowFollowUp(true);
      }
      if (appointment.serviceIds && appointment.serviceIds.length > 0) {
        setIsSessionMode(true);
      } else {
        setIsSessionMode(false);
      }
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

  // ── Build session options for the Shift/Session dropdown ────────
  const sessionOptions = useMemo(() => {
    if (!availability || !form.appointmentDate) return [];
    const dayName = form.appointmentDate.format("dddd");
    const daySchedule = availability.schedules?.[dayName];
    if (!Array.isArray(daySchedule) || daySchedule.length === 0) return [];

    return daySchedule.map((session: any, idx: number) => {
      const sessionLabel = session.label || (idx === 0 ? "Morning Session" : idx === 1 ? "Evening Session" : `Session ${idx + 1}`);
      const fromFormatted = dayjs(session.from, "HH:mm").format("hh:mm A");
      const toFormatted = dayjs(session.to, "HH:mm").format("hh:mm A");

      const isTwentyFourSeven = 
        session.session === "24 Hours Available" || 
        session.label === "24 Hours Available" ||
        (session.from === "00:00:00" && session.to === "23:59:00") ||
        (session.from === "00:00" && session.to === "23:59") ||
        (session.from === "00:00:00" && session.to === "23:59:59") ||
        (session.from === "00:00" && session.to === "23:59:59");

      return {
        value: session.from,
        label: isTwentyFourSeven 
          ? "24 Hours Available" 
          : `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
      };
    });
  }, [availability, form.appointmentDate]);

  const isSlotBookingActive = useMemo(() => {
    return !!(
      availability &&
      availability.duration &&
      availability.duration > 0 &&
      availability.maxBookingsPerSlot &&
      availability.maxBookingsPerSlot > 0
    );
  }, [availability]);

  const slotOptions = useMemo(() => {
    if (!isSlotBookingActive || !availability || !form.appointmentDate) return [];
    const dayName = form.appointmentDate.format("dddd");
    const dateStr = form.appointmentDate.format("YYYY-MM-DD");
    const daySchedule = availability.schedules?.[dayName];
    if (!Array.isArray(daySchedule)) return [];

    const duration = availability.duration || 30;
    const maxBookings = availability.maxBookingsPerSlot || 1;
    const slots: any[] = [];

    daySchedule.forEach((session: any) => {
      let currentSlot = dayjs(session.from, "HH:mm");
      const sessionEnd = dayjs(session.to, "HH:mm");

      while (currentSlot.isBefore(sessionEnd)) {
        const slotTime = currentSlot.format("HH:mm");
        const bookedCount = availability.appointments?.filter((a: any) => {
          if (mode === "edit" && appointment?.id && a.id === appointment.id) {
            return false;
          }
          return (
            dayjs(a.start).format("YYYY-MM-DD") === dateStr &&
            dayjs(a.start).format("HH:mm") === slotTime
          );
        }).length || 0;

        const bookingsAvailable = Math.max(0, maxBookings - bookedCount);

        slots.push({
          value: slotTime,
          label: `${currentSlot.format("hh:mm A")} (${bookingsAvailable} slots remaining)`,
          bookingsAvailable,
          bookedCount,
          maxBookings,
          isDisabled: bookingsAvailable <= 0,
        });

        currentSlot = currentSlot.add(duration, "minute");
      }
    });

    return slots;
  }, [isSlotBookingActive, availability, form.appointmentDate, mode, appointment?.id]);

  // ── Auto-check for Follow-up status ────────────────────────────
  useEffect(() => {
    if (mode === "create" && form.patientId && form.doctorId && form.appointmentDate) {
      let scheduledAt = buildScheduledAt();
      if (!scheduledAt) {
        // Use noon of the selected date as a safe fallback for checking range
        scheduledAt = form.appointmentDate.hour(12).minute(0).second(0).toISOString();
      }

      const query = new URLSearchParams();
      query.append("patientId", form.patientId);
      query.append("doctorId", form.doctorId);
      query.append("date", scheduledAt);

      fetch(apiUrl(`/api/appointments/check-followup?${query.toString()}`), {
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.isFollowup) {
            setShowFollowUp(true);
            setFollowUpCount(data.existingCount || 0);
            setForm((f) => ({
              ...f,
              isFollowUp: false, // Default to OFF as requested by user
              parentAppointmentId: data.lastApptId,
              followUpStatus: data.recommendedStatus || "Free Follow-up",
              paymentStatus: data.recommendedPayment || "Free"
            }));
          } else {
            setShowFollowUp(false);
            setFollowUpCount(0);
            setForm((f) => ({ ...f, isFollowUp: false, parentAppointmentId: "" }));
          }
        })
        .catch(console.error);
    } else if (mode === "create") {
      // Hide if patient, doctor or date is missing
      setShowFollowUp(false);
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
      patient: p,
    }));
  }, [patients, isPatientRole, currentUser?.email]);

  const filterPatient = (option: any, inputValue: string) => {
    if (!inputValue) return true;
    const input = inputValue.toLowerCase();
    const p = option.data.patient;
    if (!p) return option.label.toLowerCase().includes(input);

    return (
      (p.fullName || "").toLowerCase().includes(input) ||
      (p.firstName || "").toLowerCase().includes(input) ||
      (p.lastName || "").toLowerCase().includes(input) ||
      (p.phone || "").toLowerCase().includes(input) ||
      (p.alternateMobile || "").toLowerCase().includes(input) ||
      (p.emergencyContactPhone || "").toLowerCase().includes(input) ||
      (p.patientCode || "").toLowerCase().includes(input)
    );
  };

  const formatPatientLabel = (option: any, meta?: any) => {
    const p = option.patient;
    if (!p) return option.label;
    const isMenu = meta?.context === "menu";
    return (
      <div className="d-flex flex-column" style={{ lineHeight: '1.2' }}>
        <span className="fw-bold fs-14" style={{ color: 'inherit' }}>{option.label}</span>
        <div className="d-flex align-items-center gap-2 mt-1">
          {p.patientCode && (
            <span className="badge border-0 px-1 py-0 fs-10" style={{
              backgroundColor: isMenu ? 'rgba(255,255,255,0.2)' : 'rgba(101,113,255,0.12)',
              color: 'inherit',
            }}>
              {p.patientCode}
            </span>
          )}
          {p.phone && (
            <span className="fs-11" style={{ color: 'inherit', opacity: 0.85 }}>
              <i className="ti ti-device-mobile me-1" />{p.phone}
            </span>
          )}
        </div>
      </div>
    );
  };

  const doctorOptions = useMemo(() => {
    let list = doctors.filter((d: any) => d.id && d.status === "Active");
    if (form.departmentId) {
      list = list.filter(
        (d: any) =>
          (d as { departmentId?: string }).departmentId === form.departmentId ||
          d.department?.id === form.departmentId
      );
    }
    return list.map((d: any) => ({
      value: d.id,
      label: d.fullName,
      doctor: d,
    }));
  }, [doctors, form.departmentId]);

  const filterDoctor = (option: any, inputValue: string) => {
    if (!inputValue) return true;
    const input = inputValue.toLowerCase();
    const d = option.data.doctor;
    if (!d) return option.label.toLowerCase().includes(input);

    return (
      (d.fullName || "").toLowerCase().includes(input) ||
      (d.phone || "").toLowerCase().includes(input) ||
      (d.email || "").toLowerCase().includes(input)
    );
  };

  const formatDoctorLabel = (option: any) => {
    const d = option.doctor;
    if (!d) return option.label;
    return (
      <div className="d-flex flex-column" style={{ lineHeight: '1.2' }}>
        <span className="fw-bold fs-14" style={{ color: 'inherit' }}>{option.label}</span>
        <div className="d-flex align-items-center gap-2 mt-1">
          <span className="fs-11" style={{ color: 'inherit', opacity: 0.85 }}>
            {d.department?.name || "—"} · {d.designation?.name || "Doctor"}
          </span>
          {d.phone && (
            <span className="fs-11" style={{ color: 'inherit', opacity: 0.85 }}>
              <i className="ti ti-device-mobile me-1" />
              {d.phone}
            </span>
          )}
        </div>
      </div>
    );
  };

  const formatSlotLabel = (option: any, { context }: { context: 'menu' | 'value' }) => {
    if (option.bookingsAvailable === undefined) return option.label;

    const slotTimeFormatted = dayjs(option.value, "HH:mm").format("hh:mm A");
    const { bookingsAvailable } = option;

    if (context === "value") {
      let badgeColor = "success";
      let bgLightColor = "#ecfdf5";
      let textColor = "#10b981";
      if (bookingsAvailable === 0) {
        badgeColor = "danger";
        bgLightColor = "#fef2f2";
        textColor = "#ef4444";
      } else if (bookingsAvailable === 1) {
        badgeColor = "warning";
        bgLightColor = "#fff7ed";
        textColor = "#f97316";
      }
      return (
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">{slotTimeFormatted}</span>
          <span 
            className={`badge bg-soft-${badgeColor} text-${badgeColor} px-2 py-0.5 fs-11`}
            style={{ borderRadius: "4px", backgroundColor: bgLightColor, color: textColor }}
          >
            {bookingsAvailable === 0 
              ? "Filled" 
              : bookingsAvailable === 1 
                ? "Last Slot Left" 
                : `${bookingsAvailable} slots remaining`}
          </span>
        </div>
      );
    }

    let dotColor = "#10b981"; // green dot
    let badgeColor = "success";
    let bgLightColor = "#ecfdf5";
    let textColor = "#10b981";
    let statusText = `${bookingsAvailable} slots remaining`;

    if (bookingsAvailable === 0) {
      dotColor = "#ef4444"; // red dot
      badgeColor = "danger";
      bgLightColor = "#fef2f2";
      textColor = "#ef4444";
      statusText = "Filled";
    } else if (bookingsAvailable === 1) {
      dotColor = "#f97316"; // orange dot
      badgeColor = "warning";
      bgLightColor = "#fff7ed";
      textColor = "#f97316";
      statusText = "Last Slot Left";
    }

    return (
      <div className="d-flex align-items-center justify-content-between py-1 w-100" style={{ color: 'inherit' }}>
        <div className="d-flex align-items-center gap-2">
          <span 
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dotColor,
            }}
          />
          <span className="fw-semibold fs-14">{slotTimeFormatted}</span>
        </div>
        <span 
          className={`badge bg-soft-${badgeColor} text-${badgeColor} px-2 py-1 fs-11 fw-semibold`}
          style={{ borderRadius: "6px", backgroundColor: bgLightColor, color: textColor }}
        >
          {statusText}
        </span>
      </div>
    );
  };

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
          isFollowUp: form.isFollowUp,
          followUpStatus: form.isFollowUp ? form.followUpStatus : null,
          paymentStatus: form.isFollowUp ? form.paymentStatus : null,
          parentAppointmentId: form.isFollowUp ? form.parentAppointmentId : null,
          serviceIds: isSessionMode ? form.serviceIds : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save appointment");
      }

      toast.success(mode === "create" ? "Appointment created successfully!" : "Appointment updated successfully!");
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        navigate(isPatientRole ? all_routes.patientappointments : all_routes.appointments, { replace: true });
      }
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
    const isHoliday = availability.holidays?.some((h) => {
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

    // 2. Clinic Off Day (Orange/Red) - Clinic is closed
    const clinicOffDays = availability.clinicWorkingDays || [0];
    const dayOfWeek = current.day();
    if (clinicOffDays.includes(dayOfWeek)) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', color: '#d46b08' }}>
          {current.date()}
        </div>
      );
    }

    const daySchedule = availability.schedules?.[dayName];
    const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;

    // 3. Doctor Weekly Off (Red) - Clinic open but doctor not here
    if (!isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', color: '#a8071a' }}>
          {current.date()}
        </div>
      );
    }

    // 3. Leave (Yellow)
    const isLeave = availability.leaves?.some((l) => {
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


  if (mode === "edit" && loadingAppt) {
    return isModal ? (
      <div className="text-center py-5">
        <span className="spinner-border text-primary" role="status" />
      </div>
    ) : (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className={isModal ? "" : "card"}>
        <div className={isModal ? "" : "card-body"}>
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
                  {!isPatientRole && mode !== "edit" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-compact"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => setShowAddPatient(true)}
                    >
                      Add New <i className="ti ti-plus ms-1" />
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
                  filterOption={filterPatient}
                  formatOptionLabel={formatPatientLabel}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label mb-1 fw-medium">
                  Department (Optional)
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
                  isDisabled={optionsLoading || deptOptions.length === 0 || !!preSelectedDepartmentId}
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
                  isDisabled={optionsLoading || doctorOptions.length === 0 || !!preSelectedDoctorId}
                  onChange={(opt) =>
                    setForm((f) => ({ ...f, doctorId: opt?.value || "", appointmentTime: null }))
                  }
                  filterOption={filterDoctor}
                  formatOptionLabel={formatDoctorLabel}
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
                      setForm((f) => ({ ...f, appointmentDate: d, appointmentTime: null }))
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
                {isSlotBookingActive ? (
                  <div className="position-relative" ref={dropdownRef}>
                    <label className="form-label mb-1 fw-medium">
                      Shift / Session<span className="text-danger ms-1">*</span>
                    </label>
                    <div
                      onClick={() => {
                        if (form.appointmentDate && slotOptions.length > 0) {
                          setShowSlotsDropdown(!showSlotsDropdown);
                        }
                      }}
                      onFocus={() => setIsSlotsDropdownFocused(true)}
                      onBlur={() => setIsSlotsDropdownFocused(false)}
                      tabIndex={0}
                      className="form-control d-flex align-items-center justify-content-between"
                      style={{
                        minHeight: "46px",
                        borderRadius: "12px",
                        border: isSlotsDropdownFocused || showSlotsDropdown ? "1.5px solid #2e37a4" : "1.5px solid #cbd5e1",
                        boxShadow: isSlotsDropdownFocused || showSlotsDropdown ? "0 0 0 1px #2e37a4" : "none",
                        fontSize: "15px",
                        fontWeight: "500",
                        padding: "8px 16px",
                        cursor: !form.appointmentDate || slotOptions.length === 0 ? "not-allowed" : "pointer",
                        backgroundColor: !form.appointmentDate || slotOptions.length === 0 ? "#f8fafc" : "white",
                        transition: "all 0.2s ease-in-out",
                        outline: "none",
                      }}
                    >
                      <span className={form.appointmentTime ? "text-dark fw-semibold" : "text-muted"}>
                        {!form.appointmentDate
                          ? "Select date first"
                          : slotOptions.length === 0
                            ? "No slots available on this day"
                            : form.appointmentTime
                              ? form.appointmentTime.format("hh:mm A")
                              : "Select slot"}
                      </span>
                      <i className={`ti ti-chevron-${showSlotsDropdown ? 'up' : 'down'} text-secondary`} style={{ fontSize: "12px" }} />
                    </div>

                    {showSlotsDropdown && form.appointmentDate && slotOptions.length > 0 && (
                      <div
                        className="position-absolute w-100 mt-1 p-3 border rounded shadow bg-white"
                        style={{
                          zIndex: 1050,
                          borderRadius: "12px",
                          borderColor: "#cbd5e1",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                          <span className="small text-muted fw-bold">AVAILABLE SLOTS</span>
                          <span className="badge bg-soft-primary text-primary px-2 py-0.5 rounded-pill fs-11" style={{ backgroundColor: "#eef2ff", color: "#6366f1" }}>
                            {slotOptions.length} Options
                          </span>
                        </div>
                        <div 
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                            gap: "8px",
                          }}
                        >
                          <style>{`
                            .select-slot-block {
                              transition: all 0.2s ease-in-out;
                            }
                            .select-slot-block:hover:not(.filled) {
                              transform: translateY(-2px);
                              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            }
                          `}</style>
                          {slotOptions.map((opt: any, idx: number) => {
                            const isSelected = form.appointmentTime?.format("HH:mm") === opt.value;
                            const isFilled = opt.bookingsAvailable === 0;
                            const isLastSlot = opt.bookingsAvailable === 1;

                            let bg = "#ecfdf5"; // available
                            let border = "#a7f3d0";
                            let text = "#047857";
                            let badgeText = `${opt.bookingsAvailable} Left`;

                            if (isFilled) {
                              bg = "#fef2f2";
                              border = "#fca5a5";
                              text = "#ef4444";
                              badgeText = "Filled";
                            } else if (isLastSlot) {
                              bg = "#fff7ed";
                              border = "#fdba74";
                              text = "#f97316";
                              badgeText = "Last Slot";
                            }

                            if (isSelected) {
                              bg = "#2e37a4";
                              border = "#2e37a4";
                              text = "#ffffff";
                            }

                            return (
                              <div
                                key={opt.value || idx}
                                onClick={() => {
                                  if (isFilled) {
                                    toast.warning("This slot is already filled.");
                                    return;
                                  }
                                  setForm(f => ({ ...f, appointmentTime: dayjs(opt.value, "HH:mm") }));
                                  setShowSlotsDropdown(false);
                                }}
                                className={`text-center px-2 py-2 select-slot-block ${isFilled ? 'filled' : ''}`}
                                style={{
                                  borderRadius: "8px",
                                  border: `1px solid ${border}`,
                                  backgroundColor: bg,
                                  color: text,
                                  cursor: isFilled ? "not-allowed" : "pointer",
                                  opacity: isFilled && !isSelected ? 0.6 : 1,
                                }}
                              >
                                <div className="fw-bold" style={{ fontSize: "13px" }}>
                                  {dayjs(opt.value, "HH:mm").format("hh:mm A")}
                                </div>
                                <div className="fw-semibold mt-1" style={{ fontSize: "10px", opacity: 0.9 }}>
                                  {badgeText}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="form-label mb-1 fw-medium">
                      Shift / Session<span className="text-danger ms-1">*</span>
                    </label>
                    <CommonSelect
                      key={`session-${sessionOptions.length}-${form.appointmentDate?.toString()}-${form.doctorId}`}
                      options={sessionOptions}
                      className="select"
                      value={sessionOptions.find(opt => opt.value === form.appointmentTime?.format("HH:mm"))}
                      placeholder={
                        !form.appointmentDate
                          ? "Select date first"
                          : sessionOptions.length > 0 ? "Select session" : "No shifts available on this day"
                      }
                      isDisabled={!form.appointmentDate || sessionOptions.length === 0}
                      onChange={(opt: any) => {
                        if (opt?.value) {
                          setForm(f => ({ ...f, appointmentTime: dayjs(opt.value, "HH:mm") }));
                        }
                      }}
                    />
                    {form.appointmentTime && sessionOptions.length > 0 && (
                      <div className="text-success fs-12 mt-1">
                        <i className="ti ti-check me-1" />
                        Selected: {form.appointmentTime.format("hh:mm A")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label mb-1 fw-medium">
              Appointment Reason (Optional)
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

          {showFollowUp && (
            <div className="mb-4">
              <div className="p-3 rounded border" style={{ backgroundColor: form.isFollowUp ? '#f0f9ff' : '#f8f9fa', borderColor: form.isFollowUp ? '#bae6fd' : '#e2e8f0' }}>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="followUpToggle"
                    checked={form.isFollowUp}
                    onChange={(e) => setForm(f => ({ ...f, isFollowUp: e.target.checked }))}
                  />
                  <label className="form-check-label fw-bold" htmlFor="followUpToggle">
                    This is a Follow-up Appointment
                  </label>
                </div>
                {followUpCount > 0 && (
                  <div className="mt-2 text-primary fs-11 fw-medium opacity-75">
                    <i className="ti ti-info-circle me-1" />
                    This patient already has {followUpCount} follow-up visit(s) linked to this treatment.
                  </div>
                )}

                {form.isFollowUp && (
                  <div className="mt-3 pt-3 border-top border-info-subtle">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label mb-1 fs-12 fw-bold text-uppercase text-muted">Follow-up Type</label>
                        <div className="mt-1">
                          <span className={`badge ${form.followUpStatus.includes('Free') ? 'badge-soft-success' : 'badge-soft-info'} px-2 py-1 fs-12 w-100 text-start border`}>
                            <i className="ti ti-check-circle me-1" /> {form.followUpStatus}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label mb-1 fs-12 fw-bold text-uppercase text-muted">Payment Status</label>
                        <CommonSelect
                          options={[
                            { value: "Paid", label: "Paid" },
                            { value: "Free", label: "Free" },
                            { value: "Unpaid", label: "Unpaid" },
                          ]}
                          className="select select-sm"
                          value={{ value: form.paymentStatus, label: form.paymentStatus }}
                          onChange={(opt: any) => setForm(f => ({ ...f, paymentStatus: opt?.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}></span>
                  Clinic Closed
                </div>
                <div className="d-flex align-items-center">
                  <span className="d-inline-block rounded me-1" style={{ width: 12, height: 12, backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }}></span>
                  Dr. Off
                </div>
              </div>
            </div>
          </div>

          {isSessionMode && (
            <div className="mt-4 border-top pt-3">
              <label className="form-label mb-1 fw-bold text-primary fs-15">
                Select Services for Session <span className="text-danger ms-1">*</span>
              </label>
              <CommonSelect
                isMulti
                options={serviceOptions}
                className="select"
                value={serviceOptions.filter((opt: any) => form.serviceIds.includes(opt.value))}
                placeholder="Select one or more services"
                onChange={(opts: any) => {
                  const selectedIds = (opts || []).map((o: any) => o.value);
                  setForm(f => ({ ...f, serviceIds: selectedIds }));
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-end mt-3 align-items-center gap-2">
        {selectedDoctor && (
          <div className="d-flex align-items-center gap-2 me-2">
            <button
              type="button"
              className="btn btn-outline-info d-flex align-items-center gap-1.5 fw-bold cursor-default"
              style={{ pointerEvents: 'none', borderRadius: '8px' }}
            >
              <i className="ti ti-coin text-info fs-15" />
              <span>Fees: ₹{form.isFollowUp ? (selectedDoctor.followUpFee || 0) : (selectedDoctor.consultationCharge || 0)}</span>
              <span className="badge bg-info text-white ms-1 font-semibold fs-10" style={{ textTransform: 'capitalize' }}>
                {form.isFollowUp ? 'Follow-up' : 'Consultation'}
              </span>
            </button>
          </div>
        )}
        {isModal ? (
          <button type="button" className="btn btn-light" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <Link to={all_routes.appointments} className="btn btn-light">
            Cancel
          </Link>
        )}
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
  );

  if (isModal) {
    return (
      <div className="p-0">
        {mode === "create" && (
          <div className="mb-3 d-flex justify-content-center">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "9999px",
                padding: "4px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <button
                type="button"
                onClick={() => setIsSessionMode(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  border: "none",
                  outline: "none",
                  background: !isSessionMode
                    ? "linear-gradient(90deg, #2563eb, #3b82f6)"
                    : "transparent",
                  color: !isSessionMode ? "#ffffff" : "#475569",
                  boxShadow: !isSessionMode
                    ? "0 4px 12px rgba(37, 99, 235, 0.25)"
                    : "none",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M21 8a2 2 0 0 0 -2 -2h-3a2 2 0 0 0 -2 2v3a2 2 0 0 0 2 2h1l2 2v-2a2 2 0 0 0 1 -2z" />
                </svg>
                Consultation
              </button>
              <button
                type="button"
                onClick={() => setIsSessionMode(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  border: "none",
                  outline: "none",
                  background: isSessionMode
                    ? "linear-gradient(90deg, #2563eb, #3b82f6)"
                    : "transparent",
                  color: isSessionMode ? "#ffffff" : "#475569",
                  boxShadow: isSessionMode
                    ? "0 4px 12px rgba(37, 99, 235, 0.25)"
                    : "none",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M16 18h.01" />
                </svg>
                Session
              </button>
            </div>
          </div>
        )}
        {formContent}
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
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-lg-12">
            <div className="mb-4 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <Link to={all_routes.appointments} className="text-dark">
                  <i className="ti ti-chevron-left me-1" />
                  {isSessionMode ? "Session Appointment" : "Appointments"}
                </Link>
              </h6>
              {mode === "create" && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "9999px",
                    padding: "4px",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.04)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsSessionMode(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                      border: "none",
                      outline: "none",
                      background: !isSessionMode
                        ? "linear-gradient(90deg, #2563eb, #3b82f6)"
                        : "transparent",
                      color: !isSessionMode ? "#ffffff" : "#475569",
                      boxShadow: !isSessionMode
                        ? "0 4px 12px rgba(37, 99, 235, 0.25)"
                        : "none",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      <circle cx="10" cy="7" r="4" />
                      <path d="M21 8a2 2 0 0 0 -2 -2h-3a2 2 0 0 0 -2 2v3a2 2 0 0 0 2 2h1l2 2v-2a2 2 0 0 0 1 -2z" />
                    </svg>
                    Consultation Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSessionMode(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                      border: "none",
                      outline: "none",
                      background: isSessionMode
                        ? "linear-gradient(90deg, #2563eb, #3b82f6)"
                        : "transparent",
                      color: isSessionMode ? "#ffffff" : "#475569",
                      boxShadow: isSessionMode
                        ? "0 4px 12px rgba(37, 99, 235, 0.25)"
                        : "none",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <path d="M8 14h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 18h.01" />
                      <path d="M12 18h.01" />
                      <path d="M16 18h.01" />
                    </svg>
                    Session Appointment
                  </button>
                </div>
              )}
            </div>
            {formContent}
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
