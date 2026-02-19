import { collection, deleteField, doc, getDocs, onSnapshot, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import type { VendorContact, VendorContactNote, VendorContactPatch } from './types';

type Options = { getDb?: () => Firestore };

const crmCol = (store: Firestore) => collection(store, 'crm_customers');

function ensure<T>(val: T | undefined | null, fallback: T): T { return val == null ? fallback : val; }

function findContactInVendor(vendor: any, contactId: string): VendorContact | null {
  const contacts = Array.isArray(vendor?.contacts) ? vendor.contacts : [];
  const c = contacts.find((x: any) => x?.id === contactId);
  return c || null;
}

async function writeContacts(store: Firestore, vendorId: string, next: any[]): Promise<void> {
  await updateDoc(doc(store, 'crm_customers', vendorId), { contacts: next });
}

export async function getVendorContactById(contactId: string, opts?: Options): Promise<{ vendorId: string; vendor: any; contact: VendorContact } | null> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (data?.type !== 'vendor') continue;
    const c = findContactInVendor(data, contactId);
    if (c) return { vendorId: d.id, vendor: { id: d.id, ...data }, contact: c } as any;
  }
  return null;
}

export function listenVendorContactById(contactId: string, cb: (payload: { vendorId: string; vendor: any; contact: VendorContact } | null) => void, opts?: Options): Unsubscribe {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  return onSnapshot(q, (snap) => {
    let found: { vendorId: string; vendor: any; contact: VendorContact } | null = null;
    snap.forEach((d) => {
      if (found) return;
      const data = d.data();
      if (data?.type !== 'vendor') return;
      const c = findContactInVendor(data, contactId);
      if (c) found = { vendorId: d.id, vendor: { id: d.id, ...data }, contact: c } as any;
    });
    cb(found);
  });
}

export async function updateVendorContact(vendorId: string, contactId: string, patch: VendorContactPatch, opts?: Options): Promise<void> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.map((c: any) => (c?.id === contactId ? { ...c, ...patch } : c));
  await writeContacts(store, vendorId, next);
}

export async function setVendorContactDoNotContact(vendorId: string, contactId: string, value: boolean, opts?: Options): Promise<void> {
  return updateVendorContact(vendorId, contactId, { doNotContact: !!value }, opts);
}

export async function archiveVendorContact(vendorId: string, contactId: string, opts?: Options): Promise<void> {
  return updateVendorContact(vendorId, contactId, { isArchived: true }, opts);
}

export async function unarchiveVendorContact(vendorId: string, contactId: string, opts?: Options): Promise<void> {
  return updateVendorContact(vendorId, contactId, { isArchived: false }, opts);
}

export async function removeVendorContact(vendorId: string, contactId: string, opts?: Options): Promise<void> {
  return updateVendorContact(vendorId, contactId, { deletedAt: Date.now() }, opts);
}

export async function restoreVendorContact(vendorId: string, contactId: string, opts?: Options): Promise<void> {
  // Use deleteField by reconstructing contacts without the key
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.map((c: any) => (c?.id === contactId ? Object.fromEntries(Object.entries({ ...c, deletedAt: deleteField() }).filter(([k, v]) => v !== undefined)) : c));
  await writeContacts(store, vendorId, next);
}

export async function deleteVendorContact(vendorId: string, contactId: string, opts?: Options): Promise<void> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.filter((c: any) => c?.id !== contactId);
  await writeContacts(store, vendorId, next);
}

export async function addVendorContactNote(vendorId: string, contactId: string, note: VendorContactNote, opts?: Options): Promise<void> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.map((c: any) => (c?.id === contactId ? { ...c, notes: [note, ...(Array.isArray(c?.notes) ? c.notes : [])] } : c));
  await writeContacts(store, vendorId, next);
}

export async function updateVendorContactNote(vendorId: string, contactId: string, noteId: string, patch: Partial<VendorContactNote>, opts?: Options): Promise<void> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.map((c: any) => (c?.id === contactId ? { ...c, notes: (Array.isArray(c?.notes) ? c.notes : []).map((n: any) => (n?.id === noteId ? { ...n, ...patch } : n)) } : c));
  await writeContacts(store, vendorId, next);
}

export async function removeVendorContactNote(vendorId: string, contactId: string, noteId: string, opts?: Options): Promise<void> {
  const store = opts?.getDb?.();
  if (!store) throw new Error('Missing Firestore instance (getDb)');
  const q = query(crmCol(store));
  const snap = await getDocs(q);
  const vendorDoc = snap.docs.find((d) => d.id === vendorId);
  const data = vendorDoc?.data();
  if (!vendorDoc || !data) throw new Error('Vendor not found');
  const contacts = ensure<any[]>(data.contacts, []);
  const next = contacts.map((c: any) => (c?.id === contactId ? { ...c, notes: (Array.isArray(c?.notes) ? c.notes : []).filter((n: any) => n?.id !== noteId) } : c));
  await writeContacts(store, vendorId, next);
}
