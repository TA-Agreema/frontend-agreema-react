import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageUp,
  Trash2,
} from "lucide-react";
import { ToolbarBtn } from "@/components/editor/ToolbarBtn";
import {
  getSelectedImageLayout,
  removeSelectedImage,
  replaceSelectedImage,
  updateSelectedImageLayout,
  type EditorImageAlign,
  type EditorImageSize,
  type EditorImageSpacing,
} from "@/lib/editor-image-layout";

type ImageLayoutControlsProps = {
  editor: Editor | null;
  disabled?: boolean;
};

const IMAGE_SIZES: { label: string; value: EditorImageSize }[] = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
  { label: "Auto", value: "auto" },
];

const IMAGE_SPACING: { label: string; value: EditorImageSpacing }[] = [
  { label: "Spasi 0", value: "0" },
  { label: "Spasi S", value: "0.5em" },
  { label: "Spasi M", value: "1em" },
  { label: "Spasi L", value: "1.5em" },
];

export function ImageLayoutControls({
  editor,
  disabled = false,
}: ImageLayoutControlsProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const refresh = () => forceUpdate((value) => value + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);

    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  if (!editor?.isActive("image")) return null;

  const layout = getSelectedImageLayout(editor);

  const updateAlign = (align: EditorImageAlign) =>
    updateSelectedImageLayout(editor, { align });

  const replaceImage = () => {
    if (disabled) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (readerEvent.target?.result) {
          replaceSelectedImage(editor, readerEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-emerald-100 bg-emerald-50/60 px-1 py-0.5">
      <ToolbarBtn
        onClick={() => updateAlign("left")}
        disabled={disabled}
        active={layout?.align === "left"}
        title="Gambar rata kiri"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => updateAlign("center")}
        disabled={disabled}
        active={layout?.align === "center"}
        title="Gambar rata tengah"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => updateAlign("right")}
        disabled={disabled}
        active={layout?.align === "right"}
        title="Gambar rata kanan"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <select
        value={layout?.size ?? "50%"}
        onChange={(event) =>
          updateSelectedImageLayout(editor, {
            size: event.target.value as EditorImageSize,
          })
        }
        disabled={disabled}
        title="Ukuran gambar"
        className="h-7 rounded-md border border-emerald-200 bg-white px-2 text-xs text-gray-700 outline-none disabled:opacity-50"
      >
        {IMAGE_SIZES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        value={layout?.spacing ?? "0.5em"}
        onChange={(event) =>
          updateSelectedImageLayout(editor, {
            spacing: event.target.value as EditorImageSpacing,
          })
        }
        disabled={disabled}
        title="Spasi bawah gambar"
        className="h-7 rounded-md border border-emerald-200 bg-white px-2 text-xs text-gray-700 outline-none disabled:opacity-50"
      >
        {IMAGE_SPACING.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <ToolbarBtn
        onClick={replaceImage}
        disabled={disabled}
        title="Ganti gambar"
      >
        <ImageUp className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => removeSelectedImage(editor)}
        disabled={disabled}
        title="Hapus gambar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}
