import { describe, it, expect } from 'vitest';
import { filterConversations } from '@adapters/ui/view-models/filterConversations';
import type { ConversationSummaryVM } from '@adapters/ui/view-models/ConversationListViewModel';

function item(partial: Partial<ConversationSummaryVM> & { id: string }): ConversationSummaryVM {
  return {
    id: partial.id,
    preview: partial.preview ?? '',
    messageCount: partial.messageCount ?? 0,
    title: partial.title,
    searchText: partial.searchText,
  };
}

const items: readonly ConversationSummaryVM[] = [
  item({ id: 'a', title: 'Plan de viaje', preview: 'reservar hotel', searchText: 'Plan de viaje reservar hotel vuelos a Madrid' }),
  item({ id: 'b', title: 'Recetas', preview: 'pasta al pesto', searchText: 'Recetas pasta al pesto albahaca' }),
  item({ id: 'c', preview: 'campaña de marketing', searchText: 'campaña de marketing presupuesto' }),
];

describe('filterConversations', () => {
  it('query vacía devuelve todos los items', () => {
    expect(filterConversations(items, '')).toEqual(items);
  });

  it('query con solo espacios devuelve todos los items', () => {
    expect(filterConversations(items, '   ')).toEqual(items);
  });

  it('filtra por título (case-insensitive)', () => {
    const result = filterConversations(items, 'RECETAS');
    expect(result.map((i) => i.id)).toEqual(['b']);
  });

  it('filtra por preview', () => {
    const result = filterConversations(items, 'hotel');
    expect(result.map((i) => i.id)).toEqual(['a']);
  });

  it('encuentra una palabra que solo está en el cuerpo (searchText), no en título ni preview', () => {
    const result = filterConversations(items, 'Madrid');
    expect(result.map((i) => i.id)).toEqual(['a']);
  });

  it('es insensible a acentos en ambos sentidos', () => {
    expect(filterConversations(items, 'campana').map((i) => i.id)).toEqual(['c']);
    expect(filterConversations(items, 'campaña').map((i) => i.id)).toEqual(['c']);
  });

  it('devuelve vacío cuando nada coincide', () => {
    expect(filterConversations(items, 'xyzzy')).toEqual([]);
  });

  it('funciona aunque el item no tenga searchText (cae a título + preview)', () => {
    const minimal = [item({ id: 'z', title: 'Solo título', preview: 'algo' })];
    expect(filterConversations(minimal, 'título').map((i) => i.id)).toEqual(['z']);
    expect(filterConversations(minimal, 'algo').map((i) => i.id)).toEqual(['z']);
  });
});
