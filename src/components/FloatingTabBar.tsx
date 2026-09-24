import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, {
  interpolate, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { floatShadow, fontFamily } from '../theme/tokens';
import { impactHaptic, spring, tapHaptic } from '../theme/motion';
import { Glass } from './ui/glass';
import { useChrome } from './ui/chrome';
import type { IoniconName } from './ui/primitives';

/**
 * Tab bar flotante estilo Revolut / iOS 26:
 *  - píldora de vidrio (Liquid Glass real en iOS 26, blur en el resto)
 *  - indicador tipo "píldora" que se desliza con spring entre pestañas
 *  - botón "+" redondo separado a la derecha (acción principal)
 *  - al hacer scroll hacia abajo se minimiza (oculta etiquetas y se encoge)
 */

export const TAB_META: Record<string, { icon: IoniconName; iconActive: IoniconName; label: string }> = {
  index:    { icon: 'home-outline',      iconActive: 'home',      label: 'Inicio' },
  calendar: { icon: 'calendar-outline',  iconActive: 'calendar',  label: 'Calendario' },
  explore:  { icon: 'pie-chart-outline', iconActive: 'pie-chart', label: 'Estadísticas' },
  profile:  { icon: 'person-outline',    iconActive: 'person',    label: 'Perfil' },
};

const ORDER = ['index', 'calendar', 'explore', 'profile'] as const;
const H = 62;
const H_MIN = 48;
const PAD = 5;

function TabItem({ name, focused, onPress }: { name: (typeof ORDER)[number]; focused: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const { collapse } = useChrome();
  const meta = TAB_META[name];
  const f = useSharedValue(focused ? 1 : 0);
  useEffect(() => { f.value = withSpring(focused ? 1 : 0, spring.snappy); }, [focused, f]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + 0.08 * f.value },
      { translateY: interpolate(collapse.value, [0, 1], [0, 6]) },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapse.value,
    transform: [{ translateY: interpolate(collapse.value, [0, 1], [0, 6]) }, { scale: 1 - 0.2 * collapse.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={s.item}
      accessibilityRole="tab"
      accessibilityLabel={meta.label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? meta.iconActive : meta.icon} size={22} color={focused ? colors.text : colors.subtext} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <Text style={[s.label, { color: focused ? colors.text : colors.subtext, fontWeight: focused ? '700' : '500' }]} numberOfLines={1}>
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const router = useRouter();
  const { collapse } = useChrome();
  const [w, setW] = useState(0);

  const focusedName = state.routes[state.index]?.name;
  const idx = Math.max(0, ORDER.indexOf(focusedName as (typeof ORDER)[number]));
  const x = useSharedValue(idx);
  useEffect(() => { x.value = withSpring(idx, spring.smooth); }, [idx, x]);

  const slot = (w - PAD * 2) / ORDER.length;

  const barStyle = useAnimatedStyle(() => ({ height: interpolate(collapse.value, [0, 1], [H, H_MIN]) }));
  const indicatorStyle = useAnimatedStyle(() => ({
    width: slot,
    height: interpolate(collapse.value, [0, 1], [H - PAD * 2, H_MIN - PAD * 2]),
    transform: [{ translateX: PAD + x.value * slot }],
  }));
  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(collapse.value, [0, 1], [1, 0.94]) }],
  }));

  const onTab = (name: string) => {
    const route = state.routes.find(r => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focusedName !== name && !event.defaultPrevented) {
      tapHaptic();
      navigation.navigate(route.name as never);
    }
    collapse.value = withSpring(0, spring.smooth);
  };

  return (
    <View pointerEvents="box-none" style={[s.container, { paddingBottom: Math.max(insets.bottom - 6, 10) }]}>
      <Animated.View style={[s.row, wrapStyle]}>
        <View style={[{ flex: 1 }, floatShadow(colors.shadow, dark ? 0.6 : 0.35)]}>
          <Glass radius={H / 2} strong>
            <Animated.View style={[s.bar, barStyle]} onLayout={e => setW(e.nativeEvent.layout.width)}>
              {w > 0 && (
                <Animated.View pointerEvents="none" style={[s.indicator, { backgroundColor: colors.accentSoft, borderColor: colors.glassBorder }, indicatorStyle]} />
              )}
              {ORDER.map(name => (
                <TabItem key={name} name={name} focused={focusedName === name} onPress={() => onTab(name)} />
              ))}
            </Animated.View>
          </Glass>
        </View>

        <Pressable
          onPress={() => { impactHaptic(); router.push('/subscription/new'); }}
          accessibilityRole="button"
          accessibilityLabel="Agregar suscripción"
          style={({ pressed }) => [floatShadow(colors.shadow, dark ? 0.6 : 0.35), { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <View style={[s.fab, { backgroundColor: colors.ink }]}>
            <Ionicons name="add" size={30} color={colors.onInk} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD },
  indicator: { position: 'absolute', left: 0, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  item: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily, fontSize: 10, letterSpacing: 0.1 },
  fab: { width: H, height: H, borderRadius: H / 2, alignItems: 'center', justifyContent: 'center' },
});
