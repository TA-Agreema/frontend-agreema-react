export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  templates_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryListResponse {
  message: string;
  data: Category[];
}

export interface CategoryItemResponse {
  message: string;
  data: Category;
}
