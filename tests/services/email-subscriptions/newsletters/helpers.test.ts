import { describe, it, expect } from '@jest/globals';
import { buildNewsletterCreate, buildNewsletterPatch, normalizeNewsletter } from '../../../../services/email-subscriptions/newsletters';

describe('services/newsletters helpers', () => {
  it('normalizeNewsletter maps fields', () => {
    const raw: any = { subject: 'Hello', body: '<p>Hi</p>', status: 'Draft', recipients: 0, scheduledAt: null, sentAt: null, createdAt: 1, updatedAt: 2 };
    const v = normalizeNewsletter('id1', raw);
    expect(v).toEqual({ id: 'id1', subject: 'Hello', body: '<p>Hi</p>', status: 'Draft', recipients: 0, scheduledAt: null, sentAt: null, createdAt: 1, updatedAt: 2 });
  });
  it('buildNewsletterCreate validates and shapes payload', () => {
    expect(() => buildNewsletterCreate({ subject: '', body: '' } as any)).toThrow();
    const p = buildNewsletterCreate({ subject: ' S ', body: 'B' });
    expect(p.subject).toBe('S');
    expect(p.body).toBe('B');
    expect(p.status).toBe('Draft');
    expect(p.recipients).toBe(0);
  });
  it('buildNewsletterPatch validates subject', () => {
    expect(() => buildNewsletterPatch({ subject: '  ' })).toThrow();
    const p = buildNewsletterPatch({ subject: ' X ', body: 'Y', status: 'Scheduled', recipients: 10, scheduledAt: 5, sentAt: null });
    expect(p).toEqual({ subject: 'X', body: 'Y', status: 'Scheduled', recipients: 10, scheduledAt: 5, sentAt: null });
  });
});

