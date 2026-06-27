import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { MARGIN_PRESETS, type MarginStyle } from "@/components/editor/MarginDropdown";
import {
  getPaperSizeOption,
  normalizePaperSize,
  type PaperSize,
} from "@/lib/editor-paper";
import { extractMarginsFromContent } from "@/lib/editor-margins";
import { extractWatermarkFromContent } from "@/lib/editor-watermark";
import { prepareEditorPreviewHtml } from "@/lib/editor-preview-html";

type ContractDocumentPreviewProps = {
  html: string;
  paperSize?: PaperSize | string | null;
  margin?: MarginStyle;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
};

const DEFAULT_MARGIN = MARGIN_PRESETS[0].value;

export const ContractDocumentPreview = forwardRef<
  HTMLDivElement,
  ContractDocumentPreviewProps
>(
  (
    {
      html,
      paperSize,
      margin,
      className = "",
      contentClassName = "",
      children,
    },
    ref,
  ) => {
    const paper = getPaperSizeOption(normalizePaperSize(paperSize));
    const document = useMemo(() => {
      const extractedMargins = extractMarginsFromContent(html);
      const extractedWatermark = extractWatermarkFromContent(
        extractedMargins.content,
      );

      return {
        html: prepareEditorPreviewHtml(extractedWatermark.content),
        margin: margin ?? extractedMargins.margins ?? DEFAULT_MARGIN,
        watermark: extractedWatermark.watermark,
      };
    }, [html, margin]);

    return (
      <div
        className={`editor-paper editor-paper-continuous mx-auto relative bg-white shadow-sm ${className}`}
        style={
          {
            "--paper-width": paper.width,
            "--paper-height": paper.height,
            "--paper-content-height": `calc(${paper.height} - ${document.margin.top} - ${document.margin.bottom})`,
            width: paper.width,
            minHeight: paper.height,
          } as CSSProperties
        }
        data-paper-size={paper.id}
      >
        {document.watermark.enabled && document.watermark.imageSrc && (
          <div
            className="editor-document-watermark pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <img
              src={document.watermark.imageSrc}
              alt=""
              className="select-none object-contain"
              style={{
                width: `${document.watermark.size}%`,
                opacity: document.watermark.opacity,
                transform: `rotate(${document.watermark.rotation}deg)`,
              }}
            />
          </div>
        )}
        <div
          className="editor-paper-content relative z-10"
          style={{
            paddingTop: document.margin.top,
            paddingBottom: document.margin.bottom,
            paddingLeft: document.margin.left,
            paddingRight: document.margin.right,
          }}
        >
          <div
            ref={ref}
            className={`ProseMirror tiptap-preview tiptap-preview-content text-gray-900 outline-none ${contentClassName}`}
            dangerouslySetInnerHTML={{ __html: document.html }}
          />
        </div>
        {children}
      </div>
    );
  },
);

ContractDocumentPreview.displayName = "ContractDocumentPreview";
