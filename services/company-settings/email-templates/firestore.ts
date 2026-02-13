import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildEmailTemplateCreate, buildEmailTemplatePatch, normalizeEmailTemplate } from './helpers';
import type { EmailTemplate, EmailTemplateCreateInput, EmailTemplatePatchInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_company_settings/global/email_templates';
const colRef = (store: Firestore) => collection(store, COL_PATH);

export async function listEmailTemplates(opts?: Options): Promise<EmailTemplate[]> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDocs(query(colRef(store), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => normalizeEmailTemplate(d.id, d.data() as any));
}

export function listenEmailTemplates(cb: (rows: EmailTemplate[]) => void, opts?: Options): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(query(colRef(store), orderBy('createdAt', 'desc')), (snap) => {
    const rows = snap.docs.map((d) => normalizeEmailTemplate(d.id, d.data() as any));
    cb(rows);
  });
}

export async function getEmailTemplateDoc(id: string, opts?: Options): Promise<EmailTemplate | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = doc(store, COL_PATH, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeEmailTemplate(snap.id, snap.data() as any);
}

export async function createEmailTemplate(input: EmailTemplateCreateInput, opts?: Options): Promise<string> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const payload = buildEmailTemplateCreate(input);
  const ref = await addDoc(colRef(store), payload);
  return ref.id;
}

export async function updateEmailTemplateDoc(id: string, patch: EmailTemplatePatchInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const obj = { ...buildEmailTemplatePatch(patch), updatedAt: Date.now() };
  await updateDoc(doc(store, COL_PATH, id), obj as any);
}

export async function deleteEmailTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await deleteDoc(doc(store, COL_PATH, id));
}

export async function archiveEmailTemplateDoc(id: string, flag: boolean, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { archivedAt: flag ? Date.now() : null, updatedAt: Date.now() } as any);
}

export async function softRemoveEmailTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { deletedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restoreEmailTemplateDoc(id: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  await updateDoc(doc(store, COL_PATH, id), { deletedAt: null, updatedAt: Date.now() } as any);
}

