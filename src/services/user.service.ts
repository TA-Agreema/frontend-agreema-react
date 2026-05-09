import api from "@/lib/axios";
import type { User, CreateUserRequest, UpdateUserRequest, UpdateUserRolesRequest } from "@/types/users";

export const fetchUsers = async (): Promise<User[]> => {
    const res = await api.get("/users");
    return res.data.data;
};

export const fetchUserDetail = async (id: number): Promise<User> => {
    const res = await api.get(`/users/show-user/${id}`);
    return res.data.data;
};

export const createUser = async (data: CreateUserRequest) => {
    const res = await api.post("/users/add-user", data);
    return res.data;
};

export const updateUser = async (id: number, data: UpdateUserRequest) => {
    const res = await api.patch(`/users/update-user/${id}`, data);
    return res.data;
};

export const deleteUser = async (id: number) => {
    await api.delete(`/users/delete-user/${id}`);
};

export const updateUserRoles = async (id: number, data: UpdateUserRolesRequest) => {
    const res = await api.patch(`/users/update-user-roles/${id}`, data);
    return res.data;
};