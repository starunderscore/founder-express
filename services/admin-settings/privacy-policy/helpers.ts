import type { PrivacyPolicy, PrivacyPolicyCreateInput, PrivacyPolicyPatchInput, RawPrivacyPolicyDoc } from './types';

export function normalizePrivacyPolicy(id: string, raw: RawPrivacyPolicyDoc): PrivacyPolicy {
  const title = String(raw?.title || '').trim();
  const type = (raw?.type || 'client') as any;
  const bodyHtml = typeof raw?.bodyHtml === 'string' ? raw.bodyHtml : undefined;
  const isActive = !!raw?.isActive;
  const archiveAt = typeof raw?.archiveAt === 'number' ? (raw.archiveAt as number) : null;
  const removedAt = typeof raw?.removedAt === 'number' ? (raw.removedAt as number) : (typeof (raw as any)?.deletedAt === 'number' ? ((raw as any).deletedAt as number) : null);
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  return { id, title, type, bodyHtml, isActive, archiveAt: archiveAt ?? null, removedAt: removedAt ?? null, createdAt, updatedAt };
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
    archiveAt: null,
    removedAt: null,
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
  if ('archiveAt' in input) out.archiveAt = input.archiveAt ?? null;
  if ('removedAt' in input) out.removedAt = input.removedAt ?? null;
  if (typeof (input as any).isActive === 'boolean') out.isActive = (input as any).isActive;
  out.updatedAt = Date.now();
  return out;
}
