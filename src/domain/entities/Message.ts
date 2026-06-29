import { ValidationError } from '@shared/errors/ValidationError';

export type MessageRole = 'user' | 'assistant';

interface MessageProps {
  readonly role: MessageRole;
  readonly text: string;
  /** Momento de creacion. Opcional: por defecto "ahora"; se pasa explicito al rehidratar. */
  readonly createdAt?: Date;
  /**
   * Imagen adjunta (data URL base64) para mensajes multimodales: el agente de visión
   * la "ve". Es transitoria — no se persiste (evita inflar el almacenamiento). El texto
   * sigue siendo obligatorio (la UI pone un prompt por defecto si solo se manda foto).
   */
  readonly imageUrl?: string;
}

/**
 * Message: entidad inmutable del dominio. Se autovalida en construccion
 * a traves de la factory `create` (constructor privado).
 */
export class Message {
  private constructor(
    public readonly role: MessageRole,
    public readonly text: string,
    public readonly createdAt: Date,
    public readonly imageUrl?: string,
  ) {}

  static create(props: MessageProps): Message {
    const text = props.text.trim();
    if (text.length === 0) {
      throw new ValidationError('El texto del mensaje no puede estar vacio.');
    }
    return new Message(props.role, text, props.createdAt ?? new Date(), props.imageUrl);
  }
}
