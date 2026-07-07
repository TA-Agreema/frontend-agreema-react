export interface User {
    id: number;
    name: string;
    email: string;
    job_title: string;
    department: string | null;
    is_active: number;
    roles: string[];
    created_at: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    job_title: string;
    department: string;
    is_active: number;
    role: string;
}

export interface UpdateUserRequest {
    name: string;
    job_title: string;
    department: string;
    is_active: number;
}
