export interface ClinicStaff {
  id: string;
  staffCode?: string | null;
  fullName: string;
  role: string;
  profileImage?: string | null;
  phone?: string | null;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address1?: string | null;
  address2?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  dateOfJoining?: string | null;
  status: string;
  statusLabel?: string;
  designationId?: string | null;
  departmentId?: string | null;
  designation?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffFormPayload {
  fullName: string;
  role: string;
  designationId: string;
  profileImage?: string | null;
  phone?: string;
  email?: string;
  dob?: string | null;
  gender?: string;
  bloodGroup?: string;
  address1?: string;
  address2?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  status?: string;
}
