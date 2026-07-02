import type {
  GeneratedVideo,
  VideoGenerator,
  VideoRequest,
} from '@application/ports/VideoGenerator';
import { ok, err, type Result } from '@shared/result/Result';
import { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';

/**
 * Fake en memoria del VideoGenerator para tests de aceptación y para desarrollar la UI
 * sin llamadas reales. Se configura vía factories según el escenario.
 */
export class FakeVideoGenerator implements VideoGenerator {
  private video: GeneratedVideo | null = null;
  private failure: VideoUnavailableError | null = null;

  /** Request recibido en la última llamada (para aserciones). */
  public receivedRequest: VideoRequest | null = null;

  static thatReturns(video: GeneratedVideo): FakeVideoGenerator {
    const fake = new FakeVideoGenerator();
    fake.video = video;
    return fake;
  }

  static thatIsUnavailable(): FakeVideoGenerator {
    const fake = new FakeVideoGenerator();
    fake.failure = new VideoUnavailableError('El generador de video no está disponible.');
    return fake;
  }

  async generate(request: VideoRequest): Promise<Result<GeneratedVideo, VideoUnavailableError>> {
    this.receivedRequest = request;
    if (this.failure) {
      return err(this.failure);
    }
    if (this.video) {
      return ok(this.video);
    }
    return err(new VideoUnavailableError('Fake sin video configurado.'));
  }
}
