export type PaperSize = "a4" | "f4";

export const PAPER_SIZE_OPTIONS: Array<{
  id: PaperSize;
  label: string;
  width: string;
  height: string;
}> = [
  { id: "a4", label: "A4", width: "21cm", height: "29.7cm" },
  { id: "f4", label: "F4", width: "21.5cm", height: "33cm" },
];

export const DEFAULT_PAPER_SIZE: PaperSize = "a4";
export const EDITOR_PAGE_GAP_PX = 10;

export function getPaperSizeOption(size: PaperSize) {
  return (
    PAPER_SIZE_OPTIONS.find((option) => option.id === size) ??
    PAPER_SIZE_OPTIONS.find((option) => option.id === DEFAULT_PAPER_SIZE)!
  );
}

export function normalizePaperSize(value?: string | null): PaperSize {
  return value === "a4" || value === "f4" ? value : DEFAULT_PAPER_SIZE;
}
