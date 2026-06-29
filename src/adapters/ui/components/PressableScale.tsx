import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** Escala objetivo mientras está presionado (default 0.94). */
  readonly scaleTo?: number;
}

/**
 * Pressable con feedback táctil: hace **scale** animado (spring one-shot) al presionar
 * y vuelve al soltar. Reutilizable para botones. `useNativeDriver:false` por compat con
 * react-native-web, como el resto de las animaciones del proyecto. Si está `disabled`,
 * Pressable no dispara los eventos de press → no anima.
 */
export function PressableScale({ children, style, scaleTo = 0.94, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number): void => {
    Animated.spring(scale, { toValue: to, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  };

  const onPressIn = (event: GestureResponderEvent): void => {
    animateTo(scaleTo);
    rest.onPressIn?.(event);
  };

  const onPressOut = (event: GestureResponderEvent): void => {
    animateTo(1);
    rest.onPressOut?.(event);
  };

  return (
    <Pressable {...rest} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
