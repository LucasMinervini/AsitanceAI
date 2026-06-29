import { z } from 'zod';
import type { AudioClip, TranscriptionPort } from '@application/ports/TranscriptionPort';
import { ok, err, type Result } from '@shared/result/Result';
import { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';
import type { BinaryUpload } from './http';

export interface HuggingFaceTranscriptionConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly upload: BinaryUpload;
}

/** DTO de la Inference API de ASR de HuggingFace. Solo nos interesa el texto. */
const AsrResponse = z.object({ text: z.string() });

/** Recorta el cuerpo de error para que el mensaje sea útil pero no enorme. */
function snippet(body: string): string {
  const clean = body.trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean;
}

/**
 * Adaptador de speech-to-text de HuggingFace (Inference API, modelos Whisper).
 * Implementa TranscriptionPort: sube el audio (por su uri) vía el BinaryUpload
 * inyectado, autentica con Bearer token, parsea el DTO con Zod y traduce CUALQUIER
 * fallo (red, estado de error, forma inesperada, transcripción vacía) a
 * TranscriptionUnavailableError. El mensaje incluye status + cuerpo para diagnosticar.
 */
export class HuggingFaceTranscriptionAdapter implements TranscriptionPort {
  constructor(private readonly config: HuggingFaceTranscriptionConfig) {}

  async transcribe(clip: AudioClip): Promise<Result<string, TranscriptionUnavailableError>> {
    let result;
    try {
      result = await this.config.upload(`${this.config.baseUrl}/${this.config.model}`, clip.uri, {
        'Content-Type': clip.mimeType,
        Authorization: `Bearer ${this.config.apiKey}`,
      });
    } catch (e) {
      // Incluimos el detalle del throw: distingue fallo de red, lectura del archivo o
      // CORS, en vez de un genérico que no dice nada al diagnosticar en el celular.
      const detail = e instanceof Error ? e.message : String(e);
      return err(
        new TranscriptionUnavailableError(`No se pudo contactar al servicio de transcripción: ${detail}`),
      );
    }

    if (result.status < 200 || result.status >= 300) {
      return err(
        new TranscriptionUnavailableError(
          `HuggingFace (STT) respondio con estado ${result.status}: ${snippet(result.body)}`,
        ),
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(result.body);
    } catch {
      return err(
        new TranscriptionUnavailableError('La respuesta de transcripción no es JSON válido.'),
      );
    }

    const parsed = AsrResponse.safeParse(raw);
    if (!parsed.success) {
      return err(
        new TranscriptionUnavailableError('La respuesta de transcripción tiene una forma inesperada.'),
      );
    }

    const text = parsed.data.text.trim();
    if (text.length === 0) {
      return err(new TranscriptionUnavailableError('No se reconoció ningún audio (transcripción vacía).'));
    }

    return ok(text);
  }
}
