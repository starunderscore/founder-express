import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { PrivacyPolicy, PrivacyPolicyCreateInput, PrivacyPolicyPatchInput } from './types';
import { buildPrivacyPolicyCreate, buildPrivacyPolicyPatch, normalizePrivacyPolicy } from './helpers';

type Options = { getDb?: () => Firestore };

const colRef = (store: Firestore) => collection(store, 'privacy_policies');
const settingsDoc = (store: Firestore) => doc(store, 'ep_admin_settings', 'global');

export async function listPrivacyPolicies(opts?: Options): Promise<PrivacyPolicy[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store)));
  return snap.docs.map((d) => normalizePrivacyPolicy(d.id, d.data() as any));
}

export function listenPrivacyPolicies(cb: (rows: PrivacyPolicy[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizePrivacyPolicy(d.id, d.data() as any));
    cb(rows);
  });
}

export async function createPrivacyPolicy(input: PrivacyPolicyCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildPrivacyPolicyCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updatePrivacyPolicy(id: string, patch: PrivacyPolicyPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildPrivacyPolicyPatch(patch);
  await updateDoc(doc(store, 'privacy_policies', id), obj);
}

export async function setActiveClientPolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const rows = await listPrivacyPolicies({ getDb });
  const clientRows = rows.filter((r) => (r.type || 'client') === 'client' && !r.deletedAt);
  for (const p of clientRows) {
    const desired = p.id === id;
    if ((p.isActive ?? false) !== desired) {
      await updateDoc(doc(store, 'privacy_policies', p.id), { isActive: desired, updatedAt: Date.now() } as any);
    }
  }
}

export async function getPrivacyPolicyEnabled(opts?: Options): Promise<boolean> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(settingsDoc(store));
  const enabled = !!(snap.data() as any)?.privacyPolicyEnabled;
  return enabled;
}

export function listenPrivacyPolicyEnabled(cb: (enabled: boolean) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(settingsDoc(store), (snap) => {
    const enabled = !!(snap.data() as any)?.privacyPolicyEnabled;
    cb(enabled);
  });
}

export async function setPrivacyPolicyEnabled(enabled: boolean, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await setDoc(settingsDoc(store), { privacyPolicyEnabled: !!enabled }, { merge: true });
}

export async function ensureDefaultPrivacyPolicy(opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  // Ensure toggle defaults to true if absent
  try {
    const sref = settingsDoc(store);
    const snap = await getDoc(sref);
    const data = (snap.data() || {}) as any;
    if (typeof data.privacyPolicyEnabled !== 'boolean') {
      await setDoc(sref, { privacyPolicyEnabled: true }, { merge: true });
    }
  } catch {}
  // Ensure at least one client policy exists and is active
  const rows = await listPrivacyPolicies({ getDb });
  const clientRows = rows.filter((r) => (r.type || 'client') === 'client' && !r.deletedAt);
  if (clientRows.length === 0) {
    const id = await createPrivacyPolicy({ title: 'Client Privacy Policy', bodyHtml: '<p>Update your privacy policy…</p>', type: 'client' }, { getDb });
    await setActiveClientPolicy(id, { getDb });
    return;
  }
  if (!clientRows.some((p) => p.isActive)) {
    // Select most recently updated as active
    const latest = clientRows.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
    if (latest) await setActiveClientPolicy(latest.id, { getDb });
  }
}

export async function getActiveClientPolicy(opts?: Options): Promise<PrivacyPolicy | null> {
  const rows = await listPrivacyPolicies(opts);
  const active = rows.find((r) => (r.type || 'client') === 'client' && r.isActive);
  return active || null;
}

export async function archivePrivacyPolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'privacy_policies', id), { isActive: false, updatedAt: Date.now() } as any);
}

export async function removePrivacyPolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'privacy_policies', id), { deletedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restorePrivacyPolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'privacy_policies', id), { deletedAt: null, updatedAt: Date.now() } as any);
}

export async function deletePrivacyPolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'privacy_policies', id));
}
