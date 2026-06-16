import { useRef, type CSSProperties, type ReactNode } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import { getPaperSizeOption, type PaperSize } from "@/lib/editor-paper";
import { useVisualPagination } from "@/hooks/use-visual-pagination";

type EditorPaperProps = {
  editor: Editor | null;
  pageMargin: MarginStyle;
  paperSize: PaperSize;
  childrenAfterEditor?: ReactNode;
  onDropText?: (text: string) => void;
};

export function EditorPaper({
  editor,
  pageMargin,
  paperSize,
  childrenAfterEditor,
  onDropText,
}: EditorPaperProps) {
  const paper = getPaperSizeOption(paperSize);
  const paperRef = useRef<HTMLDivElement | null>(null);
  useVisualPagination({
    editor,
    paperRef,
    pageMargin,
    paperSize,
  });

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#f3f4f6] px-6 py-8"
      onDragOver={onDropText ? (event) => event.preventDefault() : undefined}
      onDrop={
        onDropText
          ? (event) => {
              event.preventDefault();
              const text = event.dataTransfer.getData("text/plain");
              if (text) onDropText(text);
            }
          : undefined
      }
    >
      <div
        ref={paperRef}
        className="editor-paper editor-paper-continuous mx-auto flex flex-col relative"
        style={{
          "--paper-width": paper.width,
          "--paper-height": paper.height,
          width: paper.width,
          minHeight: paper.height,
        } as CSSProperties}
        data-paper-size={paper.id}
      >
        <div
          className="editor-paper-content flex-1"
          style={{
            paddingTop: pageMargin.top,
            paddingBottom: pageMargin.bottom,
            paddingLeft: pageMargin.left,
            paddingRight: pageMargin.right,
          }}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>
        {childrenAfterEditor}
      </div>
    </div>
  );
}
