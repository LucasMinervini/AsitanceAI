import { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import type { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import type { GetConversation } from '@application/use-cases/GetConversation';
import { ChatViewModel } from '../view-models/ChatViewModel';

/**
 * Mantiene vivos los ChatViewModel por conversación (Fase B de multi-conversación).
 * Antes el hook reconstruía el view-model en cada cambio de charla y descartaba el
 * anterior, perdiendo el estado en vivo (el indicador "pensando…", un envío en vuelo).
 * Cacheando la MISMA instancia por id, al volver a una charla se ve su estado real y
 * los envíos en segundo plano siguen actualizando su view-model.
 */
export class ChatViewModelRegistry {
  private readonly cache = new Map<string, ChatViewModel>();
  /** Cargas en curso: evita crear dos instancias ante getOrCreate concurrentes. */
  private readonly pending = new Map<string, Promise<ChatViewModel>>();

  constructor(
    private readonly sendAssistantQuery: SendAssistantQuery,
    private readonly getConversation: GetConversation,
  ) {}

  /** Devuelve el view-model cacheado sin crearlo (para setear estado inicial sin async). */
  peek(id: string): ChatViewModel | undefined {
    return this.cache.get(id);
  }

  /** Devuelve el view-model de la charla, creándolo (cargando del repo) la primera vez. */
  async getOrCreate(id: string): Promise<ChatViewModel> {
    const cached = this.cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const inFlight = this.pending.get(id);
    if (inFlight !== undefined) {
      return inFlight;
    }
    const promise = this.load(id);
    this.pending.set(id, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(id);
    }
  }

  /** Descarta el view-model cacheado (ej. al borrar la conversación). */
  evict(id: string): void {
    this.cache.delete(id);
  }

  private async load(id: string): Promise<ChatViewModel> {
    const conversationId = ConversationId.of(id);
    const result = await this.getConversation.execute(conversationId);
    const conversation =
      result.ok && result.value !== null ? result.value : Conversation.start(conversationId);
    const viewModel = new ChatViewModel(this.sendAssistantQuery, conversation);
    this.cache.set(id, viewModel);
    return viewModel;
  }
}
