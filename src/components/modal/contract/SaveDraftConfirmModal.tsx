import { Save } from "lucide-react";
import ConfirmModal from "@/components/modal/common/ConfirmModal";

type SaveDraftConfirmModalProps = {
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SaveDraftConfirmModal({
  isOpen,
  isSaving = false,
  onClose,
  onConfirm,
}: SaveDraftConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Simpan Draft Kontrak"
      message="Kontrak akan disimpan sebagai draft. Anda masih dapat membuka dan melanjutkan pengisian kontrak ini nanti."
      icon={Save}
      tone="success"
      confirmLabel="Ya, Simpan Draft"
      cancelLabel="Batal"
      loadingLabel="Menyimpan..."
      isLoading={isSaving}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
