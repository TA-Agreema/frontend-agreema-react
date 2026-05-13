import type { DashboardData } from "@/types/dashboard";
import { PenTool, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function InternalDashboard({ data }: { data: DashboardData }) {
  const { metrics } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border bg-gradient-to-r from-purple-500 to-indigo-600 p-8 shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {metrics.waiting_signature} Dokumen
          </h2>
          <p className="text-purple-50 font-medium text-lg">
            Menunggu Tanda Tangan Anda
          </p>
        </div>
        <PenTool className="h-16 w-16 text-purple-100 opacity-80" />
      </div>

      {metrics.waiting_signature === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500 flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />
          <p className="text-xl font-medium text-gray-800">Semua Selesai!</p>
          <p className="text-sm mt-2">Tidak ada dokumen yang memerlukan tanda tangan Anda saat ini.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-gray-600 mb-4">
            Silakan buka halaman Daftar Kontrak untuk melihat dan menandatangani dokumen yang tertunda.
          </p>
          <Link
            to="/contracts"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
          >
            Lihat Daftar Kontrak
          </Link>
        </div>
      )}
    </div>
  );
}
