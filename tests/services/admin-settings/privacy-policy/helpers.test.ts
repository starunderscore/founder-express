import { describe, it, expect } from '@jest/globals';
import { buildPrivacyPolicyCreate, buildPrivacyPolicyPatch, normalizePrivacyPolicy } from '../../../../services/admin-settings/privacy-policy';

describe('services/admin-settings/privacy-policy helpers', () => {
  it('normalizePrivacyPolicy maps fields safely', () => {
    const raw: any = { title: '  Title  ', type: 'client', bodyHtml: '<p>x</p>', isActive: true, createdAt: 1, updatedAt: 2 };
    const row = normalizePrivacyPolicy('id1', raw as any);
    expect(row).toEqual({ id: 'id1', title: 'Title', type: 'client', bodyHtml: '<p>x</p>', isActive: true, createdAt: 1, updatedAt: 2, deletedAt: null });
  });

  it('buildPrivacyPolicyCreate validates and shapes payload', () => {
    expect(() => buildPrivacyPolicyCreate({ title: '' })).toThrow();
    const p = buildPrivacyPolicyCreate({ title: '  T  ', bodyHtml: '<p>a</p>' });
    expect(p.title).toBe('T');
    expect(p.type).toBe('client');
    expect(p.bodyHtml).toBe('<p>a</p>');
    expect(p.isActive).toBe(false);
    expect(typeof p.createdAt).toBe('number');
    expect(typeof p.updatedAt).toBe('number');
  });

  it('buildPrivacyPolicyPatch validates title and sets updatedAt', () => {
    expect(() => buildPrivacyPolicyPatch({ title: '  ' })).toThrow();
    const p = buildPrivacyPolicyPatch({ title: ' X ', bodyHtml: '<p>b</p>', isActive: true });
    expect(p.title).toBe('X');
    expect(p.bodyHtml).toBe('<p>b</p>');
    expect(p.isActive).toBe(true);
    expect(typeof p.updatedAt).toBe('number');
  });
});

