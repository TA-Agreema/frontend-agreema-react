import React from "react";
import { useEditor } from "@tiptap/react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function FormattingButtons({
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
        onClick={() => !disabled && editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        active={editor.isActive("bold")}
        title={disabled ? "Fitur dinonaktifkan" : "Bold"}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        active={editor.isActive("italic")}
        title={disabled ? "Fitur dinonaktifkan" : "Italic"}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        active={editor.isActive("underline")}
        title={disabled ? "Fitur dinonaktifkan" : "Underline"}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        active={editor.isActive("strike")}
        title={disabled ? "Fitur dinonaktifkan" : "Strikethrough"}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </>
  );
}
