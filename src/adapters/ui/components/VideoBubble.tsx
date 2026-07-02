import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius, spacing } from '../theme/theme';

interface VideoBubbleProps {
  /** URL del video generado (remota o data URL). */
  readonly uri: string;
}

/**
 * Reproduce el video generado dentro de la burbuja, con controles nativos y pantalla
 * completa. `useVideoPlayer` es un hook → por eso es un componente propio (cada burbuja
 * de video monta su instancia). No autoplay: el video es el entregable, el usuario lo
 * reproduce cuando quiere.
 */
export function VideoBubble({ uri }: VideoBubbleProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <View style={styles.wrap}>
      <VideoView style={styles.video} player={player} nativeControls allowsFullscreen contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 220,
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  video: { width: '100%', height: '100%' },
});
