import { addDoc, collection, deleteDoc, deleteField, doc, getDocs, query, updateDoc, type Firestore } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { Role, RoleCreateInput, RolePatchInput, RoleStatus } from './types';
import { buildRoleCreate, buildRolePatchObject, filterByStatus, normalizeRole } from './helpers';

type Options = { getDb?: () => Firestore };

const rolesCol = (store: Firestore) => collection(store, 'ep_employee_roles');

export async function listRoles(status: RoleStatus = 'active', opts?: Options): Promise<Role[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(rolesCol(store)));
  const rows = snap.docs.map((d) => normalizeRole(d.id, d.data() as any));
  return filterByStatus(rows, status);
}

export async function createRole(input: RoleCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildRoleCreate(input);
  const ref = await addDoc(rolesCol(store), payload);
  return ref.id;
}

export async function updateRole(id: string, patch: RolePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildRolePatchObject(patch);
  const out: Record<string, any> = {};
  if ('name' in obj) out.name = obj.name;
  if ('permissionIds' in obj) out.permissionIds = obj.permissionIds;
  if ('description' in obj) {
    out.description = obj.description === null ? deleteField() : obj.description;
  }
  await updateDoc(doc(store, 'ep_employee_roles', id), out);
}

export async function archiveRole(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const now = Date.now();
  await updateDoc(doc(store, 'ep_employee_roles', id), { archiveAt: now, removedAt: null });
}

export async function removeRole(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'ep_employee_roles', id), { removedAt: Date.now() });
}

export async function restoreRole(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  // Clear both markers to Active
  await updateDoc(doc(store, 'ep_employee_roles', id), { removedAt: null, archiveAt: null });
}

export async function deleteRole(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'ep_employee_roles', id));
}
