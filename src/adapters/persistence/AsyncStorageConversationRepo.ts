import { z } from 'zod';
import type { ConversationRepository } from '@application/ports/ConversationRepository';
import { Conversation } from '@domain/entities/Conversation';
import { Message } from '@domain/entities/Message';
import { ConversationId } from '@domain/value-objects/ConversationId';
import { ok, err, type Result } from '@shared/result/Result';
import { PersistenceError } from '@shared/errors/PersistenceError';

/**
 * Almacenamiento clave-valor asincrono. AsyncStorage lo satisface estructuralmente;
 * desacopla el adaptador del modulo nativo (testeable con un fake en memoria).
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

const KEY_PREFIX = 'conversation:';

/** DTO de persistencia: forma plana y serializable de una Conversation. */
const PersistedConversation = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  status: z.enum(['open', 'closed']),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      text: z.string().min(1),
      createdAt: z.string().optional(),
      // Solo se guarda para mensajes del asistente (imagen generada = entregable).
      // La imagen que sube el usuario (vision) es transitoria y no se persiste.
      imageUrl: z.string().optional(),
      // Video generado (entregable): se persiste por URL, no base64.
      videoUrl: z.string().optional(),
    }),
  ),
});

type PersistedConversation = z.infer<typeof PersistedConversation>;

/**
 * Adaptador de persistencia real sobre AsyncStorage (una clave por conversacion).
 * Serializa el agregado a un DTO plano y lo reconstruye via la API publica del
 * dominio. Cualquier fallo de almacenamiento/parseo se traduce a PersistenceError.
 */
export class AsyncStorageConversationRepo implements ConversationRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async save(conversation: Conversation): Promise<Result<void, PersistenceError>> {
    const dto: PersistedConversation = {
      id: conversation.id.value,
      title: conversation.title,
      status: conversation.isClosed ? 'closed' : 'open',
      messages: conversation.history.map((message) => ({
        role: message.role,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        // Persistir la imagen solo si la generó el asistente; descartar las de vision.
        imageUrl: message.role === 'assistant' ? message.imageUrl : undefined,
        // El video generado siempre es del asistente y es una URL: se persiste.
        videoUrl: message.videoUrl,
      })),
    };

    try {
      await this.storage.setItem(this.keyFor(conversation.id), JSON.stringify(dto));
      return ok(undefined);
    } catch {
      return err(new PersistenceError('No se pudo guardar la conversacion.'));
    }
  }

  async findById(id: ConversationId): Promise<Result<Conversation | null, PersistenceError>> {
    let raw: string | null;
    try {
      raw = await this.storage.getItem(this.keyFor(id));
    } catch {
      return err(new PersistenceError('No se pudo leer la conversacion.'));
    }

    if (raw === null) {
      return ok(null);
    }

    const parsed = this.parse(raw);
    if (!parsed.success) {
      return err(new PersistenceError('La conversacion almacenada tiene una forma invalida.'));
    }

    return ok(this.toDomain(parsed.data));
  }

  async list(): Promise<Result<readonly Conversation[], PersistenceError>> {
    let keys: readonly string[];
    try {
      keys = await this.storage.getAllKeys();
    } catch {
      return err(new PersistenceError('No se pudieron listar las conversaciones.'));
    }

    const conversations: Conversation[] = [];
    for (const key of keys.filter((k) => k.startsWith(KEY_PREFIX))) {
      let raw: string | null;
      try {
        raw = await this.storage.getItem(key);
      } catch {
        return err(new PersistenceError('No se pudo leer una conversacion.'));
      }
      if (raw === null) {
        continue;
      }
      const parsed = this.parse(raw);
      if (!parsed.success) {
        return err(new PersistenceError('La conversacion almacenada tiene una forma invalida.'));
      }
      conversations.push(this.toDomain(parsed.data));
    }

    return ok(conversations);
  }

  async delete(id: ConversationId): Promise<Result<void, PersistenceError>> {
    try {
      await this.storage.removeItem(this.keyFor(id));
      return ok(undefined);
    } catch {
      return err(new PersistenceError('No se pudo eliminar la conversacion.'));
    }
  }

  private parse(raw: string): z.SafeParseReturnType<unknown, PersistedConversation> {
    try {
      return PersistedConversation.safeParse(JSON.parse(raw));
    } catch {
      return PersistedConversation.safeParse(null);
    }
  }

  private toDomain(dto: PersistedConversation): Conversation {
    const conversation = Conversation.start(ConversationId.of(dto.id), dto.title);
    for (const message of dto.messages) {
      conversation.addMessage(
        Message.create({
          role: message.role,
          text: message.text,
          createdAt: message.createdAt !== undefined ? new Date(message.createdAt) : undefined,
          imageUrl: message.imageUrl,
          videoUrl: message.videoUrl,
        }),
      );
    }
    if (dto.status === 'closed') {
      conversation.close();
    }
    return conversation;
  }

  private keyFor(id: ConversationId): string {
    return `${KEY_PREFIX}${id.value}`;
  }
}
