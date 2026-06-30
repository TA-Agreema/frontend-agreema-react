import { X, FileText, Download, Calendar, Tag } from "lucide-react";
import { useEffect } from "react";
import type { Termination } from "@/types/termination";

interface Props {
    termination: Termination;
    onClose: () => void;
}

export default function TerminationDetailModal({ termination, onClose }: Props) {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const appBaseUrl = baseUrl.replace(/\/api\/?$/, "");
    const rawDocumentPath = termination.termination_document_path?.trim();
    const isAbsoluteDocumentUrl = !!rawDocumentPath && /^https?:\/\//i.test(rawDocumentPath);
    const normalizedRelativePath = rawDocumentPath
        ? rawDocumentPath.replace(/^\/+/, "").replace(/^storage\//, "")
        : null;

    const documentUrl = rawDocumentPath
        ? (isAbsoluteDocumentUrl
            ? rawDocumentPath
            : `${appBaseUrl}/storage/${normalizedRelativePath}`)
        : null;

    const isPdf = rawDocumentPath?.toLowerCase().includes(".pdf");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 flex flex-col overflow-hidden max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Detail Terminasi</h3>
                        <p className="text-sm text-red-700">{termination.termination_number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-1">Judul</h4>
                        <p className="text-base text-gray-900">{termination.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1"><Tag className="w-4 h-4" /> Alasan</h4>
                            <p className="text-sm text-gray-900 capitalize">{termination.termination_reason.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> Tanggal Efektif</h4>
                            <p className="text-sm text-gray-900">{termination.effective_date}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-1">Catatan Tambahan</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                            {termination.termination_note || "-"}
                        </p>
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
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
                                            className="mt-2 text-sm text-red-600 hover:underline"
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

                <div className="p-4 border-t bg-gray-50 text-right">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
