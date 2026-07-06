import { useMemo, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, GitCompare, Eye } from "lucide-react";
import type { ContractVersion } from "@/types/contractVersion";
import { ContractDocumentPreview } from "@/components/editor/ContractDocumentPreview";
import type { PaperSize } from "@/lib/editor-paper";
import { prepareEditorPreviewHtml } from "@/lib/editor-preview-html";

const BLOCK_SELECTOR = "p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr";

type BlockEntry = {
  element: Element;
  tagName: string;
  signature: string;
  index: number;
};

function computeHtmlDiff(prevHtml: string, nextHtml: string): string {
  const preparedNextHtml = prepareEditorPreviewHtml(nextHtml);
  if (!prevHtml) return preparedNextHtml;

  try {
    const parser = new DOMParser();
    const prevDoc = parser.parseFromString(
      prepareEditorPreviewHtml(prevHtml),
      "text/html",
    );
    const nextDoc = parser.parseFromString(preparedNextHtml, "text/html");

    const prevBlocks = collectBlockEntries(prevDoc.body);
    const nextBlocks = collectBlockEntries(nextDoc.body);

    const exactMatches = findExactBlockMatches(prevBlocks, nextBlocks);
    const matchedPrev = new Set<number>(exactMatches.map((pair) => pair.prevIndex));
    const matchedNext = new Set<number>(exactMatches.map((pair) => pair.nextIndex));

    for (const nextBlock of nextBlocks) {
      if (matchedNext.has(nextBlock.index)) {
        continue;
      }

      const candidate = findBestBlockCandidate(
        prevBlocks,
        nextBlock,
        matchedPrev,
      );

      if (!candidate) {
        highlightElementAsAdded(nextBlock.element);
        continue;
      }

      matchedPrev.add(candidate.index);
      highlightChangedNode(candidate.element, nextBlock.element, nextDoc);
    }

    return nextDoc.body.innerHTML;
  } catch (err) {
    console.error("DOMParser diff failed, falling back to original html", err);
    return preparedNextHtml;
  }
}

function collectBlockEntries(root: ParentNode): BlockEntry[] {
  return Array.from(root.querySelectorAll(BLOCK_SELECTOR)).map((element, index) => ({
    element,
    tagName: element.tagName.toLowerCase(),
    signature: normaliseElementContent(element),
    index,
  }));
}

function findExactBlockMatches(
  prevBlocks: BlockEntry[],
  nextBlocks: BlockEntry[],
): Array<{ prevIndex: number; nextIndex: number }> {
  const prevSignatures = prevBlocks.map((block) => block.signature);
  const nextSignatures = nextBlocks.map((block) => block.signature);
  const matches: Array<{ prevIndex: number; nextIndex: number }> = [];

  const table: number[][] = Array.from({ length: prevSignatures.length + 1 }, () =>
    Array(nextSignatures.length + 1).fill(0),
  );

  for (let i = prevSignatures.length - 1; i >= 0; i -= 1) {
    for (let j = nextSignatures.length - 1; j >= 0; j -= 1) {
      if (prevSignatures[i] === nextSignatures[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  let i = 0;
  let j = 0;

  while (i < prevSignatures.length && j < nextSignatures.length) {
    if (prevSignatures[i] === nextSignatures[j]) {
      matches.push({ prevIndex: i, nextIndex: j });
      i += 1;
      j += 1;
      continue;
    }

    if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return matches;
}

function findBestBlockCandidate(
  prevBlocks: BlockEntry[],
  nextBlock: BlockEntry,
  matchedPrev: Set<number>,
): BlockEntry | null {
  let bestMatch: BlockEntry | null = null;
  let bestScore = 0;

  for (const prevBlock of prevBlocks) {
    if (matchedPrev.has(prevBlock.index) || prevBlock.tagName !== nextBlock.tagName) {
      continue;
    }

    const score = calculateTextSimilarity(
      prevBlock.element.textContent || "",
      nextBlock.element.textContent || "",
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = prevBlock;
    }
  }

  return bestScore >= 0.45 ? bestMatch : null;
}

function calculateTextSimilarity(prevText: string, nextText: string): number {
  const prevTokens = extractComparableTokens(prevText);
  const nextTokens = extractComparableTokens(nextText);

  if (prevTokens.length === 0 && nextTokens.length === 0) {
    return 1;
  }

  const prevSet = new Set(prevTokens);
  const nextSet = new Set(nextTokens);
  let shared = 0;

  prevSet.forEach((token) => {
    if (nextSet.has(token)) {
      shared += 1;
    }
  });

  return shared / Math.max(prevSet.size, nextSet.size, 1);
}

function extractComparableTokens(text: string): string[] {
  return text.toLowerCase().match(/\p{L}[\p{L}\p{N}_-]*/gu) ?? [];
}

function highlightElementAsAdded(element: Element): void {
  element.classList.add("version-diff-added");
}

function highlightChangedNode(prevNode: Node, nextNode: Node, doc: Document): void {
  if (prevNode.nodeType === Node.TEXT_NODE && nextNode.nodeType === Node.TEXT_NODE) {
    const prevText = prevNode.textContent ?? "";
    const nextText = nextNode.textContent ?? "";

    if (normaliseText(prevText) === normaliseText(nextText)) {
      return;
    }

    const fragment = buildTextDiffFragment(prevText, nextText, doc);
    nextNode.parentNode?.replaceChild(fragment, nextNode);
    return;
  }

  if (prevNode.nodeType !== Node.ELEMENT_NODE || nextNode.nodeType !== Node.ELEMENT_NODE) {
    if (nextNode.nodeType === Node.ELEMENT_NODE) {
      highlightElementAsAdded(nextNode as Element);
    }
    return;
  }

  const prevElement = prevNode as Element;
  const nextElement = nextNode as Element;

  if (prevElement.tagName !== nextElement.tagName) {
    highlightElementAsAdded(nextElement);
    return;
  }

  const prevChildren = Array.from(prevElement.childNodes);
  const nextChildren = Array.from(nextElement.childNodes);
  const maxLength = Math.max(prevChildren.length, nextChildren.length);

  for (let index = 0; index < maxLength; index += 1) {
    const prevChild = prevChildren[index];
    const nextChild = nextChildren[index];

    if (!nextChild) {
      continue;
    }

    if (!prevChild) {
      if (nextChild.nodeType === Node.ELEMENT_NODE) {
        highlightElementAsAdded(nextChild as Element);
      } else {
        const wrapper = doc.createElement("span");
        wrapper.className = "version-diff-inline";
        wrapper.textContent = nextChild.textContent ?? "";
        nextChild.parentNode?.replaceChild(wrapper, nextChild);
      }
      continue;
    }

    if (
      prevChild.nodeType === Node.TEXT_NODE &&
      nextChild.nodeType === Node.TEXT_NODE
    ) {
      highlightChangedNode(prevChild, nextChild, doc);
      continue;
    }

    if (
      prevChild.nodeType === Node.ELEMENT_NODE &&
      nextChild.nodeType === Node.ELEMENT_NODE &&
      (prevChild as Element).tagName === (nextChild as Element).tagName
    ) {
      highlightChangedNode(prevChild, nextChild, doc);
      continue;
    }

    if (normaliseText(prevChild.textContent ?? "") === normaliseText(nextChild.textContent ?? "")) {
      continue;
    }

    if (nextChild.nodeType === Node.ELEMENT_NODE) {
      highlightElementAsAdded(nextChild as Element);
    } else {
      const wrapper = doc.createElement("span");
      wrapper.className = "version-diff-inline";
      wrapper.textContent = nextChild.textContent ?? "";
      nextChild.parentNode?.replaceChild(wrapper, nextChild);
    }
  }
}

function buildTextDiffFragment(prevText: string, nextText: string, doc: Document): DocumentFragment {
  const prevTokens = tokenizeText(prevText);
  const nextTokens = tokenizeText(nextText);
  const matchedNextTokens = getMatchedTokenIndexes(prevTokens, nextTokens);
  const fragment = doc.createDocumentFragment();

  nextTokens.forEach((token, index) => {
    if (/^\s+$/.test(token)) {
      fragment.appendChild(doc.createTextNode(token));
      return;
    }

    if (!matchedNextTokens.has(index)) {
      const span = doc.createElement("span");
      span.className = "version-diff-inline";
      span.textContent = token;
      fragment.appendChild(span);
      return;
    }

    fragment.appendChild(doc.createTextNode(token));
  });

  return fragment;
}

function tokenizeText(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

function getMatchedTokenIndexes(prevTokens: string[], nextTokens: string[]): Set<number> {
  const table: number[][] = Array.from({ length: prevTokens.length + 1 }, () =>
    Array(nextTokens.length + 1).fill(0),
  );

  for (let i = prevTokens.length - 1; i >= 0; i -= 1) {
    for (let j = nextTokens.length - 1; j >= 0; j -= 1) {
      if (prevTokens[i] === nextTokens[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  const matchedIndexes = new Set<number>();
  let i = 0;
  let j = 0;

  while (i < prevTokens.length && j < nextTokens.length) {
    if (prevTokens[i] === nextTokens[j]) {
      matchedIndexes.add(j);
      i += 1;
      j += 1;
      continue;
    }

    if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return matchedIndexes;
}

function normaliseElementContent(el: Element): string {
  const tagName = el.tagName.toLowerCase();
  const innerText = el.textContent || "";
  const normText = normaliseText(innerText);
  return `${tagName}:${normText}`;
}

function normaliseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

interface Props {
  versions: ContractVersion[];
  viewingVersion: ContractVersion;
  paperSize?: PaperSize | string | null;
  onClose: () => void;
  onNavigate: (version: ContractVersion) => void;
}

export function ContractVersionPreviewModal({
  versions,
  viewingVersion,
  paperSize,
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
    return computeHtmlDiff(prevVersion?.content ?? "", viewingVersion.content);
  }, [prevVersion?.content, viewingVersion.content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const firstMark = el.querySelector(".version-diff-added, .version-diff-inline, .version-diff-removed");
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [diffHtml]);

  const hasPrev = prevVersion !== null;
  const hasNext = nextVersion !== null;

  const diffCount = useMemo(() => {
    const tmp = document.createElement("div");
    tmp.innerHTML = diffHtml;
    return tmp.querySelectorAll(".version-diff-added, .version-diff-inline, .version-diff-removed").length;
  }, [diffHtml]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
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

        {prevVersion && (
          <div className="flex items-center gap-4 px-5 py-2 bg-amber-50/60 border-b border-amber-100 shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
              Keterangan:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3.5 rounded bg-emerald-200 border border-emerald-400" />
              <span className="text-[11px] text-gray-600">Konten baru / diubah</span>
            </div>
          </div>
        )}

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

        <div className="flex-1 overflow-y-auto p-8 bg-gray-100/60">
          <div className="w-full overflow-x-auto pb-2">
            <ContractDocumentPreview
              ref={contentRef}
              html={diffHtml}
              paperSize={paperSize}
              className="border border-gray-200 shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
