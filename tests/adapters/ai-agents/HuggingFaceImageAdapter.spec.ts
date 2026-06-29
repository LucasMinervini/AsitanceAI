import { describe, it, expect } from 'vitest';
import { HuggingFaceImageAdapter } from '@adapters/ai-agents/HuggingFaceImageAdapter';
import type { ImageDownload } from '@adapters/ai-agents/http';
import { MessageBuilder } from '../../builders/MessageBuilder';

function makeAdapter(download: ImageDownload) {
  return new HuggingFaceImageAdapter({
    baseUrl: 'https://router.huggingface.co/hf-inference/models',
    model: 'black-forest-labs/FLUX.1-schnell',
    apiKey: 'hf_test',
    download,
  });
}

const successDownload = (dataUrl: string): ImageDownload =>
  async () => ({ status: 200, dataUrl, body: '' });

const failDownload: ImageDownload = async () => ({ status: 503, dataUrl: '', body: '{"error":"Service Unavailable"}' });

describe('HuggingFaceImageAdapter', () => {
  it('devuelve mensaje con imageUrl cuando la API responde OK', async () => {
    const dataUrl = 'data:image/jpeg;base64,AAAA';
    const result = await makeAdapter(successDownload(dataUrl)).ask([
      MessageBuilder.aMessage().withText('un paisaje futurista de noche').build(),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe(dataUrl);
      expect(result.value.role).toBe('assistant');
    }
  });

  it('devuelve AgentUnavailableError cuando la API falla (HTTP 503)', async () => {
    const result = await makeAdapter(failDownload).ask([
      MessageBuilder.aMessage().withText('un paisaje').build(),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('503');
      expect(result.error.message).toContain('Service Unavailable');
    }
  });

  it('devuelve AgentUnavailableError si el historial está vacío', async () => {
    const result = await makeAdapter(successDownload('data:image/jpeg;base64,AAAA')).ask([]);

    expect(result.ok).toBe(false);
  });
});
