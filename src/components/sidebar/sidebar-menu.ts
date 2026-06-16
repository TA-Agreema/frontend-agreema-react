import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  // CheckCircle2,
  Users,
  ClipboardList,
  // Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarMenuSubItem {
  title: string;
  url: string;
  permissions?: string[];
  roles?: string[];
}

export interface SidebarMenuItemType {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  exact?: boolean;
  items?: SidebarMenuSubItem[];
  permissions?: string[];
  roles?: string[];
}

export const sidebarMenuItems: SidebarMenuItemType[] = [
  // All Roles - Dashboard accessible to everyone
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  // Role Admin - Manajemen Pengguna (User & Role)
  {
    title: "Manajemen Pengguna",
    url: "/users",
    icon: Users,
    roles: ["admin"],
  },

  // Role Admin - Kategori Kontrak
  {
    title: "Kategori Kontrak",
    url: "/categories",
    icon: FileText,
    roles: ["admin"],
  },

  // Role Admin - Template Kontrak
  {
    title: "Template Kontrak",
    url: "/contracts-templates",
    icon: FileText,
    roles: ["admin"],
  },
  // {
  //   title: "Pengaturan",
  //   url: "/settings",
  //   icon: Settings,
  //   roles: ["admin"],
  // },
  {
    title: "Template Kontrak",
    url: "/contracts-templates",
    icon: ClipboardList,
    roles: ["hrd"],
  },
  {
    title: "Daftar Kontrak",
    url: "",
    icon: FileText,
    roles: ["hrd"],
    // exact: true,
    items: [
      { title: "Semua Kontrak", url: "/contracts/" },
      { title: "Kontrak Aktif", url: "/contracts/active" },
      { title: "Arsip Kontrak", url: "/contracts/archive" }
    ],
  },

  // Role Manager - Approval
  {
    title: "Approval Kontrak",
    url: "",
    icon: CheckCircle,
    roles: ["manager"],
    items: [
      { title: "Perlu Ditinjau", url: "/approvals" },
      { title: "Kontrak Aktif", url: "/contracts/active" },
      { title: "Arsip Kontrak", url: "/contracts/archive" }
    ],
  },

  // Role HRD & Manager - Arsip Kontrak
  // {
  //   title: "Arsip Kontrak",
  //   url: "/contracts/archive",
  //   icon: Archive,
  //   roles: ["hrd", "manager"],
  // },
  // {
  //     title: "Tanda Tangan",
  //     url: "/signatures",
  //     icon: PenTool,
  //     items: [
  //         { title: "Perlu Ditandatangani", url: "/signatures/pending" },
  //         { title: "Riwayat Tanda Tangan", url: "/signatures/history" },
  //     ],
  // },

  // {
  //     title: "Jenis Kontrak",
  //     url: "/contract-type",
  //     icon: FolderKanban,
  // },
  // {
  //     title: "Audit Log",
  //     url: "/audit-log",
  //     icon: ScrollText,
  // },
  // {
  //     title: "Notifikasi",
  //     url: "/notifications",
  //     icon: Bell,
  // },
];
