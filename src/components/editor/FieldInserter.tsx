import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { ChevronDown, Plus } from "lucide-react";
import { insertContractField } from "@/lib/tiptap-contract-field";

export interface FieldDefinition {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_active: boolean;
}

export function FieldInserter({
  editor,
  fields,
  onAddField,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  fields: FieldDefinition[];
  onAddField: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const insertField = (field: FieldDefinition) => {
    insertContractField(editor, field, { display: "label" });
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        type="button"
        title={disabled ? "Fitur dinonaktifkan" : "Insert Field"}
        disabled={disabled}
        className={`px-2 py-1.5 text-sm rounded border border-gray-200 bg-white ${disabled ? "text-gray-300 cursor-not-allowed opacity-60" : "hover:bg-gray-50 cursor-pointer text-gray-700"} flex items-center gap-1`}>
        <span className="text-xs font-semibold">Field</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="max-h-[160px] overflow-y-auto pb-10">
            {fields.length > 0 ? (
              fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => insertField(field)}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0">
                  <div className="font-semibold text-gray-800">{field.field_label}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-400">Tidak ada field</div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
            <button
              onClick={() => !disabled && onAddField()}
              type="button"
              disabled={disabled}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-xs rounded border border-dashed border-emerald-300 ${disabled ? "text-gray-300 cursor-not-allowed bg-white/50" : "text-emerald-600 hover:bg-emerald-50"} transition-colors font-medium`}>
              <Plus className="h-3.5 w-3.5" />
              Kelola Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
