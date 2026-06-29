import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDependencies } from '../di/DependenciesContext';
import { metaFor } from '../components/AgentSelector';
import { colors, font, glow, radius, spacing } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = ['welcome', 'agent', 'done'] as const;
type Step = (typeof STEPS)[number];

const FEATURES = [
  { icon: '💬', label: 'Chat con múltiples agentes de IA' },
  { icon: '🎤', label: 'Dictar mensajes por voz' },
  { icon: '📎', label: 'Adjuntar archivos e imágenes' },
  { icon: '🖼️', label: 'Generar imágenes con FLUX' },
];

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { agentSelector, completeOnboarding } = useDependencies();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedAgent, setSelectedAgent] = useState(agentSelector.selected);

  const pickAgent = (provider: string): void => {
    setSelectedAgent(provider);
    agentSelector.select(provider);
  };

  const finish = (): void => {
    void completeOnboarding().then(() => {
      navigation.replace('Chat');
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
      {/* ── Indicador de pasos ── */}
      <View style={styles.dots}>
        {STEPS.map((s) => (
          <View key={s} style={[styles.dot, s === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════ PASO 1: BIENVENIDA ══════════════ */}
        {step === 'welcome' && (
          <View style={styles.section}>
            <Text style={styles.emoji}>🤖</Text>
            <Text style={styles.title}>Asistente IA</Text>
            <Text style={styles.subtitle}>
              Tu copiloto de inteligencia artificial.{'\n'}Gratuito, privado y sin límites.
            </Text>

            <View style={styles.featureList}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ══════════════ PASO 2: ELEGIR AGENTE ══════════════ */}
        {step === 'agent' && (
          <View style={styles.section}>
            <Text style={styles.title}>¿Con qué agente empezás?</Text>
            <Text style={styles.subtitle}>Podés cambiarlo en cualquier momento desde la app.</Text>

            <View style={styles.agentGrid}>
              {agentSelector.available.map((provider) => {
                const meta = metaFor(provider);
                const active = provider === selectedAgent;
                return (
                  <Pressable
                    key={provider}
                    style={[styles.agentCard, active && styles.agentCardActive]}
                    onPress={() => pickAgent(provider)}
                  >
                    <View style={[styles.agentIconWrap, active && styles.agentIconWrapActive]}>
                      <Text style={styles.agentIcon}>{meta.icon}</Text>
                    </View>
                    <Text style={[styles.agentName, active && styles.agentNameActive]}>
                      {meta.name}
                    </Text>
                    <Text style={styles.agentTagline} numberOfLines={2}>
                      {meta.tagline}
                    </Text>
                    {active && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.agentHint}>
              <Text style={styles.agentHintText}>
                💡 HuggingFace, FLUX y HunyuanVideo requieren un token gratuito de{' '}
                <Text style={styles.agentHintLink}>huggingface.co</Text>.
                {'\n'}Ollama corre 100 % local sin internet.
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════ PASO 3: LISTO ══════════════ */}
        {step === 'done' && (
          <View style={styles.section}>
            <View style={styles.doneCircle}>
              <Text style={styles.doneCheck}>✓</Text>
            </View>
            <Text style={styles.title}>¡Todo listo!</Text>
            <Text style={styles.subtitle}>
              Empezá a chatear, dictá por voz, adjuntá archivos o generá imágenes.
            </Text>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>Tip rápido</Text>
              <Text style={styles.tipText}>
                Tocá ☰ en la esquina superior derecha para ver y gestionar tus conversaciones guardadas.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Botón de avance ── */}
      <View style={styles.footer}>
        {step === 'welcome' && (
          <Pressable style={styles.btn} onPress={() => setStep('agent')}>
            <Text style={styles.btnText}>Comenzar →</Text>
          </Pressable>
        )}
        {step === 'agent' && (
          <Pressable style={styles.btn} onPress={() => setStep('done')}>
            <Text style={styles.btnText}>Continuar →</Text>
          </Pressable>
        )}
        {step === 'done' && (
          <Pressable style={styles.btn} onPress={finish}>
            <Text style={styles.btnText}>Abrir el asistente</Text>
          </Pressable>
        )}
        {step !== 'welcome' && (
          <Pressable
            style={styles.backBtn}
            onPress={() => setStep(step === 'done' ? 'agent' : 'welcome')}
          >
            <Text style={styles.backBtnText}>← Atrás</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgFrom,
  },

  // ── Pasos ──────────────────────────────────────────────────────────────────
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
    ...glow(colors.primary, 0.6, 6),
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // ── Sección genérica ───────────────────────────────────────────────────────
  section: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },

  // ── Paso 1 ─────────────────────────────────────────────────────────────────
  emoji: { fontSize: 64 },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontFamily: font.displayBold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: font.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  featureIcon: { fontSize: 22 },
  featureLabel: {
    color: colors.textSecondary,
    fontSize: font.body,
    fontFamily: font.display,
    flex: 1,
  },

  // ── Paso 2 ─────────────────────────────────────────────────────────────────
  agentGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  agentCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: 6,
    position: 'relative',
  },
  agentCardActive: {
    borderColor: colors.primaryBright,
    backgroundColor: 'rgba(99,102,241,0.12)',
    ...glow(colors.primary, 0.4, 12),
  },
  agentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  agentIconWrapActive: {
    backgroundColor: colors.primary,
    ...glow(colors.primary, 0.5, 8),
  },
  agentIcon: { fontSize: 22 },
  agentName: {
    color: colors.textSecondary,
    fontSize: font.small,
    fontFamily: font.display,
    fontWeight: font.semibold as '600',
  },
  agentNameActive: { color: colors.textPrimary },
  agentTagline: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow(colors.primary, 0.5, 6),
  },
  checkMark: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: font.bold as '800',
  },
  agentHint: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  agentHintText: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 20,
  },
  agentHintLink: { color: colors.primaryBright },

  // ── Paso 3 ─────────────────────────────────────────────────────────────────
  doneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow(colors.primary, 0.7, 20),
  },
  doneCheck: {
    color: colors.onPrimary,
    fontSize: 36,
    fontWeight: font.bold as '800',
  },
  tipBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.cyan,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  tipTitle: {
    color: colors.cyan,
    fontSize: font.small,
    fontFamily: font.display,
    fontWeight: font.semibold as '600',
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: font.small,
    lineHeight: 20,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...glow(colors.primary, 0.5, 12),
  },
  btnText: {
    color: colors.onPrimary,
    fontSize: font.body,
    fontFamily: font.displayBold,
    fontWeight: font.bold as '800',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: font.small,
  },
});
