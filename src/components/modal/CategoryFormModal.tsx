import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Category as ContractCategory } from "@/types/category";

interface CategoryFormModalProps {
  mode: "add" | "edit";
  initial?: ContractCategory;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    is_active: boolean;
  }) => void;
  submitting?: boolean;
}

export default function CategoryFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
  submitting = false,
}: CategoryFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — ukuran & style sesuai spec */}
      <div
        className="relative flex flex-col bg-white"
        style={{
          width: "720px",
          height: "430px",
          flexShrink: 0,
          borderRadius: "10px",
          border: "1px solid rgba(0, 0, 0, 0.10)",
          boxShadow:
            "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)",
        }}>
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {mode === "add" ? "Tambah Kategori Baru" : "Edit Kategori"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add"
                ? "Buat kategori baru untuk mengklasifikasikan kontrak"
                : "Perbarui informasi kategori kontrak"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors -mt-0.5 -mr-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form (scrollable content + sticky footer) ─────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 space-y-4">
            {/* Nama Kategori */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vendor"
                required
                autoFocus
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan penggunaan kategori ini..."
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="relative">
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer">
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                {/* Custom chevron */}
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2 text-sm rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting
                ? "Menyimpan..."
                : mode === "add"
                  ? "Simpan"
                  : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
