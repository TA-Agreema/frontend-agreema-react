import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  MailCheck,
} from "lucide-react";
import {
  fetchExternalContractPreview,
  submitExternalContractReview,
} from "@/services/external.service";
import type { ExternalContractDetail } from "@/types/external";

// Define TipTap extensions similarly to Editor but without UI plugins
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import { isAxiosError } from "axios";

// Interface untuk data peninjauan
interface ReviewItem {
  id: number;
  author: string;
  status: string;
  notes: string;
  date: string;
}

export default function ContractReviewDetailExternalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [contractDetail, setContractDetail] = useState<ExternalContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Review form state
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Read-only editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      HorizontalRule,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
    ],
    content: "",
    editable: false,
    editorProps: {
      attributes: {
        class: "outline-none text-sm leading-7 text-gray-800 p-8 min-h-[800px]",
      },
    },
  });

  useEffect(() => {
    if (!token || !editor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!token) setErrorMsg("Token tidak ditemukan di URL.");
      setIsLoading(false);
      return;
    }

    const loadContract = async () => {
      try {
        const data = await fetchExternalContractPreview(token);
        setContractDetail(data);
        if (data.data?.content) {
          editor.commands.setContent(data.data.content);
        }
      } catch (error: unknown) {
        console.error("Failed to load contract", error);

        let errorMessage = "Gagal memuat kontrak. Token mungkin tidak valid atau sudah kadaluarsa.";
        if (isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        setErrorMsg(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, [token, editor]);

  const handleAction = async (status: "approved" | "revised") => {
    if (!token) return;

    if (status === "revised" && !notes.trim()) {
      setSubmitError("Catatan wajib diisi jika meminta revisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitExternalContractReview({ token, status, notes });
      setIsSubmitted(true);
    } catch (error: unknown) {
      let errorMessage = "Gagal mengirim tanggapan. Coba lagi.";
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-6">{errorMsg}</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 px-4 text-center">
        <MailCheck className="h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih</h2>
        <p className="text-gray-600">
          Tanggapan Anda atas dokumen ini telah berhasil dikirim.
        </p>
      </div>
    );
  }

  if (!contractDetail) return null;

  const contract = contractDetail.data;
  // Kumpulkan semua catatan dari signers
  const allReviews: ReviewItem[] = [];
  contract.signers?.forEach((s) => {
    s.reviews?.forEach((r) => {
      if (r.notes) {
        allReviews.push({
          id: r.id,
          author: s.name || (s.type === "internal" ? "Pihak Internal" : "Pihak Eksternal"),
          status: r.status,
          notes: r.notes,
          date: r.created_at,
        });
      }
    });
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-6 h-14 bg-white border-b border-gray-200 shrink-0 z-10 gap-4">
        <img
          src="/Agreema.svg"
          alt="Agreema Logo"
          className="h-8 w-auto shrink-0"
        />
        <div className="border-l border-gray-300 pl-4">
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Peninjauan Dokumen: {contract.title}
          </h1>
          <p className="text-xs text-gray-500">
            {contract.contract_number || "Draft"} • Dibuat oleh {contract.created_by}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Viewer (Left Side) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
          <div className="w-full max-w-[816px] bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden shrink-0">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Action Panel (Right Side) */}
        <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Keputusan Anda
            </h2>
            <p className="text-xs text-gray-500">
              Silakan periksa dokumen dan berikan keputusan apakah dokumen ini disetujui atau perlu direvisi.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Input Catatan */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Catatan
                <span className="text-gray-400 font-normal ml-1">
                  (Wajib jika minta revisi)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan perbaikan jika ada..."
                className="w-full h-32 text-sm border border-gray-200 rounded-lg p-3 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              />
              {submitError && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {submitError}
                </p>
              )}
            </div>

            {/* Riwayat Catatan */}
            {allReviews.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Riwayat Catatan Dokumen
                </h3>
                <div className="space-y-4">
                  {allReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 text-xs">
                          {rev.author}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${rev.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : rev.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {rev.status === "revised" || rev.status === "revision" ? "Revisi" : rev.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {rev.notes || "Tidak ada catatan."}
                      </p>
                      <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(rev.date).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-5 border-t border-gray-200 bg-white flex gap-3">
            <button
              onClick={() => handleAction("revised")}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <AlertCircle className="h-4 w-4" /> Minta Revisi
            </button>

            <button
              onClick={() => handleAction("approved")}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Setujui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
