import { addDoc, collection, deleteDoc, deleteField, doc, getDocs, query, updateDoc, type Firestore } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { CRMCreateInput, CRMLifecycle, CRMRecord, CRMPatchInput } from './types';
import { buildCRMCreate, buildCRMPatchObject, filterByLifecycle, normalizeCRMRecord } from './helpers';

type Options = { getDb?: () => Firestore };

const crmCol = (store: Firestore) => collection(store, 'crm_customers');

export async function listCRM(lifecycle: CRMLifecycle = 'active', opts?: Options): Promise<CRMRecord[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(crmCol(store)));
  const rows = snap.docs.map((d) => normalizeCRMRecord(d.id, d.data() as any));
  return filterByLifecycle(rows, lifecycle);
}

export async function createCRMRecord(input: CRMCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildCRMCreate(input);
  const ref = await addDoc(crmCol(store), payload);
  return ref.id;
}

export async function updateCRMRecord(id: string, patch: CRMPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildCRMPatchObject(patch);
  const out: Record<string, any> = {};
  if ('type' in obj) out.type = obj.type;
  if ('name' in obj) out.name = obj.name;
  if ('email' in obj) out.email = obj.email === null ? deleteField() : obj.email;
  if ('phone' in obj) out.phone = obj.phone === null ? deleteField() : obj.phone;
  if ('company' in obj) out.company = obj.company === null ? deleteField() : obj.company;
  if ('source' in obj) out.source = obj.source === null ? deleteField() : obj.source;
  if ('sourceDetail' in obj) out.sourceDetail = obj.sourceDetail === null ? deleteField() : obj.sourceDetail;
  if ('tags' in obj) out.tags = obj.tags;
  if ('ownerId' in obj) out.ownerId = obj.ownerId === null ? deleteField() : obj.ownerId;
  if ('isBlocked' in obj) out.isBlocked = obj.isBlocked;
  if ('isArchived' in obj) out.isArchived = obj.isArchived;
  if ('deletedAt' in obj) out.deletedAt = obj.deletedAt === null ? deleteField() : obj.deletedAt;
  if ('notes' in obj) (out as any).notes = (obj as any).notes;
  if ('phones' in obj) (out as any).phones = (obj as any).phones;
  await updateDoc(doc(store, 'crm_customers', id), out);
}

export async function archiveCRMRecord(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'crm_customers', id), { isArchived: true });
}

export async function removeCRMRecord(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'crm_customers', id), { deletedAt: Date.now() });
}

export async function restoreCRMRecord(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'crm_customers', id), { isArchived: false, deletedAt: deleteField() });
}

export async function deleteCRMRecord(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'crm_customers', id));
}
