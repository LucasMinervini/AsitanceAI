import { View } from 'react-native';
import { colors } from '../theme/theme';

interface AiBackdropProps {
  readonly width: number;
  readonly height: number;
}

interface Orb {
  readonly x: number; // centro, fracción del ancho
  readonly y: number; // centro, fracción del alto
  readonly size: number; // diámetro en px
  readonly color: string;
}

// Orbes que forman un "glow" tipo nebulosa IA. Sin SVG: funciona en web y nativo.
const ORBS: readonly Orb[] = [
  { x: 0.22, y: 0.16, size: 280, color: colors.primary },
  { x: 0.85, y: 0.3, size: 220, color: colors.cyan },
  { x: 0.5, y: 0.62, size: 320, color: colors.violet },
  { x: 0.12, y: 0.8, size: 180, color: colors.primaryBright },
];

// Anillos concéntricos: simulan un degradado radial (glow suave) con Views translúcidas.
const RINGS = [
  { scale: 1, opacity: 0.05 },
  { scale: 0.7, opacity: 0.08 },
  { scale: 0.45, opacity: 0.12 },
  { scale: 0.22, opacity: 0.2 },
];

/** Fondo decorativo "IA": orbes con glow concéntrico. Semitransparente, sin dependencias nativas. */
export function AiBackdrop({ width, height }: AiBackdropProps) {
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {ORBS.map((orb, orbIndex) =>
        RINGS.map((ring, ringIndex) => {
          const diameter = orb.size * ring.scale;
          return (
            <View
              key={`${orbIndex}-${ringIndex}`}
              style={{
                position: 'absolute',
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                left: orb.x * width - diameter / 2,
                top: orb.y * height - diameter / 2,
                backgroundColor: orb.color,
                opacity: ring.opacity,
              }}
            />
          );
        }),
      )}
    </View>
  );
}
