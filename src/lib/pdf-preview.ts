const INVALID_FILENAME_CHARS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);

export function createPdfPreviewFilename(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .split("")
    .filter(
      (char) => char.charCodeAt(0) >= 32 && !INVALID_FILENAME_CHARS.has(char),
    )
    .join("")
    .replace(/\s+/g, " ");

  return `${cleaned || fallback}.pdf`;
}
