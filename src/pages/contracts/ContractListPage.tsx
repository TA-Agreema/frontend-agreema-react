import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  FileText,
  XCircle,
  Trash2,
  Download,
  FileSignature,
  CalendarDays,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import DeleteModal from "@/components/modal/DeleteModal";
import TemplateSelectModal, {
  type TemplateOption,
} from "@/components/modal/TemplateSelectModal";
import {
  fetchContracts,
  createContract,
  deleteContract,
} from "@/services/contract.service";

//  Types

export type ContractStatus =
  | "draft"
  | "review"
  | "active"
  | "revision"
  | "expired"
  | "terminated";

export interface Addendum {
  id: number;
  addendum_number: string;
  title: string;
  description: string;
  created_at: string; // "DD-MM-YYYY"
  effective_date: string;
}

export interface ContractRow {
  id: number;
  contract_number: string;
  external_contract_number: string | null;
  title: string;
  content?: string;
  partner: string; // nama pihak eksternal
  category: string;
  category_id: number | null;
  template_id: number | null;
  status: ContractStatus;
  start_date: string; // "DD-MM-YYYY"
  end_date: string | null;
  created_by: string;
  addendums: Addendum[];
}

const PAGE_SIZE = 4;

//  Status Config

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  review: {
    label: "Ditinjau",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  active: {
    label: "Aktif",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  revision: {
    label: "Revisi",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  expired: {
    label: "Berakhir",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
  terminated: {
    label: "Dibatalkan",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

//  Sub-components

function StatusBadge({ status }: { status: ContractStatus }) {
  const normalizedStatus = (status || "").toLowerCase() as ContractStatus;
  const cfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

//  Addendum sub-row

function AddendumRow({ addendum }: { addendum: Addendum }) {
  return (
    <tr className="bg-slate-50/80 border-l-4 border-l-emerald-400">
      {/* indent cell */}
      <td className="pl-10 pr-3 py-3 w-8">
        <div className="p-1.5 rounded-md bg-white border border-slate-200 inline-flex">
          <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      </td>

      {/* addendum info spans remaining cols */}
      <td colSpan={6} className="px-3 py-3">
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
        </div>
      </td>
    </tr>
  );
}

//  Row Action Dropdown
function RowMenu({
  contract,
  onEdit,
  onAddendum,
  onTerminate,
  onDelete,
  onDownload,
}: {
  contract: ContractRow;
  onEdit: () => void;
  onAddendum: () => void;
  onTerminate: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Aksi yang relevan berdasarkan status
  const canAddAddendum = ["active", "review"].includes(contract.status);
  const canTerminate = ["active", "review", "draft"].includes(contract.status);
  const canDelete = contract.status === "draft";

  // Hitung posisi setiap kali menu dibuka
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // Estimasi tinggi menu: max 5 item (~36px each) + divider + padding
    const estimatedMenuH = 36 * 5 + 12;
    const spaceBelow = viewportHeight - rect.bottom;

    setDropUp(spaceBelow < estimatedMenuH + 12);
  }, [open]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Tutup saat parent di-scroll
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [open]);

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`
            absolute right-0 w-48 rounded-lg border bg-card shadow-xl
            z-50 overflow-hidden py-1
            ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}
          `}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground">
            <Pencil className="h-4 w-4 text-muted-foreground opacity-70" />
            Edit
          </button>

          {canAddAddendum && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddendum();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground opacity-70" />
              Ajukan Addendum
            </button>
          )}

          {canTerminate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTerminate();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <XCircle className="h-4 w-4 opacity-70" />
              Ajukan Pembatalan
            </button>
          )}

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4 opacity-70" />
              Hapus
            </button>
          )}

          <div className="my-1 border-t border-border" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground">
            <Download className="h-4 w-4 text-muted-foreground opacity-70" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function ContractListPage() {
  const navigate = useNavigate();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);

  // Derived
  const totalPages = Math.max(1, Math.ceil(contracts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = contracts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Expand toggle
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

  // Action handlers

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContract(deleteTarget.id);
      setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (err) {
      console.error("Gagal menghapus kontrak:", err);
      alert("Gagal menghapus kontrak. Coba lagi.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Fetch contracts
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchContracts(search || undefined);
        if (!mounted) return;
        setContracts(data);
        setPage(1);
      } catch (err: unknown) {
        if (!mounted) return;
        let message = "Failed to load contracts";
        if (typeof err === "object" && err !== null) {
          // try to read axios-style error
          // @ts-expect-error allow reading axios-like error shape
          message = err?.response?.data?.message ?? err?.message ?? message;
        } else if (typeof err === "string") {
          message = err;
        }
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // simple debounce
    const t = setTimeout(load, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [search]);

  // Render

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Daftar Kontrak</h2>
        <p className="text-muted-foreground">
          Daftar Kontrak yang telah dibuat
        </p>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Toolbar */}
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
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shrink-0">
            <Plus className="h-4 w-4" />
            Tambah Kontrak
          </button>
        </div>

        {/* Table */}
        <div className="">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {/* Expand toggle col */}
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Judul
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Partner
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Kategori
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Periode
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dibuat Oleh
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground text-sm">
                    Memuat daftar kontrak...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-red-600 text-sm">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground text-sm">
                    {search
                      ? "Tidak ada kontrak yang cocok dengan pencarian"
                      : "Belum ada kontrak"}
                  </td>
                </tr>
              )}

              {paginated.map((contract) => {
                const isExpanded = expanded.has(contract.id);
                const hasAddendums = contract.addendums.length > 0;

                return (
                  <>
                    {/*  Main contract row  */}
                    <tr
                      key={`contract-${contract.id}`}
                      onClick={() => hasAddendums && toggleExpand(contract.id)}
                      className={`transition-colors ${
                        hasAddendums
                          ? "cursor-pointer hover:bg-muted/40"
                          : "hover:bg-muted/20"
                      } ${isExpanded ? "bg-muted/30" : ""}`}>
                      {/* Expand icon */}
                      <td className="w-10 px-3 py-4">
                        {hasAddendums ? (
                          <div className="flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ) : (
                          <div className="w-4" />
                        )}
                      </td>

                      {/* Title */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-md bg-green-100 text-[#268257] shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">
                              {contract.title}
                            </p>
                            {hasAddendums && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {contract.addendums.length} addendum
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="px-3 py-4 text-muted-foreground">
                        {contract.partner}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-4 text-muted-foreground">
                        {contract.category}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-4">
                        <StatusBadge status={contract.status} />
                      </td>

                      {/* Period */}
                      <td className="px-3 py-4 text-muted-foreground text-xs leading-relaxed">
                        {contract.start_date}
                        <br />
                        <span className="text-muted-foreground/60">s/d</span>
                        <br />
                        {contract.end_date ?? "—"}
                      </td>

                      {/* Created by */}
                      <td className="px-3 py-4 text-muted-foreground">
                        {contract.created_by}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-3 py-4"
                        onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          contract={contract}
                          onEdit={() =>
                            navigate(`/contracts/${contract.id}/edit`)
                          }
                          onAddendum={() =>
                            navigate(`/contracts/${contract.id}/addendum/new`)
                          }
                          onTerminate={() =>
                            navigate(`/contracts/${contract.id}/terminate`)
                          }
                          onDelete={() => setDeleteTarget(contract)}
                          onDownload={() =>
                            console.log("Download PDF", contract.id)
                          }
                        />
                      </td>
                    </tr>

                    {/* ── Addendum rows (expanded)  */}
                    {isExpanded &&
                      contract.addendums.map((addendum) => (
                        <AddendumRow
                          key={`addendum-${addendum.id}`}
                          addendum={addendum}
                        />
                      ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {contracts.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          title="Hapus Kontrak"
          itemName={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {showTemplateModal && (
        <TemplateSelectModal
          onClose={() => setShowTemplateModal(false)}
          onSelect={async (template: TemplateOption) => {
            try {
              const created = await createContract({
                contract_number: "", // Biarkan backend generate otomatis sesuai prefix kategori
                title: template.name,
                template_id: template.id,
                category_id: template.category_id,
                status: "draft",
              });

              // navigate to editor and pass the created contract + template
              navigate(`/contracts/${created.id}/edit`, {
                state: { createdContract: created, template },
              });
            } catch (err) {
              console.error("Failed to create contract", err);
              alert("Gagal membuat kontrak. Periksa koneksi dan permissions.");
            }
          }}
        />
      )}
    </div>
  );
}
