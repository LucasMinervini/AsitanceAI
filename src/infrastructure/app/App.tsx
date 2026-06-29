import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DependenciesProvider } from '@adapters/ui/di/DependenciesContext';
import { RootNavigator } from '@adapters/ui/navigation/RootNavigator';
import type { BinaryUpload, ImageDownload } from '@adapters/ai-agents/http';
import { createContainer, type Container } from '@infrastructure/di/container';
import { expoEnvSource, loadEnv, type EnvConfig } from '@infrastructure/config/env';

type AppPhase =
  | { phase: 'loading' }
  | { phase: 'ready'; container: Container }
  | { phase: 'error'; message: string };

const uploadBinary: BinaryUpload = async (url, fileUri, headers) => {
  let fileBlob: Blob;
  try {
    fileBlob = await (await fetch(fileUri)).blob();
  } catch (e) {
    throw new Error(`leer audio [${fileUri}] → ${e instanceof Error ? e.message : String(e)}`);
  }
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: fileBlob });
  } catch (e) {
    throw new Error(`POST a [${url}] → ${e instanceof Error ? e.message : String(e)}`);
  }
  return { status: response.status, body: await response.text() };
};

const downloadImage: ImageDownload = async (url, prompt, headers) => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    });
  } catch (e) {
    throw new Error(`POST a [${url}] → ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { status: response.status, dataUrl: '', body };
  }
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => { resolve(reader.result as string); };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { status: response.status, dataUrl, body: '' };
};

/**
 * Lee los overrides de ajustes guardados por el usuario y los fusiona con la
 * configuracion de build (expoEnvSource). Los valores almacenados tienen prioridad.
 */
async function buildEnv(): Promise<EnvConfig> {
  const [storedApiKey, storedOllamaUrl] = await Promise.all([
    AsyncStorage.getItem('settings:apiKey'),
    AsyncStorage.getItem('settings:ollamaBaseUrl'),
  ]);
  const base = expoEnvSource();
  return loadEnv({
    ...base,
    ...(storedApiKey !== null ? { AI_AGENT_API_KEY: storedApiKey } : {}),
    ...(storedApiKey !== null ? { AI_STT_API_KEY: storedApiKey } : {}),
    ...(storedOllamaUrl !== null ? { AI_AGENT_BASE_URL: storedOllamaUrl } : {}),
  });
}

export default function App() {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const [appPhase, setAppPhase] = useState<AppPhase>({ phase: 'loading' });
  const [bootKey, setBootKey] = useState(0);

  const restartApp = useCallback(() => setBootKey((k) => k + 1), []);

  // Red de seguridad anti-brick: si una config guardada invalida hace fallar loadEnv,
  // esta es la unica via de vuelta — borra los overrides del usuario y reintenta con
  // los defaults del build (sin reinstalar la app).
  const resetSavedSettings = useCallback(() => {
    Promise.all([
      AsyncStorage.removeItem('settings:apiKey'),
      AsyncStorage.removeItem('settings:ollamaBaseUrl'),
    ]).finally(() => setBootKey((k) => k + 1));
  }, []);

  useEffect(() => {
    setAppPhase({ phase: 'loading' });
    buildEnv()
      .then((env) => {
        const container = createContainer(env, AsyncStorage, uploadBinary, downloadImage);
        setAppPhase({ phase: 'ready', container });
      })
      .catch((error) => {
        setAppPhase({
          phase: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }, [bootKey]);

  if (!fontsLoaded || appPhase.phase === 'loading') {
    return null;
  }

  if (appPhase.phase === 'error') {
    return (
      <SafeAreaProvider>
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>Error de configuración</Text>
          <Text style={styles.errorMessage}>{appPhase.message}</Text>
          <Text style={styles.errorHint}>
            Revisá las variables EXPO_PUBLIC_AI_AGENT_* o los ajustes guardados en la app.
          </Text>
          <Pressable style={styles.resetBtn} onPress={resetSavedSettings}>
            <Text style={styles.resetBtnText}>Borrar ajustes guardados y reintentar</Text>
          </Pressable>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  const deps = { ...appPhase.container, restartApp };

  return (
    <SafeAreaProvider>
      <DependenciesProvider deps={deps}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </DependenciesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: { color: '#fca5a5', fontSize: 20, fontWeight: '800' },
  errorMessage: { color: '#f1f5f9', fontSize: 14 },
  errorHint: { color: '#94a3b8', fontSize: 13 },
  resetBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: '#fca5a5', fontSize: 14, fontWeight: '600' },
});
