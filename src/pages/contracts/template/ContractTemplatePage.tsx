import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  Tag,
  ToggleLeft,
} from "lucide-react";
import { useTemplates, type ContractTemplate } from "@/hooks/use-template";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import DeleteModal from "@/components/modal/DeleteModal";
import StatusBadge from "@/components/ui/status-badge";

const PAGE_SIZE = 4;

// Row Action Menu

function RowMenu({
  template,
  onEdit,
  onDelete,
  onDownload,
  onToggleStatus,
  canEdit = false,
  canDelete = false,
}: {
  template: ContractTemplate;
  onEdit: (t: ContractTemplate) => void;
  onDelete: (t: ContractTemplate) => void;
  onDownload: (t: ContractTemplate) => void;
  onToggleStatus: (t: ContractTemplate) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hitung posisi setiap kali menu dibuka
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // Estimasi tinggi menu: 4 item (~36px each) + dividers
    const estimatedMenuH = 36 * 4 + 8;
    const spaceBelow = viewportHeight - rect.bottom;

    setDropUp(spaceBelow < estimatedMenuH + 12);
  }, [open]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Tutup saat parent di-scroll
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`
            absolute right-0 w-44 rounded-lg border bg-card shadow-xl
            z-50 overflow-hidden py-1
            ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}
          `}>
          <button
            onClick={() => {
              onEdit(template);
              setOpen(false);
            }}
            disabled={!canEdit}
            title={
              !canEdit
                ? "Anda tidak memiliki izin untuk mengedit template"
                : undefined
            }
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
              canEdit
                ? "hover:bg-muted"
                : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Edit
          </button>

          <button
            onClick={() => {
              onToggleStatus(template);
              setOpen(false);
            }}
            disabled={!canEdit}
            title={
              !canEdit
                ? "Anda tidak memiliki izin untuk mengubah status template"
                : undefined
            }
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
              canEdit
                ? "hover:bg-muted"
                : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            {template.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
          </button>

          <button
            onClick={() => {
              onDownload(template);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4 text-muted-foreground" />
            Download PDF
          </button>

          <hr className="my-1 border-border" />

          <button
            onClick={() => {
              onDelete(template);
              setOpen(false);
            }}
            disabled={!canDelete}
            title={
              !canDelete
                ? "Anda tidak memiliki izin untuk menghapus template"
                : undefined
            }
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
              canDelete
                ? "text-red-600 hover:bg-red-50"
                : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}>
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContractTemplatePage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canEdit = permissions.includes("update.template");
  const canDelete = permissions.includes("delete.template");
  const canCreate = permissions.includes("create.template");

  const {
    templates,
    loading,
    error,
    deleteTemplate,
    downloadPdf,
    toggleTemplateStatus,
  } = useTemplates();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari template..."
              className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
          {canCreate && (
            <button
              onClick={() => navigate("/contracts-templates/new")}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shrink-0">
              <Plus className="h-4 w-4" />
              Tambah Template
            </button>
          )}
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_48px] px-6 py-3 border-b bg-muted/30">
          {["Nama", "Kategori", "Dibuat Oleh", "Tanggal", "Status"].map((h) => (
            <span
              key={h}
              className="text-xs text-center font-medium text-muted-foreground uppercase tracking-wide">
              {h}
            </span>
          ))}
          <span />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_48px] px-6 py-4 items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-muted animate-pulse" />
                  <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                </div>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 w-20 rounded bg-muted animate-pulse"
                  />
                ))}
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                <div />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Tag className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {search ? "Tidak ada template yang cocok" : "Belum ada template"}
            </p>
            {!search && canCreate && (
              <button
                onClick={() => navigate("/contracts-templates/new")}
                className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Tambah template pertama
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && paginated.length > 0 && (
          <>
            <div className="divide-y">
              {paginated.map((template) => (
                <div
                  key={template.id}
                  className="grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr_48px] px-6 py-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium leading-tight">
                      {template.name}
                    </span>
                  </div>
                  <span className="text-sm text-center text-muted-foreground">
                    {template.category}
                  </span>
                  <span className="text-sm text-center text-muted-foreground">
                    {template.createdBy}
                  </span>
                  <span className="text-sm text-center text-muted-foreground">
                    {template.createdAt}
                  </span>
                  <span className="text-sm text-center text-muted-foreground">
                    <StatusBadge status={template.status} />
                  </span>
                  <RowMenu
                    template={template}
                    onEdit={(t) =>
                      navigate(`/contracts-templates/${t.id}/edit`)
                    }
                    onDelete={(t) => setDeleteTarget(t)}
                    onDownload={(t) => downloadPdf(t.id)}
                    onToggleStatus={(t) => toggleTemplateStatus(t.id)}
                  />
                </div>
              ))}
            </div>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
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
