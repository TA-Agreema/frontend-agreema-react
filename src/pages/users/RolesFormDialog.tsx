import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Permission, Role } from "@/types/roles";

/*  form values (sinkron dengan schema di page) */
export interface RoleFormValues {
  name: string;
}
// include optional description
export interface RoleFormValues {
  name: string;
  description?: string;
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  form: UseFormReturn<RoleFormValues>;

  permissions: Permission[];
  selectedPermissions: string[];
  onTogglePermission: (permissionName: string) => void;

  groupedPermissions: Record<string, Permission[]>;

  editingRole: Role | null;
  isSubmitting: boolean;

  onSubmit: (data: RoleFormValues) => Promise<void>;
}

export default function RoleFormDialog({
  open,
  onOpenChange,
  form,
  selectedPermissions,
  onTogglePermission,
  groupedPermissions,
  editingRole,
  isSubmitting,
  onSubmit,
}: RoleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? "Edit Role" : "Tambah Role"}</DialogTitle>
          <DialogDescription>
            {editingRole
              ? "Ubah informasi role dan permissions"
              : "Tambahkan role baru dengan permissions"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Role</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: admin, manager, staff"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Deskripsi singkat role" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Permissions</FormLabel>

              <div className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm capitalize">
                      {category}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {perms.map((permission) => (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => onTogglePermission(permission.name)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                              ${
                                selectedPermissions.includes(permission.name)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}>
                          {permission.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedPermissions.length} permission
                {selectedPermissions.length !== 1 ? "s" : ""} dipilih
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingRole ? "Update" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
