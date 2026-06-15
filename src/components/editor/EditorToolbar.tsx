import type { Dispatch, SetStateAction } from "react";
import type { Editor } from "@tiptap/react";
import { ToolbarDivider } from "@/components/editor/ToolbarBtn";
import { HistoryButtons } from "@/components/editor/HistoryButtons";
import { HeadingButtons } from "@/components/editor/HeadingButtons";
import { FormattingButtons } from "@/components/editor/FormattingButtons";
import { AlignmentButtons } from "@/components/editor/AlignmentButtons";
import { BulletDropdown } from "@/components/editor/BulletDropdown";
import { NumberingDropdown } from "@/components/editor/NumberingDropdown";
import {
  MarginDropdown,
  type MarginStyle,
} from "@/components/editor/MarginDropdown";
import { TableDropdown } from "@/components/editor/TableDropdown";
import { HighlightColorPicker } from "@/components/editor/HighlightColorPicker";
import { TextColorPicker } from "@/components/editor/TextColorPicker";
import {
  FieldInserter,
  type FieldDefinition,
} from "@/components/editor/FieldInserter";
import { LineSpacingToggle } from "@/components/editor/LineSpacingToggle";
import { LinkButton } from "@/components/editor/LinkButton";
import { ImageUploadButton } from "@/components/editor/ImageUploadButton";
import { ImageLayoutControls } from "@/components/editor/ImageLayoutControls";
import { WatermarkButton } from "@/components/editor/WatermarkButton";
import { FontFamilySelector } from "@/components/editor/FontFamilySelector";
import { FontSizeSelector } from "@/components/editor/FontSizeSelector";
import { PaperSizeDropdown } from "@/components/editor/PaperSizeDropdown";
import type { PaperSize } from "@/lib/editor-paper";
import type { WatermarkSettings } from "@/lib/editor-watermark";

type EditorToolbarProps = {
  editor: Editor | null;
  pageMargin: MarginStyle;
  setPageMargin: Dispatch<SetStateAction<MarginStyle>>;
  paperSize: PaperSize;
  setPaperSize: Dispatch<SetStateAction<PaperSize>>;
  disabled?: boolean;
  fields?: FieldDefinition[];
  onAddField?: () => void;
  watermark?: WatermarkSettings;
  setWatermark?: (watermark: WatermarkSettings) => void;
  className?: string;
};

export function EditorToolbar({
  editor,
  pageMargin,
  setPageMargin,
  paperSize,
  setPaperSize,
  disabled = false,
  fields,
  onAddField,
  watermark,
  setWatermark,
  className = "flex items-center gap-0.5 px-3 py-2 border-b bg-muted/20 flex-wrap shrink-0",
}: EditorToolbarProps) {
  return (
    <div className={className}>
      <HistoryButtons editor={editor} disabled={disabled} />
      <ToolbarDivider />
      <HeadingButtons editor={editor} disabled={disabled} />
      <ToolbarDivider />
      <FormattingButtons editor={editor} disabled={disabled} />
      <ToolbarDivider />
      <AlignmentButtons editor={editor} disabled={disabled} />
      <ToolbarDivider />
      <BulletDropdown editor={editor} disabled={disabled} />
      <NumberingDropdown editor={editor} disabled={disabled} />
      <ToolbarDivider />
      <MarginDropdown
        margin={pageMargin}
        setMargin={setPageMargin}
        disabled={disabled}
      />
      <PaperSizeDropdown
        paperSize={paperSize}
        setPaperSize={setPaperSize}
        disabled={disabled}
      />
      {editor && <TableDropdown editor={editor} disabled={disabled} />}
      <HighlightColorPicker editor={editor} disabled={disabled} />
      <TextColorPicker editor={editor} disabled={disabled} />
      {fields && onAddField && (
        <FieldInserter
          editor={editor}
          fields={fields}
          onAddField={onAddField}
          disabled={disabled}
        />
      )}
      <div className="relative ml-1">
        <LineSpacingToggle editor={editor} disabled={disabled} />
      </div>
      <ToolbarDivider />
      <LinkButton editor={editor} disabled={disabled} />
      <ImageUploadButton editor={editor} disabled={disabled} />
      <ImageLayoutControls editor={editor} disabled={disabled} />
      {watermark && setWatermark && (
        <WatermarkButton
          watermark={watermark}
          setWatermark={setWatermark}
          disabled={disabled}
        />
      )}
      <ToolbarDivider />
      <FontFamilySelector editor={editor} disabled={disabled} />
      <FontSizeSelector editor={editor} disabled={disabled} />
    </div>
  );
}
