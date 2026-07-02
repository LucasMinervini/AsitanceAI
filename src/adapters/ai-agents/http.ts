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

/** Pedido crudo de generación de video que recibe el transporte. */
export interface VideoInferenceRequest {
  readonly prompt: string;
  readonly image?: string; // data URL, para image-to-video
  readonly durationSeconds?: number;
  readonly seed?: number;
}

/** Resultado de generar un video: status + URL del .mp4 (o '' si falló) + cuerpo crudo. */
export interface VideoInferenceResult {
  readonly status: number;
  readonly url: string;
  readonly mimeType?: string;
  readonly durationSeconds?: number;
  /** Cuerpo crudo de la respuesta cuando el status no es 2xx (para diagnóstico). */
  readonly body: string;
}

/**
 * Genera un video (POST del prompt → normalmente encolar + poll en fal-ai → URL del
 * .mp4). La generación de video es asíncrona y frágil sobre `fetch` directo, así que el
 * adaptador delega el transporte en esta función inyectable: la impl de runtime vive en
 * `App.tsx`, los tests pasan un fake — manteniendo el adapter testeable en Node sin red.
 */
export type VideoInference = (
  url: string,
  request: VideoInferenceRequest,
  headers: Record<string, string>,
) => Promise<VideoInferenceResult>;
