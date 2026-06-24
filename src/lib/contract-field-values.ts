import type { FieldDefinition } from "@/services/field.service";

export type ContractFieldValuePayload = {
  field_definition_id: number;
  value: string | null;
};

export type MissingRequiredContractField = {
  field_definition_id: number;
  field_label: string;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isPlaceholderValue = (value: string, fieldKey?: string | null) => {
  if (!fieldKey) return false;
  const tagPattern = new RegExp(`^{{\\s*${escapeRegExp(fieldKey)}\\s*}}$`, "i");
  return tagPattern.test(value.trim());
};

export const isUnfilledFieldValue = (value: string, field: FieldDefinition) => {
  const trimmed = value.trim();
  return (
    isPlaceholderValue(trimmed, field.field_key) ||
    trimmed === `[${field.field_label}]`
  );
};

const createContractFieldElement = (doc: Document, field: FieldDefinition) => {
  const span = doc.createElement("span");
  span.className = "contract-field-token";
  span.dataset.contractFieldId = String(field.id);
  span.dataset.contractFieldKey = field.field_key;
  span.dataset.contractFieldLabel = field.field_label;
  span.textContent = `[${field.field_label}]`;
  return span;
};

const replacePlainFieldTags = (doc: Document, fields: FieldDefinition[]) => {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const replacements: Array<{
    node: Text;
    fragments: Array<Node | string>;
  }> = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;

    if (!parent || parent.closest("[data-contract-field-id]")) continue;

    let remaining = node.nodeValue ?? "";
    const fragments: Array<Node | string> = [];
    let changed = false;

    while (remaining) {
      let firstMatch: {
        index: number;
        length: number;
        field: FieldDefinition;
      } | null = null;

      for (const field of fields) {
        const pattern = new RegExp(
          `{{\\s*${escapeRegExp(field.field_key)}\\s*}}`,
          "i",
        );
        const match = pattern.exec(remaining);

        if (match && (firstMatch === null || match.index < firstMatch.index)) {
          firstMatch = {
            index: match.index,
            length: match[0].length,
            field,
          };
        }
      }

      if (!firstMatch) {
        fragments.push(remaining);
        break;
      }

      if (firstMatch.index > 0) {
        fragments.push(remaining.slice(0, firstMatch.index));
      }

      fragments.push(createContractFieldElement(doc, firstMatch.field));
      remaining = remaining.slice(firstMatch.index + firstMatch.length);
      changed = true;
    }

    if (changed) replacements.push({ node, fragments });
  }

  replacements.forEach(({ node, fragments }) => {
    const parent = node.parentNode;
    if (!parent) return;

    fragments.forEach((fragment) => {
      parent.insertBefore(
        typeof fragment === "string" ? doc.createTextNode(fragment) : fragment,
        node,
      );
    });
    parent.removeChild(node);
  });
};

export function prepareContractContentForEditor(
  content: string,
  fields: FieldDefinition[],
) {
  if (!content || fields.length === 0) return content;

  const doc = new DOMParser().parseFromString(content, "text/html");
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const fieldByKey = new Map(
    fields.map((field) => [field.field_key.toLowerCase(), field]),
  );

  doc
    .querySelectorAll<HTMLElement>("[data-contract-field-id]")
    .forEach((element) => {
      const fieldId = Number(element.dataset.contractFieldId);
      const field =
        fieldById.get(fieldId) ??
        fieldByKey.get((element.dataset.contractFieldKey ?? "").toLowerCase());

      if (!field) return;

      element.classList.add("contract-field-token");
      element.dataset.contractFieldId = String(field.id);
      element.dataset.contractFieldKey = field.field_key;
      element.dataset.contractFieldLabel = field.field_label;

      if (isUnfilledFieldValue(element.textContent ?? "", field)) {
        element.textContent = `[${field.field_label}]`;
      }
    });

  replacePlainFieldTags(doc, fields);

  return doc.body.innerHTML;
}

export function buildContractFieldValues(
  content: string,
  fields: FieldDefinition[],
): ContractFieldValuePayload[] {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const valuesByFieldId = new Map<number, string | null>();

  const doc = new DOMParser().parseFromString(content, "text/html");
  doc
    .querySelectorAll<HTMLElement>("[data-contract-field-id]")
    .forEach((element) => {
      const fieldId = Number(element.dataset.contractFieldId);
      const field = fieldById.get(fieldId);
      if (!field) return;
      const textValue = (element.textContent ?? "").trim();
      const value = isUnfilledFieldValue(textValue, field)
        ? null
        : textValue || null;
      const existingValue = valuesByFieldId.get(fieldId);

      if (!valuesByFieldId.has(fieldId) || (!existingValue && value)) {
        valuesByFieldId.set(fieldId, value);
      }
    });

  fields.forEach((field) => {
    if (valuesByFieldId.has(field.id)) return;

    const tagPattern = new RegExp(
      `{{\\s*${escapeRegExp(field.field_key)}\\s*}}`,
      "i",
    );

    if (tagPattern.test(content)) {
      valuesByFieldId.set(field.id, null);
    }
  });

  return [...valuesByFieldId.entries()].map(([fieldDefinitionId, value]) => ({
    field_definition_id: fieldDefinitionId,
    value,
  }));
}

export function validateRequiredContractFields(
  content: string,
  fields: FieldDefinition[],
): MissingRequiredContractField[] {
  const requiredFieldsById = new Map(
    fields
      .filter((field) => field.is_required)
      .map((field) => [field.id, field]),
  );

  if (requiredFieldsById.size === 0) return [];

  const fieldValues = buildContractFieldValues(content, fields);

  return fieldValues.reduce<MissingRequiredContractField[]>(
    (missingFields, fieldValue) => {
      const field = requiredFieldsById.get(fieldValue.field_definition_id);
      if (!field) return missingFields;

      const value = fieldValue.value?.trim() ?? "";
      if (!value || isUnfilledFieldValue(value, field)) {
        missingFields.push({
          field_definition_id: field.id,
          field_label: field.field_label,
        });
      }

      return missingFields;
    },
    [],
  );
}
