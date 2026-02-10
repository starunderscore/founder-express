import type { CookiePolicy, CookiePolicyCreateInput, CookiePolicyPatchInput, RawCookiePolicyDoc } from './types';

export function normalizeCookiePolicy(id: string, raw: RawCookiePolicyDoc): CookiePolicy {
  const title = String(raw?.title || '').trim();
  const bodyHtml = typeof raw?.bodyHtml === 'string' ? raw.bodyHtml : undefined;
  const archivedAt = typeof (raw as any)?.archivedAt === 'number' ? (raw as any).archivedAt as number : ((raw as any)?.isArchived ? ((raw as any)?.updatedAt || (raw as any)?.createdAt || Date.now()) : null);
  const removedAt = typeof (raw as any)?.removedAt === 'number' ? (raw as any).removedAt as number : (typeof (raw as any)?.deletedAt === 'number' ? (raw as any).deletedAt as number : null);
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  const updatedAt = typeof raw?.updatedAt === 'number' ? (raw.updatedAt as number) : undefined;
  // Prefer explicit isActive boolean if present; otherwise derive from timestamps
  const isActive = typeof (raw as any)?.isActive === 'boolean'
    ? !!(raw as any)?.isActive
    : (!archivedAt && !removedAt);
  return { id, title, bodyHtml, isActive, archivedAt: archivedAt ?? null, removedAt: removedAt ?? null, createdAt, updatedAt };
}

export function buildCookiePolicyCreate(input: CookiePolicyCreateInput): Record<string, any> {
  const t = String(input.title || '').trim();
  if (!t) throw new Error('title is required');
  const now = Date.now();
  return {
    title: t,
    bodyHtml: input.bodyHtml || '',
    isActive: false,
    // Default new policy as inactive; not archived/removed
    archivedAt: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildCookiePolicyPatch(input: CookiePolicyPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.title === 'string') {
    const t = input.title.trim();
    if (!t) throw new Error('title cannot be blank');
    out.title = t;
  }
  if (typeof input.bodyHtml === 'string') out.bodyHtml = input.bodyHtml;
  if (typeof input.isActive === 'boolean') out.isActive = input.isActive;
  if ('archivedAt' in input) out.archivedAt = input.archivedAt ?? null;
  if ('removedAt' in input) out.removedAt = input.removedAt ?? null;
  out.updatedAt = Date.now();
  return out;
}
