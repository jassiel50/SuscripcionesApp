/**
 * Subly Design System — tokens (monocromático)
 *
 * Paleta blanco y negro: fondo blanco, tarjetas gris muy claro y el "ink"
 * (negro en modo claro / blanco en modo oscuro) para todo lo que es énfasis:
 * pills activas, tab bar, botones principales, cifras. Los gradientes son
 * sutiles (negro → grafito) sólo para dar profundidad.
 *
 * El único color funcional es el rojo de `urgent` (cobro en ≤ 3 días o
 * presupuesto excedido). Los logos de marca conservan su color porque son
 * contenido, no UI.
 *
 * Todo color de la app debe salir de aquí (vía `useTheme()`), nunca hardcodeado.
 */

type Gradient = readonly [string, string];

export interface ThemeColors {
  bg: string; surface: string; surfaceAlt: string; card: string; cardBorder: string;
  separator: string; overlay: string;
  text: string; subtext: string; muted: string;
  /** Color de énfasis (negro en claro, blanco en oscuro). */
  ink: string;
  /** Texto/iconos sobre `ink` o `gradient`. */
  onInk: string;
  accent: string; accentSoft: string; accentText: string;
  gradient: Gradient; gradientAlt: Gradient;
  /** Escala de grises para series de gráficas (de mayor a menor contraste). */
  chart: readonly string[];
  success: string; successSoft: string; warning: string; warningSoft: string;
  urgent: string; urgentSoft: string;
  tabBar: string; shadow: string; primary: string; primaryText: string;
}

const LIGHT: ThemeColors = {
  bg:          '#FFFFFF',
  surface:     '#F4F4F5',
  surfaceAlt:  '#EFEFF1',
  card:        '#FFFFFF',
  cardBorder:  'rgba(0,0,0,0.06)',
  separator:   '#E4E4E7',
  overlay:     'rgba(0,0,0,0.45)',

  text:        '#09090B',
  subtext:     '#71717A',
  muted:       '#A1A1AA',

  ink:         '#09090B',
  onInk:       '#FFFFFF',
  accent:      '#09090B',
  accentSoft:  '#E9E9EC',
  accentText:  '#FFFFFF',
  gradient:    ['#09090B', '#3F3F46'],
  gradientAlt: ['#18181B', '#52525B'],
  chart:       ['#09090B', '#52525B', '#8E8E96', '#B4B4BB', '#D4D4D8', '#E9E9EC'],

  success:     '#09090B',
  successSoft: '#EDEDEF',
  warning:     '#09090B',
  warningSoft: '#EDEDEF',
  urgent:      '#DC2626',
  urgentSoft:  '#FDECEC',

  tabBar:      '#09090B',
  shadow:      '#000000',
  primary:     '#09090B',
  primaryText: '#FFFFFF',
};

const DARK: ThemeColors = {
  bg:          '#000000',
  surface:     '#141416',
  surfaceAlt:  '#18181B',
  card:        '#141416',
  cardBorder:  'rgba(255,255,255,0.08)',
  separator:   '#27272A',
  overlay:     'rgba(0,0,0,0.65)',

  text:        '#FAFAFA',
  subtext:     '#A1A1AA',
  muted:       '#71717A',

  ink:         '#FAFAFA',
  onInk:       '#09090B',
  accent:      '#FAFAFA',
  accentSoft:  '#27272A',
  accentText:  '#09090B',
  gradient:    ['#FFFFFF', '#D4D4D8'],
  gradientAlt: ['#E4E4E7', '#A1A1AA'],
  chart:       ['#FAFAFA', '#C4C4CA', '#9A9AA2', '#71717A', '#52525B', '#3F3F46'],

  success:     '#FAFAFA',
  successSoft: '#1F1F22',
  warning:     '#FAFAFA',
  warningSoft: '#1F1F22',
  urgent:      '#F87171',
  urgentSoft:  '#2A1215',

  tabBar:      '#FAFAFA',
  shadow:      '#000000',
  primary:     '#FAFAFA',
  primaryText: '#09090B',
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
