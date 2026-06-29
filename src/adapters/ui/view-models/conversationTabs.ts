import type { ConversationSummaryVM } from './ConversationListViewModel';

/** DTO de presentacion de un chip del selector rapido de conversaciones. */
export interface ConversationTabVM {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

const NEW_LABEL = 'Nueva charla';

/**
 * Arma los chips del selector rapido a partir de los summaries ya cargados.
 * Modulo puro y testeable (sin React). La UI solo renderiza el resultado.
 *
 * Una conversacion recien creada todavia no esta persistida (no aparece en items
 * hasta el primer mensaje); si es la activa, se le agrega un chip sintetico para que
 * el usuario vea/cambie a ella igual.
 */
export function buildConversationTabs(
  items: readonly ConversationSummaryVM[],
  activeId?: string,
): readonly ConversationTabVM[] {
  const tabs = items.map((item) => ({
    id: item.id,
    label: labelFor(item),
    active: item.id === activeId,
  }));

  if (activeId !== undefined && !items.some((i) => i.id === activeId)) {
    return [{ id: activeId, label: NEW_LABEL, active: true }, ...tabs];
  }
  return tabs;
}

function labelFor(item: ConversationSummaryVM): string {
  if (item.title !== undefined && item.title.trim().length > 0) {
    return item.title;
  }
  if (item.preview.trim().length > 0) {
    return item.preview;
  }
  return NEW_LABEL;
}
