import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, glow, radius, spacing } from '../theme/theme';

interface ChatEmptyStateProps {
  /** Envía la sugerencia elegida como mensaje. */
  readonly onPick: (text: string) => void;
}

const SUGGESTIONS = [
  'Armame un plan de viaje de 3 días',
  'Explicame un concepto difícil',
  'Dame una receta rápida y rica',
];

/** Estado inicial del chat: bienvenida + sugerencias tocables (primera impresión). */
export function ChatEmptyState({ onPick }: ChatEmptyStateProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.wrap}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.orb}>
        <Text style={styles.orbMark}>✦</Text>
      </View>
      <Text style={styles.title}>¿En qué te ayudo?</Text>
      <Text style={styles.sub}>Elegí una idea o escribí tu mensaje abajo.</Text>

      <View style={styles.chips}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable key={suggestion} style={styles.chip} onPress={() => onPick(suggestion)}>
            <Text style={styles.chipText}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flex:1 ocupa el espacio entre las pestañas y el input; flexGrow+center centra cuando
  // hay lugar y deja scrollear (sin desbordar sobre el input) cuando el teclado lo comprime.
  scroll: { flex: 1 },
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  orb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...glow(colors.primary, 0.7, 22),
  },
  orbMark: { color: colors.onPrimary, fontSize: 32, fontFamily: font.displayBold },
  title: { color: colors.textPrimary, fontSize: font.title, fontFamily: font.displayBold },
  sub: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  chips: { alignSelf: 'stretch', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  chipText: { color: colors.textSecondary, fontSize: font.small, fontWeight: font.semibold },
});
