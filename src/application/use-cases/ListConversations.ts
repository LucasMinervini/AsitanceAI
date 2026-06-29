import type { Conversation } from '@domain/entities/Conversation';
import type { Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';
import type { ConversationRepository } from '../ports/ConversationRepository';

/** Use-case: lista todas las conversaciones persistidas. */
export class ListConversations {
  constructor(private readonly repository: ConversationRepository) {}

  execute(): Promise<Result<readonly Conversation[], PersistenceError>> {
    return this.repository.list();
  }
}
