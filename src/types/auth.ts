export interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        job_title: string;
        department: string | null;
        is_active: number;
    };
    roles: string[];
    permissions: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}
