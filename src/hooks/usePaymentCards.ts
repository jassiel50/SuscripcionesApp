import { useCallback, useEffect, useState } from 'react';
import { fsAddCard, fsDeleteCard, fsListenCards, fsUpdateCard } from '../firebase/paymentCards';
import { useAuth } from './useAuth';
import type { PaymentCard } from '../types';

type NewCard = Omit<PaymentCard, 'id' | 'created_at'>;

export function usePaymentCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCards([]); setLoading(false); return; }
    setLoading(true);
    const unsub = fsListenCards(user.uid, (c) => {
      setCards(c);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const addCard = useCallback(async (card: NewCard): Promise<string> => {
    if (!user) return '';
    return fsAddCard(user.uid, card);
  }, [user?.uid]);

  const removeCard = useCallback(async (id: string) => {
    if (!user) return;
    await fsDeleteCard(user.uid, id);
  }, [user?.uid]);

  const updateCard = useCallback(async (id: string, data: Partial<NewCard>) => {
    if (!user) return;
    await fsUpdateCard(user.uid, id, data);
  }, [user?.uid]);

  return { cards, loading, addCard, removeCard, updateCard };
}
