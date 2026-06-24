import type { ContractVersion } from "@/types/contractVersion";
import { FileText } from "lucide-react";

type ContractStatusLog = {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
};

type ContractFeedback = {
  id: number;
  author?: string;
  role?: string;
  type?: string;
  typeLabel?: string;
  message?: string;
  date?: string;
  review_document_url?: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500 border border-gray-200",
  review: "bg-amber-50 text-amber-700 border border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  revision: "bg-orange-50 text-orange-700 border border-orange-200",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-400",
  review: "bg-amber-400",
  active: "bg-emerald-500",
  revision: "bg-orange-400",
};

export function ContractEditorRightSidebar({
  statusLogs,
  feedbacks,
  versions = [],
  onViewVersion,
}: {
  statusLogs: ContractStatusLog[];
  feedbacks: ContractFeedback[];
  versions?: ContractVersion[];
  onViewVersion?: (version: ContractVersion) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Riwayat Status
            </p>
            <button className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium">
              Timeline
            </button>
          </div>
          <div className="space-y-2">
            {statusLogs.length > 0 ? (
              statusLogs.map((log, index) => (
                <div key={log.id} className="flex gap-2">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[log.new_status] || "bg-gray-400"
                        }`}
                    />
                    {index < statusLogs.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />
                    )}
                  </div>
                  <div className="pb-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[log.new_status] ||
                          "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {log.new_status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {log.created_at}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      Diperbarui oleh: {log.changed_by}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      Dari {log.old_status} ke {log.new_status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Belum ada riwayat status.</p>
            )}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Riwayat Versi
            </p>
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
              {versions.length}
            </span>
          </div>
          <div className="space-y-2">
            {versions.length > 0 ? (
              [...versions]
                .sort((a, b) => b.id - a.id)
                .map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => onViewVersion?.(version)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <p className="text-xs font-semibold text-gray-700">
                      Versi {version.version_number}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {version.created_at}
                    </p>
                  </button>
                ))
            ) : (
              <p className="text-xs text-gray-400">Belum ada riwayat versi.</p>
            )}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        <section>
          {feedbacks.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Umpan Balik & Revisi
                </p>
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {feedbacks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold shrink-0 uppercase">
                          {feedback.author ? feedback.author[0] : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {feedback.author}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {feedback.role}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${feedback.type === "revised" ||
                            feedback.type === "revision" ||
                            feedback.type === "rejected"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}
                      >
                        {feedback.typeLabel}
                      </span>
                    </div>
                    {feedback.message && (
                      <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {feedback.message}
                      </p>
                    )}
                    {feedback.review_document_url && (
                      <a
                        href={feedback.review_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        Lihat Dokumen Revisi
                      </a>
                    )}
                    <p className="text-[10px] text-gray-300">
                      {feedback.date}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
