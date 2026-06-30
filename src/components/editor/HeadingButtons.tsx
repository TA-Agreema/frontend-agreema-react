import { useEditor } from "@tiptap/react";
import { ToolbarBtn } from "./ToolbarBtn";

export function HeadingButtons({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  return (
    <>
      {([1, 2, 3] as const).map((l) => (
        <ToolbarBtn
          key={l}
          onClick={() =>
            !disabled && editor.chain().focus().toggleHeading({ level: l }).run()
          }
          disabled={disabled}
          active={editor.isActive("heading", { level: l })}>
          <span className="font-bold text-[11px] w-4 text-center block">H{l}</span>
        </ToolbarBtn>
      ))}
    </>
  );
}
