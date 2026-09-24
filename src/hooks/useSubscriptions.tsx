import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fsAdd, fsDelete, fsListen, fsUpdate } from '../firebase/subscriptions';
import { useAuth } from './useAuth';
import { useCancelNotification, useScheduleNotification } from './useNotifications';
import type { NewSubscription, Subscription } from '../types';

const SEEDS: NewSubscription[] = [
  { name: 'Netflix',      price: 15.99, billing_cycle: 'monthly', next_renewal: '2026-07-02', category: 'entertainment', color: '#E50914', remind_me: 1, payment_method: 'credit_card' },
  { name: 'Spotify',      price: 9.99,  billing_cycle: 'monthly', next_renewal: '2026-07-10', category: 'entertainment', color: '#1DB954', remind_me: 1, payment_method: 'credit_card' },
  { name: 'Apple iCloud', price: 2.99,  billing_cycle: 'monthly', next_renewal: '2026-07-15', category: 'productivity',  color: '#3478F6', remind_me: 0, payment_method: 'credit_card' },
];

type Ctx = {
  subscriptions: Subscription[];
  loading: boolean;
  monthlyTotal: number;
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

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!user) { setSubscriptions([]); setLoading(false); return; }
    setLoading(true);

    const unsub = fsListen(user.uid, async (subs) => {
      if (subs.length === 0 && !seededRef.current) {
        seededRef.current = true;
        for (const seed of SEEDS) await fsAdd(user.uid, seed);
        return; // onSnapshot fires again with the seeded data
      }
      setSubscriptions(subs);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

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

  const monthlyTotal = subscriptions.reduce((sum, s) =>
    sum + (s.billing_cycle === 'yearly' ? s.price / 12 : s.price), 0);

  return (
    <SubscriptionsCtx.Provider value={{ subscriptions, loading, monthlyTotal, add, remove, update, setNotifId }}>
      {children}
    </SubscriptionsCtx.Provider>
  );
}

export function useSubscriptions(): Ctx {
  const ctx = useContext(SubscriptionsCtx);
  if (!ctx) throw new Error('useSubscriptions must be inside SubscriptionsProvider');
  return ctx;
}
