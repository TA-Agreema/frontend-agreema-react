import mammoth from "mammoth";

const DOCX_STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Judul'] => h1:fresh",
  "p[style-name='Subtitle'] => p.docx-subtitle:fresh",
  "p[style-name='Subjudul'] => p.docx-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h3:fresh",
  "p[style-name='Judul 1'] => h1:fresh",
  "p[style-name='Judul 2'] => h2:fresh",
  "p[style-name='Judul 3'] => h3:fresh",
  "p[style-name='Judul 4'] => h3:fresh",
  "p[style-name='Normal'] => p:fresh",
  "p[style-name='Body Text'] => p:fresh",
  "p[style-name='Teks Isi'] => p:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",
  "p[style-name='Kutipan'] => blockquote:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Subtle Emphasis'] => em",
];

const ALIGNABLE_BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,blockquote,li";

type MammothElement = {
  type?: string;
  alignment?: string | null;
  children?: MammothElement[];
  value?: string;
};

function normalizeWordAlignment(alignment?: string | null) {
  switch (alignment) {
    case "center":
      return "center";
    case "right":
    case "end":
      return "right";
    case "both":
    case "distribute":
      return "justify";
    case "left":
    case "start":
      return "left";
    default:
      return null;
  }
}

function hasRenderableContent(element: MammothElement): boolean {
  if (element.type === "text") return Boolean(element.value?.trim());
  if (element.type === "image" || element.type === "tab") return true;
  return Boolean(element.children?.some(hasRenderableContent));
}

function collectParagraphAlignments(
  element: MammothElement,
  alignments: Array<string | null>,
) {
  if (element.type === "paragraph" && hasRenderableContent(element)) {
    alignments.push(normalizeWordAlignment(element.alignment));
  }

  element.children?.forEach((child) =>
    collectParagraphAlignments(child, alignments),
  );
}

function applyParagraphAlignments(
  html: string,
  alignments: Array<string | null>,
) {
  if (!html.trim() || typeof DOMParser === "undefined") return html;

  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks = Array.from(
    document.body.querySelectorAll<HTMLElement>(ALIGNABLE_BLOCK_SELECTOR),
  );

  blocks.forEach((block, index) => {
    const alignment = alignments[index];
    if (alignment) {
      block.style.textAlign = alignment;
    }
  });

  return document.body.innerHTML;
}

export async function convertDocxToEditorHtml(arrayBuffer: ArrayBuffer) {
  const paragraphAlignments: Array<string | null> = [];
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: DOCX_STYLE_MAP,
      includeDefaultStyleMap: true,
      transformDocument: (document) => {
        collectParagraphAlignments(document, paragraphAlignments);
        return document;
      },
      convertImage: mammoth.images.imgElement((image) => {
        return image.read("base64").then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }));
      }),
    },
  );
  return applyParagraphAlignments(result.value, paragraphAlignments);
}
