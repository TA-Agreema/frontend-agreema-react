/**
 * TemplateSelectModal.tsx
 *
 * Modal pemilihan template sebelum masuk ke editor kontrak.
 * Muncul sebagai langkah pertama saat user klik "Tambah Kontrak".
 *
 * Props:
 *   onSelect(template) — template dipilih, lanjut ke editor
 *   onClose()         — tutup modal / batalkan
 */

import { useEffect, useState } from "react";
import { Search, FileText, Check, X, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { fetchTemplates } from "@/services/template.service";
import type { Template } from "@/types/template";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateOption {
  id: number;
  name: string;
  category: string;
  category_id: number | null;
  description: string;
  lastUpdated: string;
  content: string; // HTML content untuk TipTap
}

interface TemplateSelectModalProps {
  onSelect: (template: TemplateOption) => void;
  onClose: () => void;
}

// ─── Mapper: Template (API) → TemplateOption ──────────────────────────────────

function mapTemplateToOption(t: Template): TemplateOption {
  return {
    id: t.id,
    name: t.name,
    category: t.category ?? "-",
    category_id: t.category_id,
    description: `Template ${t.category ?? ""}`.trim(),
    lastUpdated: t.createdAt ?? t.created_at ?? "-",
    content: t.content ?? "",
  };
}

//  Component 

export default function TemplateSelectModal({
  onSelect,
  onClose,
}: TemplateSelectModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<TemplateOption | null>(null);

  // ── API state ────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTemplates();
        // Hanya tampilkan template yang aktif
        const activeTemplates = data.filter((t) => t.is_active);
        const mapped = activeTemplates.map(mapTemplateToOption);
        setTemplates(mapped);

        // Build category list dari data yang ada
        const uniqueCategories = [
          "Semua",
          ...Array.from(new Set(mapped.map((t) => t.category).filter((c) => c !== "-"))),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Gagal memuat template:", err);
        setError("Gagal memuat data template. Pastikan server berjalan dan Anda sudah login.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = templates.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === "Semua" || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ width: 860, height: 600 }}>
        {/*  Header  */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Pilih Template Kontrak
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pilih template sebagai dasar kontrak sebelum masuk ke editor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/*  Body  */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: category filter */}
          <div className="w-44 shrink-0 border-r bg-gray-50/60 flex flex-col py-3 gap-0.5 px-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Kategori
            </p>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                  activeCategory === cat
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                {activeCategory === cat && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
                <span className={activeCategory === cat ? "" : "ml-3.5"}>
                  {cat}
                </span>
              </button>
            ))}
          </div>

          {/* Right: template grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 py-3 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari template..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                  <p className="text-sm">Memuat template...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3">
                  <AlertCircle className="h-8 w-8 opacity-60" />
                  <p className="text-sm text-center max-w-xs">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <FileText className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Tidak ada template ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((template) => {
                    const isSelected = selected?.id === template.id;
                    const isHovered = hovered === template.id;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelected(template)}
                        onMouseEnter={() => setHovered(template.id)}
                        onMouseLeave={() => setHovered(null)}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                            : isHovered
                              ? "border-gray-300 bg-gray-50 shadow-sm"
                              : "border-gray-200 bg-white"
                        }`}>
                        {/* Check mark */}
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check
                              className="h-3 w-3 text-white"
                              strokeWidth={3}
                            />
                          </span>
                        )}

                        {/* Icon + category */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <div
                            className={`p-1.5 rounded-md ${isSelected ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-500"}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                            {template.category}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                        <p className="text-xs text-gray-300 mt-2">
                          Diperbarui {template.lastUpdated}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/60 shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Gunakan Template
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
