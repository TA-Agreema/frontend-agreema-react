import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Group as PanelGroup, Panel } from "react-resizable-panels";
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
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  CalendarDays,
  ChevronDown,
  Plus,
  Minus,
  X,
  FileText,
  Clock,
  Paperclip,
  Send,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Mail,
  Pen,
  MoveVertical,
  ImageIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { FontSize } from "@/lib/tiptap-font-size";
import { LineHeight } from "@/lib/tiptap-line-height";

// Shared Editor Components
import { ToolbarBtn } from "@/components/editor/ToolbarComponents";
import { TableDropdown } from "@/components/editor/TableDropdown";
import { ResizeHandle } from "@/components/editor/ResizeHandle";

import TemplateSelectModal, {
  type TemplateOption,
} from "@/components/modal/TemplateSelectModal";
import SignerTypeModal from "@/components/modal/SignerTypeModal";
import SubmitConfirmModal from "@/components/modal/SubmitConfirmModal";
import FieldManageModal from "@/components/modal/FieldManageModal";
import { fetchCategories } from "@/services/category.service";
import {
  createContract,
  fetchContract,
  updateContract,
  generateContractNumber,
  fetchSigners,
} from "@/services/contract.service";
import { fetchFieldDefinitions } from "@/services/field.service";
import type { Category } from "@/types/category";
import type { ContractRow } from "@/pages/contracts/ContractListPage";

//  Types

type SignerType = "internal" | "external";

interface Signer {
  id: string;
  type: SignerType;
  name: string;
  title: string;
  email: string;
  noUserAccount: boolean;
}

interface StatusEntry {
  status: "draft" | "review" | "active" | "revision";
  label: string;
  actor: string;
  note: string;
  date: string;
}

interface FeedbackEntry {
  id: number;
  author: string;
  role: string;
  type: "urgent" | "standard" | "resolved";
  typeLabel: string;
  message: string;
  date: string;
}
interface InternalUser {
  id: number;
  name: string;
  job_title?: string;
  email?: string;
}

// Contract detail from backend includes partner and partner_id
type ContractDetail = ContractRow & {
  partner_id?: number | null;
  partner?: string | null;
  content?: string | null;
};

// Mock data

const STATUS_HISTORY: StatusEntry[] = [
  {
    status: "draft",
    label: "Draft",
    actor: "Galang Aly N (Anda)",
    note: "Versi 1 · Kontrak Sewa Vendor",
    date: "Baru Saja",
  },
  {
    status: "review",
    label: "Revisi",
    actor: "Alexa Jovanca",
    note: "Versi 1 · Kontrak Sewa Vendor",
    date: "30-04-2026 10:00",
  },
  {
    status: "revision",
    label: "Ditinjau",
    actor: "Galang Aly N (Anda)",
    note: "Versi 2 · Kontrak Sewa Vendor",
    date: "30-04-2026 10:45",
  },
];

const MOCK_FEEDBACK: FeedbackEntry[] = [
  {
    id: 1,
    author: "Alexa Jovanca",
    role: "Legal Reviewer",
    type: "urgent",
    typeLabel: "Tanda Selesai",
    message:
      "Mohon diperbaiki klausul mengenai periode probation di Section 1. Apakah 3 bulan atau 6 bulan?",
    date: "14 April 2026, 3:00 PM",
  },
  {
    id: 2,
    author: "Budi Santoso",
    role: "Finance Reviewer",
    type: "standard",
    typeLabel: "Selesai",
    message:
      "Angka gaji di Section 2 belum sesuai dengan grade yang ditetapkan. Harap disesuaikan dengan struktur gaji terbaru.",
    date: "14 April 2026, 11:15 AM",
  },
];

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500 border border-gray-200",
  review: "bg-amber-50 text-amber-700 border border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  revision: "bg-orange-50 text-orange-700 border border-orange-200",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-400",
  review: "bg-amber-400",
  active: "bg-emerald-500",
  revision: "bg-orange-400",
};

// common input class used by sidebar fields
const inputCls =
  "w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

// Field Inserter Dropdown
interface FieldDefinition {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_active: boolean;
}

function FieldInserter({
  editor,
  fields,
  onAddField,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  fields: FieldDefinition[];
  onAddField: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const insertField = (field: FieldDefinition) => {
    if (!editor) return;
    const fieldTag = `{{${field.field_key}}}`;
    editor.chain().focus().insertContent(fieldTag).run();
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        type="button"
        title={disabled ? "Fitur dinonaktifkan" : "Insert Field"}
        disabled={disabled}
        className={`px-2 py-1.5 text-sm rounded border border-gray-200 bg-white ${disabled ? "text-gray-300 cursor-not-allowed opacity-60" : "hover:bg-gray-50 cursor-pointer text-gray-700"} flex items-center gap-1`}>
        <span className="text-xs font-semibold">Field</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Field List - Max 4 items, scrollable */}
          <div className="max-h-[160px] overflow-y-auto">
            {fields.length > 0 ? (
              fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => insertField(field)}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0">
                  <div className="font-semibold text-gray-800">
                    {field.field_label}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {`{{${field.field_key}}}`}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                Tidak ada field
              </div>
            )}
          </div>

          {/* Add Field Button - Absolute positioned */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
            <button
              onClick={() => !disabled && onAddField()}
              type="button"
              disabled={disabled}
              className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs rounded border border-dashed border-emerald-300 ${disabled ? "text-gray-300 cursor-not-allowed bg-white/50" : "text-emerald-600 hover:bg-emerald-50"} transition-colors font-medium`}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberingDropdown({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!editor) return null;

  const toggleStyle = (type: string | null) => {
    if (type === null) {
      if (editor.isActive("orderedList")) {
        editor.chain().focus().toggleOrderedList().run();
      }
    } else {
      if (editor.isActive("orderedList")) {
        editor
          .chain()
          .focus()
          .updateAttributes("orderedList", { listType: type })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .toggleOrderedList()
          .updateAttributes("orderedList", { listType: type })
          .run();
      }
    }
    setOpen(false);
  };

  const numberingStyles = [
    { id: "none", label: "None", type: null, preview: ["None"] },
    { id: "decimal", label: "1, 2, 3", type: "1", preview: ["1.", "2.", "3."] },
    { id: "alpha", label: "a, b, c", type: "a", preview: ["a.", "b.", "c."] },
    {
      id: "roman",
      label: "i, ii, iii",
      type: "i",
      preview: ["i.", "ii.", "iii."],
    },
    {
      id: "upper-alpha",
      label: "A, B, C",
      type: "A",
      preview: ["A.", "B.", "C."],
    },
    {
      id: "upper-roman",
      label: "I, II, III",
      type: "I",
      preview: ["I.", "II.", "III."],
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen(!open)}
        active={editor.isActive("orderedList")}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Numbering Library"}>
        <div className="flex items-center gap-0.5">
          <ListOrdered className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Numbering Library
          </p>
          <div className="grid grid-cols-3 gap-2">
            {numberingStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStyle(s.type)}
                className="flex flex-col items-center justify-center p-2 rounded border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-full aspect-square border border-gray-200 rounded bg-white mb-1.5 flex flex-col items-start justify-center text-[9px] text-gray-500 font-mono leading-tight p-2 group-hover:border-emerald-200">
                  {s.preview.map((line, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center gap-1 mb-0.5 last:mb-0">
                      <span className="shrink-0">{line}</span>
                      <div className="h-0.5 flex-1 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-500 font-medium">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BulletDropdown({
  editor,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!editor) return null;

  const toggleStyle = (style: string | null) => {
    if (style === null) {
      if (editor.isActive("bulletList")) {
        editor.chain().focus().toggleBulletList().run();
      }
    } else {
      const className = `list-${style}`;
      if (!editor.isActive("bulletList")) {
        editor
          .chain()
          .focus()
          .toggleBulletList()
          .updateAttributes("bulletList", { class: className })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .updateAttributes("bulletList", { class: className })
          .run();
      }
    }
    setOpen(false);
  };

  const bulletStyles = [
    { id: "none", label: "None", style: null, preview: ["None"] },
    {
      id: "disc",
      label: "Solid Circle",
      style: "disc",
      preview: ["●", "●", "●"],
    },
    {
      id: "circle",
      label: "Open Circle",
      style: "circle",
      preview: ["○", "○", "○"],
    },
    {
      id: "square",
      label: "Square",
      style: "square",
      preview: ["■", "■", "■"],
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarBtn
        onClick={() => !disabled && setOpen(!open)}
        active={editor.isActive("bulletList")}
        disabled={disabled}
        title={disabled ? "Fitur dinonaktifkan" : "Bullet Library"}>
        <div className="flex items-center gap-0.5">
          <List className="h-3.5 w-3.5" />
          <ChevronDown className="h-2.5 w-2.5" />
        </div>
      </ToolbarBtn>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Bullet Library
          </p>
          <div className="grid grid-cols-2 gap-2">
            {bulletStyles.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStyle(s.style)}
                className="flex flex-col items-center justify-center p-2 rounded border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-full aspect-square border border-gray-200 rounded bg-white mb-1.5 flex flex-col items-start justify-center text-[10px] text-gray-500 font-mono leading-tight p-2 group-hover:border-emerald-200">
                  {s.preview.map((line, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center gap-2 mb-1 last:mb-0">
                      <span className="shrink-0">{line}</span>
                      <div className="h-0.5 flex-1 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-500 font-medium">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditorToolbar({
  editor,
  fields,
  onAddField,
  disabled = false,
}: {
  editor: ReturnType<typeof useEditor> | null;
  fields: FieldDefinition[];
  onAddField: () => void;
  disabled?: boolean;
}) {
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

  // Manual custom line-height input state; keep declared before any early returns
  // customLineHeight removed per request; only presets remain

  // No custom input state anymore; presets-only implementation.

  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";
  // Normalize current line-height to a string with 2 decimals so the <select> matches
  const _rawLineHeight =
    editor.getAttributes("paragraph").lineHeight ??
    editor.getAttributes("heading").lineHeight ??
    "1.0";

  const currentLineHeight =
    typeof _rawLineHeight === "number"
      ? _rawLineHeight.toFixed(2)
      : (() => {
          const n = Number(String(_rawLineHeight));
          return Number.isNaN(n) ? String(_rawLineHeight) : n.toFixed(2);
        })();

  const setLineHeight = (value: string) => {
    // TipTap expects a string; normalize numeric values to string
    const parsed = parseFloat(value);
    const toSet = Number.isNaN(parsed) ? String(value) : String(parsed);
    // Avoid calling focus() here — focusing the editor will blur the custom input
    // and cause the dropdown to close unexpectedly while the user is typing.
    editor.chain().setLineHeight(toSet).run();
  };

  // Manual custom line-height input state/handlers

  // custom input removed: presets only

  // LineSpacingToggle - inline component to keep toolbar compact
  function LineSpacingToggle() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;
      const onClick = (e: MouseEvent) => {
        if (!ref.current) return;
        if (ref.current.contains(e.target as Node)) return;
        setOpen(false);
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    const presets = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((s) => !s)}
          disabled={disabled}
          title={disabled ? "Fitur dinonaktifkan" : "Line Spacing"}
          className={`flex items-center gap-1 px-2 py-1.5 text-sm rounded border border-gray-200 bg-white ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"} text-gray-700`}>
          <MoveVertical className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium">{currentLineHeight}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="space-y-1">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setLineHeight(p.toFixed(2));
                    // Do not close dropdown automatically when selecting preset
                  }}
                  className={`w-full text-left px-2 py-1 text-sm rounded ${currentLineHeight === p.toFixed(2) ? "bg-emerald-50 text-emerald-700" : "hover:bg-gray-50"} transition-colors`}>
                  {p.toFixed(2)}
                </button>
              ))}
            </div>

            {/* custom input removed; only presets available */}
          </div>
        )}
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt("URL:", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (!url) {
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
        reader.onload = (ev) => {
          if (ev.target?.result) {
            editor
              .chain()
              .focus()
              .setImage({ src: ev.target.result as string })
              .run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white flex-wrap shrink-0">
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title={disabled ? "Fitur dinonaktifkan" : "Undo"}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title={disabled ? "Fitur dinonaktifkan" : "Redo"}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      {([1, 2, 3] as const).map((l) => (
        <ToolbarBtn
          key={l}
          onClick={() =>
            !disabled &&
            editor.chain().focus().toggleHeading({ level: l }).run()
          }
          disabled={disabled}
          active={editor.isActive("heading", { level: l })}>
          <span className="font-bold text-[11px] w-4 text-center block">
            H{l}
          </span>
        </ToolbarBtn>
      ))}
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        active={editor.isActive("bold")}
        title={disabled ? "Fitur dinonaktifkan" : "Bold"}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        active={editor.isActive("italic")}
        title={disabled ? "Fitur dinonaktifkan" : "Italic"}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() =>
          !disabled && editor.chain().focus().toggleUnderline().run()
        }
        disabled={disabled}
        active={editor.isActive("underline")}
        title={disabled ? "Fitur dinonaktifkan" : "Underline"}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => !disabled && editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        active={editor.isActive("strike")}
        title={disabled ? "Fitur dinonaktifkan" : "Strikethrough"}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() =>
          !disabled && editor.chain().focus().setTextAlign("left").run()
        }
        disabled={disabled}
        active={editor.isActive({ textAlign: "left" })}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() =>
          !disabled && editor.chain().focus().setTextAlign("center").run()
        }
        disabled={disabled}
        active={editor.isActive({ textAlign: "center" })}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() =>
          !disabled && editor.chain().focus().setTextAlign("right").run()
        }
        disabled={disabled}
        active={editor.isActive({ textAlign: "right" })}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      <BulletDropdown editor={editor} disabled={disabled} />
      <NumberingDropdown editor={editor} disabled={disabled} />
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule">
        <span className="text-xs font-bold">―</span>
      </ToolbarBtn>
      <TableDropdown editor={editor} />
      {/* Highlight */}
      <div className="relative flex items-center">
        <ToolbarBtn
          onClick={() => !disabled && highlightPickerRef.current?.click()}
          disabled={disabled}
          title={disabled ? "Fitur dinonaktifkan" : "Highlight Color"}>
          <span className="text-xs font-bold">🖍️</span>
        </ToolbarBtn>
        <input
          ref={highlightPickerRef}
          type="color"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          onChange={onHighlightColorChange}
        />
      </div>
      {/* Text Color */}
      <div className="relative flex items-center">
        <ToolbarBtn
          onClick={() => !disabled && textPickerRef.current?.click()}
          disabled={disabled}
          title={disabled ? "Fitur dinonaktifkan" : "Text Color"}>
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
      {/* Field Inserter */}
      <FieldInserter
        editor={editor}
        fields={fields}
        onAddField={onAddField}
        disabled={disabled}
      />

      {/* Line Spacing Dropdown (presets + custom at bottom) */}
      <div className="relative ml-1" id="line-spacing-root">
        {/* Toggle button */}
        <LineSpacingToggle />
      </div>
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={addLink}
        active={editor.isActive("link")}
        title="Link">
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={uploadImage} title="Insert Image">
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />

      {/* Font Size */}
      <div className="flex items-center gap-0.5">
        <ToolbarBtn
          onClick={() => {
            // @ts-expect-error: Custom extension command
            editor.chain().focus().decreaseFontSize().run();
          }}
          title="Decrease Font Size">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <select
          value={currentFontSize}
          onChange={(e) => setFontSize(e.target.value)}
          title="Font Size"
          className="px-2 py-1.5 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-gray-700">
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
            // @ts-expect-error: Custom extension command
            editor.chain().focus().increaseFontSize().run();
          }}
          title="Increase Font Size">
          <Plus className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function SignerRow({
  signer,
  internalUsers,
  onChange,
  onRemove,
  disabled,
}: {
  signer: Signer;
  internalUsers: InternalUser[];
  onChange: (u: Signer) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const isExt = signer.type === "external";
  return (
    <div
      className={`rounded-lg border p-2.5 space-y-2 ${isExt ? "border-blue-100 bg-blue-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isExt ? (
            <Mail className="h-3 w-3 text-blue-500" />
          ) : (
            <User className="h-3 w-3 text-emerald-600" />
          )}
          <span
            className={`text-[11px] font-semibold ${isExt ? "text-blue-600" : "text-emerald-700"}`}>
            {isExt ? "Pihak Eksternal" : "Pihak Internal"}
          </span>
        </div>
        <button
          onClick={onRemove}
          disabled={disabled || signer.id === "s1"}
          title={
            signer.id === "s1"
              ? "Penandatangan utama tidak dapat dihapus"
              : undefined
          }
          className={`p-0.5 ${disabled || signer.id === "s1" ? "text-gray-200 cursor-not-allowed" : "text-gray-300 hover:text-red-400"} transition-colors rounded`}>
          <X className="h-3 w-3" />
        </button>
      </div>

      {isExt ? (
        <input
          type="text"
          placeholder="Nama"
          value={signer.name}
          onChange={(e) => onChange({ ...signer, name: e.target.value })}
          className={`${inputCls} ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
          disabled={disabled}
        />
      ) : (
        <div className="relative">
          <select
            value={signer.name}
            onChange={(e) => {
              const userName = e.target.value;
              const user = internalUsers.find((u) => u.name === userName);
              onChange({
                ...signer,
                name: userName,
                title: user?.job_title || "",
              });
            }}
            disabled={disabled}
            className={`${inputCls} appearance-none pr-6 ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}>
            <option value="">Pilih Nama</option>
            {internalUsers.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
      )}

      {isExt ? (
        <input
          type="text"
          placeholder="Jabatan (Contoh: Direktur)"
          value={signer.title}
          onChange={(e) => onChange({ ...signer, title: e.target.value })}
          className={`${inputCls} ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
          disabled={disabled}
        />
      ) : (
        <input
          type="text"
          placeholder="Jabatan"
          value={signer.title}
          readOnly
          className={`${inputCls} opacity-70 bg-gray-50 cursor-not-allowed`}
          disabled={disabled}
        />
      )}

      {isExt && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={signer.email}
            onChange={(e) => onChange({ ...signer, email: e.target.value })}
            className={`${inputCls} ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
            disabled={disabled}
          />
          <label
            className={`flex items-start gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={signer.noUserAccount}
              onChange={(e) =>
                onChange({ ...signer, noUserAccount: e.target.checked })
              }
              className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0 h-3 w-3"
              disabled={disabled}
            />
            <span
              className={`text-[11px] leading-relaxed ${disabled ? "text-gray-300 opacity-50" : "text-gray-400"}`}>
              Token akses dikirim ke email ini setelah tanda tangan internal.
            </span>
          </label>
        </>
      )}
    </div>
  );
}

function SignatureBox({
  name,
  title,
  email,
  date,
  isExternal = false,
}: {
  name?: string;
  title?: string;
  email?: string;
  date?: string;
  isExternal?: boolean;
}) {
  const formattedDate = date
    ? new Date(date)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "/")
    : "[DD/MM/YYYY]";

  return (
    <div className="flex flex-col gap-2 w-[250px]">
      <p className="text-[11px] text-gray-400">Tanggal: {formattedDate}</p>
      <div className="w-full border border-gray-200 rounded-xl h-[124px] flex items-center justify-center bg-gray-50/60 hover:bg-gray-100/60 transition-colors cursor-pointer group">
        <div className="flex flex-col items-center gap-1 text-gray-300 group-hover:text-gray-400 transition-colors">
          {isExternal ? (
            <Mail className="h-6 w-6 stroke-[1.25]" />
          ) : (
            <Pen className="h-6 w-6 stroke-[1.25]" />
          )}
          <span className="text-[10px] tracking-wide font-medium uppercase">
            Area Tanda Tangan
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {name ||
            (isExternal ? "[Nama Partner Eksternal]" : "[Nama Penandatangan]")}
        </p>
        <p className="text-xs text-gray-500 truncate">{title || "Jabatan"}</p>
        {isExternal && (
          <p className="flex items-center gap-1 text-[11px] text-gray-400 truncate mt-0.5">
            <Mail className="h-3 w-3 shrink-0" />
            {email || "partner@company.com"}
          </p>
        )}
      </div>
    </div>
  );
}

// Default sidebar width in pixels
const SIDEBAR_DEFAULT_PX = 260;
const SIDEBAR_MIN_PX = 200;
const SIDEBAR_MAX_PX = 480;

export default function ContractEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const location = useLocation();

  type NavState = {
    template?: TemplateOption;
    createdContract?: ContractRow;
  } | null;
  const navState = (location.state as NavState) ?? null;
  const initialTemplate = navState?.template ?? null;

  const [showTemplateModal, setShowTemplateModal] = useState(
    !isEdit && !initialTemplate,
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateOption | null>(initialTemplate);
  const [showSignerTypeModal, setShowSignerTypeModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);

  // Form
  const [contractNumber, setContractNumber] = useState(
    navState?.createdContract?.contract_number || "",
  );
  const [externalContractNumber, setExternalContractNumber] = useState(
    navState?.createdContract?.external_contract_number || "",
  );
  const [title, setTitle] = useState(
    initialTemplate?.name ||
      navState?.createdContract?.title ||
      "Kontrak Sewa Vendor",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReadOnlyAfterSubmit, setIsReadOnlyAfterSubmit] =
    useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Internal Users
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);

  // Fields for field inserter
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  // Mitra (manual input only)
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("");

  const refreshFields = useCallback(async () => {
    try {
      const fieldData = await fetchFieldDefinitions();
      setFields(fieldData.filter((f: FieldDefinition) => f.is_active));
    } catch {
      /* silent */
    }
  }, []);

  const autoGeneratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategories();
        setCategories(data.filter((c: Category) => c.is_active));
      } catch {
        /* silent */
      }
    })();

    refreshFields();

    // Fetch Internal Users
    (async () => {
      try {
        const userData = await fetchSigners();
        // Normalize possible nulls from API to match InternalUser type
        const normalized = (userData || []).map((u) => ({
          id: u.id,
          name: u.name,
          job_title: u.job_title ?? undefined,
          email: u.email ?? undefined,
        }));
        setInternalUsers(normalized);
      } catch {
        /* silent */
      }
    })();

    // no partners select — Mitra is manual input only

    // Auto-generate contract number once for new contracts
    if (!isEdit && !autoGeneratedRef.current) {
      autoGeneratedRef.current = true;
      generateContractNumber()
        .then((num) => setContractNumber(num))
        .catch(() => {
          /* silent — user can type manually */
        });
    }
  }, [refreshFields, isEdit]);

  // Signers - Start with 1 internal, max 2 total
  const [signers, setSigners] = useState<Signer[]>([
    {
      id: "s1",
      type: "internal",
      name: "",
      title: "",
      email: "",
      noUserAccount: false,
    },
  ]);

  const addSigner = (type: SignerType) => {
    // Max 2 signers total
    if (signers.length >= 2) return;

    // If adding external and already have internal, ok
    // But first signer MUST be internal (s1)
    setSigners((p) => [
      ...p,
      {
        id: `s${Date.now()}`,
        type,
        name: "",
        title: "",
        email: "",
        noUserAccount: false,
      },
    ]);
  };
  const updateSigner = (id: string, u: Signer) =>
    setSigners((p) => p.map((s) => (s.id === id ? u : s)));
  const removeSigner = (id: string) => {
    // Prevent removing the first signer (must keep at least 1 internal)
    if (id === "s1") return;
    setSigners((p) => p.filter((s) => s.id !== id));
  };

  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: false,
        bulletList: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "orderedList", "bulletList"],
      }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      LineHeight,
      HorizontalRule,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ImageResize,
      OrderedList.extend({
        addAttributes() {
          return {
            listType: {
              default: "1",
              parseHTML: (element) =>
                element.getAttribute("data-list-type") ||
                element.getAttribute("type"),
              renderHTML: (attributes) => ({
                "data-list-type": attributes.listType,
                type: attributes.listType,
              }),
            },
          };
        },
      }),
      BulletList.extend({
        addAttributes() {
          return {
            class: {
              default: null,
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                if (!attributes.class) return {};
                return { class: attributes.class };
              },
            },
          };
        },
      }),
      ListItem,
      Underline,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "outline-none min-h-[500px] px-10 py-8 text-sm leading-7 text-gray-800",
      },
    },
  });

  // Load edit data
  useEffect(() => {
    if (!id || !editor) return;
    (async () => {
      try {
        const c = (await fetchContract(Number(id))) as ContractDetail;
        setContractNumber(c.contract_number ?? "");
        setExternalContractNumber(
          (c as unknown as { external_contract_number?: string })
            .external_contract_number ?? "",
        );
        setTitle(c.title ?? "");

        // Reconstruct template dari contract data
        if (c.template_id) {
          setSelectedTemplate({
            id: c.template_id,
            name: c.title ?? "",
            category_id: c.category_id ?? 0,
            content: c.content ?? "",
          } as TemplateOption);
        }

        if (c.start_date) {
          const [d, m, y] = c.start_date.split("-");
          setStartDate(`${y}-${m}-${d}`);
        }
        if (c.end_date) {
          const [d, m, y] = c.end_date.split("-");
          setEndDate(`${y}-${m}-${d}`);
        }
        if (c.content) editor.commands.setContent(c.content);
        // load partner name (manual input only)
        if (c && c.partner) {
          setSelectedPartnerName(c.partner ?? "");
        }
        // If contract is already under review, mark UI read-only
        if (c.status && c.status === "review") {
          setIsReadOnlyAfterSubmit(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, editor]);

  useEffect(() => {
    if (selectedTemplate && editor)
      editor.commands.setContent(selectedTemplate.content);
  }, [selectedTemplate, editor]);

  const handleSelectTemplate = useCallback(
    (t: TemplateOption) => {
      setSelectedTemplate(t);
      setShowTemplateModal(false);
      editor?.commands.setContent(t.content);
      if (!title || title === "Kontrak Sewa Vendor") setTitle(t.name);

      // Auto-update contract number prefix based on the new category
      if (!isEdit) {
        generateContractNumber(t.category_id)
          .then(setContractNumber)
          .catch(() => {});
      }
    },
    [editor, title, isEdit],
  );

  const buildPayload = (status: string) => ({
    contract_number: contractNumber.trim() || undefined,
    external_contract_number: externalContractNumber.trim() || null,
    title: title.trim(),
    start_date: startDate || null,
    end_date: endDate || null,
    status,
    template_id: selectedTemplate?.id ?? null,
    partner_name: selectedPartnerName?.trim()
      ? selectedPartnerName.trim()
      : null,
    content: editor?.getHTML() ?? "",
  });

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setSaveError("Judul kontrak wajib diisi.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      if (isEdit) {
        await updateContract(Number(id), buildPayload("draft"));
      } else {
        await createContract(buildPayload("draft"));
      }
      navigate("/contracts");
    } catch {
      setSaveError("Gagal menyimpan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (): Promise<ContractRow | undefined> => {
    if (!title.trim()) {
      setSaveError("Judul kontrak wajib diisi.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      if (isEdit) {
        const res = await updateContract(Number(id), buildPayload("review"));
        setIsReadOnlyAfterSubmit(true);
        return res as ContractRow;
      } else {
        const res = await createContract(buildPayload("review"));
        setIsReadOnlyAfterSubmit(true);
        return res as ContractRow;
      }
    } catch {
      setSaveError("Gagal mengajukan kontrak. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // when read-only flag changes, update editor editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isReadOnlyAfterSubmit);
  }, [editor, isReadOnlyAfterSubmit]);

  return (
    <>
      {showTemplateModal && (
        <TemplateSelectModal
          onSelect={handleSelectTemplate}
          onClose={() => navigate(-1)}
        />
      )}

      <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
        {/*  Global Header  */}
        <header className="flex items-center justify-between px-5 h-12 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <img
              src="/Agreema.svg"
              alt="Agreema Logo"
              className="h-10 w-auto shrink-0"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-sm">
            <CheckCircle className="h-3.5 w-3.5" /> Mode Editor
          </button>
        </header>

        {/*  Action Bar  */}
        <div className="flex items-center justify-between px-5 h-10 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[260px]">
                {selectedTemplate.name}
              </span>
            )}
            {saveError && (
              <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {saveError}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isReadOnlyAfterSubmit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium">
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Simpan Draft
            </button>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSaving || isReadOnlyAfterSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              → Ajukan
            </button>
          </div>
        </div>

        {/*  3-Column Resizable (pixel-based)  */}
        <div className="flex-1 overflow-hidden">
          {/*
            units="pixels" → defaultSize / minSize / maxSize dalam px
            Panel tanpa defaultSize (center) otomatis mengisi sisa ruang
          */}
          <PanelGroup
            orientation="horizontal"
            className="h-full"
            id="contract-editor-layout">
            {/* LEFT — 320px default */}
            <Panel
              defaultSize={SIDEBAR_DEFAULT_PX}
              minSize={SIDEBAR_MIN_PX}
              maxSize={SIDEBAR_MAX_PX}>
              <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
                {/* Scrollable body + pinned preview wrapper (so overlay can cover both) */}
                <div className="relative flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {/* Title row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate("/contracts")}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800">
                          Detail Kontrak
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          Diterima oleh: Satya (Software Engineer)
                        </p>
                      </div>
                    </div>

                    {/* Drag-to-insert contract number chips */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Seret ke Dokumen
                      </p>
                      {(
                        [
                          {
                            label: "No. Kontrak Internal",
                            value: contractNumber,
                          },
                          ...(externalContractNumber
                            ? [
                                {
                                  label: "No. Kontrak Eksternal",
                                  value: externalContractNumber,
                                },
                              ]
                            : []),
                        ] as { label: string; value: string }[]
                      ).map((chip) => (
                        <div
                          key={chip.label}
                          draggable={!isReadOnlyAfterSubmit}
                          onDragStart={(e) => {
                            if (isReadOnlyAfterSubmit) return;
                            e.dataTransfer.setData("text/plain", chip.value);
                          }}
                          title={
                            isReadOnlyAfterSubmit
                              ? "Tidak dapat diseret — kontrak sedang ditinjau"
                              : `Seret untuk menyisipkan ${chip.label}`
                          }
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border text-xs transition-all select-none group ${isReadOnlyAfterSubmit ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-60" : "border-emerald-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-sm"}`}>
                          <span className="text-emerald-700 font-medium shrink-0">
                            {chip.label}
                          </span>
                          <span className="text-gray-500 truncate flex-1 text-right text-[10px] font-mono bg-gray-50 px-1 rounded">
                            {chip.value || "—"}
                          </span>
                          <svg
                            className="h-3 w-3 text-gray-300 group-hover:text-emerald-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 8h16M4 16h16"
                            />
                          </svg>
                        </div>
                      ))}
                    </div>

                    <Field label="Nomor Kontrak Internal">
                      <div className="flex gap-1.5">
                        <input
                          value={contractNumber}
                          onChange={(e) => setContractNumber(e.target.value)}
                          placeholder="PKS-001/SLAB/V/2026"
                          className={`${inputCls} flex-1 ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={isReadOnlyAfterSubmit}
                        />
                        {!isEdit && !isReadOnlyAfterSubmit && (
                          <button
                            type="button"
                            title="Generate ulang nomor kontrak"
                            onClick={() =>
                              generateContractNumber(
                                selectedTemplate?.category_id,
                              )
                                .then(setContractNumber)
                                .catch(() => {})
                            }
                            className="px-2 py-1.5 border border-gray-200 rounded-md text-gray-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-xs shrink-0">
                            ↺
                          </button>
                        )}
                      </div>
                    </Field>

                    <Field label="Nomor Kontrak Eksternal (Opsional)">
                      <input
                        value={externalContractNumber}
                        onChange={(e) =>
                          setExternalContractNumber(e.target.value)
                        }
                        placeholder="Nomor dari pihak mitra"
                        className={`${inputCls} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                        disabled={isReadOnlyAfterSubmit}
                      />
                      {externalContractNumber && (
                        <p className="text-[10px] text-gray-400 mt-0.5 pl-0.5">
                          Dapat diseret ke dokumen sebagai{" "}
                          <span className="">{"Nomor Kontrak Eksternal"}</span>
                        </p>
                      )}
                    </Field>

                    <Field label="Judul Dokumen">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Kontrak Sewa Vendor"
                        className={`${inputCls} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                        disabled={isReadOnlyAfterSubmit}
                      />
                    </Field>

                    <Field label="Tanggal Mulai">
                      <div className="relative">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`${inputCls + " pr-7 [color-scheme:light]"} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={isReadOnlyAfterSubmit}
                        />
                        <CalendarDays className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </Field>

                    <Field label="Tanggal Selesai">
                      <div className="relative">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`${inputCls + " pr-7 [color-scheme:light]"} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={isReadOnlyAfterSubmit}
                        />
                        <CalendarDays className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </Field>

                    <Field label="Mitra">
                      <div>
                        <input
                          type="text"
                          value={selectedPartnerName}
                          onChange={(e) =>
                            setSelectedPartnerName(e.target.value)
                          }
                          disabled={isReadOnlyAfterSubmit}
                          placeholder="Ketik nama Mitra"
                          className={`${inputCls} pr-8 ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </Field>

                    <Field label="Kategori Kontrak">
                      {selectedTemplate ? (
                        <div className="text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                          {categories.find(
                            (c) => c.id === selectedTemplate.category_id,
                          )?.name || "Tidak ada kategori"}
                        </div>
                      ) : (
                        <div className="text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-400 italic">
                          Pilih template terlebih dahulu
                        </div>
                      )}
                    </Field>

                    {/* Penandatangan */}
                    <div className="space-y-2.5 pt-0.5">
                      <p className="text-xs font-bold text-gray-700">
                        Penandatangan
                      </p>
                      {signers.map((s) => (
                        <SignerRow
                          key={s.id}
                          signer={s}
                          internalUsers={internalUsers}
                          onChange={(u) => updateSigner(s.id, u)}
                          onRemove={() => removeSigner(s.id)}
                          disabled={isReadOnlyAfterSubmit}
                        />
                      ))}
                      <button
                        onClick={() => setShowSignerTypeModal(true)}
                        disabled={isReadOnlyAfterSubmit || signers.length >= 2}
                        title={
                          signers.length >= 2
                            ? "Maksimal 2 penandatangan"
                            : undefined
                        }
                        className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors ${isReadOnlyAfterSubmit || signers.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}>
                        <Plus className="h-3.5 w-3.5" /> Tambah Penandatangan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pratinjau PDF — pinned */}
                <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                  <button
                    className={`w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium ${isReadOnlyAfterSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isReadOnlyAfterSubmit}>
                    <FileText className="h-3.5 w-3.5" /> Pratinjau PDF
                  </button>
                </div>

                {/* read-only state handled by disabling individual controls; no overlay so back button stays clickable */}
              </div>
            </Panel>

            <ResizeHandle />

            {/* CENTER flexible */}
            <Panel minSize={320}>
              <div className="h-full flex flex-col bg-white overflow-hidden">
                <EditorToolbar
                  editor={editor}
                  fields={fields}
                  onAddField={() => setShowFieldModal(true)}
                  disabled={isReadOnlyAfterSubmit}
                />
                <div
                  className="flex-1 overflow-y-auto"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (isReadOnlyAfterSubmit) return;
                    const tag = e.dataTransfer.getData("text/plain");
                    if (tag && editor) {
                      editor.chain().focus().insertContent(tag).run();
                    }
                  }}>
                  <EditorContent editor={editor} />

                  {/*  Tanda Tangan  */}
                  <div className="px-10 pb-10 pt-4 mt-2 border-t border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
                      Tanda Tangan
                    </p>
                    <div className="grid grid-cols-2 gap-x-10 gap-y-8 justify-items-center">
                      {signers.map((s) => (
                        <SignatureBox
                          key={s.id}
                          isExternal={s.type === "external"}
                          name={s.name || undefined}
                          title={s.title || undefined}
                          email={s.email || undefined}
                          date={startDate}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <ResizeHandle />

            {/* RIGHT — 320px default */}
            <Panel
              defaultSize={SIDEBAR_DEFAULT_PX}
              minSize={SIDEBAR_MIN_PX}
              maxSize={SIDEBAR_MAX_PX}>
              <RightSidebar
                feedbackText={feedbackText}
                setFeedbackText={setFeedbackText}
              />
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <SignerTypeModal
        isOpen={showSignerTypeModal}
        onClose={() => setShowSignerTypeModal(false)}
        onSelect={addSigner}
      />

      <SubmitConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        submitting={isSaving}
        onConfirm={async () => {
          setShowSubmitConfirm(false);
          const submitted = await handleSubmit();
          // If submit returned a contract object, navigate to list and pass id
          if (submitted && (submitted as ContractRow).id) {
            navigate("/contracts", {
              state: { submittedId: (submitted as ContractRow).id },
            });
          } else {
            // fallback: still navigate to list
            navigate("/contracts");
          }
        }}
      />

      {showFieldModal && (
        <FieldManageModal
          onClose={() => setShowFieldModal(false)}
          onRefreshFields={refreshFields}
        />
      )}
    </>
  );
}

//  Right Sidebar content

function RightSidebar({
  feedbackText,
  setFeedbackText,
}: {
  feedbackText: string;
  setFeedbackText: (v: string) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Informasi Pembuat */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            Informasi Pembuat
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
              GA
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Galang Aly N
              </p>
              <p className="text-[11px] text-gray-400">HRD</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Dibuat: 15 April 2026, 10:30 AM</span>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Riwayat Status */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Riwayat Status
            </p>
            <button className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium">
              Timeline
            </button>
          </div>
          <div className="space-y-2">
            {STATUS_HISTORY.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex flex-col items-center shrink-0 pt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`}
                  />
                  {i < STATUS_HISTORY.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />
                  )}
                </div>
                <div className="pb-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[entry.status]}`}>
                      {entry.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {entry.date}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {entry.actor}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {entry.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Addendum Terkait */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Addendum Terkait
          </p>
          {["NDA-Document.pdf", "VTA – Invite Jovanca (final version).pdf"].map(
            (doc) => (
              <div
                key={doc}
                className="flex items-start gap-2 py-1.5 px-1 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-gray-600 leading-snug">
                  {doc}
                </span>
              </div>
            ),
          )}
        </section>

        <div className="border-t border-gray-100" />

        {/* Umpan Balik & Revisi */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Umpan Balik & Revisi
            </p>
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {MOCK_FEEDBACK.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {MOCK_FEEDBACK.map((fb) => (
              <div
                key={fb.id}
                className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold shrink-0">
                      {fb.author[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {fb.author}
                      </p>
                      <p className="text-[10px] text-gray-400">{fb.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                      fb.type === "urgent"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}>
                    {fb.typeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {fb.message}
                </p>
                <p className="text-[10px] text-gray-300">{fb.date}</p>
              </div>
            ))}
          </div>

          {/* Kirim balasan */}
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] text-gray-400">
              Tulis balasan atau tanggapan untuk reviewer...
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tulis balasan atau tanggapan untuk reviewer..."
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
            <button
              onClick={() => setFeedbackText("")}
              disabled={!feedbackText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors">
              <Send className="h-3.5 w-3.5" /> Kirim Balasan
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
