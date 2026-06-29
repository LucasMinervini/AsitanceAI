import { describe, it, expect } from 'vitest';
import { TranscribeAudio } from '@application/use-cases/TranscribeAudio';
import type { AudioClip } from '@application/ports/TranscriptionPort';
import { TranscriptionUnavailableError } from '@shared/errors/TranscriptionUnavailableError';
import { FakeTranscription } from '../fakes/FakeTranscription';

const aClip: AudioClip = { uri: 'file:///tmp/grabacion.m4a', mimeType: 'audio/m4a' };

describe('TranscribeAudio', () => {
  it('devuelve el texto transcrito cuando el servicio responde', async () => {
    const transcription = FakeTranscription.thatTranscribes('resumime la reunión de ayer');
    const useCase = new TranscribeAudio(transcription);

    const result = await useCase.execute(aClip);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('resumime la reunión de ayer');
    }
    expect(transcription.receivedClip).toBe(aClip);
  });

  it('propaga TranscriptionUnavailableError cuando el servicio falla', async () => {
    const useCase = new TranscribeAudio(FakeTranscription.thatIsUnavailable());

    const result = await useCase.execute(aClip);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(TranscriptionUnavailableError);
    }
  });
});
