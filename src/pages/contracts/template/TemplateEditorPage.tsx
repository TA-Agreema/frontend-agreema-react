import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import mammoth from "mammoth";
import { toast } from "sonner";
import {
  Upload,
  Eye,
  LayoutTemplate,
  Copy,
  X,
  ChevronDown,
  Loader2,
  Info,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";

import {
  type MarginStyle,
  MARGIN_PRESETS,
} from "@/components/editor/MarginDropdown";
import { EditorPaper } from "@/components/editor/EditorPaper";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import {
  EditorModeTabButton,
  TemplateFieldSidebar,
  TemplatePreviewTab,
  TemplateUploadTab,
} from "@/components/editor/template/TemplateEditorPanels";

import { FontSize } from "@/lib/tiptap-font-size";
import { FontFamily } from "@/lib/tiptap-font-family";
import { LineHeight } from "@/lib/tiptap-line-height";
import { ContractField, insertContractField } from "@/lib/tiptap-contract-field";
import { prepareContractContentForEditor } from "@/lib/contract-field-values";
import { setEditorContentWithoutHistory } from "@/lib/tiptap-history";
import { convertDocxToEditorHtml } from "@/lib/mammoth-docx-converter";
import { PageBreak } from "@/lib/tiptap-page-break";
import { ResizableTableRow } from "@/lib/tiptap-resizable-table-rows";
import {
  BorderedTableCell,
  BorderedTableHeader,
} from "@/lib/tiptap-table-cell-borders";
import {
  DEFAULT_PAPER_SIZE,
  normalizePaperSize,
  type PaperSize,
} from "@/lib/editor-paper";
import {
  useTemplates,
  type CreateTemplatePayload,
  type UpdateTemplatePayload,
} from "@/hooks/use-template";
import { fetchCategories } from "@/services/category.service";
import {
  fetchFieldDefinitions,
  type FieldDefinition,
} from "@/services/field.service";
import FieldManageModal from "@/components/modal/contract/FieldManageModal";
import UnsavedChangesModal from "@/components/modal/common/UnsavedChangesModal";
import type { Category } from "@/types/category";
import { Navigate } from "react-router-dom";
import PermissionGuard from "@/middlewares/PermissionGuard";

//  Types

type EditorTab = "visual" | "upload" | "preview";

const SIDEBAR_DEFAULT_PX = 260;
const SIDEBAR_MIN_PX = 200;
const SIDEBAR_MAX_PX = 480;

//  Main Page

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const { createTemplate, updateTemplate, getTemplate, loading } =
    useTemplates();
  const draftKey = isEditMode ? `template_draft_${id}` : "template_draft_new";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<null | "left" | "right">(null);
  const templateLoadedRef = useRef(false);
  const newDraftLoadedRef = useRef(false);
  const [leftWidth, setLeftWidth] = useState<number>(SIDEBAR_DEFAULT_PX);
  const [rightWidth, setRightWidth] = useState<number>(SIDEBAR_DEFAULT_PX);

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [activeTab, setActiveTab] = useState<EditorTab>("visual");
  const [uploadedFile, setFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialising, setInit] = useState(true);
  const [editorHtml, setEditorHtml] = useState("");
  const [pageMargin, setPageMargin] = useState<MarginStyle>(
    MARGIN_PRESETS[0].value,
  );
  const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);

  // TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      LineHeight,
      ContractField,
      PageBreak,
      HorizontalRule,
      Table.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            borderType: {
              default: "all",
              parseHTML: (element) => element.getAttribute("data-border-type"),
              renderHTML: (attributes) => ({
                "data-border-type": attributes.borderType,
              }),
            },
          };
        },
      }).configure({
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 24,
      }),
      ResizableTableRow,
      BorderedTableHeader,
      BorderedTableCell,
      ImageResize,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none text-sm leading-7 text-gray-800",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorHtml(html);
      if (html && html !== "<p></p>") {
        localStorage.setItem(draftKey, html);
      }
    },
  });

  const refreshFields = useCallback(async () => {
    try {
      const fieldData = await fetchFieldDefinitions();
      setFields(fieldData.filter((field: FieldDefinition) => field.is_active));
    } catch (err) {
      console.error("Gagal me-refresh field:", err);
    } finally {
      setFieldsLoaded(true);
    }
  }, []);

  // Load categories + field definitions
  useEffect(() => {
    (async () => {
      try {
        const catData = await fetchCategories();
        setCategories(catData.filter((c: Category) => c.is_active));
      } catch (err) {
        console.error("Gagal memuat data awal:", err);
      }
    })();

    refreshFields();
  }, [refreshFields]);

  // Restore new template draft after fields are ready, so old {{field_key}}
  // placeholders can be converted to the latest field mark format.
  useEffect(() => {
    if (isEditMode || !editor || !fieldsLoaded || newDraftLoadedRef.current) {
      return;
    }

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      const preparedContent = prepareContractContentForEditor(
        savedDraft,
        fields,
      );
      setEditorContentWithoutHistory(editor, preparedContent);
      setEditorHtml(preparedContent);
    }

    newDraftLoadedRef.current = true;
    setInit(false);
  }, [isEditMode, editor, fieldsLoaded, fields, draftKey]);

  // Mouse move/up handlers for resizing
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (resizingRef.current === "left") {
        const newWidth = Math.round(e.clientX - rect.left);
        setLeftWidth(
          Math.min(SIDEBAR_MAX_PX, Math.max(SIDEBAR_MIN_PX, newWidth)),
        );
      } else if (resizingRef.current === "right") {
        const newWidth = Math.round(rect.right - e.clientX);
        setRightWidth(
          Math.min(SIDEBAR_MAX_PX, Math.max(SIDEBAR_MIN_PX, newWidth)),
        );
      }
    };

    const onUp = () => {
      resizingRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Load existing template in edit mode
  useEffect(() => {
    if (
      !isEditMode ||
      !editor ||
      !fieldsLoaded ||
      templateLoadedRef.current
    ) {
      return;
    }

    (async () => {
      setInit(true);
      const template = await getTemplate(Number(id));
      templateLoadedRef.current = true;
      if (template) {
        setName(template.name);
        setCategoryId(template.category_id ?? "");
        setStatus(template.status === "Aktif" ? "Active" : "Inactive");
        setPaperSize(normalizePaperSize(template.paper_size));

        // Load draft if exists, otherwise load from DB
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const preparedContent = prepareContractContentForEditor(
            savedDraft,
            fields,
          );
          setEditorContentWithoutHistory(editor, preparedContent);
          setEditorHtml(preparedContent);
        } else if (template.content) {
          const preparedContent = prepareContractContentForEditor(
            template.content,
            fields,
          );
          setEditorContentWithoutHistory(editor, preparedContent);
          setEditorHtml(preparedContent);
        }
      }
      setInit(false);
    })();
  }, [isEditMode, editor, fieldsLoaded, getTemplate, id, draftKey, fields]);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    if (f.name.toLowerCase().endsWith(".docx")) {
      try {
        const arrayBuffer = await f.arrayBuffer();
        const html = await convertDocxToEditorHtml(arrayBuffer);
        if (editor) {
          const preparedContent = prepareContractContentForEditor(html, fields);
          setEditorContentWithoutHistory(editor, preparedContent);
          setEditorHtml(preparedContent);
          setActiveTab("visual");
        }
      } catch (err) {
        console.error("Gagal parse DOCX:", err);
        alert("Gagal mengonversi dokumen DOCX ke HTML.");
      }
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!name.trim()) {
      setSaveError("Nama template wajib diisi.");
      return;
    }
    if (!categoryId) {
      setSaveError("Kategori template wajib dipilih.");
      return;
    }
    const content = editorHtml || editor?.getHTML() || "";
    try {
      if (isEditMode) {
        const payload: UpdateTemplatePayload = {
          id: Number(id),
          name,
          category_id: Number(categoryId),
          is_active: status === "Active",
          paper_size: paperSize,
          content,
          uploadedFile:
            activeTab === "upload" ? (uploadedFile ?? undefined) : undefined,
        };
        await updateTemplate(payload);
        toast.success("Template diperbarui", {
          description: `"${name}" berhasil diperbarui.`,
        });
      } else {
        const payload: CreateTemplatePayload = {
          name,
          category_id: Number(categoryId),
          is_active: status === "Active",
          paper_size: paperSize,
          content,
          uploadedFile:
            activeTab === "upload" ? (uploadedFile ?? undefined) : undefined,
        };
        await createTemplate(payload);
        toast.success("Template dibuat", {
          description: `${name} berhasil dibuat.`,
        });
      }
      // Clear draft on success
      localStorage.removeItem(draftKey);
      navigate("/contracts-templates");
    } catch {
      setSaveError("Gagal menyimpan template. Coba lagi.");
      toast.error("Gagal menyimpan template", {
        description: "Silakan coba lagi.",
      });
    }
  };

  const handleConfirmCancel = () => {
    localStorage.removeItem(draftKey);
    setShowCancelConfirm(false);
    navigate("/contracts-templates");
  };

  if (initialising) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PermissionGuard
      permissions={["create.template", "update.template"]}
      fallback={<Navigate to="/unauthorized" replace />}>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        {/*  Header  */}
        <header className="flex items-center justify-between px-5 h-12 border-b bg-card shadow-sm shrink-0 z-10">
          {/* Agreema logo */}
          <div className="flex items-center gap-2.5">
            <img src="/Agreema.svg" alt="Agreema" className="h-8 w-auto" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {saveError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {saveError}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={loading}
              className="px-4 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors disabled:opacity-50">
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </header>

        {/*  Body: 3-column layout  */}
        <div className="flex flex-1 overflow-hidden" ref={containerRef}>
          {/*  LEFT: Informasi Template  */}
          <aside
            className="shrink-0 border-r bg-card flex flex-col overflow-y-auto"
            style={{ width: `${leftWidth}px` }}>
            <div className="p-4 space-y-1">
              {/* Section header */}
              <div className="pb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Informasi Template
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atur metadata dan kategori template
                </p>
              </div>

              {/* Nama Template */}
              <div className="space-y-1.5 py-1">
                <label className="text-xs font-semibold text-foreground">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Template Perjanjian Kerja Sama"
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  autoFocus={!isEditMode}
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1.5 py-1">
                <label className="text-xs font-semibold text-foreground">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full appearance-none rounded-md border bg-background px-2.5 py-1.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5 py-1">
                <label className="text-xs font-semibold text-foreground">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "Active" | "Inactive")
                    }
                    className="w-full appearance-none rounded-md border bg-background px-2.5 py-1.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </aside>

          {/* draggable divider: left */}
          <div
            className="w-1 cursor-col-resize bg-transparent hover:bg-border"
            onMouseDown={() => (resizingRef.current = "left")}
            onDoubleClick={() => setLeftWidth(SIDEBAR_DEFAULT_PX)}
          />

          {/*  CENTER: Editor  */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center w-full pt-3 border-b bg-card shrink-0">
              <EditorModeTabButton
                active={activeTab === "visual"}
                onClick={() => setActiveTab("visual")}
                icon={<LayoutTemplate className="h-3.5 w-3.5" />}
                label="Editor Visual"
              />
              <EditorModeTabButton
                active={activeTab === "upload"}
                onClick={() => setActiveTab("upload")}
                icon={<Upload className="h-3.5 w-3.5" />}
                label="Upload Dokumen"
              />
              <EditorModeTabButton
                active={activeTab === "preview"}
                onClick={() => setActiveTab("preview")}
                icon={<Eye className="h-3.5 w-3.5" />}
                label="Preview"
              />
            </div>

            {/* Editor content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {activeTab === "visual" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <EditorToolbar
                    editor={editor}
                    pageMargin={pageMargin}
                    setPageMargin={setPageMargin}
                    paperSize={paperSize}
                    setPaperSize={setPaperSize}
                  />
                  <EditorPaper
                    editor={editor}
                    pageMargin={pageMargin}
                    paperSize={paperSize}
                  />
                </div>
              )}
              {activeTab === "upload" && (
                <TemplateUploadTab
                  file={uploadedFile}
                  onSelect={handleFileSelect}
                  onRemove={() => setFile(null)}
                />
              )}
              {activeTab === "preview" && (
                <TemplatePreviewTab
                  content={editorHtml || editor?.getHTML() || ""}
                  pageMargin={pageMargin}
                  paperSize={paperSize}
                />
              )}
            </div>
          </main>

          {/* draggable divider: right */}
          <div
            className="w-1 cursor-col-resize bg-transparent hover:bg-border"
            onMouseDown={() => (resizingRef.current = "right")}
            onDoubleClick={() => setRightWidth(SIDEBAR_DEFAULT_PX)}
          />

          <TemplateFieldSidebar
            width={rightWidth}
            fields={fields}
            onInsert={(field) =>
              insertContractField(editor, field, { display: "label" })
            }
            onManageFields={() => setShowFieldModal(true)}
          />

          {/* Field management modal */}
          {showFieldModal && (
            <FieldManageModal
              onClose={() => setShowFieldModal(false)}
              onRefreshFields={refreshFields}
            />
          )}
          {showCancelConfirm && (
            <UnsavedChangesModal
              message="Template belum disimpan. Jika tetap keluar, progres edit dan draft lokal akan dihapus."
              onClose={() => setShowCancelConfirm(false)}
              onConfirm={handleConfirmCancel}
            />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
