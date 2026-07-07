import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import { toast } from "sonner";
import {
  Upload,
  Eye,
  LayoutTemplate,
  ChevronDown,
  Loader2,
  // Info,
  AlertCircle,
  // Plus,
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
import {
  ContractField,
  insertContractField,
} from "@/lib/tiptap-contract-field";
import { prepareContractContentForEditor } from "@/lib/contract-field-values";
import { setEditorContentWithoutHistory } from "@/lib/tiptap-history";
import { convertDocxToEditorHtml } from "@/lib/mammoth-docx-converter";
import { PageBreak } from "@/lib/tiptap-page-break";
import { ResizableTable } from "@/lib/tiptap-resizable-table";
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
  appendWatermarkToContent,
  DEFAULT_WATERMARK_SETTINGS,
  extractWatermarkFromContent,
  type WatermarkSettings,
} from "@/lib/editor-watermark";
import {
  appendMarginsToContent,
  extractMarginsFromContent,
  DEFAULT_MARGINS,
} from "@/lib/editor-margins";
import { createPdfPreviewFilename } from "@/lib/pdf-preview";
import { useTemplates } from "@/hooks/use-template";
import { usePdfPreview } from "@/hooks/use-pdf-preview";
import { fetchCategories } from "@/services/category.service";
import {
  fetchFieldDefinitions,
  type FieldDefinition,
} from "@/services/field.service";
import {
  deleteTemplate,
  downloadTemplatePdf,
} from "@/services/template.service";
import FieldManageModal from "@/components/modal/contract/FieldManageModal";
import UnsavedChangesModal from "@/components/modal/common/UnsavedChangesModal";
import ConfirmModal from "@/components/modal/common/ConfirmModal";
import type { Category } from "@/types/category";
import { Navigate } from "react-router-dom";
import PermissionGuard from "@/middlewares/PermissionGuard";

//  Types

type EditorTab = "visual" | "upload" | "preview";
type TemplateStatus = "Active" | "Inactive";
type ResizeTarget = "left" | "right";

const SIDEBAR_DEFAULT_PX = 260;
const SIDEBAR_MIN_PX = 200;
const SIDEBAR_MAX_PX = 480;

const TEMPLATE_EDITOR_EXTENSIONS = [
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
  ResizableTable.configure({
    resizable: true,
    lastColumnResizable: true,
    cellMinWidth: 1,
  }),
  ResizableTableRow,
  BorderedTableHeader,
  BorderedTableCell,
  ImageResize,
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const responseData = (
    error as {
      response?: {
        data?: {
          message?: string;
          errors?: Record<string, string[]>;
        };
      };
    }
  )?.response?.data;

  if (responseData?.message) return responseData.message;

  const firstError = responseData?.errors
    ? Object.values(responseData.errors)[0]?.[0]
    : null;

  return firstError ?? fallback;
};

const clampSidebarWidth = (width: number) =>
  Math.min(SIDEBAR_MAX_PX, Math.max(SIDEBAR_MIN_PX, width));

function useResizableSidebars() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<ResizeTarget | null>(null);
  const [leftWidth, setLeftWidth] = useState(SIDEBAR_DEFAULT_PX);
  const [rightWidth, setRightWidth] = useState(SIDEBAR_DEFAULT_PX);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const width =
        resizingRef.current === "left"
          ? event.clientX - containerRect.left
          : containerRect.right - event.clientX;
      const setWidth =
        resizingRef.current === "left" ? setLeftWidth : setRightWidth;

      setWidth(clampSidebarWidth(Math.round(width)));
    };

    const stopResizing = () => {
      resizingRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  return {
    containerRef,
    leftWidth,
    rightWidth,
    startResizing: (target: ResizeTarget) => {
      resizingRef.current = target;
    },
    resetLeftWidth: () => setLeftWidth(SIDEBAR_DEFAULT_PX),
    resetRightWidth: () => setRightWidth(SIDEBAR_DEFAULT_PX),
  };
}

interface TemplateEditorHeaderProps {
  loading: boolean;
  saveError: string | null;
  onCancel: () => void;
  onSave: () => void;
}

function TemplateEditorHeader({
  loading,
  saveError,
  onCancel,
  onSave,
}: TemplateEditorHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 h-12 border-b bg-card shadow-sm shrink-0 z-10">
      <div className="flex items-center gap-2.5">
        <img src="/Agreema.svg" alt="Agreema" className="h-8 w-auto" />
      </div>

      <div className="flex items-center gap-2">
        {saveError && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {saveError}
          </div>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors disabled:opacity-50">
          Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Simpan
        </button>
      </div>
    </header>
  );
}

interface TemplateMetadataSidebarProps {
  width: number;
  name: string;
  categoryId: number | "";
  categories: Category[];
  status: TemplateStatus;
  isEditMode: boolean;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: number | "") => void;
  onStatusChange: (value: TemplateStatus) => void;
}

function TemplateMetadataSidebar({
  width,
  name,
  categoryId,
  categories,
  status,
  isEditMode,
  onNameChange,
  onCategoryChange,
  onStatusChange,
}: TemplateMetadataSidebarProps) {
  return (
    <aside
      className="shrink-0 border-r bg-card flex flex-col overflow-y-auto"
      style={{ width: `${width}px` }}>
      <div className="p-4 space-y-1">
        <div className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Informasi Template
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur metadata dan kategori template
          </p>
        </div>

        <div className="space-y-1.5 py-1">
          <label className="text-xs font-semibold text-foreground">
            Nama Template <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Template Perjanjian Kerja Sama"
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            autoFocus={!isEditMode}
          />
        </div>

        <div className="space-y-1.5 py-1">
          <label className="text-xs font-semibold text-foreground">
            Kategori <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(event) =>
                onCategoryChange(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              className="w-full appearance-none rounded-md border bg-background px-2.5 py-1.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5 py-1">
          <label className="text-xs font-semibold text-foreground">
            Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as TemplateStatus)
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
  );
}

interface ResizeDividerProps {
  target: ResizeTarget;
  onStart: (target: ResizeTarget) => void;
  onReset: () => void;
}

function ResizeDivider({ target, onStart, onReset }: ResizeDividerProps) {
  return (
    <div
      className="w-1 cursor-col-resize bg-transparent hover:bg-border"
      onMouseDown={() => onStart(target)}
      onDoubleClick={onReset}
    />
  );
}

interface TemplateEditorWorkspaceProps {
  editor: Editor | null;
  activeTab: EditorTab;
  uploadedFile: File | null;
  pageMargin: MarginStyle;
  paperSize: PaperSize;
  watermark: WatermarkSettings;
  pdfPreviewUrl: string | null;
  pdfPreviewFilename: string | null;
  pdfPreviewError: string | null;
  isPreparingPdfPreview: boolean;
  onTabChange: (tab: EditorTab) => void;
  onOpenPreview: () => void;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  setPageMargin: Dispatch<SetStateAction<MarginStyle>>;
  setPaperSize: Dispatch<SetStateAction<PaperSize>>;
  setWatermark: Dispatch<SetStateAction<WatermarkSettings>>;
}

function TemplateEditorWorkspace({
  editor,
  activeTab,
  uploadedFile,
  pageMargin,
  paperSize,
  watermark,
  pdfPreviewUrl,
  pdfPreviewFilename,
  pdfPreviewError,
  isPreparingPdfPreview,
  onTabChange,
  onOpenPreview,
  onFileSelect,
  onFileRemove,
  setPageMargin,
  setPaperSize,
  setWatermark,
}: TemplateEditorWorkspaceProps) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center w-full pt-3 border-b bg-card shrink-0">
        <EditorModeTabButton
          active={activeTab === "visual"}
          onClick={() => onTabChange("visual")}
          icon={<LayoutTemplate className="h-3.5 w-3.5" />}
          label="Editor Visual"
        />
        <EditorModeTabButton
          active={activeTab === "upload"}
          onClick={() => onTabChange("upload")}
          icon={<Upload className="h-3.5 w-3.5" />}
          label="Upload Dokumen"
        />
        <EditorModeTabButton
          active={activeTab === "preview"}
          onClick={onOpenPreview}
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Preview"
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {activeTab === "visual" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <EditorToolbar
              editor={editor}
              pageMargin={pageMargin}
              setPageMargin={setPageMargin}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
              watermark={watermark}
              setWatermark={setWatermark}
            />
            <EditorPaper
              editor={editor}
              pageMargin={pageMargin}
              paperSize={paperSize}
              watermark={watermark}
            />
          </div>
        )}
        {activeTab === "upload" && (
          <TemplateUploadTab
            file={uploadedFile}
            onSelect={onFileSelect}
            onRemove={onFileRemove}
          />
        )}
        {activeTab === "preview" && (
          <TemplatePreviewTab
            pdfPreviewUrl={pdfPreviewUrl}
            pdfPreviewFilename={pdfPreviewFilename}
            pdfPreviewError={pdfPreviewError}
            isPreparingPdfPreview={isPreparingPdfPreview}
          />
        )}
      </div>
    </main>
  );
}

interface TemplateEditorModalsProps {
  showFieldModal: boolean;
  showCancelConfirm: boolean;
  uploadNotice: string | null;
  onCloseFieldModal: () => void;
  onRefreshFields: () => Promise<void>;
  onCloseCancelConfirm: () => void;
  onConfirmCancel: () => void;
  onCloseUploadNotice: () => void;
}

function TemplateEditorModals({
  showFieldModal,
  showCancelConfirm,
  uploadNotice,
  onCloseFieldModal,
  onRefreshFields,
  onCloseCancelConfirm,
  onConfirmCancel,
  onCloseUploadNotice,
}: TemplateEditorModalsProps) {
  return (
    <>
      {showFieldModal && (
        <FieldManageModal
          onClose={onCloseFieldModal}
          onRefreshFields={onRefreshFields}
        />
      )}
      {showCancelConfirm && (
        <UnsavedChangesModal
          message="Template belum disimpan. Jika tetap keluar, progres edit dan draft lokal akan dihapus."
          onClose={onCloseCancelConfirm}
          onConfirm={onConfirmCancel}
        />
      )}
      {uploadNotice && (
        <ConfirmModal
          title="Upload Dokumen Gagal"
          message={uploadNotice}
          icon={AlertCircle}
          tone="warning"
          confirmLabel="Mengerti"
          cancelLabel="Tutup"
          onClose={onCloseUploadNotice}
          onConfirm={onCloseUploadNotice}
        />
      )}
    </>
  );
}

function TemplateEditorLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

//  Main Page

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const { createTemplate, updateTemplate, getTemplate, loading } =
    useTemplates();
  const draftKey = isEditMode ? `template_draft_${id}` : "template_draft_new";

  const templateLoadedRef = useRef(false);
  const newDraftLoadedRef = useRef(false);
  const previewCreatedTemplateIdRef = useRef<number | null>(null);
  const {
    containerRef,
    leftWidth,
    rightWidth,
    startResizing,
    resetLeftWidth,
    resetRightWidth,
  } = useResizableSidebars();

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [allFields, setAllFields] = useState<FieldDefinition[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [persistedTemplateId, setPersistedTemplateId] = useState<number | null>(
    id ? Number(id) : null,
  );
  const [status, setStatus] = useState<TemplateStatus>("Active");
  const [activeTab, setActiveTab] = useState<EditorTab>("visual");
  const [uploadedFile, setFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialising, setInit] = useState(true);
  const [editorHtml, setEditorHtml] = useState("");
  const [pageMargin, setPageMargin] = useState<MarginStyle>(
    MARGIN_PRESETS[0].value,
  );
  const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);
  const [watermark, setWatermark] = useState<WatermarkSettings>(
    DEFAULT_WATERMARK_SETTINGS,
  );

  // TipTap
  const editor = useEditor({
    extensions: TEMPLATE_EDITOR_EXTENSIONS,
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
        localStorage.setItem(
          draftKey,
          appendMarginsToContent(
            appendWatermarkToContent(html, watermark),
            pageMargin,
          ),
        );
      }
    },
  });

  useEffect(() => {
    const html = editorHtml || editor?.getHTML() || "";
    if (html && html !== "<p></p>") {
      localStorage.setItem(
        draftKey,
        appendMarginsToContent(
          appendWatermarkToContent(html, watermark),
          pageMargin,
        ),
      );
    }
  }, [draftKey, editor, editorHtml, watermark, pageMargin]);

  const refreshFields = useCallback(async () => {
    try {
      const fieldData = await fetchFieldDefinitions();
      setAllFields(fieldData);
      setFields(fieldData.filter((field: FieldDefinition) => field.is_active));
    } catch (err) {
      console.error("Gagal me-refresh field:", err);
    } finally {
      setFieldsLoaded(true);
    }
  }, []);

  // Load categories + field definitions
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const [categoryResult, fieldResult] = await Promise.allSettled([
        fetchCategories(),
        fetchFieldDefinitions(),
      ]);

      if (!isMounted) {
        return;
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(
          categoryResult.value.filter((c: Category) => c.is_active),
        );
      } else {
        console.error("Gagal memuat data kategori:", categoryResult.reason);
      }

      if (fieldResult.status === "fulfilled") {
        setAllFields(fieldResult.value);
        setFields(
          fieldResult.value.filter(
            (field: FieldDefinition) => field.is_active,
          ),
        );
      } else {
        console.error("Gagal me-refresh field:", fieldResult.reason);
      }

      setFieldsLoaded(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Restore new template draft after fields are ready, so old {{field_key}}
  // placeholders can be converted to the latest field mark format.
  useEffect(() => {
    if (isEditMode || !editor || !fieldsLoaded || newDraftLoadedRef.current) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const extracted = extractMarginsFromContent(savedDraft);
        const watermarkExtracted = extractWatermarkFromContent(
          extracted.content,
        );
        setWatermark(watermarkExtracted.watermark);
        setPageMargin(extracted.margins || DEFAULT_MARGINS);
        const preparedContent = prepareContractContentForEditor(
          watermarkExtracted.content,
          allFields,
        );
        setEditorContentWithoutHistory(editor, preparedContent);
        setEditorHtml(preparedContent);
      }

      newDraftLoadedRef.current = true;
      setInit(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editor, fieldsLoaded, allFields, draftKey]);

  // Load existing template in edit mode
  useEffect(() => {
    if (!isEditMode || !editor || !fieldsLoaded || templateLoadedRef.current) {
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
          const extractedMargins = extractMarginsFromContent(savedDraft);
          const extracted = extractWatermarkFromContent(
            extractedMargins.content,
          );
          setWatermark(extracted.watermark);
          setPageMargin(extractedMargins.margins || DEFAULT_MARGINS);
          const preparedContent = prepareContractContentForEditor(
            extracted.content,
            allFields,
          );
          setEditorContentWithoutHistory(editor, preparedContent);
          setEditorHtml(preparedContent);
        } else if (template.content) {
          const extractedMargins = extractMarginsFromContent(template.content);
          const extracted = extractWatermarkFromContent(
            extractedMargins.content,
          );
          setWatermark(extracted.watermark);
          setPageMargin(extractedMargins.margins || DEFAULT_MARGINS);
          const preparedContent = prepareContractContentForEditor(
            extracted.content,
            allFields,
          );
          setEditorContentWithoutHistory(editor, preparedContent);
          setEditorHtml(preparedContent);
        }
      }
      setInit(false);
    })();
  }, [isEditMode, editor, fieldsLoaded, getTemplate, id, draftKey, allFields]);

  const handleFileSelect = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setUploadNotice("Hanya file .docx yang dapat diimpor ke editor.");
      return;
    }

    setFile(f);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const html = await convertDocxToEditorHtml(arrayBuffer);
      if (editor) {
        const preparedContent = prepareContractContentForEditor(
          html,
          allFields,
        );
        setWatermark(DEFAULT_WATERMARK_SETTINGS);
        setEditorContentWithoutHistory(editor, preparedContent);
        setEditorHtml(preparedContent);
        setActiveTab("visual");
      }
    } catch (err) {
      console.error("Gagal parse DOCX:", err);
      setUploadNotice("Gagal mengonversi dokumen DOCX ke HTML.");
    }
  };

  const getEditorContentWithWatermark = () =>
    appendWatermarkToContent(editorHtml || editor?.getHTML() || "", watermark);

  const getPreviewCategoryId = () =>
    categoryId ? Number(categoryId) : categories[0]?.id;

  const buildTemplatePayload = (
    overrides?: Partial<{
      name: string;
      category_id: number;
    }>,
  ) => ({
    name: overrides?.name ?? name,
    category_id: overrides?.category_id ?? Number(categoryId),
    is_active: status === "Active",
    paper_size: paperSize,
    // include margins metadata so backend can pick up page margins when rendering PDF
    content: appendMarginsToContent(
      getEditorContentWithWatermark(),
      pageMargin,
    ),
    uploadedFile:
      activeTab === "upload" ? (uploadedFile ?? undefined) : undefined,
  });

  const createPdfPreviewSignature = () =>
    JSON.stringify({
      name,
      category_id: Number(categoryId),
      is_active: status === "Active",
      paper_size: paperSize,
      content: appendMarginsToContent(
        getEditorContentWithWatermark(),
        pageMargin,
      ),
      uploaded_file:
        activeTab === "upload" && uploadedFile
          ? {
              name: uploadedFile.name,
              size: uploadedFile.size,
              lastModified: uploadedFile.lastModified,
            }
          : null,
    });

  const persistTemplate = async (options?: { forPreview?: boolean }) => {
    setSaveError(null);
    const isPreview = options?.forPreview ?? false;
    const previewCategoryId = getPreviewCategoryId();
    const payloadOverrides = isPreview
      ? {
          name: name.trim() || `Preview Template Kontrak `,
          category_id: previewCategoryId,
        }
      : undefined;

    if (!isPreview && !name.trim()) {
      setSaveError("Nama template wajib diisi.");
      return undefined;
    }
    if (!isPreview && !categoryId) {
      setSaveError("Kategori template wajib dipilih.");
      return undefined;
    }
    if (isPreview && !previewCategoryId) {
      throw new Error(
        "Kategori template belum tersedia untuk membuat preview PDF.",
      );
    }

    try {
      const templateId = persistedTemplateId ?? (id ? Number(id) : null);
      if (templateId) {
        const updated = await updateTemplate({
          ...buildTemplatePayload(payloadOverrides),
          id: templateId,
        });
        setPersistedTemplateId(updated.id);
        localStorage.removeItem(draftKey);
        return updated;
      } else {
        const created = await createTemplate(
          buildTemplatePayload(payloadOverrides),
        );
        if (isPreview) {
          previewCreatedTemplateIdRef.current = created.id;
        }
        setPersistedTemplateId(created.id);
        localStorage.removeItem(draftKey);
        return created;
      }
    } catch (error) {
      setSaveError(
        getApiErrorMessage(error, "Gagal menyimpan template. Coba lagi."),
      );
      return undefined;
    }
  };

  const handleSave = async () => {
    const savedTemplate = await persistTemplate();
    if (savedTemplate) {
      toast.success(isEditMode ? "Template diperbarui" : "Template dibuat", {
        description: `${savedTemplate.name ?? name} berhasil disimpan.`,
      });
      navigate("/contracts-templates");
    }
  };

  const {
    previewUrl: pdfPreviewUrl,
    previewFilename: pdfPreviewFilename,
    previewError: pdfPreviewError,
    isPreparingPreview: isPreparingPdfPreview,
    preparePreview: handleSaveAndPreviewPdf,
  } = usePdfPreview({
    cacheKey: "template-pdf-preview",
    createSignature: createPdfPreviewSignature,
    generatePdf: async () => {
      const savedTemplate = await persistTemplate({ forPreview: true });
      if (!savedTemplate) return;

      const response = await downloadTemplatePdf(savedTemplate.id);
      const displayFilename = name.trim() ? name : "template-kontrak";
      return {
        blob: response.data,
        filename: createPdfPreviewFilename(displayFilename, "template-kontrak"),
      };
    },
    getErrorMessage: (error) =>
      getApiErrorMessage(
        error,
        error instanceof Error
          ? error.message
          : "Gagal membuat preview PDF template.",
      ),
  });

  const handleOpenPreviewTab = () => {
    setActiveTab("preview");
    if (!isPreparingPdfPreview) {
      void handleSaveAndPreviewPdf();
    }
  };

  const handleConfirmCancel = async () => {
    const previewCreatedTemplateId = previewCreatedTemplateIdRef.current;
    if (previewCreatedTemplateId) {
      try {
        await deleteTemplate(previewCreatedTemplateId);
        previewCreatedTemplateIdRef.current = null;
      } catch (error) {
        setSaveError(
          getApiErrorMessage(
            error,
            "Gagal membuang template sementara. Coba lagi.",
          ),
        );
        return;
      }
    }

    localStorage.removeItem(draftKey);
    setShowCancelConfirm(false);
    navigate("/contracts-templates");
  };

  if (initialising) {
    return <TemplateEditorLoading />;
  }

  return (
    <PermissionGuard
      permissions={["create.template", "update.template"]}
      fallback={<Navigate to="/unauthorized" replace />}>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <TemplateEditorHeader
          loading={loading}
          saveError={saveError}
          onCancel={() => setShowCancelConfirm(true)}
          onSave={() => void handleSave()}
        />

        <div className="flex flex-1 overflow-hidden" ref={containerRef}>
          <TemplateMetadataSidebar
            width={leftWidth}
            name={name}
            categoryId={categoryId}
            categories={categories}
            status={status}
            isEditMode={isEditMode}
            onNameChange={setName}
            onCategoryChange={setCategoryId}
            onStatusChange={setStatus}
          />

          <ResizeDivider
            target="left"
            onStart={startResizing}
            onReset={resetLeftWidth}
          />

          <TemplateEditorWorkspace
            editor={editor}
            activeTab={activeTab}
            uploadedFile={uploadedFile}
            pageMargin={pageMargin}
            paperSize={paperSize}
            watermark={watermark}
            pdfPreviewUrl={pdfPreviewUrl}
            pdfPreviewFilename={pdfPreviewFilename}
            pdfPreviewError={pdfPreviewError}
            isPreparingPdfPreview={isPreparingPdfPreview}
            onTabChange={setActiveTab}
            onOpenPreview={handleOpenPreviewTab}
            onFileSelect={(file) => void handleFileSelect(file)}
            onFileRemove={() => setFile(null)}
            setPageMargin={setPageMargin}
            setPaperSize={setPaperSize}
            setWatermark={setWatermark}
          />

          <ResizeDivider
            target="right"
            onStart={startResizing}
            onReset={resetRightWidth}
          />

          <TemplateFieldSidebar
            width={rightWidth}
            fields={fields}
            onInsert={(field) =>
              insertContractField(editor, field, { display: "label" })
            }
            onManageFields={() => setShowFieldModal(true)}
          />

          <TemplateEditorModals
            showFieldModal={showFieldModal}
            showCancelConfirm={showCancelConfirm}
            uploadNotice={uploadNotice}
            onCloseFieldModal={() => setShowFieldModal(false)}
            onRefreshFields={refreshFields}
            onCloseCancelConfirm={() => setShowCancelConfirm(false)}
            onConfirmCancel={handleConfirmCancel}
            onCloseUploadNotice={() => setUploadNotice(null)}
          />
        </div>
      </div>
    </PermissionGuard>
  );
}
