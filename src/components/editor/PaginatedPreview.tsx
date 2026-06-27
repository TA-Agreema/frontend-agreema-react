import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import { getPaperSizeOption, type PaperSize } from "@/lib/editor-paper";
import { applyPreviewImageLayout } from "@/lib/editor-preview-html";

type PaginatedPreviewProps = {
  content: string;
  pageMargin: MarginStyle;
  paperSize: PaperSize;
};

type PageBlock = {
  key: string;
  html: string;
};

const joinPageHtml = (page: PageBlock[]) =>
  page.map((block) => block.html).join("");

function createTableRowBlocks(element: HTMLElement, index: number) {
  const table = element.matches("table")
    ? element
    : element.querySelector("table");

  if (!(table instanceof HTMLTableElement)) return null;

  const rows = Array.from(table.rows);
  if (rows.length === 0) return null;

  return rows.map((row, rowIndex) => {
    const tableClone = table.cloneNode(false) as HTMLTableElement;
    const colgroup = table.querySelector("colgroup");

    if (colgroup) {
      tableClone.appendChild(colgroup.cloneNode(true));
    }

    const tbody = document.createElement("tbody");
    tbody.appendChild(row.cloneNode(true));
    tableClone.appendChild(tbody);
    tableClone.classList.add("paginated-table-fragment");
    tableClone.dataset.previewTableFragment = "true";

    if (element !== table) {
      const wrapper = element.cloneNode(false) as HTMLElement;
      wrapper.classList.add("paginated-table-fragment-wrapper");
      wrapper.appendChild(tableClone);

      return {
        key: `${index}-table-row-${rowIndex}`,
        html: wrapper.outerHTML,
      };
    }

    return {
      key: `${index}-table-row-${rowIndex}`,
      html: tableClone.outerHTML,
    };
  });
}

function splitTopLevelBlocks(content: string): PageBlock[] {
  const template = document.createElement("template");
  template.innerHTML = content;
  applyPreviewImageLayout(template.content);

  return Array.from(template.content.childNodes)
    .flatMap((node, index) => {
      if (node instanceof HTMLElement) {
        const tableRows = createTableRowBlocks(node, index);
        if (tableRows) return tableRows;

        return { key: `${index}-${node.nodeName}`, html: node.outerHTML };
      }

      const text = node.textContent?.trim();
      if (!text) return [];

      return { key: `${index}-text`, html: `<p>${text}</p>` };
    })
    .filter((block): block is PageBlock => Boolean(block));
}

function measureCssLength(value: string, container: HTMLElement) {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.height = value;
  container.appendChild(probe);

  const height = probe.getBoundingClientRect().height;
  probe.remove();

  return height;
}

export function PaginatedPreview({
  content,
  pageMargin,
  paperSize,
}: PaginatedPreviewProps) {
  const paper = getPaperSizeOption(paperSize);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const blocks = useMemo(() => splitTopLevelBlocks(content), [content]);
  const [pages, setPages] = useState<PageBlock[][]>([blocks]);

  useLayoutEffect(() => {
    const measureElement = measureRef.current;
    if (!measureElement) return;

    const paperHeight = measureCssLength(paper.height, measureElement);
    const topMargin = measureCssLength(pageMargin.top, measureElement);
    const bottomMargin = measureCssLength(pageMargin.bottom, measureElement);
    const contentHeight = Math.max(0, paperHeight - topMargin - bottomMargin);
    const measuredBlocks = Array.from(measureElement.children) as HTMLElement[];
    const nextPages: PageBlock[][] = [[]];
    let usedHeight = 0;

    blocks.forEach((block, index) => {
      const measured = measuredBlocks[index];
      const blockHeight = measured?.getBoundingClientRect().height ?? 0;
      const isManualPageBreak = Boolean(
        measured?.querySelector(".page-break") ||
        measured?.classList.contains("page-break"),
      );
      const currentPage = nextPages[nextPages.length - 1];

      if (
        currentPage.length > 0 &&
        (isManualPageBreak || usedHeight + blockHeight > contentHeight)
      ) {
        nextPages.push([]);
        usedHeight = 0;
      }

      if (!isManualPageBreak) {
        nextPages[nextPages.length - 1].push(block);
        usedHeight += blockHeight;
      }
    });

    setPages(nextPages.filter((page) => page.length > 0));
  }, [blocks, imageVersion, pageMargin, paper.height]);

  useEffect(() => {
    const measureElement = measureRef.current;
    if (!measureElement) return;

    const images = Array.from(measureElement.querySelectorAll("img"));
    const handleImageLoad = () => setImageVersion((value) => value + 1);

    images.forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", handleImageLoad);
      image.addEventListener("error", handleImageLoad);
    });

    if (images.some((image) => image.complete)) {
      handleImageLoad();
    }

    return () => {
      images.forEach((image) => {
        image.removeEventListener("load", handleImageLoad);
        image.removeEventListener("error", handleImageLoad);
      });
    };
  }, [content]);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [content, pageMargin, paperSize]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, left: 0 });
      window.scrollTo({ top: 0, left: 0 });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pages.length, content]);

  const paperStyle = {
    "--paper-width": paper.width,
    "--paper-height": paper.height,
    "--paper-content-height": `calc(${paper.height} - ${pageMargin.top} - ${pageMargin.bottom})`,
    width: paper.width,
    height: paper.height,
  } as CSSProperties;

  const contentStyle = {
    paddingTop: pageMargin.top,
    paddingBottom: pageMargin.bottom,
    paddingLeft: pageMargin.left,
    paddingRight: pageMargin.right,
  };

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-y-auto bg-[#f3f4f6] px-6 py-8">
      <div
        className="absolute pointer-events-none invisible"
        style={{ top: "-10000px", left: "-10000px" }}>
        <div
          ref={measureRef}
          className="ProseMirror tiptap-preview tiptap-preview-content"
          style={{
            width: `calc(${paper.width} - ${pageMargin.left} - ${pageMargin.right})`,
            minHeight: 0,
          }}
          dangerouslySetInnerHTML={{ __html: joinPageHtml(blocks) }}
        />
      </div>

      <div className="space-y-8">
        {(pages.length > 0 ? pages : [blocks]).map((page, index) => (
          <div
            key={index}
            className="editor-paper editor-paper-preview-page mx-auto flex flex-col relative"
            style={paperStyle}
            data-paper-size={paper.id}>
            <div className="editor-paper-content flex-1" style={contentStyle}>
              <div
                className="ProseMirror tiptap-preview tiptap-preview-content"
                dangerouslySetInnerHTML={{ __html: joinPageHtml(page) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
