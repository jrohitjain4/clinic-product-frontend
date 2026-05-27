export interface ClinicAppointment {
  id: string;
  appointmentCode?: string | null;
  scheduledAt: string;
  endAt?: string | null;
  dateTimeLabel?: string;
  mode: string;
  appointmentType?: string | null;
  status: string;
  reason?: string | null;
  location?: string | null;
  patientId: string;
  doctorId: string;
  departmentId?: string | null;
  patientName?: string;
  doctorName?: string;
  doctorRole?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    profileImage?: string | null;
  };
  doctor: {
    id: string;
    fullName: string;
    profileImage?: string | null;
    appointmentDuration?: number | null;
    designation?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
  };
  department?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}
