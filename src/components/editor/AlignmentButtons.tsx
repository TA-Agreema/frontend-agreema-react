// import React from "react";
import { useEditor } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function AlignmentButtons({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  return (
    <>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().setTextAlign("left").run()}
        disabled={disabled}
        active={editor.isActive({ textAlign: "left" })}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().setTextAlign("center").run()}
        disabled={disabled}
        active={editor.isActive({ textAlign: "center" })}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().setTextAlign("right").run()}
        disabled={disabled}
        active={editor.isActive({ textAlign: "right" })}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().setTextAlign("justify").run()}
        disabled={disabled}
        active={editor.isActive({ textAlign: "justify" })}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </>
  );
}
