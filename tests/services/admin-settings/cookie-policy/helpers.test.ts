import { describe, it, expect } from '@jest/globals';
import { buildCookiePolicyCreate, buildCookiePolicyPatch, normalizeCookiePolicy } from '../../../../services/admin-settings/cookie-policy';

describe('services/admin-settings/cookie-policy helpers', () => {
  it('normalizeCookiePolicy maps fields safely', () => {
    const raw: any = { title: '  Title  ', bodyHtml: '<p>x</p>', isActive: true, createdAt: 1, updatedAt: 2 };
    const row = normalizeCookiePolicy('id1', raw as any);
    expect(row).toEqual({ id: 'id1', title: 'Title', bodyHtml: '<p>x</p>', isActive: true, createdAt: 1, updatedAt: 2, deletedAt: null });
  });

  it('buildCookiePolicyCreate validates and shapes payload', () => {
    expect(() => buildCookiePolicyCreate({ title: '' })).toThrow();
    const p = buildCookiePolicyCreate({ title: '  T  ', bodyHtml: '<p>a</p>' });
    expect(p.title).toBe('T');
    expect(p.bodyHtml).toBe('<p>a</p>');
    expect(p.isActive).toBe(false);
    expect(typeof p.createdAt).toBe('number');
    expect(typeof p.updatedAt).toBe('number');
  });

  it('buildCookiePolicyPatch validates title and sets updatedAt', () => {
    expect(() => buildCookiePolicyPatch({ title: '  ' })).toThrow();
    const p = buildCookiePolicyPatch({ title: ' X ', bodyHtml: '<p>b</p>', isActive: true });
    expect(p.title).toBe('X');
    expect(p.bodyHtml).toBe('<p>b</p>');
    expect(p.isActive).toBe(true);
    expect(typeof p.updatedAt).toBe('number');
  });
});
