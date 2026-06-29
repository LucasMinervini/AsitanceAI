import type { AudioClip, TranscriptionPort } from '@application/ports/TranscriptionPort';
import type { Result } from '@shared/result/Result';
import type { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';

/**
 * Use-case: convierte un clip de audio en texto delegando en el TranscriptionPort.
 * La UI lo invoca para llenar el input con lo dictado (sin tocar el dominio: una nota
 * de voz transcrita es, al final, un prompt de texto más). Recibe el Port por
 * constructor (DIP); el error de transcripción queda en la firma vía Result.
 */
export class TranscribeAudio {
  constructor(private readonly transcription: TranscriptionPort) {}

  execute(clip: AudioClip): Promise<Result<string, TranscriptionUnavailableError>> {
    return this.transcription.transcribe(clip);
  }
}
