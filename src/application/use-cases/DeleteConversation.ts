import type { ConversationId } from '@domain/value-objects/ConversationId';
import type { Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';
import type { ConversationRepository } from '../ports/ConversationRepository';

/** Use-case: elimina una conversacion por id (idempotente). */
export class DeleteConversation {
  constructor(private readonly repository: ConversationRepository) {}

  execute(id: ConversationId): Promise<Result<void, PersistenceError>> {
    return this.repository.delete(id);
  }
}
