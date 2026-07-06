import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tag,
  ToggleLeft,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import DeleteModal from "@/components/modal/common/DeleteModal";
import CategoryFormModal from "@/components/modal/template/CategoryFormModal";
import StatusBadge from "@/components/ui/status-badge";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  toggleCategoryStatus,
  updateCategory,
} from "@/services/category.service";
import type { Category, CategoryPayload } from "@/types/category";

const PAGE_SIZE = 10;
const TABLE_COLUMNS = "grid-cols-[2fr_3fr_1.5fr_1.5fr_48px]";
const EMPTY_DESCRIPTION = "Tidak ada deskripsi";

type CategoryFormValues = {
  name: string;
  description: string;
};

type ModalState =
  | { type: "create" }
  | { type: "edit"; category: Category }
  | { type: "delete"; category: Category }
  | null;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
};

const buildCategoryPayload = (values: CategoryFormValues): CategoryPayload => ({
  name: values.name,
  description: values.description || null,
});

const filterCategories = (categories: Category[], keyword: string) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return categories;
  }

  return categories.filter((category) => {
    const name = category.name.toLowerCase();
    const description = category.description?.toLowerCase() ?? "";

    return (
      name.includes(normalizedKeyword) ||
      description.includes(normalizedKeyword)
    );
  });
};

function useContractCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategories();
    });
  }, [loadCategories]);

  const saveCategory = async (
    values: CategoryFormValues,
    editTarget?: Category,
  ) => {
    try {
      setIsSubmitting(true);
      const payload = buildCategoryPayload(values);

      if (editTarget) {
        await updateCategory(editTarget.id, payload);
        toast.success("Kategori diperbarui", {
          description: `Kategori ${values.name} berhasil diperbarui.`,
        });
      } else {
        await createCategory(payload);
        toast.success("Kategori dibuat", {
          description: `Kategori ${values.name} berhasil dibuat.`,
        });
      }

      await loadCategories();
      return true;
    } catch (error) {
      toast.error("Gagal menyimpan kategori", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (category: Category) => {
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
        },
      );
    } catch (error) {
      toast.error("Gagal mengubah status kategori", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeCategory = async (category: Category) => {
    try {
      setIsSubmitting(true);
      await deleteCategory(category.id);
      await loadCategories();
      toast.success("Kategori dihapus", {
        description: `Kategori ${category.name} berhasil dihapus.`,
      });
      return true;
    } catch (error) {
      toast.error("Gagal menghapus kategori", {
        description: getApiErrorMessage(error, "Silakan coba lagi."),
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    categories,
    errorMessage,
    isLoading,
    isSubmitting,
    removeCategory,
    saveCategory,
    toggleStatus,
  };
}

interface CategoryActionMenuProps {
  category: Category;
  disabled?: boolean;
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
}

function CategoryActionMenu({
  category,
  disabled = false,
  onDelete,
  onEdit,
  onToggleStatus,
}: CategoryActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canMutateAvailability = category.templates_count === 0;

  useEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const estimatedMenuHeight = 118;
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
        disabled={disabled}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute right-0 z-50 w-48 overflow-hidden rounded-lg border bg-card py-1 shadow-xl ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}>
          <ActionMenuButton
            icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
            label="Edit Kategori"
            onClick={() => {
              onEdit(category);
              setOpen(false);
            }}
          />
          <ActionMenuButton
            icon={<ToggleLeft className="h-4 w-4 text-muted-foreground" />}
            label={category.is_active ? "Nonaktifkan" : "Aktifkan"}
            disabled={!canMutateAvailability}
            title={
              !canMutateAvailability
                ? "Tidak dapat dinonaktifkan karena memiliki template aktif"
                : undefined
            }
            onClick={() => {
              onToggleStatus(category);
              setOpen(false);
            }}
          />
          <hr className="my-1 border-border" />
          <ActionMenuButton
            danger
            icon={<Trash2 className="h-4 w-4" />}
            label="Hapus"
            disabled={!canMutateAvailability}
            title={
              !canMutateAvailability
                ? "Tidak dapat dihapus karena memiliki template aktif"
                : undefined
            }
            onClick={() => {
              onDelete(category);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ActionMenuButtonProps {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

function ActionMenuButton({
  danger = false,
  disabled = false,
  icon,
  label,
  title,
  onClick,
}: ActionMenuButtonProps) {
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

interface CategoryToolbarProps {
  search: string;
  disabled?: boolean;
  onAdd: () => void;
  onSearchChange: (value: string) => void;
}

function CategoryToolbar({
  search,
  disabled = false,
  onAdd,
  onSearchChange,
}: CategoryToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari kategori..."
          className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="flex shrink-0 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
        <Plus className="h-4 w-4" />
        Tambah Kategori
      </button>
    </div>
  );
}

function CategoryTableHeader() {
  return (
    <div className={`grid ${TABLE_COLUMNS} border-b bg-muted/30 px-5 py-3`}>
      <TableHeading>Kategori</TableHeading>
      <TableHeading>Deskripsi</TableHeading>
      <TableHeading centered>Jumlah Kontrak</TableHeading>
      <TableHeading centered>Status</TableHeading>
      <span />
    </div>
  );
}

interface TableHeadingProps {
  children: ReactNode;
  centered?: boolean;
}

function TableHeading({ centered = false, children }: TableHeadingProps) {
  return (
    <span
      className={`text-xs font-medium uppercase tracking-wide text-muted-foreground ${
        centered ? "text-center" : ""
      }`}>
      {children}
    </span>
  );
}

interface CategoryTableBodyProps {
  categories: Category[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
}

function CategoryTableBody({
  categories,
  isLoading,
  isSubmitting,
  onDelete,
  onEdit,
  onToggleStatus,
}: CategoryTableBodyProps) {
  if (isLoading) {
    return <CategoryTableSkeleton />;
  }

  if (categories.length === 0) {
    return <CategoryEmptyState />;
  }

  return (
    <div className="divide-y">
      {categories.map((category) => (
        <CategoryTableRow
          key={category.id}
          category={category}
          isSubmitting={isSubmitting}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}

function CategoryTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <div
          key={index}
          className={`grid ${TABLE_COLUMNS} items-center gap-4 px-6 py-5`}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-3 w-6 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-5 w-14 animate-pulse rounded-full bg-muted" />
          <div />
        </div>
      ))}
    </div>
  );
}

function CategoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
      <Tag className="h-8 w-8 opacity-30" />
      <p className="text-sm">Tidak ada kategori ditemukan</p>
    </div>
  );
}

interface CategoryTableRowProps {
  category: Category;
  isSubmitting: boolean;
  onDelete: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
}

function CategoryTableRow({
  category,
  isSubmitting,
  onDelete,
  onEdit,
  onToggleStatus,
}: CategoryTableRowProps) {
  return (
    <div
      className={`grid ${TABLE_COLUMNS} items-center px-6 py-5 transition-colors hover:bg-muted/30`}>
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 rounded-md bg-emerald-50 p-1.5 text-emerald-600">
          <Tag className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{category.name}</span>
      </div>

      <p className="line-clamp-2 max-w-[420px] pr-4 text-sm text-muted-foreground">
        {category.description ?? (
          <span className="italic opacity-50">{EMPTY_DESCRIPTION}</span>
        )}
      </p>

      <span className="text-center text-sm">{category.templates_count}</span>

      <div className="flex justify-center">
        <StatusBadge isActive={category.is_active} />
      </div>

      <CategoryActionMenu
        category={category}
        disabled={isSubmitting}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    </div>
  );
}

export default function ContractCategoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);

  const {
    categories,
    errorMessage,
    isLoading,
    isSubmitting,
    removeCategory,
    saveCategory,
    toggleStatus,
  } = useContractCategories();

  const filteredCategories = useMemo(
    () => filterCategories(categories, search),
    [categories, search],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const paginatedCategories = filteredCategories.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSubmitCategory = async (values: CategoryFormValues) => {
    const saved = await saveCategory(
      values,
      modal?.type === "edit" ? modal.category : undefined,
    );

    if (saved) {
      setModal(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (modal?.type !== "delete") {
      return;
    }

    const deleted = await removeCategory(modal.category);

    if (deleted) {
      setModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Manajemen Kategori Kontrak
        </h2>
        <p className="text-muted-foreground">
          Kelola kategori dan tipe kontrak dalam sistem
        </p>
      </div>

      <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Kategori yang memiliki kontrak aktif tidak dapat dihapus maupun
        dinonaktifkan.
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        <CategoryToolbar
          search={search}
          disabled={isSubmitting}
          onAdd={() => setModal({ type: "create" })}
          onSearchChange={handleSearchChange}
        />
        <CategoryTableHeader />
        <CategoryTableBody
          categories={paginatedCategories}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(category) => setModal({ type: "delete", category })}
          onEdit={(category) => setModal({ type: "edit", category })}
          onToggleStatus={toggleStatus}
        />
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>

      {modal?.type === "create" && (
        <CategoryFormModal
          mode="add"
          onClose={() => setModal(null)}
          onSubmit={handleSubmitCategory}
          submitting={isSubmitting}
        />
      )}

      {modal?.type === "edit" && (
        <CategoryFormModal
          mode="edit"
          initial={modal.category}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitCategory}
          submitting={isSubmitting}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteModal
          title="Hapus Kategori"
          itemName={modal.category.name}
          onClose={() => setModal(null)}
          onConfirm={handleDeleteCategory}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
