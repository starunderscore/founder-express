import { describe, it, expect } from '@jest/globals';
import { buildTagCreate, buildTagPatchObject, filterByStatus, normalizeTag, tagBackLink } from '../../../services/tags/helpers';
import type { RawTagDoc, Tag } from '../../../services/tags/types';

describe('services/tags helpers', () => {
  it('normalizeTag handles missing/blank fields', () => {
    const raw: RawTagDoc = { name: '  Name  ', color: ' ', description: undefined, status: undefined } as any;
    const r = normalizeTag('id1', raw);
    expect(r).toEqual({ id: 'id1', name: '  Name  ', description: undefined, color: undefined, status: undefined, createdAt: undefined });
  });

  it('buildTagCreate validates and shapes payload', () => {
    expect(() => buildTagCreate({ name: '' })).toThrow();
    const p = buildTagCreate({ name: ' Tag ', description: '  ', color: ' #123456 ' });
    expect(p.name).toBe('Tag');
    expect(p.description).toBeUndefined();
    expect(p.color).toBe('#123456');
    expect(p.status).toBe('active');
    expect(typeof p.createdAt).toBe('number');
  });

  it('enforces max length for tag name', () => {
    const long = 'X'.repeat(41);
    expect(() => buildTagCreate({ name: long })).toThrow();
    expect(() => buildTagPatchObject({ name: long })).toThrow();
  });

  it('enforces max length for description', () => {
    const longDesc = 'Y'.repeat(281);
    expect(() => buildTagCreate({ name: 'Ok', description: longDesc, color: '#000' })).toThrow();
    expect(() => buildTagPatchObject({ description: longDesc })).toThrow();
  });

  it('enforces max length for color', () => {
    const longColor = '#12345678901234567890X'; // 21 chars
    expect(() => buildTagCreate({ name: 'C', color: longColor })).toThrow();
    expect(() => buildTagPatchObject({ color: longColor })).toThrow();
  });

  it('buildTagPatchObject validates name and maps blank fields to null', () => {
    expect(() => buildTagPatchObject({ name: '  ' })).toThrow();
    const p = buildTagPatchObject({ name: ' X ', description: '  ', color: '  ' });
    expect(p).toEqual({ name: 'X', description: null, color: null });
  });

  it('filterByStatus partitions correctly', () => {
    const rows: any[] = [
      { id: '1', status: 'active' },
      { id: '2', status: 'archived' },
      { id: '3', status: 'removed' },
      { id: '4' }, // defaults to active
    ];
    expect(filterByStatus(rows, 'active').map(r => r.id)).toEqual(['1','4']);
    expect(filterByStatus(rows, 'archived').map(r => r.id)).toEqual(['2']);
    expect(filterByStatus(rows, 'removed').map(r => r.id)).toEqual(['3']);
  });

  it('tagBackLink maps correctly', () => {
    expect(tagBackLink({ status: 'active' } as Tag)).toBe('/employee/tag-manager');
    expect(tagBackLink({ status: 'archived' } as Tag)).toBe('/employee/tag-manager/archive');
    expect(tagBackLink({ status: 'removed' } as Tag)).toBe('/employee/tag-manager/removed');
  });
});
