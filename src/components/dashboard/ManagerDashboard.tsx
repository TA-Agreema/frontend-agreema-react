import type { DashboardData } from "../../types/dashboard";
import { StatCard } from "./DashboardWidgets";
import { Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManagerDashboard({ data }: { data: DashboardData }) {
  const { metrics, top_waiting } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Stats */}
      <div className="rounded-xl border bg-gradient-to-r from-amber-500 to-orange-500 p-8 shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {metrics.waiting_approval} Dokumen
          </h2>
          <p className="text-amber-50 font-medium text-lg">
            Menunggu Persetujuan / Review Anda
          </p>
        </div>
        <Clock className="h-16 w-16 text-amber-100 opacity-80" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Kontrak Aktif (Sistem)"
          value={metrics.total_system_active?.toString() || "0"}
          icon={CheckCircle}
          color="bg-blue-600"
        />
        <StatCard
          title="Disetujui Bulan Ini"
          value={metrics.approved_this_month?.toString() || "0"}
          icon={CheckCircle}
          color="bg-emerald-600"
        />
        <StatCard
          title="Ditolak / Revisi Bulan Ini"
          value={metrics.revision_requested_this_month?.toString() || "0"}
          icon={XCircle}
          color="bg-rose-600"
        />
      </div>

      {/* Top 5 Waiting Review */}
      <div className="rounded-xl border bg-white p-0 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">Dokumen Membutuhkan Perhatian Segera</h3>
        </div>

        {(!top_waiting || top_waiting.length === 0) ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle className="h-10 w-10 text-emerald-400 mb-3" />
            <p className="text-lg font-medium text-gray-800">Antrian Kosong</p>
            <p className="text-sm mt-1">Tidak ada kontrak yang menunggu review Anda saat ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {top_waiting.map((contract) => (
              <div key={contract.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-amber-100 text-amber-700">
                      Butuh Review
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {contract.contract_number}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">{contract.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Diajukan oleh <span className="font-medium text-gray-700">{contract.creator?.name}</span> pada {new Date(contract.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <Link
                  to={`/approvals/${contract.id}`}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-sm font-medium rounded-lg transition-all shadow-sm"
                >
                  Review Dokumen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
