import { describe, it, expect } from 'vitest';
import { SaveSettings } from '@application/use-cases/SaveSettings';
import { GetSettings } from '@application/use-cases/GetSettings';
import { FakeSettingsPort } from '../fakes/FakeSettingsPort';

describe('SaveSettings', () => {
  it('persiste el apiKey', async () => {
    const port = FakeSettingsPort.empty();
    await new SaveSettings(port).execute({ apiKey: 'hf_abc' });
    expect(port.snapshot().apiKey).toBe('hf_abc');
  });

  it('persiste la URL de Ollama', async () => {
    const port = FakeSettingsPort.empty();
    await new SaveSettings(port).execute({ ollamaBaseUrl: 'http://10.0.0.5:11434/api' });
    expect(port.snapshot().ollamaBaseUrl).toBe('http://10.0.0.5:11434/api');
  });

  it('sobreescribe ajustes existentes', async () => {
    const port = FakeSettingsPort.withData({ apiKey: 'old-key' });
    await new SaveSettings(port).execute({ apiKey: 'new-key' });
    expect(port.snapshot().apiKey).toBe('new-key');
  });

  it('los ajustes guardados son recuperables con GetSettings', async () => {
    const port = FakeSettingsPort.empty();
    const settings = { apiKey: 'tok', ollamaBaseUrl: 'http://192.168.1.4:11434/api' };
    await new SaveSettings(port).execute(settings);
    const loaded = await new GetSettings(port).execute();
    expect(loaded).toEqual(settings);
  });
});
