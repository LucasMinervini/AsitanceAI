import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import type { Message } from '@domain/entities/Message';
import { Message as MessageEntity } from '@domain/entities/Message';
import type { Result } from '@shared/result/Result';
import { err, ok } from '@shared/result/Result';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import type { ImageDownload } from './http';

export interface HuggingFaceImageConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly download: ImageDownload;
}

/**
 * Adaptador de generación de imágenes con FLUX vía HuggingFace Inference API.
 * Implementa AssistantAgentPort: recibe el historial, toma el último mensaje del
 * usuario como prompt, llama a la API de texto→imagen y devuelve el resultado como
 * un Message con imageUrl (data URL base64).
 */
export class HuggingFaceImageAdapter implements AssistantAgentPort {
  constructor(private readonly config: HuggingFaceImageConfig) {}

  async ask(history: readonly Message[]): Promise<Result<Message, AgentUnavailableError>> {
    const last = history.at(-1);
    if (last === undefined || last.role !== 'user') {
      return err(new AgentUnavailableError('Sin prompt de usuario para generar la imagen.'));
    }

    const url = `${this.config.baseUrl}/${this.config.model}`;
    try {
      const result = await this.config.download(url, last.text, {
        Authorization: `Bearer ${this.config.apiKey}`,
      });

      if (result.status < 200 || result.status >= 300) {
        const snippet = result.body.slice(0, 300);
        return err(
          new AgentUnavailableError(
            `Generación de imagen falló (HTTP ${result.status})${snippet ? `: ${snippet}` : '.'}`,
          ),
        );
      }

      return ok(
        MessageEntity.create({
          role: 'assistant',
          text: '📷 Imagen generada',
          imageUrl: result.dataUrl,
        }),
      );
    } catch (e) {
      return err(
        new AgentUnavailableError(
          `No se pudo generar la imagen: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );
    }
  }
}
