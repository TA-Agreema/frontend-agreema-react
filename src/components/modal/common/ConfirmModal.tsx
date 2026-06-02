import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmTone = "default" | "danger" | "warning" | "success";

type ConfirmModalProps = {
  isOpen?: boolean;
  title: string;
  message: ReactNode;
  icon?: LucideIcon;
  tone?: ConfirmTone;
  confirmLabel: string;
  cancelLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const toneClassNames: Record<
  ConfirmTone,
  { icon: string; confirm: string }
> = {
  default: {
    icon: "bg-gray-100 text-gray-600",
    confirm: "bg-gray-900 text-white hover:bg-gray-800",
  },
  danger: {
    icon: "bg-red-100 text-red-600",
    confirm: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    icon: "bg-amber-100 text-amber-600",
    confirm: "bg-amber-600 text-white hover:bg-amber-700",
  },
  success: {
    icon: "bg-emerald-100 text-emerald-600",
    confirm: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
};

export default function ConfirmModal({
  isOpen = true,
  title,
  message,
  icon: Icon,
  tone = "default",
  confirmLabel,
  cancelLabel = "Batal",
  loadingLabel,
  isLoading = false,
  confirmDisabled = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const toneClasses = toneClassNames[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-xl border bg-card shadow-xl">
        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`rounded-lg p-2 ${toneClasses.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <h2 className="text-base font-semibold">{title}</h2>
          </div>

          <div className="text-sm leading-6 text-muted-foreground">
            {message}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || confirmDisabled}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses.confirm}`}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isLoading && loadingLabel ? loadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
