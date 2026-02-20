import { describe, it, expect } from '@jest/globals';
import { buildRoleCreate, buildRolePatchObject, filterByStatus, normalizeRole, roleBackLink, roleStatus } from '../../../services/roles/helpers';
import type { RawRoleDoc, Role } from '../../../services/roles/types';

describe('services/roles helpers', () => {
  it('normalizeRole handles missing/blank fields', () => {
    const raw: RawRoleDoc = { name: '  Name  ', permissionIds: ['a', null, 'b'], archiveAt: null, removedAt: null } as any;
    const r = normalizeRole('id1', raw);
    expect(r).toEqual({ id: 'id1', name: '  Name  ', description: undefined, permissionIds: ['a', 'b'], archiveAt: null, removedAt: null, createdAt: undefined });
  });

  it('roleStatus and roleBackLink map correctly', () => {
    const active: Pick<Role,'archiveAt'|'removedAt'> = { archiveAt: null, removedAt: null } as any;
    const archived: Pick<Role,'archiveAt'|'removedAt'> = { archiveAt: Date.now(), removedAt: null } as any;
    const removed: Pick<Role,'archiveAt'|'removedAt'> = { archiveAt: null, removedAt: Date.now() } as any;
    expect(roleStatus(active)).toBe('active');
    expect(roleStatus(archived)).toBe('archived');
    expect(roleStatus(removed)).toBe('removed');
    expect(roleBackLink(active)).toBe('/employee/employees/roles');
    expect(roleBackLink(archived)).toBe('/employee/employees/roles/archive');
    expect(roleBackLink(removed)).toBe('/employee/employees/roles/removed');
  });

  it('buildRoleCreate validates and shapes payload', () => {
    expect(() => buildRoleCreate({ name: '', permissionIds: [] })).toThrow();
    const p = buildRoleCreate({ name: ' Role ', description: '  ', permissionIds: ['x'] });
    expect(p.name).toBe('Role');
    expect(p.description).toBeUndefined();
    expect(p.permissionIds).toEqual(['x']);
    expect(p.archiveAt).toBeNull();
    expect(p.removedAt).toBeNull();
    expect(typeof p.createdAt).toBe('number');
  });

  it('buildRolePatchObject validates name and maps blank description to null', () => {
    expect(() => buildRolePatchObject({ name: '  ' })).toThrow();
    const p = buildRolePatchObject({ name: ' X ', description: '  ', permissionIds: ['a'] });
    expect(p).toEqual({ name: 'X', description: null, permissionIds: ['a'] });
  });

  it('filterByStatus partitions correctly', () => {
    const now = Date.now();
    const rows: any[] = [
      { id: '1', archiveAt: null, removedAt: null },
      { id: '2', archiveAt: now, removedAt: null },
      { id: '3', archiveAt: null, removedAt: now },
    ];
    expect(filterByStatus(rows, 'active').map(r => r.id)).toEqual(['1']);
    expect(filterByStatus(rows, 'archived').map(r => r.id)).toEqual(['2']);
    expect(filterByStatus(rows, 'removed').map(r => r.id)).toEqual(['3']);
  });
});
