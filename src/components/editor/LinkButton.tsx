import { useEditor } from "@tiptap/react";
import { Link as LinkIcon } from "lucide-react";
import { ToolbarBtn } from "./ToolbarBtn";

export function LinkButton({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  const addLink = () => {
    if (disabled) return;
    const url = window.prompt("URL:", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <ToolbarBtn
      onClick={addLink}
      active={editor.isActive("link")}
      disabled={disabled}
      title={disabled ? "Fitur dinonaktifkan" : "Link"}>
      <LinkIcon className="h-3.5 w-3.5" />
    </ToolbarBtn>
  );
}
