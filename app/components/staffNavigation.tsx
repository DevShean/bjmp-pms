import type { ComponentType } from "react";
import {
  Activity,
  ClipboardList,
  FileBarChart2,
  FileHeart,
  Gauge,
  HeartPulse,
  House,
  NotebookPen,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";

export type StaffRole = "admin" | "medical" | "officer" | "rehab";

export type StaffMenuItem = {
  name: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  children?: Array<{
    name: string;
    path: string;
  }>;
};

export const staffRoleConfig: Record<
  StaffRole,
  {
    label: string;
    shortLabel: string;
    homePath: string;
    defaultEmail: string;
    searchPlaceholder: string;
    menuItems: StaffMenuItem[];
  }
> = {
  admin: {
    label: "Administrator",
    shortLabel: "Admin",
    homePath: "/admin-page",
    defaultEmail: "admin@bjmp.portal",
    searchPlaceholder: "Search admin records...",
    menuItems: [
      { name: "Dashboard", path: "/admin-page", icon: House },
      {
        name: "Manage Inmate",
        path: "/admin-page/manage-inmate",
        icon: Users,
        children: [
          { name: "Inmate Profile", path: "/admin-page/inmate-profile" },
          { name: "Transfer & Release", path: "/admin-page/transfer-release" },
        ],
      },
      {
        name: "Program & Rehabilitation",
        path: "/admin-page/program-rehabilitation",
        icon: ClipboardList,
        children: [
          { name: "Manage Program", path: "/admin-page/manage-program" },
          { name: "Inmate Progress", path: "/admin-page/inmate-progress" },
        ],
      },
      { name: "Medical Records", path: "/admin-page/medical-records", icon: FileHeart },
      { name: "Visitation Request", path: "/admin-page/visitation-request", icon: ShieldCheck, badge: 4 },
      { name: "User Management", path: "/admin-page/user-management", icon: UserCog },
      { name: "Audit Logs", path: "/admin-page/audit-logs", icon: ScrollText },
    ],
  },
  medical: {
    label: "Medical Staff",
    shortLabel: "Medical",
    homePath: "/medical-page",
    defaultEmail: "medical@bjmp.portal",
    searchPlaceholder: "Search medical records...",
    menuItems: [
      { name: "Dashboard", path: "/medical-page", icon: House },
      { name: "Medical Records", path: "/medical-page/medical-records", icon: HeartPulse },
      { name: "Inmates Medic", path: "/medical-page/inmates-medic", icon: Stethoscope },
      { name: "Health Report", path: "/medical-page/health-report", icon: FileBarChart2 },
      { name: "Incidents", path: "/medical-page/incidents", icon: ShieldAlert, badge: 2 },
    ],
  },
  officer: {
    label: "Correctional Officer",
    shortLabel: "Officer",
    homePath: "/officer-page",
    defaultEmail: "officer@bjmp.portal",
    searchPlaceholder: "Search inmates or logs...",
    menuItems: [
      { name: "Dashboard", path: "/officer-page", icon: House },
      { name: "Inmate", path: "/officer-page/inmate", icon: Users },
      { name: "Behavior Logs", path: "/officer-page/behavior-logs", icon: NotebookPen },
    ],
  },
  rehab: {
    label: "Rehabilitation Staff",
    shortLabel: "Rehab",
    homePath: "/rehab-page",
    defaultEmail: "rehab@bjmp.portal",
    searchPlaceholder: "Search programs and reports...",
    menuItems: [
      { name: "Dashboard", path: "/rehab-page", icon: House },
      {
        name: "Manage Program",
        path: "/rehab-page/manage-program",
        icon: ClipboardList,
        children: [
          { name: "Programs", path: "/rehab-page/programs" },
          { name: "Inmate Progress", path: "/rehab-page/inmate-progress" },
        ],
      },
      { name: "Behavior Logs", path: "/rehab-page/behavior-logs", icon: Activity },
      { name: "Report", path: "/rehab-page/report", icon: Gauge },
    ],
  },
};