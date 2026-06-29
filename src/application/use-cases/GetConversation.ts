import type { Conversation } from '@domain/entities/Conversation';
import type { ConversationId } from '@domain/value-objects/ConversationId';
import type { Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';
import type { ConversationRepository } from '../ports/ConversationRepository';

/** Use-case: recupera una conversacion por id (null si no existe). */
export class GetConversation {
  constructor(private readonly repository: ConversationRepository) {}

  execute(id: ConversationId): Promise<Result<Conversation | null, PersistenceError>> {
    return this.repository.findById(id);
  }
}
