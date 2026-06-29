import { useEffect, useState } from 'react';
import { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ChatViewModel } from '../view-models/ChatViewModel';
import { useDependencies } from '../di/DependenciesContext';

/**
 * Construye el ChatViewModel para una conversacion: carga la existente (por id) o
 * inicia una nueva. Devuelve null mientras resuelve la carga asincrona.
 */
export function useChatViewModel(conversationId?: string): ChatViewModel | null {
  const deps = useDependencies();
  const [viewModel, setViewModel] = useState<ChatViewModel | null>(null);

  useEffect(() => {
    let active = true;

    const build = async (): Promise<void> => {
      let conversation: Conversation;
      if (conversationId !== undefined) {
        const result = await deps.getConversation.execute(ConversationId.of(conversationId));
        conversation =
          result.ok && result.value !== null
            ? result.value
            : Conversation.start(ConversationId.of(conversationId));
      } else {
        conversation = Conversation.start(ConversationId.of(`conv-${Date.now()}`));
      }
      if (active) {
        setViewModel(new ChatViewModel(deps.sendAssistantQuery, conversation));
      }
    };

    void build();
    return () => {
      active = false;
    };
  }, [conversationId, deps]);

  return viewModel;
}
