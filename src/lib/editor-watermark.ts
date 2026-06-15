export type WatermarkSettings = {
  enabled: boolean;
  imageSrc: string | null;
  opacity: number;
  size: number;
  rotation: number;
};

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  enabled: false,
  imageSrc: null,
  opacity: 0.12,
  size: 45,
  rotation: 0,
};

const WATERMARK_SELECTOR = "[data-document-watermark]";

const readNumber = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export function extractWatermarkFromContent(html: string): {
  content: string;
  watermark: WatermarkSettings;
} {
  if (!html) {
    return { content: html, watermark: DEFAULT_WATERMARK_SETTINGS };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const marker = doc.querySelector<HTMLElement>(WATERMARK_SELECTOR);

  const watermark: WatermarkSettings = marker
    ? {
        enabled: marker.dataset.watermarkEnabled === "true",
        imageSrc: marker.dataset.watermarkSrc || null,
        opacity: readNumber(
          marker.dataset.watermarkOpacity,
          DEFAULT_WATERMARK_SETTINGS.opacity,
          0,
          1,
        ),
        size: readNumber(
          marker.dataset.watermarkSize,
          DEFAULT_WATERMARK_SETTINGS.size,
          20,
          90,
        ),
        rotation: readNumber(
          marker.dataset.watermarkRotation,
          DEFAULT_WATERMARK_SETTINGS.rotation,
          -45,
          45,
        ),
      }
    : DEFAULT_WATERMARK_SETTINGS;

  doc.querySelectorAll(WATERMARK_SELECTOR).forEach((node) => node.remove());

  return {
    content: doc.body.innerHTML,
    watermark,
  };
}

export function appendWatermarkToContent(
  html: string,
  watermark: WatermarkSettings,
) {
  const { content } = extractWatermarkFromContent(html);

  if (!watermark.enabled || !watermark.imageSrc) {
    return content;
  }

  const doc = document.implementation.createHTMLDocument("");
  const marker = doc.createElement("div");

  marker.dataset.documentWatermark = "true";
  marker.dataset.watermarkEnabled = "true";
  marker.dataset.watermarkSrc = watermark.imageSrc;
  marker.dataset.watermarkOpacity = String(watermark.opacity);
  marker.dataset.watermarkSize = String(watermark.size);
  marker.dataset.watermarkRotation = String(watermark.rotation);
  marker.setAttribute("style", "display:none");

  return `${content}${marker.outerHTML}`;
}
