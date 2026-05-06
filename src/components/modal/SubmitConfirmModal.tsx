export default function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-96 p-5 z-10">
        <h3 className="text-lg font-semibold mb-3">Konfirmasi Pengajuan</h3>
        <p className="text-sm text-gray-600 mb-4">
          Anda akan mengajukan kontrak untuk ditinjau. Setelah diajukan, kontrak
          tidak bisa diedit lagi kecuali ada revisi dari approver/manager.
          Apakah data kontrak sudah benar?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? "Mengirim..." : "Ya, Ajukan"}
          </button>
        </div>
      </div>
    </div>
  );
}
