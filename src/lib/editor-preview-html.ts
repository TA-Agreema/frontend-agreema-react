export function applyPreviewImageLayout(root: ParentNode) {
  root.querySelectorAll("img").forEach((image) => {
    const containerStyle = image.getAttribute("containerstyle");
    const wrapperStyle = image.getAttribute("wrapperstyle");
    const hasResizeLayout = Boolean(containerStyle || wrapperStyle);

    if (!hasResizeLayout || image.closest("[data-preview-image-wrapper]")) {
      return;
    }

    const wrapper = document.createElement("span");
    const container = document.createElement("span");
    const previewImage = image.cloneNode(true) as HTMLImageElement;

    wrapper.dataset.previewImageWrapper = "true";
    container.dataset.previewImageContainer = "true";
    previewImage.dataset.previewImageLayout = "true";

    wrapper.setAttribute("style", wrapperStyle || "display: flex; margin: 0;");
    container.setAttribute(
      "style",
      containerStyle || previewImage.getAttribute("style") || "",
    );
    previewImage.removeAttribute("containerstyle");
    previewImage.removeAttribute("wrapperstyle");

    container.appendChild(previewImage);
    wrapper.appendChild(container);
    image.replaceWith(wrapper);
  });
}

export function prepareEditorPreviewHtml(html: string) {
  if (!html) return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  applyPreviewImageLayout(template.content);

  return template.innerHTML;
}
