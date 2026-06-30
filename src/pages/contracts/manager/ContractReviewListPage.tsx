import { useState, useEffect } from "react";
import {
  Loader2,
  FileText,
  ChevronRight,
  ChevronDown,
  FileSignature,
  CalendarDays,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { Link } from "react-router-dom";
// import Pagination from "@/components/Pagination";
import React from "react";
import ContractFilterManager from "@/components/ContractFilterManager";
import { useContractFilter } from "@/hooks/useContractFilter";
// import { fetchContracts } from "@/services/contract.service";
import { fetchManagerContracts } from "@/services/manager.service";
import { fetchFieldDefinitions, type FieldDefinition } from "@/services/field.service";
import type { ContractRow, Addendum } from "@/pages/contracts/ContractListPage";
import AddendumDetailModal from "@/components/modal/addendum/AddendumDetailModal";
import { Button } from "@/components/ui/button";

// 1. Ubah jumlah minimal data per halaman menjadi 10
const PAGEINATED = 10;

export default function ContractReviewListPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [viewAddendumTarget, setViewAddendumTarget] = useState<Addendum | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>(
    [],
  );

  // Load field definitions
  useEffect(() => {
    fetchFieldDefinitions().then(setFieldDefinitions).catch(console.error);
  }, []);
  const filter = useContractFilter(contracts);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const loadContracts = async () => {
      setIsLoading(true);
      try {
        const data = await fetchManagerContracts();
        setContracts(data);
        setPage(1);
      } catch (error) {
        console.error("Failed to load contracts for review", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadContracts();
  }, []);

  const reviewContracts = filter.contracts.filter(
    (c) =>
      c.status !== "active" &&
      c.status !== "rejected" &&
      c.status !== "terminated" &&
      c.status !== "expired",
  );

  const indexOfLastContract = page * PAGEINATED;
  const indexOfFirstContract = indexOfLastContract - PAGEINATED;
  const currentContracts = reviewContracts.slice(
    indexOfFirstContract,
    indexOfLastContract,
  );

  const tableColSpan = 7 + filter.visibleFields.length;
  const detailColSpan = 6 + filter.visibleFields.length;

  const renderSortIcon = (key: string) => {
    if (filter.sortConfig.key !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/45" />;
    }
    return filter.sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Perlu Ditinjau
          </span>
        );
      case "revision":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            Menunggu Revisi
          </span>
        );
      case "signed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Disahkan
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-blue-200">
            Aktif
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 min-w-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Approval Kontrak
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tinjau dan berikan persetujuan untuk kontrak yang diajukan.
            </p>
          </div>

          {/* Contract Filter Manager */}
          <ContractFilterManager
            search={filter.search}
            setSearch={(val) => {
              filter.setSearch(val);
              setPage(1);
            }}
            placeholder="Cari berdasarkan judul, nomor kontrak, partner, atau pembuat..."
            startYearFilter={filter.startYearFilter}
            setStartYearFilter={(val) => {
              filter.setStartYearFilter(val);
              setPage(1);
            }}
            endYearFilter={filter.endYearFilter}
            setEndYearFilter={(val) => {
              filter.setEndYearFilter(val);
              setPage(1);
            }}
            availableYears={filter.availableYears}
            statusFilter={filter.statusFilter}
            setStatusFilter={(val) => {
              filter.setStatusFilter(val);
              setPage(1);
            }}
            statusOptions={[
              { label: "Perlu Ditinjau", value: "review" },
              { label: "Disetujui / Menunggu TTD Eksternal", value: "approved" },
              { label: "Menunggu Revisi", value: "revision" },
            ]}
            customFilters={filter.customFilters}
            setCustomFilters={(val) => {
              filter.setCustomFilters(val);
              setPage(1);
            }}
            visibleFields={filter.visibleFields}
            setVisibleFields={filter.setVisibleFields}
            onReset={filter.resetFilters}
          />

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-8 px-3 py-4" />
                    <th
                      onClick={() => filter.requestSort("title")}
                      className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Nomor & Judul Kontrak {renderSortIcon("title")}
                      </div>
                    </th>
                    <th
                      onClick={() => filter.requestSort("status")}
                      className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Status {renderSortIcon("status")}
                      </div>
                    </th>
                    <th
                      onClick={() => filter.requestSort("category")}
                      className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Kategori {renderSortIcon("category")}
                      </div>
                    </th>
                    <th
                      onClick={() => filter.requestSort("created_by")}
                      className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Diajukan Oleh {renderSortIcon("created_by")}
                      </div>
                    </th>
                    <th
                      onClick={() => filter.requestSort("start_date")}
                      className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Periode {renderSortIcon("start_date")}
                      </div>
                    </th>

                    {/* Render dynamic columns headers */}
                    {filter.visibleFields.map((fieldId) => {
                      const field = fieldDefinitions.find(
                        (f) => f.id === fieldId,
                      );
                      if (!field) return null;
                      return (
                        <th
                          key={field.id}
                          onClick={() => filter.requestSort(String(field.id))}
                          className="cursor-pointer hover:bg-gray-100/80 text-left px-3 py-4 font-semibold text-gray-500 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            {field.field_label}{" "}
                            {renderSortIcon(String(field.id))}
                          </div>
                        </th>
                      );
                    })}

                    <th className="text-right px-3 py-4 font-semibold text-gray-500 pr-6 w-36">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={tableColSpan} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto mb-3" />
                        <p className="text-gray-500">Memuat data kontrak...</p>
                      </td>
                    </tr>
                  ) : reviewContracts.length === 0 ? (
                    <tr>
                      <td colSpan={tableColSpan} className="py-12 text-center">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium mb-1">
                          Tidak ada kontrak
                        </p>
                        <p className="text-gray-500 text-sm">
                          {filter.search || filter.startYearFilter !== "all" || filter.endYearFilter !== "all" || filter.statusFilter !== "all" || filter.customFilters.length > 0
                            ? "Tidak ada kontrak yang sesuai dengan filter aktif."
                            : "Belum ada kontrak yang perlu ditinjau."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentContracts.map((contract) => {
                      const isExpanded = expanded.has(contract.id);
                      const hasAddendums =
                        contract.addendums && contract.addendums.length > 0;

                      return (
                        <React.Fragment key={contract.id}>
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-4 pl-4">
                              {hasAddendums ? (
                                <button
                                  onClick={() => toggleExpand(contract.id)}
                                  className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              ) : null}
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    {contract.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {contract.contract_number || "—"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              {getStatusBadge(contract.status)}
                            </td>
                            <td className="px-3 py-4 font-medium text-gray-600">
                              <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {contract.category || "Tanpa Kategori"}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-gray-600 font-medium">
                              {contract.created_by}
                            </td>
                            <td className="px-3 py-4 text-muted-foreground text-xs leading-relaxed font-medium">
                              {contract.start_date}
                              <br />
                              <span className="text-muted-foreground/60">s/d</span>
                              <br />
                              {contract.end_date ?? "—"}
                            </td>

                            {/* Render dynamic columns cells */}
                            {filter.visibleFields.map((fieldId) => {
                              const valObj = contract.field_values?.find(
                                (fv) => fv.field_definition_id === fieldId,
                              );
                              return (
                                <td
                                  key={fieldId}
                                  className="px-3 py-4 text-gray-600 font-medium"
                                >
                                  {valObj?.value || "—"}
                                </td>
                              );
                            })}

                            <td className="px-3 py-4 text-right pr-6">
                              <Button className="text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                                <Link to={`/approvals/${contract.id}`}>
                                  Buka & Tinjau
                                </Link>
                              </Button>
                            </td>
                          </tr>

                          {isExpanded &&
                            contract.addendums.map((addendum) => (
                              <tr
                                key={`addendum-${addendum.id}`}
                                className="bg-gray-50/80 border-l-4 border-l-emerald-400"
                              >
                                <td className="pl-10 pr-3 py-3 w-8">
                                  <div className="p-1.5 rounded-md bg-white border border-gray-200 inline-flex">
                                    <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
                                  </div>
                                </td>
                                <td
                                  colSpan={detailColSpan}
                                  className="px-3 py-3 pr-6"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-0.5 min-w-0">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {addendum.addendum_number}
                                      </p>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {addendum.title}
                                      </p>
                                      <p className="text-xs text-gray-500 leading-relaxed">
                                        {addendum.description}
                                      </p>
                                      <div className="flex items-center gap-4 pt-1">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                          <CalendarDays className="h-3 w-3" />
                                          Dibuat: {addendum.created_at}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                          <CalendarDays className="h-3 w-3" />
                                          Efektif: {addendum.effective_date}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setViewAddendumTarget(addendum)
                                      }
                                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Lihat Detail
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {viewAddendumTarget && (
        <AddendumDetailModal
          addendum={viewAddendumTarget}
          onClose={() => setViewAddendumTarget(null)}
        />
      )}
    </div>
  );
}