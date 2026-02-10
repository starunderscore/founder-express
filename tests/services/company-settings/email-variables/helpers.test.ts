import { describe, it, expect } from '@jest/globals';
import { buildEmailVarCreate, buildEmailVarPatch, normalizeEmailVar } from '../../../../services/company-settings/email-variables';

describe('services/admin-settings/email-variables helpers', () => {
  it('normalizeEmailVar maps fields', () => {
    const raw: any = { key: 'COMPANY_NAME', value: 'Acme', description: 'd', createdAt: 1, archivedAt: null, deletedAt: null };
    const v = normalizeEmailVar('id1', raw);
    expect(v).toEqual({ id: 'id1', key: 'COMPANY_NAME', value: 'Acme', description: 'd', createdAt: 1, archivedAt: null, deletedAt: null });
  });
  it('buildEmailVarCreate validates and shapes payload', () => {
    expect(() => buildEmailVarCreate({ key: '', value: '' } as any)).toThrow();
    const p = buildEmailVarCreate({ key: ' X ', value: 'Y', description: '  ' });
    expect(p.key).toBe('X');
    expect(p.value).toBe('Y');
    expect(p.description).toBeNull();
    expect(typeof p.createdAt).toBe('number');
  });
  it('buildEmailVarPatch validates key', () => {
    expect(() => buildEmailVarPatch({ key: '  ' })).toThrow();
    const p = buildEmailVarPatch({ key: ' NAME ', value: 'Z', description: '  d  ', archivedAt: null, deletedAt: null });
    expect(p).toEqual({ key: 'NAME', value: 'Z', description: 'd', archivedAt: null, deletedAt: null });
  });
});

