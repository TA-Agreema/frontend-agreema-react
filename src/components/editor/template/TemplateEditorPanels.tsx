import { useRef, useState, type DragEvent } from "react";
import { ChevronDown, Eye, Info, Plus, Upload, X } from "lucide-react";
import type { FieldDefinition } from "@/services/field.service";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import { DEFAULT_PAPER_SIZE, type PaperSize } from "@/lib/editor-paper";
import { PaginatedPreview } from "@/components/editor/PaginatedPreview";

export { EditorModeTabButton } from "@/components/editor/EditorModeTabs";

export function TemplateUploadTab({
  file,
  onSelect,
  onRemove,
}: {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files[0];
    if (dropped) onSelect(dropped);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      {file ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-50 rounded-xl flex items-center justify-center">
            <Upload className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 mx-auto text-xs text-red-600 hover:text-red-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Hapus file
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-sm border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          <p className="text-sm font-medium">Klik atau seret file ke sini</p>
          <p className="text-xs text-muted-foreground mt-1">
            Mendukung .docx, .pdf (maks. 10 MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.pdf"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) onSelect(selected);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function TemplatePreviewTab({
  content,
  pageMargin,
  paperSize = DEFAULT_PAPER_SIZE,
}: {
  content: string;
  pageMargin: MarginStyle;
  paperSize?: PaperSize;
}) {
  const isEmpty =
    !content || content === "<p></p>" || content === "<p><br></p>";

  if (isEmpty) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Eye className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm">Belum ada konten untuk di-preview</p>
        </div>
      </div>
    );
  }

  return (
    <PaginatedPreview
      content={content}
      pageMargin={pageMargin}
      paperSize={paperSize}
    />
  );
}

function TemplateFieldHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 w-full rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-left hover:bg-emerald-100 transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
          <Info className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-800">
            Cara Menggunakan
          </p>
          <p className="text-xs text-emerald-600">Begini caranya...</p>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-emerald-600 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="mt-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1.5">
          <p className="font-medium">Cara pakai Field Template:</p>
          <ol className="list-decimal list-inside space-y-1 text-emerald-700">
            <li>Klik field untuk menyisipkan placeholder ke editor</li>
            <li>Placeholder tampil sebagai label, misalnya [Nama Lengkap]</li>
            <li>Klik placeholder lalu ketik nilai asli saat menyusun kontrak</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function TemplateFieldItem({
  field,
  onInsert,
}: {
  field: FieldDefinition;
  onInsert: (field: FieldDefinition) => void;
}) {
  return (
    <button
      type="button"
      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer group"
      onClick={() => onInsert(field)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">
          {field.field_label}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          [{field.field_label}]
        </p>
      </div>
    </button>
  );
}

function TemplateFieldGroup({
  title,
  fields,
  onInsert,
}: {
  title: string;
  fields: FieldDefinition[];
  onInsert: (field: FieldDefinition) => void;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pt-3 pb-1.5">
        {title}
      </p>
      {fields.map((field) => (
        <TemplateFieldItem key={field.id} field={field} onInsert={onInsert} />
      ))}
    </div>
  );
}

function groupTemplateFields(fields: FieldDefinition[]) {
  return fields.reduce((groups, field) => {
    const type = field.field_type || "general";
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    const groupFields = groups.get(title) ?? [];
    groupFields.push(field);
    groups.set(title, groupFields);
    return groups;
  }, new Map<string, FieldDefinition[]>());
}

export function TemplateFieldSidebar({
  width,
  fields,
  onInsert,
  onManageFields,
}: {
  width: number;
  fields: FieldDefinition[];
  onInsert: (field: FieldDefinition) => void;
  onManageFields: () => void;
}) {
  const fieldGroups = groupTemplateFields(fields);

  return (
    <aside
      className="shrink-0 border-l bg-card flex flex-col overflow-y-auto"
      style={{ width: `${width}px` }}
    >
      <div className="px-3 pt-3 pb-2 border-b bg-card shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Field Template
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Klik field untuk menyisipkan placeholder
          </p>
        </div>

        <div className="ml-2 shrink-0">
          <button
            type="button"
            onClick={onManageFields}
            className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border bg-background hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-foreground" />
            Kelola Field
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <TemplateFieldHelp />
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Belum ada field aktif.
          </div>
        ) : (
          <div>
            {[...fieldGroups.entries()].map(([title, groupFields]) => (
              <TemplateFieldGroup
                key={title}
                title={title}
                fields={groupFields}
                onInsert={onInsert}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
