import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NewSubscription } from '../types';
import { nextRenewalDate } from '../utils/dates';
import { money } from '../utils/format';

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

      // Si la fecha ancla ya pasó, se usa la siguiente ocurrencia real del ciclo.
      const renewal = nextRenewalDate(sub);
      renewal.setHours(9, 0, 0, 0);
      // Notify 1 day before renewal
      const reminderDay = new Date(renewal);
      reminderDay.setDate(reminderDay.getDate() - 1);
      // No hace falta descartar fechas pasadas: el trigger CALENDAR es repetitivo
      // y el sistema dispara en la siguiente coincidencia (mes/año siguiente).

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
          body: `Se cobrará ${money(sub.price)} ${sub.billing_cycle === 'monthly' ? '/mes' : '/año'}`,
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
