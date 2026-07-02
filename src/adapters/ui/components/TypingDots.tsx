import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';

/**
 * Tres puntos que "rebotan" en secuencia — el clásico indicador de "escribiendo…".
 * El loop es **acotado**: solo vive mientras la burbuja "pensando" está montada (durante
 * el request) y se **detiene en el cleanup** al desmontar. No es un loop siempre-activo
 * (esos saturan el render en react-native-web, ver CLAUDE.md). `useNativeDriver:false`
 * por compatibilidad web, igual que el resto de las animaciones del proyecto.
 */
export function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (value: Animated.Value, delay: number): Animated.CompositeAnimation =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(value, { toValue: 0, duration: 300, useNativeDriver: false }),
          Animated.delay(300 - delay),
        ]),
      );
    const anims = [bounce(d1, 0), bounce(d2, 150), bounce(d3, 300)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [d1, d2, d3]);

  const dotStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, dotStyle(d1)]} />
      <Animated.View style={[styles.dot, dotStyle(d2)]} />
      <Animated.View style={[styles.dot, dotStyle(d3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryBright,
  },
});
