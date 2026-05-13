import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import {
  fetchManagerContractDetail,
  submitContractReview,
  type ManagerContractDetail,
} from "@/services/manager.service";

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

export default function ContractReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<ManagerContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!id || !editor) return;

    const loadContract = async () => {
      try {
        const data = await fetchManagerContractDetail(Number(id));
        setContract(data);
        if (data.content) {
          editor.commands.setContent(data.content);
        }
      } catch (error) {
        console.error("Failed to load contract", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, [id, editor]);

  const handleAction = async (status: "approved" | "revised" | "rejected") => {
    if ((status === "revised" || status === "rejected") && !notes.trim()) {
      setSubmitError("Catatan wajib diisi untuk revisi atau penolakan.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitContractReview(Number(id), { status, notes });
      navigate("/approvals");
    } catch (error: unknown) {
      let msg = "Gagal mengirim ulasan. Coba lagi.";
      if (typeof error === "object" && error !== null) {
        // @ts-expect-error axios
        msg = error?.response?.data?.message || msg;
      }
      setSubmitError(msg);
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

  if (!contract) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">Kontrak tidak ditemukan.</p>
        <button
          onClick={() => navigate("/approvals")}
          className="text-emerald-600 font-medium hover:underline"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-6 h-14 bg-white border-b border-gray-200 shrink-0 z-10 gap-4">
        <button
          onClick={() => navigate("/approvals")}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Review: {contract.title}
          </h1>
          <p className="text-xs text-gray-500">
            {contract.contract_number || "Draft"} • Diajukan oleh {contract.created_by}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Viewer (Left Side) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex flex-col items-center gap-6">
          <div className="w-full max-w-[816px] bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden shrink-0">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Action Panel (Right Side) */}
        <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Panel Peninjauan
            </h2>
            <p className="text-xs text-gray-500">
              Periksa isi dokumen dan berikan keputusan Anda di bawah.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Input Catatan */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Catatan Evaluasi
                <span className="text-gray-400 font-normal ml-1">
                  (Wajib jika menolak / minta revisi)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan perbaikan atau alasan penolakan di sini..."
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
            {contract.reviews && contract.reviews.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Riwayat Catatan Sebelumnya
                </h3>
                <div className="space-y-4">
                  {contract.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900 text-xs">
                          {rev.user?.name || "System"}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${rev.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : rev.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {rev.notes || "Tidak ada catatan."}
                      </p>
                      <div className="text-[10px] text-gray-400 mt-2">
                        {new Date(rev.created_at).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-5 border-t border-gray-200 bg-white grid grid-cols-2 gap-3">
            {contract.status === "review" ? (
              <>
                <button
                  onClick={() => handleAction("rejected")}
                  disabled={isSubmitting}
                  className="col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Tolak
                </button>

                <button
                  onClick={() => handleAction("revised")}
                  disabled={isSubmitting}
                  className="col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="h-4 w-4" /> Minta Revisi
                </button>

                <button
                  onClick={() => handleAction("approved")}
                  disabled={isSubmitting}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Setujui Kontrak
                </button>
              </>
            ) : (
              <div className="col-span-2 text-center p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">
                Kontrak sudah diproses ({contract.status})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
