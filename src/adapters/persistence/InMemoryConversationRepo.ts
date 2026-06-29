import type { ConversationRepository } from '@application/ports/ConversationRepository';
import type { Conversation } from '@domain/entities/Conversation';
import type { ConversationId } from '@domain/value-objects/ConversationId';
import { ok, type Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';

/**
 * Adaptador de persistencia en memoria. Cumple ConversationRepository sin I/O,
 * util para tests y para arrancar la app antes de tener almacenamiento real.
 */
export class InMemoryConversationRepo implements ConversationRepository {
  private readonly store = new Map<string, Conversation>();

  async save(conversation: Conversation): Promise<Result<void, PersistenceError>> {
    this.store.set(conversation.id.value, conversation);
    return ok(undefined);
  }

  async findById(id: ConversationId): Promise<Result<Conversation | null, PersistenceError>> {
    return ok(this.store.get(id.value) ?? null);
  }

  async list(): Promise<Result<readonly Conversation[], PersistenceError>> {
    return ok([...this.store.values()]);
  }

  async delete(id: ConversationId): Promise<Result<void, PersistenceError>> {
    this.store.delete(id.value);
    return ok(undefined);
  }
}
