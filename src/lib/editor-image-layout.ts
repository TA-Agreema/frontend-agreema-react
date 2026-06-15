import type { Editor } from "@tiptap/react";

export type EditorImageAlign = "left" | "center" | "right";
export type EditorImageSize = "25%" | "50%" | "75%" | "100%" | "auto";
export type EditorImageSpacing = "0" | "0.5em" | "1em" | "1.5em";

type ParsedStyle = Record<string, string>;

const IMAGE_NODE_NAME = "imageResize";
const IMAGE_LAYOUT_MARKER = "editorImageLayout";
const DEFAULT_CONTAINER_STYLE =
  "display: block; width: 50%; height: auto; max-width: 100%; margin: 0 auto 0.5em auto";

const parseStyle = (style: string | null | undefined): ParsedStyle =>
  (style ?? "")
    .split(";")
    .map((declaration) => declaration.split(":"))
    .filter((parts): parts is [string, string] => parts.length >= 2)
    .reduce<ParsedStyle>((styles, [property, ...valueParts]) => {
      const key = property.trim().toLowerCase();
      const value = valueParts.join(":").trim();
      if (key && value) styles[key] = value;
      return styles;
    }, {});

const stringifyStyle = (styles: ParsedStyle) =>
  Object.entries(styles)
    .filter(([, value]) => value !== "")
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");

const resolveMargin = (align: EditorImageAlign, spacing: EditorImageSpacing) => {
  if (align === "left") return `0 auto ${spacing} 0`;
  if (align === "right") return `0 0 ${spacing} auto`;
  return `0 auto ${spacing} auto`;
};

export function getSelectedImageLayout(editor: Editor | null) {
  if (!editor?.isActive(IMAGE_NODE_NAME)) return null;

  const attributes = editor.getAttributes(IMAGE_NODE_NAME);
  const styles = parseStyle(attributes.containerStyle ?? attributes.style);
  const margin = styles.margin ?? "";
  const width = styles.width ?? attributes.width ?? "auto";
  const marginParts = margin.split(/\s+/);
  const marginRight = marginParts[1] ?? "";
  const marginBottom = marginParts[2] ?? "0.5em";
  const marginLeft = marginParts[3] ?? "";

  const align: EditorImageAlign = marginRight === "0" && marginLeft === "auto"
    ? "right"
    : marginRight === "auto" && marginLeft === "0"
      ? "left"
      : "center";

  const spacing = (
    ["0", "0.5em", "1em", "1.5em"].includes(marginBottom)
      ? marginBottom
      : "0.5em"
  ) as EditorImageSpacing;

  return {
    align,
    size: (width || "auto") as EditorImageSize,
    spacing,
  };
}

export function updateSelectedImageLayout(
  editor: Editor | null,
  updates: Partial<{
    align: EditorImageAlign;
    size: EditorImageSize;
    spacing: EditorImageSpacing;
  }>,
) {
  if (!editor?.isActive(IMAGE_NODE_NAME)) return;

  const attributes = editor.getAttributes(IMAGE_NODE_NAME);
  const current = getSelectedImageLayout(editor);
  const align = updates.align ?? current?.align ?? "center";
  const spacing = updates.spacing ?? current?.spacing ?? "0.5em";
  const size = updates.size ?? current?.size ?? "50%";
  const styles = parseStyle(attributes.containerStyle ?? attributes.style);

  styles.display = "block";
  styles.height = "auto";
  styles["max-width"] = "100%";
  styles.margin = resolveMargin(align, spacing);

  if (size === "auto") {
    delete styles.width;
  } else {
    styles.width = size;
  }

  editor
    .chain()
    .focus()
    .updateAttributes(IMAGE_NODE_NAME, {
      [IMAGE_LAYOUT_MARKER]: "true",
      containerStyle: stringifyStyle(styles),
    })
    .run();
}

export function insertEditorImage(editor: Editor | null, src: string) {
  if (!editor) return;

  editor
    .chain()
    .focus()
    .insertContent({
      type: IMAGE_NODE_NAME,
      attrs: {
        src,
        [IMAGE_LAYOUT_MARKER]: "true",
        containerStyle: DEFAULT_CONTAINER_STYLE,
      },
    })
    .run();
}

export function replaceSelectedImage(editor: Editor | null, src: string) {
  if (!editor?.isActive(IMAGE_NODE_NAME)) return;

  editor.chain().focus().updateAttributes(IMAGE_NODE_NAME, { src }).run();
}

export function removeSelectedImage(editor: Editor | null) {
  if (!editor?.isActive(IMAGE_NODE_NAME)) return;

  editor.chain().focus().deleteSelection().run();
}
