import { describe, it, expect } from '@jest/globals';
import { buildCRMCreate, buildCRMPatchObject, crmBackLink, filterByLifecycle, normalizeCRMRecord } from '../../../services/crm/helpers';
import type { RawCRMDoc } from '../../../services/crm/types';

describe('services/crm helpers', () => {
  it('normalizeCRMRecord handles blanks and defaults', () => {
    const raw: RawCRMDoc = { type: 'customer', name: '  Alice  ', email: ' ', company: undefined, isArchived: false } as any;
    const r = normalizeCRMRecord('id1', raw);
    expect(r).toEqual({ id: 'id1', type: 'customer', name: '  Alice  ', email: undefined, phone: undefined, company: undefined, source: undefined, sourceDetail: undefined, tags: undefined, ownerId: undefined, createdAt: undefined, isArchived: false, deletedAt: undefined });
  });

  it('buildCRMCreate validates and shapes payload', () => {
    expect(() => buildCRMCreate({ type: 'customer', name: '' })).toThrow();
    const p = buildCRMCreate({ type: 'vendor', name: ' V ', email: ' ', phone: ' 123 ', company: ' Co ', source: 'Website', sourceDetail: ' Ad ', tags: ['vip',''], ownerId: ' emp1 ' });
    expect(p.type).toBe('vendor');
    expect(p.name).toBe('V');
    expect(p.email).toBeUndefined();
    expect(p.phone).toBe('123');
    expect(p.company).toBe('Co');
    expect(Array.isArray(p.tags)).toBe(true);
    expect(typeof p.createdAt).toBe('number');
    expect(p.isArchived).toBe(false);
  });

  it('buildCRMPatchObject validates name and maps blanks to null', () => {
    expect(() => buildCRMPatchObject({ name: '  ' })).toThrow();
    const p = buildCRMPatchObject({ name: ' X ', email: ' ', phone: '', company: '', source: ' ', sourceDetail: ' ', ownerId: ' ', tags: ['a','b'] });
    expect(p).toMatchObject({ name: 'X', email: null, phone: null, company: null, source: null, sourceDetail: null, ownerId: null, tags: ['a','b'] });
  });

  it('filterByLifecycle partitions correctly', () => {
    const rows: any[] = [
      { id: '1', isArchived: false, deletedAt: undefined },
      { id: '2', isArchived: true, deletedAt: undefined },
      { id: '3', isArchived: false, deletedAt: Date.now() },
    ];
    expect(filterByLifecycle(rows, 'active').map(r => r.id)).toEqual(['1']);
    expect(filterByLifecycle(rows, 'archived').map(r => r.id)).toEqual(['2']);
    expect(filterByLifecycle(rows, 'removed').map(r => r.id)).toEqual(['3']);
  });

  it('crmBackLink maps correctly for both bases', () => {
    expect(crmBackLink('active', 'crm')).toBe('/employee/crm');
    expect(crmBackLink('archived', 'crm')).toBe('/employee/crm/archive');
    expect(crmBackLink('removed', 'crm')).toBe('/employee/crm/removed');
    expect(crmBackLink('active', 'customers-crm')).toBe('/employee/customers/crm');
  });
});

