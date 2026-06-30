import type { DashboardData } from "@/types/dashboard";
import { StatCard, RecentLogsList, ExpiringContractsTable } from "./DashboardWidgets";
import { FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export default function AdminDashboard({ data }: { data: DashboardData }) {
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
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Seluruh Kontrak"
          value={metrics.total_contracts?.toString() || "0"}
          icon={FileText}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Kontrak Aktif"
          value={metrics.active_contracts?.toString() || "0"}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <StatCard
          title="Pertumbuhan Bulan Ini"
          value={metrics.growth ? `+${metrics.growth}%` : "0%"}
          icon={TrendingUp}
          color="bg-purple-600"
        />
        <StatCard
          title="Kontrak Lewat Waktu"
          value={metrics.overdue_contracts?.toString() || "0"}
          icon={AlertTriangle}
          color="bg-rose-600"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chart */}
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

        {/* Logs */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Status Seluruh Kontrak</h3>
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            <RecentLogsList logs={recent_logs || []} />
          </div>
        </div>
      </div>

      {/* Expiring Contracts */}
      <div className="rounded-xl border bg-white p-0 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-rose-50/50">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-semibold text-gray-800">Kontrak Akan Kedaluwarsa (&lt; 60 Hari)</h3>
        </div>
        <ExpiringContractsTable contracts={expiring_contracts || []} />
      </div>
    </div>
  );
}
