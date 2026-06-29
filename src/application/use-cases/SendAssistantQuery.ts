import type { Conversation } from '@domain/entities/Conversation';
import { Message } from '@domain/entities/Message';
import { ok, type Result } from '@shared/result/Result';
import type { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import type { PersistenceError } from '@shared/errors/PersistenceError';
import type { AssistantAgentPort } from '../ports/AssistantAgentPort';
import type { ConversationRepository } from '../ports/ConversationRepository';

type SendAssistantQueryError = AgentUnavailableError | PersistenceError;

/**
 * Use-case: registra la pregunta del usuario, consulta al agente de IA con el
 * historial vigente, registra la respuesta y persiste la conversacion. Si el
 * agente falla, no persiste. Propaga AgentUnavailableError | PersistenceError
 * via Result (sin throw).
 */
export class SendAssistantQuery {
  constructor(
    private readonly agent: AssistantAgentPort,
    private readonly repository: ConversationRepository,
  ) {}

  async execute(
    conversation: Conversation,
    userText: string,
    imageUrl?: string,
  ): Promise<Result<Message, SendAssistantQueryError>> {
    conversation.addMessage(Message.create({ role: 'user', text: userText, imageUrl }));

    const reply = await this.agent.ask(conversation.history);
    if (!reply.ok) {
      return reply;
    }
    conversation.addMessage(reply.value);

    const saved = await this.repository.save(conversation);
    if (!saved.ok) {
      return saved;
    }

    return ok(reply.value);
  }
}
