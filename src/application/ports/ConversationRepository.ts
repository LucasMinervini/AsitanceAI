import type { Conversation } from '@domain/entities/Conversation';
import type { ConversationId } from '@domain/value-objects/ConversationId';
import type { Result } from '@shared/result/Result';
import type { PersistenceError } from '@shared/errors/PersistenceError';

/**
 * Port de salida hacia el almacenamiento de conversaciones. Expresa el QUE
 * (guardar / recuperar / listar / eliminar), nunca el COMO (memoria, AsyncStorage,
 * SQLite...). findById devuelve null si no existe; delete es idempotente; se reserva
 * PersistenceError para fallos reales de almacenamiento.
 */
export interface ConversationRepository {
  save(conversation: Conversation): Promise<Result<void, PersistenceError>>;
  findById(id: ConversationId): Promise<Result<Conversation | null, PersistenceError>>;
  list(): Promise<Result<readonly Conversation[], PersistenceError>>;
  delete(id: ConversationId): Promise<Result<void, PersistenceError>>;
}
