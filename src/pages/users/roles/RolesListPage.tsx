import { useState, useEffect } from "react";
import { fetchRoles, fetchPermissions, createRole, updateRole, deleteRole, fetchRoleDetail } from "@/services/roles.service";
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from "@/types/roles";
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { usePermissions } from "@/contexts/PermissionContext";
import PermissionGuard from "@/middlewares/PermissionGuard";
import RoleFormDialog from "./RolesFormDialog"

const roleFormSchema = z.object({
    name: z.string().min(1, "Nama role wajib diisi"),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function RolesListPage() {
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
        defaultValues: {
            name: "",
        },
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

            // Extract permission names from the role
            const permissionNames = Array.isArray(detailRole.permissions)
                ? (detailRole.permissions as string[])
                : [];

            setSelectedPermissions(permissionNames);
            form.reset({ name: detailRole.name });
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Gagal mengambil detail role:", error);
            alert("Gagal mengambil detail role");
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus role ini?")) return;

        try {
            await deleteRole(roleId);
            await loadRoles();
        } catch (error) {
            console.error("Gagal menghapus role:", error);
            alert("Gagal menghapus role");
        }
    };

    const onSubmit = async (data: RoleFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingRole) {
                const updateData: UpdateRoleRequest = {
                    name: data.name,
                    permissions: selectedPermissions,
                };
                await updateRole(editingRole.id, updateData);
            } else {
                const createData: CreateRoleRequest = {
                    name: data.name,
                    permissions: selectedPermissions,
                };
                await createRole(createData);
            }

            await loadRoles();
            setIsDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Gagal menyimpan role:", error);
            alert("Gagal menyimpan role");
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionName)
                ? prev.filter(p => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    const getPermissionDisplay = (role: Role): string => {
        if (!role.permissions) return "-";

        if (Array.isArray(role.permissions)) {
            if (role.permissions.length === 0) return "-";

            // Check if it's array of strings or Permission objects
            if (typeof role.permissions[0] === "string") {
                return (role.permissions as string[]).join(", ");
            } else {
                return (role.permissions as Permission[]).map(p => p.name).join(", ");
            }
        }

        return "-";
    };

    // Group permissions by category (based on prefix)
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const [category] = permission.name.split(".");
        if (!acc[category]) acc[category] = [];
        acc[category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Daftar Role</h1>
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
                                            {getPermissionDisplay(role).split(", ").map((perm, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground"
                                                >
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(role.created_at).toLocaleDateString('id-ID')}
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
                                                    <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                                        Edit Role
                                                    </DropdownMenuItem>
                                                )}
                                                {hasPermission("delete.role") && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteRole(role.id)}
                                                        >
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
