import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { CookiePolicy, CookiePolicyCreateInput, CookiePolicyPatchInput } from './types';
import { buildCookiePolicyCreate, buildCookiePolicyPatch, normalizeCookiePolicy } from './helpers';

type Options = { getDb?: () => Firestore };

const colRef = (store: Firestore) => collection(store, 'eq_cookie_policies');
const settingsDoc = (store: Firestore) => doc(store, 'ep_admin_settings', 'global');

export async function listCookiePolicies(opts?: Options): Promise<CookiePolicy[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store)));
  return snap.docs.map((d) => normalizeCookiePolicy(d.id, d.data() as any));
}

export function listenCookiePolicies(cb: (rows: CookiePolicy[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store)), (snap) => {
    const rows = snap.docs.map((d) => normalizeCookiePolicy(d.id, d.data() as any));
    cb(rows);
  });
}

export async function createCookiePolicy(input: CookiePolicyCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildCookiePolicyCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateCookiePolicy(id: string, patch: CookiePolicyPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildCookiePolicyPatch(patch);
  await updateDoc(doc(store, 'eq_cookie_policies', id), obj);
}

export async function setActiveCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  // Enforce a single active policy by deactivating others
  const rows = await listCookiePolicies({ getDb });
  const candidates = rows.filter((r) => !r.removedAt);
  for (const p of candidates) {
    const desired = p.id === id;
    await updateDoc(doc(store, 'eq_cookie_policies', p.id), { isActive: desired, updatedAt: Date.now() } as any);
  }
}

export async function getActiveCookiePolicy(opts?: Options): Promise<CookiePolicy | null> {
  const rows = await listCookiePolicies(opts);
  const active = rows.find((r) => !r.deletedAt && r.isActive);
  return active || null;
}

export async function archiveCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'eq_cookie_policies', id), { archivedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function removeCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'eq_cookie_policies', id), { removedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restoreCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'eq_cookie_policies', id), { removedAt: null, updatedAt: Date.now() } as any);
}

export async function unarchiveCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'eq_cookie_policies', id), { isArchived: false, updatedAt: Date.now() } as any);
}

export async function deleteCookiePolicy(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'eq_cookie_policies', id));
}

export async function getCookiePolicyEnabled(opts?: Options): Promise<boolean> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(settingsDoc(store));
  const enabled = !!(snap.data() as any)?.cookiePolicyEnabled;
  return enabled;
}

export function listenCookiePolicyEnabled(cb: (enabled: boolean) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(settingsDoc(store), (snap) => {
    const enabled = !!(snap.data() as any)?.cookiePolicyEnabled;
    cb(enabled);
  });
}

export async function setCookiePolicyEnabled(enabled: boolean, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await setDoc(settingsDoc(store), { cookiePolicyEnabled: !!enabled }, { merge: true });
}

export async function ensureDefaultCookiePolicy(opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  try { await migrateCookiePoliciesIfNeeded({ getDb }); } catch {}
  // Ensure toggle defaults to true if absent
  try {
    const sref = settingsDoc(store);
    const snap = await getDoc(sref);
    const data = (snap.data() || {}) as any;
    if (typeof data.cookiePolicyEnabled !== 'boolean') {
      await setDoc(sref, { cookiePolicyEnabled: true }, { merge: true });
    }
  } catch {}
  // Ensure at least one policy exists and is active
  const rows = await listCookiePolicies({ getDb });
  const candidates = rows.filter((r) => !r.deletedAt);
  if (candidates.length === 0) {
    const id = await createCookiePolicy({ title: 'Cookie Policy', bodyHtml: '<p>Update your cookie policy…</p>' }, { getDb });
    await setActiveCookiePolicy(id, { getDb });
    return;
  }
  if (!candidates.some((p) => p.isActive)) {
    const latest = candidates.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0];
    if (latest) await setActiveCookiePolicy(latest.id, { getDb });
  }
}

export async function migrateCookiePoliciesIfNeeded(opts?: Options): Promise<boolean> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const oldSnap = await getDocs(query(collection(store, 'cookie_policies')));
  const newSnap = await getDocs(query(collection(store, 'eq_cookie_policies')));
  if (newSnap.size > 0 || oldSnap.size === 0) return false;
  for (const d of oldSnap.docs) {
    const data = d.data();
    await setDoc(doc(store, 'eq_cookie_policies', d.id), data as any, { merge: true });
  }
  return true;
}
