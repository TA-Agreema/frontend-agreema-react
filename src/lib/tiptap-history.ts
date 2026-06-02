import type { Editor } from "@tiptap/react";
import type { Content } from "@tiptap/core";
import { createDocument } from "@tiptap/core";

export function setEditorContentWithoutHistory(
  editor: Editor | null,
  content: Content,
) {
  if (!editor) return;

  const document = createDocument(content, editor.schema, {}, {
    errorOnInvalidContent: editor.options.enableContentCheck,
  });

  const transaction = editor.state.tr
    .replaceWith(0, editor.state.doc.content.size, document)
    .setMeta("addToHistory", false)
    .setMeta("preventUpdate", true);

  editor.view.dispatch(transaction);
}
