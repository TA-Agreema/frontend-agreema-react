import { Mark, mergeAttributes, type Editor } from "@tiptap/core";
import type { Mark as ProseMirrorMark, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import type { FieldDefinition } from "@/services/field.service";

type ContractFieldAttrs = {
  fieldId: string | null;
  fieldKey: string | null;
  fieldLabel: string | null;
};

type ContractFieldSelectionRange = {
  from: number;
  to: number;
  attrs: ContractFieldAttrs;
};

const findContractFieldMarkInRange = (
  doc: ProseMirrorNode,
  from: number,
  to: number,
  contractFieldType: ProseMirrorMark["type"],
) => {
  let contractMark: ProseMirrorMark | null = null;

  doc.nodesBetween(from, to, (node) => {
    if (contractMark || !node.isText) return false;

    const mark = contractFieldType.isInSet(node.marks);
    if (mark) {
      contractMark = mark;
      return false;
    }

    return undefined;
  });

  return contractMark;
};

export const ContractField = Mark.create({
  name: "contractField",

  inclusive: false,

  spanning: false,

  addAttributes() {
    return {
      fieldId: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-contract-field-id"),
        renderHTML: (attributes: ContractFieldAttrs) =>
          attributes.fieldId
            ? { "data-contract-field-id": attributes.fieldId }
            : {},
      },
      fieldKey: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-contract-field-key"),
        renderHTML: (attributes: ContractFieldAttrs) =>
          attributes.fieldKey
            ? { "data-contract-field-key": attributes.fieldKey }
            : {},
      },
      fieldLabel: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-contract-field-label"),
        renderHTML: (attributes: ContractFieldAttrs) =>
          attributes.fieldLabel
            ? { "data-contract-field-label": attributes.fieldLabel }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-contract-field-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "contract-field-token",
      }),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const contractFieldType = this.type;
    let activeContractFieldAttrs: ContractFieldAttrs | null = null;

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mousedown(_view, event) {
              const target = event.target;

              if (
                target instanceof HTMLElement &&
                target.closest("[data-contract-field-id]")
              ) {
                return false;
              }

              activeContractFieldAttrs = null;
              return false;
            },
          },
          handleClick(view, pos) {
            const resolvedPos = view.state.doc.resolve(pos);
            const parentStart = resolvedPos.start();
            let selectedRange: ContractFieldSelectionRange | null = null;

            resolvedPos.parent.forEach((node, offset) => {
              if (selectedRange || !node.isText) return;

              const mark = contractFieldType.isInSet(node.marks);
              if (!mark) return;

              const from = parentStart + offset;
              const to = from + node.nodeSize;

              if (pos < from || pos > to) return;

              const attrs = mark.attrs as ContractFieldAttrs;

              selectedRange = { from, to, attrs };
            });

            const range = selectedRange as ContractFieldSelectionRange | null;

            if (!range) {
              activeContractFieldAttrs = null;
              return false;
            }

            activeContractFieldAttrs = range.attrs;
            const contractMark = contractFieldType.create(range.attrs);
            const transaction = view.state.tr
              .setSelection(
                TextSelection.create(
                  view.state.doc,
                  range.from,
                  range.to,
                ),
              )
              .setStoredMarks([contractMark]);

            view.dispatch(transaction);
            view.focus();
            return true;
          },
          handleTextInput(view, from, to, text) {
            const contractMark =
              (activeContractFieldAttrs
                ? contractFieldType.create(activeContractFieldAttrs)
                : null) ??
              view.state.storedMarks?.find(
                (mark) => mark.type === contractFieldType,
              ) ??
              findContractFieldMarkInRange(
                view.state.doc,
                from,
                to,
                contractFieldType,
              );

            if (!contractMark) return false;

            activeContractFieldAttrs = contractMark.attrs as ContractFieldAttrs;
            const transaction = view.state.tr
              .insertText(text, from, to)
              .addMark(from, from + text.length, contractMark)
              .setStoredMarks([contractMark]);

            view.dispatch(transaction);
            return true;
          },
        },
      }),
    ];
  },
});

export function insertContractField(
  editor: Editor | null,
  field: FieldDefinition,
  options: { display?: "tag" | "label" } = {},
) {
  if (!editor) return;

  const displayText =
    options.display === "label"
      ? `[${field.field_label}]`
      : `{{${field.field_key}}}`;

  editor
    .chain()
    .focus()
    .insertContent([
      {
        type: "text",
        text: displayText,
        marks: [
          {
            type: ContractField.name,
            attrs: {
              fieldId: String(field.id),
              fieldKey: field.field_key,
              fieldLabel: field.field_label,
            },
          },
        ],
      },
      {
        type: "text",
        text: " ",
      },
    ])
    .run();
}
