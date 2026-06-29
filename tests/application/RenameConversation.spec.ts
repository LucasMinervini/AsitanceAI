import { describe, it, expect } from 'vitest';
import { RenameConversation } from '@application/use-cases/RenameConversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { PersistenceError } from '@shared/errors/PersistenceError';
import { ConversationBuilder } from '../builders/ConversationBuilder';
import { FakeConversationRepository } from '../fakes/FakeConversationRepository';

describe('RenameConversation', () => {
  it('renombra una conversacion existente y la persiste', async () => {
    const repository = FakeConversationRepository.empty();
    const id = ConversationId.of('conv-1');
    await repository.save(ConversationBuilder.aConversation().withId(id).build());
    const useCase = new RenameConversation(repository);

    const result = await useCase.execute(id, 'Mi receta favorita');

    expect(result.ok).toBe(true);
    const found = await repository.findById(id);
    if (found.ok) {
      expect(found.value?.title).toBe('Mi receta favorita');
    }
  });

  it('es un no-op exitoso si el id no existe', async () => {
    const useCase = new RenameConversation(FakeConversationRepository.empty());

    const result = await useCase.execute(ConversationId.of('no-existe'), 'Nuevo');

    expect(result.ok).toBe(true);
  });

  it('es un no-op si el titulo viene vacio (no toca el dominio)', async () => {
    const repository = FakeConversationRepository.empty();
    const id = ConversationId.of('conv-1');
    await repository.save(ConversationBuilder.aConversation().withId(id).withTitle('Original').build());
    const useCase = new RenameConversation(repository);

    const result = await useCase.execute(id, '   ');

    expect(result.ok).toBe(true);
    const found = await repository.findById(id);
    if (found.ok) {
      expect(found.value?.title).toBe('Original');
    }
  });

  it('propaga PersistenceError si falla el guardado', async () => {
    const repository = FakeConversationRepository.thatFailsOnSave();
    const id = ConversationId.of('conv-1');
    // Sembramos directo (el save fallaria) para que exista al renombrar.
    repository.saved.push(ConversationBuilder.aConversation().withId(id).build());
    const useCase = new RenameConversation(repository);

    const result = await useCase.execute(id, 'Nuevo titulo');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(PersistenceError);
    }
  });
});
