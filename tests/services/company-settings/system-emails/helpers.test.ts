import { describe, it, expect } from '@jest/globals';
import { buildSystemEmailUpsert, normalizeSystemEmail } from '../../../../services/company-settings/system-emails';

describe('services/company-settings/system-emails helpers', () => {
  it('normalizeSystemEmail maps fields', () => {
    const raw: any = { subject: 'Hi', body: '<p>Hello</p>', updatedAt: 2 };
    const v = normalizeSystemEmail('password_reset', raw);
    expect(v).toEqual({ id: 'password_reset', subject: 'Hi', body: '<p>Hello</p>', updatedAt: 2 });
  });
  it('buildSystemEmailUpsert validates and shapes payload', () => {
    expect(() => buildSystemEmailUpsert({ subject: '', body: '' } as any)).toThrow();
    const p = buildSystemEmailUpsert({ subject: ' S ', body: 'B' });
    expect(p.subject).toBe('S');
    expect(p.body).toBe('B');
    expect(typeof p.updatedAt).toBe('number');
  });
});

