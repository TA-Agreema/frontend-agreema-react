import type { DashboardData } from "@/types/dashboard";
import { StatCard, RecentLogsList, ExpiringContractsTable } from "./DashboardWidgets";
import { FileEdit, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

export default function HrdDashboard({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { metrics, distribution, system_distribution, recent_logs, expiring_contracts } = data;

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Kontrak Aktif (Sistem)"
          value={metrics.total_system_active?.toString() || "0"}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Kontrak Saya"
          value={metrics.my_contracts?.toString() || "0"}
          icon={FileEdit}
          color="bg-emerald-600"
          href="/contracts"
        />
        <StatCard
          title="Butuh Aksi (Draft/Revisi)"
          value={metrics.action_needed?.toString() || "0"}
          icon={FileEdit}
          color="bg-rose-500"
          href="/contracts"
        />
        <StatCard
          title="Menunggu Review Manager"
          value={metrics.waiting_review?.toString() || "0"}
          icon={Clock}
          color="bg-amber-500"
          href="/contracts"
        />
        <StatCard
          title="Disetujui"
          value={metrics.approved?.toString() || "0"}
          icon={CheckCircle}
          color="bg-purple-600"
          href="/contracts"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Kontrak Saya</h3>
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="status"
                >
                  {distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name.toUpperCase()]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend formatter={(value) => <span className="uppercase text-xs font-medium text-gray-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Sistem Keseluruhan</h3>
          <div className="h-62.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={system_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="status"
                >
                  {system_distribution?.map((entry, index) => (
                    <Cell key={`cell-sys-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name.toUpperCase()]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend formatter={(value) => <span className="uppercase text-xs font-medium text-gray-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm grid-cols-1 md:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terkini Kontrak Saya</h3>
          <div className="max-h-62.5 overflow-y-auto pr-2 custom-scrollbar">
            <RecentLogsList logs={recent_logs || []} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-0 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">Kontrak Saya Akan Kedaluwarsa</h3>
        </div>
        <ExpiringContractsTable 
          contracts={expiring_contracts || []}
          onRowClick={(id) => navigate(`/contracts/${id}/view`)}
         />
      </div>
    </div>
  );
}