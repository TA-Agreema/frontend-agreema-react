/**
 * Custom hook untuk manajemen data template kontrak.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchTemplates,
  fetchTemplate,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  toggleTemplateStatus as apiToggleStatus,
} from "@/services/template.service";
import type { Template, TemplatePayload } from "@/types/template";
import type { PaperSize } from "@/lib/editor-paper";

// Re-export types agar kompatibel dengan page yang sudah ada
export type TemplateStatus = "Aktif" | "Nonaktif";
export type { Template as ContractTemplate };

export interface CreateTemplatePayload {
  name: string;
  category_id: number;
  is_active?: boolean;
  paper_size?: PaperSize;
  content: string;
  uploadedFile?: File;
}

export interface UpdateTemplatePayload extends CreateTemplatePayload {
  id: number;
}

//  Hook

interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: string | null;
  createTemplate: (payload: CreateTemplatePayload) => Promise<void>;
  updateTemplate: (payload: UpdateTemplatePayload) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  getTemplate: (id: number) => Promise<Template | undefined>;
  toggleTemplateStatus: (id: number) => Promise<void>;
  refetch: () => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
};

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //  Fetch all

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memuat data template."));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  //  Get single

  const getTemplate = useCallback(async (id: number) => {
    try {
      return await fetchTemplate(id);
    } catch {
      return undefined;
    }
  }, []);

  //  Create

  const createTemplate = useCallback(
    async (payload: CreateTemplatePayload) => {
      setLoading(true);
      try {
        const apiPayload: TemplatePayload = {
          name: payload.name,
          content: payload.content,
          paper_size: payload.paper_size,
          category_id: payload.category_id,
          is_active: payload.is_active ?? true,
        };
        await apiCreateTemplate(apiPayload);
        await fetchAll();
      } finally {
        setLoading(false);
      }
    },
    [fetchAll],
  );

  //  Update

  const updateTemplate = useCallback(
    async (payload: UpdateTemplatePayload) => {
      setLoading(true);
      try {
        const apiPayload: Partial<TemplatePayload> = {
          name: payload.name,
          content: payload.content,
          paper_size: payload.paper_size,
          category_id: payload.category_id,
          is_active: payload.is_active,
        };
        await apiUpdateTemplate(payload.id, apiPayload);
        await fetchAll();
      } finally {
        setLoading(false);
      }
    },
    [fetchAll],
  );

  //  Delete

  const deleteTemplate = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiDeleteTemplate(id);
      // Hapus dari state lokal agar UI langsung update tanpa refetch
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  //  Toggle Status

  const toggleTemplateStatus = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const updated = await apiToggleStatus(id);
      // Update state lokal secara optimistis tanpa refetch
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
    } finally {
      setLoading(false);
    }
  }, []);



  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    toggleTemplateStatus,
    refetch: fetchAll,
  };
}
