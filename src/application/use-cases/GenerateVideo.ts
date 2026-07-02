import type {
  GeneratedVideo,
  ImageInput,
  VideoGenerator,
} from '../ports/VideoGenerator';
import type { Result } from '@shared/result/Result';
import type { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';

/**
 * Use-case: genera un video a partir de un prompt (y opcionalmente una imagen para
 * image-to-video). Recibe el VideoGenerator por constructor (DIP) y delega; propaga
 * VideoUnavailableError vía Result, sin throw.
 */
export class GenerateVideo {
  constructor(private readonly generator: VideoGenerator) {}

  execute(
    prompt: string,
    image?: ImageInput,
  ): Promise<Result<GeneratedVideo, VideoUnavailableError>> {
    return this.generator.generate({ prompt, image });
  }
}
