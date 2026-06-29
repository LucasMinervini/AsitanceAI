/**
 * Adjunto elegido por el usuario. `content` es null si el archivo no es texto legible.
 * `previewUri` es opcional y solo presentacional (miniatura de imágenes en el chip): no
 * participa del mensaje que se manda al agente — `composeAttachmentMessage` lo ignora.
 */
export interface Attachment {
  readonly name: string;
  readonly content: string | null;
  readonly previewUri?: string;
}

/**
 * Combina el texto escrito con el adjunto en un único prompt para el agente (que es
 * solo-texto). Logica pura y testeable: la UI elige el archivo, esto arma el mensaje.
 * Para archivos de texto se incluye el contenido; para binarios (imagen, etc.) solo
 * el nombre, a modo de referencia visible en la burbuja.
 */
export function composeAttachmentMessage(text: string, attachment: Attachment | null): string {
  const trimmed = text.trim();
  if (attachment === null) {
    return trimmed;
  }

  const header = `📎 ${attachment.name}`;
  const block =
    attachment.content !== null && attachment.content.trim().length > 0
      ? `${header}\n\n${attachment.content}`
      : header;

  return trimmed.length > 0 ? `${trimmed}\n\n${block}` : block;
}
