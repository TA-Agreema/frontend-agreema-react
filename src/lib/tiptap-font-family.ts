import { Extension } from "@tiptap/core";
import type { CommandProps, GlobalAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    setFontFamily: (fontFamily: string) => ReturnType;
    unsetFontFamily: () => ReturnType;
  }
}

export const FontFamily = Extension.create({
  name: "fontFamily",

  addOptions() {
    return {
      types: ["textStyle", "listItem"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) =>
              element.style.fontFamily?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};

              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ] as GlobalAttributes;
  },

  addCommands() {
    const updateSelectedListItems = (
      { state, tr }: CommandProps,
      fontFamily: string | null,
    ) => {
      const { from, to } = state.selection;

      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name !== "listItem") return;

        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          fontFamily,
        });
      });

      return true;
    };

    return {
      setFontFamily:
        (fontFamily: string) =>
        (props) => {
          return props
            .chain()
            .setMark("textStyle", { fontFamily })
            .command((commandProps) =>
              updateSelectedListItems(commandProps, fontFamily),
            )
            .run();
        },
      unsetFontFamily:
        () =>
        (props) => {
          return props
            .chain()
            .setMark("textStyle", { fontFamily: null })
            .command((commandProps) =>
              updateSelectedListItems(commandProps, null),
            )
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
