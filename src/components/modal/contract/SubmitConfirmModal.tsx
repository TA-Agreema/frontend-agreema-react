import { Send } from "lucide-react";
import ConfirmModal from "@/components/modal/common/ConfirmModal";

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
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Konfirmasi Pengajuan"
      message="Anda akan mengajukan kontrak untuk ditinjau. Setelah diajukan, kontrak tidak bisa diedit lagi kecuali ada revisi dari approver atau manager. Apakah data kontrak sudah benar?"
      icon={Send}
      tone="success"
      confirmLabel="Ya, Ajukan"
      loadingLabel="Mengirim..."
      isLoading={submitting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
