import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore';
import { firestore } from '.';
import type { NewSubscription, Subscription } from '../types';

const colRef = (uid: string) => collection(firestore, 'users', uid, 'subscriptions');

export async function fsAdd(uid: string, sub: NewSubscription): Promise<string> {
  // Firestore rejects undefined values — strip them before saving
  const data: Record<string, unknown> = { notification_id: null, created_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(sub)) {
    if (v !== undefined) data[k] = v;
  }
  const ref = await addDoc(colRef(uid), data);
  return ref.id;
}

export async function fsUpdate(uid: string, id: string, data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await updateDoc(doc(colRef(uid), id), clean);
}

export async function fsDelete(uid: string, id: string) {
  await deleteDoc(doc(colRef(uid), id));
}

export function fsListen(
  uid: string,
  cb: (subs: Subscription[]) => void,
): () => void {
  const q = query(colRef(uid), orderBy('next_renewal', 'asc'));
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription))),
  );
}
