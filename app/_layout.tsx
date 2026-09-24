import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../src/hooks/useAuth';
import { SubscriptionsProvider } from '../src/hooks/useSubscriptions';
import { requestNotificationPermissions } from '../src/hooks/useNotifications';
import { useTheme } from '../src/hooks/useTheme';
import { fontFamily } from '../src/theme/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inLogin = segments[0] === 'login';
    if (!user && !inLogin) router.replace('/login');
    else if (user && inLogin) router.replace('/');
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  const { colors, dark } = useTheme();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Header de vidrio: transparente y con blur del sistema (iOS); el fondo con
  // degradado de cada pantalla se ve a través de él.
  const header = {
    headerShown: true,
    headerShadowVisible: false,
    headerTransparent: true,
    headerBlurEffect: (dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight') as 'systemChromeMaterialDark',
    headerStyle: { backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.glassStrong },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily, fontWeight: '700' as const },
    headerBackButtonDisplayMode: 'minimal' as const,
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SubscriptionsProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'ios_from_right' }}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="catalog" options={{ ...header, title: 'Explorar catálogo' }} />
          <Stack.Screen name="subscription/new" options={{ ...header, presentation: 'modal', animation: 'slide_from_bottom', title: 'Nueva suscripción' }} />
          <Stack.Screen name="subscription/[id]" options={{ ...header, title: '' }} />
        </Stack>
      </SubscriptionsProvider>
    </SafeAreaProvider>
  );
}
