import { describe, it, expect } from 'vitest';
import { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ValidationError } from '@shared/errors/ValidationError';
import { MessageBuilder } from '../builders/MessageBuilder';

describe('Conversation', () => {
  it('expone el id con el que se inicio', () => {
    const id = ConversationId.of('conv-42');
    const conversation = Conversation.start(id);

    expect(conversation.id.equals(id)).toBe(true);
  });

  it('agrega un mensaje del usuario y lo refleja en el historial', () => {
    const conversation = Conversation.start(ConversationId.of('conv-1'));
    const message = MessageBuilder.aMessage().withText('Hola IA').build();

    conversation.addMessage(message);

    expect(conversation.history).toHaveLength(1);
    expect(conversation.history[0]?.text).toBe('Hola IA');
  });

  it('no permite agregar mensajes a una conversacion cerrada', () => {
    const conversation = Conversation.start(ConversationId.of('conv-1'));
    conversation.close();

    expect(() => conversation.addMessage(MessageBuilder.aMessage().build())).toThrowError();
  });

  it('arranca sin titulo (la UI deriva uno del preview)', () => {
    expect(Conversation.start(ConversationId.of('conv-1')).title).toBeUndefined();
  });

  it('renombra la conversacion con un titulo recortado', () => {
    const conversation = Conversation.start(ConversationId.of('conv-1'));

    conversation.rename('  Plan de viaje  ');

    expect(conversation.title).toBe('Plan de viaje');
  });

  it('rechaza renombrar con un titulo vacio', () => {
    const conversation = Conversation.start(ConversationId.of('conv-1'));

    expect(() => conversation.rename('   ')).toThrowError(ValidationError);
  });

  it('permite renombrar aun estando cerrada', () => {
    const conversation = Conversation.start(ConversationId.of('conv-1'));
    conversation.close();

    conversation.rename('Archivada');

    expect(conversation.title).toBe('Archivada');
  });
});
