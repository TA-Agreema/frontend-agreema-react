import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-end gap-1 px-6 py-4 border-t">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Sebelumnya
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 text-sm rounded-md transition-colors ${
            p === page
              ? "bg-emerald-600 text-white font-medium"
              : "border hover:bg-muted"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Selanjutnya
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
