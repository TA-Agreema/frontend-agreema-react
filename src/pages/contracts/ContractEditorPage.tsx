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
  ChevronDown,
  Plus,
  X,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Mail,
  Pen,
  Info,
  FileText,
} from "lucide-react";
import { FontSize } from "@/lib/tiptap-font-size";
import { LineHeight } from "@/lib/tiptap-line-height";

// Shared Editor Components
import { ResizeHandle } from "@/components/editor/ResizeHandle";
import { ToolbarBtn, ToolbarDivider } from "@/components/editor/ToolbarBtn";
import { HistoryButtons } from "@/components/editor/HistoryButtons";
import { HeadingButtons } from "@/components/editor/HeadingButtons";
import { FormattingButtons } from "@/components/editor/FormattingButtons";
import { AlignmentButtons } from "@/components/editor/AlignmentButtons";
import { BulletDropdown } from "@/components/editor/BulletDropdown";
import { NumberingDropdown } from "@/components/editor/NumberingDropdown";
import {
  MarginDropdown,
  type MarginStyle,
  MARGIN_PRESETS,
} from "@/components/editor/MarginDropdown";
import { TableDropdown } from "@/components/editor/TableDropdown";
import { HighlightColorPicker } from "@/components/editor/HighlightColorPicker";
import { TextColorPicker } from "@/components/editor/TextColorPicker";
import {
  FieldInserter,
  type FieldDefinition,
} from "@/components/editor/FieldInserter";
import { LineSpacingToggle } from "@/components/editor/LineSpacingToggle";
import { LinkButton } from "@/components/editor/LinkButton";
import { ImageUploadButton } from "@/components/editor/ImageUploadButton";
import { FontSizeSelector } from "@/components/editor/FontSizeSelector";

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
  submitContract,
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
  signaturePath?: string | null;
  signedAt?: string | null
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

// Data removed

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

// (Editor Toolbar has been extracted to src/components/editor/EditorToolbar.tsx)

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
      className={`rounded-lg border p-2.5 space-y-2 ${isExt ? "border-blue-100 bg-blue-50/30" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isExt ? (
            <Mail className="h-3 w-3 text-blue-500" />
          ) : (
            <User className="h-3 w-3 text-emerald-600" />
          )}
          <span
            className={`text-[11px] font-semibold ${isExt ? "text-blue-600" : "text-emerald-700"}`}
          >
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
          className={`p-0.5 ${disabled || signer.id === "s1" ? "text-gray-200 cursor-not-allowed" : "text-gray-300 hover:text-red-400"} transition-colors rounded`}
        >
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
            className={`${inputCls} appearance-none pr-6 ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
          >
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
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
              disabled
                ? "border-gray-100 bg-gray-50 text-gray-300"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" />

            <span>
              Token akses akan dikirim ke email ini setelah tanda tangan
              internal selesai.
            </span>
          </div>
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
  signaturePath,
  signedDocumentUrl,
}: {
  name?: string;
  title?: string;
  email?: string;
  date?: string;
  isExternal?: boolean;
  signaturePath?: string | null;
  signedDocumentUrl?: string | null;
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
    <div className="flex flex-col gap-2 w-62.5">
      <p className="text-[11px] text-gray-400">Tanggal: {formattedDate}</p>

      {/* Area TTD */}
      <div className="w-full border border-gray-200 rounded-xl h-31 flex items-center justify-center bg-gray-50/60 overflow-hidden">
        {signaturePath ? (
          <img
            src={signaturePath}
            alt="Tanda Tangan"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            {isExternal ? (
              <Mail className="h-6 w-6 stroke-[1.25]" />
            ) : (
              <Pen className="h-6 w-6 stroke-[1.25]" />
            )}
            <span className="text-[10px] tracking-wide font-medium uppercase">
              Area Tanda Tangan
            </span>
          </div>
        )}
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

      {/* Link dokumen fisik jika ada */}
      {signedDocumentUrl && (
        <a
          href={signedDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-1"
        >
          <FileText className="h-3 w-3" />
          Lihat Dokumen Fisik
        </a>
      )}
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
  const isViewRoute = location.pathname.endsWith("/view");

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
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = useState<string>("draft");
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReadOnlyAfterSubmit, setIsReadOnlyAfterSubmit] =
    useState<boolean>(false);
  const isStrictlyReadOnly = isViewRoute || isReadOnlyAfterSubmit;
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pageMargin, setPageMargin] = useState<MarginStyle>(
    MARGIN_PRESETS[0].value,
  );

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
      }),
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
        class: "outline-none text-sm leading-7 text-gray-800",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const draftKey = id ? `contract_draft_${id}` : "contract_draft_new";
      if (html && html !== "<p></p>") {
        localStorage.setItem(draftKey, html);
      }
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
        setCurrentStatus(c.status ?? "draft");

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
        // Load draft if exists, otherwise load from DB
        const draftKey = id ? `contract_draft_${id}` : "contract_draft_new";
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          editor.commands.setContent(savedDraft);
        } else if (c.content) {
          editor.commands.setContent(c.content);
        }

        // load partner name (manual input only)
        if (c && c.partner) {
          setSelectedPartnerName(c.partner ?? "");
        }

        // load signers
        if ((c as any).signers && (c as any).signers.length > 0) {
          const allReviews: any[] = [];
          const loadedSigners = (c as any).signers.map(
            (s: any, index: number) => {
              console.log('signer', s.signer_type, 'signatures:', s.signatures);
              if (s.reviews && s.reviews.length > 0) {
                const author =
                  s.signer_type === "internal" && s.user
                    ? s.user.name
                    : s.signer_name || s.external_email || "Eksternal";
                const role =
                  s.signer_type === "internal" && s.user
                    ? s.user.job_title || "Internal"
                    : s.signer_role || "Eksternal";

                s.reviews.forEach((r: any) => {
                  if (r.notes) {
                    allReviews.push({
                      id: r.id,
                      author: author,
                      role: role,
                      type: r.status,
                      typeLabel:
                        r.status === "revised" || r.status === "revision"
                          ? "Revisi"
                          : r.status === "rejected"
                            ? "Ditolak"
                            : "Catatan",
                      message: r.notes,
                      date: r.reviewed_at,
                    });
                  }
                });
              }

              return {
                id: s.id?.toString() || `s${index}`,
                type: s.signer_type,
                name:
                  s.signer_type === "internal" && s.user
                    ? s.user.name
                    : s.signer_name || "",
                title:
                  s.signer_type === "internal" && s.user
                    ? s.user.job_title || ""
                    : s.signer_role || "",
                email: s.external_email || "",
                noUserAccount: false,
                signaturePath:
                  s.signatures?.[s.signatures.length - 1]?.signature_path ??
                  null,
                signedAt: s.signatures?.[s.signatures.length - 1]?.signed_at ?? null,
              };
            },
          );
          setSigners(loadedSigners);
          // sort descending by ID
          setFeedbacks(allReviews.sort((a, b) => b.id - a.id));

          if ((c as any).signed_document_url) {
            setSignedDocumentUrl((c as any).signed_document_url);
          }
        }
        // If contract is not draft/revision, mark UI read-only
        if (c.status && !["draft", "revision"].includes(c.status)) {
          setIsReadOnlyAfterSubmit(true);
        }

        if ((c as any).status_logs) {
          setStatusLogs((c as any).status_logs);
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

  const buildPayload = (statusOverride?: string) => ({
    contract_number: contractNumber.trim() || undefined,
    external_contract_number: externalContractNumber.trim() || null,
    title: title.trim(),
    start_date: startDate || null,
    end_date: endDate || null,
    status: statusOverride || currentStatus,
    template_id: selectedTemplate?.id ?? null,
    partner_name: selectedPartnerName?.trim()
      ? selectedPartnerName.trim()
      : null,
    content: editor?.getHTML() ?? "",
    signers: signers.map((s) => ({
      type: s.type,
      name: s.name,
      title: s.title,
      email: s.email,
      noUserAccount: s.noUserAccount,
    })),
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
        await updateContract(Number(id), buildPayload(currentStatus));
      } else {
        await createContract(buildPayload("draft"));
      }
      const draftKey = id ? `contract_draft_${id}` : "contract_draft_new";
      localStorage.removeItem(draftKey);
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
      let res;
      if (isEdit) {
        await updateContract(Number(id), buildPayload(currentStatus));
        res = await submitContract(Number(id));
      } else {
        const created = await createContract(buildPayload("draft"));
        res = await submitContract(created.id);
      }
      setIsReadOnlyAfterSubmit(true);
      const draftKey = id ? `contract_draft_${id}` : "contract_draft_new";
      localStorage.removeItem(draftKey);
      return res as ContractRow;
    } catch {
      setSaveError("Gagal mengajukan kontrak. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // when read-only flag changes, update editor editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isStrictlyReadOnly);
  }, [editor, isStrictlyReadOnly]);

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
            <div className="flex items-center gap-2">
              {!isViewRoute && (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving || isStrictlyReadOnly}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Simpan Draft
                  </button>
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={isSaving || isStrictlyReadOnly}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    → Ajukan
                  </button>
                </>
              )}
            </div>
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
            id="contract-editor-layout"
          >
            {/* LEFT — 320px default */}
            <Panel
              defaultSize={SIDEBAR_DEFAULT_PX}
              minSize={SIDEBAR_MIN_PX}
              maxSize={SIDEBAR_MAX_PX}
            >
              <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
                {/* Scrollable body + pinned preview wrapper (so overlay can cover both) */}
                <div className="relative flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {/* Title row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate("/contracts")}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                      >
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
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border text-xs transition-all select-none group ${isReadOnlyAfterSubmit ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-60" : "border-emerald-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-sm"}`}
                        >
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
                            stroke="currentColor"
                          >
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
                            className="px-2 py-1.5 border border-gray-200 rounded-md text-gray-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-xs shrink-0"
                          >
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
                        className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors ${isReadOnlyAfterSubmit || signers.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <Plus className="h-3.5 w-3.5" /> Tambah Penandatangan
                      </button>
                    </div>
                  </div>
                </div>

                {/* read-only state handled by disabling individual controls; no overlay so back button stays clickable */}
              </div>
            </Panel>

            <ResizeHandle />

            {/* CENTER flexible */}
            <Panel minSize={320}>
              <div className="h-full flex flex-col bg-white overflow-hidden">
                <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white flex-wrap shrink-0">
                  <HistoryButtons
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <HeadingButtons
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <FormattingButtons
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <AlignmentButtons
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <BulletDropdown
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <NumberingDropdown
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <ToolbarBtn
                    onClick={() =>
                      editor?.chain().focus().setHorizontalRule().run()
                    }
                    disabled={isReadOnlyAfterSubmit}
                    title="Horizontal Rule"
                  >
                    <span className="text-xs font-bold">―</span>
                  </ToolbarBtn>
                  <MarginDropdown
                    margin={pageMargin}
                    setMargin={setPageMargin}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <TableDropdown
                    editor={editor!}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <HighlightColorPicker
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <TextColorPicker
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <FieldInserter
                    editor={editor}
                    fields={fields}
                    onAddField={() => setShowFieldModal(true)}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <div className="relative ml-1">
                    <LineSpacingToggle
                      editor={editor}
                      disabled={isReadOnlyAfterSubmit}
                    />
                  </div>
                  <ToolbarDivider />
                  <LinkButton
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ImageUploadButton
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                  <ToolbarDivider />
                  <FontSizeSelector
                    editor={editor}
                    disabled={isReadOnlyAfterSubmit}
                  />
                </div>
                <div
                  className="flex-1 overflow-y-auto bg-[#f3f4f6] py-8"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (isReadOnlyAfterSubmit) return;
                    const tag = e.dataTransfer.getData("text/plain");
                    if (tag && editor) {
                      editor.chain().focus().insertContent(tag).run();
                    }
                  }}
                >
                  {/* Paper Wrapper */}
                  <div
                    className="mx-auto bg-white shadow-md border border-gray-200 flex flex-col relative"
                    style={{
                      width: "21.5cm",
                      minHeight: "33cm",
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent calc(33cm - 1px), #d1d5db calc(33cm - 1px), #d1d5db 33cm)",
                    }}
                  >
                    <div
                      className="flex-1"
                      style={{
                        paddingTop: pageMargin.top,
                        paddingBottom: pageMargin.bottom,
                        paddingLeft: pageMargin.left,
                        paddingRight: pageMargin.right,
                      }}
                    >
                      <EditorContent editor={editor} className="h-full" />
                    </div>

                    {/*  Tanda Tangan  */}
                    <div
                      className="pt-8 mt-auto border-t border-dashed border-gray-200"
                      style={{
                        paddingBottom: pageMargin.bottom,
                        paddingLeft: pageMargin.left,
                        paddingRight: pageMargin.right,
                      }}
                    >
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
                        Tanda Tangan
                      </p>
                      {signedDocumentUrl ? (
                        // Alur fisik: tampilkan banner + link dokumen
                        <div className="flex flex-col items-center gap-4 py-4">
                          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 w-full max-w-md">
                            <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-emerald-800">
                                Dokumen Bertanda Tangan Telah Diupload
                              </p>
                              <p className="text-xs text-emerald-600 mt-0.5">
                                Dokumen fisik yang sudah ditandatangani kedua
                                pihak tersedia.
                              </p>
                            </div>
                          </div>

                          <a
                            href={signedDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <FileText className="h-4 w-4 text-emerald-600" />
                            Lihat Dokumen Bertanda Tangan
                          </a>
                        </div>
                      ) : (
                        // Alur digital: tampilkan kotak TTD per signer
                        <div className="grid grid-cols-2 gap-x-10 gap-y-8 justify-items-center">
                          {signers.map((s) => (
                            <SignatureBox
                              key={s.id}
                              isExternal={s.type === "external"}
                              name={s.name || undefined}
                              title={s.title || undefined}
                              email={s.email || undefined}
                              date={s.signedAt || startDate}
                              signaturePath={s.signaturePath}
                            />
                          ))}
                        </div>
                      )}
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
              maxSize={SIDEBAR_MAX_PX}
            >
              <RightSidebar statusLogs={statusLogs} feedbacks={feedbacks} />
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
  statusLogs,
  feedbacks,
}: {
  statusLogs: any[];
  feedbacks: any[];
}) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Informasi Pembuat */}
        {/* <section>
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

        <div className="border-t border-gray-100" /> */}

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
            {statusLogs && statusLogs.length > 0 ? (
              statusLogs.map((log, i) => (
                <div key={log.id} className="flex gap-2">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[log.new_status as keyof typeof STATUS_DOT] || "bg-gray-400"}`}
                    />
                    {i < statusLogs.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />
                    )}
                  </div>
                  <div className="pb-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[log.new_status as keyof typeof STATUS_STYLE] || "bg-gray-100 text-gray-500"}`}
                      >
                        {log.new_status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {log.created_at}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      Diperbarui oleh: {log.changed_by}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      Dari {log.old_status} ke {log.new_status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Belum ada riwayat status.</p>
            )}
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Addendum Terkait */}
        {/* <section>
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
        </section> */}

        {/* <div className="border-t border-gray-100" /> */}

        {/* Umpan Balik & Revisi */}
        <section>
          {feedbacks.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Umpan Balik & Revisi
                </p>
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {feedbacks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold shrink-0 uppercase">
                          {fb.author ? fb.author[0] : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {fb.author}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {fb.role}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                          fb.type === "revised" ||
                          fb.type === "revision" ||
                          fb.type === "rejected"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {fb.typeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {fb.message}
                    </p>
                    <p className="text-[10px] text-gray-300">{fb.date}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Kirim balasan UI removed for now */}
      </div>
    </div>
  );
}
