import { describe, it, expect } from 'vitest';
import { AsyncStorageConversationRepo } from '@adapters/persistence/AsyncStorageConversationRepo';
import { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { MessageBuilder } from '../builders/MessageBuilder';
import { FakeKeyValueStorage } from '../fakes/FakeKeyValueStorage';

/**
 * Reglas especificas del adaptador de AsyncStorage (no del contrato compartido).
 * La persistencia de imagenes es selectiva por rol para no inflar el storage:
 * la imagen generada por el asistente es el entregable y se conserva; la imagen
 * que el usuario subio (vision) es contexto transitorio y se descarta al guardar.
 */
describe('AsyncStorageConversationRepo: persistencia selectiva de imagenes', () => {
  it('NO persiste la imagen subida por el usuario (vision = transitoria)', async () => {
    const repo = new AsyncStorageConversationRepo(new FakeKeyValueStorage());
    const id = ConversationId.of('conv-1');
    const conversation = Conversation.start(id);
    conversation.addMessage(
      MessageBuilder.aMessage()
        .withRole('user')
        .withText('¿qué hay en esta foto?')
        .withImage('data:image/jpeg;base64,/9j/4AAQSkZJRg==')
        .build(),
    );

    await repo.save(conversation);
    const found = await repo.findById(id);

    expect(found.ok).toBe(true);
    if (found.ok) {
      expect(found.value?.history[0]?.imageUrl).toBeUndefined();
      // El texto sí sobrevive.
      expect(found.value?.history[0]?.text).toBe('¿qué hay en esta foto?');
    }
  });
});
