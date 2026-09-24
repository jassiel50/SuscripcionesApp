import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NewSubscription } from '../types';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export function useScheduleNotification() {
  return useCallback(async (sub: NewSubscription): Promise<string | null> => {
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) return null;

      const renewal = new Date(sub.next_renewal + 'T09:00:00');
      // Notify 1 day before renewal
      const reminderDay = new Date(renewal);
      reminderDay.setDate(reminderDay.getDate() - 1);
      if (reminderDay <= new Date()) return null;

      // Use a repeating CALENDAR trigger so the notification fires every cycle
      let trigger: Notifications.NotificationTriggerInput;

      if (sub.billing_cycle === 'monthly') {
        // Every month on the same day-of-month at 9:00
        const dayOfMonth = reminderDay.getDate();
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          day: dayOfMonth,
          hour: 9,
          minute: 0,
        };
      } else {
        // Every year on the same month + day at 9:00
        const dayOfMonth = reminderDay.getDate();
        const monthOfYear = reminderDay.getMonth() + 1; // 1-indexed
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          month: monthOfYear,
          day: dayOfMonth,
          hour: 9,
          minute: 0,
        };
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `${sub.name} renueva mañana`,
          body: `Se cobrará $${sub.price.toFixed(2)} ${sub.billing_cycle === 'monthly' ? '/mes' : '/año'}`,
          sound: true,
        },
        trigger,
      });
    } catch (e) {
      console.warn('No se pudo programar la notificación:', e);
      return null;
    }
  }, []);
}

export function useCancelNotification() {
  return useCallback(async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('No se pudo cancelar la notificación:', e);
    }
  }, []);
}
