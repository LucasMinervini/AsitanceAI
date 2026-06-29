import { ValidationError } from '@shared/errors/ValidationError';

/**
 * Value Object: identidad de una Conversation. Inmutable, se autovalida y
 * se compara por valor (no por referencia). La generacion del valor (uuid,
 * etc.) vive fuera del dominio para mantenerlo puro y determinista en tests.
 */
export class ConversationId {
  private constructor(public readonly value: string) {}

  static of(value: string): ConversationId {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('El id de conversacion no puede estar vacio.');
    }
    return new ConversationId(trimmed);
  }

  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
