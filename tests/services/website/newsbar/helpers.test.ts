import { describe, it, expect } from '@jest/globals';
import { buildNewsbarUpsert, normalizeNewsbar } from '../../../../services/website/newsbar';

describe('services/website/newsbar helpers', () => {
  it('normalizeNewsbar maps fields', () => {
    const raw: any = { enabled: true, primaryHtml: '<b>Hi</b>', secondaryHtml: 'link', updatedAt: 1, updatedBy: 'u1' };
    const nb = normalizeNewsbar(raw);
    expect(nb).toEqual({ enabled: true, primaryHtml: '<b>Hi</b>', secondaryHtml: 'link', updatedAt: 1, updatedBy: 'u1' });
  });
  it('buildNewsbarUpsert trims and sets updatedAt', () => {
    const p = buildNewsbarUpsert({ enabled: false, primaryHtml: '  A  ', secondaryHtml: '  B  ', updatedBy: 'u2' });
    expect(p).toEqual({ enabled: false, primaryHtml: 'A', secondaryHtml: 'B', updatedAt: expect.any(Number), updatedBy: 'u2' });
  });
});

