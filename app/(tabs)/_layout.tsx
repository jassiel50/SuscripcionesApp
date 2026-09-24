import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { isExpoGo } from '../../src/utils/env';
import { useTheme } from '../../src/hooks/useTheme';
import type { ThemeColors } from '../../src/hooks/useTheme';

// ─── NativeTabs (dev build / producción) ──────────────────────────────────────
// require() lazy: solo se carga cuando se llama esta función (nunca en Expo Go).

function NativeTabsLayout() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NativeTabs } = require('expo-router/unstable-native-tabs');
  const dark = useColorScheme() === 'dark';
  const accent = dark ? '#4D8EFF' : '#2563EB';

  return (
    <NativeTabs tintColor={accent} minimizeBehavior={'onScrollDown' as any}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar.fill' }} md="calendar_today" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Estadísticas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }} md="pie_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ─── JS custom tabs (Expo Go) ─────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_META: Record<string, { filled: IoniconName; outline: IoniconName; label: string }> = {
  index:    { filled: 'home',      outline: 'home-outline',      label: 'Inicio'       },
  discover: { filled: 'compass',   outline: 'compass-outline',   label: 'Explorar'     },
  explore:  { filled: 'pie-chart', outline: 'pie-chart-outline', label: 'Estadísticas' },
  calendar: { filled: 'calendar',  outline: 'calendar-outline',  label: 'Calendario'   },
  profile:  { filled: 'person',    outline: 'person-outline',    label: 'Perfil'       },
};

type Route = { key: string; name: string };
type NavActions = {
  emit(args: { type: 'tabPress'; target: string; canPreventDefault: true }): { defaultPrevented: boolean };
  navigate(name: string, params?: object): void;
};

interface TabItemProps {
  route: Route;
  isFocused: boolean;
  navigation: NavActions;
  colors: ThemeColors;
}

function TabItem({ route, isFocused, navigation, colors }: TabItemProps) {
  const meta = TAB_META[route.name] ?? { filled: 'ellipse', outline: 'ellipse-outline', label: route.name };
  const color = isFocused ? colors.accent : colors.subtext;
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.1 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 260,
      mass: 0.6,
    }).start();
  }, [isFocused]);

  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <TouchableOpacity style={s.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[s.tabContent, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name={isFocused ? meta.filled : meta.outline} size={22} color={color} />
        <Text style={[s.tabLabel, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{meta.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: { state: { index: number; routes: Route[] }; navigation: NavActions }) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const tabCount = state.routes.length;

  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 18,
      stiffness: 280,
      mass: 0.7,
    }).start();
  }, [state.index]);

  const tabWidth = barWidth > 0 ? barWidth / tabCount : 0;
  const indicatorBg     = useGlass ? 'rgba(255,255,255,0.32)' : dark ? 'rgba(255,255,255,0.14)' : 'rgba(37,99,235,0.14)';
  const indicatorBorder = useGlass ? 'rgba(255,255,255,0.60)' : dark ? 'rgba(255,255,255,0.28)' : 'rgba(37,99,235,0.35)';

  const pillContent = (
    <View style={s.pillRow} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[s.indicator, {
            width: tabWidth,
            backgroundColor: indicatorBg,
            borderColor: indicatorBorder,
            shadowColor: useGlass ? '#fff' : colors.accent,
            shadowOpacity: useGlass ? 0.35 : 0.12,
            transform: [{
              translateX: indicatorAnim.interpolate({
                inputRange: state.routes.map((_, i) => i),
                outputRange: state.routes.map((_, i) => i * tabWidth),
              }),
            }],
          }]}
        />
      )}
      {state.routes.map((route) => (
        <TabItem
          key={route.key}
          route={route}
          isFocused={state.routes[state.index].key === route.key}
          navigation={navigation}
          colors={colors}
        />
      ))}
    </View>
  );

  return (
    <View style={[s.container, { paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
      {useGlass ? (
        <GlassContainer style={s.glassPill}>
          <GlassView glassEffectStyle="regular" style={s.glassView}>{pillContent}</GlassView>
        </GlassContainer>
      ) : (
        <View style={[s.fallbackPill, {
          backgroundColor: dark ? 'rgba(14,19,36,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: colors.cardBorder,
          shadowColor: dark ? '#000' : '#1A237E',
        }]}>
          {pillContent}
        </View>
      )}
    </View>
  );
}

function ExpoGoTabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...(props as any)} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return isExpoGo ? <ExpoGoTabsLayout /> : <NativeTabsLayout />;
}

const s = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  glassPill: { alignSelf: 'stretch', marginHorizontal: 20, borderRadius: 36 },
  glassView: { borderRadius: 36, paddingVertical: 4, paddingHorizontal: 4 },
  fallbackPill: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  pillRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 28,
    borderWidth: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, zIndex: 1 },
  tabContent: { alignItems: 'center', gap: 3, width: '100%' },
  tabLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.1, textAlign: 'center', width: '100%' },
});
