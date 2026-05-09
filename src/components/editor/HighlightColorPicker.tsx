import React, { useRef } from "react";
import { useEditor } from "@tiptap/react";
import { ToolbarBtn } from "./ToolbarBtn";

export function HighlightColorPicker({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const highlightPickerRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const onHighlightColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setHighlight({ color: e.target.value }).run();
  };

  return (
    <div className="relative flex items-center">
      <ToolbarBtn
        onClick={() => !disabled && highlightPickerRef.current?.click()}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Highlight Color"}>
        <span className="text-xs font-bold">🖍️</span>
      </ToolbarBtn>
      <input
        ref={highlightPickerRef}
        type="color"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={onHighlightColorChange}
      />
    </div>
  );
}
