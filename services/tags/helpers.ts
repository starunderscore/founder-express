import type { RawTagDoc, Tag, TagCreateInput, TagPatchInput, TagStatus } from './types';

export function normalizeTag(id: string, raw: RawTagDoc): Tag {
  const name = String(raw?.name || '');
  const description = typeof raw?.description === 'string' && raw.description.trim().length > 0 ? raw.description : undefined;
  const color = typeof raw?.color === 'string' && raw.color.trim().length > 0 ? raw.color : undefined;
  const status = (['active', 'archived', 'removed'] as TagStatus[]).includes(raw?.status) ? (raw.status as TagStatus) : undefined;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  return { id, name, description, color, status, createdAt };
}

export function buildTagCreate(input: TagCreateInput): Record<string, any> {
  const nm = String(input.name || '').trim();
  if (!nm) throw new Error('name is required');
  const out: Record<string, any> = {
    name: nm,
    status: 'active' as TagStatus,
    createdAt: Date.now(),
  };
  const desc = (input.description ?? '').trim();
  if (desc) out.description = desc;
  const color = (input.color ?? '').trim();
  if (color) out.color = color;
  return out;
}

// Returns a plain object with optional fields; Firestore-specific delete handling belongs in firestore.ts
export function buildTagPatchObject(input: TagPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') {
    const nm = input.name.trim();
    if (!nm) throw new Error('name cannot be blank');
    out.name = nm;
  }
  if (typeof input.description === 'string') {
    const desc = input.description.trim();
    out.description = desc ? desc : null; // sentinel for delete
  }
  if (typeof input.color === 'string' || input.color === null) {
    const c = (input.color ?? '').trim();
    out.color = c ? c : null; // sentinel for delete
  }
  if (typeof input.status === 'string') {
    out.status = input.status;
  }
  return out;
}

export function filterByStatus<T extends Pick<Tag, 'status'>>(rows: T[], status: TagStatus): T[] {
  const normalize = (s?: TagStatus): TagStatus => (s === 'archived' || s === 'removed') ? s : 'active';
  return rows.filter((r) => normalize(r.status as TagStatus) === status);
}

export function tagBackLink(tag: Pick<Tag,'status'>): string {
  const s = (tag.status ?? 'active') as TagStatus;
  if (s === 'removed') return '/employee/tag-manager/removed';
  if (s === 'archived') return '/employee/tag-manager/archive';
  return '/employee/tag-manager';
}

