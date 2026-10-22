/**
 * Map clear field labels/keys → Tabler icon class (without "ti " prefix).
 * Unknown / unclear fields → undefined (no icon).
 */
const FIELD_ICON_MAP: Record<string, string> = {
  // names
  firstname: "ti-user",
  "first name": "ti-user",
  lastname: "ti-user",
  "last name": "ti-user",
  fullname: "ti-user",
  "full name": "ti-user",
  name: "ti-user",
  username: "ti-user",
  patient: "ti-user",
  doctor: "ti-stethoscope",
  "associate doctors": "ti-stethoscope",
  doctors: "ti-stethoscope",
  staff: "ti-user",
  nurse: "ti-user",

  // contact
  phone: "ti-phone",
  "phone number": "ti-phone",
  mobile: "ti-phone",
  "mobile number": "ti-device-mobile",
  telephone: "ti-phone",
  email: "ti-mail",
  "email address": "ti-mail",
  "email id": "ti-mail",

  // dates / time
  dob: "ti-calendar",
  "date of birth": "ti-calendar",
  date: "ti-calendar",
  "start date": "ti-calendar",
  "end date": "ti-calendar",
  "due date": "ti-calendar",
  "invoice date": "ti-calendar",
  "joining date": "ti-calendar",
  "leave date": "ti-calendar",
  "from date": "ti-calendar",
  "to date": "ti-calendar",
  time: "ti-clock",
  "start time": "ti-clock",
  "end time": "ti-clock",

  // medical
  "blood group": "ti-droplet",
  bloodgroup: "ti-droplet",
  gender: "ti-gender-male",
  status: "ti-checkup-list",
  specialization: "ti-certificate",
  department: "ti-building-hospital",
  designation: "ti-id-badge-2",
  diagnosis: "ti-stethoscope",
  medicine: "ti-pill",
  dosage: "ti-pill",
  prescription: "ti-prescription",

  // address
  address: "ti-home",
  "address 1": "ti-home",
  address1: "ti-home",
  "address line 1": "ti-home",
  "address 2": "ti-building",
  address2: "ti-building",
  "address line 2": "ti-building",
  country: "ti-world",
  state: "ti-map",
  city: "ti-building-skyscraper",
  pincode: "ti-mailbox",
  "pin code": "ti-mailbox",
  zip: "ti-mailbox",
  "zip code": "ti-mailbox",
  location: "ti-map-pin",

  // finance
  amount: "ti-currency-rupee",
  price: "ti-currency-rupee",
  salary: "ti-currency-rupee",
  payment: "ti-credit-card",
  "payment method": "ti-credit-card",
  bank: "ti-building-bank",
  "account number": "ti-credit-card",
  "tax rate": "ti-receipt-tax",
  currency: "ti-coin",
  invoice: "ti-file-invoice",

  // auth / security
  password: "ti-lock",
  "current password": "ti-lock",
  "new password": "ti-lock",
  "confirm password": "ti-lock",
  otp: "ti-key",

  // misc clear fields
  search: "ti-search",
  title: "ti-heading",
  subject: "ti-mail",
  description: "ti-file-description",
  notes: "ti-notes",
  message: "ti-message",
  comment: "ti-message",
  category: "ti-category",
  company: "ti-building",
  organization: "ti-building",
  website: "ti-world",
  url: "ti-link",
  file: "ti-paperclip",
  upload: "ti-upload",
  quantity: "ti-numbers",
  qty: "ti-numbers",
  age: "ti-calendar",
  holiday: "ti-calendar-event",
  "leave type": "ti-calendar-off",
  ward: "ti-building-hospital",
  bed: "ti-bed",
  ticket: "ti-ticket",
  announcement: "ti-speakerphone",
  package: "ti-package",
  service: "ti-medical-cross",
  role: "ti-shield",
  permission: "ti-lock-access",
};

function normalizeKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[*：:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns Tabler icon class like "ti ti-home", or undefined if unknown. */
export function getFieldIcon(labelOrKey: string | undefined | null): string | undefined {
  if (!labelOrKey) return undefined;
  const key = normalizeKey(labelOrKey);
  const icon = FIELD_ICON_MAP[key];
  if (!icon) return undefined;
  return icon.startsWith("ti ") ? icon : `ti ${icon}`;
}

export default FIELD_ICON_MAP;
