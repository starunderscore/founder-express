import { describe, it, expect } from '@jest/globals';
import { buildEmployeePatch, normalizeEmployee } from '../../../services/profile';

describe('services/profile helpers', () => {
  it('normalizeEmployee maps basic fields', () => {
    const raw: any = { email: 'a@b.com', name: 'Alice', dateOfBirth: '2000-01-01' };
    const e = normalizeEmployee('u1', raw);
    expect(e).toEqual({ id: 'u1', email: 'a@b.com', name: 'Alice', dateOfBirth: '2000-01-01' });
  });
  it('buildEmployeePatch shapes allowed fields', () => {
    const p = buildEmployeePatch({ name: ' Bob ', dateOfBirth: '1999-12-31' });
    expect(p).toEqual({ name: 'Bob', dateOfBirth: '1999-12-31' });
  });
});

