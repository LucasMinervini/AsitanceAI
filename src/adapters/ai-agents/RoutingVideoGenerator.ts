import type {
  GeneratedVideo,
  VideoGenerator,
  VideoRequest,
} from '@application/ports/VideoGenerator';
import type { Result } from '@shared/result/Result';
import type { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';

/**
 * Generador que enruta a uno de varios modelos de video según el seleccionado.
 * Implementa VideoGenerator (transparente para el use-case) y permite cambiar el
 * destino en runtime vía select(). Genérico sobre la clave para no acoplarse a la
 * lista concreta de modelos (definida en infrastructure). Mirror de RoutingAssistantAgent.
 */
export class RoutingVideoGenerator<K extends string> implements VideoGenerator {
  private current: K;

  constructor(
    private readonly generators: Readonly<Record<K, VideoGenerator>>,
    initial: NoInfer<K>,
  ) {
    this.current = initial;
  }

  get available(): readonly K[] {
    return Object.keys(this.generators) as K[];
  }

  get selected(): K {
    return this.current;
  }

  select(model: K): void {
    if (model in this.generators) {
      this.current = model;
    }
  }

  generate(request: VideoRequest): Promise<Result<GeneratedVideo, VideoUnavailableError>> {
    return this.generators[this.current].generate(request);
  }
}
