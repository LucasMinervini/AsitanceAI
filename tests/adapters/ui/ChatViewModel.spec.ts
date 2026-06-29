import { describe, it, expect } from 'vitest';
import { ChatViewModel } from '@adapters/ui/view-models/ChatViewModel';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import type { AssistantAgentPort } from '@application/ports/AssistantAgentPort';
import { ConversationBuilder } from '../../builders/ConversationBuilder';
import { MessageBuilder } from '../../builders/MessageBuilder';
import { FakeAssistantAgent } from '../../fakes/FakeAssistantAgent';
import { FakeConversationRepository } from '../../fakes/FakeConversationRepository';

function makeViewModel(agent: AssistantAgentPort): ChatViewModel {
  const useCase = new SendAssistantQuery(agent, FakeConversationRepository.empty());
  return new ChatViewModel(useCase, ConversationBuilder.aConversation().build());
}

describe('ChatViewModel', () => {
  it('arranca vacio en estado idle', () => {
    const vm = makeViewModel(FakeAssistantAgent.thatReplies('hi'));

    expect(vm.getState().messages).toHaveLength(0);
    expect(vm.getState().status).toBe('idle');
  });

  it('siembra el historial de una conversacion ya existente', () => {
    const useCase = new SendAssistantQuery(
      FakeAssistantAgent.thatReplies('hi'),
      FakeConversationRepository.empty(),
    );
    const conversation = ConversationBuilder.aConversation()
      .withMessage(MessageBuilder.aMessage().withRole('user').withText('Hola previa').build())
      .withMessage(MessageBuilder.aMessage().withRole('assistant').withText('Respuesta previa').build())
      .build();

    const vm = new ChatViewModel(useCase, conversation);

    expect(vm.getState().messages.map((m) => m.text)).toEqual(['Hola previa', 'Respuesta previa']);
  });

  it('tras enviar, expone la pregunta y la respuesta y vuelve a idle', async () => {
    const vm = makeViewModel(FakeAssistantAgent.thatReplies('Hola humano'));

    await vm.send('Hola IA');

    const state = vm.getState();
    expect(state.status).toBe('idle');
    expect(state.messages.map((m) => m.text)).toEqual(['Hola IA', 'Hola humano']);
    expect(state.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('UI optimista: muestra el mensaje del usuario al instante, antes de la respuesta', async () => {
    const vm = makeViewModel(FakeAssistantAgent.thatReplies('respuesta IA'));
    const sendingSnapshots: string[][] = [];
    vm.subscribe((state) => {
      if (state.status === 'sending') {
        sendingSnapshots.push(state.messages.map((m) => m.text));
      }
    });

    await vm.send('Hola IA');

    // En el primer cambio a 'sending' (sincrónico) ya debe verse la pregunta del usuario,
    // sin esperar a que la IA responda.
    expect(sendingSnapshots[0]).toEqual(['Hola IA']);
  });

  it('expone la imagen adjunta del usuario en el snapshot (mensaje multimodal)', async () => {
    const vm = makeViewModel(FakeAssistantAgent.thatReplies('veo la imagen'));
    const dataUrl = 'data:image/jpeg;base64,AAAA';

    await vm.send('¿qué ves?', dataUrl);

    const userMsg = vm.getState().messages.find((m) => m.role === 'user');
    expect(userMsg?.imageUrl).toBe(dataUrl);
  });

  it('notifica a los suscriptores en cada cambio de estado', async () => {
    const vm = makeViewModel(FakeAssistantAgent.thatReplies('ok'));
    const statuses: string[] = [];
    vm.subscribe((state) => statuses.push(state.status));

    await vm.send('Hola');

    expect(statuses).toContain('sending');
    expect(statuses.at(-1)).toBe('idle');
  });

  it('ante fallo del agente queda en error y conserva la pregunta del usuario', async () => {
    const vm = makeViewModel(FakeAssistantAgent.thatIsUnavailable());

    await vm.send('Hola');

    const state = vm.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
    expect(state.messages.map((m) => m.text)).toEqual(['Hola']);
  });
});
