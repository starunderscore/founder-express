import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildNewsletterCreate, buildNewsletterPatch, normalizeNewsletter } from './helpers';
import type { Newsletter, NewsletterCreateInput, NewsletterPatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL = 'newsletters';
const colRef = (store: Firestore) => collection(store, COL);

export async function listNewsletters(opts?: Options): Promise<Newsletter[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => normalizeNewsletter(d.id, d.data() as any));
}

export function listenNewsletters(cb: (rows: Newsletter[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), orderBy('createdAt', 'desc')), (snap) => {
    const rows = snap.docs.map((d) => normalizeNewsletter(d.id, d.data() as any));
    cb(rows);
  });
}

export async function getNewsletterDoc(id: string, opts?: Options): Promise<Newsletter | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const s = await getDoc(doc(store, COL, id));
  if (!s.exists()) return null;
  return normalizeNewsletter(s.id, s.data() as any);
}

export async function createNewsletter(input: NewsletterCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildNewsletterCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateNewsletterDoc(id: string, patch: NewsletterPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = { ...buildNewsletterPatch(patch), updatedAt: Date.now() };
  await updateDoc(doc(store, COL, id), obj as any);
}

export async function scheduleNewsletter(id: string, when: number | null, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL, id), { status: when ? 'Scheduled' : 'Draft', scheduledAt: when, updatedAt: Date.now() } as any);
}

export async function markNewsletterSent(id: string, recipients: number, when: number = Date.now(), opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL, id), { status: 'Sent', sentAt: when, recipients, updatedAt: Date.now() } as any);
}

export async function deleteNewsletterDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, COL, id));
}

