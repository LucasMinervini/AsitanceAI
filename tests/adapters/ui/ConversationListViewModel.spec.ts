import { describe, it, expect } from 'vitest';
import { ConversationListViewModel } from '@adapters/ui/view-models/ConversationListViewModel';
import { ListConversations } from '@application/use-cases/ListConversations';
import { DeleteConversation } from '@application/use-cases/DeleteConversation';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ConversationBuilder } from '../../builders/ConversationBuilder';
import { MessageBuilder } from '../../builders/MessageBuilder';
import { FakeConversationRepository } from '../../fakes/FakeConversationRepository';

function makeViewModel(repo: FakeConversationRepository): ConversationListViewModel {
  return new ConversationListViewModel(
    new ListConversations(repo),
    new DeleteConversation(repo),
    new RenameConversation(repo),
  );
}

describe('ConversationListViewModel', () => {
  it('load() expone las conversaciones como summaries (preview + contador)', async () => {
    const repo = FakeConversationRepository.empty();
    await repo.save(
      ConversationBuilder.aConversation()
        .withId(ConversationId.of('a'))
        .withMessage(MessageBuilder.aMessage().withText('Hola').build())
        .withMessage(MessageBuilder.aMessage().withRole('assistant').withText('Buenas').build())
        .build(),
    );
    const vm = makeViewModel(repo);

    await vm.load();

    const state = vm.getState();
    expect(state.status).toBe('idle');
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.id).toBe('a');
    expect(state.items[0]?.preview).toBe('Buenas');
    expect(state.items[0]?.messageCount).toBe(2);
  });

  it('load() refleja error cuando el repositorio falla', async () => {
    const vm = makeViewModel(FakeConversationRepository.thatFailsOnList());

    await vm.load();

    const state = vm.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
  });

  it('remove() elimina y recarga la lista', async () => {
    const repo = FakeConversationRepository.empty();
    await repo.save(ConversationBuilder.aConversation().withId(ConversationId.of('a')).build());
    await repo.save(ConversationBuilder.aConversation().withId(ConversationId.of('b')).build());
    const vm = makeViewModel(repo);
    await vm.load();

    await vm.remove('a');

    const ids = vm.getState().items.map((item) => item.id);
    expect(ids).toEqual(['b']);
  });

  it('rename() renombra y recarga; el summary expone el titulo', async () => {
    const repo = FakeConversationRepository.empty();
    await repo.save(
      ConversationBuilder.aConversation()
        .withId(ConversationId.of('a'))
        .withMessage(MessageBuilder.aMessage().withText('Hola').build())
        .build(),
    );
    const vm = makeViewModel(repo);
    await vm.load();

    await vm.rename('a', 'Mi charla');

    expect(vm.getState().items[0]?.title).toBe('Mi charla');
  });

  it('notifica a los suscriptores durante load (loading -> idle)', async () => {
    const repo = FakeConversationRepository.empty();
    const vm = makeViewModel(repo);
    const statuses: string[] = [];
    vm.subscribe((state) => statuses.push(state.status));

    await vm.load();

    expect(statuses).toContain('loading');
    expect(statuses.at(-1)).toBe('idle');
  });
});
