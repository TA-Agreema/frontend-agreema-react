import React from "react";

export function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors shrink-0 ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
      } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

export const ToolbarDivider = () => <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />;
