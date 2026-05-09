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
  const { token, isLoading } = useAuth();
  const { hasAnyPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (permissions.length > 0 && !hasAnyPermission(permissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
