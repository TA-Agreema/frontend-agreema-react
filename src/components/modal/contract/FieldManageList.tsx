import { Edit2, Loader2, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import type { FieldDefinition } from "@/services/field.service";

interface FieldManageListProps {
  fields: FieldDefinition[];
  loading: boolean;
  togglingFieldId: number | null;
  onAdd: () => void;
  onEdit: (field: FieldDefinition) => void;
  onDelete: (field: FieldDefinition) => void;
  onToggleStatus: (field: FieldDefinition) => void;
}

function FieldStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
          : "border-gray-200 bg-gray-50 text-gray-400"
      }`}>
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function EmptyFieldState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Plus className="h-6 w-6 text-gray-300" />
      </div>
      <p className="text-sm text-gray-500 font-medium">Belum ada field khusus</p>
      <p className="text-xs text-gray-400 mt-1">
        Tambahkan field pertama Anda untuk mempermudah pengisian kontrak.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
        <Plus className="h-4 w-4" />
        Tambah Field
      </button>
    </div>
  );
}

export function FieldManageList({
  fields,
  loading,
  togglingFieldId,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
}: FieldManageListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm">Memuat daftar field...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return <EmptyFieldState onAdd={onAdd} />;
  }

  return (
    <div className="p-4 space-y-2">
      {fields.map((field) => {
        const isToggling = togglingFieldId === field.id;

        return (
          <div
            key={field.id}
            className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between group hover:border-emerald-200 transition-colors">
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {field.field_label}
                </p>
                <FieldStatusBadge active={field.is_active} />
              </div>
              <p className="text-[10px] text-gray-400 font-mono truncate">
                {`{{${field.field_key}}}`}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(field)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Edit field">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus(field)}
                disabled={isToggling}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                title={field.is_active ? "Nonaktifkan field" : "Aktifkan field"}>
                {isToggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : field.is_active ? (
                  <PowerOff className="h-3.5 w-3.5" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onDelete(field)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Hapus field">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
