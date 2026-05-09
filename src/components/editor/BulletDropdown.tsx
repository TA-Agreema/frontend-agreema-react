import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { ChevronDown, List } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function BulletDropdown({
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

  const toggleStyle = (style: string | null) => {
    if (style === null) {
      if (editor.isActive("bulletList")) {
        editor.chain().focus().toggleBulletList().run();
      }
    } else {
      const className = `list-${style}`;
      if (!editor.isActive("bulletList")) {
        editor.chain().focus().toggleBulletList().updateAttributes("bulletList", { class: className }).run();
      } else {
        editor.chain().focus().updateAttributes("bulletList", { class: className }).run();
      }
    }
    setOpen(false);
  };

  const bulletStyles = [
    { id: "none", label: "None", style: null, preview: ["None"] },
    { id: "disc", label: "Solid Circle", style: "disc", preview: ["●", "●", "●"] },
    { id: "circle", label: "Open Circle", style: "circle", preview: ["○", "○", "○"] },
    { id: "square", label: "Square", style: "square", preview: ["■", "■", "■"] },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen(!open)}
        active={editor.isActive("bulletList")}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Bullet Library"}>
        <div className="flex items-center gap-0.5">
          <List className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Bullet Library</p>
          <div className="grid grid-cols-2 gap-2">
            {bulletStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStyle(s.style)}
                className="flex flex-col items-center justify-center p-2 rounded border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-full aspect-square border border-gray-200 rounded bg-white mb-1.5 flex flex-col items-start justify-center text-[10px] text-gray-500 font-mono leading-tight p-2 group-hover:border-emerald-200">
                  {s.preview.map((line, i) => (
                    <div key={i} className="w-full flex items-center gap-2 mb-1 last:mb-0">
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
