import type { ConversationId } from '@domain/value-objects/ConversationId';
import { ok, type Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';
import type { ConversationRepository } from '../ports/ConversationRepository';

/**
 * Use-case: renombra una conversacion (recupera, renombra en el dominio, persiste).
 * Si el id no existe o el titulo viene vacio, es un no-op exitoso (la UI ya valida el
 * titulo). Cualquier fallo real de almacenamiento se propaga via PersistenceError.
 */
export class RenameConversation {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(id: ConversationId, title: string): Promise<Result<void, PersistenceError>> {
    if (title.trim().length === 0) {
      return ok(undefined);
    }

    const found = await this.repository.findById(id);
    if (!found.ok) {
      return found;
    }
    const conversation = found.value;
    if (conversation === null) {
      return ok(undefined);
    }

    conversation.rename(title);
    return this.repository.save(conversation);
  }
}
