import { describe, it, expect } from 'vitest';
import { formatConversationAsText } from '@adapters/ui/view-models/formatConversationAsText';
import { ConversationBuilder } from '../../builders/ConversationBuilder';
import { MessageBuilder } from '../../builders/MessageBuilder';

describe('formatConversationAsText', () => {
  it('arma un encabezado con el título y los turnos etiquetados', () => {
    const conversation = ConversationBuilder.aConversation()
      .withTitle('Plan de viaje')
      .withMessage(MessageBuilder.aMessage().withRole('user').withText('Armame un plan').build())
      .withMessage(MessageBuilder.aMessage().withRole('assistant').withText('Día 1: ...').build())
      .build();

    const text = formatConversationAsText(conversation);

    expect(text).toContain('Plan de viaje');
    expect(text).toContain('Tú:');
    expect(text).toContain('Armame un plan');
    expect(text).toContain('Asistente:');
    expect(text).toContain('Día 1: ...');
    // El turno del usuario aparece antes que el del asistente.
    expect(text.indexOf('Armame un plan')).toBeLessThan(text.indexOf('Día 1: ...'));
  });

  it('usa "Conversación" como título cuando no hay uno', () => {
    const conversation = ConversationBuilder.aConversation()
      .withMessage(MessageBuilder.aMessage().withText('hola').build())
      .build();

    expect(formatConversationAsText(conversation)).toContain('Conversación');
  });

  it('incluye el texto de un mensaje con imagen generada', () => {
    const conversation = ConversationBuilder.aConversation()
      .withMessage(MessageBuilder.aMessage().withText('dibujá un gato').build())
      .withMessage(
        MessageBuilder.aMessage()
          .withRole('assistant')
          .withText('📷 Imagen generada')
          .withImage('data:image/png;base64,AAAA')
          .build(),
      )
      .build();

    expect(formatConversationAsText(conversation)).toContain('📷 Imagen generada');
  });

  it('una conversación sin mensajes indica que está vacía', () => {
    const conversation = ConversationBuilder.aConversation().withTitle('Vacía').build();
    const text = formatConversationAsText(conversation);
    expect(text).toContain('Vacía');
    expect(text).toContain('(sin mensajes)');
  });
});
