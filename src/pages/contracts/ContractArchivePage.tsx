import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, FileText, CalendarDays, Eye, ArrowLeft, XCircle, FileSignature } from "lucide-react";
import Pagination from "@/components/Pagination";
import { fetchContracts } from "@/services/contract.service";
import AddendumDetailModal from "@/components/modal/addendum/AddendumDetailModal";
import TerminationDetailModal from "@/components/modal/terminasi/TerminationDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import type { Addendum, ContractRow, ContractStatus } from "./ContractListPage";
import type { Termination } from "@/types/termination";

const PAGE_SIZE = 4;

const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 border-gray-200" },
  review: { label: "Ditinjau", className: "bg-amber-50 text-amber-700 border-amber-200" },
  active: { label: "Aktif", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  revision: { label: "Revisi", className: "bg-orange-50 text-orange-700 border-orange-200" },
  approved: { label: "Disetujui Internal", className: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-800 border-red-300" },
  expired: { label: "Berakhir", className: "bg-slate-100 text-slate-500 border-slate-200" },
  terminated: { label: "Dibatalkan", className: "bg-red-50 text-red-600 border-red-200" },
};

function StatusBadge({ status }: { status: ContractStatus }) {
  const normalizedStatus = (status || "").toLowerCase() as ContractStatus;
  const cfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function TerminationRow({
  termination,
  onView,
  colSpan,
}: {
  termination: Termination;
  onView: () => void;
  colSpan: number;
}) {
  return (
    <tr className="bg-slate-50/80 border-l-4 border-l-red-400">
      <td className="pl-10 pr-3 py-3 w-8">
        <div className="p-1.5 rounded-md bg-white border border-slate-200 inline-flex">
          <FileText className="h-3.5 w-3.5 text-red-600" />
        </div>
      </td>
      <td colSpan={colSpan} className="px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {termination.termination_number}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {termination.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {termination.termination_reason.replace(/_/g, " ")}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Dibuat: {termination.created_at}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Efektif: {termination.effective_date}
              </span>
            </div>
          </div>
          <button
            onClick={onView}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Lihat Detail
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddendumRow({
  addendum,
  onView,
  colSpan,
}: {
  addendum: Addendum;
  onView: () => void;
  colSpan: number;
}) {
  return (
    <tr className="bg-emerald-50/70 border-l-4 border-l-emerald-400">
      <td className="pl-10 pr-3 py-3 w-8">
        <div className="p-1.5 rounded-md bg-white border border-emerald-200 inline-flex">
          <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      </td>
      <td colSpan={colSpan} className="px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              {addendum.addendum_number}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {addendum.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {addendum.description || "Tidak ada deskripsi."}
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

function RejectionRow({ notes }: { notes: string }) {
  const raw = notes ?? "";
  const parts = raw.split("||");
  const reason = parts.length >= 2 ? parts[1].trim() : raw.trim();

  return (
    <tr className="bg-red-50/60 border-l-4 border-l-red-500">
      <td className="pl-10 pr-3 py-3 w-8">
        <div className="p-1.5 rounded-md bg-white border border-red-200 inline-flex">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
        </div>
      </td>
      <td colSpan={6} className="px-3 py-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
            Kontrak Ditolak
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
        </div>
      </td>
    </tr>
  );
}

export default function ContractArchivePage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [viewAddendumTarget, setViewAddendumTarget] = useState<Addendum | null>(null);
  const [viewTerminationTarget, setViewTerminationTarget] = useState<Termination | null>(null);

  // Filter ONLY terminated contracts
  const archivedContracts = contracts.filter(c => c.status === "terminated" || c.status === "rejected" || c.status === "expired");

  const totalPages = Math.max(1, Math.ceil(archivedContracts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = archivedContracts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const { roles } = useAuth();
  const isHrd = roles.includes('hrd');
  const tableColSpan = isHrd ? 8 : 7;
  const detailColSpan = tableColSpan - 1;

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchContracts(search || undefined, true);
        if (!mounted) return;
        setContracts(data);
        setPage(1);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.message ?? err?.message ?? "Failed to load contracts");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const t = setTimeout(load, 250);
    return () => { mounted = false; clearTimeout(t); };
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Arsip Kontrak</h2>
        <p className="text-muted-foreground">
          Daftar kontrak yang telah dibatalkan atau diterminasi
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari berdasarkan judul, kategori, atau partner..."
              className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 transition-colors font-medium shrink-0 text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar
          </button>
        </div>

        <div className="">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Judul</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Partner</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Periode</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Dibuat Oleh</th>
                {isHrd && (
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={tableColSpan} className="py-16 text-center text-muted-foreground text-sm">Memuat daftar kontrak...</td></tr>}
              {error && !loading && <tr><td colSpan={tableColSpan} className="py-16 text-center text-red-600 text-sm">{error}</td></tr>}
              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={tableColSpan} className="py-16 text-center text-muted-foreground text-sm">
                    {search ? "Tidak ada kontrak yang cocok dengan pencarian" : "Belum ada arsip kontrak"}
                  </td>
                </tr>
              )}
              {paginated.map((contract: any) => {
                const isExpanded = expanded.has(contract.id);
                const addendums = contract.addendums ?? [];
                const terminations = contract.terminations ?? [];
                const hasAddendums = addendums.length > 0;
                const hasTerminations = terminations.length > 0;
                const isRejected = contract.status === "rejected";
                const rejectionNotes = (() => {
                  const reviews = contract.signers?.flatMap((s: any) => s.reviews ?? []) ?? [];

                  return (reviews.find((r: any) => r.status === "rejected") ?? reviews[reviews.length - 1])?.notes ?? "";
                })();
                const isExpandable = hasAddendums || hasTerminations || isRejected;

                return (
                  <React.Fragment key={`contract-${contract.id}`}>
                    <tr
                      onClick={() => isExpandable && toggleExpand(contract.id)}
                      className={`transition-colors ${isExpandable ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20"} ${isExpanded ? "bg-muted/30" : ""}`}
                    >
                      <td className="w-10 px-3 py-4">
                        {isExpandable ? (
                          <div className="flex items-center justify-center">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        ) : <div className="w-4" />}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2.5 rounded-md shrink-0 ${isRejected ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">{contract.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {hasAddendums ? `${addendums.length} addendum` : isRejected ? "Ditolak" : "Dibatalkan"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{contract.partner}</td>
                      <td className="px-3 py-4 text-muted-foreground">{contract.category}</td>
                      <td className="px-3 py-4"><StatusBadge status={contract.status} /></td>
                      <td className="px-3 py-4 text-muted-foreground text-xs leading-relaxed">
                        {contract.start_date}<br /><span className="text-muted-foreground/60">s/d</span><br />{contract.end_date ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{contract.created_by}</td>
                      {isHrd && (
                        <td className="px-3 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/contracts/${contract.id}/view`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Dropdown: Termination rows */}
                    {isExpanded && hasAddendums && addendums.map((addendum: Addendum) => (
                      <AddendumRow
                        key={`addendum-${addendum.id}`}
                        addendum={addendum}
                        colSpan={detailColSpan}
                        onView={() => setViewAddendumTarget(addendum)}
                      />
                    ))}

                    {isExpanded && hasTerminations && terminations.map((termination: Termination) => (
                      <TerminationRow
                        key={`termination-${termination.id}`}
                        termination={termination}
                        colSpan={detailColSpan}
                        onView={() => setViewTerminationTarget(termination)}
                      />
                    ))}

                    {/* Dropdown: Rejection row */}
                    {isExpanded && isRejected && (
                      <RejectionRow
                        key={`rejection-${contract.id}`}
                        notes={rejectionNotes}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {archivedContracts.length > 0 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}
      </div>

      {viewAddendumTarget && (
        <AddendumDetailModal
          addendum={viewAddendumTarget}
          onClose={() => setViewAddendumTarget(null)}
        />
      )}

      {viewTerminationTarget && (
        <TerminationDetailModal
          termination={viewTerminationTarget}
          onClose={() => setViewTerminationTarget(null)}
        />
      )}
    </div>
  );
}