import { useEditor } from "@tiptap/react";
import { Plus, Minus } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function FontSizeSelector({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarBtn
        onClick={() => {
          // @ts-expect-error: Custom extension command
          editor.chain().focus().decreaseFontSize().run();
        }}
        disabled={disabled}
        title="Decrease Font Size">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <select
        value={currentFontSize}
        onChange={(e) => setFontSize(e.target.value)}
        disabled={disabled}
        title="Font Size"
        className="px-2 py-1.5 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map((size) => (
          <option key={size} value={`${size}px`}>
            {size}px
          </option>
        ))}
        {![
          "8px",
          "9px",
          "10px",
          "11px",
          "12px",
          "14px",
          "16px",
          "18px",
          "20px",
          "24px",
          "30px",
          "36px",
          "48px",
          "60px",
          "72px",
        ].includes(currentFontSize) && (
          <option value={currentFontSize}>{currentFontSize}</option>
        )}
      </select>
      <ToolbarBtn
        onClick={() => {
          // @ts-expect-error: Custom extension command
          editor.chain().focus().increaseFontSize().run();
        }}
        disabled={disabled}
        title="Increase Font Size">
        <Plus className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}
