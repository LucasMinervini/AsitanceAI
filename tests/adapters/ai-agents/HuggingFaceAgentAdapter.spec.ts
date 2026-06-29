import { describe, it, expect } from 'vitest';
import { HuggingFaceAgentAdapter } from '@adapters/ai-agents/HuggingFaceAgentAdapter';
import type { FetchLike, HttpResponseLike } from '@adapters/ai-agents/http';
import { MessageBuilder } from '../../builders/MessageBuilder';

/** Forma del body que arma el adapter (solo lo que necesitamos para las aserciones). */
interface RequestBody {
  readonly model: string;
  readonly messages: readonly { readonly role: string; readonly content: unknown }[];
}

function okResponse(): HttpResponseLike {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
  };
}

/** fetchFn que captura el body enviado para inspeccionarlo. */
function capturingFetch(sink: { body?: RequestBody }): FetchLike {
  return async (_url, init) => {
    sink.body = JSON.parse(init.body) as RequestBody;
    return okResponse();
  };
}

function makeAdapter(fetchFn: FetchLike): HuggingFaceAgentAdapter {
  return new HuggingFaceAgentAdapter({
    baseUrl: 'https://router.huggingface.co/v1',
    model: 'google/gemma-3-12b-it',
    apiKey: 'hf_test',
    fetchFn,
  });
}

describe('HuggingFaceAgentAdapter (visión)', () => {
  it('manda el contenido como texto plano cuando el mensaje no tiene imagen', async () => {
    const sink: { body?: RequestBody } = {};
    await makeAdapter(capturingFetch(sink)).ask([
      MessageBuilder.aMessage().withText('hola').build(),
    ]);

    expect(sink.body?.messages[0]?.content).toBe('hola');
  });

  it('arma contenido multimodal [texto, image_url] cuando el mensaje tiene imagen', async () => {
    const sink: { body?: RequestBody } = {};
    const dataUrl = 'data:image/jpeg;base64,AAAA';
    await makeAdapter(capturingFetch(sink)).ask([
      MessageBuilder.aMessage().withText('¿qué ves?').withImage(dataUrl).build(),
    ]);

    expect(sink.body?.messages[0]?.content).toEqual([
      { type: 'text', text: '¿qué ves?' },
      { type: 'image_url', image_url: { url: dataUrl } },
    ]);
  });
});
