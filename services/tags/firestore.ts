import { addDoc, collection, deleteDoc, deleteField, doc, getDocs, query, updateDoc, type Firestore } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { Tag, TagCreateInput, TagPatchInput, TagStatus } from './types';
import { buildTagCreate, buildTagPatchObject, filterByStatus, normalizeTag } from './helpers';

type Options = { getDb?: () => Firestore };

const tagsCol = (store: Firestore) => collection(store, 'ep_tags');

export async function listTags(status: TagStatus = 'active', opts?: Options): Promise<Tag[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(tagsCol(store)));
  const rows = snap.docs.map((d) => normalizeTag(d.id, d.data() as any));
  return filterByStatus(rows, status);
}

export async function createTag(input: TagCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildTagCreate(input);
  const ref = await addDoc(tagsCol(store), payload);
  return ref.id;
}

export async function updateTag(id: string, patch: TagPatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = buildTagPatchObject(patch);
  const out: Record<string, any> = {};
  if ('name' in obj) out.name = obj.name;
  if ('status' in obj) out.status = obj.status;
  if ('description' in obj) out.description = obj.description === null ? deleteField() : obj.description;
  if ('color' in obj) out.color = obj.color === null ? deleteField() : obj.color;
  await updateDoc(doc(store, 'ep_tags', id), out);
}

export async function archiveTag(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'ep_tags', id), { status: 'archived' });
}

export async function removeTag(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'ep_tags', id), { status: 'removed' });
}

export async function restoreTag(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, 'ep_tags', id), { status: 'active' });
}

export async function deleteTag(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, 'ep_tags', id));
}
