import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  // PenTool,
  Users,
  // FolderKanban,
  // ScrollText,
  // Bell,
  Settings,
  ClipboardList,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarMenuSubItem {
  title: string;
  url: string;
  permissions?: string[];
}

export interface SidebarMenuItemType {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
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
  },

  // Role Admin - Kategori Kontrak
  {
    title: "Kategori Kontrak",
    url: "/categories",
    icon: FileText,
  },

  // Role Admin - Template Kontrak
  {
    title: "Template Kontrak",
    url: "/contracts-templates",
    icon: FileText,
  },
  {
    title: "Pengaturan",
    url: "/settings",
    icon: Settings,
  },

  {
    title: "Daftar Kontrak",
    url: "/contracts",
    icon: FileText,
  },
  {
    title: "Template",
    url: "/contracts-templates",
    icon: ClipboardList,
  },
  {
    title: "Arsip Kontrak",
    url: "/contracts-archive",
    icon: Archive,
  },

  // Role Manager - Approval
  {
    title: "Approval Kontrak",
    url: "/approvals",
    icon: CheckCircle,
    items: [
      { title: "Perlu Ditinjau", url: "/approvals/pending" },
      { title: "Riwayat kontrak", url: "/approvals/history" },
    ],
  },
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
