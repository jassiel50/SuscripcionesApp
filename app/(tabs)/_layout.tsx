import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { useTheme } from '../../src/hooks/useTheme';
import { nativeTabsActive } from '../../src/config/ui';
import FloatingTabBar from '../../src/components/FloatingTabBar';
import { ChromeProvider } from '../../src/components/ui/chrome';

// ─── NativeTabs (opt-in, ver src/config/ui.ts) ────────────────────────────────
// require() lazy: sólo se carga si se activa (nunca en Expo Go).

function NativeTabsLayout() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NativeTabs } = require('expo-router/unstable-native-tabs');
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent} minimizeBehavior={'onScrollDown' as any}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="calendar_today" />
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

// ─── Tab bar flotante de vidrio + botón "+" (default) ────────────────────────

function FloatingTabsLayout() {
  const { colors } = useTheme();
  return (
    <ChromeProvider>
      <Tabs
        tabBar={props => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Transición entre pestañas: desplazamiento + fade (react-navigation 7)
          animation: 'shift',
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </ChromeProvider>
  );
}

export default function TabsLayout() {
  return nativeTabsActive ? <NativeTabsLayout /> : <FloatingTabsLayout />;
}
