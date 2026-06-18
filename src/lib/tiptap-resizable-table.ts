import { Table } from "@tiptap/extension-table";
import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const MIN_TABLE_WIDTH = 4;
const TABLE_EDGE_HANDLE_SIZE = 10;

type ResizeSide = "left" | "right";

function getTableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest("table");
}

function getTableElementAtPoint(event: MouseEvent) {
  const directTable = getTableElement(event.target);

  if (directTable instanceof HTMLTableElement) return directTable;

  const pointedElement = document.elementFromPoint(event.clientX, event.clientY);
  const pointedTable = getTableElement(pointedElement);

  return pointedTable instanceof HTMLTableElement ? pointedTable : null;
}

function getResizeSide(event: MouseEvent, table: HTMLTableElement): ResizeSide | null {
  const rect = table.getBoundingClientRect();
  const isNearLeft = Math.abs(event.clientX - rect.left) <= TABLE_EDGE_HANDLE_SIZE;
  const isNearRight = Math.abs(event.clientX - rect.right) <= TABLE_EDGE_HANDLE_SIZE;

  if (isNearLeft) return "left";
  if (isNearRight) return "right";

  return null;
}

function findTablePos(view: EditorView, table: HTMLTableElement) {
  const candidateElements: HTMLElement[] = [table];
  const firstCell = table.querySelector("td, th");

  if (firstCell instanceof HTMLElement) candidateElements.push(firstCell);

  for (const element of candidateElements) {
    try {
      const pos = view.posAtDOM(element, 0);
      const resolvedPos = view.state.doc.resolve(pos);

      for (let depth = resolvedPos.depth; depth > 0; depth -= 1) {
        if (resolvedPos.node(depth).type.name === "table") {
          return resolvedPos.before(depth);
        }
      }
    } catch {
      // Try the next candidate element.
    }
  }

  return null;
}

function setTableWidth(view: EditorView, tablePos: number, width: number) {
  const tableNode = view.state.doc.nodeAt(tablePos);
  if (!tableNode || tableNode.type.name !== "table") return;

  view.dispatch(
    view.state.tr.setNodeMarkup(tablePos, undefined, {
      ...tableNode.attrs,
      tableWidth: Math.round(width),
    }),
  );
}

export const ResizableTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderType: {
        default: "all",
        parseHTML: (element) => element.getAttribute("data-border-type") || "all",
        renderHTML: (attributes) => ({
          "data-border-type": attributes.borderType,
        }),
      },
      tableWidth: {
        default: null,
        parseHTML: (element) => {
          const dataWidth = element.getAttribute("data-table-width");
          const styleWidth = element.style.width;
          const parsedWidth = Number.parseInt(dataWidth || styleWidth, 10);

          return Number.isFinite(parsedWidth) ? parsedWidth : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.tableWidth) return {};

          return {
            "data-table-width": attributes.tableWidth,
            style: `width: ${attributes.tableWidth}px`,
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        props: {
          handleDOMEvents: {
            mouseleave() {
              document.body.classList.remove("table-edge-resize-cursor");
              return false;
            },
            mousemove(view, event) {
              if (!view.editable) return false;
              if (!(event instanceof MouseEvent)) return false;

              const table = getTableElementAtPoint(event);
              const shouldShowCursor =
                table instanceof HTMLTableElement && getResizeSide(event, table) !== null;

              document.body.classList.toggle(
                "table-edge-resize-cursor",
                shouldShowCursor,
              );

              return false;
            },
            mousedown(view, event) {
              if (!view.editable) return false;
              if (!(event instanceof MouseEvent)) return false;

              const table = getTableElementAtPoint(event);
              if (!(table instanceof HTMLTableElement)) return false;

              const resizeSide = getResizeSide(event, table);
              if (!resizeSide) return false;

              const tablePos = findTablePos(view, table);
              if (tablePos === null) return false;

              const startX = event.clientX;
              const startWidth = table.getBoundingClientRect().width;

              const getNextWidth = (clientX: number) => {
                const deltaX = clientX - startX;
                const rawWidth =
                  resizeSide === "right"
                    ? startWidth + deltaX
                    : startWidth - deltaX;

                return Math.max(MIN_TABLE_WIDTH, rawWidth);
              };

              const onMouseMove = (moveEvent: MouseEvent) => {
                table.style.width = `${Math.round(getNextWidth(moveEvent.clientX))}px`;
              };

              const onMouseUp = (upEvent: MouseEvent) => {
                setTableWidth(view, tablePos, getNextWidth(upEvent.clientX));
                document.body.classList.remove("table-edge-resize-cursor");
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
              };

              event.preventDefault();
              document.body.classList.add("table-edge-resize-cursor");
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
