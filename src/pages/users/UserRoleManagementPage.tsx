import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PermissionGuard from "@/middlewares/PermissionGuard";
import { usePermissions } from "@/contexts/PermissionContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import {
  Users,
  Shield,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  UserCircle2,
} from "lucide-react";

import {
  fetchUsers,
  deleteUser,
  createUser,
  updateUser,
} from "@/services/user.service";
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  fetchRoleDetail,
} from "@/services/roles.service";

import type { User } from "@/types/users";
import type { Role, Permission } from "@/types/roles";

import UserFormDialog from "./UsersFormDialog";
import RoleFormDialog from "./RolesFormDialog";
import DeleteModal from "@/components/modal/common/DeleteModal";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";

//  Schemas

const STRONG_PASSWORD_MESSAGE =
  "Password minimal 8 karakter dan harus berisi huruf besar, huruf kecil, angka, serta simbol";
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const userFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || STRONG_PASSWORD_REGEX.test(value),
      STRONG_PASSWORD_MESSAGE,
    ),
  job_title: z.string().min(1, "Jabatan wajib diisi"),
  department: z.string().min(1, "Departemen wajib diisi"),
  is_active: z.number().min(0).max(1),
});
type UserFormValues = z.infer<typeof userFormSchema>;

const roleFormSchema = z.object({
  name: z.string().min(1, "Nama role wajib diisi"),
  description: z.string().optional().or(z.literal("")),
});
type RoleFormValues = z.infer<typeof roleFormSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function ActionMenu({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Hapus",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasEdit = Boolean(onEdit);
  const hasDelete = Boolean(onDelete);
  if (!hasEdit && !hasDelete) return null;

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 rounded-lg border bg-white shadow-lg z-20 overflow-hidden py-1">
            {hasEdit && (
              <button
                onClick={() => {
                  onEdit!();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Pencil className="h-3.5 w-3.5 text-gray-400" /> {editLabel}
              </button>
            )}
            {hasEdit && hasDelete && <hr className="my-1 border-gray-100" />}
            {hasDelete && (
              <button
                onClick={() => {
                  onDelete!();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> {deleteLabel}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div
                className="h-3 rounded bg-gray-100 animate-pulse"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Users List ───────────────────────────────────────────────────────────────

function UsersList({ totalUsers }: { totalUsers: (n: number) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    userId: number | null;
    userName: string;
  }>({
    open: false,
    userId: null,
    userName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = usePermissions();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      job_title: "",
      department: "",
      is_active: 1,
    },
  });

  const loadData = useCallback(async () => {
    try {
      const [userData, roleData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ]);
      setUsers(userData);
      setRoles(roleData);
      totalUsers(userData.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [totalUsers]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

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

  const handleAdd = () => {
    setEditingUser(null);
    setSelectedRoles([]);
    form.reset({
      name: "",
      email: "",
      password: "",
      job_title: "",
      department: "",
      is_active: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRoles(user.roles ?? []);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      job_title: user.job_title,
      department: user.department ?? "",
      is_active: user.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, userName: string) => {
    setDeleteModal({ open: true, userId: id, userName });
  };

  const confirmDelete = async () => {
    if (deleteModal.userId === null) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteModal.userId);
      await loadData();
      setDeleteModal({ open: false, userId: null, userName: "" });
      toast.success("User dihapus", {
        description: `${deleteModal.userName} berhasil dihapus.`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: data.name,
          job_title: data.job_title,
          department: data.department,
          is_active: data.is_active,
        });
        toast.success("User diperbarui", {
          description: `${data.name} berhasil diperbarui.`,
        });
      } else {
        if (!data.password) {
          toast.error("Password wajib diisi");
          return;
        }

        const normalizedEmail = data.email.trim().toLowerCase();
        const emailAlreadyExists = users.some(
          (user) => user.email.trim().toLowerCase() === normalizedEmail,
        );

        if (emailAlreadyExists) {
          form.setError("email", {
            type: "validate",
            message: "Email sudah digunakan oleh pengguna lain",
          });
          toast.error("Email sudah digunakan");
          return;
        }

        await createUser({
          name: data.name,
          email: normalizedEmail,
          password: data.password,
          job_title: data.job_title,
          department: data.department,
          is_active: data.is_active,
          roles: selectedRoles,
        });
        toast.success("User dibuat", {
          description: `${data.name} berhasil ditambahkan.`,
        });
      }
      await loadData();
      setIsDialogOpen(false);
      form.reset();
    } catch (error: unknown) {
      console.error(error);

      if (isAxiosError(error) && error.response?.status === 422) {
        const emailError = error.response.data?.errors?.email?.[0];
        if (emailError) {
          form.setError("email", {
            type: "server",
            message: emailError,
          });
          toast.error("Email sudah digunakan");
          return;
        }
      }

      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(editingUser ? "Gagal memperbarui user" : "Gagal membuat user", {
        description: message ?? "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (r: string) =>
    setSelectedRoles((p) =>
      p.includes(r) ? p.filter((x) => x !== r) : [...p, r],
    );

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari user..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
          />
        </div>
        <PermissionGuard permissions={["create.user"]}>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shrink-0 shadow-sm">
            <Plus className="h-4 w-4" /> Tambah User
          </button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/60">
            {["USER", "EMAIL", "ROLE", "DEPARTEMEN", "STATUS", ""].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <TableSkeleton cols={6} />
          ) : paginated.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-12 text-center text-sm text-gray-400">
                {search
                  ? "Tidak ada pengguna yang cocok"
                  : "Belum ada pengguna"}
              </td>
            </tr>
          ) : (
            paginated.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/60 transition-colors">
                {/* USER */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <UserCircle2 className="h-5 w-5 text-emerald-600 stroke-[1.5]" />
                    </div>
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                  </div>
                </td>
                {/* EMAIL */}
                <td className="px-4 py-4 text-gray-500">{user.email}</td>
                {/* ROLE */}
                <td className="px-4 py-4">
                  {(user.roles ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(user.roles as string[]).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                {/* DEPARTEMEN */}
                <td className="px-4 py-4 text-gray-500">
                  {user.department || "—"}
                </td>
                {/* STATUS */}
                <td className="px-4 py-4">
                  <StatusBadge active={Boolean(user.is_active)} />
                </td>
                {/* ACTIONS */}
                <td className="px-4 py-4 w-12">
                  <ActionMenu
                    onEdit={
                      hasPermission("update.user")
                        ? () => handleEdit(user)
                        : undefined
                    }
                    onDelete={
                      hasPermission("delete.user")
                        ? () => handleDelete(user.id, user.name)
                        : undefined
                    }
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        form={form}
        roles={roles}
        selectedRoles={selectedRoles}
        onToggleRole={toggleRole}
        editingUser={editingUser}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />

      {deleteModal.open && (
        <DeleteModal
          title="Hapus User"
          itemName={deleteModal.userName}
          onClose={() =>
            setDeleteModal({ open: false, userId: null, userName: "" })
          }
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

// ─── Roles List ───────────────────────────────────────────────────────────────

function RolesList({ totalRoles }: { totalRoles: (n: number) => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    roleId: null as number | null,
    roleName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = usePermissions();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const loadData = useCallback(async () => {
    try {
      const [roleData, permData] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
      ]);
      setRoles(roleData);
      setPermissions(permData);
      totalRoles(roleData.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [totalRoles]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [roles, search]);

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

  const handleAdd = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    form.reset({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = async (role: Role) => {
    try {
      const detail = await fetchRoleDetail(role.id);
      setEditingRole(detail);
      const perms = Array.isArray(detail.permissions)
        ? (detail.permissions as string[])
        : [];
      setSelectedPermissions(perms);
      form.reset({ name: detail.name, description: detail.description ?? "" });
      setIsDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengambil detail role");
    }
  };

  const handleDelete = (id: number, roleName: string) => {
    setDeleteModal({ open: true, roleId: id, roleName });
  };

  const confirmDelete = async () => {
    if (deleteModal.roleId === null) return;
    setIsDeleting(true);
    try {
      await deleteRole(deleteModal.roleId);
      await loadData();
      setDeleteModal({ open: false, roleId: null, roleName: "" });
      toast.success("Role dihapus", {
        description: `Role "${deleteModal.roleName}" berhasil dihapus.`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus role");
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: data.name,
          description: data.description,
          permissions: selectedPermissions,
        });
        toast.success("Role diperbarui", {
          description: `Role "${data.name}" berhasil diperbarui.`,
        });
      } else {
        await createRole({
          name: data.name,
          description: data.description,
          permissions: selectedPermissions,
        });
        toast.success("Role dibuat", {
          description: `Role "${data.name}" berhasil dibuat.`,
        });
      }
      await loadData();
      setIsDialogOpen(false);
      form.reset();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan role", {
        description: "Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (p: string) =>
    setSelectedPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const groupedPermissions = permissions.reduce(
    (acc, p) => {
      const [cat] = p.name.split(".");
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const getPermCount = (role: Role): number => {
    if (!role.permissions) return 0;
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  };

  const getUserCount = (role: Role): number => role.users_count ?? 0;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Role tidak dapat dihapus jika masih digunakan oleh user.
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari role..."
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <PermissionGuard permissions={["create.role"]}>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shrink-0 shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Role
            </button>
          </PermissionGuard>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60">
              {[
                "ROLE",
                "DESKRIPSI",
                "JUMLAH USER",
                "PERMISSION",
                "STATUS",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={6} />
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-gray-400">
                  {search ? "Tidak ada role yang cocok" : "Belum ada role"}
                </td>
              </tr>
            ) : (
              paginated.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50/60 transition-colors">
                  {/* ROLE */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                      </div>
                      <span className="font-semibold text-gray-900">
                        {role.name}
                      </span>
                    </div>
                  </td>
                  {/* DESKRIPSI */}
                  <td className="px-4 py-4 text-gray-500 max-w-[200px]">
                    <p className="line-clamp-2">
                      {role.description || (
                        <span className="italic opacity-50">
                          Deskripsi role
                        </span>
                      )}
                    </p>
                  </td>
                  {/* JUMLAH USER */}
                  <td className="px-4 py-4 text-gray-700 font-medium">
                    {getUserCount(role)}
                  </td>
                  {/* PERMISSION */}
                  <td className="px-4 py-4 text-gray-700 font-medium">
                    {getPermCount(role)}
                  </td>
                  {/* STATUS */}
                  <td className="px-4 py-4">
                    <StatusBadge active={role.is_active ?? true} />
                  </td>
                  {/* ACTIONS */}
                  <td className="px-4 py-4 w-12">
                    <ActionMenu
                      onEdit={
                        hasPermission("update.role")
                          ? () => handleEdit(role)
                          : undefined
                      }
                      onDelete={
                        hasPermission("delete.role") && getUserCount(role) === 0
                          ? () => handleDelete(role.id, role.name)
                          : undefined
                      }
                      editLabel="Edit"
                      deleteLabel="Hapus"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />

        <RoleFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          form={form}
          permissions={permissions}
          groupedPermissions={groupedPermissions}
          selectedPermissions={selectedPermissions}
          onTogglePermission={togglePermission}
          editingRole={editingRole}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />

        {deleteModal.open && (
          <DeleteModal
            title="Hapus Role"
            itemName={deleteModal.roleName}
            onClose={() =>
              setDeleteModal({ open: false, roleId: null, roleName: "" })
            }
            onConfirm={confirmDelete}
            isLoading={isDeleting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserRoleManagementPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [userCount, setUserCount] = useState<number>(0);
  const [roleCount, setRoleCount] = useState<number>(0);

  return (
    <PermissionGuard fallback={<Navigate to="/unauthorized" replace />}>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Manajemen User &amp; Role
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pengguna dan hak akses dalam sistem
          </p>
        </div>

        {/* ── Pill Tab Switcher ─────────────────────────────────────── */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              activeTab === "users"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <Users className="h-4 w-4" />
            User
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === "users"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-500"
              }`}>
              {userCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              activeTab === "roles"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <Shield className="h-4 w-4" />
            Role
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === "roles"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-500"
              }`}>
              {roleCount}
            </span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "users" ? (
          <UsersList totalUsers={setUserCount} />
        ) : (
          <RolesList totalRoles={setRoleCount} />
        )}
      </div>
    </PermissionGuard>
  );
}
