import { useEffect, useRef } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useConversationList } from '../hooks/useConversationList';
import { buildConversationTabs } from '../view-models/conversationTabs';
import { colors, font, glow, radius, spacing } from '../theme/theme';

interface ConversationTabsProps {
  /** Id de la conversación abierta (para resaltar su chip). */
  readonly activeId?: string;
  readonly onSelect: (id: string) => void;
  readonly onNew: () => void;
}

/**
 * Selector rápido: tira horizontal de chips de las conversaciones, con la activa
 * resaltada y un chip ＋ para crear una nueva — sin abrir el drawer. Reusa el
 * ConversationListViewModel (lista ya testeada) y delega el armado de chips en el
 * módulo puro buildConversationTabs. Recarga al montar y al cambiar la conversación
 * activa (refleja charlas nuevas / renombradas).
 */
export function ConversationTabs({ activeId, onSelect, onNew }: ConversationTabsProps) {
  const { state, viewModel } = useConversationList();
  const scrollRef = useRef<ScrollView>(null);
  // Posición (x + ancho) de cada chip, medida con onLayout, para revelar el activo.
  const layouts = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    void viewModel.load();
  }, [viewModel, activeId]);

  // Auto-scroll: al cambiar la charla activa (o al cargar la lista), trae su chip a la
  // vista si quedó fuera. rAF (one-shot) para que el onLayout ya haya medido.
  useEffect(() => {
    if (activeId === undefined) return;
    const raf = requestAnimationFrame(() => {
      const layout = layouts.current[activeId];
      if (layout !== undefined) {
        scrollRef.current?.scrollTo({ x: Math.max(0, layout.x - spacing.md), animated: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [activeId, state.items.length]);

  const tabs = buildConversationTabs(state.items, activeId);

  // Nada que mostrar hasta que exista al menos una conversación (primer arranque).
  if (tabs.length === 0) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[styles.tab, tab.active && styles.tabActive]}
          onLayout={(e: LayoutChangeEvent) => {
            const { x, width } = e.nativeEvent.layout;
            layouts.current[tab.id] = { x, width };
          }}
          onPress={() => {
            if (!tab.active) onSelect(tab.id);
          }}
        >
          <Text
            style={[styles.tabText, tab.active && styles.tabTextActive]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
      <Pressable style={styles.newTab} onPress={onNew} accessibilityLabel="Nueva conversación">
        <Text style={styles.newTabText}>＋</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0, marginBottom: spacing.sm },
  content: { gap: spacing.sm, alignItems: 'center', paddingRight: spacing.sm },
  tab: {
    maxWidth: 160,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primaryBright,
    backgroundColor: 'rgba(99,102,241,0.16)',
    ...glow(colors.primary, 0.4, 10),
  },
  tabText: { color: colors.textMuted, fontSize: font.tiny, fontFamily: font.display },
  tabTextActive: { color: colors.textPrimary, fontWeight: font.semibold as '600' },
  newTab: {
    width: 34,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow(colors.primary, 0.35, 8),
  },
  newTabText: { color: colors.primaryBright, fontSize: 16, fontWeight: font.bold, lineHeight: 18 },
});
