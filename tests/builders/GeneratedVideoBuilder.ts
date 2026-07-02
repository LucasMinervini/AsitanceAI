import type { GeneratedVideo } from '@application/ports/VideoGenerator';

/**
 * Test Data Builder para GeneratedVideo. Crea salidas válidas por defecto,
 * sobreescribiendo solo lo relevante para cada test.
 *   GeneratedVideoBuilder.aVideo().withUrl('…').withMime('video/webm').build()
 */
export class GeneratedVideoBuilder {
  private url = 'https://cdn.example/video.mp4';
  private mimeType = 'video/mp4';
  private durationSeconds: number | undefined = undefined;

  static aVideo(): GeneratedVideoBuilder {
    return new GeneratedVideoBuilder();
  }

  withUrl(url: string): this {
    this.url = url;
    return this;
  }

  withMime(mimeType: string): this {
    this.mimeType = mimeType;
    return this;
  }

  withDuration(seconds: number): this {
    this.durationSeconds = seconds;
    return this;
  }

  build(): GeneratedVideo {
    return { url: this.url, mimeType: this.mimeType, durationSeconds: this.durationSeconds };
  }
}
