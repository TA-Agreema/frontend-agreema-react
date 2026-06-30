import { useEditor, useEditorState } from "@tiptap/react";
import { Plus, Minus } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

const DEFAULT_FONT_SIZE = "16px";
const MIXED_FONT_SIZE = "__mixed__";
const FONT_SIZE_OPTIONS = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72,
];
const FONT_SIZE_OPTION_VALUES = FONT_SIZE_OPTIONS.map((size) => `${size}px`);

function getSelectedFontSize(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const { state } = editor;
  const { from, to, empty } = state.selection;

  if (empty) {
    return {
      value: editor.getAttributes("textStyle").fontSize || DEFAULT_FONT_SIZE,
      mixed: false,
    };
  }

  const selectedSizes = new Set<string>();

  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return;

    const fontSize = node.marks.find((mark) => mark.type.name === "textStyle")
      ?.attrs.fontSize;
    selectedSizes.add(fontSize || DEFAULT_FONT_SIZE);
  });

  if (selectedSizes.size === 0) {
    return {
      value: editor.getAttributes("textStyle").fontSize || DEFAULT_FONT_SIZE,
      mixed: false,
    };
  }

  if (selectedSizes.size > 1) {
    return {
      value: MIXED_FONT_SIZE,
      mixed: true,
    };
  }

  return {
    value: [...selectedSizes][0],
    mixed: false,
  };
}

export function FontSizeSelector({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const fontSizeState = useEditorState({
    editor: editor as NonNullable<ReturnType<typeof useEditor>>,
    selector: (ctx) => {
      if (!ctx.editor) return { value: DEFAULT_FONT_SIZE, mixed: false };
      return getSelectedFontSize(ctx.editor as NonNullable<ReturnType<typeof useEditor>>);
    },
  });

  if (!editor) return null;

  const setFontSize = (size: string) => {
    if (size === MIXED_FONT_SIZE) return;
    editor.chain().focus().setFontSize(size).run();
  };

  const handleDecrease = () => {
    if (!fontSizeState || fontSizeState.mixed) return;
    const currentSize = parseInt(fontSizeState.value.replace("px", "")) || 16;
    const newSize = Math.max(8, currentSize - 1);
    setFontSize(`${newSize}px`);
  };

  const handleIncrease = () => {
    if (!fontSizeState || fontSizeState.mixed) return;
    const currentSize = parseInt(fontSizeState.value.replace("px", "")) || 16;
    const newSize = Math.min(72, currentSize + 1);
    setFontSize(`${newSize}px`);
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarBtn
        onClick={handleDecrease}
        disabled={disabled || (fontSizeState?.mixed)}
        title="Decrease Font Size">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <select
        value={fontSizeState?.value || DEFAULT_FONT_SIZE}
        onChange={(event) => setFontSize(event.target.value)}
        disabled={disabled}
        title="Font Size"
        className="px-2 py-1.5 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {fontSizeState?.mixed && (
          <option value={MIXED_FONT_SIZE}>Campuran</option>
        )}
        {FONT_SIZE_OPTIONS.map((size) => (
          <option key={size} value={`${size}px`}>
            {size}px
          </option>
        ))}
        {!fontSizeState?.mixed &&
          fontSizeState?.value &&
          !FONT_SIZE_OPTION_VALUES.includes(fontSizeState.value) && (
            <option value={fontSizeState.value}>{fontSizeState.value}</option>
          )}
      </select>
      <ToolbarBtn
        onClick={handleIncrease}
        disabled={disabled || (fontSizeState?.mixed)}
        title="Increase Font Size">
        <Plus className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}
