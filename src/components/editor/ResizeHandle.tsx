import { Separator as PanelResizeHandle } from "react-resizable-panels";

export function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1 bg-gray-100/50 hover:bg-emerald-500/30 transition-colors">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 flex flex-col justify-between items-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 rounded-full bg-emerald-500" />
        <div className="w-1 h-1 rounded-full bg-emerald-500" />
        <div className="w-1 h-1 rounded-full bg-emerald-500" />
      </div>
    </PanelResizeHandle>
  );
}
