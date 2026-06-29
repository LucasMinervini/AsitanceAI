import { describe, it, expect } from 'vitest';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { AgentUnavailableError } from '@shared/errors/AgentUnavailableError';
import { PersistenceError } from '@shared/errors/PersistenceError';
import { ConversationBuilder } from '../builders/ConversationBuilder';
import { FakeAssistantAgent } from '../fakes/FakeAssistantAgent';
import { FakeConversationRepository } from '../fakes/FakeConversationRepository';

describe('SendAssistantQuery', () => {
  it('agrega la pregunta del usuario y la respuesta del agente al historial', async () => {
    const agent = FakeAssistantAgent.thatReplies('Hola, soy tu asistente');
    const useCase = new SendAssistantQuery(agent, FakeConversationRepository.empty());
    const conversation = ConversationBuilder.aConversation().build();

    const result = await useCase.execute(conversation, 'Hola IA');

    expect(result.ok).toBe(true);
    expect(conversation.history).toHaveLength(2);
    expect(conversation.history[0]?.role).toBe('user');
    expect(conversation.history[0]?.text).toBe('Hola IA');
    expect(conversation.history[1]?.role).toBe('assistant');
    expect(conversation.history[1]?.text).toBe('Hola, soy tu asistente');
  });

  it('persiste la conversacion tras una respuesta exitosa', async () => {
    const agent = FakeAssistantAgent.thatReplies('ok');
    const repository = FakeConversationRepository.empty();
    const useCase = new SendAssistantQuery(agent, repository);
    const conversation = ConversationBuilder.aConversation().build();

    await useCase.execute(conversation, 'Hola');

    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.history).toHaveLength(2);
  });

  it('pasa el historial vigente al agente al consultarlo', async () => {
    const agent = FakeAssistantAgent.thatReplies('ok');
    const useCase = new SendAssistantQuery(agent, FakeConversationRepository.empty());
    const conversation = ConversationBuilder.aConversation().build();

    await useCase.execute(conversation, 'pregunta');

    expect(agent.receivedHistory).toHaveLength(1);
    expect(agent.receivedHistory?.[0]?.text).toBe('pregunta');
  });

  it('pasa la imagen adjunta al agente (mensaje multimodal)', async () => {
    const agent = FakeAssistantAgent.thatReplies('veo la imagen');
    const useCase = new SendAssistantQuery(agent, FakeConversationRepository.empty());
    const conversation = ConversationBuilder.aConversation().build();
    const dataUrl = 'data:image/jpeg;base64,AAAA';

    await useCase.execute(conversation, '¿qué ves?', dataUrl);

    expect(agent.receivedHistory?.[0]?.imageUrl).toBe(dataUrl);
  });

  it('devuelve error y no persiste si el agente no esta disponible', async () => {
    const agent = FakeAssistantAgent.thatIsUnavailable();
    const repository = FakeConversationRepository.empty();
    const useCase = new SendAssistantQuery(agent, repository);
    const conversation = ConversationBuilder.aConversation().build();

    const result = await useCase.execute(conversation, 'Hola');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AgentUnavailableError);
    }
    // La pregunta del usuario queda en memoria; no hay respuesta ni guardado.
    expect(conversation.history).toHaveLength(1);
    expect(repository.saved).toHaveLength(0);
  });

  it('propaga PersistenceError si falla el guardado', async () => {
    const agent = FakeAssistantAgent.thatReplies('Hola');
    const useCase = new SendAssistantQuery(agent, FakeConversationRepository.thatFailsOnSave());
    const conversation = ConversationBuilder.aConversation().build();

    const result = await useCase.execute(conversation, 'Hola');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(PersistenceError);
    }
  });
});
