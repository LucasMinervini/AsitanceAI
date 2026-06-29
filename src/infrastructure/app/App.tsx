import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { expoEnvSource, loadEnv } from '@infrastructure/config/env';

type Bootstrap = { ok: true; container: Container } | { ok: false; error: string };

/**
 * Implementación de runtime del BinaryUpload (transcripción de audio). Lee el archivo
 * local como Blob y lo sube como cuerpo crudo del POST. En RN el `fetch` con body
 * `Blob` desde un `file://` es la vía confiable para binario (a diferencia de
 * `ArrayBuffer`, que es frágil); el Content-Type lo fija el adaptador en los headers.
 * Cada etapa anota su propio error para poder diagnosticar dónde falla en el celular.
 */
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

/**
 * Implementación de runtime del ImageDownload (generación de imágenes FLUX). Llama
 * a la API POST de HF Inference, recibe la respuesta binaria (imagen JPEG/PNG) y la
 * convierte a data URL base64 via FileReader (disponible en el entorno de RN).
 */
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

function bootstrap(): Bootstrap {
  try {
    return {
      ok: true,
      container: createContainer(loadEnv(expoEnvSource()), AsyncStorage, uploadBinary, downloadImage),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export default function App() {
  // Composition Root del runtime. Resiliente: si la config (env) es invalida, muestra
  // el mensaje en vez de crashear con pantalla blanca.
  const [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const boot = useMemo(bootstrap, []);

  if (!fontsLoaded) {
    return null;
  }

  if (!boot.ok) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>Error de configuración</Text>
          <Text style={styles.errorMessage}>{boot.error}</Text>
          <Text style={styles.errorHint}>
            Revisá el archivo .env (variables EXPO_PUBLIC_AI_AGENT_*) y reiniciá el servidor.
          </Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DependenciesProvider deps={boot.container}>
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
});
