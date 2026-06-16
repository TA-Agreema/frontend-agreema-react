import { useState } from "react";
import { XCircle, X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface ContractRejectPageProps {
  contractTitle: string;
  contractNumber?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ContractRejectPage({
  contractTitle,
  contractNumber,
  onClose,
  onSubmit,
}: ContractRejectPageProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason);
      toast.error("Kontrak ditolak.", {
        description: "Penolakan kontrak telah dikirim ke pembuat kontrak.",
        duration: 5000,
      });
    } catch {
      setError("Gagal mengirim penolakan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">Kontrak Ditolak</h2>
          <p className="text-sm text-gray-500 mt-1">
            Beri alasan untuk menyelesaikan penolakan kontrak
          </p>
        </div>

        {/* Contract Info */}
        <div className="mx-6 mb-5 flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{contractTitle}</p>
            {contractNumber && (
              <p className="text-xs text-gray-400">Nomor: {contractNumber}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Alasan Penolakan<span className="text-red-500 ml-0.5">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Tulis alasan anda menolak kontrak disini.."
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-all resize-none"
          />
          {error && (
            <p className="text-xs text-red-500 mt-1.5">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}