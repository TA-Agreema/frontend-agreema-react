import { useState } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPartnerContract,
  type CreatePartnerContractPayload,
} from "@/services/contract.service";

interface AddPartnerContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPartnerContractModal({
  isOpen,
  onClose,
  onSuccess,
}: AddPartnerContractModalProps) {
  const [title, setTitle] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [status, setStatus] = useState<"signed" | "active">("signed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setContractNumber("");
    setPartnerName("");
    setStatus("signed");
    setStartDate("");
    setEndDate("");
    setDocument(null);
    setNotes("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Judul kontrak wajib diisi.";
    if (!contractNumber.trim()) newErrors.contractNumber = "Nomor kontrak wajib diisi.";
    if (!partnerName.trim()) newErrors.partnerName = "Nama mitra wajib diisi.";
    if (!document) newErrors.document = "Dokumen kontrak (PDF) wajib diunggah.";
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setDocument(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, document: "Berkas harus berformat PDF." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, document: "Ukuran berkas maksimal 10MB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, document: "" }));
    setDocument(file);
  };

  const handleSubmit = async () => {
    if (!validate() || !document) return;

    setIsSubmitting(true);
    try {
      const payload: CreatePartnerContractPayload = {
        title: title.trim(),
        contract_number: contractNumber.trim(),
        partner_name: partnerName.trim(),
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        document,
        notes: notes.trim() || null,
      };

      await createPartnerContract(payload);

      toast.success("Kontrak mitra berhasil ditambahkan.", {
        description: `${title} kini berstatus ${status === "active" ? "aktif" : "disahkan"}.`,
        duration: 5000,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      let message = "Gagal menambahkan kontrak mitra. Coba lagi.";
      if (typeof error === "object" && error !== null) {
        // @ts-expect-error allow reading axios-like error shape
        message = error?.response?.data?.message ?? message;
      }
      toast.error("Gagal menambahkan kontrak", {
        description: message,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Tambah Kontrak Mitra
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Catat kontrak yang sudah disepakati dengan pihak eksternal.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Judul */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Judul Kontrak <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Perjanjian Jasa Konsultasi IT"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${
                errors.title ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Nomor Kontrak */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Nomor Kontrak <span className="text-red-500">*</span>
            </label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="Contoh: 001/SLI-MITRA/VI/2026"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${
                errors.contractNumber ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.contractNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.contractNumber}</p>
            )}
          </div>

          {/* Mitra */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Mitra / Pihak Eksternal <span className="text-red-500">*</span>
            </label>
            <input
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Nama perusahaan mitra"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${
                errors.partnerName ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.partnerName && (
              <p className="text-xs text-red-500 mt-1">{errors.partnerName}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "signed" | "active")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-white"
            >
              <option value="signed">Disahkan</option>
              <option value="active">Aktif</option>
            </select>
          </div>

          {/* Periode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${
                  errors.endDate ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Dokumen */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Dokumen Kontrak (PDF) <span className="text-red-500">*</span>
            </label>
            <label
              className={`flex items-center gap-3 w-full rounded-lg border-2 border-dashed px-4 py-3 cursor-pointer transition-all ${
                errors.document
                  ? "border-red-300 bg-red-50/30"
                  : document
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/20"
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              {document ? (
                <>
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {document.name}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500">
                    Klik untuk pilih berkas PDF (maks. 10MB)
                  </span>
                </>
              )}
            </label>
            {errors.document && (
              <p className="text-xs text-red-500 mt-1">{errors.document}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan Kontrak"}
          </button>
        </div>
      </div>
    </div>
  );
}