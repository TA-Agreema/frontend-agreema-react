import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

type BorderSide = "default" | "none";

type CellBorderAttributes = {
  borderTop?: BorderSide | null;
  borderRight?: BorderSide | null;
  borderBottom?: BorderSide | null;
  borderLeft?: BorderSide | null;
};

const BORDER_ATTRS = [
  ["borderTop", "data-border-top"],
  ["borderRight", "data-border-right"],
  ["borderBottom", "data-border-bottom"],
  ["borderLeft", "data-border-left"],
] as const;

function parseBorderSide(element: HTMLElement, attr: string): BorderSide {
  return element.getAttribute(attr) === "none" ? "none" : "default";
}

function renderBorderStyles(attributes: CellBorderAttributes) {
  const styleParts: string[] = [];
  const renderedAttrs: Record<string, string> = {};

  BORDER_ATTRS.forEach(([key, htmlAttr]) => {
    if (attributes[key] !== "none") return;

    renderedAttrs[htmlAttr] = "none";
  });

  if (attributes.borderTop === "none") styleParts.push("border-top: none");
  if (attributes.borderRight === "none") styleParts.push("border-right: none");
  if (attributes.borderBottom === "none") {
    styleParts.push("border-bottom: none");
  }
  if (attributes.borderLeft === "none") styleParts.push("border-left: none");

  return {
    ...renderedAttrs,
    ...(styleParts.length ? { style: styleParts.join("; ") } : {}),
  };
}

const borderedCellAttributes = {
  borderTop: {
    default: "default",
    parseHTML: (element: HTMLElement) =>
      parseBorderSide(element, "data-border-top"),
    renderHTML: (attributes: CellBorderAttributes) =>
      attributes.borderTop === "none" ? { "data-border-top": "none" } : {},
  },
  borderRight: {
    default: "default",
    parseHTML: (element: HTMLElement) =>
      parseBorderSide(element, "data-border-right"),
    renderHTML: (attributes: CellBorderAttributes) =>
      attributes.borderRight === "none" ? { "data-border-right": "none" } : {},
  },
  borderBottom: {
    default: "default",
    parseHTML: (element: HTMLElement) =>
      parseBorderSide(element, "data-border-bottom"),
    renderHTML: (attributes: CellBorderAttributes) =>
      attributes.borderBottom === "none"
        ? { "data-border-bottom": "none" }
        : {},
  },
  borderLeft: {
    default: "default",
    parseHTML: (element: HTMLElement) =>
      parseBorderSide(element, "data-border-left"),
    renderHTML: (attributes: CellBorderAttributes) =>
      attributes.borderLeft === "none" ? { "data-border-left": "none" } : {},
  },
};

export const BorderedTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...borderedCellAttributes,
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      {
        ...HTMLAttributes,
        ...renderBorderStyles(HTMLAttributes),
      },
      0,
    ];
  },
});

export const BorderedTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...borderedCellAttributes,
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "th",
      {
        ...HTMLAttributes,
        ...renderBorderStyles(HTMLAttributes),
      },
      0,
    ];
  },
});
