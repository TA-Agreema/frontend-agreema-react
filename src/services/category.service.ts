import api from "@/lib/axios";
import type {
  Category,
  CategoryItemResponse,
  CategoryListResponse,
  CategoryPayload,
} from "@/types/category";

const BASE_PATH = "/category";

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get<CategoryListResponse>(BASE_PATH);
  return res.data.data;
};

export const createCategory = async (
  payload: CategoryPayload,
): Promise<Category> => {
  const res = await api.post<CategoryItemResponse>(BASE_PATH, payload);
  return res.data.data;
};

export const updateCategory = async (
  id: number,
  payload: CategoryPayload,
): Promise<Category> => {
  const res = await api.patch<CategoryItemResponse>(
    `${BASE_PATH}/${id}`,
    payload,
  );
  return res.data.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/${id}`);
};

export const toggleCategoryStatus = async (id: number): Promise<Category> => {
  const res = await api.patch<CategoryItemResponse>(
    `${BASE_PATH}/${id}/toggle-status`,
  );
  return res.data.data;
};
