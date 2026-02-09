import type { PrivacyPolicy, PrivacyPolicyCreateInput, PrivacyPolicyPatchInput, RawPrivacyPolicyDoc } from './types';

export function normalizePrivacyPolicy(id: string, raw: RawPrivacyPolicyDoc): PrivacyPolicy {
  const title = String(raw?.title || '').trim();
  const type = (raw?.type || 'client') as any;
  const bodyHtml = typeof raw?.bodyHtml === 'string' ? raw.bodyHtml : undefined;
  const isActive = !!raw?.isActive;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  const deletedAt = typeof raw?.deletedAt === 'number' ? (raw.deletedAt as number) : undefined;
  return { id, title, type, bodyHtml, isActive, createdAt, updatedAt, deletedAt: deletedAt ?? null };
}

export function buildPrivacyPolicyCreate(input: PrivacyPolicyCreateInput): Record<string, any> {
  const t = String(input.title || '').trim();
  if (!t) throw new Error('title is required');
  const now = Date.now();
  return {
    title: t,
    type: (input.type || 'client'),
    bodyHtml: input.bodyHtml || '',
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildPrivacyPolicyPatch(input: PrivacyPolicyPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.title === 'string') {
    const t = input.title.trim();
    if (!t) throw new Error('title cannot be blank');
    out.title = t;
  }
  if (typeof input.bodyHtml === 'string') {
    out.bodyHtml = input.bodyHtml;
  }
  if (typeof input.isActive === 'boolean') out.isActive = input.isActive;
  out.updatedAt = Date.now();
  return out;
}

