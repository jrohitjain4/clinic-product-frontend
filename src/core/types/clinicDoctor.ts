export interface ClinicDoctor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  consultationCharge?: number | null;
  profileImage?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
}
