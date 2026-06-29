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
    "Services and Medicines": "Services",
    Services: "Services",
    specializations: "Services",
    "Diagnostic Dashboard": "Diagnostic Dashboard",
    Category: "Category",
    "Diagnostic Test": "Diagnostic Test",
    "Diagnostic Booking": "Diagnostic Booking",
    "Invoice (Diagnostic)": "Invoice (Diagnostic)",
    Staffs: "Staffs",
    Departments: "Departments",
    Designation: "Designation",
    Designations: "Designation",
    Attendance: "Attendance",
    Leaves: "Leaves",
    Holidays: "Holidays",
    Payroll: "Payroll",
    Specializations: "Specializations",
    Expenses: "Expenses",
    Invoices: "Invoices",
    Transactions: "Transactions",
    "Roles & Permissions": "Roles & Permissions"
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
    "/locations": "Locations",
    "/services": "Services",
    "/specializations": "Services",
    "/staffs": "Staffs",
    "/hrm-departments": "Departments",
    "/designation": "Designation",
    "/attendance": "Attendance",
    "/leaves": "Leaves",
    "/leave-type": "Leaves",
    "/holidays": "Holidays",
    "/payroll": "Payroll",
    "/payroll-2": "Payroll",
    "/expenses": "Expenses",
    "/expense-category": "Expenses",
    "/income": "Income",
    "/invoices": "Invoices",
    "/invoices-details": "Invoices",
    "/add-invoices": "Invoices",
    "/edit-invoices": "Invoices",
    "/payments": "Payments",
    "/transactions": "Transactions",
    "/pathlab/dashboard": "Diagnostic Dashboard",
    "/pathlab/categories": "Category",
    "/pathlab/tests": "Diagnostic Test",
    "/pathlab/bookings": "Diagnostic Booking",
    "/pathlab/invoices": "Invoice (Diagnostic)",
    "/roles-permissions": "Roles & Permissions",
    "/roles-and-permissions": "Roles & Permissions"
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
    
    let lookupLabel = label;
    if (label === "Dashboard" && sectionTitle === "Diagnostic") {
        lookupLabel = "Diagnostic Dashboard";
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
        "Clinic": ["Doctors", "Patients", "Appointments", "Services"],
        "HRM": ["Staffs", "Departments", "Designation", "Attendance", "Leaves", "Holidays", "Payroll", "Specializations"],
        "Finance & Accounts": ["Expenses", "Invoices", "Transactions"],
        "Diagnostic": ["Diagnostic Dashboard", "Category", "Diagnostic Test", "Diagnostic Booking", "Invoice (Diagnostic)"],
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
