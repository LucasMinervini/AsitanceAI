import { describe, it, expect } from 'vitest';
import { ChatViewModelRegistry } from '@adapters/ui/registry/ChatViewModelRegistry';
import { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { GetConversation } from '@application/use-cases/GetConversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ConversationBuilder } from '../../builders/ConversationBuilder';
import { MessageBuilder } from '../../builders/MessageBuilder';
import { FakeAssistantAgent } from '../../fakes/FakeAssistantAgent';
import { FakeConversationRepository } from '../../fakes/FakeConversationRepository';

function makeRegistry(repo = FakeConversationRepository.empty()): ChatViewModelRegistry {
  const sendAssistantQuery = new SendAssistantQuery(FakeAssistantAgent.thatReplies('hi'), repo);
  const getConversation = new GetConversation(repo);
  return new ChatViewModelRegistry(sendAssistantQuery, getConversation);
}

describe('ChatViewModelRegistry', () => {
  it('peek devuelve undefined antes de crear el view-model', () => {
    const registry = makeRegistry();
    expect(registry.peek('a')).toBeUndefined();
  });

  it('getOrCreate crea un view-model y peek lo devuelve después', async () => {
    const registry = makeRegistry();
    const vm = await registry.getOrCreate('a');
    expect(vm).toBeDefined();
    expect(registry.peek('a')).toBe(vm);
  });

  it('getOrCreate devuelve la MISMA instancia para el mismo id (estado en vivo preservado)', async () => {
    const registry = makeRegistry();
    const first = await registry.getOrCreate('a');
    const second = await registry.getOrCreate('a');
    expect(second).toBe(first);
  });

  it('ids distintos producen instancias distintas', async () => {
    const registry = makeRegistry();
    const a = await registry.getOrCreate('a');
    const b = await registry.getOrCreate('b');
    expect(a).not.toBe(b);
  });

  it('siembra el view-model con el historial de una conversación persistida', async () => {
    const repo = FakeConversationRepository.empty();
    await repo.save(
      ConversationBuilder.aConversation()
        .withId(ConversationId.of('a'))
        .withMessage(MessageBuilder.aMessage().withRole('user').withText('Hola previa').build())
        .build(),
    );
    const registry = makeRegistry(repo);

    const vm = await registry.getOrCreate('a');

    expect(vm.getState().messages.map((m) => m.text)).toEqual(['Hola previa']);
  });

  it('llamadas concurrentes con el mismo id no duplican la instancia', async () => {
    const registry = makeRegistry();
    const [a, b] = await Promise.all([registry.getOrCreate('a'), registry.getOrCreate('a')]);
    expect(a).toBe(b);
  });

  it('evict elimina la instancia cacheada', async () => {
    const registry = makeRegistry();
    const first = await registry.getOrCreate('a');
    registry.evict('a');
    expect(registry.peek('a')).toBeUndefined();
    const second = await registry.getOrCreate('a');
    expect(second).not.toBe(first);
  });
});
