import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildEmailVarCreate, buildEmailVarPatch, normalizeEmailVar } from './helpers';
import type { EmailVar, EmailVarCreateInput, EmailVarPatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_company_settings/global/email_vars';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listEmailVars(opts?: Options): Promise<EmailVar[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), orderBy('key')));
  return snap.docs.map((d) => normalizeEmailVar(d.id, d.data() as any));
}

export function listenEmailVars(cb: (rows: EmailVar[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), orderBy('key')), (snap) => {
    const rows = snap.docs.map((d) => normalizeEmailVar(d.id, d.data() as any));
    cb(rows);
  });
}

export async function createEmailVar(input: EmailVarCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildEmailVarCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateEmailVarDoc(id: string, patch: EmailVarPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildEmailVarPatch(patch);
  await updateDoc(doc(store, COL_PATH, id), obj);
}

export async function deleteEmailVarDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, COL_PATH, id));
}

export async function archiveEmailVarDoc(id: string, flag: boolean, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archivedAt: flag ? Date.now() : null } as any);
}

export async function softRemoveEmailVarDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { deletedAt: Date.now() } as any);
}

export async function restoreEmailVarDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { deletedAt: null } as any);
}
