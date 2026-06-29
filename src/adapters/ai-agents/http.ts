/** Forma minima de una respuesta HTTP. Desacopla los adaptadores de los tipos de fetch/DOM. */
export interface HttpResponseLike {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

/** Cliente HTTP inyectable. En produccion se le pasa el `fetch` global; en tests, un fake. */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<HttpResponseLike>;

/** Resultado mínimo de subir un binario: status HTTP + cuerpo crudo de la respuesta. */
export interface BinaryUploadResult {
  readonly status: number;
  readonly body: string;
}

/**
 * Sube el contenido binario de un archivo local (por su uri) a una URL, como cuerpo
 * crudo del POST. Abstrae `expo-file-system.uploadAsync`: en RN el `fetch` con body
 * `ArrayBuffer`/`Blob` es frágil, así que el adaptador de transcripción delega la
 * subida del audio en esta función. En producción la implementa uploadAsync; en
 * tests, un fake. Mantiene el adaptador desacoplado del módulo nativo y testeable.
 */
export type BinaryUpload = (
  url: string,
  fileUri: string,
  headers: Record<string, string>,
) => Promise<BinaryUploadResult>;

/** Resultado de descargar una imagen generada por IA. */
export interface ImageDownloadResult {
  readonly status: number;
  readonly dataUrl: string;
  /** Cuerpo crudo de la respuesta cuando el status no es 2xx (para diagnóstico). */
  readonly body: string;
}

/**
 * Descarga la imagen generada (respuesta binaria de la API de imagen) y la convierte
 * a una data URL base64. En RN `FileReader.readAsDataURL(blob)` es la vía confiable;
 * la inyectamos para mantener el adapter testeable en Node sin FileReader real.
 */
export type ImageDownload = (
  url: string,
  prompt: string,
  headers: Record<string, string>,
) => Promise<ImageDownloadResult>;
