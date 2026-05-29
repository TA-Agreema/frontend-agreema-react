import {
    LayoutDashboard,
    FileText,
    CheckCircle,
    PenTool,
    Users,
    FolderKanban,
    ScrollText,
    Bell,
    Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarMenuSubItem {
    title: string;
    url: string;
}

export interface SidebarMenuItemType {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: SidebarMenuSubItem[];
}

export const sidebarMenuItems: SidebarMenuItemType[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Kontrak",
        url: "/contracts",
        icon: FileText,
        items: [
            { title: "Semua Kontrak", url: "/contracts" },
            { title: "Buat Kontrak", url: "/contracts/create" },
            { title: "Draft Saya", url: "/contracts/drafts" },
        ],
    },
    {
        title: "Approval",
        url: "/approvals",
        icon: CheckCircle,
        items: [
            { title: "Perlu Ditinjau", url: "/approvals/pending" },
            { title: "Riwayat Approval", url: "/approvals/history" },
        ],
    },
    {
        title: "Tanda Tangan",
        url: "/signatures",
        icon: PenTool,
        items: [
            { title: "Perlu Ditandatangani", url: "/signatures/pending" },
            { title: "Riwayat Tanda Tangan", url: "/signatures/history" },
        ],
    },
    {
        title: "Manajemen Pengguna",
        url: "/users",
        icon: Users,
        items: [
            { title: "Daftar Pengguna", url: "/users" },
            { title: "Role & Permission", url: "/roles" },
        ],
    },
    {
        title: "Jenis Kontrak",
        url: "/contract-type",
        icon: FolderKanban,
    },
    {
        title: "Audit Log",
        url: "/audit-log",
        icon: ScrollText,
    },
    {
        title: "Notifikasi",
        url: "/notifications",
        icon: Bell,
    },
    {
        title: "Pengaturan",
        url: "/settings",
        icon: Settings,
    },
];
