import type { AudioClip, TranscriptionPort } from '@application/ports/TranscriptionPort';
import { ok, err, type Result } from '@shared/result/Result';
import { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';

/**
 * Fake en memoria del TranscriptionPort para los tests de aceptacion.
 * Sin I/O real: se configura via factories segun el escenario.
 */
export class FakeTranscription implements TranscriptionPort {
  private text: string | null = null;
  private failure: TranscriptionUnavailableError | null = null;

  /** Clip que recibio en la ultima llamada a transcribe (para aserciones). */
  public receivedClip: AudioClip | null = null;

  static thatTranscribes(text: string): FakeTranscription {
    const fake = new FakeTranscription();
    fake.text = text;
    return fake;
  }

  static thatIsUnavailable(): FakeTranscription {
    const fake = new FakeTranscription();
    fake.failure = new TranscriptionUnavailableError('El servicio de transcripción no esta disponible.');
    return fake;
  }

  async transcribe(clip: AudioClip): Promise<Result<string, TranscriptionUnavailableError>> {
    this.receivedClip = clip;
    if (this.failure) {
      return err(this.failure);
    }
    if (this.text !== null) {
      return ok(this.text);
    }
    return err(new TranscriptionUnavailableError('Fake sin transcripción configurada.'));
  }
}
