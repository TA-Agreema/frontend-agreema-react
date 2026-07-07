import { useCallback, useEffect, useRef, useState } from "react";

type GeneratedPdf = {
  blob: Blob;
  filename: string;
};

type UsePdfPreviewOptions = {
  createSignature: () => string;
  generatePdf: () => Promise<GeneratedPdf | undefined>;
  getErrorMessage: (error: unknown) => string;
  cacheKey?: string;
};

const pdfPreviewCache = new Map<string, GeneratedPdf>();

export function usePdfPreview({
  createSignature,
  generatePdf,
  getErrorMessage,
  cacheKey = "pdf-preview",
}: UsePdfPreviewOptions) {
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("preview.pdf");
  const [previewSignature, setPreviewSignature] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);
  const preparePreview = useCallback(async () => {
    if (isPreparingPreview) return;
    const currentSignature = createSignature();
    const currentCacheKey = `${cacheKey}:${currentSignature}`;
    if (previewUrlRef.current && previewSignature === currentSignature) {
      setPreviewError(null);
      return;
    }
    const cachedPreview = pdfPreviewCache.get(currentCacheKey);
    if (cachedPreview) {
      const cachedUrl = URL.createObjectURL(cachedPreview.blob);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      previewUrlRef.current = cachedUrl;
      setPreviewUrl(cachedUrl);
      setPreviewFilename(cachedPreview.filename);
      setPreviewSignature(currentSignature);
      setPreviewError(null);
      return;
    }

    setIsPreparingPreview(true);
    setPreviewError(null);

    try {
      const generated = await generatePdf();
      if (!generated) return;

      const nextUrl = URL.createObjectURL(generated.blob);
      pdfPreviewCache.set(currentCacheKey, generated);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      previewUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
      setPreviewFilename(generated.filename);
      setPreviewSignature(currentSignature);
    } catch (error) {
      setPreviewError(getErrorMessage(error));
    } finally {
      setIsPreparingPreview(false);
    }
  }, [
    cacheKey,
    createSignature,
    generatePdf,
    getErrorMessage,
    isPreparingPreview,
    previewSignature,
  ]);

  return {
    previewUrl,
    previewFilename,
    previewError,
    isPreparingPreview,
    preparePreview,
  };
}
