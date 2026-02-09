import { doc, getDoc, onSnapshot, setDoc, updateDoc, type DocumentData, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { db as defaultDb } from '@/lib/firebase/client';
import type { AppSettings } from '@/state/appSettingsStore';
import { rowsFromSettings } from './helpers';
import type { SystemValueRow } from './types';

type Options = { getDb?: () => Firestore };

// Base collection for Employee Portal admin settings
export const ADMIN_SETTINGS_COLLECTION = 'ep_admin_settings';
export const ADMIN_SETTINGS_DOC_ID = 'global';

const settingsDoc = (store: Firestore) => doc(store, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);

export type RawAdminSettingsDoc = DocumentData & {
  websiteUrl?: any;
  websiteName?: any;
  env?: any;
};

export async function readAdminSettings(opts?: Options): Promise<Pick<AppSettings, 'websiteUrl' | 'websiteName' | 'env'>> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const snap = await getDoc(settingsDoc(store));
  const raw = (snap.data() || {}) as RawAdminSettingsDoc;
  const websiteUrl = typeof raw.websiteUrl === 'string' ? raw.websiteUrl : '';
  const websiteName = typeof raw.websiteName === 'string' ? raw.websiteName : '';
  const env = Array.isArray(raw.env) ? (raw.env as any[]).filter(Boolean) as any[] : [];
  return { websiteUrl, websiteName, env };
}

export async function writeBuiltinAdminSetting(key: 'WEBSITE_URL' | 'WEBSITE_NAME', value: string, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const v = String(value ?? '').trim();
  const patch: Record<string, any> = key === 'WEBSITE_URL' ? { websiteUrl: v } : { websiteName: v };
  // Use setDoc with merge in case the doc does not exist yet
  await setDoc(settingsDoc(store), patch, { merge: true });
}

export async function ensureDefaultAdminSettings(opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = settingsDoc(store);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { websiteUrl: 'https://www.example.com', websiteName: 'Acme Inc.', env: [] }, { merge: true });
  }
}

export async function listSystemValues(opts?: Options): Promise<SystemValueRow[]> {
  const settings = await readAdminSettings(opts);
  return rowsFromSettings(settings);
}

export function listenSystemValues(cb: (rows: SystemValueRow[]) => void, opts?: Options & { onError?: (err: unknown) => void }): Unsubscribe {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  return onSnapshot(settingsDoc(store), (snap) => {
    const raw = (snap.data() || {}) as RawAdminSettingsDoc;
    const websiteUrl = typeof raw.websiteUrl === 'string' ? raw.websiteUrl : '';
    const websiteName = typeof raw.websiteName === 'string' ? raw.websiteName : '';
    const env = Array.isArray(raw.env) ? (raw.env as any[]).filter(Boolean) as any[] : [];
    cb(rowsFromSettings({ websiteUrl, websiteName, env } as any));
  }, (err) => {
    if (opts && 'onError' in opts && typeof opts.onError === 'function') {
      try { (opts.onError as any)(err); } catch {}
    }
  });
}

export async function updateBuiltinSystemValue(key: 'WEBSITE_URL' | 'WEBSITE_NAME', value: string, opts?: Options): Promise<void> {
  await writeBuiltinAdminSetting(key, value, opts);
}

export async function createSystemEnvVar(input: { key: string; value: string; hint?: string }, opts?: Options): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const k = String(input.key || '').trim();
  if (!k) return { ok: false, reason: 'key is required' };
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = settingsDoc(store);
  const snap = await getDoc(ref);
  const raw = (snap.data() || {}) as RawAdminSettingsDoc;
  const env = Array.isArray(raw.env) ? (raw.env as any[]) : [];
  const id = `env-${Date.now()}`;
  const item = { id, key: k, value: input.value ?? '', hint: input.hint } as any;
  const next = [item, ...env];
  if (snap.exists()) await updateDoc(ref, { env: next }); else await setDoc(ref, { env: next }, { merge: true });
  return { ok: true, id };
}

export async function updateSystemEnvVar(id: string, patch: Partial<{ key: string; value: string; hint?: string }>, opts?: Options): Promise<void> {
  const getDb = opts?.getDb || defaultDb;
  const store = getDb();
  const ref = settingsDoc(store);
  const snap = await getDoc(ref);
  const raw = (snap.data() || {}) as RawAdminSettingsDoc;
  const env = Array.isArray(raw.env) ? (raw.env as any[]) : [];
  const out: any = { ...patch };
  if (typeof patch.key === 'string') {
    const nk = patch.key.trim();
    if (!nk) throw new Error('key cannot be blank');
    out.key = nk;
  }
  const next = env.map((x: any) => (x.id === id ? { ...x, ...out } : x));
  if (snap.exists()) await updateDoc(ref, { env: next }); else await setDoc(ref, { env: next }, { merge: true });
}
