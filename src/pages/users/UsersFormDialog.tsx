import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { Role } from "@/types/roles"
import type { User } from "@/types/users"

export interface UserFormValues {
    name: string
    email: string
    password?: string
    job_title: string
    department: string
    is_active: number
}

interface UserFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void

    form: UseFormReturn<UserFormValues>

    roles: Role[]
    selectedRoles: string[]
    onToggleRole: (roleName: string) => void

    editingUser: User | null
    isSubmitting: boolean

    onSubmit: (data: UserFormValues) => Promise<void>
}

export default function UserFormDialog({
    open,
    onOpenChange,
    form,
    roles,
    selectedRoles,
    onToggleRole,
    editingUser,
    isSubmitting,
    onSubmit,
}: UserFormDialogProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingUser
                            ? "Ubah informasi pengguna"
                            : "Tambahkan pengguna baru ke sistem"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            {...field}
                                            disabled={!!editingUser}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!editingUser && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    className="pr-10"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((value) => !value)}
                                                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    aria-label={
                                                        showPassword
                                                            ? "Sembunyikan password"
                                                            : "Tampilkan password"
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Minimal 8 karakter, berisi huruf besar, huruf kecil, angka, dan simbol.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="job_title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jabatan</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Departemen</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!editingUser && (
                            <div className="space-y-2">
                                <FormLabel>Role</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => onToggleRole(role.name)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium
                        ${selectedRoles.includes(role.name)
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                }`}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            value={field.value}
                                            onChange={(e) =>
                                                field.onChange(Number(e.target.value))
                                            }
                                            className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
                                        >
                                            <option value={1}>Aktif</option>
                                            <option value={0}>Nonaktif</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {editingUser ? "Update" : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
