import { describe, it, expect } from 'vitest';
import { ListConversations } from '@application/use-cases/ListConversations';
import { DeleteConversation } from '@application/use-cases/DeleteConversation';
import { GetConversation } from '@application/use-cases/GetConversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ConversationBuilder } from '../builders/ConversationBuilder';
import { FakeConversationRepository } from '../fakes/FakeConversationRepository';

describe('ListConversations', () => {
  it('devuelve todas las conversaciones del repositorio', async () => {
    const repo = FakeConversationRepository.empty();
    await repo.save(ConversationBuilder.aConversation().withId(ConversationId.of('a')).build());
    await repo.save(ConversationBuilder.aConversation().withId(ConversationId.of('b')).build());

    const result = await new ListConversations(repo).execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });
});

describe('DeleteConversation', () => {
  it('elimina la conversacion indicada del repositorio', async () => {
    const repo = FakeConversationRepository.empty();
    const id = ConversationId.of('a');
    await repo.save(ConversationBuilder.aConversation().withId(id).build());

    const result = await new DeleteConversation(repo).execute(id);

    expect(result.ok).toBe(true);
    const list = await repo.list();
    if (list.ok) {
      expect(list.value).toHaveLength(0);
    }
  });
});

describe('GetConversation', () => {
  it('devuelve la conversacion por id', async () => {
    const repo = FakeConversationRepository.empty();
    const id = ConversationId.of('a');
    await repo.save(ConversationBuilder.aConversation().withId(id).build());

    const result = await new GetConversation(repo).execute(id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id.equals(id)).toBe(true);
    }
  });

  it('devuelve null si la conversacion no existe', async () => {
    const repo = FakeConversationRepository.empty();

    const result = await new GetConversation(repo).execute(ConversationId.of('no-existe'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeNull();
    }
  });
});
