import type { EmailVar, EmailVarCreateInput, EmailVarPatchInput } from './types';

export function normalizeEmailVar(id: string, raw: any): EmailVar {
  const key = String(raw?.key || '').trim();
  const value = String(raw?.value || '');
  const description = typeof raw?.description === 'string' && raw.description.trim().length > 0 ? raw.description : undefined;
  const createdAt = typeof raw?.createdAt === 'number' ? raw.createdAt as number : undefined;
  const archivedAt = typeof raw?.archivedAt === 'number' ? raw.archivedAt as number : (raw?.archivedAt === null ? null : (raw?.archivedAt ? Date.now() : null));
  const deletedAt = typeof raw?.deletedAt === 'number' ? raw.deletedAt as number : (raw?.deletedAt === null ? null : null);
  return { id, key, value, description, createdAt, archivedAt: archivedAt ?? null, deletedAt: deletedAt ?? null };
}

export function buildEmailVarCreate(input: EmailVarCreateInput): Record<string, any> {
  const key = String(input.key || '').trim();
  if (!key) throw new Error('key is required');
  const value = String(input.value || '');
  const description = (input.description || '').trim();
  return { key, value, description: description || null, createdAt: Date.now() };
}

export function buildEmailVarPatch(input: EmailVarPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.key === 'string') {
    const k = input.key.trim();
    if (!k) throw new Error('key cannot be blank');
    out.key = k;
  }
  if (typeof input.value === 'string') out.value = input.value;
  if (typeof input.description === 'string') out.description = input.description.trim() || null;
  if ('archivedAt' in (input as any)) out.archivedAt = (input as any).archivedAt ?? null;
  if ('deletedAt' in (input as any)) out.deletedAt = (input as any).deletedAt ?? null;
  return out;
}

