import { Platform } from 'react-native';

/**
 * Subly Design System — "Subly Glass"
 *
 * - UI (texto, botones, pills, íconos) en blanco y negro: el "ink" es negro en
 *   modo claro y blanco en modo oscuro.
 * - Fondos con degradado animado por pantalla (estilo Revolut): pastel en claro,
 *   profundo en oscuro. Encima, superficies de vidrio translúcidas.
 * - Color "dinámico" sólo donde comunica datos: gráficas, categorías, colores de
 *   marca de cada suscripción y el rojo de urgencia.
 * - Una sola familia tipográfica: SF Pro (fuente del sistema en iOS).
 *
 * Todo color de la app sale de aquí (vía `useTheme()`), nunca hardcodeado.
 */

type Gradient = readonly [string, string];
type Gradient3 = readonly [string, string, string];

/** Escenas de fondo: cada pantalla tiene su propio degradado. */
export type Scene = 'home' | 'calendar' | 'stats' | 'profile' | 'neutral';

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
  /** Vidrio: relleno translúcido y borde de las superficies glass. */
  glass: string; glassBorder: string; glassStrong: string;
  /** Degradados de fondo por escena (arriba → abajo) y su "segunda fase" para la animación. */
  scenes: Record<Scene, { a: Gradient3; b: Gradient3 }>;
  /** Paleta vívida para series de gráficas (categorías, métodos de pago…). */
  vivid: readonly string[];
  /** Degradados para trazos de gráficas. */
  chartLine: Gradient; chartGood: Gradient; chartWarn: Gradient; chartBad: Gradient;
  /** Escala de grises (compatibilidad). */
  chart: readonly string[];
  success: string; successSoft: string; warning: string; warningSoft: string;
  urgent: string; urgentSoft: string;
  tabBar: string; shadow: string; primary: string; primaryText: string;
}

const LIGHT: ThemeColors = {
  bg:          '#F7F7FB',
  surface:     'rgba(255,255,255,0.72)',
  surfaceAlt:  'rgba(255,255,255,0.55)',
  card:        '#FFFFFF',
  cardBorder:  'rgba(255,255,255,0.9)',
  separator:   'rgba(9,9,11,0.08)',
  overlay:     'rgba(9,9,11,0.35)',

  text:        '#09090B',
  subtext:     '#5B5B66',
  muted:       '#8E8E99',

  ink:         '#09090B',
  onInk:       '#FFFFFF',
  accent:      '#09090B',
  accentSoft:  'rgba(9,9,11,0.06)',
  accentText:  '#FFFFFF',
  // Gradientes de marca para CTAs, badges y píldoras activas: a color (no
  // negro), a juego con la paleta vívida de las gráficas.
  gradient:    ['#6366F1', '#8B5CF6'],
  gradientAlt: ['#EC4899', '#F97316'],

  glass:       'rgba(255,255,255,0.62)',
  glassStrong: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(255,255,255,0.95)',
  scenes: {
    home:     { a: ['#C7D2FE', '#E0E7FF', '#F7F7FB'], b: ['#BFDBFE', '#EDE9FE', '#F7F7FB'] },
    calendar: { a: ['#BAE6FD', '#E0F2FE', '#F7F7FB'], b: ['#C7D2FE', '#CFFAFE', '#F7F7FB'] },
    stats:    { a: ['#DDD6FE', '#FCE7F3', '#F7F7FB'], b: ['#E9D5FF', '#E0E7FF', '#F7F7FB'] },
    profile:  { a: ['#E4E4E7', '#EEF2FF', '#F7F7FB'], b: ['#E0E7FF', '#F4F4F5', '#F7F7FB'] },
    neutral:  { a: ['#E0E7FF', '#F1F5F9', '#F7F7FB'], b: ['#EDE9FE', '#F1F5F9', '#F7F7FB'] },
  },
  vivid:       ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#F97316', '#84CC16'],
  chartLine:   ['#6366F1', '#EC4899'],
  chartGood:   ['#10B981', '#06B6D4'],
  chartWarn:   ['#F59E0B', '#F97316'],
  chartBad:    ['#F97316', '#DC2626'],
  chart:       ['#09090B', '#52525B', '#8E8E96', '#B4B4BB', '#D4D4D8', '#E9E9EC'],

  success:     '#059669',
  successSoft: 'rgba(16,185,129,0.14)',
  warning:     '#D97706',
  warningSoft: 'rgba(245,158,11,0.16)',
  urgent:      '#DC2626',
  urgentSoft:  'rgba(220,38,38,0.12)',

  tabBar:      '#09090B',
  shadow:      '#1E1B4B',
  primary:     '#09090B',
  primaryText: '#FFFFFF',
};

const DARK: ThemeColors = {
  bg:          '#05050C',
  surface:     'rgba(255,255,255,0.08)',
  surfaceAlt:  'rgba(255,255,255,0.05)',
  card:        '#15151C',
  cardBorder:  'rgba(255,255,255,0.10)',
  separator:   'rgba(255,255,255,0.10)',
  overlay:     'rgba(0,0,0,0.55)',

  text:        '#FAFAFA',
  subtext:     'rgba(250,250,250,0.68)',
  muted:       'rgba(250,250,250,0.45)',

  ink:         '#FAFAFA',
  onInk:       '#09090B',
  accent:      '#FAFAFA',
  accentSoft:  'rgba(255,255,255,0.10)',
  accentText:  '#09090B',
  gradient:    ['#818CF8', '#A78BFA'],
  gradientAlt: ['#F472B6', '#FB923C'],

  glass:       'rgba(255,255,255,0.10)',
  glassStrong: 'rgba(40,40,58,0.72)',
  glassBorder: 'rgba(255,255,255,0.14)',
  scenes: {
    home:     { a: ['#2B35F5', '#241C8F', '#05050C'], b: ['#1D4ED8', '#3B1C9E', '#05050C'] },
    calendar: { a: ['#0E7490', '#1E2A8A', '#05050C'], b: ['#1D4ED8', '#115E75', '#05050C'] },
    stats:    { a: ['#6D28D9', '#3B1470', '#05050C'], b: ['#9D174D', '#4C1D95', '#05050C'] },
    profile:  { a: ['#3F3F6E', '#1C1B3A', '#05050C'], b: ['#312E81', '#27272A', '#05050C'] },
    neutral:  { a: ['#27307A', '#15163A', '#05050C'], b: ['#312E81', '#18183A', '#05050C'] },
  },
  vivid:       ['#818CF8', '#F472B6', '#FBBF24', '#34D399', '#22D3EE', '#A78BFA', '#FB923C', '#A3E635'],
  chartLine:   ['#818CF8', '#F472B6'],
  chartGood:   ['#34D399', '#22D3EE'],
  chartWarn:   ['#FBBF24', '#FB923C'],
  chartBad:    ['#FB923C', '#F87171'],
  chart:       ['#FAFAFA', '#C4C4CA', '#9A9AA2', '#71717A', '#52525B', '#3F3F46'],

  success:     '#34D399',
  successSoft: 'rgba(52,211,153,0.16)',
  warning:     '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.16)',
  urgent:      '#F87171',
  urgentSoft:  'rgba(248,113,113,0.16)',

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

/**
 * Familia tipográfica única. En iOS 'System' ES SF Pro (Text/Display según
 * tamaño). SF Pro no se puede redistribuir fuera de plataformas Apple, así que
 * en Android se usa la sans del sistema y en web la pila de SF con Arial de respaldo.
 */
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
}) as string;

/** Escala tipográfica (SF Pro). */
export const type = {
  display:  { fontFamily, fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2 },
  title:    { fontFamily, fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1:       { fontFamily, fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2:       { fontFamily, fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3:       { fontFamily, fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:     { fontFamily, fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontFamily, fontSize: 15, fontWeight: '700' as const },
  /** Texto secundario (subtítulos, ayudas, footers). Nunca en negrita. */
  caption:  { fontFamily, fontSize: 13, fontWeight: '500' as const },
  /** Etiqueta pequeña con un poco de peso (badges, headers de sección). */
  micro:    { fontFamily, fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
} as const;

/**
 * Colores de identidad: para el color/ícono elegido a mano por el usuario
 * (servicios sin logo de marca reconocido). Es la misma paleta vívida usada en
 * gráficas, así que un color elegido aquí también se ve bien en Estadísticas.
 * Independiente de claro/oscuro: son colores saturados que funcionan en ambos.
 */
export const identityColors = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#8B5CF6', '#F97316', '#84CC16',
  '#DC2626', '#0EA5E9', '#09090B', '#71717A',
] as const;

/** Íconos disponibles para representar una suscripción sin logo reconocido. */
export const identityIcons = [
  'sparkles-outline', 'film-outline', 'musical-notes-outline', 'game-controller-outline',
  'cloud-outline', 'cart-outline', 'barbell-outline', 'book-outline',
  'briefcase-outline', 'heart-outline', 'wifi-outline', 'card-outline',
  'home-outline', 'car-outline', 'restaurant-outline', 'ellipsis-horizontal-outline',
] as const;

/**
 * Degradado de 2 tonos a partir de un color de marca/identidad (aclarando el
 * segundo stop), para que botones y pills "combinen" con el color elegido de
 * una suscripción en vez de usar siempre el gradiente genérico de la app.
 */
export function tintGradient(hex: string): readonly [string, string] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [hex, hex];
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lighten = (c: number) => Math.round(c + (255 - c) * 0.4);
  const hex2 = `#${[lighten(r), lighten(g), lighten(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  return [hex, hex2];
}

/** Sombra suave "flotante" (tab bar, FAB, botones). */
export function floatShadow(color: string, strength = 1) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 * strength },
    shadowOpacity: 0.25 * strength,
    shadowRadius: 18 * strength,
    elevation: Math.round(10 * strength),
  };
}
