import { doc, getDoc, onSnapshot, setDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildNewsbarUpsert, normalizeNewsbar } from './helpers';
import type { Newsbar, NewsbarUpsertInput } from './types';

type Options = { getDb?: () => Firestore };

const DOC_PATH = ['website', 'newsbar'] as const;

const ref = (store: Firestore) => doc(store, DOC_PATH[0], DOC_PATH[1]);

export async function getNewsbarDoc(opts?: Options): Promise<Newsbar | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(ref(store));
  if (!snap.exists()) return null;
  return normalizeNewsbar(snap.data() as any);
}

export function listenNewsbar(cb: (doc: Newsbar | null) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(ref(store), (snap) => {
    if (!snap.exists()) return cb(null);
    cb(normalizeNewsbar(snap.data() as any));
  });
}

export async function saveNewsbarDoc(input: NewsbarUpsertInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildNewsbarUpsert(input);
  await setDoc(ref(store), payload, { merge: true });
}

