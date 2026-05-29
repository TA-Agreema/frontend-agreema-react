import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { ChevronDown, MoveVertical } from "lucide-react";

export function LineSpacingToggle({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!editor) return null;

  const _rawLineHeight = editor.getAttributes("paragraph").lineHeight ?? editor.getAttributes("heading").lineHeight ?? "1.0";
  const currentLineHeight = typeof _rawLineHeight === "number" ? _rawLineHeight.toFixed(2) : (() => {
    const n = Number(String(_rawLineHeight));
    return Number.isNaN(n) ? String(_rawLineHeight) : n.toFixed(2);
  })();

  const setLineHeight = (value: string) => {
    const parsed = parseFloat(value);
    const toSet = Number.isNaN(parsed) ? String(value) : String(parsed);
    editor.chain().setLineHeight(toSet).run();
  };

  const presets = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((s) => !s)}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Line Spacing"}
        className={`flex items-center gap-1 px-2 py-1.5 text-sm rounded border border-gray-200 bg-white ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"} text-gray-700`}>
        <MoveVertical className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs font-medium">{currentLineHeight}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <div className="space-y-1">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLineHeight(p.toFixed(2))}
                className={`w-full text-left px-2 py-1 text-sm rounded ${currentLineHeight === p.toFixed(2) ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"} transition-colors`}>
                {p.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
