// Shared margin helpers used to embed/extract page margin metadata inside
// editor HTML content. The backend PdfContentNormalizer looks for a
// data-document-margin marker and will extract top/bottom/left/right values.

export type MarginStyle = {
  top: string;
  bottom: string;
  left: string;
  right: string;
};

export const DEFAULT_MARGINS: MarginStyle = {
  top: "2.54cm",
  bottom: "2.54cm",
  left: "2.54cm",
  right: "2.54cm",
};

const MARGIN_SELECTOR = "[data-document-margin]";

export function extractMarginsFromContent(html: string): {
  content: string;
  margins: MarginStyle;
} {
  if (!html) {
    return { content: html, margins: DEFAULT_MARGINS };
  }

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const marker = doc.querySelector<HTMLElement>(MARGIN_SELECTOR);

    const margins: MarginStyle = marker
      ? {
          top: marker.getAttribute("data-margin-top") || DEFAULT_MARGINS.top,
          bottom:
            marker.getAttribute("data-margin-bottom") || DEFAULT_MARGINS.bottom,
          left: marker.getAttribute("data-margin-left") || DEFAULT_MARGINS.left,
          right:
            marker.getAttribute("data-margin-right") || DEFAULT_MARGINS.right,
        }
      : DEFAULT_MARGINS;

    doc.querySelectorAll(MARGIN_SELECTOR).forEach((node) => node.remove());

    return {
      content: doc.body.innerHTML,
      margins,
    };
  } catch (e) {
    console.error("Failed to extract margins:", e);
    return { content: html, margins: DEFAULT_MARGINS };
  }
}

export function appendMarginsToContent(
  html: string,
  margins: MarginStyle,
): string {
  const { content } = extractMarginsFromContent(html);

  try {
    const doc = document.implementation.createHTMLDocument("");
    const marker = doc.createElement("div");

    marker.setAttribute("data-document-margin", "true");
    marker.setAttribute("style", "display:none");
    marker.setAttribute("data-margin-top", margins.top);
    marker.setAttribute("data-margin-bottom", margins.bottom);
    marker.setAttribute("data-margin-left", margins.left);
    marker.setAttribute("data-margin-right", margins.right);

    return `${content}${marker.outerHTML}`;
  } catch (e) {
    console.error("Failed to append margins:", e);
    return html;
  }
}
