import { collection, doc, getDoc, onSnapshot, query, updateDoc, where, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { normalizeEmployee, buildEmployeePatch } from './helpers';
import type { EmployeeProfilePatch, EmployeeProfile } from './types';

type Options = { getDb?: () => Firestore };

const employeesDoc = (store: Firestore, uid: string) => doc(store, 'employees', uid);

export function listenEmployeeByUserId(uid: string, cb: (row: EmployeeProfile | null) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(employeesDoc(store, uid), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb(normalizeEmployee(snap.id, snap.data() as any));
  });
}

// Resolves by doc id (uid) if present, otherwise falls back to email query
export function listenEmployeeForUser(user: { uid: string; email?: string | null }, cb: (row: EmployeeProfile | null) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  let innerUnsub: Unsubscribe | null = null;
  let cancelled = false;
  (async () => {
    const dref = employeesDoc(store, user.uid);
    const snap = await getDoc(dref);
    if (cancelled) return;
    if (snap.exists()) {
      innerUnsub = onSnapshot(dref, (s) => {
        if (!s.exists()) { cb(null); return; }
        cb(normalizeEmployee(s.id, s.data() as any));
      });
    } else if (user.email) {
      const q = query(collection(store, 'employees'), where('email', '==', user.email));
      innerUnsub = onSnapshot(q, (qs) => {
        const d = qs.docs[0];
        cb(d ? normalizeEmployee(d.id, d.data() as any) : null);
      });
    } else {
      cb(null);
    }
  })();
  return () => { cancelled = true; try { innerUnsub && innerUnsub(); } catch {} };
}

export async function updateEmployee(uid: string, patch: EmployeeProfilePatch, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildEmployeePatch(patch);
  await updateDoc(employeesDoc(store, uid), obj);
}
