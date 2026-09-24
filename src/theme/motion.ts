import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Easing, FadeInDown, LinearTransition, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion tokens — todas las animaciones de la app usan estos valores para que
 * se sientan de la misma "familia": springs críticamente amortiguados (sin
 * rebote exagerado), rápidos al inicio y suaves al final.
 */
export const spring = {
  /** Micro-interacciones: press, toggles. */
  snappy: { damping: 18, stiffness: 320, mass: 0.6 } satisfies WithSpringConfig,
  /** Movimientos de UI: indicador de tabs, sheets. */
  smooth: { damping: 20, stiffness: 190, mass: 0.9 } satisfies WithSpringConfig,
  /** Entradas de contenido. */
  gentle: { damping: 22, stiffness: 120, mass: 1 } satisfies WithSpringConfig,
};

export const duration = { fast: 180, base: 320, slow: 700, chart: 900 };
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

/** Entrada escalonada para secciones de una pantalla. */
export function enter(index = 0) {
  return FadeInDown.delay(60 + index * 55).springify().damping(20).stiffness(170).mass(0.9);
}

/** Transición de layout para listas que se filtran / reordenan. */
export const listLayout = LinearTransition.springify().damping(20).stiffness(180);

const hapticsOn = Platform.OS === 'ios' || Platform.OS === 'android';

/** Háptica ligera: selección, cambio de tab, pills. */
export function tapHaptic() {
  if (hapticsOn) Haptics.selectionAsync().catch(() => {});
}

/** Háptica media: acción principal (FAB, guardar). */
export function impactHaptic() {
  if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Háptica de éxito: al guardar/eliminar. */
export function successHaptic() {
  if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
