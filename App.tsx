import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AddSubscriptionModal from './src/components/AddSubscriptionModal';
import { useTheme } from './src/hooks/useTheme';

type Tab = 'dashboard' | 'calendar' | 'explore' | 'profile';

const TABS: {
  id: Tab;
  label: string;
  on: React.ComponentProps<typeof Ionicons>['name'];
  off: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'dashboard', label: 'Inicio',     on: 'home',     off: 'home-outline' },
  { id: 'calendar',  label: 'Calendario', on: 'calendar', off: 'calendar-outline' },
  { id: 'explore',   label: 'Explorar',   on: 'compass',  off: 'compass-outline' },
  { id: 'profile',   label: 'Perfil',     on: 'person',   off: 'person-outline' },
];

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();

  return (
    <View style={[
      s.tabBar,
      { backgroundColor: colors.tabBar, paddingBottom: Math.max(insets.bottom, 8) },
    ]}>
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => onPress(t.id)}>
            {on ? (
              <View style={[s.tabPill, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={t.on} size={22} color={colors.accent} />
              </View>
            ) : (
              <View style={s.tabPillEmpty}>
                <Ionicons name={t.off} size={22} color={colors.subtext} />
              </View>
            )}
            <Text style={[s.tabLabel, { color: on ? colors.accent : colors.subtext }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [modal, setModal] = useState(false);
  const { colors, dark } = useTheme();
  const add = () => setModal(true);

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={s.root}>
        {tab === 'dashboard' && <DashboardScreen onAdd={add} />}
        {tab === 'calendar'  && <CalendarScreen  onAdd={add} />}
        {tab === 'explore'   && <ExploreScreen   onAdd={add} />}
        {tab === 'profile'   && <View style={[s.emptyTab, { backgroundColor: colors.bg }]} />}
      </View>
      <TabBar active={tab} onPress={setTab} />
      <AddSubscriptionModal visible={modal} onClose={() => setModal(false)} />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  emptyTab: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});
