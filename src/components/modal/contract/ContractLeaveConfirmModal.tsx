import { AlertCircle, Loader2, Save } from "lucide-react";

type ContractLeaveConfirmModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  isSaveDisabled?: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
};

export function ContractLeaveConfirmModal({
  isOpen,
  isSaving,
  isSaveDisabled = false,
  onClose,
  onDiscard,
  onSaveDraft,
}: ContractLeaveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Perubahan belum disimpan
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Jika keluar sekarang, progres kontrak yang belum disimpan akan
              hilang dari draft sementara browser.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Tetap di Halaman
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Keluar Tanpa Simpan
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving || isSaveDisabled}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
