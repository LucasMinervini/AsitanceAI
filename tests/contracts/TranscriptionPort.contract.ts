import { describe, it, expect } from 'vitest';
import type { AudioClip, TranscriptionPort } from '@application/ports/TranscriptionPort';
import { HuggingFaceTranscriptionAdapter } from '@adapters/ai-agents/HuggingFaceTranscriptionAdapter';
import type { BinaryUpload } from '@adapters/ai-agents/http';
import { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';

/**
 * Escenarios que cualquier proveedor de speech-to-text puede presentar. El contrato
 * es agnóstico del transporte; cada adaptador traduce su realidad a estos casos.
 */
type SttScenario =
  | { kind: 'transcribes'; text: string }
  | { kind: 'transportDown' } // no hay conexion (throw)
  | { kind: 'providerError' } // el proveedor responde con estado de error
  | { kind: 'malformed' } // respuesta 200 con forma inesperada
  | { kind: 'empty' }; // 200 pero texto vacio (no se reconocio audio)

const aClip: AudioClip = { uri: 'file:///tmp/grabacion.m4a', mimeType: 'audio/m4a' };

/**
 * Contrato reutilizable del TranscriptionPort. Cuando se agregue otro adaptador
 * (otro proveedor de STT) se invoca esta misma funcion con su factory y debe pasar igual.
 */
function transcriptionContract(
  name: string,
  makeAdapter: (scenario: SttScenario) => TranscriptionPort,
): void {
  describe(`TranscriptionPort: ${name}`, () => {
    it('devuelve el texto transcrito ante un audio valido', async () => {
      const adapter = makeAdapter({ kind: 'transcribes', text: 'hola que tal' });

      const result = await adapter.transcribe(aClip);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('hola que tal');
      }
    });

    it('traduce una caida de transporte a TranscriptionUnavailableError', async () => {
      const adapter = makeAdapter({ kind: 'transportDown' });

      const result = await adapter.transcribe(aClip);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(TranscriptionUnavailableError);
      }
    });

    it('traduce un estado de error del proveedor a TranscriptionUnavailableError', async () => {
      const adapter = makeAdapter({ kind: 'providerError' });

      const result = await adapter.transcribe(aClip);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(TranscriptionUnavailableError);
      }
    });

    it('traduce una respuesta con forma inesperada a TranscriptionUnavailableError', async () => {
      const adapter = makeAdapter({ kind: 'malformed' });

      const result = await adapter.transcribe(aClip);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(TranscriptionUnavailableError);
      }
    });

    it('traduce una transcripción vacía a TranscriptionUnavailableError', async () => {
      const adapter = makeAdapter({ kind: 'empty' });

      const result = await adapter.transcribe(aClip);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(TranscriptionUnavailableError);
      }
    });
  });
}

/** Fake del uploader binario que simula la Inference API de ASR de HuggingFace. */
function huggingFaceSttUpload(scenario: SttScenario): BinaryUpload {
  return async () => {
    switch (scenario.kind) {
      case 'transportDown':
        throw new Error('ECONNREFUSED');
      case 'providerError':
        return { status: 503, body: '{"error":"Model is currently loading"}' };
      case 'malformed':
        return { status: 200, body: '{"unexpected":true}' };
      case 'empty':
        return { status: 200, body: '{"text":"   "}' };
      case 'transcribes':
        return { status: 200, body: JSON.stringify({ text: scenario.text }) };
    }
  };
}

transcriptionContract(
  'HuggingFaceTranscriptionAdapter',
  (scenario) =>
    new HuggingFaceTranscriptionAdapter({
      baseUrl: 'https://api-inference.huggingface.co/models',
      model: 'openai/whisper-large-v3',
      apiKey: 'hf_test_token',
      upload: huggingFaceSttUpload(scenario),
    }),
);
