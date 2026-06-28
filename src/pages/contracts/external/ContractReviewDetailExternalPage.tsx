import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  MailCheck,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import {
  fetchExternalContractPreview,
  submitExternalContractReview,
} from "@/services/external.service";
import type { ExternalContractDetail } from "@/types/external";
import { isAxiosError } from "axios";
import ContractApprovalSignPage from "@/pages/contracts/ContractApprovalSignPage";
import ConfirmModal from "@/components/modal/common/ConfirmModal";
import { ContractDocumentPreview } from "@/components/editor/ContractDocumentPreview";
// import { AlertCircle } from "lucide-react";

// Interface untuk data peninjauan
interface ReviewItem {
  id: number;
  author: string;
  status: string;
  notes: string;
  date: string;
  review_document_url?: string | null;
}

export default function ContractReviewDetailExternalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [contractDetail, setContractDetail] = useState<ExternalContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorTitle] = useState<string>("Token Kedaluwarsa");
  const [errorVariant] = useState<"info" | "warning">("warning");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Review form state
  const [notes, setNotes] = useState("");
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contractHtml, setContractHtml] = useState("");

  //Pop up Signature Modal
  const [showSignModal, setShowSignModal] = useState(false);

  //Pop up Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [hasSignedByCanvas, setHasSignedByCanvas] = useState(false);

  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);

  useEffect(() => {
  if (!token) {
    setTimeout(() => {
      setErrorMsg("Token tidak ditemukan di URL.");
      setIsLoading(false);
    }, 0);
    return;
  }
  const run = async () => {
    try {
      const data = await fetchExternalContractPreview(token);
      setContractDetail(data);
      if (data.data?.content) {
        setContractHtml(data.data.content);
      }
    } catch (error: unknown) {
      let errorMessage = "Gagal memuat kontrak. Token mungkin tidak valid atau sudah kedaluwarsa.";
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  run();
}, [token]);

  const handleAction = async (status: "approved" | "revised" | "confirmed") => {
    if (!token) return;

    if (status === "revised" && !notes.trim() && !reviewFile) {
      setSubmitError("Catatan atau dokumen revisi wajib diisi jika meminta revisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitExternalContractReview({ token, status, notes, reviewDocument: reviewFile });

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

  const handleRevisionRequest = () => {
    if (!notes.trim() && !reviewFile) {
      setSubmitError("Catatan atau dokumen revisi wajib diisi");
      return;
    }

    setShowRevisionConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (errorMsg) {
    const isInfo = errorVariant === "info";
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-lg flex flex-col items-center">
          {isInfo ? (
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          )}
          <h2 className="text-lg font-bold text-gray-800 mb-2">{errorTitle}</h2>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
        </div>
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
  // const signMethod = contract.signers
  //   ?.filter((s) => s.signer_type === "internal")
  //   .flatMap((s) => s.signatures ?? [])
  //   .sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime())[0]
  //   ?.signature_type ?? null; // 'canvas' | 'upload' | null
  // Kumpulkan semua catatan dari signers
  const allReviews: ReviewItem[] = [];
  contract.signers?.forEach((s) => {
    s.reviews?.forEach((r) => {
      if (r.notes || r.review_document_url) {
        allReviews.push({
          id: r.id,
          author: s.name || (s.signer_type === "internal" ? "Pihak Internal" : "Pihak Eksternal"),
          status: r.status,
          notes: r.notes || "",
          date: r.reviewed_at,
          review_document_url: r.review_document_url,
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
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex flex-col items-center gap-6">
          <div className="w-full overflow-x-auto pb-2 shrink-0">
            <ContractDocumentPreview
              html={contractHtml}
              paperSize={contract.paper_size}
              className="border border-gray-200 shadow-sm"
            >
            {/* section tanda tangan */}
            {contract.signers && contract.signers.length > 0 && (
              <div className="border-t border-gray-200 px-8 py-10">
                <h2 className="text-center text-sm font-semibold tracking-widest text-gray-700 uppercase mb-8">
                  Tanda Tangan
                </h2>

                {/* Menampilkan dokumen fisik sudah diupload */}
                {contract.signed_document_url ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 w-full max-w-md">
                      <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          Dokumen Bertanda Tangan Telah Diupload
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Dokumen fisik yang sudah ditandatangani kedua pihak tersedia.
                        </p>
                      </div>
                    </div>

                    <a href={contract.signed_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Lihat Dokumen Bertanda Tangan
                    </a>
                  </div>
                ) : (
                  /* Alur lama: TTD digital per signer */
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
                      console.log('signer:', signer.id, signer.signer_type, 'signatures:', signer.signatures, 'isSigned:', isSigned);

                      return (
                        <div
                          key={signer.id}
                          className="flex flex-col items-start gap-2 min-w-50"
                        >
                          {/* Tanggal — tampil jika sudah tanda tangan */}
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

                          {/* Area Tanda Tangan */}
                          <div
                            className={`border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden ${isSigned ? "w-45 h-25" : "w-full h-25"
                              }`}
                          >
                            {isSigned ? (
                              // Siapapun yang sudah TTD — tampilkan gambar
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

                          {/* Badge status */}
                          {!isSigned && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${signer.signer_type === "external"
                                ? "bg-sky-100 text-sky-600"
                                : "bg-gray-100 text-gray-400"
                                }`}
                            >
                              <Clock className="h-3 w-3" />
                              {signer.signer_type === "external"
                                ? "Menunggu via Token"
                                : "Belum Ditandatangani"}
                            </span>
                          )}

                          <p className="text-sm font-bold text-gray-900 mt-1">{name}</p>
                          {role && <p className="text-xs text-gray-500">{role}</p>}
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
            </ContractDocumentPreview>
          </div>
        </div>

        {/* Action Panel (Right Side) */}
        <div className="w-95 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Keputusan Anda
            </h2>
            <p className="text-xs text-gray-500">
              Silakan periksa dokumen dan berikan keputusan apakah dokumen ini disetujui atau perlu direvisi.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
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
                      {rev.notes && (
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {rev.notes}
                        </p>
                      )}
                      {rev.review_document_url && (
                        <a
                          href={rev.review_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          Lihat Dokumen Revisi
                        </a>
                      )}
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
          <div className="p-5 border-t border-gray-200 bg-white flex flex-col gap-3">
            <div className="flex flex-col">
              {/* Input Catatan */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Catatan
                  <span className="text-gray-400 font-normal ml-1">
                    {reviewFile ? "(Opsional, ada file)" : "(Wajib jika minta revisi)"}
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan perbaikan jika ada..."
                  className="w-full h-28 text-sm border border-gray-200 rounded-lg p-3 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Upload Dokumen Revisi */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Lampiran Dokumen Revisi
                  <span className="text-gray-400 font-normal ml-1">(Opsional)</span>
                </p>
                {reviewFile ? (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-blue-700 truncate flex-1">{reviewFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setReviewFile(null)}
                      className="text-blue-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all"
                  >
                    <Paperclip className="h-4 w-4" />
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
                    setReviewFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-500 mb-4 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleRevisionRequest()}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                <AlertCircle className="h-4 w-4" /> Minta Revisi
              </button>
            </div>

            {/* Kondisi: ada doc upload DAN belum TTD canvas → popup konfirmasi upload manual */}
            {contract.signed_document_url && !hasSignedByCanvas ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Setujui Kontrak
              </button>
            ) : (
              <button
                onClick={() => setShowSignModal(true)}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Setujui &amp; Tanda Tangan Digital
              </button>
            )}
          </div>
        </div>
      </div>

      {/*Popup Konfirmasi — hanya muncul jika signMethod = upload */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Konfirmasi Persetujuan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin <strong>menyetujui</strong> kontrak ini?
              Dengan menyetujui, kontrak akan resmi aktif dan berlaku.
            </p>

            {submitError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {submitError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleAction("confirmed")}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pakai ContractApprovalSignPage langsung dengan prop token */}
      {showSignModal && token && (
        <ContractApprovalSignPage
          token={token}
          contractTitle={contract.title}
          contractNumber={contract.contract_number}
          onClose={() => setShowSignModal(false)}
          onSuccess={async () => {
            setShowSignModal(false);
            setHasSignedByCanvas(true); // tandai sudah TTD canvas

            // Langsung selesai tanpa konfirmasi tambahan
            setIsSubmitted(true);
          }}
        />
      )}

      <ConfirmModal
        isOpen={showRevisionConfirm}
        title="Kirim Permintaan Revisi?"
        message={
          <>
            Permintaan revisi akan dikirim kepada pembuat kontrak.
            Pastikan catatan dan dokumen revisi sudah benar.
          </>
        }
        icon={AlertCircle}
        tone="warning"
        confirmLabel="Ya, Kirim Revisi"
        loadingLabel="Mengirim..."
        isLoading={isSubmitting}
        onClose={() => setShowRevisionConfirm(false)}
        onConfirm={async () => {
          setShowRevisionConfirm(false);
          await handleAction("revised");
        }}
      />
    </div>
  );
}
