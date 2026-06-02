import type { AxiosResponse } from "axios";

function getFilenameFromDisposition(disposition?: string) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
  }

  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] ?? null;
}

export function downloadBlobResponse(
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
) {
  const filename =
    getFilenameFromDisposition(response.headers["content-disposition"]) ||
    fallbackFilename;
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
