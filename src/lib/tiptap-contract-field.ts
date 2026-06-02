import { Mark, mergeAttributes, type Editor } from "@tiptap/core";
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

const isUnfilledContractFieldText = (text: string, label?: string | null) =>
  Boolean(label) && text.trim() === `[${label}]`;

export const ContractField = Mark.create({
  name: "contractField",

  inclusive: true,

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

    return [
      new Plugin({
        props: {
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
              const text = node.text ?? "";

              if (!isUnfilledContractFieldText(text, attrs.fieldLabel)) return;

              selectedRange = { from, to, attrs };
            });

            const range = selectedRange as ContractFieldSelectionRange | null;

            if (!range) return false;

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
    .insertContent({
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
    })
    .run();
}
