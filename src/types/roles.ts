export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot?: {
    role_id: number;
    permission_id: number;
  };
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  description?: string;
  users_count?: number;
  is_active?: boolean;
  permissions?: string[] | Permission[];
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  permissions: string[];
  description?: string;
}

export interface UpdateRoleRequest {
  name: string;
  permissions: string[];
  description?: string;
}
