import { doc, getDoc, onSnapshot, setDoc, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildGeneralPatch, normalizeSettings } from './helpers';
import type { GeneralPatchInput, GeneralSettings } from './types';

type Options = { getDb?: () => Firestore };

const COLLECTION = 'ep_finance_settings';
const DOC_ID = 'general';
const docRef = (store: Firestore) => doc(store, COLLECTION, DOC_ID);

export async function readFinanceGeneral(opts?: Options): Promise<GeneralSettings> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(docRef(store));
  const raw = (snap.data() || {}) as any;
  return normalizeSettings(raw);
}

export function listenFinanceGeneral(cb: (row: GeneralSettings) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(docRef(store), (snap) => {
    const raw = (snap.data() || {}) as any;
    cb(normalizeSettings(raw));
  });
}

export async function updateFinanceGeneral(patch: GeneralPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildGeneralPatch(patch);
  if (Object.keys(obj).length === 0) return;
  // Use setDoc with merge in case the doc does not yet exist
  await setDoc(docRef(store), obj as any, { merge: true });
}

