import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Group as PanelGroup, Panel } from "react-resizable-panels";
import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import {
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { FontSize } from "@/lib/tiptap-font-size";
import { FontFamily } from "@/lib/tiptap-font-family";
import { LineHeight } from "@/lib/tiptap-line-height";
import { ContractField } from "@/lib/tiptap-contract-field";
import {
  buildContractFieldValues,
  prepareContractContentForEditor,
  validateRequiredContractFields,
} from "@/lib/contract-field-values";
import { setEditorContentWithoutHistory } from "@/lib/tiptap-history";
import { PageBreak } from "@/lib/tiptap-page-break";
import { ResizableTable } from "@/lib/tiptap-resizable-table";
import { ResizableTableRow } from "@/lib/tiptap-resizable-table-rows";
import {
  BorderedTableCell,
  BorderedTableHeader,
} from "@/lib/tiptap-table-cell-borders";
import { normalizePaperSize, type PaperSize } from "@/lib/editor-paper";
import { createPdfPreviewFilename } from "@/lib/pdf-preview";
import { usePdfPreview } from "@/hooks/use-pdf-preview";
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

import { ResizeHandle } from "@/components/editor/ResizeHandle";
import {
  type MarginStyle,
  MARGIN_PRESETS,
} from "@/components/editor/MarginDropdown";
import { ContractSignatureBox } from "@/components/editor/contract/ContractSignerFields";
import { ContractEditorWorkspace } from "@/components/editor/contract/ContractEditorWorkspace";
import { ContractEditorRightSidebar } from "@/components/editor/contract/ContractEditorRightSidebar";
import { ContractLeaveConfirmModal } from "@/components/modal/contract/ContractLeaveConfirmModal";
import { ContractVersionPreviewModal } from "@/components/modal/contract/ContractVersionPreviewModal";
import {
  ContractEditorLeftSidebar,
  type ContractEditorSigner as Signer,
  type InternalSignerUser as InternalUser,
  type SignerType,
} from "@/components/editor/contract/ContractEditorLeftSidebar";

import TemplateSelectModal, {
  type TemplateOption,
} from "@/components/modal/template/TemplateSelectModal";
import SignerTypeModal from "@/components/modal/contract/SignerTypeModal";
import SubmitConfirmModal from "@/components/modal/contract/SubmitConfirmModal";
import SaveDraftConfirmModal from "@/components/modal/contract/SaveDraftConfirmModal";
import FieldManageModal from "@/components/modal/contract/FieldManageModal";
import { fetchCategories } from "@/services/category.service";
import {
  createContract,
  fetchContract,
  updateContract,
  submitContract,
  generateContractNumber,
  fetchSigners,
  downloadContractPdf,
} from "@/services/contract.service";
import {
  fetchFieldDefinitions,
  type FieldDefinition,
} from "@/services/field.service";
import type { Category } from "@/types/category";
import type { ContractRow } from "@/pages/contracts/ContractListPage";
// Notifikasi
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

import type { ContractVersion } from "@/types/contractVersion";

//  Types

// Contract detail from backend includes partner name for manual input.
type ContractDetail = ContractRow & {
  partner?: string | null;
  content?: string | null;
  signers?: ContractSignerDetail[];
  signed_document_url?: string | null;
  status_logs?: ContractStatusLog[];
  versions?: ContractVersion[];
};

type ContractSignerDetail = {
  id?: number | string;
  signer_type: SignerType;
  signer_name?: string | null;
  signer_role?: string | null;
  external_email?: string | null;
  user?: {
    name?: string | null;
    job_title?: string | null;
  } | null;
  signatures?: {
    signature_path?: string | null;
    signed_at?: string | null;
  }[];
  reviews?: ContractReviewDetail[];
};

type ContractReviewDetail = {
  id: number;
  status?: string | null;
  notes?: string | null;
  reviewed_at?: string | null;
  review_document_url?: string | null;
};

type ContractFeedback = {
  id: number;
  author: string;
  role: string;
  type: string;
  typeLabel: string;
  message: string;
  date?: string;
  review_document_url?: string | null;
};

type ContractStatusLog = {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
};

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

// Default sidebar width in pixels
const SIDEBAR_DEFAULT_PX = 260;
const SIDEBAR_MIN_PX = 200;
const SIDEBAR_MAX_PX = 480;

function getActiveDocumentFontFamily(
  editor: NonNullable<ReturnType<typeof useEditor>>,
) {
  const selectionFont = editor.getAttributes("textStyle").fontFamily;

  if (selectionFont) return selectionFont as string;

  let documentFont = "";

  editor.state.doc.descendants((node) => {
    if (documentFont) return false;

    if (typeof node.attrs.fontFamily === "string" && node.attrs.fontFamily) {
      documentFont = node.attrs.fontFamily;
      return false;
    }

    const textStyleMark = node.marks.find(
      (mark) => mark.type.name === "textStyle" && mark.attrs.fontFamily,
    );

    if (textStyleMark?.attrs.fontFamily) {
      documentFont = textStyleMark.attrs.fontFamily as string;
      return false;
    }

    return true;
  });

  return documentFont;
}

export default function ContractEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { fetch: refetchNotifications } = useNotifications();
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const draftKey = id ? `contract_draft_${id}` : "contract_draft_new";

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
  const [statusLogs, setStatusLogs] = useState<ContractStatusLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<ContractFeedback[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftContractId, setDraftContractId] = useState<number | null>(
    id ? Number(id) : (navState?.createdContract?.id ?? null),
  );
  const [isReadOnlyAfterSubmit, setIsReadOnlyAfterSubmit] =
    useState<boolean>(false);
  const isStrictlyReadOnly = isViewRoute || isReadOnlyAfterSubmit;
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveDraftConfirm, setShowSaveDraftConfirm] = useState(false);
  const [pageMargin, setPageMargin] = useState<MarginStyle>(
    MARGIN_PRESETS[0].value,
  );
  const [paperSize, setPaperSize] = useState<PaperSize>(
    normalizePaperSize(initialTemplate?.paper_size),
  );
  const [watermark, setWatermark] = useState<WatermarkSettings>(
    DEFAULT_WATERMARK_SETTINGS,
  );

  // Versions
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [viewingVersion, setViewingVersion] = useState<ContractVersion | null>(
    null,
  );

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Internal Users
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);

  // Active fields are shown in the inserter. All fields are kept for parsing
  // existing template/contract tokens, including fields that are now inactive.
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [allFields, setAllFields] = useState<FieldDefinition[]>([]);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  // Mitra (manual input only)
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("");

  const refreshFields = useCallback(async () => {
    try {
      const fieldData = await fetchFieldDefinitions();
      setAllFields(fieldData);
      setFields(fieldData.filter((f: FieldDefinition) => f.is_active));
    } catch {
      /* silent */
    } finally {
      setFieldsLoaded(true);
    }
  }, []);

  const autoGeneratedRef = useRef(false);
  const contractLoadedRef = useRef(false);
  const appliedTemplateRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategories();
        setCategories(data.filter((c: Category) => c.is_active));
      } catch {
        /* silent */
      }
    })();

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // first signer MUST be internal
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
      setHasUnsavedChanges(true);
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
  const signatureFontFamily =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) =>
        currentEditor ? getActiveDocumentFontFamily(currentEditor) : "",
    }) ?? "";

  useEffect(() => {
    const html = editor?.getHTML() || "";
    if (html && html !== "<p></p>") {
      localStorage.setItem(
        draftKey,
        appendMarginsToContent(
          appendWatermarkToContent(html, watermark),
          pageMargin,
        ),
      );
    }
  }, [draftKey, editor, watermark, pageMargin]);
  // include pageMargin so localStorage draft reflects current margins

  // Load edit data
  useEffect(() => {
    if (!id || !editor || !fieldsLoaded || contractLoadedRef.current) return;
    (async () => {
      try {
        const c = (await fetchContract(Number(id))) as ContractDetail;
        contractLoadedRef.current = true;
        setContractNumber(c.contract_number ?? "");
        setExternalContractNumber(
          (c as unknown as { external_contract_number?: string })
            .external_contract_number ?? "",
        );
        setTitle(c.title ?? "");
        setCurrentStatus(c.status ?? "draft");
        setPaperSize(normalizePaperSize(c.paper_size));

        // Reconstruct template dari contract data
        if (c.template_id) {
          setSelectedTemplate({
            id: c.template_id,
            name: c.title ?? "",
            category_id: c.category_id ?? 0,
            content: c.content ?? "",
            paper_size: normalizePaperSize(c.paper_size),
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
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          const extractedMargins = extractMarginsFromContent(savedDraft);
          const extracted = extractWatermarkFromContent(
            extractedMargins.content,
          );
          setWatermark(extracted.watermark);
          setPageMargin(extractedMargins.margins || DEFAULT_MARGINS);
          setEditorContentWithoutHistory(
            editor,
            prepareContractContentForEditor(extracted.content, allFields),
          );
        } else if (c.content) {
          const extractedMargins = extractMarginsFromContent(c.content);
          const extracted = extractWatermarkFromContent(
            extractedMargins.content,
          );
          setWatermark(extracted.watermark);
          setPageMargin(extractedMargins.margins || DEFAULT_MARGINS);
          setEditorContentWithoutHistory(
            editor,
            prepareContractContentForEditor(extracted.content, allFields),
          );
        }

        // load partner name (manual input only)
        setSelectedPartnerName(
          c.partner && c.partner !== "-" ? c.partner : "",
        );

        // load signers
        if (c.signers && c.signers.length > 0) {
          const allReviews: ContractFeedback[] = [];
          const loadedSigners = c.signers.map(
            (s: ContractSignerDetail, index: number) => {
              if (s.reviews && s.reviews.length > 0) {
                const author =
                  s.signer_type === "internal" && s.user
                    ? s.user.name
                    : s.signer_name || s.external_email || "Eksternal";
                const role =
                  s.signer_type === "internal" && s.user
                    ? s.user.job_title || "Internal"
                    : s.signer_role || "Eksternal";

                s.reviews.forEach((r) => {
                  if (r.notes || r.review_document_url) {
                    allReviews.push({
                      id: r.id,
                      author: author ?? "Reviewer",
                      role: role ?? "Reviewer",
                      type: r.status ?? "note",
                      typeLabel:
                        r.status === "revised" || r.status === "revision"
                          ? "Revisi"
                          : r.status === "rejected"
                            ? "Ditolak"
                            : "Catatan",
                      message: r.notes ?? "",
                      date: r.reviewed_at ?? undefined,
                      review_document_url: r.review_document_url ?? undefined,
                    });
                  }
                });
              }

              return {
                id: s.id?.toString() || `s${index}`,
                type: s.signer_type,
                name:
                  s.signer_type === "internal" && s.user
                    ? (s.user.name ?? "")
                    : (s.signer_name ?? ""),
                title:
                  s.signer_type === "internal" && s.user
                    ? (s.user.job_title ?? "")
                    : (s.signer_role ?? ""),
                email: s.external_email || "",
                noUserAccount: false,
                signaturePath:
                  s.signatures?.[s.signatures.length - 1]?.signature_path ??
                  null,
                signedAt:
                  s.signatures?.[s.signatures.length - 1]?.signed_at ?? null,
              };
            },
          );
          setSigners(loadedSigners);
          // sort descending by ID
          setFeedbacks(allReviews.sort((a, b) => b.id - a.id));

          if (c.signed_document_url) {
            setSignedDocumentUrl(c.signed_document_url);
          }
        }
        // If contract is not draft/revision, mark UI read-only
        if (c.status && !["draft", "revision"].includes(c.status)) {
          setIsReadOnlyAfterSubmit(true);
        }

        if (c.status_logs) {
          setStatusLogs(c.status_logs);
        }

        if (c.versions) {
          setVersions(c.versions);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, editor, allFields, fieldsLoaded, draftKey]);

  useEffect(() => {
    if (!selectedTemplate || !editor || !fieldsLoaded) return;

    const templateKey = `${selectedTemplate.id}:${selectedTemplate.content}`;
    if (appliedTemplateRef.current === templateKey) return;

    appliedTemplateRef.current = templateKey;
    const extractedTemplateMargins = extractMarginsFromContent(
      selectedTemplate.content,
    );
    const extractedTemplateContent = extractWatermarkFromContent(
      extractedTemplateMargins.content,
    );
    setEditorContentWithoutHistory(
      editor,
      prepareContractContentForEditor(
        extractedTemplateContent.content,
        allFields,
      ),
    );
    setWatermark(extractedTemplateContent.watermark);
    setPageMargin(extractedTemplateMargins.margins || DEFAULT_MARGINS);
    setPaperSize(normalizePaperSize(selectedTemplate.paper_size));
    if (!isEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasUnsavedChanges(true);
    }
  }, [selectedTemplate, editor, allFields, fieldsLoaded, isEdit]);

  const handleSelectTemplate = useCallback(
    (t: TemplateOption) => {
      setSelectedTemplate(t);
      setShowTemplateModal(false);
      const extractedMargins = extractMarginsFromContent(t.content);
      const extracted = extractWatermarkFromContent(extractedMargins.content);
      setEditorContentWithoutHistory(
        editor,
        prepareContractContentForEditor(extracted.content, allFields),
      );
      setWatermark(extracted.watermark);
      setPageMargin(extractedMargins.margins || DEFAULT_MARGINS);
      setPaperSize(normalizePaperSize(t.paper_size));
      if (!title || title === "Kontrak Sewa Vendor") setTitle(t.name);
      setHasUnsavedChanges(true);

      // Auto-update contract number prefix based on the new category
      if (!isEdit) {
        generateContractNumber(t.category_id)
          .then(setContractNumber)
          .catch(() => { });
      }
    },
    [editor, title, isEdit, allFields],
  );

  const buildSignersPayload = () =>
    signers
      .filter((signer) => signer.name.trim())
      .map((signer) => ({
        type: signer.type,
        name: signer.name.trim(),
        title: signer.title.trim(),
        email: signer.email.trim(),
        noUserAccount: signer.noUserAccount,
      }));

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const getSubmitSignerValidationMessage = () => {
    const filledSigners = buildSignersPayload();
    const externalSigners = filledSigners.filter(
      (signer) => signer.type === "external",
    );

    if (
      !filledSigners.some((signer) => signer.type === "internal") ||
      externalSigners.length === 0
    ) {
      return "Pengajuan membutuhkan minimal satu penandatangan internal dan satu penandatangan eksternal.";
    }

    const incompleteExternalSigner = externalSigners.find(
      (signer) =>
        !signer.name.trim() || !signer.title.trim() || !signer.email.trim(),
    );

    if (incompleteExternalSigner) {
      return "Penandatangan eksternal wajib memiliki nama, jabatan, dan email valid sebelum kontrak diajukan.";
    }

    if (externalSigners.some((signer) => !isValidEmail(signer.email))) {
      return "Email penandatangan eksternal tidak valid. Periksa kembali email yang diisi.";
    }

    return null;
  };

  const getSubmitFieldValidationMessage = () => {
    const missingFields = validateRequiredContractFields(
      editor?.getHTML() ?? "",
      allFields,
    );

    if (missingFields.length === 0) return null;

    const fieldNames = missingFields
      .map((field) => field.field_label)
      .join(", ");

    return `Field kontrak belum diisi: ${fieldNames}.`;
  };

  const getSubmitDateValidationMessage = () => {
    if (!startDate || !endDate) {
      return "Tanggal mulai dan tanggal selesai wajib diisi sebelum kontrak diajukan.";
    }

    return null;
  };

  const getSubmitPartnerValidationMessage = () => {
    if (!selectedPartnerName.trim()) {
      return "Nama mitra wajib diisi sebelum kontrak diajukan.";
    }

    return null;
  };

  const getSubmitValidationMessage = () => {
    if (!title.trim()) {
      return "Judul kontrak wajib diisi.";
    }

    return (
      getSubmitDateValidationMessage() ??
      getSubmitPartnerValidationMessage() ??
      getSubmitSignerValidationMessage() ??
      getSubmitFieldValidationMessage()
    );
  };

  const buildPayload = (
    statusOverride?: string,
    overrides?: Partial<{ title: string }>,
  ) => {
    const rawContent = editor?.getHTML() ?? "";
    // append watermark marker then margins marker so backend can extract both
    const contentWithWatermark = appendWatermarkToContent(
      rawContent,
      watermark,
    );
    const content = appendMarginsToContent(contentWithWatermark, pageMargin);
    return {
      contract_number: contractNumber.trim() || undefined,
      external_contract_number: externalContractNumber.trim() || null,
      title: overrides?.title ?? title.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      status: statusOverride || currentStatus,
      template_id: selectedTemplate?.id ?? null,
      partner_name: selectedPartnerName?.trim()
        ? selectedPartnerName.trim()
        : null,
      content,
      paper_size: paperSize,
      field_values: buildContractFieldValues(content, allFields),
      signers: buildSignersPayload(),
    };
  };

  const createPdfPreviewSignature = () =>
    JSON.stringify({
      ...buildPayload(currentStatus),
      content: appendMarginsToContent(
        appendWatermarkToContent(editor?.getHTML() ?? "", watermark),
        pageMargin,
      ),
    });

  const persistDraft = async (options?: {
    forPreview?: boolean;
  }): Promise<ContractRow | undefined> => {
    const isPreview = options?.forPreview ?? false;
    const payloadOverrides = isPreview
      ? { title: title.trim() || "Preview Kontrak" }
      : undefined;

    if (!isPreview && !title.trim()) {
      setSaveError("Judul kontrak wajib diisi.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const persistedId = draftContractId ?? (id ? Number(id) : null);
      let savedContract: ContractRow;

      if (persistedId) {
        savedContract = await updateContract(
          persistedId,
          buildPayload(currentStatus, payloadOverrides),
        );
      } else {
        savedContract = await createContract(
          buildPayload("draft", payloadOverrides),
        );
        setDraftContractId(savedContract.id);
      }

      setCurrentStatus(savedContract.status ?? "draft");
      localStorage.removeItem(draftKey);
      setHasUnsavedChanges(false);
      return savedContract;
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Gagal menyimpan. Coba lagi."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const savedContract = await persistDraft();
    if (savedContract) {
      navigate("/contracts");
    }
  };

  const {
    previewUrl: pdfPreviewUrl,
    previewFilename: pdfPreviewFilename,
    previewError: pdfPreviewError,
    isPreparingPreview: isPreparingPdfPreview,
    preparePreview: handleSaveAndPreviewPdf,
  } = usePdfPreview({
    cacheKey: "contract-pdf-preview",
    createSignature: createPdfPreviewSignature,
    generatePdf: async () => {
      const existingContractId = draftContractId ?? (id ? Number(id) : null);
      let previewContractId = existingContractId;

      if (!isStrictlyReadOnly) {
        const savedContract = await persistDraft({ forPreview: true });
        if (!savedContract) return;
        previewContractId = savedContract.id;
      }

      if (!previewContractId) {
        throw new Error(
          "Simpan kontrak terlebih dahulu untuk membuat preview PDF.",
        );
      }

      const response = await downloadContractPdf(previewContractId);
      return {
        blob: response.data,
        filename: createPdfPreviewFilename(title, "kontrak"),
      };
    },
    getErrorMessage: (error) =>
      getApiErrorMessage(
        error,
        error instanceof Error
          ? error.message
          : "Gagal membuat preview PDF. Coba simpan ulang.",
      ),
  });

  const handleConfirmSaveDraft = async () => {
    setShowSaveDraftConfirm(false);
    await handleSaveDraft();
  };

  const handleSubmit = async (): Promise<ContractRow | undefined> => {
    const submitValidationMessage = getSubmitValidationMessage();
    if (submitValidationMessage) {
      setSaveError(submitValidationMessage);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      let res;
      const persistedId = draftContractId ?? (id ? Number(id) : null);
      if (persistedId) {
        await updateContract(persistedId, buildPayload(currentStatus));
        res = await submitContract(persistedId);
      } else {
        const created = await createContract(buildPayload("draft"));
        setDraftContractId(created.id);
        res = await submitContract(created.id);
      }
      setIsReadOnlyAfterSubmit(true);
      localStorage.removeItem(draftKey);
      setHasUnsavedChanges(false);

      // Toast sukses
      toast.success("Kontrak berhasil diajukan!", {
        description: "Permintaan peninjauan kontrak telah dikirim ke peninjau pihak pertama.",
        duration: 5000,
      });

      // Refresh notifikasi bell
      await refetchNotifications();

      return res as ContractRow;
    } catch (error) {
      setSaveError(
        getApiErrorMessage(error, "Gagal mengajukan kontrak. Coba lagi."),
      );

      toast.error("Gagal mengajukan kontrak.", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // when read-only flag changes, update editor editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isStrictlyReadOnly);
  }, [editor, isStrictlyReadOnly]);

  const hasLocalDraft = () => Boolean(localStorage.getItem(draftKey));

  const handleRequestExit = () => {
    if (isStrictlyReadOnly || (!hasUnsavedChanges && !hasLocalDraft())) {
      navigate("/contracts");
      return;
    }

    setShowLeaveConfirm(true);
  };

  const handleDiscardAndExit = () => {
    localStorage.removeItem(draftKey);
    setHasUnsavedChanges(false);
    setShowLeaveConfirm(false);
    navigate("/contracts");
  };

  return (
    <>
      {showTemplateModal && (
        <TemplateSelectModal
          onSelect={handleSelectTemplate}
          onClose={handleRequestExit}
        />
      )}

      <div
        className="flex flex-col h-screen overflow-hidden bg-gray-100"
        onInputCapture={() => setHasUnsavedChanges(true)}
        onChangeCapture={() => setHasUnsavedChanges(true)}>
        {/*  Global Header  */}
        <header className="flex items-center justify-between px-5 h-12 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <img
              src="/Agreema.svg"
              alt="Agreema Logo"
              className="h-10 w-auto shrink-0"
            />
          </div>
        </header>

        {/*  Action Bar  */}
        <div className="flex items-center justify-between px-5 h-10 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-65">
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
                    onClick={() => setShowSaveDraftConfirm(true)}
                    disabled={isSaving || isStrictlyReadOnly}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium">
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Simpan Draft
                  </button>
                  <button
                    onClick={() => {
                      const submitValidationMessage =
                        getSubmitValidationMessage();
                      if (submitValidationMessage) {
                        setSaveError(submitValidationMessage);
                        return;
                      }

                      setSaveError(null);
                      setShowSubmitConfirm(true);
                    }}
                    disabled={isSaving || isStrictlyReadOnly}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">
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
            id="contract-editor-layout">
            {/* LEFT — 320px default */}
            <Panel
              defaultSize={SIDEBAR_DEFAULT_PX}
              minSize={SIDEBAR_MIN_PX}
              maxSize={SIDEBAR_MAX_PX}>
              <ContractEditorLeftSidebar
                contractNumber={contractNumber}
                externalContractNumber={externalContractNumber}
                title={title}
                startDate={startDate}
                endDate={endDate}
                selectedPartnerName={selectedPartnerName}
                selectedTemplate={selectedTemplate}
                categories={categories}
                signers={signers}
                internalUsers={internalUsers}
                isEdit={isEdit}
                disabled={isReadOnlyAfterSubmit}
                onBack={handleRequestExit}
                onContractNumberChange={setContractNumber}
                onExternalContractNumberChange={setExternalContractNumber}
                onTitleChange={setTitle}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onPartnerNameChange={setSelectedPartnerName}
                onRegenerateContractNumber={() =>
                  generateContractNumber(selectedTemplate?.category_id)
                    .then(setContractNumber)
                    .catch(() => { })
                }
                onUpdateSigner={updateSigner}
                onRemoveSigner={removeSigner}
                onAddSignerClick={() => setShowSignerTypeModal(true)}
              />
            </Panel>
            <ResizeHandle />
            {/* CENTER flexible */}
            <Panel minSize={320}>
              <ContractEditorWorkspace
                editor={editor}
                pageMargin={pageMargin}
                setPageMargin={setPageMargin}
                paperSize={paperSize}
                setPaperSize={setPaperSize}
                disabled={isReadOnlyAfterSubmit}
                fields={fields}
                onAddField={() => setShowFieldModal(true)}
                onDropText={(text) => {
                  if (isReadOnlyAfterSubmit) return;
                  editor?.chain().focus().insertContent(text).run();
                }}
                watermark={watermark}
                setWatermark={setWatermark}
                pdfPreviewUrl={pdfPreviewUrl}
                pdfPreviewError={pdfPreviewError}
                isPreparingPdfPreview={isPreparingPdfPreview}
                onSaveAndPreviewPdf={handleSaveAndPreviewPdf}
                pdfPreviewFilename={pdfPreviewFilename}
                childrenAfterEditor={
                  <div
                    className="pt-8 mt-auto border-t border-dashed border-gray-200"
                    style={{
                      paddingBottom: pageMargin.bottom,
                      paddingLeft: pageMargin.left,
                      paddingRight: pageMargin.right,
                    }}>
                    {signedDocumentUrl ? (
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
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          Lihat Dokumen Bertanda Tangan
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-10 gap-y-8 justify-items-center">
                        {signers.map((s) => (
                          <ContractSignatureBox
                            key={s.id}
                            isExternal={s.type === "external"}
                            name={s.name || undefined}
                            title={s.title || undefined}
                            email={s.email || undefined}
                            date={s.signedAt || startDate}
                            signaturePath={s.signaturePath}
                            fontFamily={signatureFontFamily}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </Panel>

            <ResizeHandle />

            {/* RIGHT — 320px default */}
            <Panel
              defaultSize={SIDEBAR_DEFAULT_PX}
              minSize={SIDEBAR_MIN_PX}
              maxSize={SIDEBAR_MAX_PX}>
              <ContractEditorRightSidebar
                statusLogs={statusLogs}
                feedbacks={feedbacks}
                versions={versions}
                onViewVersion={setViewingVersion}
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

      <SaveDraftConfirmModal
        isOpen={showSaveDraftConfirm}
        isSaving={isSaving}
        onClose={() => setShowSaveDraftConfirm(false)}
        onConfirm={handleConfirmSaveDraft}
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
          }
        }}
      />

      <ContractLeaveConfirmModal
        isOpen={showLeaveConfirm}
        isSaving={isSaving}
        isSaveDisabled={isStrictlyReadOnly}
        onClose={() => setShowLeaveConfirm(false)}
        onDiscard={handleDiscardAndExit}
        onSaveDraft={handleSaveDraft}
      />

      {showFieldModal && (
        <FieldManageModal
          onClose={() => setShowFieldModal(false)}
          onRefreshFields={refreshFields}
        />
      )}

      {/* Modal Preview Versi — komponen terpisah dengan diff highlighting */}
      {viewingVersion && (
        <ContractVersionPreviewModal
          versions={versions}
          viewingVersion={viewingVersion}
          onClose={() => setViewingVersion(null)}
          onNavigate={(v) => setViewingVersion(v)}
        />
      )}
    </>
  );
}
