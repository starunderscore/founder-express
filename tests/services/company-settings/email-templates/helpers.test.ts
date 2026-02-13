import { describe, it, expect } from '@jest/globals';
import { buildEmailTemplateCreate, buildEmailTemplatePatch, normalizeEmailTemplate } from '../../../../services/company-settings/email-templates';

describe('services/company-settings/email-templates helpers', () => {
  it('normalizeEmailTemplate maps fields', () => {
    const raw: any = { name: 'Welcome', subject: 'Hi', body: '<p>Hello</p>', createdAt: 1, updatedAt: 2, archivedAt: null, deletedAt: null };
    const v = normalizeEmailTemplate('id1', raw);
    expect(v).toEqual({ id: 'id1', name: 'Welcome', subject: 'Hi', body: '<p>Hello</p>', createdAt: 1, updatedAt: 2, archivedAt: null, deletedAt: null });
  });
  it('buildEmailTemplateCreate validates and shapes payload', () => {
    expect(() => buildEmailTemplateCreate({ name: '', subject: 's', body: '' } as any)).toThrow();
    expect(() => buildEmailTemplateCreate({ name: 'n', subject: '', body: '' } as any)).toThrow();
    const p = buildEmailTemplateCreate({ name: ' N ', subject: ' S ', body: 'B' });
    expect(p.name).toBe('N');
    expect(p.subject).toBe('S');
    expect(p.body).toBe('B');
    expect(typeof p.createdAt).toBe('number');
    expect(typeof p.updatedAt).toBe('number');
  });
  it('buildEmailTemplatePatch validates name/subject', () => {
    expect(() => buildEmailTemplatePatch({ name: '  ' })).toThrow();
    expect(() => buildEmailTemplatePatch({ subject: '  ' })).toThrow();
    const p = buildEmailTemplatePatch({ name: ' A ', subject: ' B ', body: 'C', archivedAt: null, deletedAt: null });
    expect(p).toEqual({ name: 'A', subject: 'B', body: 'C', archivedAt: null, deletedAt: null });
  });
});

