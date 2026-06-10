import type { ClinicAppointment } from "../types/clinicAppointment";

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "Schedule", label: "Schedule" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Checked In", label: "Checked In" },
  { value: "Checked Out", label: "Checked Out" },
  { value: "Cancelled", label: "Cancelled" },
];

export const APPOINTMENT_TYPE_OPTIONS = [
  { value: "Online Consultation", label: "Online Consultation" },
  { value: "Offline Consultation", label: "Offline Consultation" },
  { value: "Both", label: "Both" },
];

export const statusBadgeClass = (status: string) => {
  if (status === "Checked Out") return "badge-soft-info text-info";
  if (status === "Checked In") return "badge-soft-warning text-warning";
  if (status === "Cancelled") return "badge-soft-danger text-danger";
  if (status === "Schedule") return "badge-soft-primary text-primary";
  if (status === "Follow-up") return "badge-soft-success text-success";
  return "badge-soft-success text-success";
};

export const appointmentToTableRow = (a: ClinicAppointment, index: number) => {
  const isInvalidImage = (img?: string | null) =>
    !img || img.trim() === "" || img.includes("300x300") || img.includes("placeholder");

  const patientImg = isInvalidImage(a.patient.profileImage)
    ? "assets/img/patient-placeholder.png"
    : a.patient.profileImage!;

  const doctorImg = isInvalidImage(a.doctor.profileImage)
    ? "assets/img/doctor-placeholder.png"
    : a.doctor.profileImage!;

  return {
    key: a.id,
    Date_Time: a.dateTimeLabel || "—",
    Patient: a.patientName || `${a.patient.firstName} ${a.patient.lastName}`,
    Phone: a.patient.phone || "—",
    Patient_Image: patientImg,
    Doctor_Image: doctorImg,
    Doctor: a.doctorName || a.doctor.fullName,
    role: a.doctorRole || a.doctor.designation?.name || "—",
    Mode: a.mode,
    Status: a.status,
    Code: a.appointmentCode || "—",
    _raw: a,
  };
};

export const emptyAppointmentForm = () => ({
  patientId: "",
  doctorId: "",
  departmentId: "",
  appointmentDate: null as import("dayjs").Dayjs | null,
  appointmentTime: null as import("dayjs").Dayjs | null,
  appointmentType: "Offline Consultation",
  status: "Schedule",
  reason: "",
  isFollowUp: false,
  followUpStatus: "Paid Follow-up",
  paymentStatus: "Unpaid",
  parentAppointmentId: "",
});

export const formatAppointmentDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const formatAppointmentTimeRange = (
  startIso?: string | null,
  endIso?: string | null
) => {
  if (!startIso) return "—";
  const start = new Date(startIso);
  const startStr = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (!endIso) return startStr;
  const end = new Date(endIso);
  const endStr = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${startStr} - ${endStr}`;
};
