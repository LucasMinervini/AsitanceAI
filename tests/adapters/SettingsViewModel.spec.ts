import { describe, it, expect, vi } from 'vitest';
import { SettingsViewModel } from '@adapters/ui/view-models/SettingsViewModel';
import { GetSettings } from '@application/use-cases/GetSettings';
import { SaveSettings } from '@application/use-cases/SaveSettings';
import { FakeSettingsPort } from '../fakes/FakeSettingsPort';

function buildVM(stored = {}) {
  const port = FakeSettingsPort.withData(stored);
  const getSettings = new GetSettings(port);
  const saveSettings = new SaveSettings(port);
  return { vm: new SettingsViewModel(getSettings, saveSettings), port };
}

describe('SettingsViewModel', () => {
  it('estado inicial es loading', () => {
    const { vm } = buildVM();
    expect(vm.getState().phase).toBe('loading');
  });

  it('load() trae los ajustes guardados', async () => {
    const { vm } = buildVM({ apiKey: 'hf_tok', ollamaBaseUrl: 'http://192.168.1.4:11434/api' });
    await vm.load();
    const state = vm.getState();
    expect(state.phase).toBe('idle');
    expect(state.apiKey).toBe('hf_tok');
    expect(state.ollamaBaseUrl).toBe('http://192.168.1.4:11434/api');
  });

  it('load() con ajustes vacíos deja los campos en blanco', async () => {
    const { vm } = buildVM();
    await vm.load();
    expect(vm.getState().apiKey).toBe('');
    expect(vm.getState().ollamaBaseUrl).toBe('');
  });

  it('save() persiste los valores y pone phase=saved', async () => {
    const { vm, port } = buildVM();
    await vm.save('nueva-key', 'http://10.0.0.1:11434/api');
    expect(vm.getState().phase).toBe('saved');
    expect(port.snapshot().apiKey).toBe('nueva-key');
    expect(port.snapshot().ollamaBaseUrl).toBe('http://10.0.0.1:11434/api');
  });

  it('save() con apiKey vacío guarda undefined (limpiar override)', async () => {
    const { vm, port } = buildVM({ apiKey: 'old-key' });
    await vm.save('', '');
    expect(port.snapshot().apiKey).toBeUndefined();
    expect(port.snapshot().ollamaBaseUrl).toBeUndefined();
  });

  it('save() con URL de Ollama inválida no persiste y pone phase=error', async () => {
    const { vm, port } = buildVM();
    await vm.save('hf_tok', 'localhost:11434'); // sin esquema http:// → inválida
    const state = vm.getState();
    expect(state.phase).toBe('error');
    expect(state.error).toBeDefined();
    // No debe haber tocado la persistencia
    expect(port.snapshot().apiKey).toBeUndefined();
    expect(port.snapshot().ollamaBaseUrl).toBeUndefined();
  });

  it('save() con URL válida tras una inválida persiste (recuperación)', async () => {
    const { vm, port } = buildVM();
    await vm.save('hf_tok', 'no-es-url');
    expect(vm.getState().phase).toBe('error');
    await vm.save('hf_tok', 'http://192.168.1.4:11434/api');
    expect(vm.getState().phase).toBe('saved');
    expect(port.snapshot().ollamaBaseUrl).toBe('http://192.168.1.4:11434/api');
  });

  it('subscribe notifica cuando cambia el estado', async () => {
    const { vm } = buildVM();
    const listener = vi.fn();
    vm.subscribe(listener);
    await vm.load();
    expect(listener).toHaveBeenCalled();
  });

  it('unsubscribe deja de notificar', async () => {
    const { vm } = buildVM();
    const listener = vi.fn();
    const unsub = vm.subscribe(listener);
    unsub();
    await vm.load();
    expect(listener).not.toHaveBeenCalled();
  });
});
