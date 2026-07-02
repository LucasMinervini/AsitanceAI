import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

interface AnimatedBubbleProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /**
   * Dirección de entrada: 'right' (mensaje del usuario, desde su lado), 'left'
   * (respuesta de la IA) o 'up' (default, sube desde abajo).
   */
  readonly from?: 'up' | 'left' | 'right';
}

/**
 * Burbuja que entra con una animación **one-shot** (fade + leve slide-up + scale) al
 * montarse. No deja loop de rAF: la animación corre una vez y para. Gracias al
 * keyExtractor estable de la FlatList, cada mensaje se monta una sola vez, así no
 * re-anima en cada render (solo la burbuja nueva entra animada). `useNativeDriver:false`
 * para mantener compatibilidad con react-native-web, igual que el HistoryDrawer.
 */
export function AnimatedBubble({ children, style, from = 'up' }: AnimatedBubbleProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spring one-shot: leve overshoot → un "pop" sutil al entrar (más vivo que un timing
    // lineal). Corre una vez y para; no deja loop de rAF.
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [enter]);

  // El spring puede pasar levemente de 1: el rango extra da el overshoot del scale (pop)
  // y clampea la opacidad para que no parpadee por encima de 1.
  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  // Desplazamiento inicial según la dirección; se clampea para que el slide asiente crisp
  // (el overshoot vivo lo aporta el scale, no el desplazamiento).
  const fromX = from === 'right' ? 22 : from === 'left' ? -22 : 0;
  const fromY = from === 'up' ? 10 : 0;
  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [fromX, 0], extrapolate: 'clamp' });
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0], extrapolate: 'clamp' });
  const scale = enter.interpolate({ inputRange: [0, 1, 1.15], outputRange: [0.94, 1.0, 1.03] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
