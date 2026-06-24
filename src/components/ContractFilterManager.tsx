import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Filter,
  Eye,
  // Plus,
  // Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  Search,
} from "lucide-react";
import { fetchFieldDefinitions, type FieldDefinition } from "@/services/field.service";
import type { CustomFilter } from "@/hooks/useContractFilter";

interface ContractFilterManagerProps {
  // Search state & set
  search: string;
  setSearch: (search: string) => void;
  placeholder?: string;

  // Year state & set
  startYearFilter: string;
  setStartYearFilter: (year: string) => void;
  endYearFilter: string;
  setEndYearFilter: (year: string) => void;
  availableYears: string[];

  // Optional Status filter (hidden if omitted)
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  statusOptions?: { label: string; value: string }[];

  // Custom filters list state & set
  customFilters: CustomFilter[];
  setCustomFilters: (filters: CustomFilter[]) => void;

  // Visible column IDs (field definition IDs) state & set
  visibleFields: number[];
  setVisibleFields: (fields: number[]) => void;

  // Reset handler
  onReset: () => void;
}

export default function ContractFilterManager({
  search,
  setSearch,
  placeholder = "Cari kontrak...",
  startYearFilter,
  setStartYearFilter,
  endYearFilter,
  setEndYearFilter,
  availableYears,
  statusFilter,
  setStatusFilter,
  statusOptions = [],
  customFilters,
  // setCustomFilters,
  visibleFields,
  setVisibleFields,
  onReset,
}: ContractFilterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Load dynamic custom fields
  useEffect(() => {
    const loadFields = async () => {
      setIsLoadingFields(true);
      try {
        const fields = await fetchFieldDefinitions();
        // Only keep active fields
        setFieldDefinitions(fields.filter((f) => f.is_active));
      } catch (err) {
        console.error("Failed to load field definitions for filters", err);
      } finally {
        setIsLoadingFields(false);
      }
    };
    loadFields();
  }, []);

  // Total active filters count (search + year + status + custom filters count)
  const activeFiltersCount =
    (search ? 1 : 0) +
    (startYearFilter !== "all" ? 1 : 0) +
    (endYearFilter !== "all" ? 1 : 0) +
    (statusFilter && statusFilter !== "all" ? 1 : 0) +
    customFilters.length;

  // Toggle dynamic column visibility
  const toggleFieldColumn = (fieldId: number) => {
    if (visibleFields.includes(fieldId)) {
      setVisibleFields(visibleFields.filter((id) => id !== fieldId));
    } else {
      setVisibleFields([...visibleFields, fieldId]);
    }
  };

  // Add a new empty custom filter rule
  // const addCustomFilterRule = () => {
  //   if (fieldDefinitions.length === 0) return;
  //   // Default to the first custom field definition
  //   const firstField = fieldDefinitions[0];
  //   const newRule: CustomFilter = {
  //     fieldId: firstField.id,
  //     operator: "contains",
  //     value: "",
  //   };
  //   setCustomFilters([...customFilters, newRule]);
  // };

  // // Remove a custom filter rule at an index
  // const removeCustomFilterRule = (index: number) => {
  //   setCustomFilters(customFilters.filter((_, idx) => idx !== index));
  // };

  // // Update a custom filter rule field value
  // const updateCustomFilterRule = (index: number, updates: Partial<CustomFilter>) => {
  //   setCustomFilters(
  //     customFilters.map((rule, idx) => (idx === index ? { ...rule, ...updates } : rule))
  //   );
  // };

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden transition-all duration-200 shadow-sm">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 gap-3 border-b bg-muted/10">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filter Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border font-medium transition-all duration-200 ${isOpen
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs"
              : "bg-background border-border text-foreground hover:bg-muted/50"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter & Kolom</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center bg-emerald-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
                {activeFiltersCount}
              </span>
            )}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/60 rounded-lg transition-colors border border-red-200/50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filters & Column Panel */}
      {isOpen && (
        <div className="p-5 bg-card border-t border-border grid grid-cols-1 lg:grid-cols-7 gap-6 animate-in fade-in duration-200">
          {/* Section 1: Column Manager (left, col-span 4) */}
          <div className="lg:col-span-4 border-r border-border/80 pr-0 lg:pr-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Eye className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">Kolom Tabel Tambahan</h3>
            </div>
            {isLoadingFields ? (
              <p className="text-xs text-muted-foreground italic">Memuat kolom kustom...</p>
            ) : fieldDefinitions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Tidak ada kolom kustom yang didefinisikan.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {fieldDefinitions.map((field) => {
                  const isChecked = visibleFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition-all hover:bg-muted/30 ${isChecked
                        ? "bg-emerald-50/40 border-emerald-200 text-emerald-950 font-medium"
                        : "bg-background border-border text-muted-foreground"
                        }`}
                    >
                      <span>{field.field_label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFieldColumn(field.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-normal">
              * Kolom data pokok seperti Judul, Partner, Kategori, Status, dan Periode akan selalu
              ditampilkan.
            </p>
          </div>

          {/* Section 2: Standard filters (middle, col-span 3) */}
          <div className="lg:col-span-3 border-r border-border/80 pr-0 lg:pr-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Filter className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">Filter Cepat</h3>
            </div>

            {/* Year Dropdown Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tahun Mulai</label>
              <select
                value={startYearFilter}
                onChange={(e) => setStartYearFilter(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    Tahun {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tahun Selesai</label>
              <select
                value={endYearFilter}
                onChange={(e) => setEndYearFilter(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    Tahun {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown Filter (optional) */}
            {setStatusFilter && statusOptions.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-muted-foreground">Status Kontrak</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="all">Semua Status</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 3: Advanced custom fields filters manager (right, col-span 5) */}
          {/* <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-foreground">Filter Kolom Kustom</h3>
              </div>
              {fieldDefinitions.length > 0 && (
                <button
                  onClick={addCustomFilterRule}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#268257] hover:text-[#1b5e3f] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Rule
                </button>
              )}
            </div> */}

          {/* {customFilters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-lg bg-muted/5">
                <Filter className="h-6 w-6 text-muted-foreground/45 mb-1" />
                <p className="text-xs text-muted-foreground">Tidak ada filter kustom aktif.</p>
                <p className="text-[10px] text-muted-foreground/70">
                  Tambahkan filter untuk mencari isi kolom kustom.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                {customFilters.map((rule, idx) => {
                  const selectedField = fieldDefinitions.find((f) => f.id === rule.fieldId);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border bg-background">
                      {/* Select Field */}
          {/* <select
                        value={rule.fieldId}
                        onChange={(e) =>
                          updateCustomFilterRule(idx, { fieldId: Number(e.target.value) })
                        }
                        className="flex-1 min-w-0 rounded border bg-card px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {fieldDefinitions.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.field_label}
                          </option>
                        ))}
                      </select> */}

          {/* Select Operator */}
          {/* <select
                        value={rule.operator}
                        onChange={(e) =>
                          updateCustomFilterRule(idx, {
                            operator: e.target.value as CustomFilter["operator"],
                          })
                        }
                        className="w-28 rounded border bg-card px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="contains">Berisi</option>
                        <option value="equals">Sama dengan</option>
                        <option value="empty">Kosong</option>
                        <option value="not_empty">Tidak kosong</option>
                      </select> */}

          {/* Value Input (hide if operator is empty or not_empty) */}
          {/* {rule.operator !== "empty" && rule.operator !== "not_empty" ? (
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateCustomFilterRule(idx, { value: e.target.value })}
                          placeholder="Nilai..."
                          className="w-32 rounded border bg-card px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <div className="w-32" />
                      )} */}

          {/* Remove Rule Button */}
          {/* <button
                        onClick={() => removeCustomFilterRule(idx)}
                        className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button> */}
          {/* </div>
                  );
                })}
              </div>
            )} */}
          {/* </div> */}
        </div>
      )}
    </div>
  );
}
