import { X, FileText, Calendar, Download } from "lucide-react";
import { useEffect } from "react";
import type { Addendum } from "@/pages/contracts/ContractListPage";

interface AddendumDetailModalProps {
    addendum: Addendum;
    onClose: () => void;
}

export default function AddendumDetailModal({
    addendum,
    onClose,
}: AddendumDetailModalProps) {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
    const appBaseUrl = baseUrl.replace(/\/api\/?$/, "");
    const rawDocumentPath = addendum.document_path?.trim();
    const isAbsoluteDocumentUrl = !!rawDocumentPath && /^https?:\/\//i.test(rawDocumentPath);
    const normalizedRelativePath = rawDocumentPath
        ? rawDocumentPath.replace(/^\/+/, "").replace(/^storage\//, "")
        : null;

    const documentUrl = rawDocumentPath
        ? (isAbsoluteDocumentUrl
            ? rawDocumentPath
            : `${appBaseUrl}/storage/${normalizedRelativePath}`)
        : null;

    const isPdf = addendum.document_path?.toLowerCase().endsWith(".pdf");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-2xl mx-4 rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Detail Addendum
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {addendum.addendum_number}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-6 px-6 py-5 overflow-y-auto">
                    {/* Info Sec */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Judul Addendum
                            </span>
                            <p className="text-sm text-foreground font-medium">
                                {addendum.title}
                            </p>
                        </div>
                        {/* <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tanggal Dibuat
                            </span>
                            <div className="flex items-center gap-1.5 text-sm text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {addendum.created_at}
                            </div>
                        </div> */}
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tanggal Efektif
                            </span>
                            <div className="flex items-center gap-1.5 text-sm text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {addendum.effective_date}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Deskripsi
                        </span>
                        <div className="bg-muted/30 p-4 rounded-lg text-sm text-foreground border whitespace-pre-wrap">
                            {addendum.description || "Tidak ada deskripsi."}
                        </div>
                    </div>

                    {/* Document Preview/Link */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Dokumen Lampiran
                        </span>
                        {documentUrl ? (
                            <div className="border rounded-lg overflow-hidden flex flex-col pt-2">
                                <div className="px-4 py-2 bg-muted/30 border-b flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground truncate mr-2">
                                        {rawDocumentPath?.split("/").pop()?.split("?")[0]}
                                    </span>
                                    <a
                                        href={documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Unduh
                                    </a>
                                </div>
                                {isPdf ? (
                                    <iframe
                                        src={documentUrl}
                                        className="w-full h-[400px] bg-slate-100"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="h-[200px] flex flex-col items-center justify-center bg-slate-50 text-muted-foreground">
                                        <FileText className="h-12 w-12 mb-3 opacity-50" />
                                        <p className="text-sm">Pratinjau tidak tersedia untuk format ini.</p>
                                        <a
                                            href={documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 text-sm text-emerald-600 hover:underline"
                                        >
                                            Unduh Dokumen
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground text-sm">
                                Tidak ada dokumen terlampir.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
