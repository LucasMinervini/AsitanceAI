import type { ChatMessageVM } from './ChatViewModel';

/**
 * Filas a renderizar en el chat: separadores de fecha + burbujas con metadata de
 * agrupado. Lógica pura y testeable (la UI solo recorre el array). El agrupado junta
 * mensajes consecutivos del mismo remitente dentro del mismo día.
 */
export interface ChatRowDate {
  readonly kind: 'date';
  readonly id: string;
  readonly label: string;
}

export interface ChatRowMessage {
  readonly kind: 'message';
  readonly id: string;
  /** Índice del mensaje en el historial (para acciones como "Copiar"). */
  readonly index: number;
  readonly message: ChatMessageVM;
  /** Primera burbuja de una tanda del mismo remitente (lleva más margen arriba). */
  readonly groupStart: boolean;
  /** Última de la tanda (es la que muestra la hora y las acciones). */
  readonly groupEnd: boolean;
}

export type ChatRow = ChatRowDate | ChatRowMessage;

/** Clave de día local (YYYY-MM-DD) para comparar fechas sin la hora. */
function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Etiqueta amigable del separador: "Hoy" / "Ayer" / "d/m/aaaa". */
export function formatDateLabel(date: Date, now: Date): string {
  const today = dateKey(now);
  const yesterday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const key = dateKey(date);
  if (key === today) {
    return 'Hoy';
  }
  if (key === yesterday) {
    return 'Ayer';
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function buildChatRows(
  messages: readonly ChatMessageVM[],
  now: Date = new Date(),
): readonly ChatRow[] {
  const rows: ChatRow[] = [];
  let prevKey: string | null = null;

  messages.forEach((message, index) => {
    const date = new Date(message.createdAtMs);
    const key = dateKey(date);

    if (key !== prevKey) {
      rows.push({ kind: 'date', id: `d-${key}`, label: formatDateLabel(date, now) });
    }

    const prev = messages[index - 1];
    const next = messages[index + 1];
    const sameDayPrev = prev !== undefined && dateKey(new Date(prev.createdAtMs)) === key;
    const sameDayNext = next !== undefined && dateKey(new Date(next.createdAtMs)) === key;

    rows.push({
      kind: 'message',
      id: `m-${index}`,
      index,
      message,
      groupStart: prev === undefined || prev.role !== message.role || !sameDayPrev,
      groupEnd: next === undefined || next.role !== message.role || !sameDayNext,
    });

    prevKey = key;
  });

  return rows;
}
