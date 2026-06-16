import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { ToolbarBtn } from "@/components/editor/ToolbarBtn";
import {
  getPaperSizeOption,
  PAPER_SIZE_OPTIONS,
  type PaperSize,
} from "@/lib/editor-paper";

type PaperSizeDropdownProps = {
  paperSize: PaperSize;
  setPaperSize: (paperSize: PaperSize) => void;
  disabled?: boolean;
};

export function PaperSizeDropdown({
  paperSize,
  setPaperSize,
  disabled = false,
}: PaperSizeDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = getPaperSizeOption(paperSize);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen((value) => !value)}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Ukuran kertas"}
        className="min-w-14"
      >
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold">{current.label}</span>
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Ukuran Kertas
          </p>
          <div className="space-y-1">
            {PAPER_SIZE_OPTIONS.map((option) => {
              const isActive = option.id === paperSize;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPaperSize(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xs font-semibold">{option.label}</span>
                  <span className="text-[10px] text-gray-400">
                    {option.width} x {option.height}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
