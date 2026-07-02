import type { Result } from '@shared/result/Result';
import type { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';

/** Imagen de entrada (data URL base64) — mismo formato que hoy usa Message.imageUrl. */
export interface ImageInput {
  readonly dataUrl: string;
}

/** Pedido de generación de video. `image` presente → image-to-video. */
export interface VideoRequest {
  readonly prompt: string;
  readonly image?: ImageInput;
  readonly durationSeconds?: number;
  readonly seed?: number;
}

/** Entregable: la URL del video (remota temporal o data URL) + su mime type. */
export interface GeneratedVideo {
  readonly url: string;
  readonly mimeType: string; // 'video/mp4'
  readonly posterUrl?: string;
  readonly durationSeconds?: number;
}

/**
 * Port de salida hacia un generador de video por texto. Expresa el QUE necesita la app
 * (dado un prompt, devolver un video), nunca el COMO. Cada adaptador (Wan, Hunyuan,
 * AnimateDiff, ...) lo implementa y traduce sus fallos a VideoUnavailableError.
 */
export interface VideoGenerator {
  generate(request: VideoRequest): Promise<Result<GeneratedVideo, VideoUnavailableError>>;
}
