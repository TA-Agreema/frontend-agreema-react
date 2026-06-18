import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { StatusEntry, FeedbackEntry } from "@/types/statusLogs";

// ── Styling helpers ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500 border border-gray-200",
    review: "bg-amber-50 text-amber-700 border border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    revision: "bg-orange-50 text-orange-700 border border-orange-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const STATUS_DOT: Record<string, string> = {
    draft: "bg-gray-400",
    review: "bg-amber-400",
    active: "bg-emerald-500",
    revision: "bg-orange-400",
    rejected: "bg-red-500",
    approved: "bg-emerald-500",
};

interface ReviewRightSidebarProps {
    statusLogs: StatusEntry[];
    feedbacks: FeedbackEntry[];
    notes: string;
    onNotesChange: (v: string) => void;
    submitError: string | null;
    isSubmitting: boolean;
    contractStatus: string;
    onRevise: () => void;
    onReject: () => void;
    onApprove: () => void;
}

export default function ReviewRightSidebar({
    statusLogs,
    feedbacks,
    notes,
    onNotesChange,
    submitError,
    isSubmitting,
    contractStatus,
    onRevise,
    onReject,
    onApprove,
}: ReviewRightSidebarProps) {
    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
            {/* ── Body Yang Bisa Di-scroll (Hanya Riwayat) ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

                {/* Riwayat Status */}
                <section>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Riwayat Status
                        </p>
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
                                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[log.new_status] || "bg-gray-100 text-gray-500"
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

                {/* Umpan Balik & Revisi */}
                <section>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Umpan Balik & Revisi
                        </p>
                        {feedbacks.length > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                {feedbacks.length}
                            </span>
                        )}
                    </div>

                    {feedbacks.length > 0 ? (
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
                                    <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {feedback.message}
                                    </p>
                                    <p className="text-[10px] text-gray-300">
                                        {feedback.date ? new Date(feedback.date).toLocaleString("id-ID") : ""}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400">Belum ada umpan balik.</p>
                    )}
                </section>
            </div>

            {/* ── Panel Bawah Pinned/Fixed (Input Revisi + Tombol Aksi) ── */}
            <div className="shrink-0 p-4 border-t border-gray-200 bg-white space-y-4">
                {/* Input Catatan Evaluasi */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Catatan Evaluasi
                        </p>
                        <span className="text-[10px] text-gray-400 font-normal">
                            Wajib jika meminta revisi
                        </span>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Tuliskan catatan perbaikan di sini..."
                        className="w-full h-24 text-xs border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                    />
                    {submitError && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            {submitError}
                        </p>
                    )}
                </section>

                {/* Grid Tombol Aksi */}
                <div className="grid grid-cols-2 gap-2.5">
                    {contractStatus === "review" ? (
                        <>
                            <button
                                onClick={onReject}
                                disabled={isSubmitting}
                                className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <XCircle className="h-3.5 w-3.5" /> Tolak
                            </button>

                            <button
                                onClick={onRevise}
                                disabled={isSubmitting}
                                className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <AlertCircle className="h-3.5 w-3.5" /> Minta Revisi
                            </button>

                            <button
                                onClick={onApprove}
                                disabled={isSubmitting}
                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Setujui Kontrak
                            </button>
                        </>
                    ) : (
                        <div className="col-span-2 text-center p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">
                            Kontrak sudah diproses ({contractStatus})
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}