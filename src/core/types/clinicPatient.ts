export interface ClinicPatient {
  id: string;
  patientCode?: string | null;
  firstName: string;
  lastName: string;
  fullName?: string;
  profileImage?: string | null;
  phone?: string | null;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  status: string;
  statusLabel?: string;
  ageGenderLabel?: string;
  address1?: string | null;
  address2?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  addressShort?: string;
  fullAddress?: string;
  primaryDoctorId?: string | null;
  primaryDoctor?: {
    id: string;
    fullName: string;
    profileImage?: string | null;
    designation?: { id: string; name: string } | null;
  } | null;
  lastVisitedAt?: string | null;
  lastVisitLabel?: string;
  vitals?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}
