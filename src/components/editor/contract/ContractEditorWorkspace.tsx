import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { Eye, LayoutTemplate } from "lucide-react";
import { EditorModeTabButton } from "@/components/editor/EditorModeTabs";
import { EditorPaper } from "@/components/editor/EditorPaper";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { PdfPreviewTab } from "@/components/editor/PdfPreviewTab";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import type { FieldDefinition } from "@/components/editor/FieldInserter";
import type { PaperSize } from "@/lib/editor-paper";
import type { WatermarkSettings } from "@/lib/editor-watermark";

type ContractEditorTab = "visual" | "preview";

type ContractEditorWorkspaceProps = {
  editor: Editor | null;
  pageMargin: MarginStyle;
  setPageMargin: React.Dispatch<React.SetStateAction<MarginStyle>>;
  paperSize: PaperSize;
  setPaperSize: React.Dispatch<React.SetStateAction<PaperSize>>;
  disabled?: boolean;
  fields: FieldDefinition[];
  onAddField: () => void;
  onDropText: (text: string) => void;
  watermark: WatermarkSettings;
  setWatermark: (watermark: WatermarkSettings) => void;
  pdfPreviewUrl: string | null;
  pdfPreviewFilename: string;
  pdfPreviewError: string | null;
  isPreparingPdfPreview: boolean;
  onSaveAndPreviewPdf: () => Promise<void>;
  childrenAfterEditor?: ReactNode;
};

export function ContractEditorWorkspace({
  editor,
  pageMargin,
  setPageMargin,
  paperSize,
  setPaperSize,
  disabled = false,
  fields,
  onAddField,
  onDropText,
  watermark,
  setWatermark,
  pdfPreviewUrl,
  pdfPreviewFilename,
  pdfPreviewError,
  isPreparingPdfPreview,
  onSaveAndPreviewPdf,
  childrenAfterEditor,
}: ContractEditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ContractEditorTab>("visual");

  const handleOpenPreviewTab = () => {
    setActiveTab("preview");
    if (!isPreparingPdfPreview) {
      void onSaveAndPreviewPdf();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex items-center w-full border-b bg-card shrink-0">
        <EditorModeTabButton
          active={activeTab === "visual"}
          onClick={() => setActiveTab("visual")}
          icon={<LayoutTemplate className="h-3.5 w-3.5" />}
          label="Editor Visual"
        />
        <EditorModeTabButton
          active={activeTab === "preview"}
          onClick={handleOpenPreviewTab}
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Preview"
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {activeTab === "visual" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <EditorToolbar
              editor={editor}
              pageMargin={pageMargin}
              setPageMargin={setPageMargin}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
              disabled={disabled}
              fields={fields}
              onAddField={onAddField}
              watermark={watermark}
              setWatermark={setWatermark}
              className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white flex-wrap shrink-0"
            />
            <EditorPaper
              editor={editor}
              pageMargin={pageMargin}
              paperSize={paperSize}
              onDropText={onDropText}
              watermark={watermark}
              childrenAfterEditor={childrenAfterEditor}
            />
          </div>
        )}

        {activeTab === "preview" && (
          <PdfPreviewTab
            title="Preview PDF Kontrak"
            previewUrl={pdfPreviewUrl}
            filename={pdfPreviewFilename}
            error={pdfPreviewError}
            isPreparing={isPreparingPdfPreview}
            loadingDescription="Sistem sedang menyimpan draft dan membuat preview dari renderer PDF backend."
          />
        )}
      </div>
    </div>
  );
}
