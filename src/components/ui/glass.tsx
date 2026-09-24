import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import type { Scene } from '../../theme/tokens';

const liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Superficie de vidrio.
 * - iOS 26+: Liquid Glass real (`GlassView` de expo-glass-effect).
 * - iOS < 26 / Android / web: BlurView + capa translúcida + borde fino.
 */
export function Glass({
  children, style, radius = 22, strong = false, interactive = false,
}: {
  children?: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number; strong?: boolean; interactive?: boolean;
}) {
  const { colors, dark } = useTheme();

  if (liquid) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder }, style]}>
      <BlurView
        intensity={dark ? 40 : 55}
        tint={dark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: strong ? colors.glassStrong : colors.glass }]} />
      {children}
    </View>
  );
}

/**
 * Fondo de pantalla con degradado vivo (estilo Revolut): dos capas de
 * degradado que se funden lentamente entre sí en un loop de ~9 s.
 * Si se pasa `tint` (p. ej. color de marca), la escena se tiñe con ese color.
 */
export function ScreenBackground({ scene = 'neutral', tint }: { scene?: Scene; tint?: string }) {
  const { colors, dark } = useTheme();
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [phase]);

  const fade = useAnimatedStyle(() => ({ opacity: phase.value }));
  const drift = useAnimatedStyle(() => ({ transform: [{ translateY: -30 * phase.value }, { scale: 1 + 0.06 * phase.value }] }));

  const base = colors.scenes[scene];
  const a = tint ? ([tint + (dark ? 'CC' : '55'), base.a[1], base.a[2]] as const) : base.a;
  const b = tint ? ([base.b[0], tint + (dark ? '88' : '33'), base.b[2]] as const) : base.b;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={a} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, fade]}>
        <LinearGradient colors={b} locations={[0, 0.5, 1]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* "Orbe" de luz que flota: da la sensación de profundidad del fondo de Revolut */}
      <Animated.View style={[s.orb, drift]}>
        <Svg width={ORB} height={ORB}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={dark ? '#A5B4FC' : '#FFFFFF'} stopOpacity={dark ? 0.35 : 0.8} />
              <Stop offset="1" stopColor={dark ? '#A5B4FC' : '#FFFFFF'} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB / 2} cy={ORB / 2} r={ORB / 2} fill="url(#orb)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const ORB = 420;

const s = StyleSheet.create({
  orb: { position: 'absolute', top: -160, right: -140, width: ORB, height: ORB },
});
