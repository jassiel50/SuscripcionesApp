import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { floatShadow, radius, spacing, type } from '../../theme/tokens';
import { nativeTabsActive } from '../../config/ui';
import { spring, tapHaptic } from '../../theme/motion';
import { Glass } from './glass';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Layout helpers ──────────────────────────────────────────────────────────

/** Espacio inferior que debe dejar un ScrollView para no quedar bajo la tab bar flotante. */
export function useTabBarSpace(extra = 24): number {
  const insets = useSafeAreaInsets();
  return nativeTabsActive ? extra : insets.bottom + 96 + extra;
}

// ── PressableScale: feedback táctil con spring (UI thread) + háptica ───────

type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>; scaleTo?: number; children?: React.ReactNode; haptic?: boolean;
};

export function PressableScale({ style, scaleTo = 0.96, children, haptic = true, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
    opacity: 1 - 0.08 * pressed.value,
  }));
  return (
    <Pressable
      {...rest}
      onPressIn={e => { pressed.value = withSpring(1, spring.snappy); rest.onPressIn?.(e); }}
      onPressOut={e => { pressed.value = withSpring(0, spring.snappy); rest.onPressOut?.(e); }}
      onPress={e => { if (haptic) tapHaptic(); rest.onPress?.(e); }}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Número animado (cuenta hacia el valor nuevo) ───────────────────────────

/**
 * Anima un número de su valor anterior al nuevo con ease-out (~700 ms).
 * Usa cifras tabulares para que el ancho no "brinque" mientras cuenta.
 */
export function AnimatedNumber({
  value, format, style, duration = 800,
}: {
  value: number; format: (n: number) => string; style?: StyleProp<TextStyle>; duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = start + (value - start) * eased;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration]);
  return <Text style={[{ fontVariant: ['tabular-nums'] }, style]}>{format(shown)}</Text>;
}

// ── Skeleton con shimmer ────────────────────────────────────────────────────

export function Skeleton({ width, height, radius: r = 12, style }: { width: number | `${number}%`; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({ opacity: 0.45 + 0.4 * pulse.value }));
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.surface }, anim, style]} />;
}

// ── Gradientes ──────────────────────────────────────────────────────────────

export function GradientCircle({
  size = 56, icon, iconSize, onPress, alt, children, accessibilityLabel,
}: {
  size?: number; icon?: IoniconName; iconSize?: number; onPress?: () => void;
  alt?: boolean; children?: React.ReactNode; accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const body = (
    <LinearGradient
      colors={alt ? colors.gradientAlt : colors.gradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, floatShadow(colors.shadow, 0.35)]}
    >
      {icon ? <Ionicons name={icon} size={iconSize ?? size * 0.42} color={colors.onInk} /> : children}
    </LinearGradient>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {body}
    </PressableScale>
  );
}

export function GradientButton({
  label, icon, onPress, disabled, style, alt,
}: {
  label: string; icon?: IoniconName; onPress: () => void; disabled?: boolean;
  style?: StyleProp<ViewStyle>; alt?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={style}>
    <PressableScale onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.55 : 1 }} accessibilityRole="button">
      <LinearGradient
        colors={alt ? colors.gradientAlt : colors.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[p.gradBtn, floatShadow(colors.shadow, 0.35)]}
      >
        {icon && <Ionicons name={icon} size={20} color={colors.onInk} />}
        <Text style={[p.gradBtnText, { color: colors.onInk }]}>{label}</Text>
      </LinearGradient>
    </PressableScale>
    </View>
  );
}

// ── Pills de filtro (estilo "All / New Car / Used Car") ─────────────────────

export function FilterPills<T extends string>({
  options, value, onChange, scroll = true,
}: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const content = options.map(opt => {
    const active = opt.key === value;
    const label = opt.count != null ? `${opt.label} · ${opt.count}` : opt.label;
    return (
      <PressableScale key={opt.key} onPress={() => onChange(opt.key)} scaleTo={0.94} accessibilityRole="tab" accessibilityState={{ selected: active }}>
        {active ? (
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[p.pill, p.pillActive]}>
            <Text style={[p.pillText, { color: colors.onInk }]}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[p.pill, { borderColor: colors.accent, borderWidth: 1.5 }]}>
            <Text style={[p.pillText, { color: colors.accent }]}>{label}</Text>
          </View>
        )}
      </PressableScale>
    );
  });
  if (!scroll) return <View style={p.pillRowWrap}>{content}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.pillRow}>
      {content}
    </ScrollView>
  );
}

// ── Encabezados ─────────────────────────────────────────────────────────────

export function ScreenHeader({
  title, left, right, centered = false,
}: {
  title: string; left?: React.ReactNode; right?: React.ReactNode; centered?: boolean;
}) {
  const { colors } = useTheme();
  if (centered) {
    return (
      <View style={p.headerCentered}>
        <View style={p.headerSide}>{left}</View>
        <Text style={[type.title, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
        <View style={[p.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
    );
  }
  return (
    <View style={p.header}>
      <Text style={[type.title, { color: colors.text, flex: 1 }]} numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={p.section}>
      <Text style={[type.h2, { color: colors.text }]}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[type.caption, { color: colors.vivid[0] }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function IconButton({
  icon, onPress, badge, accessibilityLabel, glass = true, size = 44,
}: {
  icon: IoniconName; onPress?: () => void; badge?: boolean; accessibilityLabel?: string;
  glass?: boolean; size?: number;
}) {
  const { colors } = useTheme();
  const inner = (
    <View style={[p.iconBtn, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={colors.text} />
      {badge && <View style={[p.iconBadge, { backgroundColor: colors.urgent, borderColor: colors.glassBorder }]} />}
    </View>
  );
  return (
    <PressableScale onPress={onPress} scaleTo={0.88} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {glass ? <Glass radius={size / 2} interactive>{inner}</Glass> : inner}
    </PressableScale>
  );
}

// ── Tags / chips pequeños ───────────────────────────────────────────────────

export function Tag({ label, color, solid = false }: { label: string; color?: string; solid?: boolean }) {
  const { colors } = useTheme();
  const c = color ?? colors.ink;
  // Sólido: fondo del color con texto invertido. Suave: fondo gris con texto del color.
  const fg = solid ? (color && color !== colors.ink ? '#FFFFFF' : colors.onInk) : c;
  return (
    <View style={[p.tag, { backgroundColor: solid ? c : colors.accentSoft }]}>
      <Text style={[p.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ── Search field ────────────────────────────────────────────────────────────

export function SearchField(props: TextInputProps & { onClear?: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  const { onClear, value, style, compact, ...rest } = props;
  return (
    <Glass radius={compact ? 22 : radius.md} style={compact ? { flex: 1 } : { marginHorizontal: spacing.screen }}>
      <View style={[p.search, compact && { height: 44, paddingHorizontal: 14 }]}>
        <Ionicons name="search" size={18} color={colors.subtext} />
        <TextInput
          {...rest}
          value={value}
          placeholderTextColor={colors.muted}
          style={[p.searchInput, { color: colors.text }, style]}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {!!value && onClear && (
          <Pressable onPress={onClear} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </Glass>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon, title, body, cta, onCta,
}: {
  icon: IoniconName; title: string; body?: string; cta?: string; onCta?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={p.empty}>
      <View style={[p.emptyIcon, { backgroundColor: colors.vivid[0] + '1A' }]}>
        <Ionicons name={icon} size={36} color={colors.vivid[0]} />
      </View>
      <Text style={[type.h2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body && <Text style={[type.body, { color: colors.subtext, textAlign: 'center', lineHeight: 22 }]}>{body}</Text>}
      {cta && onCta && <GradientButton label={cta} icon="add" onPress={onCta} style={{ marginTop: spacing.sm, alignSelf: 'stretch' }} />}
    </View>
  );
}

// ── Surface: tarjeta gris suave estándar ────────────────────────────────────

export function Surface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg }, style]}>{children}</View>;
}

const p = StyleSheet.create({
  gradBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: radius.pill, paddingVertical: 17, paddingHorizontal: 24,
  },
  gradBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

  pillRow: { paddingHorizontal: spacing.screen, gap: 10 },
  pillRowWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.screen, gap: 10 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, minWidth: 64, alignItems: 'center' },
  pillActive: { paddingVertical: 11.5, paddingHorizontal: 21.5 },
  pillText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 16, gap: 12 },
  headerCentered: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen - 4, paddingTop: 8, paddingBottom: 16 },
  headerSide: { width: 48 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, marginTop: 28, marginBottom: 14 },

  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', top: 9, right: 10, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },

  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xs },
  tagText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0 },

  empty: { alignItems: 'center', paddingHorizontal: 36, paddingVertical: 32, gap: 12 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
