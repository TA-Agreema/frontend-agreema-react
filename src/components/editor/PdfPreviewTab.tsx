import { Download, Eye, Loader2 } from "lucide-react";

type PdfPreviewTabProps = {
  title?: string;
  previewUrl: string | null;
  filename: string;
  error: string | null;
  isPreparing: boolean;
  loadingDescription: string;
};

export function PdfPreviewTab({
  title = "Preview PDF",
  previewUrl,
  filename,
  error,
  isPreparing,
  loadingDescription,
}: PdfPreviewTabProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <a
              href={previewUrl}
              download={filename}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {isPreparing ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="max-w-sm text-center space-y-3">
            <Loader2 className="h-9 w-9 mx-auto animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-gray-700">
              Menyiapkan PDF...
            </p>
            <p className="text-xs">{loadingDescription}</p>
          </div>
        </div>
      ) : previewUrl ? (
        <iframe
          title={title}
          src={previewUrl}
          className="h-full w-full flex-1 border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="max-w-sm text-center space-y-2">
            <Eye className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm font-medium">Preview PDF belum dibuat</p>
            <p className="text-xs">
              Preview PDF dibuat otomatis saat tab Preview dibuka. File PDF
              tidak disimpan di localStorage dan hanya ditampilkan sementara di
              browser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
