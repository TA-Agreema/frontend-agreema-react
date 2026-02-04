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

    // Role Admin - Template Kontrak
    {
        title: "Template Kontrak",
        url: "/contracts-templates",
        icon: FileText,
        roles: ["admin"],
    },
    {
        title: "Kategori Kontrak",
        url: "/contract-categories",
        icon: FileText,
        roles: ["admin"],
    },
    {
        title: "Manajemen Pengguna",
        url: "/users",
        icon: Users,
        permissions: ["read.all.users", "read.all.roles"],
        items: [
            {
                title: "Daftar Pengguna",
                url: "/users",
                permissions: ["read.all.users"],
            },
            {
                title: "Role & Permission",
                url: "/roles",
                permissions: ["read.all.roles"],
            },
        ],
    },
    {
        title: "Pengaturan",
        url: "/settings",
        icon: Settings,
        roles: ["admin"],
    },

    // Role HRD - Kontrak
    {
        title: "Kontrak",
        url: "/contracts",
        icon: FileText,
        roles: ["hrd"],
        items: [
            { title: "Semua Kontrak", url: "/contracts" },
            { title: "Kontrak Revisi", url: "/contracts/revisions" },
        ],
    },

    // Role Manager - Approval
    {
        title: "Approval Kontrak",
        url: "/approvals",
        icon: CheckCircle,
        roles: ["manager"],
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
