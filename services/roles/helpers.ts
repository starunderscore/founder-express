import type { Role, RoleStatus, RawRoleDoc, RoleCreateInput, RolePatchInput } from './types';

export function normalizeRole(id: string, raw: RawRoleDoc): Role {
  const name = String(raw?.name || '');
  const description = typeof raw?.description === 'string' && raw.description.trim().length > 0 ? raw.description : undefined;
  const permissionIds = Array.isArray(raw?.permissionIds) ? (raw.permissionIds as any[]).filter(Boolean) as string[] : [];
  const isArchived = !!raw?.isArchived;
  const deletedAt = typeof raw?.deletedAt === 'number' ? (raw.deletedAt as number) : undefined;
  const createdAt = typeof raw?.createdAt === 'number' ? (raw.createdAt as number) : undefined;
  return { id, name, description, permissionIds, isArchived, deletedAt, createdAt };
}

export function roleStatus(role: Pick<Role,'isArchived'|'deletedAt'>): RoleStatus {
  if (typeof role.deletedAt === 'number') return 'removed';
  if (role.isArchived) return 'archived';
  return 'active';
}

export function roleBackLink(role: Pick<Role,'isArchived'|'deletedAt'>): string {
  const status = roleStatus(role);
  if (status === 'removed') return '/employee/employees/roles/removed';
  if (status === 'archived') return '/employee/employees/roles/archive';
  return '/employee/employees/roles';
}

export function buildRoleCreate(input: RoleCreateInput): Record<string, any> {
  const nm = String(input.name || '').trim();
  if (!nm) throw new Error('name is required');
  const desc = (input.description || '').trim();
  return {
    name: nm,
    description: desc ? desc : undefined,
    permissionIds: Array.isArray(input.permissionIds) ? input.permissionIds : [],
    isArchived: false,
    deletedAt: null, // so falsy checks treat as active; consistent with app
    createdAt: Date.now(),
  };
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

export function filterByStatus<T extends Pick<Role,'isArchived'|'deletedAt'>>(rows: T[], status: RoleStatus): T[] {
  if (status === 'removed') return rows.filter((r) => typeof r.deletedAt === 'number');
  if (status === 'archived') return rows.filter((r) => !r.deletedAt && r.isArchived);
  return rows.filter((r) => !r.deletedAt && !r.isArchived);
}

