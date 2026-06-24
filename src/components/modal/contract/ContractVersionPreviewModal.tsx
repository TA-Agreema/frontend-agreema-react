import { useMemo, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, GitCompare, Eye } from "lucide-react";
import type { ContractVersion } from "@/types/contractVersion";

function computeHtmlDiff(prevHtml: string, nextHtml: string): string {
  if (!prevHtml) return nextHtml;

  try {
    const parser = new DOMParser();
    const prevDoc = parser.parseFromString(prevHtml, "text/html");
    const nextDoc = parser.parseFromString(nextHtml, "text/html");

    // Query all blocks/elements we want to compare
    const prevElements = Array.from(
      prevDoc.body.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr")
    );
    const prevContentSet = new Set(
      prevElements.map((el) => normaliseElementContent(el))
    );

    const nextElements = Array.from(
      nextDoc.body.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr")
    );

    nextElements.forEach((el) => {
      const norm = normaliseElementContent(el);
      if (!prevContentSet.has(norm)) {
        el.classList.add("version-diff-added");
      }
    });

    return nextDoc.body.innerHTML;
  } catch (err) {
    console.error("DOMParser diff failed, falling back to original html", err);
    return nextHtml;
  }
}

function normaliseElementContent(el: Element): string {
  const tagName = el.tagName.toLowerCase();
  const innerText = el.textContent || "";
  const normText = innerText.replace(/\s+/g, " ").trim();
  return `${tagName}:${normText}`;
}

interface Props {
  versions: ContractVersion[];
  viewingVersion: ContractVersion;
  onClose: () => void;
  onNavigate: (version: ContractVersion) => void;
}

export function ContractVersionPreviewModal({
  versions,
  viewingVersion,
  onClose,
  onNavigate,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.id - a.id),
    [versions],
  );

  const currentIndex = sorted.findIndex((v) => v.id === viewingVersion.id);
  const prevVersion = sorted[currentIndex + 1] ?? null;
  const nextVersion = sorted[currentIndex - 1] ?? null;

  const diffHtml = useMemo(() => {
    if (!prevVersion) return viewingVersion.content;
    return computeHtmlDiff(prevVersion.content, viewingVersion.content);
  }, [viewingVersion, prevVersion]);

  // Auto scroll to first diff element
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const firstMark = el.querySelector(".version-diff-added, .version-diff-removed");
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [diffHtml]);

  const hasPrev = prevVersion !== null;
  const hasNext = nextVersion !== null;

  const diffCount = useMemo(() => {
    const tmp = document.createElement("div");
    tmp.innerHTML = diffHtml;
    return tmp.querySelectorAll(".version-diff-added, .version-diff-removed").length;
  }, [diffHtml]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-800">
                Pratinjau Versi {viewingVersion.version_number}
              </h3>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <p className="text-xs text-gray-500">
              Dibuat oleh{" "}
              <span className="font-semibold text-gray-700">
                {viewingVersion.created_by}
              </span>{" "}
              pada {viewingVersion.created_at}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {prevVersion && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {diffCount} perubahan dari v{prevVersion.version_number}
              </div>
            )}
            {!prevVersion && (
              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-500">
                <Eye className="h-3 w-3" />
                Versi pertama
              </div>
            )}

            <button
              onClick={() => hasPrev && onNavigate(prevVersion!)}
              disabled={!hasPrev}
              title={hasPrev ? `Lihat versi sebelumnya (v${prevVersion!.version_number})` : "Tidak ada versi lebih lama"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Lebih Lama
            </button>
            <button
              onClick={() => hasNext && onNavigate(nextVersion!)}
              disabled={!hasNext}
              title={hasNext ? `Lihat versi lebih baru (v${nextVersion!.version_number})` : "Ini versi terbaru"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              Lebih Baru
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors ml-1"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        {prevVersion && (
          <div className="flex items-center gap-4 px-5 py-2 bg-amber-50/60 border-b border-amber-100 shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
              Keterangan:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3.5 rounded bg-emerald-200 border border-emerald-400" />
              <span className="text-[11px] text-gray-600">Konten baru / diubah</span>
            </div>
            {/* <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3.5 rounded bg-red-100 border border-red-300" />
              <span className="text-[11px] text-gray-600">Konten dihapus</span>
            </div> */}
          </div>
        )}

        {/* Version Tabs */}
        <div className="flex gap-1.5 px-5 py-2.5 border-b border-gray-100 bg-white overflow-x-auto shrink-0">
          {sorted.map((v) => (
            <button
              key={v.id}
              onClick={() => onNavigate(v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${v.id === viewingVersion.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              {v.version_number}
            </button>
          ))}
        </div>

        {/* Document Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100/60">
          <div
            className="bg-white mx-auto shadow-md border border-gray-200 p-12 min-h-[29.7cm]"
            style={{ width: "21cm" }}
          >
            <div
              ref={contentRef}
              className="tiptap-preview text-sm text-gray-800 leading-7 outline-none"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}