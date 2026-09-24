import React, { createContext, useContext } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  interpolate, Extrapolation, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
  withSpring, type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { spring } from '../../theme/motion';
import { spacing, type } from '../../theme/tokens';

/**
 * Estado compartido entre el scroll de las pantallas y la "chrome" (tab bar).
 * `collapse`: 0 = tab bar expandida, 1 = minimizada (al hacer scroll hacia abajo,
 * como Revolut / Safari en iOS 26).
 */
const ChromeCtx = createContext<{ collapse: SharedValue<number> } | null>(null);

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const collapse = useSharedValue(0);
  return <ChromeCtx.Provider value={{ collapse }}>{children}</ChromeCtx.Provider>;
}

export function useChrome() {
  const ctx = useContext(ChromeCtx);
  const fallback = useSharedValue(0);
  return ctx ?? { collapse: fallback };
}

/**
 * Handler de scroll para pantallas: expone `scrollY` (para parallax / header)
 * y colapsa la tab bar según la dirección del scroll.
 */
export function useScreenScroll() {
  const { collapse } = useChrome();
  const scrollY = useSharedValue(0);
  const last = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: e => {
      const y = e.contentOffset.y;
      const dy = y - last.value;
      if (y < 40 || dy < -6) {
        if (collapse.value !== 0) collapse.value = withSpring(0, spring.smooth);
      } else if (dy > 6 && y > 80) {
        if (collapse.value !== 1) collapse.value = withSpring(1, spring.smooth);
      }
      last.value = y;
      scrollY.value = y;
    },
  });

  return { scrollY, onScroll };
}

export const TOP_BAR_H = 56;

/**
 * Barra superior fija. Transparente arriba del todo; al hacer scroll aparece
 * un fondo de vidrio (blur) y el título compacto hace fade-in.
 */
export function TopBar({
  scrollY, title, left, right, children,
}: {
  scrollY: SharedValue<number>;
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Contenido central personalizado (p. ej. buscador). Reemplaza al título. */
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 50], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [30, 70], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [30, 70], [8, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[s.bar, { paddingTop: insets.top, height: insets.top + TOP_BAR_H }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <BlurView intensity={dark ? 50 : 70} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(5,5,12,0.35)' : 'rgba(255,255,255,0.35)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]} />
      </Animated.View>
      <View style={s.row}>
        {left}
        <View style={s.center}>
          {children ?? (title ? (
            <Animated.Text style={[type.h3, { color: colors.text }, titleStyle]} numberOfLines={1}>{title}</Animated.Text>
          ) : null)}
        </View>
        {right}
      </View>
    </View>
  );
}

/** Título grande que se encoge y desvanece al hacer scroll (estilo iOS). */
export function LargeTitle({ scrollY, title, right }: { scrollY: SharedValue<number>; title: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollY.value, [-80, 0, 60], [1.12, 1, 0.94], Extrapolation.CLAMP) },
      { translateX: interpolate(scrollY.value, [-80, 0], [12, 0], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <View style={s.largeRow}>
      <Animated.View style={[{ flex: 1, transformOrigin: 'left center' }, style]}>
        <Text style={[type.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      </Animated.View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  row: { height: TOP_BAR_H, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screen - 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  largeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: 4, paddingBottom: 14 },
});

/** Alto del header nativo transparente del Stack (detalle, alta, catálogo). */
export function useStackHeaderSpace(): number {
  const insets = useSafeAreaInsets();
  return insets.top + (Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 56 : 64);
}
