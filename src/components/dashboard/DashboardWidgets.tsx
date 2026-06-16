import type { LucideIcon } from "lucide-react";
import { CheckCircle, FileText, FileEdit, Clock, Trash2, ArrowRightCircle } from "lucide-react";
import type { DashboardLog, DashboardExpiringContract } from "@/types/dashboard";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  href?: string;
}

export function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const cardContent = (
    <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center justify-between w-full h-full transition-all duration-200 hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
      </div>
      <div className={`${color} p-4 rounded-xl text-white shadow-sm shrink-0`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block w-full h-full no-underline">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

const getLogIcon = (status: string) => {
  switch (status) {
    case "approved": return CheckCircle;
    case "draft": return FileText;
    case "revision": return FileEdit;
    case "terminated": return Trash2;
    default: return ArrowRightCircle;
  }
};

const getLogColor = (status: string) => {
  switch (status) {
    case "approved": return "text-emerald-500 bg-emerald-50";
    case "draft": return "text-gray-500 bg-gray-50";
    case "revision": return "text-amber-500 bg-amber-50";
    case "terminated": return "text-red-500 bg-red-50";
    default: return "text-blue-500 bg-blue-50";
  }
};

export function RecentLogsList({ logs }: { logs: DashboardLog[] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-gray-500 p-4 text-center">Belum ada aktivitas terbaru.</p>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const Icon = getLogIcon(log.new_status);
        return (
          <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <div className={`p-2 rounded-full ${getLogColor(log.new_status)} shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {log.contract?.contract_number || "Kontrak"} - {log.contract?.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Status diubah menjadi <span className="font-semibold uppercase">{log.new_status}</span> oleh {log.changed_by_user?.name || 'Sistem'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(log.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExpiringContractsTable({ contracts }: { contracts: DashboardExpiringContract[] }) {
  if (!contracts || contracts.length === 0) {
    return <p className="text-sm text-gray-500 p-4 text-center">Tidak ada kontrak yang akan segera berakhir.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Nomor Kontrak</th>
            <th className="px-4 py-3">Judul</th>
            <th className="px-4 py-3">Tanggal Berakhir</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contracts.map((c) => {
            const endDate = new Date(c.end_date);
            const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.contract_number}</td>
                <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{c.title}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${daysLeft < 14 ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className={daysLeft < 14 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {endDate.toLocaleDateString('id-ID')} ({daysLeft} hari)
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
