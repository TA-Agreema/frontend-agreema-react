import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ToolbarBtn } from "./ToolbarBtn";

type BorderSide = "default" | "none";

export function TableDropdown({
  editor,
  disabled = false,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ r: 0, c: 0 });
  const [activeBorderId, setActiveBorderId] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRows, setCustomRows] = useState("3");
  const [customCols, setCustomCols] = useState("3");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
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

  const handleCustomTable = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowCustomModal(true);
  };

  const handleInsertCustomTable = () => {
    const rows = Number.parseInt(customRows, 10);
    const cols = Number.parseInt(customCols, 10);

    if (!Number.isFinite(rows) || !Number.isFinite(cols)) return;

    insertTable(
      Math.min(20, Math.max(1, rows)),
      Math.min(10, Math.max(1, cols)),
    );
    setShowCustomModal(false);
  };

  const applyCellBorders = (
    borderTop: BorderSide,
    borderRight: BorderSide,
    borderBottom: BorderSide,
    borderLeft: BorderSide,
  ) => {
    const chain = editor.chain().focus() as any;
    chain
      .setCellAttribute("borderTop", borderTop)
      .setCellAttribute("borderRight", borderRight)
      .setCellAttribute("borderBottom", borderBottom)
      .setCellAttribute("borderLeft", borderLeft)
      .run();
  };

  const applyTableBorderType = (borderType: string) => {
    const { state } = editor;
    const { selection } = state;
    let tablePos = -1;
    let tableNode: any = null;

    state.doc.nodesBetween(selection.from - 2, selection.to + 2, (node, pos) => {
      if (node.type.name === "table") {
        tablePos = pos;
        tableNode = node;
        return false;
      }
    });

    if (tablePos < 0 || !tableNode) return;

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(tablePos, undefined, {
          ...tableNode.attrs,
          borderType,
        });
        return true;
      })
      .run();
  };

  const isTableActive = editor.isActive("table");

  const runBorderAction = (id: string, action: () => void) => {
    action();
    setActiveBorderId(id);
  };

  const borderActions = [
    {
      id: "bottom",
      label: "Bottom Border",
      action: () => applyCellBorders("none", "none", "default", "none"),
    },
    {
      id: "top",
      label: "Top Border",
      action: () => applyCellBorders("default", "none", "none", "none"),
    },
    {
      id: "left",
      label: "Left Border",
      action: () => applyCellBorders("none", "none", "none", "default"),
    },
    {
      id: "right",
      label: "Right Border",
      action: () => applyCellBorders("none", "default", "none", "none"),
    },
    {
      id: "none",
      label: "No Border",
      action: () => {
        applyTableBorderType("none");
        applyCellBorders("none", "none", "none", "none");
      },
    },
    {
      id: "all",
      label: "All Borders",
      action: () => {
        applyTableBorderType("all");
        applyCellBorders("default", "default", "default", "default");
      },
    },
    {
      id: "outside",
      label: "Outside Borders",
      action: () => applyTableBorderType("outside"),
    },
    {
      id: "inside",
      label: "Inside Borders",
      action: () => applyTableBorderType("inside"),
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <ToolbarBtn
        onClick={() => setIsOpen(!isOpen)}
        active={isOpen || isTableActive}
        disabled={disabled}
        title="Table Options"
      >
        <span className="text-xs font-bold">Table</span>
      </ToolbarBtn>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 shadow-xl rounded-lg z-[100] min-w-[220px] max-h-[70vh] overflow-y-auto">
          <div className="mb-2 pb-2 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Insert Table
            </p>
            <div className="grid grid-cols-10 gap-1 w-fit mx-auto">
              {Array.from({ length: 10 }).map((_, r) =>
                Array.from({ length: 10 }).map((_, c) => {
                  const isActive = r < hoveredGrid.r && c < hoveredGrid.c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onMouseEnter={() =>
                        setHoveredGrid({ r: r + 1, c: c + 1 })
                      }
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
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
              className="w-full mt-2 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-100 transition-colors"
            >
              Custom Table...
            </button>
          </div>

          {isTableActive && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">
                Borders
              </p>
              <div className="space-y-0.5 pb-1">
                {borderActions.map((border) => (
                  <button
                    key={border.id}
                    type="button"
                    onClick={() => runBorderAction(border.id, border.action)}
                    className={`flex items-center gap-2 px-2 py-1.5 text-[11px] rounded transition-colors w-full text-left ${
                      activeBorderId === border.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-gray-600 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="inline-block h-4 w-4 border border-gray-500" />
                    <span className="flex-1">{border.label}</span>
                    {activeBorderId === border.id && (
                      <span className="text-[10px] text-emerald-600">Aktif</span>
                    )}
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
                  className="px-2 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors w-full text-left"
                >
                  Add Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors w-full text-left"
                >
                  Delete Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-2 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors w-full text-left"
                >
                  Add Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors w-full text-left"
                >
                  Delete Col
                </button>
              </div>
              <button
                type="button"
                onClick={() => editor.chain().focus().mergeCells().run()}
                className="px-2 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors w-full text-left mt-1"
              >
                Merge Cells
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 font-medium rounded transition-colors w-full text-left mt-1"
              >
                Delete Table
              </button>
            </div>
          )}
        </div>
      )}

      {showCustomModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 px-4"
          onMouseDown={(event) => {
            event.preventDefault();
            setShowCustomModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">
                Custom Table
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Tentukan jumlah baris dan kolom tabel.
              </p>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Baris
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={customRows}
                    onChange={(event) => setCustomRows(event.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Kolom
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={customCols}
                    onChange={(event) => setCustomCols(event.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </label>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Maksimal 20 baris dan 10 kolom agar tabel tetap nyaman diedit.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertCustomTable}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
