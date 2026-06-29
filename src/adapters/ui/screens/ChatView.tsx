import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { AgentSelector, metaFor } from '../components/AgentSelector';
import { AiBackdrop } from '../components/AiBackdrop';
import { AnimatedBubble } from '../components/AnimatedBubble';
import { ChatEmptyState } from '../components/ChatEmptyState';
import { PressableScale } from '../components/PressableScale';
import { useAssistant } from '../hooks/useAssistant';
import { useDependencies } from '../di/DependenciesContext';
import { colors, font, glow, gradient, radius, spacing } from '../theme/theme';
import {
  composeAttachmentMessage,
  type Attachment,
} from '../view-models/composeAttachmentMessage';
import { buildChatRows, type ChatRow } from '../view-models/chatRows';
import type { ChatViewModel } from '../view-models/ChatViewModel';

interface ChatViewProps {
  readonly viewModel: ChatViewModel;
}

/** Extensiones que tratamos como texto legible para inyectar su contenido al prompt. */
const TEXT_FILE = /\.(txt|md|markdown|json|csv|tsv|log|js|jsx|ts|tsx|py|java|c|cpp|cs|go|rb|php|html|css|xml|ya?ml|ini|sh)$/i;
const MAX_ATTACHMENT_CHARS = 8000;

/**
 * Texto de espera según la categoría del agente activo. La generación de imagen/video
 * tarda bastante más que el chat; avisarlo evita que parezca colgado.
 */
function generatingLabel(category: string): string {
  if (category === 'Creación de imágenes') return '🎨 Generando imagen… puede tardar';
  if (category === 'Video') return '🎬 Generando video… esto tarda un poco';
  return 'La IA está pensando…';
}

/** Mime type del audio grabado, inferido de la extensión que produjo expo-audio. */
function mimeForUri(uri: string): string {
  if (uri.endsWith('.webm')) return 'audio/webm';
  if (uri.endsWith('.wav')) return 'audio/wav';
  if (uri.endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/m4a';
}

/** Lee el contenido si el archivo parece texto; si es binario (imagen, pdf) devuelve null. */
async function readTextContent(asset: DocumentPicker.DocumentPickerAsset): Promise<string | null> {
  const looksText =
    (asset.mimeType?.startsWith('text/') ?? false) ||
    asset.mimeType === 'application/json' ||
    TEXT_FILE.test(asset.name);
  if (!looksText) {
    return null;
  }
  try {
    const text = await (await fetch(asset.uri)).text();
    return text.length > MAX_ATTACHMENT_CHARS
      ? `${text.slice(0, MAX_ATTACHMENT_CHARS)}\n…(truncado)`
      : text;
  } catch {
    return null;
  }
}

/** Lee un archivo local (file://) y lo devuelve como data URL base64 (para visión). */
async function fileUriToDataUrl(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}

/** Parte presentacional del chat: fondo con gradiente + motivo IA con parallax. */
export function ChatView({ viewModel }: ChatViewProps) {
  const { messages, status, error, send } = useAssistant(viewModel);
  const { transcribeAudio, agentSelector } = useDependencies();
  const [text, setText] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isSending = status === 'sending';
  const isEmpty = messages.length === 0;
  const isBusy = isSending || isTranscribing;
  const { width, height } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatRow>>(null);
  const rows = useMemo(() => buildChatRows(messages), [messages]);

  // Auto-scroll al último mensaje cuando llega uno nuevo o aparece "Pensando…".
  useEffect(() => {
    if (!isEmpty) {
      listRef.current?.scrollToEnd({ animated: true });
      setShowScrollDown(false);
    }
  }, [messages.length, isSending, isEmpty]);

  // Parallax: el fondo se desplaza ~15% del scroll (sin Animated → sin loop de rAF en web).
  const parallax = Math.max(-60, -scrollOffset * 0.15);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollOffset(contentOffset.y);
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setShowScrollDown(distanceFromBottom > 140);
  };

  const submit = (value: string): void => {
    if (isSending) {
      return;
    }
    // Imagen adjunta → visión: se manda la imagen (data URL) para que el modelo la "vea",
    // con el texto escrito o un prompt por defecto si solo se adjuntó la foto.
    const imageUrl = attachment?.previewUri;
    if (imageUrl !== undefined) {
      const prompt = value.trim().length > 0 ? value.trim() : '¿Qué hay en esta imagen?';
      setText('');
      setAttachment(null);
      send(prompt, imageUrl);
      return;
    }
    const composed = composeAttachmentMessage(value, attachment);
    if (composed.trim().length === 0) {
      return;
    }
    setText('');
    setAttachment(null);
    send(composed);
  };

  const pickAttachment = async (): Promise<void> => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset === undefined) {
      return;
    }
    const isImage = asset.mimeType?.startsWith('image/') ?? false;
    let previewUri: string | undefined;
    if (isImage) {
      // La imagen se lee como data URL para que el agente de visión la pueda ver.
      try {
        previewUri = await fileUriToDataUrl(asset.uri);
      } catch {
        previewUri = asset.uri;
      }
    }
    setAttachment({ name: asset.name, content: await readTextContent(asset), previewUri });
  };

  // Abre la cámara y adjunta la foto como data URL: el agente de visión la "ve".
  const takePhoto = async (): Promise<void> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Necesito permiso para usar la cámara.');
      return;
    }
    setMediaError(null);
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset === undefined) {
      return;
    }
    const dataUrl =
      typeof asset.base64 === 'string'
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;
    setAttachment({ name: asset.fileName ?? 'foto.jpg', content: null, previewUri: dataUrl });
  };

  // Inicia la grabación (pide permiso de micrófono la primera vez).
  const startRecording = async (): Promise<void> => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Necesito permiso para usar el micrófono.');
      return;
    }
    setMediaError(null);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  // Detiene la grabación, transcribe el audio y manda el mensaje directamente
  // (sin pasar por el input). Si había texto escrito, lo antepone a lo dictado.
  const stopAndTranscribe = async (): Promise<void> => {
    setIsRecording(false);
    await recorder.stop();
    const uri = recorder.uri;
    if (uri === null) {
      return;
    }
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio.execute({ uri, mimeType: mimeForUri(uri) });
      if (result.ok) {
        const pending = text.trim();
        submit(pending.length > 0 ? `${pending} ${result.value}` : result.value);
      } else {
        setMediaError(result.error.message);
      }
    } catch {
      setMediaError('No se pudo procesar el audio grabado.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const onMicPress = (): void => {
    void (isRecording ? stopAndTranscribe() : startRecording());
  };

  const copy = (value: string, index: number): void => {
    void Clipboard.setStringAsync(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500);
  };

  // Categoría del agente activo: define el texto de espera (chat vs. imagen vs. video).
  // Leído en render; al enviar, el provider ya está fijado por el selector.
  const thinkingLabel = generatingLabel(metaFor(agentSelector.selected).category);
  const thinking = (
    <AnimatedBubble style={[styles.bubble, styles.assistantBubble, styles.thinkingBubble]}>
      <ActivityIndicator size="small" color={colors.primaryBright} />
      <Text style={styles.thinkingText}>{thinkingLabel}</Text>
    </AnimatedBubble>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: parallax }] }]}
      >
        <AiBackdrop width={width} height={height} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <AgentSelector />

        {isEmpty ? (
          <ChatEmptyState onPick={submit} />
        ) : (
          <FlatList
            ref={listRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={rows}
            keyExtractor={(item) => item.id}
            scrollEventThrottle={16}
            onScroll={onScroll}
            renderItem={({ item }: { item: ChatRow }) => {
              if (item.kind === 'date') {
                return (
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>{item.label}</Text>
                  </View>
                );
              }
              const { message, index, groupStart, groupEnd } = item;
              const isUser = message.role === 'user';
              return (
                <AnimatedBubble
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                    groupStart ? styles.bubbleGroupStart : styles.bubbleGrouped,
                  ]}
                >
                  {message.imageUrl !== undefined ? (
                    <Pressable onPress={() => setLightboxUri(message.imageUrl ?? null)}>
                      <Image source={{ uri: message.imageUrl }} style={styles.bubbleImage} />
                    </Pressable>
                  ) : null}
                  <Text style={styles.bubbleText}>{message.text}</Text>
                  {groupEnd && isUser ? (
                    <Text style={[styles.time, styles.timeOnPrimary]}>{message.time}</Text>
                  ) : null}
                  {groupEnd && !isUser ? (
                    <View style={styles.meta}>
                      <Text style={styles.time}>{message.time}</Text>
                      <Pressable hitSlop={6} onPress={() => copy(message.text, index)}>
                        <Text style={styles.copy}>
                          {copiedIndex === index ? 'Copiado ✓' : 'Copiar'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </AnimatedBubble>
              );
            }}
            ListFooterComponent={isSending ? thinking : null}
          />
        )}

        {showScrollDown && !isEmpty ? (
          <Pressable
            style={[styles.scrollDown, { bottom: Math.max(insets.bottom, spacing.lg) + 58 }]}
            onPress={() => listRef.current?.scrollToEnd({ animated: true })}
            accessibilityLabel="Bajar al último mensaje"
          >
            <Text style={styles.scrollDownIcon}>↓</Text>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mediaError ? <Text style={styles.error}>{mediaError}</Text> : null}

        {isRecording ? (
          <View style={styles.voiceStatus}>
            <View style={styles.recDot} />
            <Text style={styles.voiceStatusText}>Grabando… tocá ⏹ para transcribir</Text>
          </View>
        ) : null}
        {isTranscribing ? (
          <View style={styles.voiceStatus}>
            <ActivityIndicator size="small" color={colors.cyan} />
            <Text style={styles.voiceStatusText}>Transcribiendo audio…</Text>
          </View>
        ) : null}

        {attachment ? (
          <View style={styles.chip}>
            {attachment.previewUri ? (
              <Pressable onPress={() => setLightboxUri(attachment.previewUri ?? null)}>
                <Image source={{ uri: attachment.previewUri }} style={styles.chipThumb} />
              </Pressable>
            ) : null}
            <Text style={styles.chipText} numberOfLines={1}>
              {attachment.previewUri ? '🖼️' : '📎'} {attachment.name}
              {attachment.content === null && attachment.previewUri === undefined
                ? '  (solo referencia)'
                : ''}
            </Text>
            <Pressable hitSlop={8} onPress={() => setAttachment(null)} accessibilityLabel="Quitar adjunto">
              <Text style={styles.chipRemove}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.inputRow, { marginBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {/* Izquierda: adjuntar contenido (archivo / foto). */}
          <PressableScale
            style={styles.clip}
            onPress={() => void pickAttachment()}
            disabled={isBusy || isRecording}
            accessibilityLabel="Adjuntar archivo"
          >
            <Text style={styles.clipIcon}>📎</Text>
          </PressableScale>
          <PressableScale
            style={styles.clip}
            onPress={() => void takePhoto()}
            disabled={isBusy || isRecording}
            accessibilityLabel="Tomar foto con la cámara"
          >
            <Text style={styles.clipIcon}>📷</Text>
          </PressableScale>

          {/* Centro: el cuadro de texto. */}
          <TextInput
            style={[styles.input, isFocused && styles.inputFocused]}
            value={text}
            onChangeText={setText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Escribi tu mensaje..."
            placeholderTextColor={colors.textMuted}
            editable={!isBusy && !isRecording}
            onSubmitEditing={() => submit(text)}
          />

          {/* Derecha: dictar por voz y enviar. */}
          <PressableScale
            style={[styles.clip, isRecording && styles.micRecording]}
            onPress={onMicPress}
            disabled={isBusy}
            accessibilityLabel={isRecording ? 'Detener y transcribir' : 'Grabar audio'}
          >
            <Text style={styles.clipIcon}>{isRecording ? '⏹' : '🎤'}</Text>
          </PressableScale>
          <PressableScale
            style={[styles.button, (isBusy || isRecording) && styles.buttonDisabled]}
            onPress={() => submit(text)}
            disabled={isBusy || isRecording}
          >
            <Text style={styles.buttonText}>{isSending ? '...' : 'Enviar'}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      {/* Lightbox: la imagen tocada se muestra a pantalla completa; tocar cierra. */}
      <Modal
        visible={lightboxUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          {lightboxUri !== null ? (
            <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} resizeMode="contain" />
          ) : null}
          <Text style={styles.lightboxHint}>Tocá para cerrar</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgFrom },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { flex: 1 },
  listContent: { paddingVertical: spacing.sm },
  bubble: {
    maxWidth: '84%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
  },
  // Margen superior: amplio al empezar una tanda de otro remitente, ajustado entre
  // burbujas consecutivas del mismo (agrupado).
  bubbleGroupStart: { marginTop: spacing.md },
  bubbleGrouped: { marginTop: 3 },
  dateRow: { alignItems: 'center', marginVertical: spacing.md },
  dateLabel: {
    fontSize: font.tiny,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.bubbleUser, ...glow(colors.primary, 0.45, 10) },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bubbleAssistant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thinkingText: { color: colors.textSecondary, fontSize: font.small },
  bubbleText: { fontSize: font.body, color: colors.textPrimary, lineHeight: 21 },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  lightboxImage: { width: '100%', height: '85%' },
  lightboxHint: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, gap: spacing.md },
  time: { fontSize: 11, color: colors.textMuted },
  timeOnPrimary: { color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end', marginTop: 4 },
  copy: { fontSize: 12, color: colors.cyan, fontWeight: font.semibold },
  scrollDown: {
    position: 'absolute',
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow('#000000', 0.5, 10),
  },
  scrollDownIcon: { color: colors.textPrimary, fontSize: 20, fontWeight: font.bold, lineHeight: 22 },
  error: { color: colors.danger, marginVertical: spacing.sm },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.danger },
  voiceStatusText: { color: colors.textSecondary, fontSize: font.small },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chipThumb: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { flex: 1, color: colors.textSecondary, fontSize: font.small },
  chipRemove: { color: colors.danger, fontSize: font.body, fontWeight: font.bold },
  inputRow: { flexDirection: 'row', gap: spacing.xs + 2, alignItems: 'center' },
  clip: {
    width: 42,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipIcon: { fontSize: 19 },
  micRecording: {
    backgroundColor: 'rgba(252,165,165,0.18)',
    borderColor: colors.danger,
    ...glow(colors.danger, 0.4, 10),
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  inputFocused: { borderColor: colors.primaryBright, ...glow(colors.primary, 0.45, 12) },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 1,
    height: 46,
    justifyContent: 'center',
    ...glow(colors.primary, 0.55, 14),
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.onPrimary, fontWeight: font.bold },
});
