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

export const downloadTemplatePdf = async (id: number) => {
  const res = await api.get<Blob>(`${BASE_PATH}/${id}/download`, {
    responseType: "blob",
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    let message = "Gagal mengunduh PDF template.";

    if (res.data instanceof Blob) {
      const text = await res.data.text();
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        message = parsed.message ?? parsed.error ?? message;
      } catch {
        message = text || message;
      }
    }

    throw {
      response: {
        status: res.status,
        data: { message },
      },
    };
  }

  return res;
};

export const toggleTemplateStatus = async (id: number): Promise<Template> => {
  const res = await api.patch<TemplateItemResponse>(
    `${BASE_PATH}/${id}/toggle-status`,
  );
  return res.data.data;
};


