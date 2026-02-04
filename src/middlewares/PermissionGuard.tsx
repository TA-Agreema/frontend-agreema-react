import { usePermissions } from "@/contexts/PermissionContext";

interface PermissionGuardProps {
    children: React.ReactNode;
    permissions?: string[];
    roles?: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
}

export default function PermissionGuard({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    fallback = null,
}: PermissionGuardProps) {
    const { hasAnyPermission, hasAllPermissions, hasAnyRole } = usePermissions();

    // Check permissions
    if (permissions.length > 0) {
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!hasAccess) {
            return <>{fallback}</>;
        }
    }

    // Check roles
    if (roles.length > 0) {
        const hasAccess = hasAnyRole(roles);

        if (!hasAccess) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}
