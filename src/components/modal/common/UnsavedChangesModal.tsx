import { AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/modal/common/ConfirmModal";

type UnsavedChangesModalProps = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function UnsavedChangesModal({
  title = "Perubahan Belum Tersimpan",
  message = "Progres yang belum disimpan akan hilang. Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Buang Progres",
  cancelLabel = "Tetap Edit",
  onClose,
  onConfirm,
}: UnsavedChangesModalProps) {
  return (
    <ConfirmModal
      title={title}
      message={message}
      icon={AlertTriangle}
      tone="warning"
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
