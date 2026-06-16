import type { Editor } from "@tiptap/react";
import { ToolbarBtn } from "@/components/editor/ToolbarBtn";

export function PageBreakButton({
  editor,
  disabled = false,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  return (
    <ToolbarBtn
      onClick={() => editor?.chain().focus().insertPageBreak().run()}
      disabled={disabled || !editor}
      title={disabled ? "Fitur dinonaktifkan" : "Page Break"}
    >
      <span className="text-[10px] font-bold leading-none">PB</span>
    </ToolbarBtn>
  );
}
