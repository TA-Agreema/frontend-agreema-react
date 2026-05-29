import { Trash2, Loader2 } from "lucide-react";

interface DeleteModalProps {
  title?: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteModal({
  title = "Hapus Data",
  itemName,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus{" "}
            <span className="font-medium text-foreground">
              "{itemName}"
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors disabled:opacity-50">
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50">
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isLoading ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
