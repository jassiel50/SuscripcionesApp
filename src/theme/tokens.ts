/**
 * Subly Design System — tokens
 *
 * Inspirado en UIs tipo "fintech soft": fondo claro, tarjetas grises muy
 * suaves, acentos con gradiente azul → índigo, tipografía pesada (800-900)
 * para cifras y títulos, y superficies con radios grandes.
 *
 * Todo color de la app debe salir de aquí (vía `useTheme()`), nunca hardcodeado
 * en una pantalla. Así el modo oscuro y futuros temas funcionan gratis.
 */

export const palette = {
  blue500: '#3E63F5',
  blue400: '#5B8DEF',
  indigo500: '#5B5BF0',
  violet500: '#7C5CFA',
  green500: '#22C55E',
  green400: '#4ADE80',
  red500: '#EF4444',
  red400: '#F87171',
  amber500: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
} as const;

type Gradient = readonly [string, string];

export interface ThemeColors {
  bg: string; surface: string; surfaceAlt: string; card: string; cardBorder: string;
  separator: string; overlay: string;
  text: string; subtext: string; muted: string;
  accent: string; accentSoft: string; accentText: string;
  gradient: Gradient; gradientAlt: Gradient;
  success: string; successSoft: string; warning: string; warningSoft: string;
  urgent: string; urgentSoft: string;
  tabBar: string; shadow: string; primary: string; primaryText: string;
}

const LIGHT: ThemeColors = {
  // Superficies
  bg:          '#FFFFFF',
  surface:     '#F4F5F9',   // tarjetas "soft" (como la referencia)
  surfaceAlt:  '#EEF1FB',   // variante con tinte de marca
  card:        '#FFFFFF',
  cardBorder:  'rgba(15,23,42,0.06)',
  separator:   '#E8EBF2',
  overlay:     'rgba(15,23,42,0.45)',

  // Texto
  text:        '#0B1020',
  subtext:     '#6B7280',
  muted:       '#9CA3AF',

  // Marca
  accent:      palette.blue500,
  accentSoft:  '#E8EEFF',
  accentText:  '#FFFFFF',
  gradient:    [palette.blue500, palette.blue400] as const,
  gradientAlt: [palette.indigo500, palette.violet500] as const,

  // Estados
  success:     '#16A34A',
  successSoft: '#DCFCE7',
  warning:     '#D97706',
  warningSoft: '#FEF3C7',
  urgent:      palette.red500,
  urgentSoft:  '#FEE2E2',

  // Legacy (compatibilidad con componentes existentes)
  tabBar:      '#FFFFFF',
  shadow:      '#1E2A78',
  primary:     '#0B1020',
  primaryText: '#FFFFFF',
};

const DARK: ThemeColors = {
  bg:          '#070A14',
  surface:     '#121726',
  surfaceAlt:  '#161D33',
  card:        '#121726',
  cardBorder:  'rgba(255,255,255,0.07)',
  separator:   '#1F2637',
  overlay:     'rgba(0,0,0,0.6)',

  text:        '#F3F5FA',
  subtext:     '#98A2B3',
  muted:       '#667085',

  accent:      '#6A8BFF',
  accentSoft:  '#1A2550',
  accentText:  '#FFFFFF',
  gradient:    ['#4A6CF7', '#6F9BFF'] as const,
  gradientAlt: ['#6366F1', '#8B5CF6'] as const,

  success:     palette.green400,
  successSoft: '#0B2E1A',
  warning:     '#FBBF24',
  warningSoft: '#3A2A07',
  urgent:      palette.red400,
  urgentSoft:  '#3B0D12',

  tabBar:      '#121726',
  shadow:      '#000000',
  primary:     '#F3F5FA',
  primaryText: '#0B1020',
};

export const THEMES = { light: LIGHT, dark: DARK };

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 20, // padding horizontal estándar de pantalla
} as const;

/** Escala tipográfica. Pesos altos = look "bold/geométrico" de la referencia. */
export const type = {
  display:  { fontSize: 40, fontWeight: '900' as const, letterSpacing: -1.2 },
  title:    { fontSize: 30, fontWeight: '900' as const, letterSpacing: -0.8 },
  h1:       { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2:       { fontSize: 19, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3:       { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:     { fontSize: 15, fontWeight: '500' as const },
  bodyBold: { fontSize: 15, fontWeight: '700' as const },
  caption:  { fontSize: 13, fontWeight: '600' as const },
  micro:    { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.2 },
} as const;

/** Sombra suave "flotante" (tab bar, FAB, botones con gradiente). */
export function floatShadow(color: string, strength = 1) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 * strength },
    shadowOpacity: 0.25 * strength,
    shadowRadius: 18 * strength,
    elevation: Math.round(10 * strength),
  };
}
