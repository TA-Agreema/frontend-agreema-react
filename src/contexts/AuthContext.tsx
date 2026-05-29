import { createContext, useContext, useState, useEffect } from "react";
import { login, logout } from "@/services/auth.service";
import type { LoginResponse } from "@/types/auth";

export interface AuthContextType {
    user: LoginResponse | null;
    roles: string[];
    permissions: string[];
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<LoginResponse | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            const storedRoles = localStorage.getItem("roles");
            const storedPermissions = localStorage.getItem("permissions");

            setToken(storedToken);
            setUser(storedUser ? JSON.parse(storedUser) : null);
            setRoles(storedRoles ? JSON.parse(storedRoles) : []);
            setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
        } catch (error) {
            console.error("Error loading auth data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleLogin = async (email: string, password: string) => {
        const response = await login(email, password);

        console.log("Login response:", response);
        console.log("Permissions:", response.permissions);

        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response));
        localStorage.setItem("roles", JSON.stringify(response.roles));
        localStorage.setItem("permissions", JSON.stringify(response.permissions));

        setToken(response.token);
        setUser(response);
        setRoles(response.roles);
        setPermissions(response.permissions);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.clear();

            setToken(null);
            setUser(null);
            setRoles([]);
            setPermissions([]);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                roles,
                permissions,
                token,
                isLoading,
                login: handleLogin,
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}