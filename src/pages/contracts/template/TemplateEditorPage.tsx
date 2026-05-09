import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import mammoth from "mammoth";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Upload,
  Eye,
  LayoutTemplate,
  Copy,
  X,
  ChevronDown,
  Info,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  MoveVertical,
  ImageIcon,
} from "lucide-react";

// Shared Editor Components
import {
  ToolbarBtn,
  ToolbarDivider,
} from "@/components/editor/ToolbarComponents";
import { TableDropdown } from "@/components/editor/TableDropdown";

import { FontSize } from "@/lib/tiptap-font-size";
import { LineHeight } from "@/lib/tiptap-line-height";
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
import FieldManageModal from "@/components/modal/FieldManageModal";
import type { Category } from "@/types/category";
import { Navigate } from "react-router-dom";
import PermissionGuard from "@/middlewares/PermissionGuard";

//  Types

type EditorTab = "visual" | "upload" | "preview";

function resolveGroup(field: FieldDefinition): string {
  // Jika API sudah mengembalikan field_group, gunakan langsung
  if (field.field_group) return field.field_group;

  // Fallback: deteksi dari prefix field_key
  const key = field.field_key.toLowerCase();
  if (key.startsWith("pihak_") || key.startsWith("party_")) return "Data Pihak";
  if (key.startsWith("nomor_mitra") || key.startsWith("partner_number"))
    return "Nomor Kontrak";
  return "Field Umum";
}

function groupFields(
  fields: FieldDefinition[],
): Map<string, FieldDefinition[]> {
  // Urutan tampilan group
  const ORDER = ["Field Umum", "Data Pihak", "Nomor Kontrak"];
  const map = new Map<string, FieldDefinition[]>();

  for (const f of fields) {
    const group = resolveGroup(f);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(f);
  }

  // Sort entries by ORDER, unknown groups go last
  return new Map(
    [...map.entries()].sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }),
  );
}

//  Toolbar

// Tab Button
function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 justify-center items-center gap-1.5 px-3 py-2 text-xs rounded-t-none border-b-2 transition-colors ${
        active
          ? "border-emerald-600 text-emerald-700 font-medium bg-emerald-50/50"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}>
      {icon}
      {label}
    </button>
  );
}

// Upload Tab
function UploadTab({
  file,
  onSelect,
  onRemove,
}: {
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
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
            className="flex items-center gap-1.5 mx-auto text-xs text-red-600 hover:text-red-700 transition-colors">
            <X className="h-3.5 w-3.5" /> Hapus file
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-sm border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group">
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSelect(f);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Preview Tab
function PreviewTab({ content, name }: { content: string; name: string }) {
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
    <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
      <div className="max-w-[950px] mx-auto bg-white border rounded-xl shadow-sm p-10 min-h-125">
        {name && (
          <h1 className="text-xl font-bold text-center mb-8 pb-4 border-b">
            {name}
          </h1>
        )}
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

// How-To Callout
function HowToUse() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-left hover:bg-emerald-100 transition-colors">
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
          className={`h-3.5 w-3.5 text-emerald-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1.5">
          <p className="font-medium">Cara pakai Field Template:</p>
          <ol className="list-decimal list-inside space-y-1 text-emerald-700">
            <li>Klik field → langsung sisip ke kursor</li>
            <li>Ikon copy → salin tag, paste manual</li>
            <li>
              <code className="bg-emerald-100 px-1 rounded">{"{{tag}}"}</code>{" "}
              diganti data saat kontrak dibuat
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

// Field Sidebar Item
function FieldItem({
  label,
  tag,
  onInsert,
  copiedTag,
  onCopy,
}: {
  label: string;
  tag: string;
  onInsert: (t: string) => void;
  copiedTag: string | null;
  onCopy: (t: string) => void;
}) {
  const isCopied = copiedTag === tag;
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer group"
      onClick={() => onInsert(tag)}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {tag}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCopy(tag);
        }}
        title="Salin tag"
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background transition-all shrink-0 ml-2">
        {isCopied ? (
          <span className="text-emerald-600 text-xs font-bold">✓</span>
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

// Field Group Section
function FieldGroup({
  title,
  fields,
  onInsert,
  copiedTag,
  onCopy,
}: {
  title: string;
  fields: FieldDefinition[];
  onInsert: (t: string) => void;
  copiedTag: string | null;
  onCopy: (t: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pt-3 pb-1.5">
        {title}
      </p>
      {fields.map((f) => (
        <FieldItem
          key={f.id}
          label={f.field_label}
          tag={`{{${f.field_key}}}`}
          onInsert={onInsert}
          copiedTag={copiedTag}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}

//  Toolbar
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const textPickerRef = useRef<HTMLInputElement>(null);
  const highlightPickerRef = useRef<HTMLInputElement>(null);
  const [, setUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => setUpdate((v) => v + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";
  const currentLineHeight =
    editor.getAttributes("paragraph").lineHeight ||
    editor.getAttributes("heading").lineHeight ||
    "1.0";

  const setLineHeight = (value: string) => {
    editor.chain().focus().setLineHeight(value).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const onHighlightColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setHighlight({ color: e.target.value }).run();
  };

  const onTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(e.target.value).run();
  };

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  const uploadImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            editor
              .chain()
              .focus()
              .setImage({ src: e.target.result as string })
              .run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b bg-muted/20 flex-wrap shrink-0">
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo">
        <Undo2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo">
        <Redo2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarDivider />
      {([1, 2, 3] as const).map((level) => (
        <ToolbarBtn
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive("heading", { level })}
          title={`Heading ${level}`}>
          <span className="text-xs font-bold w-5 text-center">H{level}</span>
        </ToolbarBtn>
      ))}
      <ToolbarDivider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule">
        <span className="text-xs font-bold">―</span>
      </ToolbarBtn>
      <TableDropdown editor={editor} />
      <div className="relative flex items-center">
        <ToolbarBtn
          onClick={() => highlightPickerRef.current?.click()}
          title="Highlight Color">
          <span className="text-xs font-bold">🖍️</span>
        </ToolbarBtn>
        <input
          ref={highlightPickerRef}
          type="color"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          onChange={onHighlightColorChange}
        />
      </div>
      <div className="relative flex items-center">
        <ToolbarBtn
          onClick={() => textPickerRef.current?.click()}
          title="Text Color">
          <span
            className="text-xs font-bold"
            style={{
              color: editor.getAttributes("textStyle").color || "#000000",
            }}>
            A
          </span>
        </ToolbarBtn>
        <input
          ref={textPickerRef}
          type="color"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          onChange={onTextColorChange}
        />
      </div>
      <div className="flex items-center gap-0.5">
        <ToolbarBtn
          onClick={() => {
            // @ts-expect-error: decreaseFontSize is a custom command
            editor.chain().focus().decreaseFontSize().run();
          }}
          title="Decrease Font Size">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <select
          value={currentFontSize}
          onChange={(e) => setFontSize(e.target.value)}
          title="Font Size"
          className="px-2 py-1.5 text-sm rounded border border-border bg-background hover:bg-muted cursor-pointer">
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map(
            (size) => (
              <option key={size} value={`${size}px`}>
                {size}px
              </option>
            ),
          )}
          {![
            "8px",
            "9px",
            "10px",
            "11px",
            "12px",
            "14px",
            "16px",
            "18px",
            "20px",
            "24px",
            "30px",
            "36px",
            "48px",
            "60px",
            "72px",
          ].includes(currentFontSize) && (
            <option value={currentFontSize}>{currentFontSize}</option>
          )}
        </select>
        <ToolbarBtn
          onClick={() => {
            // @ts-expect-error: increaseFontSize is a custom command
            editor.chain().focus().increaseFontSize().run();
          }}
          title="Increase Font Size">
          <Plus className="h-4 w-4" />
        </ToolbarBtn>
      </div>
      <div className="flex items-center gap-1.5 ml-1">
        <MoveVertical className="h-4 w-4 text-muted-foreground" />
        <select
          value={currentLineHeight}
          onChange={(e) => setLineHeight(e.target.value)}
          title="Line Spacing"
          className="px-2 py-1.5 text-sm rounded border border-border bg-background hover:bg-muted cursor-pointer">
          {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map((val) => (
            <option key={val} value={val.toString()}>
              {val.toFixed(2)}
            </option>
          ))}
          {!["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"].includes(
            currentLineHeight,
          ) && <option value={currentLineHeight}>{currentLineHeight}</option>}
        </select>
      </div>
      <ToolbarDivider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline Code">
        <Code className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarDivider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}>
        <AlignLeft className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}>
        <AlignCenter className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}>
        <AlignRight className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarDivider />

      <ToolbarDivider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}>
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered List">
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarDivider />
      <ToolbarBtn
        onClick={setLink}
        active={editor.isActive("link")}
        title="Link">
        <LinkIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={uploadImage} title="Insert Image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarBtn>
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

  // Resizeable sidebars - use same constraints as ContractEditorPage
  const SIDEBAR_DEFAULT_PX = 260;
  const SIDEBAR_MIN_PX = 200;
  const SIDEBAR_MAX_PX = 480;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<null | "left" | "right">(null);
  const [leftWidth, setLeftWidth] = useState<number>(SIDEBAR_DEFAULT_PX);
  const [rightWidth, setRightWidth] = useState<number>(SIDEBAR_DEFAULT_PX);

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [fieldGroups, setFieldGroups] = useState<
    Map<string, FieldDefinition[]>
  >(new Map());
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [activeTab, setActiveTab] = useState<EditorTab>("visual");
  const [uploadedFile, setFile] = useState<File | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialising, setInit] = useState(true);

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
      FontSize,
      LineHeight,
      HorizontalRule,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ImageResize,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[420px] px-6 py-5 text-sm leading-7",
      },
    },
  });

  // Load categories + field definitions
  useEffect(() => {
    (async () => {
      try {
        const [catData, fieldData] = await Promise.all([
          fetchCategories(),
          fetchFieldDefinitions(),
        ]);
        setCategories(catData.filter((c: Category) => c.is_active));
        setFieldGroups(groupFields(fieldData));
      } catch (err) {
        console.error("Gagal memuat data awal:", err);
      } finally {
        if (!isEditMode) setInit(false);
      }
    })();
  }, [isEditMode]);

  const refreshFields = async () => {
    try {
      const fieldData = await fetchFieldDefinitions();
      setFieldGroups(groupFields(fieldData));
    } catch (err) {
      console.error("Gagal me-refresh field:", err);
    }
  };

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
    if (!isEditMode || !editor) return;
    (async () => {
      setInit(true);
      const template = await getTemplate(Number(id));
      if (template) {
        setName(template.name);
        setCategoryId(template.category_id ?? "");
        setStatus(template.status === "Aktif" ? "Active" : "Inactive");
        if (template.content) editor.commands.setContent(template.content);
      }
      setInit(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editor]);

  const insertField = useCallback(
    (tag: string) => {
      editor?.chain().focus().insertContent(tag).run();
    },
    [editor],
  );

  const copyTag = useCallback((tag: string) => {
    navigator.clipboard.writeText(tag).then(() => {
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    });
  }, []);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    if (f.name.toLowerCase().endsWith(".docx")) {
      try {
        const arrayBuffer = await f.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (editor) {
          editor.commands.setContent(result.value);
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
    const content = editor?.getHTML() ?? "";
    try {
      if (isEditMode) {
        const payload: UpdateTemplatePayload = {
          id: Number(id),
          name,
          category_id: Number(categoryId),
          is_active: status === "Active",
          content,
          uploadedFile:
            activeTab === "upload" ? (uploadedFile ?? undefined) : undefined,
        };
        await updateTemplate(payload);
      } else {
        const payload: CreateTemplatePayload = {
          name,
          category_id: Number(categoryId),
          is_active: status === "Active",
          content,
          uploadedFile:
            activeTab === "upload" ? (uploadedFile ?? undefined) : undefined,
        };
        await createTemplate(payload);
      }
      navigate("/contracts-templates");
    } catch {
      setSaveError("Gagal menyimpan template. Coba lagi.");
    }
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
              onClick={() => navigate("/contracts-templates")}
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
              <TabBtn
                active={activeTab === "visual"}
                onClick={() => setActiveTab("visual")}
                icon={<LayoutTemplate className="h-3.5 w-3.5" />}
                label="Editor Visual"
              />
              <TabBtn
                active={activeTab === "upload"}
                onClick={() => setActiveTab("upload")}
                icon={<Upload className="h-3.5 w-3.5" />}
                label="Upload Dokumen"
              />
              <TabBtn
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
                  <EditorToolbar editor={editor} />
                  <div className="flex-1 overflow-y-auto">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )}
              {activeTab === "upload" && (
                <UploadTab
                  file={uploadedFile}
                  onSelect={handleFileSelect}
                  onRemove={() => setFile(null)}
                />
              )}
              {activeTab === "preview" && (
                <PreviewTab content={editor?.getHTML() ?? ""} name={name} />
              )}
            </div>
          </main>

          {/* draggable divider: right */}
          <div
            className="w-1 cursor-col-resize bg-transparent hover:bg-border"
            onMouseDown={() => (resizingRef.current = "right")}
            onDoubleClick={() => setRightWidth(SIDEBAR_DEFAULT_PX)}
          />

          {/*  RIGHT: Field Template  */}
          <aside
            className="shrink-0 border-l bg-card flex flex-col overflow-y-auto"
            style={{ width: `${rightWidth}px` }}>
            {/* Fixed header */}
            <div className="px-3 pt-3 pb-2 border-b bg-card shrink-0 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Field Template
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik untuk menyalin tag field
                </p>
              </div>

              <div className="ml-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(true)}
                  className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border bg-background hover:bg-muted transition-colors">
                  <Plus className="h-3.5 w-3.5 text-foreground" />
                  Kelola Field
                </button>
              </div>
            </div>

            {/* Scrollable field list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <HowToUse />
              <div>
                {[...fieldGroups.entries()].map(([title, fields]) => (
                  <FieldGroup
                    key={title}
                    title={title}
                    fields={fields}
                    onInsert={insertField}
                    copiedTag={copiedTag}
                    onCopy={copyTag}
                  />
                ))}
              </div>
            </div>
          </aside>
          {/* Field management modal */}
          {showFieldModal && (
            <FieldManageModal
              onClose={() => setShowFieldModal(false)}
              onRefreshFields={refreshFields}
            />
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
