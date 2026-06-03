import { all_routes } from "../../../feature-module/routes/all_routes";

export const sidebarMenus = [
  {
    label: "Account Settings",
    icon: "ti ti-user-cog me-2",
    submenus: [
      { to: all_routes.profilesettings, label: "Profile" },
      { to: all_routes.securitysettings, label: "Security" },
    ],
  },
  {
    label: "Landing Page Settings",
    icon: "ti ti-browser-check me-2",
    submenus: [
      { to: all_routes.organizationsettings, label: "Hero & Contact" },
      { to: all_routes.localizationsettings, label: "Clinic Overview" },
      { to: all_routes.seosetupsettings, label: "Services & Icons" },
      { to: all_routes.prefixessettings, label: "Patient Reviews" },
      { to: all_routes.maintenancemodesettings, label: "Gallery & Location" },
    ],
  }
];
