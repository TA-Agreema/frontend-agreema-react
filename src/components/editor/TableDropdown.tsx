import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { ToolbarBtn } from "./ToolbarBtn";

export function TableDropdown({
  editor,
  disabled = false,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ r: 0, c: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const insertTable = (rows: number, cols: number) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  const handleCustomTable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rows = window.prompt("Jumlah baris (Rows):", "3");
    const cols = window.prompt("Jumlah kolom (Cols):", "3");
    if (rows && cols) {
      insertTable(parseInt(rows, 10), parseInt(cols, 10));
    }
  };

  const isTableActive = editor.isActive("table");

  return (
    <div className="relative" ref={containerRef}>
      <ToolbarBtn
        onClick={() => setIsOpen(!isOpen)}
        active={isOpen || isTableActive}
        disabled={disabled}
        title="Table Options">
        <span className="text-xs font-bold">▦</span>
      </ToolbarBtn>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 shadow-xl rounded-lg z-[100] min-w-[200px]">
          <div className="mb-2 pb-2 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Insert Table
            </p>
            <div className="grid grid-cols-10 gap-1 w-fit mx-auto">
              {Array.from({ length: 10 }).map((_, r) =>
                Array.from({ length: 10 }).map((_, c) => {
                  const isActive = r < hoveredGrid.r && c < hoveredGrid.c;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() =>
                        setHoveredGrid({ r: r + 1, c: c + 1 })
                      }
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertTable(r + 1, c + 1);
                      }}
                      className={`w-3.5 h-3.5 border transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-500 border-emerald-600"
                          : "bg-gray-50 border-gray-200 hover:border-emerald-300"
                      }`}
                    />
                  );
                }),
              )}
            </div>
            <p className="text-center text-xs font-medium text-gray-600 mt-2">
              {hoveredGrid.r > 0
                ? `${hoveredGrid.r} x ${hoveredGrid.c}`
                : "Select size"}
            </p>
            <button
              type="button"
              onClick={handleCustomTable}
              className="w-full mt-2 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-100 transition-colors">
              Custom Table...
            </button>
          </div>

          {isTableActive && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">
                Borders
              </p>
              <div className="grid grid-cols-2 gap-1 pb-1">
                {[
                  { id: "all", label: "▦ All" },
                  { id: "none", label: "⬜ None" },
                  { id: "outside", label: "▢ Outside" },
                  { id: "inside", label: "⊞ Inside" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const { state } = editor;
                      const { selection } = state;
                      let tablePos = -1;
                      let tableNode: any = null;

                      state.doc.nodesBetween(
                        selection.from - 2, // Check a bit before to find parent
                        selection.to + 2,
                        (node, pos) => {
                          if (node.type.name === "table") {
                            tablePos = pos;
                            tableNode = node;
                            return false;
                          }
                        },
                      );

                      if (tablePos > -1 && tableNode) {
                        editor
                          .chain()
                          .focus()
                          .command(({ tr }) => {
                            tr.setNodeMarkup(tablePos, undefined, {
                              ...tableNode.attrs,
                              borderType: b.id,
                            });
                            return true;
                          })
                          .run();
                      }
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-gray-600 hover:bg-emerald-50 rounded transition-colors w-full text-left">
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 my-1" />

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">
                Table Actions
              </p>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors w-full text-left">
                  <span>➕ Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors w-full text-left">
                  <span>❌ Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors w-full text-left">
                  <span>➕ Col</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors w-full text-left">
                  <span>❌ Col</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => editor.chain().focus().mergeCells().run()}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors w-full text-left mt-1">
                <span>🔗 Merge Cells</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium rounded transition-colors w-full text-left mt-1">
                <span>🗑️ Delete Table</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
