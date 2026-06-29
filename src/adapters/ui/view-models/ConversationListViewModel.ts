import type { Conversation } from '@domain/entities/Conversation';
import { ConversationId } from '@domain/value-objects/ConversationId';
import type { ListConversations } from '@application/use-cases/ListConversations';
import type { DeleteConversation } from '@application/use-cases/DeleteConversation';
import type { RenameConversation } from '@application/use-cases/RenameConversation';

/** DTO de presentacion de una conversacion en la lista. */
export interface ConversationSummaryVM {
  readonly id: string;
  readonly preview: string;
  readonly messageCount: number;
  /** Titulo elegido por el usuario; undefined si nunca se renombro. */
  readonly title?: string;
  /**
   * Texto concatenado (titulo + todos los mensajes) para busqueda full-text en el
   * drawer. No se muestra; solo lo consume filterConversations.
   */
  readonly searchText?: string;
}

export type ListStatus = 'idle' | 'loading' | 'error';

export interface ConversationListState {
  readonly items: readonly ConversationSummaryVM[];
  readonly status: ListStatus;
  readonly error: string | null;
}

type Listener = (state: ConversationListState) => void;

/**
 * Presenter framework-agnostic de la lista de conversaciones. Orquesta los
 * use-cases y expone un estado observable (getState + subscribe), mapeando las
 * entidades a summaries para la UI.
 */
export class ConversationListViewModel {
  private state: ConversationListState = { items: [], status: 'idle', error: null };
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly listConversations: ListConversations,
    private readonly deleteConversation: DeleteConversation,
    private readonly renameConversation: RenameConversation,
  ) {}

  getState(): ConversationListState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async load(): Promise<void> {
    this.setState({ ...this.state, status: 'loading', error: null });

    const result = await this.listConversations.execute();
    if (!result.ok) {
      this.setState({ ...this.state, status: 'error', error: result.error.message });
      return;
    }

    this.setState({ items: result.value.map(toSummary), status: 'idle', error: null });
  }

  async remove(id: string): Promise<void> {
    const result = await this.deleteConversation.execute(ConversationId.of(id));
    if (!result.ok) {
      this.setState({ ...this.state, status: 'error', error: result.error.message });
      return;
    }
    await this.load();
  }

  async rename(id: string, title: string): Promise<void> {
    const result = await this.renameConversation.execute(ConversationId.of(id), title);
    if (!result.ok) {
      this.setState({ ...this.state, status: 'error', error: result.error.message });
      return;
    }
    await this.load();
  }

  private setState(next: ConversationListState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

function toSummary(conversation: Conversation): ConversationSummaryVM {
  const history = conversation.history;
  const last = history.at(-1);
  // searchText: titulo + todos los textos, para que la busqueda encuentre una palabra
  // que solo aparece en medio de la conversacion (no solo en el preview/titulo).
  const searchText = [conversation.title, ...history.map((m) => m.text)]
    .filter((s) => s !== undefined)
    .join(' ');
  return {
    id: conversation.id.value,
    preview: last ? last.text : '(sin mensajes)',
    messageCount: history.length,
    title: conversation.title,
    searchText,
  };
}
