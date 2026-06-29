import type { KeyValueStorage } from '@adapters/persistence/AsyncStorageConversationRepo';

/**
 * Fake en memoria del KeyValueStorage que usa AsyncStorageConversationRepo.
 * Sustituye a AsyncStorage en los tests (sin modulo nativo).
 */
export class FakeKeyValueStorage implements KeyValueStorage {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<readonly string[]> {
    return [...this.store.keys()];
  }
}
