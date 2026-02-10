import { describe, it, expect } from '@jest/globals';
import { buildAppearanceCreate, buildAppearancePatch, normalizeAppearance } from '../../../../services/user-settings/appearance';

describe('services/user-settings/appearance helpers', () => {
  it('normalizeAppearance maps fields safely', () => {
    const raw: any = { userId: 'u1', theme: 'dark', updatedAt: 1 };
    const s = normalizeAppearance('id1', raw);
    expect(s).toEqual({ id: 'id1', userId: 'u1', theme: 'dark', updatedAt: 1 });
  });

  it('buildAppearanceCreate validates and shapes payload', () => {
    expect(() => buildAppearanceCreate({ userId: '', theme: 'light' })).toThrow();
    const p = buildAppearanceCreate({ userId: 'u1', theme: 'auto' });
    expect(p.userId).toBe('u1');
    expect(p.theme).toBe('auto');
    expect(typeof p.updatedAt).toBe('number');
  });

  it('buildAppearancePatch validates theme', () => {
    expect(() => buildAppearancePatch({ theme: 'x' as any })).toThrow();
    const p = buildAppearancePatch({ theme: 'dark' });
    expect(p.theme).toBe('dark');
    expect(typeof p.updatedAt).toBe('number');
  });
});

