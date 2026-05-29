import api from "@/lib/axios";

export interface FieldDefinition {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  field_group?: string;
}

export interface FieldDefinitionResponse {
  message: string;
  data: FieldDefinition[];
}

export const fetchFieldDefinitions = async (): Promise<FieldDefinition[]> => {
  const res = await api.get<FieldDefinitionResponse>("/field-definitions");
  return res.data.data;
};

export const createFieldDefinition = async (
  data: Partial<FieldDefinition>,
): Promise<FieldDefinition> => {
  const res = await api.post<{ data: FieldDefinition }>("/field-definitions", data);
  return res.data.data;
};

export const updateFieldDefinition = async (
  id: number,
  data: Partial<FieldDefinition>,
): Promise<FieldDefinition> => {
  const res = await api.patch<{ data: FieldDefinition }>(
    `/field-definitions/${id}`,
    data,
  );
  return res.data.data;
};

export const deleteFieldDefinition = async (id: number): Promise<void> => {
  await api.delete(`/field-definitions/${id}`);
};
