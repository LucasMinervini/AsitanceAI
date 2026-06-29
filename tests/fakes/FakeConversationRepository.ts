import type { ConversationRepository } from '@application/ports/ConversationRepository';
import type { Conversation } from '@domain/entities/Conversation';
import type { ConversationId } from '@domain/value-objects/ConversationId';
import { ok, err, type Result } from '@shared/result/Result';
import { PersistenceError } from '@shared/errors/PersistenceError';

/**
 * Fake en memoria del ConversationRepository para los tests de aceptacion.
 * Expone `saved` para aserciones y puede simular un fallo de guardado.
 */
export class FakeConversationRepository implements ConversationRepository {
  public readonly saved: Conversation[] = [];
  private failOnSave = false;
  private failOnList = false;

  static empty(): FakeConversationRepository {
    return new FakeConversationRepository();
  }

  static thatFailsOnSave(): FakeConversationRepository {
    const fake = new FakeConversationRepository();
    fake.failOnSave = true;
    return fake;
  }

  static thatFailsOnList(): FakeConversationRepository {
    const fake = new FakeConversationRepository();
    fake.failOnList = true;
    return fake;
  }

  async save(conversation: Conversation): Promise<Result<void, PersistenceError>> {
    if (this.failOnSave) {
      return err(new PersistenceError('Fallo simulado al guardar la conversacion.'));
    }
    this.saved.push(conversation);
    return ok(undefined);
  }

  async findById(id: ConversationId): Promise<Result<Conversation | null, PersistenceError>> {
    return ok(this.saved.find((conversation) => conversation.id.equals(id)) ?? null);
  }

  async list(): Promise<Result<readonly Conversation[], PersistenceError>> {
    if (this.failOnList) {
      return err(new PersistenceError('Fallo simulado al listar las conversaciones.'));
    }
    return ok([...this.saved]);
  }

  async delete(id: ConversationId): Promise<Result<void, PersistenceError>> {
    const index = this.saved.findIndex((conversation) => conversation.id.equals(id));
    if (index !== -1) {
      this.saved.splice(index, 1);
    }
    return ok(undefined);
  }
}
