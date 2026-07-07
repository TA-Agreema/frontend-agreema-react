import type { FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import type { FieldFormData } from "@/components/modal/contract/field-manage-types";

interface FieldManageFormProps {
  formData: FieldFormData;
  submitting: boolean;
  isEditing: boolean;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (data: FieldFormData) => void;
  onLabelChange: (label: string) => void;
}

export function FieldManageForm({
  formData,
  submitting,
  isEditing,
  onBack,
  onSubmit,
  onChange,
  onLabelChange,
}: FieldManageFormProps) {
  return (
    <>
      <form id="field-form" onSubmit={onSubmit} className="p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Nama Field (Label)
          </label>
          <input
            required
            value={formData.field_label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Contoh: Nama Perusahaan"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Kunci Field (Key)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
              {"{{"}
            </span>
            <input
              required
              value={formData.field_key}
              onChange={(event) =>
                onChange({
                  ...formData,
                  field_key: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, ""),
                })
              }
              placeholder="nama_perusahaan"
              className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-8 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
              {"}}"}
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            Kunci unik yang digunakan sebagai placeholder di dalam dokumen.
          </p>
        </div>

        {isEditing && (
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Status Field
                </p>
                <p className="text-xs text-gray-400">
                  Field nonaktif tidak muncul di editor template dan kontrak baru.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.is_active}
                  onChange={(event) =>
                    onChange({ ...formData, is_active: event.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>
        )}
      </form>

      <div className="px-5 py-4 border-t bg-white shrink-0 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
          Kembali
        </button>
        <button
          type="submit"
          form="field-form"
          disabled={submitting || !formData.field_label || !formData.field_key}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Simpan Field
            </>
          )}
        </button>
      </div>
    </>
  );
}
