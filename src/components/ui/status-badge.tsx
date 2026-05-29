import React from "react";

type Props =
  | { isActive: boolean; status?: never }
  | { status: string; isActive?: never };

export default function StatusBadge(props: Props) {
  const isActive =
    "isActive" in props
      ? props.isActive
      : props.status?.toLowerCase() === "aktif";

  return (
    <span
      className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}>
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          isActive ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}
