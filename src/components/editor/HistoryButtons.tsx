import React from "react";
import { useEditor } from "@tiptap/react";
import { Undo2, Redo2 } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function HistoryButtons({
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
        onClick={() => !disabled && editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title={disabled ? "Fitur dinonaktifkan" : "Undo"}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title={disabled ? "Fitur dinonaktifkan" : "Redo"}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </>
  );
}
