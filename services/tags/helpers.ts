import type { RawTagDoc, Tag, TagCreateInput, TagPatchInput, TagStatus } from './types';

export const MAX_TAG_NAME = 40;
export const MAX_TAG_DESCRIPTION = 280;
export const DEFAULT_TAG_COLOR = '#845EF7'; // lively grape
export const MAX_TAG_COLOR_LEN = 20;

export function normalizeTag(id: string, raw: RawTagDoc): Tag {
  const name = String(raw?.name || '');
  const description = typeof raw?.description === 'string' && raw.description.trim().length > 0 ? raw.description : undefined;
  const color = typeof raw?.color === 'string' && raw.color.trim().length > 0 ? raw.color : undefined;
  const status = (['active', 'archived', 'removed'] as TagStatus[]).includes(raw?.status) ? (raw.status as TagStatus) : undefined;
  const archiveAt = typeof raw?.archiveAt === 'number' ? (raw.archiveAt as number) : (raw?.isArchived ? (raw?.updatedAt || raw?.createdAt || Date.now()) : null);
  const removedAt = typeof raw?.removedAt === 'number' ? (raw.removedAt as number) : (typeof (raw as any)?.deletedAt === 'number' ? ((raw as any).deletedAt as number) : null);
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  return { id, name, description, color, status, archiveAt: archiveAt ?? null, removedAt: removedAt ?? null, createdAt };
}

export function buildTagCreate(input: TagCreateInput): Record<string, any> {
  const nm = String(input.name || '').trim();
  if (!nm) throw new Error('name is required');
  if (nm.length > MAX_TAG_NAME) throw new Error(`name must be <= ${MAX_TAG_NAME} characters`);
  const out: Record<string, any> = {
    name: nm,
    status: 'active' as TagStatus,
    archiveAt: null,
    removedAt: null,
    createdAt: Date.now(),
  };
  const desc = (input.description ?? '').trim();
  if (desc) {
    if (desc.length > MAX_TAG_DESCRIPTION) throw new Error(`description must be <= ${MAX_TAG_DESCRIPTION} characters`);
    out.description = desc;
  }
  const color = (input.color ?? '').trim();
  if (color && color.length > MAX_TAG_COLOR_LEN) throw new Error(`color must be <= ${MAX_TAG_COLOR_LEN} characters`);
  out.color = color || DEFAULT_TAG_COLOR;
  return out;
}

// Returns a plain object with optional fields; Firestore-specific delete handling belongs in firestore.ts
export function buildTagPatchObject(input: TagPatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') {
    const nm = input.name.trim();
    if (!nm) throw new Error('name cannot be blank');
    if (nm.length > MAX_TAG_NAME) throw new Error(`name must be <= ${MAX_TAG_NAME} characters`);
    out.name = nm;
  }
  if (typeof input.description === 'string') {
    const desc = input.description.trim();
    if (desc && desc.length > MAX_TAG_DESCRIPTION) throw new Error(`description must be <= ${MAX_TAG_DESCRIPTION} characters`);
    out.description = desc ? desc : null; // sentinel for delete
  }
  if (typeof input.color === 'string' || input.color === null) {
    const c = (input.color ?? '').trim();
    if (c && c.length > MAX_TAG_COLOR_LEN) throw new Error(`color must be <= ${MAX_TAG_COLOR_LEN} characters`);
    out.color = c ? c : null; // sentinel for delete
  }
  if (typeof input.status === 'string') {
    out.status = input.status;
  }
  return out;
}

export function filterByStatus<T extends Pick<Tag, 'status' | 'archiveAt' | 'removedAt'>>(rows: T[], status: TagStatus): T[] {
  const derive = (r: T): TagStatus => {
    // Prefer canonical lifecycle fields when present
    const removed = (r as any).removedAt != null;
    const archived = (r as any).archiveAt != null;
    if (removed) return 'removed';
    if (archived) return 'archived';
    // Fallback to legacy status
    const s = ((r as any).status ?? 'active') as TagStatus;
    return (s === 'archived' || s === 'removed') ? s : 'active';
  };
  return rows.filter((r) => derive(r) === status);
}

export function tagBackLink(tag: Pick<Tag,'status'|'archiveAt'|'removedAt'>): string {
  const removed = (tag as any).removedAt != null;
  const archived = (tag as any).archiveAt != null;
  if (removed) return '/employee/tag-manager/removed';
  if (archived) return '/employee/tag-manager/archive';
  const s = ((tag as any).status ?? 'active') as TagStatus;
  if (s === 'removed') return '/employee/tag-manager/removed';
  if (s === 'archived') return '/employee/tag-manager/archive';
  return '/employee/tag-manager';
}
