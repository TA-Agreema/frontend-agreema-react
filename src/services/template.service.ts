import api from "@/lib/axios";
import type {
  Template,
  TemplatePayload,
  TemplateListResponse,
  TemplateItemResponse,
} from "@/types/template";

const BASE_PATH = "/templates";

export const fetchTemplates = async (): Promise<Template[]> => {
  const res = await api.get<TemplateListResponse>(BASE_PATH);
  return res.data.data;
};

export const fetchTemplate = async (id: number): Promise<Template> => {
  const res = await api.get<TemplateItemResponse>(`${BASE_PATH}/${id}`);
  return res.data.data;
};

export const createTemplate = async (
  payload: TemplatePayload,
): Promise<Template> => {
  const res = await api.post<TemplateItemResponse>(BASE_PATH, payload);
  return res.data.data;
};

export const updateTemplate = async (
  id: number,
  payload: Partial<TemplatePayload>,
): Promise<Template> => {
  const res = await api.patch<TemplateItemResponse>(
    `${BASE_PATH}/${id}`,
    payload,
  );
  return res.data.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/${id}`);
};

export const toggleTemplateStatus = async (id: number): Promise<Template> => {
  const res = await api.patch<TemplateItemResponse>(
    `${BASE_PATH}/${id}/toggle-status`,
  );
  return res.data.data;
};
