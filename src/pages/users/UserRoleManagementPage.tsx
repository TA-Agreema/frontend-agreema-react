import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import PermissionGuard from "@/middlewares/PermissionGuard";
import { usePermissions } from "@/contexts/PermissionContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const userFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  job_title: z.string().min(1, "Jabatan wajib diisi"),
  department: z.string().min(1, "Departemen wajib diisi"),
  is_active: z.number().min(0).max(1),
});
type UserFormValues = z.infer<typeof userFormSchema>;

const roleFormSchema = z.object({
  name: z.string().min(1, "Nama role wajib diisi"),
});
type RoleFormValues = z.infer<typeof roleFormSchema>;

function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error("Gagal mengambil data roles:", error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const handleAddUser = () => {
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      job_title: user.job_title,
      department: user.department || "",
      is_active: user.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus user");
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
      } else {
        if (!data.password) {
          alert("Password wajib diisi");
          setIsSubmitting(false);
          return;
        }
        await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          job_title: data.job_title,
          department: data.department,
          is_active: data.is_active,
          roles: selectedRoles,
        });
      }
      await loadUsers();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daftar Pengguna</h2>
          <p className="text-muted-foreground mt-1">
            Kelola pengguna dan akses mereka
          </p>
        </div>
        <PermissionGuard permissions={["create.user"]}>
          <Button onClick={handleAddUser}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </PermissionGuard>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.job_title}</TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {hasPermission("update.user") && (
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}>
                            Edit
                          </DropdownMenuItem>
                        )}
                        {hasPermission("delete.user") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}>
                              Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
    </div>
  );
}

function RolesList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { hasPermission } = usePermissions();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "" },
  });

  const loadRoles = async () => {
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error("Gagal mengambil data role:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await fetchPermissions();
      setPermissions(data);
    } catch (error) {
      console.error("Gagal mengambil data permissions:", error);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const handleAddRole = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const handleEditRole = async (role: Role) => {
    try {
      const detailRole = await fetchRoleDetail(role.id);
      setEditingRole(detailRole);
      const permissionNames = Array.isArray(detailRole.permissions)
        ? (detailRole.permissions as string[])
        : [];
      setSelectedPermissions(permissionNames);
      form.reset({ name: detailRole.name });
      setIsDialogOpen(true);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil detail role");
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus role ini?")) return;
    try {
      await deleteRole(roleId);
      await loadRoles();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus role");
    }
  };

  const onSubmit = async (data: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: data.name,
          permissions: selectedPermissions,
        });
      } else {
        await createRole({ name: data.name, permissions: selectedPermissions });
      }
      await loadRoles();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName],
    );
  };

  const getPermissionDisplay = (role: Role): string => {
    if (!role.permissions) return "-";
    if (Array.isArray(role.permissions)) {
      if (role.permissions.length === 0) return "-";
      if (typeof role.permissions[0] === "string")
        return (role.permissions as string[]).join(", ");
      return (role.permissions as Permission[]).map((p) => p.name).join(", ");
    }
    return "-";
  };

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const [category] = permission.name.split(".");
      if (!acc[category]) acc[category] = [];
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daftar Role</h2>
          <p className="text-muted-foreground mt-1">
            Kelola role dan izin aksesnya
          </p>
        </div>
        <PermissionGuard permissions={["create.role"]}>
          <Button onClick={handleAddRole}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Role
          </Button>
        </PermissionGuard>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Tidak ada role tersedia.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-wrap gap-1">
                      {getPermissionDisplay(role)
                        .split(", ")
                        .map((perm, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            {perm}
                          </span>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {hasPermission("update.role") && (
                          <DropdownMenuItem
                            onClick={() => handleEditRole(role)}>
                            Edit Role
                          </DropdownMenuItem>
                        )}
                        {hasPermission("delete.role") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteRole(role.id)}>
                              Hapus Role
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
    </div>
  );
}

export default function UserRoleManagementPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  return (
    <PermissionGuard fallback={<Navigate to="/unauthorized" replace />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manajemen User & Role</h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengguna, role, dan izin akses dalam sistem
          </p>
        </div>
        <div className="border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "users" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Daftar Pengguna
              {activeTab === "users" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-lg" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "roles" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Role & Permission
              {activeTab === "roles" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-lg" />
              )}
            </button>
          </div>
        </div>
        <div className="pt-2">
          {activeTab === "users" ? <UsersList /> : <RolesList />}
        </div>
      </div>
    </PermissionGuard>
  );
}
