import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDependencies } from '../di/DependenciesContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { SettingsViewModel } from '../view-models/SettingsViewModel';
import { colors, font, glow, radius, spacing } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/**
 * Renders the settings screen for API and Ollama configuration.
 *
 * Loads persisted settings into editable fields, lets the user save changes, and triggers an app restart after a successful save. Also provides a reset action for the onboarding flow.
 */
export function SettingsScreen(_props: Props) {
  const { getSettings, saveSettings, restartApp, resetOnboarding } = useDependencies();

  const vmRef = useRef(new SettingsViewModel(getSettings, saveSettings));
  const vm = vmRef.current;

  const state = useSyncExternalStore(
    (cb) => vm.subscribe(cb),
    () => vm.getState(),
  );

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [localOllamaUrl, setLocalOllamaUrl] = useState('');

  useEffect(() => {
    vm.load();
  }, [vm]);

  // Sync form fields once data loads
  useEffect(() => {
    if (state.phase === 'idle') {
      setLocalApiKey(state.apiKey);
      setLocalOllamaUrl(state.ollamaBaseUrl);
    }
  }, [state.phase, state.apiKey, state.ollamaBaseUrl]);

  // After save completes, restart the container and go back
  useEffect(() => {
    if (state.phase === 'saved') {
      const t = setTimeout(() => restartApp(), 600);
      return () => clearTimeout(t);
    }
  }, [state.phase, restartApp]);

  const handleSave = () => {
    void vm.save(localApiKey, localOllamaUrl);
  };

  const isBusy = state.phase === 'loading' || state.phase === 'saving' || state.phase === 'saved';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>AGENTE DE IA</Text>

        {/* API Key */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Token de HuggingFace / API Key</Text>
          <Text style={styles.hint}>
            Requerido para HuggingFace, FLUX, krea y HunyuanVideo.
            Dejalo vacío para Ollama local.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={localApiKey}
              onChangeText={setLocalApiKey}
              placeholder="hf_xxxxxxxxxxxxxxxx"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!apiKeyVisible}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setApiKeyVisible((v) => !v)}
              hitSlop={8}
            >
              <Text style={styles.eyeIcon}>{apiKeyVisible ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Ollama URL */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>URL de Ollama</Text>
          <Text style={styles.hint}>
            Ejemplo: http://192.168.1.4:11434/api (tu IP local).
            Dejalo vacío para usar el default del .env.
          </Text>
          <TextInput
            style={styles.input}
            value={localOllamaUrl}
            onChangeText={setLocalOllamaUrl}
            placeholder="http://192.168.1.x:11434/api"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isBusy}
          />
        </View>

        {state.phase === 'error' && (
          <Text style={styles.errorText}>{state.error}</Text>
        )}

        {/* Save button */}
        <Pressable
          style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isBusy}
        >
          {state.phase === 'saving' ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : state.phase === 'saved' ? (
            <Text style={styles.saveBtnText}>Guardado ✓ — reiniciando…</Text>
          ) : (
            <Text style={styles.saveBtnText}>Guardar y reiniciar</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Los ajustes se combinan con las variables del .env.{'\n'}
          Dejá un campo vacío para usar el valor del .env.
        </Text>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>DESARROLLO</Text>

        <Pressable
          style={styles.dangerBtn}
          onPress={() => { void resetOnboarding().then(restartApp); }}
          disabled={isBusy}
        >
          <Text style={styles.dangerBtnText}>Resetear pantalla de bienvenida</Text>
        </Pressable>
        <Text style={styles.footer}>Vuelve a mostrar el onboarding al reiniciar.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgFrom },
  content: { padding: spacing.xl, gap: spacing.lg },

  sectionLabel: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: font.bold,
    letterSpacing: 1.2,
    marginBottom: -spacing.sm,
  },

  fieldGroup: { gap: spacing.sm },

  label: {
    color: colors.textSecondary,
    fontSize: font.small,
    fontWeight: font.semibold,
  },
  hint: {
    color: colors.textMuted,
    fontSize: font.tiny,
    lineHeight: 18,
  },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputFlex: { flex: 1 },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: font.body,
    fontFamily: font.display,
  },

  eyeBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyeIcon: { fontSize: 18 },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...glow(colors.primary, 0.4),
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: colors.onPrimary,
    fontSize: font.body,
    fontWeight: font.bold,
    fontFamily: font.displayBold,
  },

  errorText: {
    color: colors.danger,
    fontSize: font.small,
  },

  footer: {
    color: colors.textMuted,
    fontSize: font.tiny,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: colors.danger,
    fontSize: font.small,
    fontWeight: font.semibold,
  },
});
