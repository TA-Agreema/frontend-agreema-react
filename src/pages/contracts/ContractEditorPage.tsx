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
  IndentIncrease,
  IndentDecrease,
  MoveVertical,
  ImageIcon,
} from "lucide-react";
import { Indent } from "@/lib/tiptap-indent";
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
import { fetchCategories } from "@/services/category.service";
import {
  createContract,
  fetchContract,
  updateContract,
} from "@/services/contract.service";
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

const INTERNAL_USERS = [
  "Galang Aly N",
  "Alexa Jovanca",
  "Budi Santoso",
  "Aldi Santosa",
];
const INTERNAL_ROLES = [
  "Manager",
  "Legal",
  "Direktur",
  "HR Manager",
  "CFO",
  "Employee",
];

// common input class used by sidebar fields
const inputCls =
  "w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

function EditorToolbar({
  editor,
}: {
  editor: ReturnType<typeof useEditor> | null;
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

  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";
  const currentLineHeight =
    editor.getAttributes("paragraph").lineHeight ||
    editor.getAttributes("heading").lineHeight ||
    "1.0";

  const setLineHeight = (value: string) => {
    editor.chain().focus().setLineHeight(value).run();
  };

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
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo">
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo">
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      {([1, 2, 3] as const).map((l) => (
        <ToolbarBtn
          key={l}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: l }).run()
          }
          active={editor.isActive("heading", { level: l })}>
          <span className="font-bold text-[11px] w-4 text-center block">
            H{l}
          </span>
        </ToolbarBtn>
      ))}
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline">
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().indent().run()}
        title="Indent Left">
        <IndentIncrease className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().outdent().run()}
        title="Outdent Left">
        <IndentDecrease className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <div className="h-6 w-px bg-gray-100" />
      <ToolbarBtn
        onClick={() => editor.chain().focus().indentRight().run()}
        title="Indent Right">
        <span className="text-[10px] font-bold px-0.5">R+</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().outdentRight().run()}
        title="Outdent Right">
        <span className="text-[10px] font-bold px-0.5">R-</span>
      </ToolbarBtn>
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
      {/* Text Color */}
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
      {/* Font Size */}
      <div className="flex items-center gap-0.5">
        <ToolbarBtn
          onClick={() => {
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
            editor.chain().focus().increaseFontSize().run();
          }}
          title="Increase Font Size">
          <Plus className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>
      {/* Line Spacing */}
      <div className="flex items-center gap-1.5 ml-1">
        <MoveVertical className="h-3.5 w-3.5 text-gray-400" />
        <select
          value={currentLineHeight}
          onChange={(e) => setLineHeight(e.target.value)}
          title="Line Spacing"
          className="px-2 py-1.5 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer text-gray-700">
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

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${inputCls} appearance-none pr-6 ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

function SignerRow({
  signer,
  onChange,
  onRemove,
  disabled,
}: {
  signer: Signer;
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
          disabled={disabled}
          className={`p-0.5 ${disabled ? "text-gray-200 cursor-not-allowed" : "text-gray-300 hover:text-red-400"} transition-colors rounded`}>
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
        <SelectField
          value={signer.name}
          onChange={(v) => onChange({ ...signer, name: v })}
          placeholder="Nama"
          options={INTERNAL_USERS}
          disabled={disabled}
        />
      )}

      {!isExt && (
        <SelectField
          value={signer.title}
          onChange={(v) => onChange({ ...signer, title: v })}
          placeholder="Jabatan"
          options={INTERNAL_ROLES}
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
  isExternal = false,
}: {
  name?: string;
  title?: string;
  email?: string;
  isExternal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 w-[250px]">
      <p className="text-[11px] text-gray-400">Tanggal: [DD/MM/YYYY]</p>
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

  // Form
  const [contractNumber, setContractNumber] = useState(
    navState?.createdContract?.contract_number || "CT-2024-001",
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

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategories();
        setCategories(data.filter((c: Category) => c.is_active));
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Signers
  const [signers, setSigners] = useState<Signer[]>([
    {
      id: "s1",
      type: "internal",
      name: "",
      title: "",
      email: "",
      noUserAccount: false,
    },
    {
      id: "s2",
      type: "internal",
      name: "",
      title: "",
      email: "",
      noUserAccount: false,
    },
    {
      id: "s3",
      type: "external",
      name: "",
      title: "",
      email: "",
      noUserAccount: false,
    },
  ]);

  const addSigner = (type: SignerType) =>
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
  const updateSigner = (id: string, u: Signer) =>
    setSigners((p) => p.map((s) => (s.id === id ? u : s)));
  const removeSigner = (id: string) =>
    setSigners((p) => p.filter((s) => s.id !== id));

  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Indent,
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
        const c = await fetchContract(Number(id));
        setContractNumber(c.contract_number ?? "");
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
    },
    [editor, title],
  );

  const buildPayload = (status: string) => ({
    contract_number: contractNumber.trim(),
    title: title.trim(),
    start_date: startDate || null,
    end_date: endDate || null,
    status,
    template_id: selectedTemplate?.id ?? null,
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
                {/* Scrollable body */}
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

                  <Field label="Nomor Kontrak">
                    <input
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="CT-2024-001"
                      className={`${inputCls} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                      disabled={isReadOnlyAfterSubmit}
                    />
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
                    <input
                      placeholder="Alex Rivera"
                      className={`${inputCls} ${isReadOnlyAfterSubmit ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                      disabled={isReadOnlyAfterSubmit}
                    />
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
                        onChange={(u) => updateSigner(s.id, u)}
                        onRemove={() => removeSigner(s.id)}
                        disabled={isReadOnlyAfterSubmit}
                      />
                    ))}
                    <button
                      onClick={() => setShowSignerTypeModal(true)}
                      disabled={isReadOnlyAfterSubmit}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors ${isReadOnlyAfterSubmit ? "opacity-40 cursor-not-allowed" : ""}`}>
                      <Plus className="h-3.5 w-3.5" /> Tambah Penandatangan
                    </button>
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
              </div>
            </Panel>

            <ResizeHandle />

            {/* CENTER flexible */}
            <Panel minSize={320}>
              <div className="h-full flex flex-col bg-white overflow-hidden">
                <EditorToolbar editor={editor} />
                <div className="flex-1 overflow-y-auto">
                  <EditorContent editor={editor} />

                  {/*  Tanda Tangan  */}
                  <div className="px-10 pb-10 pt-4 mt-2 border-t border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
                      Tanda Tangan
                    </p>
                    <div className="grid grid-cols-2 gap-x-10 gap-y-8 justify-items-center">
                      {signers
                        .filter((s) => s.type === "internal")
                        .map((s) => (
                          <SignatureBox
                            key={s.id}
                            name={s.name || undefined}
                            title={s.title || undefined}
                          />
                        ))}
                      {signers
                        .filter((s) => s.type === "external")
                        .map((s) => (
                          <SignatureBox
                            key={s.id}
                            isExternal
                            name={s.name || undefined}
                            title={s.title || undefined}
                            email={s.email || undefined}
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
