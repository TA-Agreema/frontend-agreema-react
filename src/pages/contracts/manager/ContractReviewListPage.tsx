import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  FileText,
  ChevronRight,
  ChevronDown,
  FileSignature,
  CalendarDays,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { fetchManagerContracts } from "@/services/manager.service";
import type { ContractRow, Addendum } from "@/pages/contracts/ContractListPage";
import AddendumDetailModal from "@/components/modal/addendum/AddendumDetailModal";


export default function ContractReviewListPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("review"); // Default to pending review
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [viewAddendumTarget, setViewAddendumTarget] = useState<Addendum | null>(null);

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
        const data = await fetchManagerContracts(search, statusFilter);
        setContracts(data);
      } catch (error) {
        console.error("Failed to load contracts for review", error);
      } finally {
        setIsLoading(false);
      }
    };

    // debounce search
    const timer = setTimeout(() => {
      loadContracts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Perlu Ditinjau
          </span>
        );
      case "revised":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
            Menunggu Revisi
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Aktif
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Approval Kontrak
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Tinjau dan berikan persetujuan untuk kontrak yang diajukan.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor atau judul kontrak..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="review">Perlu Ditinjau</option>
              <option value="approved">Disetujui / Menunggu TTD Eksternal</option>
              <option value="active">Aktif (Selesai TTD)</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-3 py-4" />
                  <th className="text-left px-3 py-4 font-medium text-gray-500">Nomor & Judul Kontrak</th>
                  <th className="text-left px-3 py-4 font-medium text-gray-500">Status</th>
                  <th className="text-left px-3 py-4 font-medium text-gray-500">Kategori</th>
                  <th className="text-left px-3 py-4 font-medium text-gray-500">Diajukan Oleh</th>
                  <th className="text-left px-3 py-4 font-medium text-gray-500">Periode</th>
                  <th className="text-right px-3 py-4 font-medium text-gray-500 pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto mb-3" />
                      <p className="text-gray-500">Memuat data kontrak...</p>
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium mb-1">
                        Tidak ada kontrak
                      </p>
                      <p className="text-gray-500 text-sm">
                        {search
                          ? "Tidak ada kontrak yang sesuai dengan pencarian Anda."
                          : "Belum ada kontrak yang perlu ditinjau."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const isExpanded = expanded.has(contract.id);
                    const hasAddendums = contract.addendums && contract.addendums.length > 0;

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
                                  {contract.contract_number || "Draft Number"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            {getStatusBadge(contract.status)}
                          </td>
                          <td className="px-3 py-4">
                            <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {contract.category || "Tanpa Kategori"}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-gray-600">
                            {contract.created_by}
                          </td>
                          <td className="px-3 py-4 text-gray-500 text-xs">
                            {contract.start_date || "-"}
                          </td>
                          <td className="px-3 py-4 text-right pr-6">
                            <Link
                              to={`/approvals/${contract.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              Buka & Tinjau
                            </Link>
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
                              <td colSpan={6} className="px-3 py-3 pr-6">
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
                                    onClick={() => setViewAddendumTarget(addendum)}
                                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
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

      {/* Addendum Detail/Preview Modal */}
      {viewAddendumTarget && (
        <AddendumDetailModal
          addendum={viewAddendumTarget}
          onClose={() => setViewAddendumTarget(null)}
        />
      )}
    </div>
  );
}
