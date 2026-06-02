import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { Eye, LayoutTemplate } from "lucide-react";
import { EditorModeTabButton } from "@/components/editor/EditorModeTabs";
import { EditorPaper } from "@/components/editor/EditorPaper";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { PaginatedPreview } from "@/components/editor/PaginatedPreview";
import type { MarginStyle } from "@/components/editor/MarginDropdown";
import type { FieldDefinition } from "@/components/editor/FieldInserter";
import type { PaperSize } from "@/lib/editor-paper";

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
  childrenAfterEditor?: ReactNode;
};

function ContractPreviewTab({
  content,
  pageMargin,
  paperSize,
}: {
  content: string;
  pageMargin: MarginStyle;
  paperSize: PaperSize;
}) {
  const isEmpty =
    !content || content === "<p></p>" || content === "<p><br></p>";

  if (isEmpty) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Eye className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm">Belum ada konten untuk di-preview</p>
        </div>
      </div>
    );
  }

  return (
    <PaginatedPreview
      content={content}
      pageMargin={pageMargin}
      paperSize={paperSize}
    />
  );
}

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
  childrenAfterEditor,
}: ContractEditorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ContractEditorTab>("visual");
  const [previewHtml, setPreviewHtml] = useState(editor?.getHTML() ?? "");

  useEffect(() => {
    if (!editor) return;

    const syncPreview = () => setPreviewHtml(editor.getHTML());
    syncPreview();

    editor.on("update", syncPreview);
    return () => {
      editor.off("update", syncPreview);
    };
  }, [editor]);

  useEffect(() => {
    if (activeTab === "preview") {
      setPreviewHtml(editor?.getHTML() ?? "");
    }
  }, [activeTab, editor]);

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
          onClick={() => setActiveTab("preview")}
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
              className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white flex-wrap shrink-0"
            />
            <EditorPaper
              editor={editor}
              pageMargin={pageMargin}
              paperSize={paperSize}
              onDropText={onDropText}
              childrenAfterEditor={childrenAfterEditor}
            />
          </div>
        )}

        {activeTab === "preview" && (
          <ContractPreviewTab
            content={previewHtml}
            pageMargin={pageMargin}
            paperSize={paperSize}
          />
        )}
      </div>
    </div>
  );
}
