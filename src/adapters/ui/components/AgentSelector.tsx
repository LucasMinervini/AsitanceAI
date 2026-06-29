import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDependencies } from '../di/DependenciesContext';
import { colors, font, glow, radius, spacing } from '../theme/theme';

export interface AgentMeta {
  readonly icon: string;
  readonly name: string;
  readonly tagline: string;
  /** Categoría de agrupación visual en el selector. */
  readonly category: string;
}

/**
 * Metadata visual por proveedor. Agregar un agente nuevo = sumar una entrada aquí:
 *   · key      → coincide con el valor de AiAgentProvider en env.ts
 *   · category → determina el grupo en el selector (el orden de aparición define el
 *                orden de las secciones; no hace falta ninguna lista separada)
 */
export const AGENT_META: Record<string, AgentMeta> = {
  // ── Chat ───────────────────────────────────────────────────────────────────
  ollama: {
    icon: '🦙',
    name: 'Ollama',
    tagline: 'Local · sin internet · 100 % gratis',
    category: 'Chat',
  },
  huggingface: {
    icon: '🤗',
    name: 'HuggingFace',
    tagline: 'Cloud · texto · token gratuito · multimodal',
    category: 'Chat',
  },
  // ── Creación de imágenes ───────────────────────────────────────────────────
  flux: {
    icon: '🍌',
    name: 'Nano Banana',
    tagline: 'FLUX.1-schnell · generación de imágenes · cloud · gratis',
    category: 'Creación de imágenes',
  },
  // ── Video ──────────────────────────────────────────────────────────────────
  krea: {
    icon: '🎬',
    name: 'Krea Video',
    tagline: 'krea-realtime-video · generación de video · Colab/ngrok',
    category: 'Video',
  },
  hunyuan: {
    icon: '🎥',
    name: 'HunyuanVideo',
    tagline: 'tencent/HunyuanVideo-1.5 · video HD · fal-ai · token HF',
    category: 'Video',
  },
};

export const metaFor = (provider: string): AgentMeta =>
  AGENT_META[provider] ?? { icon: '🤖', name: provider, tagline: '', category: 'Otros' };

/**
 * Selector de agente de IA. Trigger compacto (pill) → bottom-sheet con agentes
 * agrupados por categoría. Agregar un agente: (1) añadir a AiAgentProvider +
 * adapter + DI wiring, (2) sumar la entrada en AGENT_META con su category.
 */
export function AgentSelector() {
  const { agentSelector } = useDependencies();
  const [selected, setSelected] = useState(agentSelector.selected);
  const [open, setOpen] = useState(false);

  const choose = (provider: string): void => {
    setSelected(provider);
    agentSelector.select(provider);
    setOpen(false);
  };

  const activeMeta = metaFor(selected);

  /**
   * Agrupa los proveedores disponibles por categoría preservando el orden de
   * primera aparición (que define el orden de las secciones en el sheet).
   */
  const categories = useMemo<Array<[string, string[]]>>(() => {
    const groups = new Map<string, string[]>();
    for (const provider of agentSelector.available) {
      const cat = metaFor(provider).category;
      const group = groups.get(cat);
      if (group === undefined) {
        groups.set(cat, [provider]);
      } else {
        group.push(provider);
      }
    }
    return Array.from(groups.entries());
  }, [agentSelector.available]);

  return (
    <>
      {/* ── Trigger ── */}
      <View style={styles.strip}>
        <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
          <View style={styles.statusDot} />
          <Text style={styles.triggerIcon}>{activeMeta.icon}</Text>
          <Text style={styles.triggerLabel}>{activeMeta.name}</Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
        <Text style={styles.modelBadge} numberOfLines={1}>
          {agentSelector.model}
        </Text>
      </View>

      {/* ── Bottom-sheet de selección ── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Agente de IA</Text>
            <Text style={styles.sheetSubtitle}>
              Todos son gratuitos. Cambiá en runtime sin reiniciar la app.
            </Text>

            {/* Lista scrolleable por si hay muchos agentes */}
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {categories.map(([category, providers], catIndex) => (
                <View key={category} style={catIndex > 0 ? styles.categorySpacer : undefined}>
                  {/* ── Header de sección ── */}
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
                    <View style={styles.categoryLine} />
                  </View>

                  {/* ── Cards del grupo ── */}
                  <View style={styles.agentGroup}>
                    {providers.map((provider) => {
                      const meta = metaFor(provider);
                      const active = provider === selected;
                      return (
                        <Pressable
                          key={provider}
                          style={[styles.agentRow, active && styles.agentRowActive]}
                          onPress={() => choose(provider)}
                        >
                          <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                            <Text style={styles.agentIcon}>{meta.icon}</Text>
                          </View>

                          <View style={styles.agentTexts}>
                            <Text style={[styles.agentName, active && styles.agentNameActive]}>
                              {meta.name}
                            </Text>
                            <Text style={styles.agentTagline}>{meta.tagline}</Text>
                          </View>

                          {active ? (
                            <View style={styles.checkCircle}>
                              <Text style={styles.checkMark}>✓</Text>
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Padding final dentro del scroll */}
              <View style={styles.scrollPad} />
            </ScrollView>

            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Trigger strip ──────────────────────────────────────────────────────────
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    backgroundColor: colors.surface,
    ...glow(colors.primary, 0.35, 10),
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.cyan,
    ...glow(colors.cyan, 0.9, 6),
  },
  triggerIcon: { fontSize: 14 },
  triggerLabel: {
    color: colors.textPrimary,
    fontSize: font.small,
    fontFamily: font.display,
    fontWeight: font.semibold as '600',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  modelBadge: {
    marginLeft: 'auto',
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: font.tiny,
    fontFamily: font.display,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgMid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
    ...glow('#000000', 0.7, 24),
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: font.heading,
    fontFamily: font.displayBold,
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.md,
  },

  // ── Scroll y secciones ────────────────────────────────────────────────────
  scroll: { maxHeight: 440 },
  scrollPad: { height: spacing.sm },
  categorySpacer: { marginTop: spacing.lg },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: font.display,
    fontWeight: font.bold as '800',
    letterSpacing: 1,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Agent cards ────────────────────────────────────────────────────────────
  agentGroup: { gap: spacing.sm },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  agentRowActive: {
    borderColor: colors.primaryBright,
    backgroundColor: 'rgba(99,102,241,0.14)',
    ...glow(colors.primary, 0.45, 14),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
    ...glow(colors.primary, 0.6, 10),
  },
  agentIcon: { fontSize: 24 },
  agentTexts: { flex: 1 },
  agentName: {
    color: colors.textSecondary,
    fontSize: font.body,
    fontFamily: font.display,
    fontWeight: font.semibold as '600',
    marginBottom: 3,
  },
  agentNameActive: { color: colors.textPrimary },
  agentTagline: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 18,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow(colors.primary, 0.55, 8),
  },
  checkMark: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: font.bold as '800',
  },

  // ── Cerrar ────────────────────────────────────────────────────────────────
  closeBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: font.semibold as '600',
    fontFamily: font.display,
  },
});
