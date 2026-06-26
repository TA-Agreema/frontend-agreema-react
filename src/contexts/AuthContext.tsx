import { createContext, useContext, useState, useEffect } from "react";
import { login, logout } from "@/services/auth.service";
import type { LoginResponse } from "@/types/auth";

export interface AuthContextType {
    user: LoginResponse | null;
    roles: string[];
    permissions: string[];
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEYS = ["token", "user", "roles", "permissions"] as const;

const getStoredAuthValue = (key: (typeof AUTH_STORAGE_KEYS)[number]) =>
    localStorage.getItem(key) ?? sessionStorage.getItem(key);

const clearStoredAuth = () => {
    AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};

const saveStoredAuth = (response: LoginResponse, rememberMe: boolean) => {
    clearStoredAuth();

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", response.token);
    storage.setItem("user", JSON.stringify(response));
    storage.setItem("roles", JSON.stringify(response.roles));
    storage.setItem("permissions", JSON.stringify(response.permissions));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<LoginResponse | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedToken = getStoredAuthValue("token");
            const storedUser = getStoredAuthValue("user");
            const storedRoles = getStoredAuthValue("roles");
            const storedPermissions = getStoredAuthValue("permissions");

            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const handleLogin = async (
        email: string,
        password: string,
        rememberMe = false,
    ) => {
        const response = await login(email, password);

        console.log("Login response:", response);
        console.log("Permissions:", response.permissions);

        saveStoredAuth(response, rememberMe);

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
            clearStoredAuth();

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
