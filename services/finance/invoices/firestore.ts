import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildInvoiceCreate, buildInvoicePatch, normalizeInvoice } from './helpers';
import type { Invoice, InvoiceCreateInput, InvoicePatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_finance_invoices';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listInvoices(opts?: Options): Promise<Invoice[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store)));
  return snap.docs.map((d) => normalizeInvoice(d.id, d.data()));
}

export function listenInvoices(cb: (rows: Invoice[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizeInvoice(d.id, d.data()));
    cb(rows);
  });
}

export async function createInvoice(input: InvoiceCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildInvoiceCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateInvoiceDoc(id: string, patch: InvoicePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildInvoicePatch(patch);
  if (Object.keys(obj).length === 0) return;
  await updateDoc(doc(store, COL_PATH, id), obj as any);
}

export async function deleteInvoiceDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, COL_PATH, id));
}

