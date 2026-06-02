import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Loader2, AlertCircle, Check, ChevronLeft } from "lucide-react";
import { 
  fetchFieldDefinitions, 
  createFieldDefinition, 
  updateFieldDefinition, 
  deleteFieldDefinition,
  type FieldDefinition 
} from "@/services/field.service";
import DeleteModal from "@/components/modal/common/DeleteModal";

interface FieldManageModalProps {
  onClose: () => void;
  onRefreshFields: () => void;
}

type ViewMode = "list" | "form";

export default function FieldManageModal({ onClose, onRefreshFields }: FieldManageModalProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [fieldToDelete, setFieldToDelete] = useState<FieldDefinition | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  
  // Form State
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [formData, setFormData] = useState({
    field_label: "",
    field_key: "",
    field_type: "text",
    is_required: false,
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await fetchFieldDefinitions();
      setFields(data);
      setError(null);
    } catch (err) {
      setError("Gagal memuat daftar field.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (field?: FieldDefinition) => {
    if (field) {
      setEditingField(field);
      setFormData({
        field_label: field.field_label,
        field_key: field.field_key,
        field_type: field.field_type,
        is_required: !!field.is_required,
      });
    } else {
      setEditingField(null);
      setFormData({
        field_label: "",
        field_key: "",
        field_type: "text",
        is_required: false,
      });
    }
    setView("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingField) {
        await updateFieldDefinition(editingField.id, formData);
      } else {
        await createFieldDefinition(formData);
      }
      await loadFields();
      onRefreshFields();
      setView("list");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan field.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!fieldToDelete) return;

    setDeleting(true);
    try {
      await deleteFieldDefinition(fieldToDelete.id);
      await loadFields();
      onRefreshFields();
      setFieldToDelete(null);
    } catch (err) {
      setError("Gagal menghapus field.");
    } finally {
      setDeleting(false);
    }
  };

  const generateKeyFromLabel = (label: string) => {
    if (editingField) return; // Don't auto-generate if editing
    const key = label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    setFormData(prev => ({ ...prev, field_key: key }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md" style={{ height: "520px" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {view === "form" && (
              <button 
                onClick={() => setView("list")}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {view === "list" ? "Kelola Field" : (editingField ? "Edit Field" : "Tambah Field Baru")}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {view === "list" ? "Daftar field yang tersedia untuk kontrak" : "Isi detail field untuk ditambahkan ke daftar"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-red-600 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {view === "list" ? (
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm">Memuat daftar field...</p>
                </div>
              ) : fields.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Belum ada field khusus</p>
                  <p className="text-xs text-gray-400 mt-1">Tambahkan field pertama Anda untuk mempermudah pengisian kontrak.</p>
                </div>
              ) : (
                fields.map((field) => (
                  <div key={field.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-gray-800 truncate">{field.field_label}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{`{{${field.field_key}}}`}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenForm(field)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setFieldToDelete(field)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form id="field-form" onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Field (Label)</label>
                <input 
                  required
                  value={formData.field_label}
                  onChange={(e) => {
                    setFormData({ ...formData, field_label: e.target.value });
                    generateKeyFromLabel(e.target.value);
                  }}
                  placeholder="Contoh: Nama Perusahaan"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kunci Field (Key)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">{"{{"}</span>
                  <input 
                    required
                    value={formData.field_key}
                    onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    placeholder="nama_perusahaan"
                    className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-8 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">{"}}"}</span>
                </div>
                <p className="text-[10px] text-gray-400">Kunci unik yang digunakan sebagai placeholder di dalam dokumen.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tipe Data</label>
                  <select 
                    value={formData.field_type}
                    onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="text">Teks Pendek</option>
                    <option value="longtext">Teks Panjang</option>
                    <option value="number">Angka</option>
                    <option value="date">Tanggal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Wajib Diisi</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.is_required}
                        onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-3 text-xs font-medium text-gray-600">{formData.is_required ? "Ya" : "Tidak"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-white shrink-0 flex items-center justify-between">
          {view === "list" ? (
            <>
              <button 
                onClick={onClose}
                className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => handleOpenForm()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Field
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setView("list")}
                className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Kembali
              </button>
              <button 
                type="submit"
                form="field-form"
                disabled={submitting || !formData.field_label || !formData.field_key}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
            </>
          )}
        </div>
      </div>
      {fieldToDelete && (
        <DeleteModal
          title="Hapus Field"
          itemName={fieldToDelete.field_label}
          isLoading={deleting}
          onClose={() => setFieldToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
