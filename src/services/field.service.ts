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
