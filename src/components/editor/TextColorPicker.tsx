import React, { useRef } from "react";
import { useEditor } from "@tiptap/react";
import { ToolbarBtn } from "./ToolbarBtn";

export function TextColorPicker({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const textPickerRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const onTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(e.target.value).run();
  };

  return (
    <div className="relative flex items-center">
      <ToolbarBtn
        onClick={() => !disabled && textPickerRef.current?.click()}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Text Color"}>
        <span
          className="text-xs font-bold"
          style={{
            color: editor.getAttributes("textStyle").color || "#000000",
          }}>
          A
        </span>
      </ToolbarBtn>
      <input
        ref={textPickerRef}
        type="color"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={onTextColorChange}
      />
    </div>
  );
}
