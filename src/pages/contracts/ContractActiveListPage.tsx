import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  // Search,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  FileText,
  FileSignature,
  CalendarDays,
  Eye,
  XCircle,
  Trash2,
  CheckCircle2,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCw,
  Download,
  // Building2,
  // Handshake,
} from "lucide-react";
import ContractFilterManager from "@/components/ContractFilterManager";
import { useContractFilter } from "@/hooks/useContractFilter";
import { fetchFieldDefinitions, type FieldDefinition } from "@/services/field.service";
import Pagination from "@/components/Pagination";
import { usePermissions } from "@/contexts/PermissionContext";
import { useAuth } from "@/contexts/AuthContext";
import DeleteModal from "@/components/modal/common/DeleteModal";
import ConfirmModal from "@/components/modal/common/ConfirmModal";
import {
  fetchContracts,
  deleteContract,
  downloadContractPdf,
} from "@/services/contract.service";
import { downloadBlobResponse } from "@/services/download.service";
import { fetchManagerContracts } from "@/services/manager.service";
import AddendumDetailModal from "@/components/modal/addendum/AddendumDetailModal";
import AddendumModal from "@/components/modal/addendum/AddendumModal";
import TerminationModal from "@/components/modal/terminasi/TerminationModal";
// import type { Termination } from "@/types/termination";
import type { Termination } from "@/types/termination";
import type { Addendum, ContractRow } from "./ContractListPage";

const PAGE_SIZE = 8;
function ContractTypeBadge({ type }: { type?: "internal" | "external" }) {
  if (type === "external") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        {/* <Handshake className="h-3 w-3" /> */}
        Eksternal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
      {/* <Building2 className="h-3 w-3" /> */}
      Internal
    </span>
  );
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Aktif
    </span>
  );
}

// ── Addendum sub-row ─────────────────────────────────────────────
function AddendumSubRow({
  addendum,
  onView,
  colSpan,
}: {
  addendum: Addendum;
  onView: () => void;
  colSpan: number;
}) {
  return (
    <tr className="bg-slate-50/80 border-l-4 border-l-emerald-400">
      <td className="pl-10 pr-3 py-3 w-8">
        <div className="p-1.5 rounded-md bg-white border border-slate-200 inline-flex">
          <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      </td>
      <td colSpan={colSpan} className="px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {addendum.addendum_number}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {addendum.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {addendum.description}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Dibuat: {addendum.created_at}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Efektif: {addendum.effective_date}
              </span>
            </div>
          </div>
          <button
            onClick={onView}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Lihat Detail
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Row action dropdown ──────────────────────────────────────────
function RowMenu({
  contract,
  isHrd,
  canManageAddendum,
  canManageTermination,
  canDeleteRow,
  canRenewContract,
  canDownloadContract,
  onView,
  onAddendum,
  onTerminate,
  onDelete,
  onRenew,
  onDownloadPdf,
}: {
  contract: ContractRow;
  isHrd: boolean;
  canManageAddendum: boolean;
  canManageTermination: boolean;
  canDeleteRow: boolean;
  canRenewContract: boolean;
  canDownloadContract: boolean;
  onView: () => void;
  onAddendum: () => void;
  onTerminate: () => void;
  onDelete: () => void;
  onRenew: () => void;
  onDownloadPdf: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropUp(window.innerHeight - rect.bottom < 200);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, { capture: true });
    return () => window.removeEventListener("scroll", handler, { capture: true });
  }, [open]);

  const hasPendingTermination = contract.terminations && contract.terminations.length > 0;
  const canRenewThisContract = canRenewContract && contract.contract_type !== "external";
  const canAddAddendum = !hasPendingTermination;
  const canTerminate = !hasPendingTermination;

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute right-0 w-52 rounded-lg border bg-card shadow-xl z-50 overflow-hidden py-1 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onView(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
          >
            <Eye className="h-4 w-4 text-muted-foreground opacity-70" />
            Lihat Detail
          </button>


          {canManageAddendum && isHrd && canAddAddendum && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddendum(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
            >
              <FileText className="h-4 w-4 text-muted-foreground opacity-70" />
              Ajukan Addendum
            </button>
          )}

          {canRenewThisContract && isHrd && (
            <button
              onClick={(e) => { e.stopPropagation(); onRenew(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground opacity-70" />
              Perpanjang Kontrak
            </button>
          )}

          {canManageTermination && isHrd && canTerminate && (
            <button
              onClick={(e) => { e.stopPropagation(); onTerminate(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <XCircle className="h-4 w-4 opacity-70" />
              Ajukan Pembatalan
            </button>
          )}

          {canDownloadContract && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadPdf(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
            >
              <Download className="h-4 w-4 text-muted-foreground opacity-70" />
              Download PDF
            </button>
          )}

          {canDeleteRow && contract.status === "draft" && isHrd && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 opacity-70" />
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ContractActiveListPage() {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const { roles } = useAuth();

  const isHrd = roles.includes("hrd");
  const isManager = roles.includes("manager");

  const canManageAddendum = hasAnyPermission(["create.addendum", "create.contract_addendum"]);
  const canManageTermination = hasAnyPermission(["create.terminate", "terminate.contract"]);
  const canDeleteRow = hasAnyPermission(["delete.contract"]);
  const canRenewContract = hasAnyPermission(["create.contract"]);
  const canDownloadContract = hasAnyPermission(["download.contract", "read.contract"]);

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);
  const [renewTarget, setRenewTarget] = useState<ContractRow | null>(null);
  const [addendumTarget, setAddendumTarget] = useState<ContractRow | null>(null);
  const [viewAddendumTarget, setViewAddendumTarget] = useState<Addendum | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<ContractRow | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);

  // Load field definitions
  useEffect(() => {
    fetchFieldDefinitions().then(setFieldDefinitions).catch(console.error);
  }, []);

  // Initialize filter hook
  const filter = useContractFilter(contracts);

  // Filter only active contracts
  const activeContracts = filter.contracts.filter(c => c.status === "active");
  const totalPages = Math.max(1, Math.ceil(activeContracts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = activeContracts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };


  const handleTerminationSuccess = useCallback((contractId: number, terminationData: Termination) => {
    setContracts(prev =>
      prev.map(c => {
        if (c.id !== contractId) return c;
        const effectiveDateStr = terminationData?.effective_date;
        let isTerminatedNow = true;
        if (effectiveDateStr) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const effectiveDate = new Date(effectiveDateStr); effectiveDate.setHours(0, 0, 0, 0);
          isTerminatedNow = effectiveDate.getTime() <= today.getTime();
        }
        if (isTerminatedNow) {
          return { ...c, status: "terminated" as const, end_date: effectiveDateStr || c.end_date, terminations: [] };
        } else {
          return { ...c, terminations: [terminationData, ...(c.terminations || [])] };
        }
      })
    );
  }, []);

  const handleAddendumSuccess = useCallback((contractId: number, newAddendum: Addendum) => {
    setContracts(prev =>
      prev.map(c => c.id === contractId ? { ...c, addendums: [newAddendum, ...c.addendums] } : c)
    );
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(contractId);
      return next;
    });
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContract(deleteTarget.id);
      setContracts(prev => prev.filter(c => c.id !== deleteTarget.id));
    } catch {
      alert("Gagal menghapus kontrak. Coba lagi.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRenewContract = () => {
    if (!renewTarget) return;

    navigate("/contracts/create", {
      state: { renewFromId: renewTarget.id },
    });
    setRenewTarget(null);
  };

  const handleDownloadPdf = async (contract: ContractRow) => {
    try {
      const response = await downloadContractPdf(contract.id);
      downloadBlobResponse(
        response,
        `${contract.contract_number || contract.title || "kontrak"}.pdf`,
      );
    } catch (err) {
      console.error("Gagal mengunduh PDF kontrak:", err);
      toast.error("Gagal mengunduh PDF kontrak. Coba lagi.");
    }
  };

  // Fetch on mount (no search parameter since client filter handles it)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: ContractRow[];

        if (isManager) {
          const all = await fetchManagerContracts(undefined, "active");
          data = all.filter(c => c.status === "active");
        } else {
          const all = await fetchContracts(undefined, false, true);
          data = all.filter(c => c.status === "active");
        }

        if (!mounted) return;
        setContracts(data);
        setPage(1);
      } catch (err: unknown) {
        if (!mounted) return;
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        setError(axiosError?.response?.data?.message ?? axiosError?.message ?? "Failed to load contracts");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isManager]);

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

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Kontrak Aktif</h2>
            <p className="text-muted-foreground text-sm">
              Daftar kontrak yang saat ini berstatus aktif dan sedang berjalan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
            {activeContracts.length} Kontrak Aktif
          </span>
        </div>
      </div>

      {/* Contract Filter Manager */}
      <ContractFilterManager
        search={filter.search}
        setSearch={(val) => {
          filter.setSearch(val);
          setPage(1);
        }}
        placeholder="Cari berdasarkan judul, kategori, partner, atau pembuat..."
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
        customFilters={filter.customFilters}
        setCustomFilters={(val) => {
          filter.setCustomFilters(val);
          setPage(1);
        }}
        visibleFields={filter.visibleFields}
        setVisibleFields={filter.setVisibleFields}
        onReset={filter.resetFilters}
      />

      {/* Table Card */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Table */}
        <div className="overflow-x-auto min-h-[280px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="w-8 px-3 py-3" />
                <th
                  onClick={() => filter.requestSort("title")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Judul {renderSortIcon("title")}
                  </div>
                </th>
                <th
                  onClick={() => filter.requestSort("partner")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Partner {renderSortIcon("partner")}
                  </div>
                </th>
                <th
                  onClick={() => filter.requestSort("category")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Kategori {renderSortIcon("category")}
                  </div>
                </th>
                <th
                  onClick={() => filter.requestSort("status")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Status {renderSortIcon("status")}
                  </div>
                </th>
                <th
                  onClick={() => filter.requestSort("start_date")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Periode {renderSortIcon("start_date")}
                  </div>
                </th>
                <th
                  onClick={() => filter.requestSort("created_by")}
                  className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Dibuat Oleh {renderSortIcon("created_by")}
                  </div>
                </th>

                {/* Render dynamic columns headers */}
                {filter.visibleFields.map((fieldId) => {
                  const field = fieldDefinitions.find((f) => f.id === fieldId);
                  if (!field) return null;
                  return (
                    <th
                      key={field.id}
                      onClick={() => filter.requestSort(String(field.id))}
                      className="cursor-pointer hover:bg-muted/50 text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {field.field_label} {renderSortIcon(String(field.id))}
                      </div>
                    </th>
                  );
                })}
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={8 + filter.visibleFields.length} className="py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Memuat kontrak aktif...</p>
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td colSpan={8 + filter.visibleFields.length} className="py-16 text-center text-red-600 text-sm">{error}</td></tr>
              )}
              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={8 + filter.visibleFields.length} className="py-16 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {filter.search || filter.startYearFilter !== "all" || filter.endYearFilter !== "all" || filter.customFilters.length > 0
                        ? "Tidak ada kontrak aktif yang cocok dengan filter aktif"
                        : "Belum ada kontrak yang aktif"}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && !error && paginated.map((contract) => {
                const isExpanded = expanded.has(contract.id);
                const hasAddendums = contract.addendums.length > 0;

                return (
                  <>
                    <tr
                      key={`contract-${contract.id}`}
                      onClick={() => hasAddendums && toggleExpand(contract.id)}
                      className={`transition-colors ${hasAddendums ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20"} ${isExpanded ? "bg-muted/30" : ""}`}
                    >
                      {/* Expand icon */}
                      <td className="w-10 px-3 py-4">
                        {hasAddendums ? (
                          <div className="flex items-center justify-center">
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                        ) : <div className="w-4" />}
                      </td>

                      {/* Title */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">{contract.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{contract.contract_number}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <ContractTypeBadge type={contract.contract_type} />
                              {hasAddendums && (
                                <span className="text-xs text-emerald-600">{contract.addendums.length} addendum</span>
                              )}
                            </div>
                            {/* Notifikasi terminasi terjadwal */}
                            {contract.terminations && contract.terminations.length > 0 && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                Terminasi pada: <span className="font-bold">{contract.terminations[0].effective_date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-muted-foreground font-medium">{contract.partner}</td>
                      <td className="px-3 py-4 text-muted-foreground font-medium">{contract.category}</td>
                      <td className="px-3 py-4 font-medium"><StatusBadge /></td>
                      <td className="px-3 py-4 text-muted-foreground text-xs leading-relaxed font-medium">
                        {contract.start_date}<br />
                        <span className="text-muted-foreground/60">s/d</span><br />
                        {contract.end_date ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground font-medium">{contract.created_by}</td>

                      {/* Render dynamic columns cells */}
                      {filter.visibleFields.map((fieldId) => {
                        const valObj = contract.field_values?.find(
                          (fv) => fv.field_definition_id === fieldId
                        );
                        return (
                          <td key={fieldId} className="px-3 py-4 text-muted-foreground font-medium">
                            {valObj?.value || "—"}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                        <RowMenu
                          contract={contract}
                          isHrd={isHrd}
                          canManageAddendum={canManageAddendum}
                          canManageTermination={canManageTermination}
                          canDeleteRow={canDeleteRow}
                          canRenewContract={canRenewContract}
                          canDownloadContract={canDownloadContract}
                          onView={() => {
                            if (contract.contract_type === "external") {
                              if (contract.signed_document_url) {
                                window.open(contract.signed_document_url, "_blank", "noopener,noreferrer");
                              } else {
                                toast.error("Dokumen kontrak tidak ditemukan.");
                              }
                            } else if (isManager) {
                              navigate(`/approvals/${contract.id}`);
                            } else {
                              navigate(`/contracts/${contract.id}/view`);
                            }
                          }}
                          onAddendum={() => setAddendumTarget(contract)}
                          onTerminate={() => setTerminateTarget(contract)}
                          onDelete={() => setDeleteTarget(contract)}
                          onRenew={() => setRenewTarget(contract)}
                          onDownloadPdf={() => handleDownloadPdf(contract)}
                        />
                      </td>
                    </tr>

                    {/* Addendum rows */}
                    {isExpanded && contract.addendums.map(addendum => (
                      <AddendumSubRow
                        key={`addendum-${addendum.id}`}
                        addendum={addendum}
                        onView={() => setViewAddendumTarget(addendum)}
                        colSpan={6 + filter.visibleFields.length}
                      />
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {activeContracts.length > 0 && (
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        )}
      </div>

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal
          title="Hapus Kontrak"
          itemName={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {renewTarget && (
        <ConfirmModal
          title="Perpanjang Kontrak"
          message={
            <>
              Editor akan memuat salinan dari versi terakhir{" "}
              <span className="font-medium text-foreground">
                {renewTarget.title}
              </span>
              . Kontrak baru belum disimpan dan periode perlu diisi ulang.
            </>
          }
          icon={RefreshCw}
          tone="success"
          confirmLabel="Lanjutkan ke Editor"
          onClose={() => setRenewTarget(null)}
          onConfirm={handleRenewContract}
        />
      )}

      {addendumTarget && (
        <AddendumModal
          contract={addendumTarget}
          onClose={() => setAddendumTarget(null)}
          onSuccess={handleAddendumSuccess}
        />
      )}

      {viewAddendumTarget && (
        <AddendumDetailModal
          addendum={viewAddendumTarget}
          onClose={() => setViewAddendumTarget(null)}
        />
      )}

      {terminateTarget && (
        <TerminationModal
          contract={terminateTarget}
          onClose={() => setTerminateTarget(null)}
          onSuccess={handleTerminationSuccess}
        />
      )}
    </div>
  );
}
