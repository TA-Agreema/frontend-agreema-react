import { useState, useMemo } from "react";
import type { ContractRow } from "@/pages/contracts/ContractListPage";

export interface CustomFilter {
  fieldId: number;
  operator: "contains" | "equals" | "empty" | "not_empty";
  value: string;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc" | null;
}

const parseDate = (dateStr: string | null | undefined): number => {
  if (!dateStr) return 0;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day).getTime();
};

export function useContractFilter(
  initialContracts: ContractRow[],
  options?: {
    statusOverride?: string;
    initialStatusFilter?: string;
  }
) {
  const [search, setSearch] = useState("");
  const [startYearFilter, setStartYearFilter] = useState("all");
  const [endYearFilter, setEndYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(options?.initialStatusFilter ?? "all");
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [visibleFields, setVisibleFields] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: null,
  });

  // Extract all available years from BOTH start_date and end_date to populate year dropdowns
  const availableYears = useMemo(() => {
    const years = new Set<string>();

    for (let i = -5; i <= 5; i++) {
      years.add((2026 + i).toString());
    }

    initialContracts.forEach((c) => {
      if (c.start_date) {
        const parts = c.start_date.split("-");
        if (parts.length === 3 && parts[2]) {
          years.add(parts[2]);
        }
      }
      if (c.end_date) {
        const parts = c.end_date.split("-");
        if (parts.length === 3 && parts[2]) {
          years.add(parts[2]);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [initialContracts]);

  // Filtered & Sorted contracts
  const filteredAndSortedContracts = useMemo(() => {
    let result = [...initialContracts];

    // Filter by Status
    if (options?.statusOverride) {
      result = result.filter((c) => c.status === options.statusOverride);
    } else if (statusFilter && statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter by Start Year
    if (startYearFilter && startYearFilter !== "all") {
      result = result.filter((c) => {
        if (!c.start_date) return false;
        const parts = c.start_date.split("-");
        return parts.length === 3 && parts[2] === startYearFilter;
      });
    }

    // Filter by End Year
    if (endYearFilter && endYearFilter !== "all") {
      result = result.filter((c) => {
        if (!c.end_date) return false;
        const parts = c.end_date.split("-");
        return parts.length === 3 && parts[2] === endYearFilter;
      });
    }

    // Filter by Search Query
    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      result = result.filter((c) => {
        const titleMatch = c.title?.toLowerCase().includes(q);
        const numberMatch = c.contract_number?.toLowerCase().includes(q);
        const partnerMatch = c.partner?.toLowerCase().includes(q);
        const categoryMatch = c.category?.toLowerCase().includes(q);
        const creatorMatch = c.created_by?.toLowerCase().includes(q);
        return titleMatch || numberMatch || partnerMatch || categoryMatch || creatorMatch;
      });
    }

    // Filter by Dynamic Custom Fields
    // if (customFilters.length > 0) {
    //   result = result.filter((c) => {
    //     return customFilters.every((filter) => {
    //       const customValObj = c.field_values?.find(
    //         (fv) => fv.field_definition_id === filter.fieldId
    //       );
    //       const val = customValObj?.value || "";

    //       const targetVal = filter.value.toLowerCase();
    //       const currentVal = val.toLowerCase();

    //       switch (filter.operator) {
    //         case "contains":
    //           return currentVal.includes(targetVal);
    //         case "equals":
    //           return currentVal === targetVal;
    //         case "empty":
    //           return !val || val.trim() === "";
    //         case "not_empty":
    //           return val && val.trim() !== "";
    //         default:
    //           return true;
    //       }
    //     });
    //   });
    // }

    // Sorting
    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig;
      const isAsc = direction === "asc";

      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        // Check if key is a custom field ID (number)
        const isCustomField = !isNaN(Number(key));

        if (isCustomField) {
          const fieldId = Number(key);
          valA = a.field_values?.find((fv) => fv.field_definition_id === fieldId)?.value || "";
          valB = b.field_values?.find((fv) => fv.field_definition_id === fieldId)?.value || "";

          // Attempt numeric comparison if both look like numbers
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
            return isAsc ? numA - numB : numB - numA;
          }
        } else {
          switch (key) {
            case "title":
              valA = a.title || "";
              valB = b.title || "";
              break;
            case "partner":
              valA = a.partner || "";
              valB = b.partner || "";
              break;
            case "category":
              valA = a.category || "";
              valB = b.category || "";
              break;
            case "status":
              valA = a.status || "";
              valB = b.status || "";
              break;
            case "start_date":
              return isAsc
                ? parseDate(a.start_date) - parseDate(b.start_date)
                : parseDate(b.start_date) - parseDate(a.start_date);
            case "end_date":
              return isAsc
                ? parseDate(a.end_date) - parseDate(b.end_date)
                : parseDate(b.end_date) - parseDate(a.end_date);
            case "created_by":
              valA = a.created_by || "";
              valB = b.created_by || "";
              break;
            default:
              valA = (a as any)[key] || "";
              valB = (b as any)[key] || "";
              break;
          }
        }

        // Default string comparison
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return isAsc ? -1 : 1;
        if (strA > strB) return isAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [initialContracts, search, startYearFilter, endYearFilter, statusFilter, sortConfig, options]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearch("");
    setStartYearFilter("all");
    setEndYearFilter("all");
    setStatusFilter("all");
    setCustomFilters([]);
    setSortConfig({ key: "created_at", direction: null });
  };

  return {
    search,
    setSearch,
    startYearFilter,
    setStartYearFilter,
    endYearFilter,
    setEndYearFilter,
    statusFilter,
    setStatusFilter,
    customFilters,
    setCustomFilters,
    visibleFields,
    setVisibleFields,
    sortConfig,
    requestSort,
    resetFilters,
    availableYears,
    contracts: filteredAndSortedContracts,
  };
}
