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
  clinicName?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientCode?: string | null;
    phone?: string | null;
    dob?: string | null;
    gender?: string | null;
    bloodGroup?: string | null;
    profileImage?: string | null;
  };
  doctor: {
    id: string;
    fullName: string;
    profileImage?: string | null;
    appointmentDuration?: number | null;
    yearOfExperience?: number | null;
    followUpEnabled: boolean;
    followUpValidityDays?: number | null;
    freeFollowUpLimit?: number | null;
    followUpFee?: number | null;
    designation?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
  };
  department?: { id: string; name: string } | null;
  parentAppointmentId?: string | null;
  parentAppointment?: {
    id: string;
    appointmentCode?: string | null;
    scheduledAt: string;
    status: string;
  } | null;
  followUps?: {
    id: string;
    appointmentCode?: string | null;
    scheduledAt: string;
    status: string;
    followUpPaymentStatus?: string | null;
    reason?: string | null;
  }[];
  isFollowUp?: boolean;
  followUpStatus?: string | null;
  paymentStatus?: string | null;
  followUpPaymentStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  serviceIds?: string[];
  clinic?: {
    id: string;
    name: string;
    landingPage?: {
      id: string;
      logo?: string | null;
      address?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
}
