import { describe, it, expect } from 'vitest';
import { buildConversationTabs } from '@adapters/ui/view-models/conversationTabs';
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

describe('buildConversationTabs', () => {
  it('mapea cada conversación a un tab y marca el activo', () => {
    const items = [item({ id: 'a', preview: 'Hola' }), item({ id: 'b', preview: 'Chau' })];
    const tabs = buildConversationTabs(items, 'b');
    expect(tabs.map((t) => t.id)).toEqual(['a', 'b']);
    expect(tabs.find((t) => t.id === 'b')?.active).toBe(true);
    expect(tabs.find((t) => t.id === 'a')?.active).toBe(false);
  });

  it('el label prefiere el título sobre el preview', () => {
    const tabs = buildConversationTabs([item({ id: 'a', title: 'Mi charla', preview: 'Hola' })], 'a');
    expect(tabs[0]?.label).toBe('Mi charla');
  });

  it('el label cae al preview cuando no hay título', () => {
    const tabs = buildConversationTabs([item({ id: 'a', preview: 'Hola mundo' })], 'a');
    expect(tabs[0]?.label).toBe('Hola mundo');
  });

  it('agrega un chip sintético "Nueva charla" cuando la activa aún no está persistida', () => {
    const items = [item({ id: 'a', preview: 'Hola' })];
    const tabs = buildConversationTabs(items, 'conv-nueva');
    expect(tabs.map((t) => t.id)).toEqual(['conv-nueva', 'a']);
    expect(tabs[0]?.active).toBe(true);
    expect(tabs[0]?.label).toBe('Nueva charla');
  });

  it('no duplica el chip si la activa ya está en la lista', () => {
    const items = [item({ id: 'a' }), item({ id: 'b' })];
    const tabs = buildConversationTabs(items, 'a');
    expect(tabs).toHaveLength(2);
  });

  it('sin activeId ningún tab queda activo y no hay sintético', () => {
    const items = [item({ id: 'a' }), item({ id: 'b' })];
    const tabs = buildConversationTabs(items, undefined);
    expect(tabs.some((t) => t.active)).toBe(false);
    expect(tabs).toHaveLength(2);
  });

  it('lista vacía sin activeId devuelve vacío', () => {
    expect(buildConversationTabs([], undefined)).toEqual([]);
  });
});
