import { Clock } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-400",
  review: "bg-yellow-400",
  approved: "bg-blue-400",
  signed: "bg-purple-500",
  active: "bg-emerald-500",
  revision: "bg-orange-400",
  rejected: "bg-red-500",
  terminating: "bg-orange-500", 
  terminated: "bg-red-700",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  review: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  revision: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
  terminating: "bg-orange-100 text-orange-700", 
  terminated: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  review: "Perlu Ditinjau",
  revision: "Menunggu Revisi",
  approved: "Disetujui",
  rejected: "Ditolak",
  signed: "Disahkan",
  active: "Aktif",
  terminated: "Dihentikan",
};

interface StatusLog {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

interface Feedback {
  id: number;
  author: string;
  role: string;
  type: string;
  typeLabel: string;
  message: string;
  date: string;
}

export default function ContractStatusSidebar({
  statusLogs,
  feedbacks = [],
}: {
  statusLogs: StatusLog[];
  feedbacks?: Feedback[];
}) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-4 space-y-4">

        {/* Riwayat Status */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Riwayat Status
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Timeline</span>
          </div>
          <div className="space-y-2">
            {statusLogs && statusLogs.length > 0 ? (
              statusLogs.map((log, i) => (
                <div key={log.id} className="flex gap-2">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[log.new_status] || "bg-gray-400"}`} />
                    {i < statusLogs.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1 min-h-5" />
                    )}
                  </div>
                  <div className="pb-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[log.new_status] || "bg-gray-100 text-gray-500"}`}>
                        {log.new_status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">{log.created_at}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      Diperbarui oleh: {log.changed_by}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      Dari {STATUS_LABEL[log.old_status] ?? log.old_status} ke {STATUS_LABEL[log.new_status] ?? log.new_status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Belum ada riwayat status.</p>
            )}
          </div>
        </section>

        {/* Umpan Balik & Revisi */}
        {feedbacks.length > 0 && (
          <>
            <div className="border-t border-gray-100" />
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Umpan Balik & Revisi
                </p>
                <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {feedbacks.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold shrink-0 uppercase">
                          {fb.author ? fb.author[0] : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{fb.author}</p>
                          <p className="text-[10px] text-gray-400 truncate">{fb.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        fb.type === "rejected" ? "bg-red-100 text-red-700"
                        : fb.type === "revised" || fb.type === "revision" ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                      }`}>
                        {fb.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{fb.message}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(fb.date).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}