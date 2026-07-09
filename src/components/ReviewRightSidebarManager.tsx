import { useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, Paperclip, FileText, X } from "lucide-react";
import type { StatusEntry, FeedbackEntry } from "@/types/statusLogs";

// ── Styling helpers ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
    draft:       "bg-gray-100 text-gray-500 border border-gray-200",
    review:      "bg-amber-50 text-amber-700 border border-amber-200",
    approved:    "bg-blue-50 text-blue-700 border border-blue-200",
    signed:      "bg-purple-50 text-purple-700 border border-purple-200",
    active:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
    revision:    "bg-orange-50 text-orange-700 border border-orange-200",
    rejected:    "bg-red-50 text-red-600 border border-red-200",
    terminated:  "bg-red-50 text-red-600 border border-red-200",    
    expired:     "bg-gray-50 text-gray-500 border border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
    draft:       "bg-gray-400",
    review:      "bg-amber-400",
    approved:    "bg-blue-400",
    signed:      "bg-purple-500",
    active:      "bg-emerald-500",
    revision:    "bg-orange-400",
    rejected:    "bg-red-500",
    terminated:  "bg-red-700",
    expired:     "bg-gray-400",
};

const STATUS_LABEL: Record<string, string> = {
    draft:       "Draft",
    review:      "Ditinjau",
    revision:    "Revisi",
    approved:    "Disetujui",
    rejected:    "Ditolak",
    signed:      "Disahkan",
    active:      "Aktif",
    terminated:  "Dihentikan",
    expired:     "Berhenti",
};

const STATUS_DESC: Record<string, string> = {
  draft:       "Dokumen disimpan sebagai draft",
  review:      "Dokumen telah diajukan untuk ditinjau",
  approved:    "Dokumen telah disetujui",
  signed:      "Dokumen telah disahkan oleh semua pihak",
  active:      "Dokumen kontrak telah aktif",
  revision:    "Dokumen dikembalikan untuk direvisi",
  rejected:    "Dokumen telah ditolak",
  terminating: "Dokumen sedang dalam proses terminasi",
  terminated:  "Dokumen kontrak telah diterminasi",
  expired:     "Dokumen kontrak telah berakhir",
};

interface ReviewRightSidebarProps {
    statusLogs: StatusEntry[];
    feedbacks: FeedbackEntry[];
    notes: string;
    onNotesChange: (v: string) => void;
    submitError: string | null;
    isSubmitting: boolean;
    contractStatus: string;
    reviewFile: File | null;
    onReviewFileChange: (f: File | null) => void;
    onRevise: () => void;
    onReject: () => void;
    onApprove: () => void;
    contractTitle?: string;
}

export default function ReviewRightSidebar({
    statusLogs,
    feedbacks,
    notes,
    onNotesChange,
    submitError,
    isSubmitting,
    contractStatus,
    reviewFile,
    onReviewFileChange,
    onRevise,
    onReject,
    onApprove,
}: ReviewRightSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                                            <div className="w-px flex-1 bg-gray-200 mt-1 min-h-5" />
                                        )}
                                    </div>
                                    <div className="pb-2 min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            <span
                                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[log.new_status] || "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {STATUS_LABEL[log.new_status] ?? log.new_status.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(log.created_at).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 truncate">
                                            {log.changed_by === "System" || log.changed_by === "Admin Agreema"
                                                ? "Diperbarui otomatis oleh sistem"
                                                : `Diperbarui oleh ${log.changed_by}`}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {STATUS_DESC[log.new_status] ?? `Dokumen berpindah ke status ${STATUS_LABEL[log.new_status] ?? log.new_status}`}
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
                            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
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
                                    {feedback.message && (
                                        <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {feedback.message}
                                        </p>
                                    )}
                                    {/* Link dokumen revisi jika ada */}
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
            <div className="shrink-0 p-4 border-t border-gray-200 bg-white space-y-3">
                {/* Input Catatan Evaluasi */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Catatan Evaluasi
                        </p>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {reviewFile ? "Opsional (ada file)" : "Wajib jika revisi/tolak"}
                        </span>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Tuliskan catatan perbaikan di sini..."
                        className="w-full h-20 text-xs border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                    />
                </section>

                {/* Upload Dokumen Revisi */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Lampiran Dokumen Revisi
                        <span className="ml-1 font-normal normal-case text-gray-400">(Opsional)</span>
                    </p>

                    {reviewFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700 truncate flex-1">{reviewFile.name}</span>
                            <button
                                type="button"
                                onClick={() => onReviewFileChange(null)}
                                className="text-blue-400 hover:text-red-500 transition-colors shrink-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            Lampirkan PDF / Word
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            onReviewFileChange(file);
                            e.target.value = "";
                        }}
                    />
                </section>

                {submitError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {submitError}
                    </p>
                )}

                {/* Grid Tombol Aksi */}
                <div className="grid grid-cols-2 gap-2.5">
                    {(contractStatus === "review" || contractStatus === "approved") ? (
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
                            Kontrak sudah diproses
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}