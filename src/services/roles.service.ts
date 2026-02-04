import api from "@/lib/axios";
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from "@/types/roles";

export const fetchRoles = async (): Promise<Role[]> => {
    const res = await api.get("/users/roles");
    return res.data.roles;
};

export const fetchRoleDetail = async (id: number): Promise<Role> => {
    const res = await api.get(`/users/show-roles/${id}`);
    return res.data.data;
};

export const createRole = async (data: CreateRoleRequest) => {
    const res = await api.post("/users/add-roles", data);
    return res.data;
};

export const updateRole = async (id: number, data: UpdateRoleRequest) => {
    const res = await api.patch(`/users/update-roles/${id}`, data);
    return res.data;
};

export const deleteRole = async (id: number) => {
    await api.delete(`/users/delete-roles/${id}`);
};

export const fetchPermissions = async (): Promise<Permission[]> => {
    const res = await api.get("/users/permissions");
    return res.data;
};
