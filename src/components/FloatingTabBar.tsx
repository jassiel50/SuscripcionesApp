import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '../hooks/useTheme';
import { floatShadow } from '../theme/tokens';
import type { IoniconName } from './ui/primitives';

/**
 * Tab bar flotante con gradiente:
 *  - píldora negra (blanca en modo oscuro) con iconos outline invertidos
 *  - la pestaña activa se marca con un círculo invertido que se desliza (spring)
 *  - FAB central en forma de diamante (contorno) para "Agregar suscripción"
 */

export const TAB_META: Record<string, { icon: IoniconName; iconActive: IoniconName; label: string }> = {
  index:    { icon: 'home-outline',      iconActive: 'home',      label: 'Inicio' },
  calendar: { icon: 'calendar-outline',  iconActive: 'calendar',  label: 'Calendario' },
  explore:  { icon: 'pie-chart-outline', iconActive: 'pie-chart', label: 'Estadísticas' },
  profile:  { icon: 'person-outline',    iconActive: 'person',    label: 'Perfil' },
};

/** Orden visual: 2 pestañas, FAB, 2 pestañas. */
const SLOTS = ['index', 'calendar', '__fab__', 'explore', 'profile'] as const;
const BAR_H = 68;
const DOT = 52;

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const router = useRouter();
  const [barW, setBarW] = useState(0);

  const focusedName = state.routes[state.index]?.name;
  const focusedSlot = Math.max(0, SLOTS.indexOf(focusedName as (typeof SLOTS)[number]));
  const slotW = barW / SLOTS.length;

  const x = useRef(new Animated.Value(focusedSlot)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: focusedSlot, useNativeDriver: true, damping: 16, stiffness: 220, mass: 0.7 }).start();
  }, [focusedSlot, x]);

  const onTab = (name: string) => {
    const route = state.routes.find(r => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focusedName !== name && !event.defaultPrevented) navigation.navigate(route.name as never);
  };

  return (
    <View pointerEvents="box-none" style={[s.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[s.barShadow, floatShadow(colors.shadow, dark ? 0.6 : 0.45)]}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.bar}
          onLayout={e => setBarW(e.nativeEvent.layout.width)}
        >
          {slotW > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[s.dot, {
                left: (slotW - DOT) / 2,
                backgroundColor: colors.onInk,
                transform: [{
                  translateX: x.interpolate({
                    inputRange: SLOTS.map((_, i) => i),
                    outputRange: SLOTS.map((_, i) => i * slotW),
                  }),
                }],
              }]}
            />
          )}

          {SLOTS.map(slot => {
            if (slot === '__fab__') return <View key={slot} style={s.slot} />;
            const meta = TAB_META[slot];
            const focused = focusedName === slot;
            return (
              <Pressable
                key={slot}
                style={s.slot}
                onPress={() => onTab(slot)}
                accessibilityRole="tab"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: focused }}
                hitSlop={4}
              >
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={26}
                  color={focused ? colors.ink : colors.onInk}
                />
              </Pressable>
            );
          })}
        </LinearGradient>

        {/* FAB diamante central */}
        <Pressable
          onPress={() => router.push('/subscription/new')}
          accessibilityRole="button"
          accessibilityLabel="Agregar suscripción"
          style={({ pressed }) => [s.fabWrap, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
        >
          <View style={[s.fab, { backgroundColor: colors.bg, borderColor: colors.ink }, floatShadow(colors.shadow, 0.35)]}>
            <View style={s.fabIcon}>
              <Ionicons name="add" size={30} color={colors.ink} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  barShadow: { borderRadius: BAR_H / 2 },
  bar: { height: BAR_H, borderRadius: BAR_H / 2, flexDirection: 'row', alignItems: 'center', overflow: 'visible' },
  slot: { flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: (BAR_H - DOT) / 2, width: DOT, height: DOT, borderRadius: DOT / 2 },
  fabWrap: { position: 'absolute', left: '50%', top: -22, marginLeft: -31 },
  fab: { width: 62, height: 62, borderRadius: 18, borderWidth: 4, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  fabIcon: { transform: [{ rotate: '-45deg' }] },
});
