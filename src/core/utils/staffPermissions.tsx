import React, { useMemo } from "react";

/**
 * Staff Permission Utilities
 *
 * Permissions shape (stored in ClinicRole.permissions):
 * {
 *   "Doctors":    { "CREATE": true, "EDIT": false, "DELETE": false, "VIEW": true },
 *   "Patients":   { "VIEW": true },
 *   "Staffs":     { "CREATE": true, "VIEW": true, "EDIT": true, "DELETE": true },
 *   ...
 * }
 */

// ── Map each sidebar item label to the permission module key ────────────
const LABEL_TO_MODULE: Record<string, string> = {
    Dashboard: "Dashboard",
    Doctors: "Doctors",
    Patients: "Patients",
    Appointments: "Appointments",
    Consultations: "Consultations",
    "Services and Medicines": "Services",
    Services: "Services",
    specializations: "Services",

    // IPD
    "IPD Dashboard": "IPD Dashboard",
    "IPD Patient": "IPD Patient",
    Admission: "Admission",
    Inpatient: "Inpatient",
    Discharge: "Discharge",
    "Ward Management": "Ward Management",
    "Billings & Invoices": "IPD Billings & Invoices",
    "IPD Doctor": "IPD Doctor",
    "Treatment & Packages": "Treatment & Packages",

    // Diagnostic
    "Diagnostic Dashboard": "Diagnostic Dashboard",
    Category: "Category",
    "Diagnostic Test": "Diagnostic Test",
    "Diagnostic Booking": "Diagnostic Booking",
    "Invoice (Diagnostic)": "Invoice (Diagnostic)",

    // Pharmacy
    "Pharmacy Dashboard": "Pharmacy Dashboard",
    "Pharmacy Category": "Pharmacy Category",
    Medicine: "Medicine",
    Inventory: "Inventory",
    "Pharmacy Billing": "Pharmacy Billing",
    "Sales History": "Sales History",

    // HRM
    Staffs: "Staffs",
    Departments: "Departments",
    Designation: "Designation",
    Designations: "Designation",
    Attendance: "Attendance",
    Leaves: "Leaves",
    "Leave Type": "Leaves",
    Holidays: "Holidays",
    Payroll: "Payroll",
    Specializations: "Specializations",

    // Finance & Accounts
    Expenses: "Expenses",
    "Expense Category": "Expenses",
    Invoices: "Invoices",
    Transactions: "Transactions",

    // Therapy
    "Therapy Dashboard": "Therapy Dashboard",
    "Therapy Patients": "Therapy Patients",
    Therapists: "Therapists",
    Therapies: "Therapies",
    "Therapy Appointments": "Therapy Appointments",
    Consultancy: "Therapy Consultancy",
    "Therapy Consultancy": "Therapy Consultancy",
    Sessions: "Therapy Sessions",
    "Therapy Sessions": "Therapy Sessions",
    "Therapy Invoices": "Therapy Invoices",

    // Application & Support & Admin
    "To Do": "To Do",
    Notes: "Notes",
    Support: "Support",
    "Roles & Permissions": "Roles & Permissions",
    "Refer Sources": "Refer Sources",
};

// ── Map route pathnames to permission modules ──────────────────────────
const PATH_TO_MODULE: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/doctors": "Doctors",
    "/doctors-list": "Doctors",
    "/add-doctor": "Doctors",
    "/doctor-schedule": "Doctors",
    "/patients": "Patients",
    "/patients-grid": "Patients",
    "/create-patient": "Patients",
    "/appointments": "Appointments",
    "/new-appointment": "Appointments",
    "/appointment-calendar": "Appointments",
    "/consultations": "Consultations",
    "/locations": "Locations",
    "/services": "Services",
    "/specializations": "Services",

    // IPD
    "/ipd/dashboard": "IPD Dashboard",
    "/ipd/patients": "IPD Patient",
    "/ipd/admissions": "Admission",
    "/ipd/inpatients": "Inpatient",
    "/ipd/discharge": "Discharge",
    "/ipd/ward-management": "Ward Management",
    "/ipd/billings": "IPD Billings & Invoices",
    "/ipd/doctors": "IPD Doctor",
    "/ipd/treatments": "Treatment & Packages",

    // Diagnostic
    "/diagnostic/dashboard": "Diagnostic Dashboard",
    "/pathlab/dashboard": "Diagnostic Dashboard",
    "/pathlab/categories": "Category",
    "/pathlab/tests": "Diagnostic Test",
    "/pathlab/bookings": "Diagnostic Booking",
    "/pathlab/invoices": "Invoice (Diagnostic)",

    // Pharmacy
    "/pharmacy/dashboard": "Pharmacy Dashboard",
    "/pharmacy/categories": "Pharmacy Category",
    "/pharmacy/medicines": "Medicine",
    "/pharmacy/inventory": "Inventory",
    "/pharmacy/billing": "Pharmacy Billing",
    "/pharmacy/sales-history": "Sales History",

    // HRM
    "/staffs": "Staffs",
    "/hrm-departments": "Departments",
    "/designation": "Designation",
    "/attendance": "Attendance",
    "/leaves": "Leaves",
    "/leave-type": "Leaves",
    "/holidays": "Holidays",
    "/payroll": "Payroll",
    "/payroll-2": "Payroll",

    // Finance & Accounts
    "/expenses": "Expenses",
    "/expense-category": "Expenses",
    "/income": "Income",
    "/invoices": "Invoices",
    "/invoices-details": "Invoices",
    "/add-invoices": "Invoices",
    "/edit-invoices": "Invoices",
    "/payments": "Payments",
    "/transactions": "Transactions",

    // Therapy
    "/therapy-patients": "Therapy Patients",
    "/therapists": "Therapists",
    "/therapy-services": "Therapies",
    "/therapy-appointments": "Therapy Appointments",
    "/therapy-consultations": "Therapy Consultancy",
    "/all-sessions": "Therapy Sessions",

    // App & Admin
    "/todo": "To Do",
    "/notes": "Notes",
    "/tickets": "Support",
    "/roles-permissions": "Roles & Permissions",
    "/roles-and-permissions": "Roles & Permissions",
    "/refers": "Refer Sources"
};

export type PermissionsMap = Record<string, Record<string, boolean>>;

/** Read permissions object from localStorage */
export const getStoredPermissions = (): PermissionsMap | null => {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (user?.role !== "STAFF") return null;
        const p = user?.permissions;
        if (p && typeof p === "object" && !Array.isArray(p)) return p as PermissionsMap;
        return {};
    } catch {
        return null;
    }
};

/** Does this staff user have at least VIEW access? */
export const hasModuleAccess = (perms: PermissionsMap, moduleName: string): boolean => {
    const mod = perms[moduleName];
    if (!mod) return false;
    return Object.values(mod).some(Boolean);
};

/** Does staff have a specific action? */
export const hasAction = (perms: PermissionsMap, moduleName: string, action: string): boolean => {
    return !!perms[moduleName]?.[action];
};

export const canSeeMenuItem = (label: string, sectionTitle?: string): boolean => {
    const perms = getStoredPermissions();
    if (perms === null) return true;

    // Top Level Dashboard (above OPD in Main Menu) is visible to all roles
    if (label === "Dashboard" && (!sectionTitle || sectionTitle === "Main Menu")) {
        return true;
    }

    // Parent dropdown modules (Dashboard-style expandable items)
    const parentModules: Record<string, string[]> = {
        OPD: ["Dashboard", "Doctors", "Patients", "Appointments", "Consultations"],
        Clinic: ["Dashboard", "Doctors", "Patients", "Appointments", "Consultations"],
        IPD: [
            "IPD Dashboard",
            "IPD Patient",
            "Admission",
            "Inpatient",
            "Discharge",
            "Ward Management",
            "IPD Billings & Invoices",
            "IPD Doctor",
            "Treatment & Packages"
        ],
        Diagnostic: [
            "Diagnostic Dashboard",
            "Category",
            "Diagnostic Test",
            "Diagnostic Booking",
            "Invoice (Diagnostic)",
        ],
        Pharmacy: [
            "Pharmacy Dashboard",
            "Pharmacy Category",
            "Medicine",
            "Inventory",
            "Pharmacy Billing",
            "Sales History",
        ],
        HRM: [
            "Staffs",
            "Departments",
            "Designation",
            "Attendance",
            "Leaves",
            "Holidays",
            "Payroll",
        ],
        "Finance & Accounts": ["Expenses", "Invoices", "Transactions"],
        Therapy: [
            "Therapy Dashboard",
            "Therapy Patients",
            "Therapists",
            "Therapies",
            "Therapy Appointments",
            "Therapy Consultancy",
            "Therapy Sessions",
            "Therapy Invoices"
        ],
        Application: ["To Do", "Notes"],
        Support: ["Support"],
        Administration: ["Roles & Permissions", "Refer Sources"]
    };

    if (label in parentModules) {
        const modules = parentModules[label];
        if (!modules.length) return true;
        return modules.some((m) => hasModuleAccess(perms, m));
    }
    
    let lookupLabel = label;
    if (label === "Dashboard" && sectionTitle === "Diagnostic") {
        lookupLabel = "Diagnostic Dashboard";
    } else if (label === "Dashboard" && sectionTitle === "Pharmacy") {
        lookupLabel = "Pharmacy Dashboard";
    } else if (label === "Category" && sectionTitle === "Pharmacy") {
        lookupLabel = "Pharmacy Category";
    } else if (label === "Invoice" && sectionTitle === "Diagnostic") {
        lookupLabel = "Invoice (Diagnostic)";
    }
    
    const mod = LABEL_TO_MODULE[lookupLabel] || lookupLabel;
    if (!mod) return true;
    return hasModuleAccess(perms, mod);
};

export const canAccessRoute = (pathname: string): boolean => {
    const perms = getStoredPermissions();
    if (perms === null) return true;
    
    // Top level dashboard route (/about-docyori) is always accessible for all staff
    if (pathname === "/about-docyori" || pathname === "/about-docyori/") {
        return true;
    }

    let mod = PATH_TO_MODULE[pathname];
    if (!mod) {
        const parts = pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
            const base2 = "/" + parts.slice(0, 2).join("/");
            mod = PATH_TO_MODULE[base2];
        }
        if (!mod && parts.length >= 1) {
            const base1 = "/" + parts[0];
            mod = PATH_TO_MODULE[base1];
        }
    }
    
    if (!mod) return true;
    return hasModuleAccess(perms, mod);
};

export const canSeeSection = (sectionTitle: string): boolean => {
    const perms = getStoredPermissions();
    if (perms === null) return true;
    if (sectionTitle === "Super Admin" || sectionTitle === "Administration") return false;

    const sectionModules: Record<string, string[]> = {
        "Main Menu": [
            "Dashboard",
            "Doctors",
            "Patients",
            "Appointments",
            "Consultations",
            "IPD Dashboard",
            "IPD Patient",
            "Admission",
            "Inpatient",
            "Discharge",
            "Ward Management",
            "IPD Billings & Invoices",
            "IPD Doctor",
            "Treatment & Packages",
            "Diagnostic Dashboard",
            "Category",
            "Diagnostic Test",
            "Diagnostic Booking",
            "Invoice (Diagnostic)",
            "Pharmacy Dashboard",
            "Pharmacy Category",
            "Medicine",
            "Inventory",
            "Pharmacy Billing",
            "Sales History",
            "Staffs",
            "Departments",
            "Designation",
            "Attendance",
            "Leaves",
            "Holidays",
            "Payroll",
            "Expenses",
            "Invoices",
            "Transactions",
            "To Do",
            "Notes"
        ],
        OPD: ["Dashboard", "Doctors", "Patients", "Appointments", "Consultations"],
        Clinic: ["Dashboard", "Doctors", "Patients", "Appointments", "Consultations"],
        IPD: [
            "IPD Dashboard",
            "IPD Patient",
            "Admission",
            "Inpatient",
            "Discharge",
            "Ward Management",
            "IPD Billings & Invoices",
            "IPD Doctor",
            "Treatment & Packages"
        ],
        HRM: ["Staffs", "Departments", "Designation", "Attendance", "Leaves", "Holidays", "Payroll"],
        "Finance & Accounts": ["Expenses", "Invoices", "Transactions"],
        Diagnostic: ["Diagnostic Dashboard", "Category", "Diagnostic Test", "Diagnostic Booking", "Invoice (Diagnostic)"],
        Pharmacy: ["Pharmacy Dashboard", "Pharmacy Category", "Medicine", "Inventory", "Pharmacy Billing", "Sales History"],
        Therapy: [
            "Therapy Dashboard",
            "Therapy Patients",
            "Therapists",
            "Therapies",
            "Therapy Appointments",
            "Therapy Consultancy",
            "Therapy Sessions",
            "Therapy Invoices"
        ],
        Application: ["To Do", "Notes"],
        Support: ["Support"],
        Administration: ["Roles & Permissions", "Refer Sources"]
    };

    const modules = sectionModules[sectionTitle];
    if (!modules) return true;

    const hasAny = modules.some((m) => hasModuleAccess(perms, m));
    return hasAny;
};

// ── UI Components & Hooks ───────────────────────────────────────────────

export const usePermissions = () => {
    const perms = useMemo(() => getStoredPermissions(), []);
    const check = (moduleName: string, action?: "CREATE" | "EDIT" | "DELETE" | "VIEW") => {
        if (perms === null) return true;
        if (!action) return hasModuleAccess(perms, moduleName);
        return hasAction(perms, moduleName, action);
    };
    return { perms, check, isStaff: perms !== null };
};

interface HasPermissionProps {
    module: string;
    action?: "CREATE" | "EDIT" | "DELETE" | "VIEW";
    children: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ module, action, children }) => {
    const { check } = usePermissions();
    if (!check(module, action)) return null;
    return <>{children} </>;
};
