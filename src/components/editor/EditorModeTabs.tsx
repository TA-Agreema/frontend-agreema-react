import type { ReactNode } from "react";

export function EditorModeTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 justify-center items-center gap-1.5 px-3 py-2 text-xs rounded-t-none border-b-2 transition-colors ${
        active
          ? "border-emerald-600 text-emerald-700 font-medium bg-emerald-50/50"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
