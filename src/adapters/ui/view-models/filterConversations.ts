import type { ConversationSummaryVM } from './ConversationListViewModel';

/**
 * Filtra la lista de conversaciones por texto. Modulo puro y testeable (sin React):
 * la UI mantiene el query en estado local y aplica esto sobre los summaries ya cargados.
 *
 * El match es case- y acento-insensible, y busca en titulo + preview + searchText
 * (este ultimo trae el texto completo de la conversacion, asi se encuentra una palabra
 * que solo aparece en medio de la charla). Query vacia o con solo espacios devuelve todo.
 */
export function filterConversations(
  items: readonly ConversationSummaryVM[],
  query: string,
): readonly ConversationSummaryVM[] {
  const q = normalize(query);
  if (q === '') {
    return items;
  }
  return items.filter((item) => {
    const haystack = normalize(
      [item.title, item.preview, item.searchText].filter((s) => s !== undefined).join(' '),
    );
    return haystack.includes(q);
  });
}

/** Minusculas + sin acentos (combining diacritical marks U+0300–U+036F) + sin espacios extremos. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
