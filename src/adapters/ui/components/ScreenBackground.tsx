import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AiBackdrop } from './AiBackdrop';
import { gradient } from '../theme/theme';

/**
 * Fondo estándar de la app: gradiente oscuro + motivo IA (orbes). Se monta como capa
 * de fondo (absolute fill, sin capturar toques) para dar cohesión visual entre pantallas
 * — el Chat usa su propia versión con parallax de scroll; Onboarding y Ajustes usan esta.
 * Colocarlo como primer hijo del contenedor: el contenido se pinta encima.
 */
export function ScreenBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      <AiBackdrop width={width} height={height} />
    </View>
  );
}
