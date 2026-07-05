import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  FileText,
  Download,
  // FileSignature,
  // CalendarDays,
} from "lucide-react";
import {
  fetchManagerContractDetail,
  submitContractReview,
  downloadManagerContractPdf,
  type ManagerContractDetail,
} from "@/services/manager.service";
import { downloadBlobResponse } from "@/services/download.service";
// import type { Addendum } from "@/pages/contracts/ContractListPage";
import ContractApprovalSignPage from "@/pages/contracts/ContractApprovalSignPage";
import ContractRejectPage from "@/pages/contracts/ContractRejectPage";
import type { StatusEntry, FeedbackEntry } from "@/types/statusLogs";
import ReviewRightSidebar from "@/components/ReviewRightSidebarManager";
import ConfirmModal from "@/components/modal/common/ConfirmModal";
import { AlertCircle } from "lucide-react";
import { ContractDocumentPreview } from "@/components/editor/ContractDocumentPreview";
import { Button } from "@/components/ui/button";
import { ContractSignatureBox } from "@/components/editor/contract/ContractSignerFields";

export default function ContractReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<ManagerContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contractHtml, setContractHtml] = useState("");

  const [notes, setNotes] = useState("");
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [statusLogs, setStatusLogs] = useState<StatusEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);

  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!contract || !id) return;
    setIsDownloading(true);
    try {
      const res = await downloadManagerContractPdf(Number(id));
      const filename = contract.title
        ? `Kontrak_${contract.title.replace(/\s+/g, "_")}.pdf`
        : `Kontrak_${id}.pdf`;
      downloadBlobResponse(res, filename);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengunduh dokumen");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const isMounted = true;
    const loadContract = async () => {
      try {
        const data = await fetchManagerContractDetail(Number(id));
        if (!isMounted) return;

        setContract(data);
        if (data.status_logs) setStatusLogs(data.status_logs);
        if (data.content) setContractHtml(data.content);

        if (data.signers && data.signers.length > 0) {
          const allReviews: FeedbackEntry[] = [];
          data.signers.forEach((s) => {
            if (s.reviews && s.reviews.length > 0) {
              const author =
                s.signer_type === "internal" && s.user
                  ? s.user.name
                  : s.signer_name || s.external_email || "Eksternal";
              const role =
                s.signer_type === "internal" && s.user
                  ? s.user.job_title || "Internal"
                  : s.signer_role || "Eksternal";

              s.reviews.forEach((r) => {
                if (r.notes || r.review_document_url) {
                  allReviews.push({
                    id: r.id,
                    author: author ?? "Reviewer",
                    role: role ?? "Reviewer",
                    type: (r.status as FeedbackEntry["type"]) ?? "note",
                    typeLabel:
                      r.status === "revised" || r.status === "revision"
                        ? "Revisi"
                        : r.status === "rejected"
                          ? "Ditolak"
                          : "Catatan",
                    message: r.notes ?? "",
                    date: r.reviewed_at,
                    review_document_url: r.review_document_url ?? undefined,
                  });
                }
              });
            }
          });
          setFeedbacks(allReviews.sort((a, b) => Number(b.id) - Number(a.id)));
        }
      } catch (error) {
        console.error("Failed to load contract", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContract();
  }, [id]);

  const handleAction = async (status: "approved" | "revised") => {
    if ((status === "revised") && !notes.trim() && !reviewFile) {
      setSubmitError("Catatan atau dokumen revisi wajib diisi");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitContractReview(Number(id), { status, notes, reviewDocument: reviewFile });

      if (status === "revised") {
        toast.info("Revisi diminta.", {
          description: "Revisi kontrak telah dikirim ke pembuat kontrak.",
          duration: 5000,
        });
      }
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
        <img
          src="/Agreema.svg"
          alt="Agreema Logo"
          className="h-8 w-auto shrink-0"
        />
        <div className="border-l border-gray-300 pl-4 flex-1">
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Peninjauan Dokumen: {contract.title}
          </h1>
          <p className="text-xs text-gray-500">
            {contract.contract_number || "Draft"} • Dibuat oleh {contract.created_by}
          </p>
        </div>
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-colors"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Viewer (Left) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex flex-col items-center gap-6">
          <div className="w-full overflow-x-auto pb-2 shrink-0">
            <ContractDocumentPreview
              html={contractHtml}
              paperSize={contract.paper_size}
              className="border border-gray-200 shadow-sm"
            >

              {/* Addendum */}
              {/* {contract.addendums && contract.addendums.length > 0 && (
              <div className="border-t border-gray-200 px-8 py-8 bg-emerald-50/40">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">
                      Daftar Addendum
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Addendum yang melekat pada kontrak ini.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileSignature className="h-3.5 w-3.5" />
                    {contract.addendums.length} addendum
                  </span>
                </div>
                <div className="space-y-3">
                  {contract.addendums.map((addendum: Addendum) => (
                    <div
                      key={addendum.id}
                      className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            {addendum.addendum_number}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {addendum.title}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                            {addendum.description || "Tidak ada deskripsi."}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Dibuat: {addendum.created_at}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Efektif: {addendum.effective_date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Tanda Tangan */}
            {contract.signers && contract.signers.length > 0 && (
              <div className="border-t border-gray-200 px-8 py-10">
                <h2 className="text-center text-sm font-semibold tracking-widest text-gray-700 uppercase mb-8">
                  Tanda Tangan
                </h2>
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
                  <div className="flex justify-around gap-6 flex-wrap">
                    {contract.signers.map((signer) => {
                      const latestSignature =
                        signer.signatures && signer.signatures.length > 0
                          ? signer.signatures.filter((s) => (s.iteration ?? 1) > 0).slice(-1)[0] ?? null
                          : null;
                      const signatureImage = latestSignature?.signature_path ?? null;
                      const signedAt = latestSignature?.signed_at ?? null;

                      return (
                        <ContractSignatureBox
                          key={signer.id}
                          isExternal={signer.signer_type === "external"}
                          name={
                            signer.signer_type === "internal"
                              ? signer.user?.name
                              : signer.signer_name || undefined
                          }
                          title={
                            signer.signer_type === "internal"
                              ? signer.user?.job_title || undefined
                              : signer.signer_role || undefined
                          }
                          email={signer.external_email || undefined}
                          date={signedAt || undefined}
                          signaturePath={signatureImage}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </ContractDocumentPreview>
          </div>
        </div>

        {/* ── CALL SIDEBAR BARU DI SINI ── */}
        <div className="w-96 h-full overflow-hidden">
          <ReviewRightSidebar
            statusLogs={statusLogs}
            feedbacks={feedbacks}
            notes={notes}
            onNotesChange={(v) => {
              setNotes(v);
              if (submitError) setSubmitError(null);
            }}
            reviewFile={reviewFile}
            onReviewFileChange={(f) => {
              setReviewFile(f);
              if (submitError) setSubmitError(null);
            }}
            submitError={submitError}
            isSubmitting={isSubmitting}
            contractStatus={contract.status}
            onRevise={handleRevisionRequest}
            onReject={() => setShowRejectModal(true)}
            onApprove={() => setShowSignModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      {showSignModal && (
        <ContractApprovalSignPage
          contractId={Number(id)}
          onClose={() => setShowSignModal(false)}
          onSuccess={async () => {
            setShowSignModal(false);
            // await loadContract();
            navigate("/approvals");
          }}
        />
      )}

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
            navigate("/contracts/archive");
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
