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