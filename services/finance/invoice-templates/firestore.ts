import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildInvoiceTemplateCreate, buildInvoiceTemplatePatch, filterTemplatesByStatus, normalizeInvoiceTemplate, type TemplateStatus } from './helpers';
import type { InvoiceTemplate, InvoiceTemplateCreateInput, InvoiceTemplatePatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_finance_invoice_templates';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listInvoiceTemplates(status: TemplateStatus = 'active', opts?: Options): Promise<InvoiceTemplate[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store)));
  const rows = snap.docs.map((d) => normalizeInvoiceTemplate(d.id, d.data()));
  return filterTemplatesByStatus(rows, status);
}

export function listenInvoiceTemplates(status: TemplateStatus, cb: (rows: InvoiceTemplate[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizeInvoiceTemplate(d.id, d.data()));
    cb(filterTemplatesByStatus(rows, status));
  });
}

export async function createInvoiceTemplate(input: InvoiceTemplateCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildInvoiceTemplateCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateInvoiceTemplateDoc(id: string, patch: InvoiceTemplatePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildInvoiceTemplatePatch(patch);
  if (Object.keys(obj).length === 0) return;
  await updateDoc(doc(store, COL_PATH, id), obj as any);
}

export async function archiveInvoiceTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: Date.now(), removedAt: null, updatedAt: Date.now() } as any);
}

export async function removeInvoiceTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { removedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restoreInvoiceTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archiveAt: null, removedAt: null, updatedAt: Date.now() } as any);
}

