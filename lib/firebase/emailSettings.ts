import { db } from '@/lib/firebase/client';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

export type EmailVar = {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt?: number;
  archivedAt?: number | null;
  deletedAt?: number | null;
};

// Store under a single admin settings document's subcollection for validity
const COL_PATH = 'ep_company_settings/global/email_vars';

export function listenEmailVars(cb: (vars: EmailVar[]) => void): Unsubscribe {
  const col = collection(db(), COL_PATH);
  const q = query(col, orderBy('key'));
  return onSnapshot(q, (snap) => {
    const list: EmailVar[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      list.push({ id: d.id, key: data.key, value: data.value, description: (data.description ?? data.hint) || undefined, createdAt: data.createdAt, archivedAt: data.archivedAt ?? null, deletedAt: data.deletedAt ?? null });
    });
    cb(list);
  });
}

export async function addEmailVar(data: { key: string; value: string; description?: string }) {
  const col = collection(db(), COL_PATH);
  await addDoc(col, { key: data.key, value: data.value, description: data.description || null, createdAt: Date.now() });
}

export async function updateEmailVar(id: string, patch: Partial<Omit<EmailVar, 'id'>>) {
  const ref = doc(db(), COL_PATH, id);
  await updateDoc(ref, patch as any);
}

export async function removeEmailVar(id: string) {
  const ref = doc(db(), COL_PATH, id);
  await deleteDoc(ref);
}

export async function archiveEmailVar(id: string, flag: boolean) {
  const ref = doc(db(), COL_PATH, id);
  await updateDoc(ref, { archivedAt: flag ? Date.now() : null } as any);
}

export async function softRemoveEmailVar(id: string) {
  const ref = doc(db(), COL_PATH, id);
  await updateDoc(ref, { deletedAt: Date.now() } as any);
}

export async function restoreEmailVar(id: string) {
  const ref = doc(db(), COL_PATH, id);
  await updateDoc(ref, { deletedAt: null } as any);
}

// Email templates
export type EmailTemplateItem = {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt?: number;
  updatedAt?: number;
  archivedAt?: number | null;
  deletedAt?: number | null;
};

const TPL_COL = 'ep_company_settings/global/email_templates';

export function listenEmailTemplates(cb: (list: EmailTemplateItem[]) => void): Unsubscribe {
  const col = collection(db(), TPL_COL);
  const q = query(col, orderBy('createdAt'));
  return onSnapshot(q, (snap) => {
    const list: EmailTemplateItem[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      list.push({ id: d.id, name: data.name, subject: data.subject, body: data.body || '', createdAt: data.createdAt, updatedAt: data.updatedAt, archivedAt: data.archivedAt ?? null, deletedAt: data.deletedAt ?? null });
    });
    cb(list);
  });
}

export async function addEmailTemplate(data: { name: string; subject: string; body: string }) {
  const col = collection(db(), TPL_COL);
  await addDoc(col, { name: data.name, subject: data.subject, body: data.body, createdAt: Date.now(), updatedAt: Date.now() });
}

export async function updateEmailTemplate(id: string, patch: Partial<Omit<EmailTemplateItem, 'id'>>) {
  const ref = doc(db(), TPL_COL, id);
  await updateDoc(ref, { ...patch, updatedAt: Date.now() } as any);
}

export async function removeEmailTemplate(id: string) {
  const ref = doc(db(), TPL_COL, id);
  await deleteDoc(ref);
}

export async function archiveEmailTemplate(id: string, flag: boolean) {
  const ref = doc(db(), TPL_COL, id);
  await updateDoc(ref, { archivedAt: flag ? Date.now() : null, updatedAt: Date.now() } as any);
}

export async function softRemoveEmailTemplate(id: string) {
  const ref = doc(db(), TPL_COL, id);
  await updateDoc(ref, { deletedAt: Date.now(), updatedAt: Date.now() } as any);
}

export async function restoreEmailTemplate(id: string) {
  const ref = doc(db(), TPL_COL, id);
  await updateDoc(ref, { deletedAt: null, updatedAt: Date.now() } as any);
}

export async function getEmailTemplate(id: string): Promise<EmailTemplateItem | null> {
  const ref = doc(db(), TPL_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return { id: snap.id, name: data.name, subject: data.subject, body: data.body || '', createdAt: data.createdAt, updatedAt: data.updatedAt };
}

// System emails (password reset, verify email) — stored separately from templates
export type SystemEmailId = 'password_reset' | 'verify_email';
export type SystemEmail = {
  id: SystemEmailId;
  subject: string;
  body: string;
  updatedAt?: number;
};

const SYS_COL = 'ep_company_settings/global/system_emails';

export async function getSystemEmail(id: SystemEmailId): Promise<SystemEmail | null> {
  const ref = doc(db(), SYS_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return { id, subject: data.subject || '', body: data.body || '', updatedAt: data.updatedAt };
}

export async function saveSystemEmail(id: SystemEmailId, data: { subject: string; body: string }) {
  const ref = doc(db(), SYS_COL, id);
  await setDoc(ref, { subject: data.subject, body: data.body, updatedAt: Date.now() }, { merge: true });
}

export async function ensureDefaultSystemEmails() {
  const defaults: Record<SystemEmailId, { subject: string; body: string }> = {
    password_reset: {
      subject: 'Reset your password for {{COMPANY_NAME}}',
      body: '<p>Hi {{USERNAME}},</p><p>Click the link below to reset your password:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Reset password</a></p><p>If you did not request this, you can ignore this email.</p><p>— {{COMPANY_NAME}}</p>',
    },
    verify_email: {
      subject: 'Verify your email for {{COMPANY_NAME}}',
      body: '<p>Hi {{USERNAME}},</p><p>Please confirm your email address by clicking the link below:</p><p><a href="{{ACTION_URL}}" target="_blank" rel="noopener">Verify email</a></p><p>Thanks!<br/>— {{COMPANY_NAME}}</p>',
    },
  };
  for (const id of Object.keys(defaults) as SystemEmailId[]) {
    const ref = doc(db(), SYS_COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { ...defaults[id], updatedAt: Date.now() });
    }
  }
}
