import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    permissions?: string[];
}

export default function ProtectedRoute({
    children,
    permissions = [],
}: ProtectedRouteProps) {
    const { token } = useAuth();
    const { hasAnyPermission } = usePermissions();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (permissions.length > 0 && !hasAnyPermission(permissions)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}