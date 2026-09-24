import { isExpoGo } from '../utils/env';

/**
 * Flags de UI.
 *
 * USE_NATIVE_TABS = true → en dev build / producción se usan las NativeTabs de
 * expo-router (UITabBar real, Liquid Glass en iOS 26). Se pierde el botón
 * central "+" y el look con gradiente del diseño Subly.
 *
 * false (default) → Tab bar flotante con gradiente + FAB central en todas
 * las plataformas (Expo Go incluido), idéntico en iOS y Android.
 */
export const USE_NATIVE_TABS = false;

export const nativeTabsActive = USE_NATIVE_TABS && !isExpoGo;
