import { describe, it, expect } from 'vitest';
import type { ConversationRepository } from '@application/ports/ConversationRepository';
import { InMemoryConversationRepo } from '@adapters/persistence/InMemoryConversationRepo';
import { AsyncStorageConversationRepo } from '@adapters/persistence/AsyncStorageConversationRepo';
import { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { MessageBuilder } from '../builders/MessageBuilder';
import { FakeKeyValueStorage } from '../fakes/FakeKeyValueStorage';

/**
 * Contrato reutilizable: TODO adaptador de ConversationRepository debe cumplirlo.
 * Cuando exista AsyncStorageConversationRepo, se invoca esta misma funcion con su
 * factory y debe pasar identico.
 */
function conversationRepositoryContract(name: string, makeRepo: () => ConversationRepository): void {
  describe(`ConversationRepository: ${name}`, () => {
    it('guarda una conversacion y la recupera por id con su historial', async () => {
      const repo = makeRepo();
      const id = ConversationId.of('conv-1');
      const conversation = Conversation.start(id);
      conversation.addMessage(MessageBuilder.aMessage().withText('Hola').build());

      const saved = await repo.save(conversation);
      expect(saved.ok).toBe(true);

      const found = await repo.findById(id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value?.id.equals(id)).toBe(true);
        expect(found.value?.history).toHaveLength(1);
        expect(found.value?.history[0]?.text).toBe('Hola');
      }
    });

    it('conserva el titulo (renombrado) al guardar y recuperar', async () => {
      const repo = makeRepo();
      const id = ConversationId.of('conv-1');
      const conversation = Conversation.start(id);
      conversation.addMessage(MessageBuilder.aMessage().withText('Hola').build());
      conversation.rename('Plan de viaje');

      await repo.save(conversation);
      const found = await repo.findById(id);

      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value?.title).toBe('Plan de viaje');
      }
    });

    it('conserva la imagen generada por el asistente (imageUrl) al guardar y recuperar', async () => {
      const repo = makeRepo();
      const id = ConversationId.of('conv-1');
      const conversation = Conversation.start(id);
      conversation.addMessage(MessageBuilder.aMessage().withText('dibujá un gato').build());
      conversation.addMessage(
        MessageBuilder.aMessage()
          .withRole('assistant')
          .withText('📷 Imagen generada')
          .withImage('data:image/png;base64,iVBORw0KGgo=')
          .build(),
      );

      await repo.save(conversation);
      const found = await repo.findById(id);

      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value?.history[1]?.imageUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
      }
    });

    it('devuelve null al buscar un id inexistente', async () => {
      const repo = makeRepo();

      const found = await repo.findById(ConversationId.of('no-existe'));

      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value).toBeNull();
      }
    });

    it('sobrescribe (upsert) al guardar dos veces el mismo id', async () => {
      const repo = makeRepo();
      const id = ConversationId.of('conv-1');
      const first = Conversation.start(id);
      first.addMessage(MessageBuilder.aMessage().withText('uno').build());
      await repo.save(first);

      const second = Conversation.start(id);
      second.addMessage(MessageBuilder.aMessage().withText('dos').build());
      second.addMessage(MessageBuilder.aMessage().withText('tres').build());
      await repo.save(second);

      const found = await repo.findById(id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value?.history).toHaveLength(2);
      }
    });

    it('lista vacio cuando no hay conversaciones', async () => {
      const repo = makeRepo();

      const listed = await repo.list();

      expect(listed.ok).toBe(true);
      if (listed.ok) {
        expect(listed.value).toHaveLength(0);
      }
    });

    it('lista todas las conversaciones guardadas', async () => {
      const repo = makeRepo();
      await repo.save(Conversation.start(ConversationId.of('conv-1')));
      await repo.save(Conversation.start(ConversationId.of('conv-2')));

      const listed = await repo.list();

      expect(listed.ok).toBe(true);
      if (listed.ok) {
        const ids = listed.value.map((conversation) => conversation.id.value).sort();
        expect(ids).toEqual(['conv-1', 'conv-2']);
      }
    });

    it('elimina una conversacion por id', async () => {
      const repo = makeRepo();
      const id = ConversationId.of('conv-1');
      await repo.save(Conversation.start(id));

      const deleted = await repo.delete(id);
      expect(deleted.ok).toBe(true);

      const found = await repo.findById(id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value).toBeNull();
      }
    });

    it('eliminar un id inexistente es idempotente (ok)', async () => {
      const repo = makeRepo();

      const deleted = await repo.delete(ConversationId.of('no-existe'));

      expect(deleted.ok).toBe(true);
    });
  });
}

conversationRepositoryContract('InMemoryConversationRepo', () => new InMemoryConversationRepo());

conversationRepositoryContract(
  'AsyncStorageConversationRepo',
  () => new AsyncStorageConversationRepo(new FakeKeyValueStorage()),
);
