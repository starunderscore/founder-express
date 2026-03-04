import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildTaxCreate, buildTaxPatchObject, filterTaxesByStatus, normalizeTax, type TaxStatus } from './helpers';
import type { Tax, TaxCreateInput, TaxPatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_finance_taxes';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listTaxes(status: TaxStatus = 'active', opts?: Options): Promise<Tax[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store)));
  const rows = snap.docs.map((d) => normalizeTax(d.id, d.data()));
  return filterTaxesByStatus(rows, status);
}

export function listenTaxes(status: TaxStatus, cb: (rows: Tax[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizeTax(d.id, d.data()));
    cb(filterTaxesByStatus(rows, status));
  });
}

export async function createTax(input: TaxCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildTaxCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateTaxDoc(id: string, patch: TaxPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildTaxPatchObject(patch);
  if (Object.keys(obj).length === 0) return;
  await updateDoc(doc(store, COL_PATH, id), obj as any);
}

export async function archiveTaxDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: Date.now(), removedAt: null, updatedAt: Date.now() } as any);
}

export async function removeTaxDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { removedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restoreTaxDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: null, removedAt: null, updatedAt: Date.now() } as any);
}

