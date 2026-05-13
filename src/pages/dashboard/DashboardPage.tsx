import { useEffect, useState } from "react";
import { fetchDashboardData } from "@/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import HrdDashboard from "@/components/dashboard/HrdDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import InternalDashboard from "@/components/dashboard/InternalDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const result = await fetchDashboardData();
                setData(result);
            } catch (err: any) {
                console.error("Gagal memuat dashboard", err);
                setError(err.message || "Gagal memuat data dashboard.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-gray-500 font-medium">Memuat metrik dashboard Anda...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-lg font-medium">
                    {error || "Terjadi kesalahan yang tidak diketahui."}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                <p className="text-muted-foreground mt-1">
                    Selamat datang di Agreema - Digital Contract Lifecycle Management
                </p>
            </div>

            {data.role === 'admin' && <AdminDashboard data={data} />}
            {data.role === 'hrd' && <HrdDashboard data={data} />}
            {data.role === 'manager' && <ManagerDashboard data={data} />}
            {data.role === 'internal' && <InternalDashboard data={data} />}
        </div>
    );
}
