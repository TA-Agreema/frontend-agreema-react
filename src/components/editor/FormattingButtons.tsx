import { useEditor, useEditorState } from "@tiptap/react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function FormattingButtons({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const formattingState = useEditorState({
    editor: editor as NonNullable<ReturnType<typeof useEditor>>,
    selector: (ctx) => {
      if (!ctx.editor) return { bold: false, italic: false, underline: false, strike: false };
      return {
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        underline: ctx.editor.isActive("underline"),
        strike: ctx.editor.isActive("strike"),
      };
    },
  });

  if (!editor) return null;

  return (
    <>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        active={formattingState?.bold}
        title={disabled ? "Fitur dinonaktifkan" : "Bold"}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        active={formattingState?.italic}
        title={disabled ? "Fitur dinonaktifkan" : "Italic"}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        active={formattingState?.underline}
        title={disabled ? "Fitur dinonaktifkan" : "Underline"}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        active={formattingState?.strike}
        title={disabled ? "Fitur dinonaktifkan" : "Strikethrough"}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </>
  );
}
