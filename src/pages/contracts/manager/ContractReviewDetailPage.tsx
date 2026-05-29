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
  FileText,
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

import ContractApprovalSignPage from "@/pages/contracts/ContractApprovalSignPage";
import ContractRejectPage from "@/pages/contracts/ContractRejectPage";
import ContractStatusSidebar from "@/components/sidebar/ContractStatusSidebar";

export default function ContractReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<ManagerContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review form state
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  //Pop up Signature Modal
  const [showSignModal, setShowSignModal] = useState(false);

  // Pop up Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Riwayat status
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

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

  const loadContract = async () => {
    if (!id || !editor) return;
    try {
      const data = await fetchManagerContractDetail(Number(id));
      setContract(data);
      if (data.status_logs) setStatusLogs(data.status_logs);
      if (data.content) {
        editor.commands.setContent(data.content);
      }
    } catch (error) {
      console.error("Failed to load contract", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
            {contract.contract_number || "Draft"} • Diajukan oleh{" "}
            {contract.created_by}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Viewer (Left Side) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex flex-col items-center gap-6">
          <div className="w-full max-w-204 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden shrink-0">
            <EditorContent editor={editor} />

            {/* section tanda tangan di sini */}
            {contract.signers && contract.signers.length > 0 && (
              <div className="border-t border-gray-200 px-8 py-10">
                <h2 className="text-center text-sm font-semibold tracking-widest text-gray-700 uppercase mb-8">
                  Tanda Tangan
                </h2>

                {/* ── Alur baru: dokumen fisik sudah diupload ── */}
                {contract.signed_document_url ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 w-full max-w-md">
                      <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          Dokumen Bertanda Tangan Telah Diupload
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Dokumen fisik yang sudah ditandatangani kedua pihak
                          tersedia.
                        </p>
                      </div>
                    </div>

                    <a
                      href={contract.signed_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Lihat Dokumen Bertanda Tangan
                    </a>
                  </div>
                ) : (
                  /* ── Alur lama: TTD digital per signer ── */
                  <div className="flex justify-around gap-6 flex-wrap">
                    {contract.signers.map((signer) => {
                      const name =
                        signer.signer_type === "internal"
                          ? signer.user?.name
                          : signer.signer_name;
                      const role =
                        signer.signer_type === "internal"
                          ? signer.user?.job_title
                          : signer.signer_role;
                      const email = signer.external_email;

                      const latestSignature =
                        signer.signatures && signer.signatures.length > 0
                          ? signer.signatures[signer.signatures.length - 1]
                          : null;

                      const signatureImage =
                        latestSignature?.signature_path ?? null;
                      const signedAt = latestSignature?.signed_at ?? null;
                      const isSigned = !!signatureImage;

                      return (
                        <div
                          key={signer.id}
                          className="flex flex-col items-start gap-2 min-w-50"
                        >
                          <p className="text-xs text-gray-400">
                            Tanggal:{" "}
                            {isSigned && signedAt
                              ? new Date(signedAt).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : "[DD/MM/YYYY]"}
                          </p>

                          <div
                            className={`border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden ${
                              isSigned ? "w-45 h-25" : "w-full h-25"
                            }`}
                          >
                            {signer.signer_type === "internal" && isSigned ? (
                              <img
                                src={signatureImage}
                                alt="Tanda Tangan"
                                className="h-full w-full object-contain p-1"
                              />
                            ) : signer.signer_type === "external" ? (
                              signatureImage ? (
                                <img
                                  src={signatureImage}
                                  alt="Tanda Tangan Eksternal"
                                  className="max-h-16 max-w-full object-contain"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <Clock className="h-4 w-4 text-gray-300" />
                                  <span className="text-[10px] text-gray-300 uppercase tracking-widest text-center px-2">
                                    Menunggu Tanda Tangan
                                  </span>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-gray-300 uppercase tracking-widest">
                                Area Tanda Tangan
                              </span>
                            )}
                          </div>

                          {signer.signer_type === "internal" && !isSigned && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">
                              <Clock className="h-3 w-3" />
                              Belum Ditandatangani
                            </span>
                          )}
                          {signer.signer_type === "external" && !isSigned && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-600">
                              <Clock className="h-3 w-3" />
                              Menunggu via Token
                            </span>
                          )}

                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {name}
                          </p>
                          {role && (
                            <p className="text-xs text-gray-500">{role}</p>
                          )}
                          {email && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              ✉ {email}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel (Right Side) */}
        <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Riwayat Status*/}
          <div className="flex-1 h-full overflow-hidden border-r border-gray-100 bg-slate-50">
            <ContractStatusSidebar
              statusLogs={statusLogs}
              feedbacks={feedbacks}
            />
          </div>

          {/* Panel Peninjauan */}
          <div className="flex-1 h-fulloverflow-y-auto p-5 space-y-5">
            {/* Input Catatan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Catatan Evaluasi
                <span className="text-gray-400 font-normal ml-1">
                  (Wajib jika meminta revisi)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan perbaikan di sini..."
                className="w-full h-28 text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              />
              {submitError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {submitError}
                </p>
              )}
            </div>
            {/* Riwayat Catatan */}
            {contract.reviews && contract.reviews.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Riwayat Catatan Sebelumnya
                </h3>
                <div className="space-y-3">
                  {contract.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="text-sm border border-gray-100 rounded-xl p-3 bg-gray-50 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-gray-900 text-xs">
                          {rev.user?.name || "System"}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                            rev.status === "approved"
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
          {/* Action Buttons — fixed di bawah */}
          <div className="mt-auto not-last:shrink-0 p-4 border-t border-gray-200 bg-white grid grid-cols-2 gap-2.5">
            {contract.status === "review" ? (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Tolak
                </button>

                <button
                  onClick={() => handleAction("revised")}
                  disabled={isSubmitting}
                  className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  <AlertCircle className="h-3.5 w-3.5" /> Minta Revisi
                </button>

                <button
                  onClick={() => setShowSignModal(true)}
                  disabled={isSubmitting}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Setujui Kontrak
                </button>
              </>
            ) : (
              <div className="col-span-2 text-center p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">
                Kontrak sudah diproses ({contract.status})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: onSuccess memanggil loadContract() */}
      {showSignModal && (
        <ContractApprovalSignPage
          contractId={Number(id)}
          onClose={() => setShowSignModal(false)}
          onSuccess={async () => {
            setShowSignModal(false);
            await loadContract(); // tunggu data fresh → status & TTD langsung muncul
            navigate("/approvals"); // arahkan ke list setelah selesai
          }}
        />
      )}

      {/* Modal Penolakan */}
      {showRejectModal && contract && (
        <ContractRejectPage
          contractTitle={contract.title}
          contractNumber={contract.contract_number}
          onClose={() => setShowRejectModal(false)}
          onSubmit={async (reason) => {
            await submitContractReview(Number(id), {
              status: "rejected",
              notes: reason,
            });
            setShowRejectModal(false);
            navigate("/contracts/archive"); // arahkan ke arsip kontrak
          }}
        />
      )}
    </div>
  );
}
