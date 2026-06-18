import TableRow from "@tiptap/extension-table-row";
import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const MIN_ROW_HEIGHT = 4;
const ROW_RESIZE_HANDLE_SIZE = 12;

function getTableRowElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest("tr");
}

function getTableRowElementAtPoint(event: MouseEvent) {
  const directRow = getTableRowElement(event.target);

  if (directRow instanceof HTMLTableRowElement) return directRow;

  const pointedElement = document.elementFromPoint(event.clientX, event.clientY);
  const pointedRow = getTableRowElement(pointedElement);

  return pointedRow instanceof HTMLTableRowElement ? pointedRow : null;
}

function isNearRowBottom(event: MouseEvent, row: HTMLTableRowElement) {
  const rect = row.getBoundingClientRect();
  return (
    event.clientY >= rect.bottom - ROW_RESIZE_HANDLE_SIZE &&
    event.clientY <= rect.bottom + ROW_RESIZE_HANDLE_SIZE
  );
}

function findTableRowPos(view: EditorView, row: HTMLTableRowElement) {
  const candidateElements: HTMLElement[] = [row];
  const firstCell = row.cells.item(0);

  if (firstCell) candidateElements.push(firstCell);

  for (const element of candidateElements) {
    try {
      const pos = view.posAtDOM(element, 0);
      const resolvedPos = view.state.doc.resolve(pos);

      for (let depth = resolvedPos.depth; depth > 0; depth -= 1) {
        if (resolvedPos.node(depth).type.name === "tableRow") {
          return resolvedPos.before(depth);
        }
      }
    } catch {
      // Try the next candidate element.
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
            mousemove(view, event) {
              if (!view.editable) return false;
              if (!(event instanceof MouseEvent)) return false;

              const row = getTableRowElementAtPoint(event);
              const shouldShowCursor =
                row instanceof HTMLTableRowElement && isNearRowBottom(event, row);

              document.body.classList.toggle(
                "table-row-resize-cursor",
                shouldShowCursor,
              );

              return false;
            },
            mousedown(view, event) {
              if (!view.editable) return false;
              if (!(event instanceof MouseEvent)) return false;

              const row = getTableRowElementAtPoint(event);

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
