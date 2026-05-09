import React from "react";
import { useEditor } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function ImageUploadButton({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  const uploadImage = () => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            editor
              .chain()
              .focus()
              .setImage({ src: ev.target.result as string })
              .run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <ToolbarBtn
      onClick={uploadImage}
      disabled={disabled}
      title={disabled ? "Fitur dinonaktifkan" : "Insert Image"}>
      <ImageIcon className="h-3.5 w-3.5" />
    </ToolbarBtn>
  );
}
