import type { FieldDefinition } from "@/services/field.service";

export type FieldManageView = "list" | "form";

export type FieldFormData = Pick<
  FieldDefinition,
  "field_label" | "field_key" | "field_type" | "is_required" | "is_active"
>;

export const emptyFieldFormData: FieldFormData = {
  field_label: "",
  field_key: "",
  field_type: "text",
  is_required: false,
  is_active: true,
};

export const normalizeFieldIdentity = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export const buildFieldKeyFromLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
