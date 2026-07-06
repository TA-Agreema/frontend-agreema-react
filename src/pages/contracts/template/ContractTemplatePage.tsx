import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Download,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tag,
  ToggleLeft,
  Trash2,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import DeleteModal from "@/components/modal/common/DeleteModal";
import StatusBadge from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTemplates, type ContractTemplate } from "@/hooks/use-template";
import { downloadBlobResponse } from "@/services/download.service";
import { downloadTemplatePdf } from "@/services/template.service";

const PAGE_SIZE = 10;
const TABLE_COLUMNS = "grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_48px]";
const TEMPLATE_CREATE_PATH = "/contracts-templates/new";

type TemplatePermission = {
  canCreate: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canManageTemplate: boolean;
};

const getTemplatePermissions = (permissions: string[]): TemplatePermission => {
  const canCreate = permissions.includes("create.template");
  const canDelete = permissions.includes("delete.template");
  const canDownload = permissions.includes("download.template");
  const canEdit = permissions.includes("update.template");

  return {
    canCreate,
    canDelete,
    canDownload,
    canEdit,
    canManageTemplate: canCreate || canEdit || canDelete,
  };
};

const filterTemplates = (templates: ContractTemplate[], keyword: string) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return templates;
  }

  return templates.filter((template) => {
    const name = template.name.toLowerCase();
    const category = template.category.toLowerCase();

    return name.includes(normalizedKeyword) || category.includes(normalizedKeyword);
  });
};

const getDownloadErrorMessage = async (error: unknown): Promise<string> => {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      return JSON.parse(text)?.message ?? "Gagal mengunduh PDF template.";
    } catch {
      return "Gagal mengunduh PDF template.";
    }
  }

  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      "Gagal mengunduh PDF template."
    );
  }

  return "Gagal mengunduh PDF template.";
};

interface RowMenuProps {
  permissions: TemplatePermission;
  template: ContractTemplate;
  onDelete: (template: ContractTemplate) => void;
  onDownloadPdf: (template: ContractTemplate) => void;
  onEdit: (template: ContractTemplate) => void;
  onToggleStatus: (template: ContractTemplate) => void;
}

function RowMenu({
  permissions,
  template,
  onDelete,
  onDownloadPdf,
  onEdit,
  onToggleStatus,
}: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const estimatedMenuHeight = 152;
    const spaceBelow = window.innerHeight - rect.bottom;

    setDropUp(spaceBelow < estimatedMenuHeight + 12);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleScroll = () => setOpen(false);

    window.addEventListener("scroll", handleScroll, { capture: true });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute right-0 z-50 w-44 overflow-hidden rounded-lg border bg-card py-1 shadow-xl ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}>
          <TemplateActionButton
            icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
            label="Edit"
            disabled={!permissions.canEdit}
            title={
              !permissions.canEdit
                ? "Anda tidak memiliki izin untuk mengedit template"
                : undefined
            }
            onClick={() => {
              onEdit(template);
              setOpen(false);
            }}
          />
          <TemplateActionButton
            icon={<ToggleLeft className="h-4 w-4 text-muted-foreground" />}
            label={template.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
            disabled={!permissions.canEdit}
            title={
              !permissions.canEdit
                ? "Anda tidak memiliki izin untuk mengubah status template"
                : undefined
            }
            onClick={() => {
              onToggleStatus(template);
              setOpen(false);
            }}
          />
          <hr className="my-1 border-border" />
          <TemplateActionButton
            danger
            icon={<Trash2 className="h-4 w-4" />}
            label="Hapus"
            disabled={!permissions.canDelete}
            title={
              !permissions.canDelete
                ? "Anda tidak memiliki izin untuk menghapus template"
                : undefined
            }
            onClick={() => {
              onDelete(template);
              setOpen(false);
            }}
          />
          {permissions.canDownload && (
            <TemplateActionButton
              icon={<Download className="h-4 w-4 text-muted-foreground" />}
              label="Download PDF"
              onClick={() => {
                onDownloadPdf(template);
                setOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface TemplateActionButtonProps {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

function TemplateActionButton({
  danger = false,
  disabled = false,
  icon,
  label,
  title,
  onClick,
}: TemplateActionButtonProps) {
  const enabledClassName = danger
    ? "text-red-600 hover:bg-red-50"
    : "hover:bg-muted";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
        disabled
          ? "cursor-not-allowed text-muted-foreground opacity-50"
          : enabledClassName
      }`}>
      {icon}
      {label}
    </button>
  );
}

interface TemplateToolbarProps {
  canCreate: boolean;
  search: string;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
}

function TemplateToolbar({
  canCreate,
  search,
  onCreate,
  onSearchChange,
}: TemplateToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari template..."
          className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
      {canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="flex shrink-0 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Tambah Template
        </button>
      )}
    </div>
  );
}

function TemplateTableHeader() {
  return (
    <div className={`grid ${TABLE_COLUMNS} border-b bg-muted/30 px-6 py-3`}>
      {["Nama", "Kategori", "Dibuat Oleh", "Tanggal", "Status"].map(
        (heading) => (
          <span
            key={heading}
            className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {heading}
          </span>
        ),
      )}
      <span />
    </div>
  );
}

interface TemplateTableBodyProps {
  canCreate: boolean;
  loading: boolean;
  search: string;
  templates: ContractTemplate[];
  permissions: TemplatePermission;
  onCreate: () => void;
  onDelete: (template: ContractTemplate) => void;
  onDownloadPdf: (template: ContractTemplate) => void;
  onEdit: (template: ContractTemplate) => void;
  onToggleStatus: (template: ContractTemplate) => void;
}

function TemplateTableBody({
  canCreate,
  loading,
  search,
  templates,
  permissions,
  onCreate,
  onDelete,
  onDownloadPdf,
  onEdit,
  onToggleStatus,
}: TemplateTableBodyProps) {
  if (loading) {
    return <TemplateTableSkeleton />;
  }

  if (templates.length === 0) {
    return (
      <TemplateEmptyState
        canCreate={canCreate}
        hasSearch={Boolean(search)}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className="divide-y">
      {templates.map((template) => (
        <TemplateTableRow
          key={template.id}
          template={template}
          permissions={permissions}
          onDelete={onDelete}
          onDownloadPdf={onDownloadPdf}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}

function TemplateTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <div
          key={index}
          className={`grid ${TABLE_COLUMNS} items-center px-6 py-4`}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
          {Array.from({ length: 3 }).map((_, cellIndex) => (
            <div
              key={cellIndex}
              className="h-3 w-20 animate-pulse rounded bg-muted"
            />
          ))}
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
          <div />
        </div>
      ))}
    </div>
  );
}

interface TemplateEmptyStateProps {
  canCreate: boolean;
  hasSearch: boolean;
  onCreate: () => void;
}

function TemplateEmptyState({
  canCreate,
  hasSearch,
  onCreate,
}: TemplateEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
      <Tag className="h-8 w-8 opacity-30" />
      <p className="text-sm">
        {hasSearch ? "Tidak ada template yang cocok" : "Belum ada template"}
      </p>
      {!hasSearch && canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 transition-colors hover:text-emerald-700">
          <Plus className="h-3.5 w-3.5" />
          Tambah template pertama
        </button>
      )}
    </div>
  );
}

interface TemplateTableRowProps {
  permissions: TemplatePermission;
  template: ContractTemplate;
  onDelete: (template: ContractTemplate) => void;
  onDownloadPdf: (template: ContractTemplate) => void;
  onEdit: (template: ContractTemplate) => void;
  onToggleStatus: (template: ContractTemplate) => void;
}

function TemplateTableRow({
  permissions,
  template,
  onDelete,
  onDownloadPdf,
  onEdit,
  onToggleStatus,
}: TemplateTableRowProps) {
  return (
    <div
      className={`grid ${TABLE_COLUMNS} items-center px-6 py-4 transition-colors hover:bg-muted/30`}>
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 rounded-md bg-blue-50 p-1.5 text-blue-600">
          <FileText className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium leading-tight">
          {template.name}
        </span>
      </div>
      <span className="text-center text-sm text-muted-foreground">
        {template.category}
      </span>
      <span className="text-center text-sm text-muted-foreground">
        {template.createdBy}
      </span>
      <span className="text-center text-sm text-muted-foreground">
        {template.createdAt}
      </span>
      <span className="text-center text-sm text-muted-foreground">
        <StatusBadge status={template.status} />
      </span>
      <RowMenu
        template={template}
        permissions={permissions}
        onDelete={onDelete}
        onDownloadPdf={onDownloadPdf}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    </div>
  );
}

export default function ContractTemplatePage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const templatePermissions = useMemo(
    () => getTemplatePermissions(permissions),
    [permissions],
  );
  const { templates, loading, error, deleteTemplate, toggleTemplateStatus } =
    useTemplates();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const visibleTemplates = useMemo(
    () =>
      templatePermissions.canManageTemplate
        ? templates
        : templates.filter((template) => template.is_active),
    [templatePermissions.canManageTemplate, templates],
  );
  const filteredTemplates = useMemo(
    () => filterTemplates(visibleTemplates, search),
    [search, visibleTemplates],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const paginatedTemplates = filteredTemplates.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const goToCreateTemplate = () => navigate(TEMPLATE_CREATE_PATH);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async (template: ContractTemplate) => {
    try {
      const response = await downloadTemplatePdf(template.id);
      downloadBlobResponse(response, `${template.name || "template"}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF template:", error);
      alert(await getDownloadErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Manajemen Template Kontrak
        </h2>
        <p className="text-muted-foreground">
          Kelola template kontrak untuk mempercepat pembuatan kontrak baru
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <TemplateToolbar
          canCreate={templatePermissions.canCreate}
          search={search}
          onCreate={goToCreateTemplate}
          onSearchChange={handleSearchChange}
        />
        <TemplateTableHeader />
        <TemplateTableBody
          canCreate={templatePermissions.canCreate}
          loading={loading}
          permissions={templatePermissions}
          search={search}
          templates={paginatedTemplates}
          onCreate={goToCreateTemplate}
          onDelete={setDeleteTarget}
          onDownloadPdf={handleDownloadPdf}
          onEdit={(template) =>
            navigate(`/contracts-templates/${template.id}/edit`)
          }
          onToggleStatus={(template) => toggleTemplateStatus(template.id)}
        />
        {!loading && paginatedTemplates.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          title="Hapus Template"
          itemName={deleteTarget.name}
          isLoading={deleting}
          onClose={() => !deleting && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
