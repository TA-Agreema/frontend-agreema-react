import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Info,
  Loader2,
  PenTool,
  Trash2,
  Upload,
} from "lucide-react";
import {
  fetchManagerContractDetail,
  submitManagerContractSignature,
  submitManagerSignedDocument,
  type ManagerContractDetail,
} from "@/services/manager.service";
import {
  submitExternalContractSignature,
  submitExternalSignedDocument,
  fetchExternalContractPreview,
} from "@/services/external.service";
import api from "@/lib/axios";

type SignMode = "digital" | "upload";

interface ContractApprovalSignPageProps {
  onClose?: () => void;
  onSuccess?: (contractStatus?: string) => void;
  contractId?: number;
  token?: string;
  contractTitle?: string;
  contractNumber?: string;
}

export default function ContractApprovalSignPage({
  onClose,
  onSuccess,
  contractId,
  token,
  contractTitle,
  contractNumber,
}: ContractApprovalSignPageProps) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const id = contractId ? String(contractId) : paramId;
  const isExternalMode = !!token;
  const signatureRef = useRef<SignatureCanvas>(null);

  const [contract, setContract] = useState<ManagerContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(!isExternalMode);
  const [mode, setMode] = useState<SignMode>("digital");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Menyimpan pesan sukses + status kontrak dari response
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resultContractStatus, setResultContractStatus] = useState<
    string | null
  >(null);

  // Metode TTD yang sudah dipakai pihak internal — agar pihak eksternal
  // diarahkan memakai metode yang sama untuk konsistensi dokumen.
  const [internalSignatureType, setInternalSignatureType] = useState<
    "canvas" | "upload" | null
  >(null);

useEffect(() => {
    if (isExternalMode) {
      if (!token) {
        setTimeout(() => {
          setErrorMessage("Token tidak ditemukan.");
          setIsLoading(false);
        }, 0);
        return;
      }

      const loadExternalPreview = async () => {
        setIsLoading(true);
        try {
          const data: any = await fetchExternalContractPreview(token);
          const type = data?.internal_signature_type;
          if (type === "canvas" || type === "upload") {
            setInternalSignatureType(type);
            // Samakan metode default dengan yang sudah dipakai internal
            setMode(type === "canvas" ? "digital" : "upload");
          }
        } catch (error) {
          console.error("Failed to load external preview", error);
          // Tidak menampilkan error blocking di sini — halaman tetap bisa
          // dipakai dengan toggle digital/upload default jika preview gagal.
        } finally {
          setIsLoading(false);
        }
      };

      loadExternalPreview();
      return;
    }

    if (!id) {
      setTimeout(() => {
        setErrorMessage("ID kontrak tidak ditemukan.");
        setIsLoading(false);
      }, 0);
      return;
    }

    const loadContract = async () => {
      try {
        const data = await fetchManagerContractDetail(Number(id));
        setContract(data);
      } catch (error) {
        console.error("Failed to load contract", error);
        setErrorMessage("Gagal memuat kontrak yang akan ditandatangani.");
      } finally {
        setIsLoading(false);
      }
    };

    loadContract();
  }, [id, isExternalMode]);

  const handleDownload = async () => {
    console.log("handleDownload called", { isExternalMode, id, token });
    if (!isExternalMode && !id) return;
    setIsDownloading(true);
    try {
      if (isExternalMode) {
      // ✅ Download via token eksternal
      const res = await api.get(`/external/contracts/download`, {
        params: { token },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${contractTitle || "kontrak"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } else {
      // Download via manager endpoint
      const res = await api.get(`/manager/contracts/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${contract?.contract_number || "kontrak"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  } catch {
    setErrorMessage("Gagal mengunduh dokumen. Coba lagi.");
  } finally {
    setIsDownloading(false);
  }
};

  const handleSubmit = async () => {
    if (!isExternalMode && !id) {
      setErrorMessage("ID kontrak tidak ditemukan.");
      return;
    }

    if (mode === "digital") {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        setErrorMessage("Silakan buat tanda tangan terlebih dahulu.");
        return;
      }
    }

    if (mode === "upload" && !uploadFile) {
      setErrorMessage("Silakan upload dokumen PDF yang sudah ditandatangani.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "upload") {
        // ── ALUR Upload dokumen PDF final yang sudah TTD kedua pihak ──
        const formData = new FormData();
        formData.append("signed_document", uploadFile!);
        formData.append("signature_type", "physical");

        if (isExternalMode) {
          const response = await submitExternalSignedDocument(token!, formData);
          const status = response.contract_status;
          setResultContractStatus(status);
          const msg =
            status === "active"
              ? "Dokumen berhasil diupload. Kontrak sekarang telah aktif dan berlaku."
              : "Dokumen berhasil diupload. Pihak kedua akan menerima email konfirmasi.";
          setSuccessMessage(msg);
          toast.success("Dokumen berhasil diupload!", {
            description: msg,
            duration: 5000,
          });
          if (onSuccess) onSuccess(status);
        } else {
          const response = await submitManagerSignedDocument(
            Number(id),
            formData,
          );
          const status = response?.contract_status;
          setResultContractStatus(status ?? null);
          const successMsg =
            "Dokumen berhasil diupload. Pihak eksternal akan menerima email konfirmasi untuk menyetujui kontrak.";
          setSuccessMessage(successMsg);
          toast.success("Dokumen berhasil diupload!", {
            description: successMsg,
            duration: 5000,
          });
          if (onSuccess) onSuccess(status);
        }
      } else {
        // Alur TTD Digital
        const signPayload = {
          signature_type: "canvas" as const,
          signature_data: signatureRef.current!.toDataURL("image/png"),
        };

        if (isExternalMode) {
          const response = await submitExternalContractSignature(
            token!,
            signPayload,
          );
          const status = response.contract_status;
          setResultContractStatus(status);
          const msg =
            status === "active"
              ? "Tanda tangan berhasil. Kontrak sekarang telah aktif dan berlaku."
              : "Tanda tangan berhasil disimpan. Kontrak menunggu penandatanganan pihak lain.";
          setSuccessMessage(msg);
          if (onSuccess) onSuccess(status);
        } else {
          await submitManagerContractSignature(Number(id), signPayload);
          setSuccessMessage("Kontrak berhasil ditandatangani.");

          toast.success("Tanda tangan berhasil!", {
            description:
              "Kontrak telah ditandatangani dan dikirim ke pihak kedua.",
            duration: 5000,
          });

          if (onSuccess) onSuccess();
        }
      }
    } catch (error: unknown) {
      let message = "Gagal mengirim. Coba lagi.";
      if (typeof error === "object" && error !== null) {
        // @ts-expect-error axios shape
        message = error?.response?.data?.message || message;
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isExternalMode && !contract) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 rotate-180" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Kontrak tidak ditemukan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Halaman tanda tangan tidak bisa dibuka karena data kontrak tidak
              tersedia.
            </p>
          </div>
          <button
            onClick={() => (onClose ? onClose() : navigate("/approvals"))}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  // Layar sukses — tampil setelah TTD berhasil dan onSuccess tidak disediakan
  if (successMessage && !onSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl text-center space-y-5">
          <div
            className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
              resultContractStatus === "active"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-sky-50 text-sky-600"
            }`}
          >
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {resultContractStatus === "active"
                ? "Kontrak Aktif"
                : "Tanda Tangan Tersimpan"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{successMessage}</p>
          </div>
          <button
            onClick={() => navigate("/approvals")}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
            <button
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Kontrak Disetujui
              </p>
              <p className="text-xs text-slate-500">
                Pilih metode tanda tangan untuk menyelesaikan persetujuan
                kontrak
              </p>
            </div>
          </div>

          <div className="px-4 pt-3">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                {/* Fallback ke props jika mode eksternal (contract === null) */}
                <h2 className="truncate text-base font-semibold text-slate-900">
                  {contract?.title ?? contractTitle ?? "-"}
                </h2>
                <p className="text-xs text-slate-500">
                  Nomor: {contract?.contract_number ?? contractNumber ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 px-4 pt-3">
            <div className="grid grid-cols-2 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setMode("digital")}
                disabled={isExternalMode && internalSignatureType === "upload"}
                title={
                  isExternalMode && internalSignatureType === "upload"
                    ? "Pihak internal menggunakan upload manual — gunakan metode yang sama untuk konsistensi dokumen."
                    : undefined
                }
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${mode === "digital" ? "bg-emerald-700 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <PenTool className="h-4 w-4" />
                Tanda Tangan Digital
              </button>
              <button
                onClick={() => setMode("upload")}
                disabled={isExternalMode && internalSignatureType === "canvas"}
                title={
                  isExternalMode && internalSignatureType === "canvas"
                    ? "Pihak internal menggunakan tanda tangan digital — gunakan metode yang sama untuk konsistensi dokumen."
                    : undefined
                }
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-l border-slate-200 ${mode === "upload" ? "bg-emerald-700 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <Upload className="h-4 w-4" />
                Upload Manual
              </button>
            </div>
            {isExternalMode && internalSignatureType && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />     
                <p className="text-xs text-amber-800 leading-relaxed">
                  Pihak internal sudah menandatangani menggunakan{" "}           
                  <strong className="font-semibold">
                    {internalSignatureType === "canvas" ? "tanda tangan digital" : "upload manual"}
                  </strong>
                  . Gunakan metode yang sama agar kedua pihak konsisten.
                </p>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 pt-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {mode === "digital"
                    ? "Gambar Tanda Tangan Anda"
                    : "Upload Dokumen Bertanda Tangan"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === "digital"
                    ? "Gunakan mouse atau touchscreen untuk menggambar tanda tangan dan jangan terlalu kecil agar hasilnya terlihat jelas."
                    : "Unggah file dokumen yang sudah ditandatangani untuk melanjutkan proses."}
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {mode === "digital" ? (
                <>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 sm:p-3">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className:
                          "w-full h-32 rounded-lg bg-white border border-slate-200 touch-none",
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Tanda tangan tersimpan secara otomatis.
                    </span>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus & Ulangi
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Download Dokumen */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Download Dokumen
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Unduh dokumen kontrak dalam format PDF
                      </p>
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download Dokumen
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Tanda Tangan Manual */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Tanda Tangan Manual
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cetak dokumen, tanda tangan, lalu scan kembali (PDF atau
                        foto)
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Upload Dokumen */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Upload Dokumen Final
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload dokumen PDF yang sudah ditandatangani oleh kedua
                        pihak. Dokumen ini akan dikirimkan ke pihak eksternal
                        untuk dikonfirmasi.
                      </p>
                      <div className="mt-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                          <FileText className="h-5 w-5" />
                        </div>
                        {/* ✅ Hanya PDF */}
                        <p className="text-xs text-slate-500">
                          Format: PDF (maks. 20MB)
                        </p>
                        {uploadFile && (
                          <p className="mt-1 text-xs font-medium text-emerald-700 truncate px-2">
                            ✓ {uploadFile.name}
                          </p>
                        )}
                        <label className="mt-3 inline-flex items-center gap-2 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                          <Upload className="h-4 w-4" />
                          Pilih File PDF
                          <input
                            type="file"
                            accept=".pdf" // ✅ Hanya PDF
                            onChange={(e) =>
                              setUploadFile(e.target.files?.[0] ?? null)
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-700">
                {mode === "upload" ? (
                  <>
                    <strong>Catatan:</strong> Dokumen yang diupload adalah
                    dokumen final yang sudah ditandatangani kedua pihak secara
                    langsung. Setelah diupload, pihak eksternal akan menerima
                    email konfirmasi.
                  </>
                ) : (
                  <>
                    <strong>Catatan:</strong> Tanda tangan digital memiliki
                    kekuatan hukum yang sama dengan tanda tangan fisik. Dengan
                    menandatangani, Anda menyetujui isi kontrak ini.
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => (onClose ? onClose() : navigate("/approvals"))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-w-55"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {mode === "upload" ? "Submit Dokumen" : "Submit Tanda Tangan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi TTD */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === "upload"
                  ? "Konfirmasi Upload Dokumen"
                  : "Konfirmasi Tanda Tangan"}
              </h2>
              <p className="text-sm text-gray-500 mt-1 text-center">
                {mode === "upload"
                  ? "Apakah Anda yakin ingin mengupload dokumen ini? Tindakan ini tidak dapat dibatalkan."
                  : "Apakah Anda yakin ingin menandatangani kontrak ini? Tanda tangan tidak dapat diubah setelah disubmit."}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {mode === "upload" ? "Ya, Upload" : "Yakin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
