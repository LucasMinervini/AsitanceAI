import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

interface AnimatedBubbleProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Burbuja que entra con una animación **one-shot** (fade + leve slide-up + scale) al
 * montarse. No deja loop de rAF: la animación corre una vez y para. Gracias al
 * keyExtractor estable de la FlatList, cada mensaje se monta una sola vez, así no
 * re-anima en cada render (solo la burbuja nueva entra animada). `useNativeDriver:false`
 * para mantener compatibilidad con react-native-web, igual que el HistoryDrawer.
 */
export function AnimatedBubble({ children, style }: AnimatedBubbleProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [enter]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <Animated.View style={[style, { opacity: enter, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
