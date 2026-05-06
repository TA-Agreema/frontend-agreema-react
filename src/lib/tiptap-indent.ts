import { Extension } from "@tiptap/core";

export interface IndentOptions {
  types: string[];
  indentLevels: number;
  indentSize: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Indent the selected node (left)
       */
      indent: () => ReturnType;
      /**
       * Outdent the selected node (left)
       */
      outdent: () => ReturnType;
      /**
       * Indent the selected node (right)
       */
      indentRight: () => ReturnType;
      /**
       * Outdent the selected node (right)
       */
      outdentRight: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "listItem"],
      indentLevels: 10,
      indentSize: 24, // px per level
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;
              if (!marginLeft) return 0;
              const value = parseInt(marginLeft, 10);
              return Math.round(value / this.options.indentSize);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent * this.options.indentSize}px`,
              };
            },
          },
          indentRight: {
            default: 0,
            parseHTML: (element) => {
              const marginRight = element.style.marginRight;
              if (!marginRight) return 0;
              const value = parseInt(marginRight, 10);
              return Math.round(value / this.options.indentSize);
            },
            renderHTML: (attributes) => {
              if (!attributes.indentRight) {
                return {};
              }
              return {
                style: `margin-right: ${attributes.indentRight * this.options.indentSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ commands, editor }) => {
          const { indent } = editor.getAttributes(editor.state.selection.$anchor.parent.type.name);
          const nextLevel = (indent || 0) + 1;
          if (nextLevel > this.options.indentLevels) return true;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { indent: nextLevel }))
            .every((response) => response);
        },
      outdent:
        () =>
        ({ commands, editor }) => {
          const { indent } = editor.getAttributes(editor.state.selection.$anchor.parent.type.name);
          const nextLevel = (indent || 0) - 1;
          if (nextLevel < 0) return true;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { indent: nextLevel }))
            .every((response) => response);
        },
      indentRight:
        () =>
        ({ commands, editor }) => {
          const { indentRight } = editor.getAttributes(editor.state.selection.$anchor.parent.type.name);
          const nextLevel = (indentRight || 0) + 1;
          if (nextLevel > this.options.indentLevels) return true;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { indentRight: nextLevel }))
            .every((response) => response);
        },
      outdentRight:
        () =>
        ({ commands, editor }) => {
          const { indentRight } = editor.getAttributes(editor.state.selection.$anchor.parent.type.name);
          const nextLevel = (indentRight || 0) - 1;
          if (nextLevel < 0) return true;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { indentRight: nextLevel }))
            .every((response) => response);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});
