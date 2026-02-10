import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { NotificationCreateInput, NotificationItem, NotificationPatchInput } from './types';
import { buildNotificationCreate, buildNotificationPatch, normalizeNotification } from './helpers';

type Options = { getDb?: () => Firestore };

const colRef = (store: Firestore) => collection(store, 'ep_notifications');

export async function listNotifications(opts?: Options): Promise<NotificationItem[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => normalizeNotification(d.id, d.data() as any));
}

export function listenNotifications(cb: (rows: NotificationItem[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), orderBy('createdAt', 'desc')), (snap) => {
    const rows = snap.docs.map((d) => normalizeNotification(d.id, d.data() as any));
    cb(rows);
  });
}

export function listenUnreadCount(cb: (count: number) => void, opts?: Options): Unsubscribe {
  return listenNotifications((rows) => cb(rows.filter((r) => !r.read).length), opts);
}

export async function createNotification(input: NotificationCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildNotificationCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateNotification(id: string, patch: NotificationPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildNotificationPatch(patch);
  await updateDoc(doc(store, 'ep_notifications', id), obj);
}

export async function markRead(id: string, read: boolean, opts?: Options): Promise<void> {
  await updateNotification(id, { read }, opts);
}

export async function deleteNotification(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'ep_notifications', id));
}

