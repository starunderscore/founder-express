import { describe, it, expect } from '@jest/globals';
import { buildEmployeeCreate, buildEmployeePatch, normalizeEmployee } from '../../../services/employees';

describe('services/employees helpers', () => {
  it('normalizeEmployee maps fields', () => {
    const raw: any = { name: 'User', email: 'U@Example.com', roleIds: ['r1'], permissionIds: ['p1'], isAdmin: true, archiveAt: null, removedAt: null, createdAt: 1, updatedAt: 2 };
    const v = normalizeEmployee('id1', raw);
    expect(v).toEqual({ id: 'id1', name: 'User', email: 'u@example.com', roleIds: ['r1'], permissionIds: ['p1'], isAdmin: true, archiveAt: null, removedAt: null, createdAt: 1, updatedAt: 2 });
  });
  it('buildEmployeeCreate validates and shapes payload', () => {
    expect(() => buildEmployeeCreate({ name: '', email: '' } as any)).toThrow();
    const p = buildEmployeeCreate({ name: ' A ', email: ' A@B.com ' });
    expect(p.name).toBe('A');
    expect(p.email).toBe('a@b.com');
    expect(p.archiveAt).toBeNull();
    expect(p.removedAt).toBeNull();
    expect(typeof p.createdAt).toBe('number');
    expect(typeof p.updatedAt).toBe('number');
  });
  it('buildEmployeePatch validates name/email', () => {
    expect(() => buildEmployeePatch({ name: '  ' })).toThrow();
    expect(() => buildEmployeePatch({ email: '  ' })).toThrow();
    const p = buildEmployeePatch({ name: ' N ', email: ' X@Y.Com ', isAdmin: true, archiveAt: null, removedAt: null });
    expect(p).toEqual({ name: 'N', email: 'x@y.com', isAdmin: true, archiveAt: null, removedAt: null });
  });
});
