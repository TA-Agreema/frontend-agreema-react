import { useEffect, useState } from "react";
import { fetchUsers, deleteUser, createUser, updateUser } from "@/services/user.service";
import { fetchRoles } from "@/services/roles.service";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types/users";
import type { Role } from "@/types/roles";
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
import UserFormDialog from "./UsersFormDialog"

const userFormSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
    job_title: z.string().min(1, "Jabatan wajib diisi"),
    department: z.string().min(1, "Departemen wajib diisi"),
    is_active: z.number().min(0).max(1),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersListPage() {
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
            console.error("Gagal menghapus user:", error);
            alert("Gagal menghapus user");
        }
    };

    const onSubmit = async (data: UserFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingUser) {
                // Update existing user
                const updateData: UpdateUserRequest = {
                    name: data.name,
                    job_title: data.job_title,
                    department: data.department,
                    is_active: data.is_active,
                };
                await updateUser(editingUser.id, updateData);
            } else {
                // Create new user
                if (!data.password) {
                    alert("Password wajib diisi untuk user baru");
                    setIsSubmitting(false);
                    return;
                }
                const createData: CreateUserRequest = {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    job_title: data.job_title,
                    department: data.department,
                    is_active: data.is_active,
                    roles: selectedRoles,
                };
                await createUser(createData);
            }

            await loadUsers();
            setIsDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Gagal menyimpan user:", error);
            alert("Gagal menyimpan user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRole = (roleName: string) => {
        setSelectedRoles(prev =>
            prev.includes(roleName)
                ? prev.filter(r => r !== roleName)
                : [...prev, roleName]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Daftar Pengguna</h1>
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
                                            {user.roles.map(role => (
                                                <span
                                                    key={role}
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
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
                                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                )}
                                                {hasPermission("delete.user") && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
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
