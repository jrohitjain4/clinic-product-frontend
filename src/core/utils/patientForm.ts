import type { ClinicPatient } from "../types/clinicPatient";

export const statusToLabel = (status: string) =>
  status === "Active" ? "Available" : "Unavailable";

export const labelToStatus = (label: string) =>
  label === "Unavailable" || label === "Inactive" ? "Inactive" : "Active";

export const PATIENT_STATUS_OPTIONS = [
  { value: "Active", label: "Available" },
  { value: "Inactive", label: "Unavailable" },
];

export const formatPatientDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const formatPatientDateLong = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const patientToTableRow = (p: ClinicPatient, index: number) => {
  const placeholders = [
    "user-08.jpg",
    "user-16.jpg",
    "user-06.jpg",
    "user-25.jpg",
    "user-39.jpg",
  ];
  const img =
    p.profileImage ||
    `assets/img/users/${placeholders[index % placeholders.length]}`;

  return {
    key: p.id,
    Patient: p.fullName || `${p.firstName} ${p.lastName}`,
    Gender: p.ageGenderLabel || "—",
    Patient_img: img,
    Phone: p.phone || "—",
    Address: p.addressShort || "—",
    Last_Visit: p.lastVisitLabel || "—",
    Status: p.statusLabel || statusToLabel(p.status),
    _raw: p,
  };
};

export const emptyPatientForm = () => ({
  firstName: "",
  middleName: "",
  lastName: "",
  status: "Active",
  profileImage: null as string | null,
  phone: "",
  alternateMobile: "",
  email: "",
  dob: null as import("dayjs").Dayjs | null,
  gender: "",
  bloodGroup: "",
  maritalStatus: "",
  occupation: "",
  aadhaarNumber: "",
  passportNumber: "",
  referredBy: "",

  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  address1: "",
  address2: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
});

// patientToForm is applied in patientFormPage with dayjs()
