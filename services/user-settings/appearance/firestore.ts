import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildAppearanceCreate, buildAppearancePatch, normalizeAppearance } from './helpers';
import type { AppearanceCreateInput, AppearancePatchInput, AppearanceSettings } from './types';

type Options = { getDb?: () => Firestore };

const colRef = (store: Firestore) => collection(store, 'user_settings_appearance');

export async function getAppearanceByUser(userId: string, opts?: Options): Promise<AppearanceSettings | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), where('userId', '==', userId)));
  const docSnap = snap.docs[0];
  if (!docSnap) return null;
  return normalizeAppearance(docSnap.id, docSnap.data());
}

export function listenAppearanceByUser(userId: string, cb: (row: AppearanceSettings | null) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), where('userId', '==', userId)), (snap) => {
    const d = snap.docs[0];
    cb(d ? normalizeAppearance(d.id, d.data()) : null);
  });
}

export async function createAppearance(input: AppearanceCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildAppearanceCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateAppearance(id: string, patch: AppearancePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildAppearancePatch(patch);
  await updateDoc(doc(store, 'user_settings_appearance', id), obj);
}
