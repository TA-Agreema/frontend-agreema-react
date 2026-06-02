import { useLayoutEffect, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import { EDITOR_PAGE_GAP_PX, type PaperSize } from "@/lib/editor-paper";

type PaginationOptions = {
  editor: Editor | null;
  paperRef: RefObject<HTMLDivElement | null>;
  pageMargin: MarginStyle;
  paperSize: PaperSize;
};

function getPaperHeight(paperElement: HTMLElement) {
  const label = paperElement.querySelector<HTMLElement>(
    ".editor-paper-page-label",
  );

  return label?.getBoundingClientRect().height ?? 0;
}

function calculatePageCount(paperElement: HTMLDivElement) {
  const editorElement = paperElement.querySelector<HTMLElement>(".ProseMirror");
  const paperHeight = getPaperHeight(paperElement);

  if (!editorElement || paperHeight <= 0) return 1;

  const pageStride = paperHeight + EDITOR_PAGE_GAP_PX;
  const contentBottom =
    editorElement.getBoundingClientRect().bottom -
    paperElement.getBoundingClientRect().top;

  return Math.max(1, Math.ceil(contentBottom / pageStride));
}

export function useVisualPagination({
  editor,
  paperRef,
  pageMargin,
  paperSize,
}: PaginationOptions) {
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    const paperElement = paperRef.current;
    if (!paperElement || !editor) return;

    let frameId = 0;

    const schedulePagination = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setPageCount(calculatePageCount(paperElement));
      });
    };

    schedulePagination();

    editor.on("update", schedulePagination);
    const resizeObserver = new ResizeObserver(schedulePagination);
    resizeObserver.observe(paperElement);

    const editorElement =
      paperElement.querySelector<HTMLElement>(".ProseMirror");

    if (editorElement) {
      resizeObserver.observe(editorElement);
    }
    window.addEventListener("resize", schedulePagination);

    return () => {
      cancelAnimationFrame(frameId);
      editor.off("update", schedulePagination);
      resizeObserver.disconnect();
      window.removeEventListener("resize", schedulePagination);
    };
  }, [editor, pageMargin, paperRef, paperSize]);

  return { pageCount };
}
