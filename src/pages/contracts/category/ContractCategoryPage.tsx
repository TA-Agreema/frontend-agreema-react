import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  AlertCircle,
  MoreVertical,
  Pencil,
  ToggleLeft,
  Trash2,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import PermissionGuard from "@/middlewares/PermissionGuard";
import { Navigate } from "react-router-dom";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  toggleCategoryStatus,
  updateCategory,
} from "@/services/category.service";
import type { Category } from "@/types/category";
import CategoryFormModal from "@/components/modal/template/CategoryFormModal";
import DeleteModal from "@/components/modal/common/DeleteModal";
import StatusBadge from "@/components/ui/status-badge";
import { toast } from "sonner";

const PAGE_SIZE = 4;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
};

//  Status Badge

//  Action Menu

interface CategoryActionMenuProps {
  category: Category;
  onEdit: (c: Category) => void;
  onToggleStatus: (c: Category) => void;
  onDelete: (c: Category) => void;
  disabled?: boolean;
}

function CategoryActionMenu({
  category,
  onEdit,
  onToggleStatus,
  onDelete,
  disabled = false,
}: CategoryActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canDelete = category.templates_count === 0;
  const canToggleStatus = category.templates_count === 0;

  //  Hitung posisi setiap kali menu dibuka
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // Estimasi tinggi menu: header (py-1) + 3 item (py-2 each ~36px) + divider
    const estimatedMenuH = 36 * 3 + 8 + 2;
    const spaceBelow = viewportHeight - rect.bottom;

    setDropUp(spaceBelow < estimatedMenuH + 12);
  }, [open]);

  //  Tutup saat klik di luar (lebih reliable daripada overlay div)
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

  //  Tutup saat parent di-scroll
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    // capture:true agar tertangkap di semua scroll container
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`
            absolute right-0 w-48 rounded-lg border bg-card shadow-xl
            z-50 overflow-hidden py-1
            ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}
          `}>
          {/* Edit */}
          <button
            onClick={() => {
              onEdit(category);
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Edit Kategori
          </button>

          {/* Toggle status */}
          <button
            onClick={() => {
              onToggleStatus(category);
              setOpen(false);
            }}
            disabled={!canToggleStatus}
            title={
              !canToggleStatus
                ? "Tidak dapat dinonaktifkan karena memiliki kontrak aktif"
                : undefined
            }
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
              canToggleStatus
                ? "hover:bg-muted"
                : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            {category.is_active ? "Nonaktifkan" : "Aktifkan"}
          </button>

          <hr className="my-1 border-border" />

          {/* Hapus */}
          <button
            onClick={() => {
              if (!canDelete) return;
              onDelete(category);
              setOpen(false);
            }}
            disabled={!canDelete}
            title={
              !canDelete
                ? "Tidak dapat dihapus karena memiliki template aktif"
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

//  Main Page

export default function ContractCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  //  Data fetching

  const loadCategories = async () => {
    try {
      setErrorMessage(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Gagal mengambil data kategori kontrak"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  //  Filtering & pagination

  const filtered = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  //  Handlers

  const handleSubmitCategory = async (data: {
    name: string;
    description: string;
  }) => {
    try {
      setIsSubmitting(true);
      const payload = {
        name: data.name,
        description: data.description || null,
      };

      if (editTarget) {
        await updateCategory(editTarget.id, payload);
        setEditTarget(null);
        toast.success("Kategori diperbarui", {
          description: `"Kategori {data.name} berhasil diperbarui.`,
        });
      } else {
        await createCategory(payload);
        setAddOpen(false);
        toast.success("Kategori dibuat", {
          description: `Kategori ${data.name} berhasil dibuat.`,
        });
      }
      await loadCategories();
    } catch (error) {
      toast.error("Gagal menyimpan kategori", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      setIsSubmitting(true);
      const updated = await toggleCategoryStatus(category.id);
      await loadCategories();
      toast.success(
        updated.is_active ? "Kategori diaktifkan" : "Kategori dinonaktifkan",
        {
          description: updated.is_active
            ? `Kategori ${category.name} kini aktif.`
            : `Kategori ${category.name} telah dinonaktifkan.`,
        }
      );
    } catch (error) {
      toast.error("Gagal mengubah status kategori", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      await deleteCategory(deleteTarget.id);
      const name = deleteTarget.name;
      setDeleteTarget(null);
      await loadCategories();
      toast.success("Kategori dihapus", {
        description: `Kategori ${name} berhasil dihapus.`,
      });
    } catch (error) {
    toast.error("Gagal menghapus kategori", {
      description: getApiErrorMessage(error, "Silakan coba lagi."),
    });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render

  return (
    <PermissionGuard
      roles={["admin"]}
      fallback={<Navigate to="/unauthorized" replace />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Manajemen Kategori Kontrak
          </h2>
          <p className="text-muted-foreground">
            Kelola kategori dan tipe kontrak dalam sistem
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Kategori yang memiliki kontrak aktif tidak dapat dihapus maupun
          dinonaktifkan.
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Table card */}
        <div className="rounded-xl border bg-card shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              onClick={() => setAddOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shrink-0 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_48px] px-5 py-3 border-b bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Kategori
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Deskripsi
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
              Jumlah Kontrak
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
              Status
            </span>
            <span />
          </div>

          {/* Body */}
          {isLoading ? (
            /* Loading skeleton */
            <div className="divide-y">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_48px] px-6 py-5 items-center gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-6 rounded bg-muted animate-pulse mx-auto" />
                  <div className="h-5 w-14 rounded-full bg-muted animate-pulse mx-auto" />
                  <div />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Tag className="h-8 w-8 opacity-30" />
              <p className="text-sm">Tidak ada kategori ditemukan</p>
            </div>
          ) : (
            /* Rows */
            <div className="divide-y">
              {paginated.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_48px] px-6 py-5 items-center hover:bg-muted/30 transition-colors">
                  {/* Name */}
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
                      <Tag className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground max-w-[420px] line-clamp-2 pr-4">
                    {category.description ?? (
                      <span className="italic opacity-50">
                        Tidak ada deskripsi
                      </span>
                    )}
                  </p>

                  {/* Contract count */}
                  <span className="text-sm text-center">
                    {category.templates_count}
                  </span>

                  {/* Status */}
                  <div className="flex justify-center">
                    <StatusBadge isActive={category.is_active} />
                  </div>

                  {/* Actions */}
                  <CategoryActionMenu
                    category={category}
                    onEdit={(c) => setEditTarget(c)}
                    onToggleStatus={handleToggleStatus}
                    onDelete={(c) => setDeleteTarget(c)}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>

        {/* Modals */}
        {addOpen && (
          <CategoryFormModal
            mode="add"
            onClose={() => setAddOpen(false)}
            onSubmit={handleSubmitCategory}
            submitting={isSubmitting}
          />
        )}
        {editTarget && (
          <CategoryFormModal
            mode="edit"
            initial={editTarget}
            onClose={() => setEditTarget(null)}
            onSubmit={handleSubmitCategory}
            submitting={isSubmitting}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            title="Hapus Kategori"
            itemName={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
