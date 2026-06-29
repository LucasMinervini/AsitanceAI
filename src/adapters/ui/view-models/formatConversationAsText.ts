import type { Conversation } from '@domain/entities/Conversation';
import type { Message } from '@domain/entities/Message';

/**
 * Serializa una conversación a texto plano legible para exportar/compartir.
 * Módulo puro y testeable (sin React ni I/O): la UI solo pasa el resultado al
 * share sheet. No incluye fechas para que la salida sea determinística (testeable)
 * y porque el valor está en el contenido, no en los timestamps.
 */
export function formatConversationAsText(conversation: Conversation): string {
  const title = conversation.title ?? 'Conversación';
  const body =
    conversation.history.length === 0
      ? '(sin mensajes)'
      : conversation.history.map(formatTurn).join('\n\n');
  return `${title}\n\n${body}\n`;
}

function formatTurn(message: Message): string {
  const label = message.role === 'user' ? 'Tú' : 'Asistente';
  return `${label}:\n${message.text}`;
}
