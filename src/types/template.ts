// Cocok dengan output formatTemplate() di TemplateController.php
export type TemplateStatus = "Aktif" | "Nonaktif";

export interface Template {
  id: number;
  name: string;
  content: string | null;
  is_active: boolean;
  status: TemplateStatus;
  category: string;
  category_id: number | null;
  createdBy: string;
  createdAt: string;
  created_at: string;
  updated_at: string;
}

export interface TemplatePayload {
  name: string;
  content: string;
  category_id: number;
  is_active?: boolean;
}

export interface TemplateListResponse {
  message: string;
  data: Template[];
}

export interface TemplateItemResponse {
  message: string;
  data: Template;
}
