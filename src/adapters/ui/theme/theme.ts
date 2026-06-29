import type { ViewStyle } from 'react-native';

/**
 * Tokens visuales del proyecto. Única fuente de la paleta, tipografía, espaciado y
 * radios — los componentes referencian esto en vez de hardcodear colores, para
 * mantener todo cohesivo con el fondo (gradiente oscuro + acentos indigo/cyan).
 */
export const colors = {
  bgFrom: '#0f172a',
  bgMid: '#1e1b4b',
  bgTo: '#0f172a',

  surface: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.1)',
  border: 'rgba(165,180,252,0.22)',

  primary: '#6366f1',
  primaryBright: '#818cf8',
  violet: '#7c3aed',
  cyan: '#22d3ee',

  textPrimary: '#f1f5f9',
  textSecondary: '#c7d2fe',
  textMuted: '#94a3b8',
  danger: '#fca5a5',

  bubbleUser: '#6366f1',
  bubbleAssistant: 'rgba(255,255,255,0.08)',

  onPrimary: '#ffffff',
} as const;

/** Gradiente de fondo (de claro: 3 paradas) para expo-linear-gradient. */
export const gradient: readonly [string, string, string] = [
  colors.bgFrom,
  colors.bgMid,
  colors.bgTo,
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const font = {
  title: 22,
  heading: 18,
  body: 15,
  small: 13,
  tiny: 12,
  bold: '800',
  semibold: '600',
  // Tipografía display (Space Grotesk) para títulos/marcas. Cargada en App.tsx con useFonts.
  display: 'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',
} as const;

/** Sombra/glow de color reutilizable (acentúa botones y chips activos). */
export function glow(color: string, opacity = 0.5, radius_ = 14): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius_,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  };
}
