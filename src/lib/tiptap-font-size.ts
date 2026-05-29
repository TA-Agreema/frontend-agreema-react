import { Extension } from '@tiptap/core';
import type { GlobalAttributes, CommandProps } from '@tiptap/core';
import type { Node, Mark } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    /**
     * Set the font size
     */
    setFontSize: (fontSize: string) => ReturnType;
    /**
     * Unset the font size
     */
    unsetFontSize: () => ReturnType;
    /**
     * Increase the font size
     */
    increaseFontSize: () => ReturnType;
    /**
     * Decrease the font size
     */
    decreaseFontSize: () => ReturnType;
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ] as GlobalAttributes;
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
      increaseFontSize:
        () =>
        ({ state, chain }: CommandProps) => {
          const { selection } = state;
          const { from, to } = selection;
          let currentSize = 16; // default

          state.doc.nodesBetween(from, to, (node: Node) => {
            const fontSizeMark = node.marks.find((mark: Mark) => mark.type.name === 'textStyle');
            const fontSize = fontSizeMark?.attrs.fontSize;
            if (fontSize) {
              const size = parseInt(fontSize, 10);
              if (!isNaN(size)) {
                currentSize = size;
              }
            }
          });

          return chain()
            .setMark('textStyle', { fontSize: `${currentSize + 2}px` })
            .run();
        },
      decreaseFontSize:
        () =>
        ({ state, chain }: CommandProps) => {
          const { selection } = state;
          const { from, to } = selection;
          let currentSize = 16; // default

          state.doc.nodesBetween(from, to, (node: Node) => {
            const fontSizeMark = node.marks.find((mark: Mark) => mark.type.name === 'textStyle');
            const fontSize = fontSizeMark?.attrs.fontSize;
            if (fontSize) {
              const size = parseInt(fontSize, 10);
              if (!isNaN(size)) {
                currentSize = size;
              }
            }
          });

          const newSize = Math.max(8, currentSize - 2);
          return chain().setMark('textStyle', { fontSize: `${newSize}px` }).run();
        },
    };
  },
});
