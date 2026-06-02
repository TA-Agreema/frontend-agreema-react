import TableRow from "@tiptap/extension-table-row";
import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const MIN_ROW_HEIGHT = 28;
const ROW_RESIZE_HANDLE_SIZE = 10;

function getTableRowElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest("tr");
}

function isNearRowBottom(event: MouseEvent, row: HTMLTableRowElement) {
  const rect = row.getBoundingClientRect();
  return rect.bottom - event.clientY <= ROW_RESIZE_HANDLE_SIZE;
}

function findTableRowPos(view: EditorView, row: HTMLTableRowElement) {
  const firstCell = row.cells.item(0);
  if (!firstCell) return null;

  const pos = view.posAtDOM(firstCell, 0);
  const resolvedPos = view.state.doc.resolve(pos);

  for (let depth = resolvedPos.depth; depth > 0; depth -= 1) {
    if (resolvedPos.node(depth).type.name === "tableRow") {
      return resolvedPos.before(depth);
    }
  }

  return null;
}

function setRowHeight(view: EditorView, rowPos: number, height: number) {
  const rowNode = view.state.doc.nodeAt(rowPos);
  if (!rowNode || rowNode.type.name !== "tableRow") return;

  view.dispatch(
    view.state.tr.setNodeMarkup(rowPos, undefined, {
      ...rowNode.attrs,
      rowHeight: Math.round(height),
    }),
  );
}

export const ResizableTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowHeight: {
        default: null,
        parseHTML: (element) => {
          const dataHeight = element.getAttribute("data-row-height");
          const styleHeight = element.style.height;
          const parsedHeight = Number.parseInt(dataHeight || styleHeight, 10);

          return Number.isFinite(parsedHeight) ? parsedHeight : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.rowHeight) return {};

          return {
            "data-row-height": attributes.rowHeight,
            style: `height: ${attributes.rowHeight}px`,
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mouseleave() {
              document.body.classList.remove("table-row-resize-cursor");
              return false;
            },
            mousedown(view, event) {
              if (!view.editable) return false;
              if (!(event instanceof MouseEvent)) return false;

              const row = getTableRowElement(event.target);

              if (
                !(row instanceof HTMLTableRowElement) ||
                !isNearRowBottom(event, row)
              ) {
                return false;
              }

              const rowPos = findTableRowPos(view, row);
              if (rowPos === null) return false;

              const startY = event.clientY;
              const startHeight = row.getBoundingClientRect().height;

              const onMouseMove = (moveEvent: MouseEvent) => {
                const nextHeight = Math.max(
                  MIN_ROW_HEIGHT,
                  startHeight + moveEvent.clientY - startY,
                );
                row.style.height = `${Math.round(nextHeight)}px`;
                Array.from(row.cells).forEach((cell) => {
                  cell.style.height = `${Math.round(nextHeight)}px`;
                });
              };

              const onMouseUp = (upEvent: MouseEvent) => {
                const nextHeight = Math.max(
                  MIN_ROW_HEIGHT,
                  startHeight + upEvent.clientY - startY,
                );

                setRowHeight(view, rowPos, nextHeight);
                document.body.classList.remove("table-row-resize-cursor");
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
              };

              event.preventDefault();
              document.body.classList.add("table-row-resize-cursor");
              window.addEventListener("mousemove", onMouseMove);
              window.addEventListener("mouseup", onMouseUp);

              return true;
            },
          },
        },
      }),
    ];
  },
});
