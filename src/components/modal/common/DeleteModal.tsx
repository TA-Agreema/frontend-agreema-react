import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/modal/common/ConfirmModal";

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
    <ConfirmModal
      title={title}
      message={
        <>
          Apakah Anda yakin ingin menghapus{" "}
          <span className="font-medium text-foreground">"{itemName}"</span>?
          Tindakan ini tidak dapat dibatalkan.
        </>
      }
      icon={Trash2}
      tone="danger"
      confirmLabel="Ya, Hapus"
      loadingLabel="Menghapus..."
      isLoading={isLoading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
