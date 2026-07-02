import type {
  GeneratedVideo,
  VideoGenerator,
  VideoRequest,
} from '@application/ports/VideoGenerator';
import { err, ok, type Result } from '@shared/result/Result';
import { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';
import type { VideoInference } from './http';

export interface WanVideoConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly videoInference: VideoInference;
}

/**
 * Adaptador de generación de video con la familia Wan-AI vía Inference Providers (fal-ai
 * en el router de HuggingFace). Implementa VideoGenerator: arma el pedido crudo, delega
 * el transporte (encolar + poll + URL del .mp4) en `videoInference` y traduce el
 * resultado a un GeneratedVideo, o los fallos a VideoUnavailableError con status + snippet.
 */
export class WanVideoAdapter implements VideoGenerator {
  constructor(private readonly config: WanVideoConfig) {}

  async generate(request: VideoRequest): Promise<Result<GeneratedVideo, VideoUnavailableError>> {
    const endpoint = `${this.config.baseUrl}/${this.config.model}`;
    try {
      const result = await this.config.videoInference(
        endpoint,
        {
          prompt: request.prompt,
          image: request.image?.dataUrl,
          durationSeconds: request.durationSeconds,
          seed: request.seed,
        },
        { Authorization: `Bearer ${this.config.apiKey}` },
      );

      if (result.status < 200 || result.status >= 300) {
        const snippet = result.body.slice(0, 300);
        return err(
          new VideoUnavailableError(
            `Generación de video falló (HTTP ${result.status})${snippet ? `: ${snippet}` : '.'}`,
          ),
        );
      }

      if (result.url.trim() === '') {
        return err(new VideoUnavailableError('La respuesta no incluye la URL del video.'));
      }

      return ok({
        url: result.url,
        mimeType: result.mimeType ?? 'video/mp4',
        durationSeconds: result.durationSeconds,
      });
    } catch (e) {
      return err(
        new VideoUnavailableError(
          `No se pudo generar el video: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );
    }
  }
}
