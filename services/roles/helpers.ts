import type { Role, RoleStatus, RawRoleDoc, RoleCreateInput, RolePatchInput } from './types';

export function normalizeRole(id: string, raw: RawRoleDoc): Role {
  const name = String(raw?.name || '');
  const description = typeof raw?.description === 'string' && raw.description.trim().length > 0 ? raw.description : undefined;
  const permissionIds = Array.isArray(raw?.permissionIds) ? (raw.permissionIds as any[]).filter(Boolean) as string[] : [];
  const archiveAt = typeof raw?.archiveAt === 'number'
    ? (raw.archiveAt as number)
    : (raw?.isArchived ? ((raw as any)?.updatedAt || (raw as any)?.createdAt || Date.now()) : null);
  const removedAt = typeof raw?.removedAt === 'number'
    ? (raw.removedAt as number)
    : (typeof raw?.deletedAt === 'number' ? (raw.deletedAt as number) : null);
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  return { id, name, description, permissionIds, archiveAt: archiveAt ?? null, removedAt: removedAt ?? null, createdAt };
}

export function roleStatus(role: Pick<Role,'archiveAt'|'removedAt'>): RoleStatus {
  if (typeof role.removedAt === 'number' && role.removedAt != null) return 'removed';
  if (typeof role.archiveAt === 'number' && role.archiveAt != null) return 'archived';
  return 'active';
}

export function roleBackLink(role: Pick<Role,'archiveAt'|'removedAt'>): string {
  const status = roleStatus(role);
  if (status === 'removed') return '/employee/employees/roles/removed';
  if (status === 'archived') return '/employee/employees/roles/archive';
  return '/employee/employees/roles';
}

export function buildRoleCreate(input: RoleCreateInput): Record<string, any> {
  const nm = String(input.name || '').trim();
  if (!nm) throw new Error('name is required');
  const out: Record<string, any> = {
    name: nm,
    permissionIds: Array.isArray(input.permissionIds) ? input.permissionIds : [],
    archiveAt: null,
    removedAt: null, // consistent with lifecycle model
    createdAt: Date.now(),
  };
  const desc = (input.description ?? '').trim();
  if (desc) out.description = desc; // omit field when blank to avoid undefined
  return out;
}

// Returns a plain object with optional fields; Firestore-specific delete handling belongs in firestore.ts
export function buildRolePatchObject(input: RolePatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') {
    const nm = input.name.trim();
    if (!nm) throw new Error('name cannot be blank');
    out.name = nm;
  }
  if (Array.isArray(input.permissionIds)) out.permissionIds = input.permissionIds;
  if (typeof input.description === 'string') {
    const desc = input.description.trim();
    // Use a sentinel understood by firestore.ts to map to deleteField
    out.description = desc ? desc : null;
  }
  return out;
}

export function filterByStatus<T extends Pick<Role,'archiveAt'|'removedAt'>>(rows: T[], status: RoleStatus): T[] {
  if (status === 'removed') return rows.filter((r) => !!(r as any).removedAt);
  if (status === 'archived') return rows.filter((r) => !(r as any).removedAt && !!(r as any).archiveAt);
  return rows.filter((r) => !(r as any).removedAt && !(r as any).archiveAt);
}
