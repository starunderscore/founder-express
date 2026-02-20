import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildEmployeeCreate, buildEmployeePatch, normalizeEmployee } from './helpers';
import type { Employee, EmployeeCreateInput, EmployeePatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL = 'ep_employees';
const colRef = (store: Firestore) => collection(store, COL);

export async function listEmployees(opts?: Options): Promise<Employee[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), orderBy('name')));
  return snap.docs.map((d) => normalizeEmployee(d.id, d.data() as any));
}

export function listenEmployees(cb: (rows: Employee[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), orderBy('name')), (snap) => {
    const rows = snap.docs.map((d) => normalizeEmployee(d.id, d.data() as any));
    cb(rows);
  });
}

export async function getEmployeeDoc(id: string, opts?: Options): Promise<Employee | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const s = await getDoc(doc(store, COL, id));
  if (!s.exists()) return null;
  return normalizeEmployee(s.id, s.data() as any);
}

export async function createEmployee(input: EmployeeCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildEmployeeCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateEmployeeDoc(id: string, patch: EmployeePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = { ...buildEmployeePatch(patch), updatedAt: Date.now() };
  await updateDoc(doc(store, COL, id), obj as any);
}

export async function archiveEmployeeDoc(id: string, flag: boolean, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const now = Date.now();
  const payload: any = { archiveAt: flag ? now : null, updatedAt: now };
  if (flag) payload.removedAt = null; // do not include undefined fields
  await updateDoc(doc(store, COL, id), payload);
}

export async function softRemoveEmployeeDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const now = Date.now();
  await updateDoc(doc(store, COL, id), { removedAt: now, updatedAt: now } as any);
}

export async function restoreEmployeeDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const now = Date.now();
  await updateDoc(doc(store, COL, id), { removedAt: null, archiveAt: null, updatedAt: now } as any);
}

export async function deleteEmployeeDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, COL, id));
}
