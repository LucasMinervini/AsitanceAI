import { describe, it, expect } from 'vitest';
import type { VideoGenerator } from '@application/ports/VideoGenerator';
import { WanVideoAdapter } from '@adapters/ai-agents/WanVideoAdapter';
import type { VideoInference } from '@adapters/ai-agents/http';
import { VideoUnavailableError } from '@shared/errors/VideoUnavailableError';

/**
 * Escenarios que cualquier proveedor de video puede presentar. El contrato es agnóstico
 * del transporte; cada adaptador (Wan, Hunyuan, AnimateDiff, Mochi, ...) lo traduce igual.
 */
type VideoScenario =
  | { kind: 'replies'; url: string }
  | { kind: 'transportDown' } // no hay conexión (throw)
  | { kind: 'providerError' } // el proveedor responde con estado de error
  | { kind: 'malformed' }; // 200 pero sin URL de video

/**
 * Contrato reutilizable del VideoGenerator. Agregar un adapter nuevo = una línea al final
 * con su factory; debe pasar idéntico y garantizar el formato que espera la UI.
 */
function videoGeneratorContract(
  name: string,
  makeGenerator: (scenario: VideoScenario) => VideoGenerator,
): void {
  describe(`VideoGenerator: ${name}`, () => {
    it('devuelve un GeneratedVideo renderizable por la UI (url + mimeType video/*)', async () => {
      const generator = makeGenerator({ kind: 'replies', url: 'https://cdn.fake/out.mp4' });

      const result = await generator.generate({ prompt: 'un gato surfeando' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.url).toBe('https://cdn.fake/out.mp4');
        expect(result.value.mimeType.startsWith('video/')).toBe(true);
      }
    });

    it('traduce una caída de transporte a VideoUnavailableError', async () => {
      const generator = makeGenerator({ kind: 'transportDown' });

      const result = await generator.generate({ prompt: 'x' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VideoUnavailableError);
      }
    });

    it('traduce un estado de error del proveedor a VideoUnavailableError', async () => {
      const generator = makeGenerator({ kind: 'providerError' });

      const result = await generator.generate({ prompt: 'x' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VideoUnavailableError);
      }
    });

    it('traduce una respuesta sin URL de video a VideoUnavailableError', async () => {
      const generator = makeGenerator({ kind: 'malformed' });

      const result = await generator.generate({ prompt: 'x' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VideoUnavailableError);
      }
    });
  });
}

/** Fake del transporte de video según el escenario (sin red). */
function wanInference(scenario: VideoScenario): VideoInference {
  return async () => {
    switch (scenario.kind) {
      case 'transportDown':
        throw new Error('ECONNREFUSED');
      case 'providerError':
        return { status: 503, url: '', body: 'service unavailable' };
      case 'malformed':
        return { status: 200, url: '', body: '' };
      case 'replies':
        return { status: 200, url: scenario.url, mimeType: 'video/mp4', body: '' };
    }
  };
}

videoGeneratorContract(
  'WanVideoAdapter',
  (scenario) =>
    new WanVideoAdapter({
      baseUrl: 'https://router.huggingface.co/fal-ai',
      model: 'Wan-AI/Wan2.1-T2V-1.3B',
      apiKey: 'hf_test_token',
      videoInference: wanInference(scenario),
    }),
);
