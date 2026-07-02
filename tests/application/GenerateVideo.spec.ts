import { describe, it, expect } from 'vitest';
import { GenerateVideo } from '@application/use-cases/GenerateVideo';
import { FakeVideoGenerator } from '../fakes/FakeVideoGenerator';
import { GeneratedVideoBuilder } from '../builders/GeneratedVideoBuilder';

describe('GenerateVideo', () => {
  it('devuelve el video generado ante un prompt válido', async () => {
    const video = GeneratedVideoBuilder.aVideo().withUrl('https://cdn/out.mp4').build();
    const generator = FakeVideoGenerator.thatReturns(video);
    const useCase = new GenerateVideo(generator);

    const result = await useCase.execute('un dron sobrevolando montañas');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.url).toBe('https://cdn/out.mp4');
      expect(result.value.mimeType.startsWith('video/')).toBe(true);
    }
    expect(generator.receivedRequest?.prompt).toBe('un dron sobrevolando montañas');
  });

  it('propaga el prompt y la imagen (image-to-video) al generador', async () => {
    const generator = FakeVideoGenerator.thatReturns(GeneratedVideoBuilder.aVideo().build());
    const useCase = new GenerateVideo(generator);

    await useCase.execute('animá esta foto', { dataUrl: 'data:image/png;base64,AAAA' });

    expect(generator.receivedRequest?.image?.dataUrl).toBe('data:image/png;base64,AAAA');
  });

  it('devuelve VideoUnavailableError cuando el generador falla', async () => {
    const useCase = new GenerateVideo(FakeVideoGenerator.thatIsUnavailable());

    const result = await useCase.execute('x');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VIDEO_UNAVAILABLE');
    }
  });
});
