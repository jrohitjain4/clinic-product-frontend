import type { ClinicStaff } from "../types/clinicStaff";

export const ROLE_OPTIONS = [
  { value: "Front Desk", label: "Front Desk" },
  { value: "Reception", label: "Reception" },
  { value: "Nurse", label: "Nurse" },
  { value: "Nurse Practitioner", label: "Nurse Practitioner" },
];

export const statusToLabel = (status: string) =>
  status === "Active" ? "Available" : "Unavailable";

export const STAFF_STATUS_OPTIONS = [
  { value: "Active", label: "Available" },
  { value: "Inactive", label: "Unavailable" },
];

/** Stops React Router <Link to="#"> from changing route / reloading the page */
export const preventHashLinkNav = (e: React.MouseEvent) => {
  e.preventDefault();
};

export const closeBootstrapModal = (modalId: string) => {
  const el = document.getElementById(modalId);
  if (!el) return;
  const closeBtn = el.querySelector(
    '[data-bs-dismiss="modal"]'
  ) as HTMLButtonElement | null;
  closeBtn?.click();
};

export const hideBootstrapModal = (modalId: string) => {
  const el = document.getElementById(modalId);
  if (!el) return;
  const bs = (
    window as unknown as {
      bootstrap?: {
        Modal: {
          getInstance: (e: Element) => { hide: () => void } | null;
          getOrCreateInstance?: (e: Element) => { hide: () => void };
        };
      };
    }
  ).bootstrap;
  if (!bs?.Modal) return;
  const instance =
    bs.Modal.getInstance(el) ?? bs.Modal.getOrCreateInstance?.(el);
  instance?.hide();
};

export const formatStaffDate = (iso?: string | null) => {
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

export const staffToTableRow = (s: ClinicStaff, index: number) => {
  const placeholders = [
    "user-08.jpg",
    "user-03.jpg",
    "user-04.jpg",
    "user-05.jpg",
    "user-06.jpg",
  ];
  const img =
    s.profileImage || `assets/img/users/${placeholders[index % placeholders.length]}`;
  return {
    key: s.id,
    Staff: s.fullName,
    Image: img,
    Designation: s.designation?.name || "—",
    Role: s.role,
    Phone: s.phone || "—",
    Email: s.email || "—",
    Status: statusToLabel(s.status),
    _raw: s,
  };
};

export const emptyStaffForm = () => ({
  fullName: "",
  role: "",
  status: "Active",
  designationId: "",
  profileImage: null as string | null,
  phone: "",
  email: "",
  dob: null as import("dayjs").Dayjs | null,
  gender: "",
  bloodGroup: "",
  address1: "",
  address2: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
});
