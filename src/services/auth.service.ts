import api from "@/lib/axios";
import type { LoginResponse } from "@/types/auth";

export const login = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    const response = await api.post("/login", null, {
        params: { email, password }
    });
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post("/logout");
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
    const response = await api.post("/forgot-password", { email });
    return response.data;
};

export const resetPassword = async (payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}): Promise<{ message: string }> => {
    const response = await api.post("/reset-password", payload);
    return response.data;
};
