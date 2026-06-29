import type { SettingsPort, StoredSettings } from '@application/ports/SettingsPort';
import type { KeyValueStorage } from './AsyncStorageConversationRepo';

const KEY_API_KEY = 'settings:apiKey';
const KEY_OLLAMA_URL = 'settings:ollamaBaseUrl';

/**
 * Persiste los overrides de configuracion del usuario en AsyncStorage.
 * Reutiliza la interfaz KeyValueStorage ya existente — AsyncStorage satisface
 * estructuralmente, igual que con el repo de conversaciones.
 */
export class AsyncStorageSettingsAdapter implements SettingsPort {
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<StoredSettings> {
    const [apiKey, ollamaBaseUrl] = await Promise.all([
      this.storage.getItem(KEY_API_KEY),
      this.storage.getItem(KEY_OLLAMA_URL),
    ]);
    const result: { apiKey?: string; ollamaBaseUrl?: string } = {};
    if (apiKey !== null) result.apiKey = apiKey;
    if (ollamaBaseUrl !== null) result.ollamaBaseUrl = ollamaBaseUrl;
    return result;
  }

  async save(settings: StoredSettings): Promise<void> {
    const ops: Promise<void>[] = [];
    if (settings.apiKey !== undefined) {
      ops.push(this.storage.setItem(KEY_API_KEY, settings.apiKey));
    } else {
      ops.push(this.storage.removeItem(KEY_API_KEY));
    }
    if (settings.ollamaBaseUrl !== undefined) {
      ops.push(this.storage.setItem(KEY_OLLAMA_URL, settings.ollamaBaseUrl));
    } else {
      ops.push(this.storage.removeItem(KEY_OLLAMA_URL));
    }
    await Promise.all(ops);
  }
}
