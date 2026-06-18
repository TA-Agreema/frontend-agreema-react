import { useEditorState, type Editor } from "@tiptap/react";

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Cambria", value: "Cambria, serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const normalizeFontFamily = (fontFamily: string) =>
  fontFamily.replace(/['"]/g, "").trim();

export function FontFamilySelector({
  editor,
  disabled = false,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  const currentFontFamily =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) =>
        normalizeFontFamily(
          currentEditor?.getAttributes("textStyle").fontFamily || "",
        ),
    }) ?? "";

  const hasCurrentOption = FONT_FAMILIES.some(
    (font) => normalizeFontFamily(font.value) === currentFontFamily,
  );

  if (!editor) return null;

  const handleChange = (fontFamily: string) => {
    if (!fontFamily) {
      editor.chain().focus().unsetFontFamily().run();
      return;
    }

    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  return (
    <select
      value={currentFontFamily}
      onChange={(event) => handleChange(event.target.value)}
      disabled={disabled}
      title={disabled ? "Fitur dinonaktifkan" : "Font Family"}
      className="h-8 max-w-38 px-2 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {FONT_FAMILIES.map((font) => (
        <option
          key={font.label}
          value={normalizeFontFamily(font.value)}
          style={font.value ? { fontFamily: font.value } : undefined}
        >
          {font.label}
        </option>
      ))}
      {currentFontFamily && !hasCurrentOption && (
        <option value={currentFontFamily}>{currentFontFamily}</option>
      )}
    </select>
  );
}
