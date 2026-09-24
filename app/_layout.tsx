import React, { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../src/hooks/useAuth';
import { SubscriptionsProvider } from '../src/hooks/useSubscriptions';
import { requestNotificationPermissions } from '../src/hooks/useNotifications';

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
  const dark = useColorScheme() === 'dark';

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <SubscriptionsProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="subscription/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Nueva suscripción',
              headerStyle: { backgroundColor: dark ? '#0A0F1E' : '#F2F2F7' },
              headerTintColor: dark ? '#FFFFFF' : '#0A0F2E',
            }}
          />
          <Stack.Screen
            name="subscription/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: dark ? '#0A0F1E' : '#F2F2F7' },
              headerTintColor: dark ? '#FFFFFF' : '#0A0F2E',
              headerBackTitle: 'Atrás',
            }}
          />
        </Stack>
      </SubscriptionsProvider>
    </SafeAreaProvider>
  );
}
