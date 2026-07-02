import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

interface PopInProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Envuelve a su hijo con una entrada **one-shot** (fade + scale con leve overshoot) al
 * montarse — un "pop" que llama la atención sin ser un loop siempre-activo (esos saturan
 * el render en web). Ideal para elementos que aparecen/desaparecen, como el FAB ↓.
 * `useNativeDriver:false` por compat web, igual que el resto de las animaciones.
 */
export function PopIn({ children, style }: PopInProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: false,
    }).start();
  }, [enter]);

  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const scale = enter.interpolate({ inputRange: [0, 1, 1.2], outputRange: [0.5, 1.0, 1.06] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>
  );
}
