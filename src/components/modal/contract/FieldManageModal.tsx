import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, ChevronLeft, Plus, X } from "lucide-react";
import DeleteModal from "@/components/modal/common/DeleteModal";
import { FieldManageForm } from "@/components/modal/contract/FieldManageForm";
import { FieldManageList } from "@/components/modal/contract/FieldManageList";
import {
  buildFieldKeyFromLabel,
  emptyFieldFormData,
  normalizeFieldIdentity,
  type FieldFormData,
  type FieldManageView,
} from "@/components/modal/contract/field-manage-types";
import {
  createFieldDefinition,
  deleteFieldDefinition,
  fetchFieldDefinitions,
  updateFieldDefinition,
  type FieldDefinition,
} from "@/services/field.service";

interface FieldManageModalProps {
  onClose: () => void;
  onRefreshFields: () => void;
}

function getFieldApiErrorMessage(error: unknown) {
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data as
    | { errors?: Record<string, string[]>; message?: string }
    | undefined;
  const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null;

  if (typeof firstError === "string") return firstError;

  return data?.message || "Gagal menyimpan field.";
}

export default function FieldManageModal({
  onClose,
  onRefreshFields,
}: FieldManageModalProps) {
  const [view, setView] = useState<FieldManageView>("list");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingFieldId, setTogglingFieldId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [fieldToDelete, setFieldToDelete] = useState<FieldDefinition | null>(
    null,
  );
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(emptyFieldFormData);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await fetchFieldDefinitions();
      setFields(data);
      setError(null);
    } catch {
      setError("Gagal memuat daftar field.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadFields();
    });
  }, []);

  const openForm = (field?: FieldDefinition) => {
    setError(null);
    setSuccess(null);
    setEditingField(field ?? null);
    setFormData(
      field
        ? {
            field_label: field.field_label,
            field_key: field.field_key,
            field_type: "text",
            is_required: Boolean(field.is_required),
            is_active: Boolean(field.is_active),
          }
        : emptyFieldFormData,
    );
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingField(null);
    setFormData(emptyFieldFormData);
    setError(null);
  };

  const validateDuplicateField = () => {
    const normalizedLabel = normalizeFieldIdentity(formData.field_label);
    const normalizedKey = normalizeFieldIdentity(formData.field_key);
    const duplicateLabel = fields.find(
      (field) =>
        field.id !== editingField?.id &&
        normalizeFieldIdentity(field.field_label) === normalizedLabel,
    );
    const duplicateKey = fields.find(
      (field) =>
        field.id !== editingField?.id &&
        normalizeFieldIdentity(field.field_key) === normalizedKey,
    );

    if (duplicateLabel) {
      return `Nama field "${formData.field_label.trim()}" sudah digunakan.`;
    }

    if (duplicateKey) {
      return `Kunci field "{{${formData.field_key.trim()}}}" sudah digunakan.`;
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const duplicateMessage = validateDuplicateField();

    if (duplicateMessage) {
      setError(duplicateMessage);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        field_type: "text",
        is_required: false,
        field_label: formData.field_label.trim().replace(/\s+/g, " "),
        field_key: formData.field_key.trim().toLowerCase(),
      };

      if (editingField) {
        await updateFieldDefinition(editingField.id, payload);
      } else {
        await createFieldDefinition(payload);
      }

      await loadFields();
      onRefreshFields();
      setView("list");
    } catch (err) {
      setError(getFieldApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Backend akan hard delete field yang belum dipakai, atau menonaktifkan field yang sudah punya histori.
  const handleDelete = async () => {
    if (!fieldToDelete) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await deleteFieldDefinition(fieldToDelete.id);
      await loadFields();
      onRefreshFields();
      setSuccess(response.message);
      setFieldToDelete(null);
    } catch (err) {
      setError(getFieldApiErrorMessage(err) || "Gagal menghapus field.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (field: FieldDefinition) => {
    setTogglingFieldId(field.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateFieldDefinition(field.id, {
        is_active: !field.is_active,
      });
      await loadFields();
      onRefreshFields();
      setSuccess(
        updated.is_active
          ? `Field "${updated.field_label}" diaktifkan kembali.`
          : `Field "${updated.field_label}" dinonaktifkan.`,
      );
    } catch (err) {
      setError(getFieldApiErrorMessage(err));
    } finally {
      setTogglingFieldId(null);
    }
  };

  const handleLabelChange = (label: string) => {
    setFormData((current) => ({
      ...current,
      field_label: label,
      field_key: editingField ? current.field_key : buildFieldKeyFromLabel(label),
    }));
  };

  const title =
    view === "list"
      ? "Kelola Field"
      : editingField
        ? "Edit Field"
        : "Tambah Field Baru";
  const subtitle =
    view === "list"
      ? "Daftar field yang tersedia untuk kontrak"
      : "Isi detail field untuk ditambahkan ke daftar";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md"
        style={view === "list" ? { height: "520px" } : undefined}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {view === "form" && (
              <button
                type="button"
                onClick={backToList}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={
            view === "list"
              ? "flex-1 overflow-y-auto bg-gray-50/30"
              : "bg-gray-50/30"
          }>
          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-red-600 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="m-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5 text-emerald-700 text-xs">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          {view === "list" ? (
            <FieldManageList
              fields={fields}
              loading={loading}
              togglingFieldId={togglingFieldId}
              onAdd={() => openForm()}
              onEdit={openForm}
              onDelete={setFieldToDelete}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <FieldManageForm
              formData={formData}
              submitting={submitting}
              isEditing={Boolean(editingField)}
              onBack={backToList}
              onSubmit={handleSubmit}
              onChange={setFormData}
              onLabelChange={handleLabelChange}
            />
          )}
        </div>

        {view === "list" && (
          <div className="px-5 py-4 border-t bg-white shrink-0 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
              Tutup
            </button>
            <button
              type="button"
              onClick={() => openForm()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" />
              Tambah Field
            </button>
          </div>
        )}
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
