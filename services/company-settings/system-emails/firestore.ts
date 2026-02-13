import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import { buildSystemEmailUpsert, normalizeSystemEmail } from './helpers';
import type { SystemEmail, SystemEmailId, SystemEmailUpsertInput } from './types';

type Options = { getDb?: () => Firestore };

const COL_PATH = 'ep_company_settings/global/system_emails';

export async function getSystemEmailDoc(id: SystemEmailId, opts?: Options): Promise<SystemEmail | null> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = doc(store, COL_PATH, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeSystemEmail(id, snap.data() as any);
}

export async function saveSystemEmailDoc(id: SystemEmailId, input: SystemEmailUpsertInput, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = doc(store, COL_PATH, id);
  const payload = buildSystemEmailUpsert(input);
  await setDoc(ref, payload, { merge: true });
}

