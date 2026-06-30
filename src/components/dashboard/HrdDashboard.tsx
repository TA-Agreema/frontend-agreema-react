import type { DashboardData } from "@/types/dashboard";
import { StatCard, RecentLogsList, ExpiringContractsTable } from "./DashboardWidgets";
import { FileEdit, CheckCircle, Clock, TrendingUp, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

export default function HrdDashboard({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { metrics, distribution, recent_logs, expiring_contracts } = data;

  const STATUS_COLORS: Record<string, string> = {
    active: '#10b981',
    signed: '#10b981',
    approved: '#3b82f6',
    terminated: '#ef4444',
    rejected: '#ef4444',
    revision: '#f59e0b',
    draft: '#64748b'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-3">
        <StatCard
          title="Total Kontrak"
          value={metrics.my_contracts?.toString() || "0"}
          icon={FileEdit}
          color="bg-emerald-600"
          href="/contracts"
        />
        <StatCard
          title="Kontrak Aktif"
          value={metrics.active_my_contracts?.toString() || "0"}
          icon={TrendingUp}
          color="bg-blue-600"
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
          title="Menunggu Review"
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
        <StatCard
          title="Ditolak"
          value={metrics.rejected?.toString() || "0"}
          icon={XCircle}
          color="bg-rose-600"
          href="/contracts"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Status Kontrak</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="status"
                  label={({ value }) => `${value}`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status.toLowerCase()] || '#8b5cf6'} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [value, name.toUpperCase()]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend formatter={(value) => <span className="uppercase text-xs font-medium text-gray-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terkini Kontrak</h3>
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
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