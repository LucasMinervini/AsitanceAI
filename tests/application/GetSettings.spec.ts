import { describe, it, expect } from 'vitest';
import { GetSettings } from '@application/use-cases/GetSettings';
import { FakeSettingsPort } from '../fakes/FakeSettingsPort';

describe('GetSettings', () => {
  it('devuelve un objeto vacío cuando no hay ajustes guardados', async () => {
    const useCase = new GetSettings(FakeSettingsPort.empty());
    const result = await useCase.execute();
    expect(result).toEqual({});
  });

  it('devuelve los ajustes persistidos', async () => {
    const stored = { apiKey: 'hf_token_123', ollamaBaseUrl: 'http://192.168.1.4:11434/api' };
    const useCase = new GetSettings(FakeSettingsPort.withData(stored));
    const result = await useCase.execute();
    expect(result).toEqual(stored);
  });

  it('devuelve solo apiKey si solo eso fue guardado', async () => {
    const useCase = new GetSettings(FakeSettingsPort.withData({ apiKey: 'my-key' }));
    const result = await useCase.execute();
    expect(result.apiKey).toBe('my-key');
    expect(result.ollamaBaseUrl).toBeUndefined();
  });
});
