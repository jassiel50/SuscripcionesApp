import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore';
import { firestore } from '.';
import type { PaymentCard } from '../types';

type NewCard = Omit<PaymentCard, 'id' | 'created_at'>;

const colRef = (uid: string) => collection(firestore, 'users', uid, 'paymentCards');

export async function fsAddCard(uid: string, card: NewCard): Promise<string> {
  const ref = await addDoc(colRef(uid), {
    ...card,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function fsUpdateCard(uid: string, id: string, data: Partial<NewCard>) {
  await updateDoc(doc(colRef(uid), id), data as Record<string, unknown>);
}

export async function fsDeleteCard(uid: string, id: string) {
  await deleteDoc(doc(colRef(uid), id));
}

export function fsListenCards(
  uid: string,
  cb: (cards: PaymentCard[]) => void,
): () => void {
  const q = query(colRef(uid), orderBy('created_at', 'asc'));
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentCard))),
  );
}
