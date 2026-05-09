import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, LayoutTemplate } from "lucide-react";
import { ToolbarBtn } from "@/components/editor/ToolbarBtn";

export type MarginStyle = {
  top: string;
  bottom: string;
  left: string;
  right: string;
};

export const MARGIN_PRESETS = [
  { id: "normal", label: "Normal", value: { top: "2.54cm", bottom: "2.54cm", left: "2.54cm", right: "2.54cm" } },
  { id: "narrow", label: "Sempit", value: { top: "1.27cm", bottom: "1.27cm", left: "1.27cm", right: "1.27cm" } },
  { id: "moderate", label: "Sedang", value: { top: "2.54cm", bottom: "2.54cm", left: "1.91cm", right: "1.91cm" } },
  { id: "wide", label: "Lebar", value: { top: "2.54cm", bottom: "2.54cm", left: "5.08cm", right: "5.08cm" } },
];

export function MarginDropdown({
  disabled = false,
  margin,
  setMargin,
}: {
  disabled?: boolean;
  margin: MarginStyle;
  setMargin: (m: MarginStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // custom form states
  const [customTop, setCustomTop] = useState(margin.top.replace('cm', ''));
  const [customBottom, setCustomBottom] = useState(margin.bottom.replace('cm', ''));
  const [customLeft, setCustomLeft] = useState(margin.left.replace('cm', ''));
  const [customRight, setCustomRight] = useState(margin.right.replace('cm', ''));

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Sync custom inputs when margin changes externally
  useEffect(() => {
    setCustomTop(margin.top.replace('cm', ''));
    setCustomBottom(margin.bottom.replace('cm', ''));
    setCustomLeft(margin.left.replace('cm', ''));
    setCustomRight(margin.right.replace('cm', ''));
  }, [margin]);

  const handleApplyCustom = () => {
    setMargin({
      top: `${customTop || 0}cm`,
      bottom: `${customBottom || 0}cm`,
      left: `${customLeft || 0}cm`,
      right: `${customRight || 0}cm`,
    });
    setOpen(false);
  };

  const inputCls = "w-full text-xs border border-gray-200 rounded-md bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Page Margins"}>
        <div className="flex items-center gap-0.5">
          <LayoutTemplate className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Margin Preset
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {MARGIN_PRESETS.map((p) => {
              const isActive = 
                p.value.top === margin.top && 
                p.value.bottom === margin.bottom && 
                p.value.left === margin.left && 
                p.value.right === margin.right;
                
              return (
                <button
                  key={p.id}
                  onClick={() => { setMargin(p.value); setOpen(false); }}
                  className={`flex flex-col items-start p-2 rounded border text-left transition-colors ${
                    isActive 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                      : "border-gray-100 hover:bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[11px] font-semibold">{p.label}</span>
                  <span className="text-[9px] text-gray-500 mt-0.5">
                    T/B: {p.value.top.replace('cm','')}cm
                  </span>
                  <span className="text-[9px] text-gray-500">
                    L/R: {p.value.left.replace('cm','')}cm
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Custom Margin (cm)
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 font-medium">Top</label>
                <input type="number" step="0.1" value={customTop} onChange={e => setCustomTop(e.target.value)} className={`${inputCls} py-1 px-1.5`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 font-medium">Bottom</label>
                <input type="number" step="0.1" value={customBottom} onChange={e => setCustomBottom(e.target.value)} className={`${inputCls} py-1 px-1.5`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 font-medium">Left</label>
                <input type="number" step="0.1" value={customLeft} onChange={e => setCustomLeft(e.target.value)} className={`${inputCls} py-1 px-1.5`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 font-medium">Right</label>
                <input type="number" step="0.1" value={customRight} onChange={e => setCustomRight(e.target.value)} className={`${inputCls} py-1 px-1.5`} />
              </div>
            </div>
            <button
              onClick={handleApplyCustom}
              className="w-full mt-1 bg-emerald-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-emerald-700 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
