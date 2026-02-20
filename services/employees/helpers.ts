import type { Employee, EmployeeCreateInput, EmployeePatchInput } from './types';

export function normalizeEmployee(id: string, raw: any): Employee {
  return {
    id,
    name: String(raw?.name || '').trim(),
    email: String(raw?.email || '').trim().toLowerCase(),
    roleIds: Array.isArray(raw?.roleIds) ? raw.roleIds as string[] : [],
    permissionIds: Array.isArray(raw?.permissionIds) ? raw.permissionIds as string[] : [],
    isAdmin: !!raw?.isAdmin,
    // Prefer new lifecycle fields; keep a light compatibility shim
    archiveAt: typeof raw?.archiveAt === 'number'
      ? (raw.archiveAt as number)
      : (raw?.isArchived ? (typeof raw?.updatedAt === 'number' ? raw.updatedAt : (typeof raw?.createdAt === 'number' ? raw.createdAt : null)) : null),
    removedAt: typeof raw?.removedAt === 'number'
      ? (raw.removedAt as number)
      : (typeof raw?.deletedAt === 'number' ? (raw.deletedAt as number) : null),
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt as number : undefined,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt as number : undefined,
  };
}

export function buildEmployeeCreate(input: EmployeeCreateInput): Record<string, any> {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('name is required');
  const email = String(input.email || '').trim().toLowerCase();
  if (!email) throw new Error('email is required');
  const roleIds = Array.isArray(input.roleIds) ? input.roleIds : [];
  const permissionIds = Array.isArray(input.permissionIds) ? input.permissionIds : [];
  const now = Date.now();
  return {
    name,
    email,
    roleIds,
    permissionIds,
    isAdmin: !!input.isAdmin,
    archiveAt: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildEmployeePatch(input: EmployeePatchInput): Record<string, any> {
  const out: Record<string, any> = {};
  if (typeof input.name === 'string') {
    const n = input.name.trim();
    if (!n) throw new Error('name cannot be blank');
    out.name = n;
  }
  if (typeof input.email === 'string') {
    const e = input.email.trim().toLowerCase();
    if (!e) throw new Error('email cannot be blank');
    out.email = e;
  }
  if (input.roleIds) out.roleIds = Array.isArray(input.roleIds) ? input.roleIds : [];
  if (input.permissionIds) out.permissionIds = Array.isArray(input.permissionIds) ? input.permissionIds : [];
  if ('isAdmin' in (input as any)) out.isAdmin = !!(input as any).isAdmin;
  if ('archiveAt' in (input as any)) out.archiveAt = (input as any).archiveAt ?? null;
  if ('removedAt' in (input as any)) out.removedAt = (input as any).removedAt ?? null;
  // updatedAt applied at write time
  return out;
}
