import type { Conversation } from '@domain/entities/Conversation';
import type { SendAssistantQuery } from '@application/use-cases/SendAssistantQuery';
import { formatConversationAsText } from './formatConversationAsText';

/** DTO de presentacion: la UI no conoce las entidades del dominio. */
export interface ChatMessageVM {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  /** Hora de creacion formateada (HH:MM) para la burbuja. */
  readonly time: string;
  /** Timestamp (ms) para agrupar burbujas y armar separadores de fecha. */
  readonly createdAtMs: number;
  /** Imagen adjunta (data URL) a mostrar en la burbuja, si el mensaje la lleva. */
  readonly imageUrl?: string;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export type ChatStatus = 'idle' | 'sending' | 'error';

export interface ChatState {
  readonly messages: readonly ChatMessageVM[];
  readonly status: ChatStatus;
  readonly error: string | null;
}

type Listener = (state: ChatState) => void;

/**
 * Presenter framework-agnostic del chat. Orquesta el use-case y expone un estado
 * observable (patron store: getState + subscribe). Un hook de React/RN lo envuelve
 * con useSyncExternalStore cuando se instale Expo, sin tocar esta logica.
 */
export class ChatViewModel {
  private state: ChatState;
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly sendAssistantQuery: SendAssistantQuery,
    private readonly conversation: Conversation,
  ) {
    // Siembra el estado con el historial ya existente (al abrir una conversacion guardada).
    this.state = { messages: this.snapshotMessages(), status: 'idle', error: null };
  }

  getState(): ChatState {
    return this.state;
  }

  /** Texto plano de la conversación para exportar/compartir (delegado al formatter puro). */
  exportText(): string {
    return formatConversationAsText(this.conversation);
  }

  /** ¿Hay algo para exportar? La UI lo usa para deshabilitar el botón compartir. */
  get hasMessages(): boolean {
    return this.conversation.history.length > 0;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async send(text: string, imageUrl?: string): Promise<void> {
    // UI optimista: la pregunta del usuario se muestra al instante (con "pensando…"),
    // sin esperar a que la IA responda. Se arma una burbuja provisoria sobre el historial
    // vigente; al terminar, el snapshot real (que ya trae user + assistant) la reemplaza.
    const optimistic: ChatMessageVM = {
      role: 'user',
      text,
      time: formatTime(new Date()),
      createdAtMs: Date.now(),
      imageUrl,
    };
    this.setState({
      messages: [...this.snapshotMessages(), optimistic],
      status: 'sending',
      error: null,
    });

    const result = await this.sendAssistantQuery.execute(this.conversation, text, imageUrl);
    const messages = this.snapshotMessages();

    if (!result.ok) {
      this.setState({ messages, status: 'error', error: result.error.message });
      return;
    }

    this.setState({ messages, status: 'idle', error: null });
  }

  private snapshotMessages(): readonly ChatMessageVM[] {
    return this.conversation.history.map((message) => ({
      role: message.role,
      text: message.text,
      time: formatTime(message.createdAt),
      createdAtMs: message.createdAt.getTime(),
      imageUrl: message.imageUrl,
    }));
  }

  private setState(next: ChatState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
