import {
    FileText,
    CheckCircle,
    PenTool,
    Clock,
    TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: LucideIcon;
    color: string;
}

interface ActivityItem {
    title: string;
    time: string;
    icon: LucideIcon;
    iconColor: string;
}

interface TaskItem {
    title: string;
    priority: "Tinggi" | "Sedang" | "Rendah";
    dueDate: string;
}

const stats: StatCardProps[] = [
    {
        title: "Total Kontrak",
        value: "128",
        change: "+12%",
        icon: FileText,
        color: "bg-blue-500",
    },
    {
        title: "Menunggu Approval",
        value: "24",
        change: "-3%",
        icon: CheckCircle,
        color: "bg-amber-500",
    },
    {
        title: "Perlu Ditandatangani",
        value: "8",
        change: "+5%",
        icon: PenTool,
        color: "bg-purple-500",
    },
    {
        title: "Kontrak Aktif",
        value: "96",
        change: "+8%",
        icon: TrendingUp,
        color: "bg-green-500",
    },
];

const recentActivities: ActivityItem[] = [
    {
        title: "Kontrak Kerjasama PT ABC disetujui",
        time: "2 jam yang lalu",
        icon: CheckCircle,
        iconColor: "text-green-500",
    },
    {
        title: "Draft kontrak baru dibuat",
        time: "4 jam yang lalu",
        icon: FileText,
        iconColor: "text-blue-500",
    },
    {
        title: "Menunggu tanda tangan Direktur",
        time: "6 jam yang lalu",
        icon: PenTool,
        iconColor: "text-purple-500",
    },
    {
        title: "Kontrak akan berakhir dalam 7 hari",
        time: "1 hari yang lalu",
        icon: Clock,
        iconColor: "text-amber-500",
    },
];

const tasks: TaskItem[] = [
    { title: "Review kontrak supplier", priority: "Tinggi", dueDate: "Hari ini" },
    { title: "Tanda tangani MoU", priority: "Tinggi", dueDate: "Hari ini" },
    { title: "Perbarui template kontrak", priority: "Sedang", dueDate: "Besok" },
    { title: "Arsipkan kontrak lama", priority: "Rendah", dueDate: "Minggu ini" },
];

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        <span
                            className={
                                change.startsWith("+")
                                    ? "text-green-600"
                                    : "text-red-600"
                            }
                        >
                            {change}
                        </span>{" "}
                        dari bulan lalu
                    </p>
                </div>
                <div className={`${color} p-3 rounded-lg text-white`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}

function ActivityList({ activities }: { activities: ActivityItem[] }) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <activity.icon className={`h-5 w-5 mt-0.5 ${activity.iconColor}`} />
                        <div>
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TaskList({ tasks }: { tasks: TaskItem[] }) {
    const getPriorityStyles = (priority: TaskItem["priority"]) => {
        switch (priority) {
            case "Tinggi":
                return "bg-red-100 text-red-700";
            case "Sedang":
                return "bg-amber-100 text-amber-700";
            case "Rendah":
                return "bg-green-100 text-green-700";
        }
    };

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Tugas Anda</h3>
            <div className="space-y-3">
                {tasks.map((task, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                        <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                        </div>
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${getPriorityStyles(
                                task.priority
                            )}`}
                        >
                            {task.priority}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Selamat datang di Agreema - Digital Contract Lifecycle Management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <ActivityList activities={recentActivities} />
                <TaskList tasks={tasks} />
            </div>
        </div>
    );
}
