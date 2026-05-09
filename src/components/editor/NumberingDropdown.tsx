import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { ChevronDown, ListOrdered } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function NumberingDropdown({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!editor) return null;

  const toggleStyle = (type: string | null) => {
    if (type === null) {
      if (editor.isActive("orderedList")) {
        editor.chain().focus().toggleOrderedList().run();
      }
    } else {
      if (editor.isActive("orderedList")) {
        editor.chain().focus().updateAttributes("orderedList", { listType: type }).run();
      } else {
        editor.chain().focus().toggleOrderedList().updateAttributes("orderedList", { listType: type }).run();
      }
    }
    setOpen(false);
  };

  const numberingStyles = [
    { id: "none", label: "None", type: null, preview: ["None"] },
    { id: "decimal", label: "1, 2, 3", type: "1", preview: ["1.", "2.", "3."] },
    { id: "alpha", label: "a, b, c", type: "a", preview: ["a.", "b.", "c."] },
    { id: "roman", label: "i, ii, iii", type: "i", preview: ["i.", "ii.", "iii."] },
    { id: "upper-alpha", label: "A, B, C", type: "A", preview: ["A.", "B.", "C."] },
    { id: "upper-roman", label: "I, II, III", type: "I", preview: ["I.", "II.", "III."] },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen(!open)}
        active={editor.isActive("orderedList")}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Numbering Library"}>
        <div className="flex items-center gap-0.5">
          <ListOrdered className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Numbering Library</p>
          <div className="grid grid-cols-3 gap-2">
            {numberingStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStyle(s.type)}
                className="flex flex-col items-center justify-center p-2 rounded border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-full aspect-square border border-gray-200 rounded bg-white mb-1.5 flex flex-col items-start justify-center text-[9px] text-gray-500 font-mono leading-tight p-2 group-hover:border-emerald-200">
                  {s.preview.map((line, i) => (
                    <div key={i} className="w-full flex items-center gap-1 mb-0.5 last:mb-0">
                      <span className="shrink-0">{line}</span>
                      <div className="h-0.5 flex-1 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-500 font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
