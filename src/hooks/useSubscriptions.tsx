import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fsAdd, fsDelete, fsListen, fsUpdate } from '../firebase/subscriptions';
import { useAuth } from './useAuth';
import { useCancelNotification, useScheduleNotification } from './useNotifications';
import { monthlyEquivalent, nextRenewalDate, toDateStr } from '../utils/dates';
import type { NewSubscription, Subscription } from '../types';

/** Fecha relativa a hoy (YYYY-MM-DD) para que las semillas siempre luzcan "vivas". */
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// Datos de ejemplo para cuentas nuevas (precios MXN alineados al catálogo).
const SEEDS = (): NewSubscription[] => [
  { name: 'Netflix', price: 269, billing_cycle: 'monthly', next_renewal: inDays(2),  category: 'entertainment', color: '#E50914', remind_me: 1, payment_method: 'credit_card' },
  { name: 'Spotify', price: 139, billing_cycle: 'monthly', next_renewal: inDays(9),  category: 'entertainment', color: '#1DB954', remind_me: 1, payment_method: 'credit_card' },
  { name: 'iCloud+', price: 49,  billing_cycle: 'monthly', next_renewal: inDays(16), category: 'productivity',  color: '#3478F6', remind_me: 0, payment_method: 'credit_card' },
];

const BUDGET_KEY = '@subs_budget';
const DEFAULT_BUDGET = 1500;

type Ctx = {
  /** Ordenadas por próxima fecha de cobro real (no por la fecha ancla guardada). */
  subscriptions: Subscription[];
  loading: boolean;
  /** Equivalente mensual de todo (anuales / 12). */
  monthlyTotal: number;
  yearlyTotal: number;
  budget: number;
  setBudget: (value: number) => Promise<void>;
  add: (sub: NewSubscription) => Promise<void>;
  remove: (sub: Subscription) => Promise<void>;
  update: (id: string, data: Partial<NewSubscription>) => Promise<void>;
  setNotifId: (id: string, notifId: string | null) => Promise<void>;
};

const SubscriptionsCtx = createContext<Ctx | null>(null);

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const scheduleNotif = useScheduleNotification();
  const cancelNotif   = useCancelNotification();

  const [raw, setRaw] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudgetState] = useState(DEFAULT_BUDGET);
  const seededRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(BUDGET_KEY).then(v => {
      const n = v ? parseFloat(v) : NaN;
      if (Number.isFinite(n) && n > 0) setBudgetState(n);
    }).catch(() => {});
  }, []);

  const setBudget = useCallback(async (value: number) => {
    setBudgetState(value);
    await AsyncStorage.setItem(BUDGET_KEY, String(value));
  }, []);

  useEffect(() => {
    if (!user) { setRaw([]); setLoading(false); return; }
    setLoading(true);

    const unsub = fsListen(user.uid, async (subs) => {
      if (subs.length === 0 && !seededRef.current) {
        seededRef.current = true;
        for (const seed of SEEDS()) await fsAdd(user.uid, seed);
        return; // onSnapshot vuelve a disparar con los datos sembrados
      }
      seededRef.current = true;
      setRaw(subs);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  const subscriptions = useMemo(
    () => [...raw].sort((a, b) => nextRenewalDate(a).getTime() - nextRenewalDate(b).getTime()),
    [raw],
  );

  const add = useCallback(async (sub: NewSubscription) => {
    if (!user) return;
    const id = await fsAdd(user.uid, sub);
    if (sub.remind_me) {
      const notifId = await scheduleNotif(sub);
      if (notifId) await fsUpdate(user.uid, id, { notification_id: notifId });
    }
  }, [user?.uid, scheduleNotif]);

  const remove = useCallback(async (sub: Subscription) => {
    if (!user) return;
    if (sub.notification_id) await cancelNotif(sub.notification_id);
    await fsDelete(user.uid, sub.id);
  }, [user?.uid, cancelNotif]);

  const update = useCallback(async (id: string, data: Partial<NewSubscription>) => {
    if (!user) return;
    await fsUpdate(user.uid, id, data as Record<string, unknown>);
  }, [user?.uid]);

  const setNotifId = useCallback(async (id: string, notifId: string | null) => {
    if (!user) return;
    await fsUpdate(user.uid, id, { notification_id: notifId });
  }, [user?.uid]);

  const monthlyTotal = useMemo(
    () => subscriptions.reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [subscriptions],
  );

  const value = useMemo<Ctx>(() => ({
    subscriptions, loading, monthlyTotal, yearlyTotal: monthlyTotal * 12,
    budget, setBudget, add, remove, update, setNotifId,
  }), [subscriptions, loading, monthlyTotal, budget, setBudget, add, remove, update, setNotifId]);

  return <SubscriptionsCtx.Provider value={value}>{children}</SubscriptionsCtx.Provider>;
}

export function useSubscriptions(): Ctx {
  const ctx = useContext(SubscriptionsCtx);
  if (!ctx) throw new Error('useSubscriptions must be inside SubscriptionsProvider');
  return ctx;
}
