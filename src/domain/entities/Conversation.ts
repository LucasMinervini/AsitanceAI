import { DomainError } from '@shared/errors/DomainError';
import { ValidationError } from '@shared/errors/ValidationError';
import type { ConversationId } from '../value-objects/ConversationId';
import type { Message } from './Message';

/** Se intento operar sobre una conversacion ya cerrada. */
export class ConversationClosedError extends DomainError {
  readonly code = 'CONVERSATION_CLOSED';
}

type ConversationStatus = 'open' | 'closed';

/**
 * Conversation: raiz de agregado. Agrupa Messages e impone la invariante
 * de que no se puede escribir en una conversacion cerrada.
 */
export class Conversation {
  private readonly messages: Message[] = [];
  private status: ConversationStatus = 'open';

  private constructor(
    public readonly id: ConversationId,
    private titleValue: string | undefined,
  ) {}

  static start(id: ConversationId, title?: string): Conversation {
    return new Conversation(id, title?.trim() ? title.trim() : undefined);
  }

  /** Copia defensiva: el historial no se muta desde fuera del agregado. */
  get history(): readonly Message[] {
    return [...this.messages];
  }

  get isClosed(): boolean {
    return this.status === 'closed';
  }

  /** Titulo elegido por el usuario; undefined si nunca se renombro (la UI deriva uno). */
  get title(): string | undefined {
    return this.titleValue;
  }

  addMessage(message: Message): void {
    if (this.status === 'closed') {
      throw new ConversationClosedError('No se pueden agregar mensajes a una conversacion cerrada.');
    }
    this.messages.push(message);
  }

  /** Renombra la conversacion. Se permite aun estando cerrada (no es escribir un mensaje). */
  rename(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('El titulo de la conversacion no puede estar vacio.');
    }
    this.titleValue = trimmed;
  }

  close(): void {
    this.status = 'closed';
  }
}
