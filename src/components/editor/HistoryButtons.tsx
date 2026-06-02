import { useEditor, useEditorState } from "@tiptap/react";
import { Undo2, Redo2 } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function HistoryButtons({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const historyState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  }) ?? { canUndo: false, canRedo: false };

  if (!editor) return null;

  return (
    <>
      <ToolbarBtn
        onClick={() =>
          !disabled &&
          historyState.canUndo &&
          editor.chain().focus().undo().run()
        }
        disabled={disabled || !historyState.canUndo}
        title={disabled ? "Fitur dinonaktifkan" : "Undo"}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() =>
          !disabled &&
          historyState.canRedo &&
          editor.chain().focus().redo().run()
        }
        disabled={disabled || !historyState.canRedo}
        title={disabled ? "Fitur dinonaktifkan" : "Redo"}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </>
  );
}
